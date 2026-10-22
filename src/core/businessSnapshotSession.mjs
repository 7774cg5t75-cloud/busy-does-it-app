import {stableJson} from "./stableJson.mjs";
// The original authenticated snapshot REST/CAS route. No second backend,
// persistence queue, migration or automatic mutation retry.
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const stamp=stableJson;
const rowOf=rows=>Array.isArray(rows)?rows.length===1?rows[0]:null:rows;
function createBusinessSnapshotSession(){
 let pending=null,observed=null,lastOwnSave=null,writeBlockedIdentity=null,uncertainMutationIdentity=null;
 let legacyWorkspacePaused=false;
 let privateBasis=null; // Exact own target receipt; never a full local snapshot revision.
 const mutationTickets=new WeakMap(),privateReviews=new WeakMap();
 const tickets=new WeakMap();
 function prepareRestore(getCurrent){
  const source=getCurrent();
  if(!uuid.test(source?.ownerId||'')||!uuid.test(source?.businessId||'')||!source.ready)return null;
  try{const ticket={};tickets.set(ticket,{...source,payloadStamp:stamp(source.getPayload())});return ticket;}catch{return null;}
 }
 async function restore({ticket,getCurrent,ownerAccessToken,request,schemaVersion}){
  const source=ticket&&tickets.get(ticket),fail=reason=>({ok:false,reason});
  if(legacyWorkspacePaused)return {...fail('Secure workspace recovery is read-only. Current device work was kept.'),readOnly:true};
  if(!source)return fail('Review and confirm the current local copy before restoring.');
  lastOwnSave=null;
  tickets.delete(ticket); // A confirmation authorises one read/restore attempt only.
  const current=()=>{const live=getCurrent();try{return live?.identity===source.identity&&live.ownerId===source.ownerId&&live.businessId===source.businessId&&live.revision===source.revision&&live.ready&&stamp(live.getPayload())===source.payloadStamp;}catch{return false;}};
  if(!current())return fail('Your local work or workspace changed. Review it before restoring.');
  if(pending?.identity===source.identity)return fail('A save or restore is already in progress.');
  const task={identity:source.identity};pending=task;
  try{
   const token=await ownerAccessToken();
   if(!current())return fail('Your work changed before reading the cloud copy.');
   if(!token)return fail('Sign in again before restoring.');
   const rows=await request(`busy_business_snapshots?business_id=eq.${encodeURIComponent(source.businessId)}&select=business_id,payload,schema_version,revision,updated_at`,{token});
   if(!current())return fail('Your local work changed while reading. Nothing was replaced.');
   const row=rowOf(rows);
   if(row?.business_id!==source.businessId||!Number.isSafeInteger(row.revision)||row.revision<source.revision||
    !Number.isInteger(row.schema_version)||row.schema_version<1||row.schema_version>schemaVersion||
    !row.payload||typeof row.payload!=='object'||Array.isArray(row.payload)||
    [row.payload.websiteDraft?.businessId,row.payload.websiteDraft?.business_id].some(id=>id&&id!==source.businessId))
    return fail('The cloud copy could not be verified for this business and revision.');
   const payload=JSON.parse(stamp(row.payload));
   observed={identity:source.identity,revision:row.revision,stamp:stamp(payload)};
   return {ok:true,payload,revision:row.revision,updatedAt:row.updated_at||'',businessId:source.businessId};
  }catch(error){return fail(String(error?.message||'Cloud restore could not be checked.'));}
  finally{if(pending===task)pending=null;}
 }
 async function save({getCurrent,ownerAccessToken,request,schemaVersion,now=()=>new Date().toISOString()}){
  const start=getCurrent(),fail=reason=>({ok:false,reason});
  if(legacyWorkspacePaused)return {...fail('Secure workspace saving requires reviewed domain operations. Current device work was kept.'),readOnly:true};
  const current=()=>{const live=getCurrent();return live?.identity===start?.identity&&live.ownerId===start.ownerId&&live.businessId===start.businessId&&live.revision===start.revision&&live.ready===true;};
  if(!Number.isSafeInteger(schemaVersion)||schemaVersion<1)return fail('The snapshot format must be verified before saving.');
  if(!uuid.test(start?.ownerId||'')||!uuid.test(start?.businessId||'')||!Number.isSafeInteger(start.revision)||start.revision<1||!start.ready)return fail('Open the current signed-in business before saving.');
  if(pending?.identity===start.identity)return {...fail('This business save is already being checked.'),busy:true};
  if(uncertainMutationIdentity===start.identity)return {...fail('An earlier private operation is uncertain. Check the account before any further save.'),uncertain:true};
  if(writeBlockedIdentity===start.identity)return {...fail('Account saving is paused. Keep your current work; a compatible trusted writer is required.'),readOnly:true};
  let payload,payloadStamp;
  try{payload=JSON.parse(stamp(start.getPayload()));payloadStamp=stamp(payload);}catch{return fail('The local copy could not be prepared safely. Nothing was sent.');}
  if(observed?.identity===start.identity&&observed.revision===start.revision&&observed.stamp===payloadStamp)return {ok:true,unchanged:true,revision:start.revision};
  const task={identity:start.identity};pending=task;
  let sent=false,token;
  const read=async()=>{
   if(!current())return null;
   const rows=await request(`busy_business_snapshots?business_id=eq.${encodeURIComponent(start.businessId)}&select=business_id,payload,schema_version,revision,updated_at`,{token});
   if(!current())return null;
   const row=rowOf(rows);return row?.business_id===start.businessId&&Number.isSafeInteger(row.revision)&&row.revision>=1?row:null;
  };
  try{
   token=await ownerAccessToken();
   if(!current())return fail('The owner or business changed before saving.');
   if(!token)return fail('Sign in again before saving.');
   if(stamp(getCurrent().getPayload())!==payloadStamp)return {...fail('Your work changed while preparing the save. The latest copy is waiting.'),prepareAgain:true,notSent:true};
   lastOwnSave=null;
   const updatedAt=now(),revision=start.revision+1;
   sent=true;
   const result=await request(`busy_business_snapshots?business_id=eq.${encodeURIComponent(start.businessId)}&revision=eq.${start.revision}&schema_version=eq.${schemaVersion}`,{
    method:'PATCH',token,prefer:'return=representation',body:{payload,schema_version:schemaVersion,revision,updated_at:updatedAt}
   });
   if(!current())return fail('The owner or business changed while saving. No result was applied.');
   const row=rowOf(result);
   if(!row){const remote=await read();return current()?{ok:false,conflict:true,remoteRevision:remote?.revision||0,remoteUpdatedAt:remote?.updated_at||'',incompatibleSchema:!!remote&&remote.schema_version!==schemaVersion,reason:remote&&remote.schema_version!==schemaVersion?'The account snapshot format differs. Keep your local work and use a compatible client before saving.':'Another cloud revision is present. Review it before replacing local work.'}:fail('The workspace changed.');}
   if(row.business_id!==start.businessId||row.revision!==revision||row.schema_version!==schemaVersion||stamp(row.payload)!==payloadStamp)throw Error('The save receipt did not match the submitted business revision.');
   observed={identity:start.identity,revision,stamp:payloadStamp};
   lastOwnSave={identity:start.identity,ownerId:start.ownerId,businessId:start.businessId,from:start.revision,to:revision,payload};
   return {ok:true,revision,updatedAt:row.updated_at||updatedAt,localChangesRemain:stamp(getCurrent().getPayload())!==payloadStamp};
  }catch(error){
   if(!current())return fail('The workspace changed. No result was applied.');
   if(sent&&error?.status===403&&error?.payload?.code==='42501'){
    writeBlockedIdentity=start.identity;
    return {...fail('The account rejected direct snapshot writing. Current work was kept. A compatible trusted writer is required before saving.'),readOnly:true};
   }
   if(sent){
    // Read once to observe state, never replay PATCH or infer who saved it.
    try{const row=await read();if(!current())return fail('The workspace changed.');
     if(row?.revision===start.revision+1&&row.schema_version===schemaVersion&&stamp(row.payload)===payloadStamp){
      observed={identity:start.identity,revision:row.revision,stamp:payloadStamp};
      return {ok:false,uncertain:true,observedMatch:true,revision:row.revision,updatedAt:row.updated_at||'',reason:'The cloud copy matches, but the original save confirmation was lost. No write was repeated.'};
     }
    }catch{/* The single observation may also be unavailable. */}
   }
   return {...fail(String(error?.message||'Cloud save could not be confirmed.')),uncertain:sent};
  }finally{if(pending===task)pending=null;}
 }
 async function read({getCurrent,ownerAccessToken,request,schemaVersion}){
  const source=getCurrent(),fail=reason=>({ok:false,reason});
  if(legacyWorkspacePaused)return {...fail('Secure account recovery requires a narrow domain projection. Current device work was kept.'),readOnly:true};
  if(!uuid.test(source?.ownerId||'')||!uuid.test(source?.businessId||'')||!source.ready||!Number.isSafeInteger(source.revision)||source.revision<1)return fail('Open the current signed-in business before checking its account copy.');
  if(pending?.identity===source.identity)return {...fail('A business save or read is still being checked.'),busy:true};
  const current=()=>{const live=getCurrent();return live?.identity===source.identity&&live.ownerId===source.ownerId&&live.businessId===source.businessId&&live.revision===source.revision&&live.ready===true;};
  const task={identity:source.identity};pending=task;
  try{
   const token=await ownerAccessToken();if(!token||!current())return fail('The signed-in workspace changed before checking.');
   const rows=await request(`busy_business_snapshots?business_id=eq.${encodeURIComponent(source.businessId)}&select=business_id,payload,schema_version,revision,updated_at`,{token});
   if(!current())return fail('The workspace changed while checking. Nothing was restored or saved.');
   const row=rowOf(rows);
   if(row?.business_id!==source.businessId||!Number.isSafeInteger(row.revision)||row.revision<source.revision||!Number.isInteger(row.schema_version)||row.schema_version<1||row.schema_version>schemaVersion||!row.payload||typeof row.payload!=='object'||Array.isArray(row.payload))return fail('The account copy could not be verified for this business and revision.');
   return {ok:true,businessId:source.businessId,revision:row.revision,payload:JSON.parse(stamp(row.payload))};
  }catch{return fail('The account copy could not be checked. No save was retried.');}
  finally{if(pending===task)pending=null;}
 }
 // Bootstrap identification only. No payload apply, cache replacement or save.
 async function inspectWorkspace({businessId,ownerId,localRevision,isCurrent,ownerAccessToken,request}){
  legacyWorkspacePaused=true; // Explicit protocol entry; never raw-read/write fallback.
  const fail=()=>({ok:false,readOnly:true,reason:'Account identity could not be verified. Current device work was kept.'});
  if(!uuid.test(businessId||'')||!uuid.test(ownerId||'')||!isCurrent())return fail();
  try{
   const token=await ownerAccessToken();if(!token||!isCurrent())return fail();
   const value=await request('rpc/busy_workspace_status_v1',{method:'POST',token,body:{p_business_id:businessId}});
   if(!isCurrent()||!value||Object.keys(value).sort().join(',')!=='actorId,businessId,businessName,memberRole,revision,schemaVersion,snapshotStatus'||value.businessId!==businessId||value.actorId!==ownerId||typeof value.businessName!=='string'||!['owner','admin','member'].includes(value.memberRole))return fail();
   const state=value.snapshotStatus;
   if(value.memberRole==='owner'){
    if(!['missing','empty','present','incompatible'].includes(state))return fail();
    if(state==='missing'?(value.revision!==null||value.schemaVersion!==null):(!Number.isSafeInteger(value.revision)||value.revision<1||!Number.isInteger(value.schemaVersion)))return fail();
    if(state!=='missing'&&state!=='incompatible'&&value.schemaVersion!==1)return fail();
   }else if(state!=='restricted'||value.revision!==null||value.schemaVersion!==null)return fail();
   return {ok:true,readOnly:true,workspace:JSON.parse(stamp(value)),revisionDiffers:value.memberRole==='owner'&&Number.isSafeInteger(localRevision)&&Number.isSafeInteger(value.revision)&&localRevision!==value.revision,reason:(value.memberRole==='owner'&&Number.isSafeInteger(localRevision)&&Number.isSafeInteger(value.revision)&&localRevision!==value.revision?'The account revision differs from this device. Review recovery; device work is kept. ':'')+({missing:'The original account snapshot is missing. Current work is kept; automatic repair is unavailable.',empty:'Your account workspace is identified but has no supported saved domain data. Device work has not been uploaded.',present:'Your account is identified. Domain recovery is not yet available here; current device work is kept.',incompatible:'This account uses an incompatible format. Current work is kept; use a compatible client.',restricted:'Shared workspace identified. Owner-private account recovery is unavailable for this role.'})[state]};
  }catch{return fail();}
 }
 // Metadata-only observation. It never clears an uncertain mutation, changes
 // local state/revision, or acknowledges unrelated dirty fields.
 async function reconcilePrivateReply({getCurrent,ownerAccessToken,request}){
  const source=getCurrent(),fail=status=>({ok:false,status,localChangesRemain:true});
  if(!source?.ready||source.role!=='owner'||!uuid.test(source.ownerId||'')||!uuid.test(source.businessId||'')||pending?.identity===source.identity)return fail('unresolved');
  const current=()=>{const v=getCurrent();return v?.ready&&v.role==='owner'&&v.identity===source.identity&&v.ownerId===source.ownerId&&v.businessId===source.businessId&&v.revision===source.revision;};
  const task={identity:source.identity};pending=task;
  try{
   const token=await ownerAccessToken();if(!token||!current())return fail('unresolved');
   const metadata=await request('rpc/busy_owner_account_revision_v1',{method:'POST',token,body:{p_business_id:source.businessId}});
   if(!current()||!metadata||Object.keys(metadata).sort().join(',')!=='businessId,ownerId,revision,schemaVersion'||metadata.businessId!==source.businessId||metadata.ownerId!==source.ownerId||metadata.schemaVersion!==1||!Number.isSafeInteger(metadata.revision)||metadata.revision<1)return fail('unresolved');
   if(uncertainMutationIdentity===source.identity)return {...fail('unresolved'),observedRevision:metadata.revision};
   const basis=privateBasis;
   if(!basis||basis.identity!==source.identity||basis.ownerId!==source.ownerId||basis.businessId!==source.businessId||basis.localRevision!==source.revision)return {...fail('reviewRequired'),observedRevision:metadata.revision};
   if(metadata.revision!==basis.revision)return {...fail('conflict'),observedRevision:metadata.revision};
   return {ok:true,status:'ownReceiptObserved',revision:metadata.revision,localChangesRemain:true};
  }catch{return fail('unresolved');}finally{if(pending===task)pending=null;}
 }
 // Exact owner-private projection; never falls back to raw snapshot SELECT.
 async function readPrivateReply({getCurrent,ownerAccessToken,request,customerId,enquiryId}){
  const source=getCurrent();if(!source?.ready||source.role!=='owner'||!uuid.test(source.ownerId||'')||!uuid.test(source.businessId||'')||!Number.isSafeInteger(source.inputEpoch)||!Number.isSafeInteger(source.revision)||pending?.identity===source.identity)return {ok:false};
  const basis=privateBasis;let accountRevision=source.revision;
  if(basis?.identity===source.identity){
   if(basis.ownerId!==source.ownerId||basis.businessId!==source.businessId||basis.localRevision!==source.revision||basis.customerId!==customerId||basis.enquiryId!==enquiryId)return {ok:false,status:'reviewRequired'};
   const checked=await reconcilePrivateReply({getCurrent,ownerAccessToken,request});if(!checked.ok)return checked;accountRevision=checked.revision;
  }
  const captured=stamp(source.getPayload()),current=()=>{try{const v=getCurrent();return v?.ready&&v.identity===source.identity&&v.ownerId===source.ownerId&&v.businessId===source.businessId&&v.role==='owner'&&v.revision===source.revision&&v.inputEpoch===source.inputEpoch&&stamp(v.getPayload())===captured;}catch{return false;}};
  const task={identity:source.identity};pending=task;
  try{
   const token=await ownerAccessToken();if(!token||!current())return {ok:false};
   const review=await request('rpc/busy_owner_reply_review_v1',{method:'POST',token,body:{p_business_id:source.businessId,p_customer_id:customerId,p_enquiry_id:enquiryId,p_expected_revision:accountRevision}});
   if(!current()||review?.businessId!==source.businessId||review.ownerId!==source.ownerId||review.customerId!==customerId||review.enquiryId!==enquiryId||review.revision!==accountRevision||review.schemaVersion!==1||typeof review.reply?.text!=='string'||typeof review.enquiry?.rawText!=='string'||!/^([a-f0-9]{64})$/.test(review.recordHash||'')||!/^([a-f0-9]{64})$/.test(review.sourceHash||''))return {ok:false};
   const only=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>keys.includes(key));
   if(!only(review,['businessId','ownerId','customerId','enquiryId','revision','schemaVersion','recordHash','sourceHash','eligible','reply','customer','enquiry'])||!only(review.reply,['text'])||!only(review.customer,['id','name'])||!only(review.enquiry,['id','rawText'])||review.customer.id!==customerId||review.enquiry.id!==enquiryId)return {ok:false};
   if(basis?.identity===source.identity&&(review.recordHash!==basis.recordHash||review.sourceHash!==basis.sourceHash||review.reply.text!==basis.text))return {ok:false,status:'reviewRequired'};
   const copy=JSON.parse(stamp(review));privateReviews.set(copy,{...source,accountRevision,payloadStamp:captured,reviewStamp:stamp(copy)});return {ok:true,review:copy};
  }catch{return {ok:false};}finally{if(pending===task)pending=null;}
 }
 function preparePrivateReplyEdit({getCurrent,review,newText}){
  const source=review&&privateReviews.get(review),live=getCurrent();
  if(!source||privateBasis?.identity===source.identity&&privateBasis.revision!==source.accountRevision||review.eligible!==true||typeof newText!=='string'||!newText.trim()||pending?.identity===source.identity||uncertainMutationIdentity===source.identity)return null;
  try{if(stamp(review)!==source.reviewStamp||live?.identity!==source.identity||live.role!=='owner'||live.ownerId!==source.ownerId||live.businessId!==source.businessId||live.revision!==source.revision||live.inputEpoch!==source.inputEpoch||!live.ready||stamp(live.getPayload())!==source.payloadStamp)return null;
   privateReviews.delete(review);const ticket={};mutationTickets.set(ticket,{...source,protocol:'owner_reply_v2',operation:'private_reply_edit_text',targetId:review.customerId,enquiryId:review.enquiryId,recordHash:review.recordHash,sourceHash:review.sourceHash,expectedRecord:{text:review.reply.text},newText});return ticket;
  }catch{return null;}
 }
 // Source-level cutover adapter. Never inferred from omitted fields or enabled by a
 // client capability flag. A specialist must deliberately prepare ONE exact operation.
 function preparePrivateMutation({getCurrent,operation,targetId,expectedRecord,newText=null,expectedSource=null}){
  const source=getCurrent();
  if(!source?.ready||!Number.isSafeInteger(source.inputEpoch)||source.inputEpoch<0||!uuid.test(source.ownerId||'')||!uuid.test(source.businessId||'')||!Number.isSafeInteger(source.revision)||source.revision<1||!['owner','admin'].includes(source.role)||pending?.identity===source.identity||uncertainMutationIdentity===source.identity)return null;
  if(!['private_reply_edit_text','private_reply_remove','newsletter_remove'].includes(operation)||typeof targetId!=='string'||!targetId||targetId.length>240||!expectedRecord||typeof expectedRecord!=='object'||Array.isArray(expectedRecord))return null;
  if(operation==='private_reply_edit_text'?(typeof newText!=='string'||!newText.trim()||!Array.isArray(expectedSource)):(newText!==null||expectedSource!==null))return null;
  try{const ticket={};mutationTickets.set(ticket,{...source,payloadStamp:stamp(source.getPayload()),operation,targetId,expectedRecord:JSON.parse(stamp(expectedRecord)),newText,expectedSource:expectedSource===null?null:JSON.parse(stamp(expectedSource))});return ticket;}catch{return null;}
 }
 async function mutatePrivate({ticket,getCurrent,ownerAccessToken,request}){
  const source=ticket&&mutationTickets.get(ticket),fail=reason=>({ok:false,reason});
  if(!source)return fail('Review this exact private operation before using it.');
  mutationTickets.delete(ticket);
  const current=()=>{try{const live=getCurrent();return live?.ready&&live.identity===source.identity&&live.ownerId===source.ownerId&&live.businessId===source.businessId&&live.revision===source.revision&&live.role===source.role&&live.inputEpoch===source.inputEpoch&&stamp(live.getPayload())===source.payloadStamp;}catch{return false;}};
  if(!current()||source.protocol==='owner_reply_v2'&&privateBasis?.identity===source.identity&&privateBasis.revision!==source.accountRevision||pending?.identity===source.identity||uncertainMutationIdentity===source.identity)return fail('The workspace, current words or save state changed. Nothing was sent.');
  const task={identity:source.identity};pending=task;let sent=false;
  try{
   const token=await ownerAccessToken();if(!token||!current())return fail('The signed-in workspace or current words changed. Nothing was sent.');
   sent=true;lastOwnSave=null;observed=null;writeBlockedIdentity=source.identity;
   const privateV2=source.protocol==='owner_reply_v2',expectedRevision=privateV2?source.accountRevision:source.revision;
   const receipt=await request(privateV2?'rpc/busy_owner_reply_text_v2':'rpc/busy_snapshot_private_mutation_v1',{method:'POST',token,body:privateV2?{p_business_id:source.businessId,p_customer_id:source.targetId,p_enquiry_id:source.enquiryId,p_expected_revision:expectedRevision,p_record_hash:source.recordHash,p_source_hash:source.sourceHash,p_new_text:source.newText}:{p_business_id:source.businessId,p_expected_revision:source.revision,p_expected_schema:1,p_operation:source.operation,p_target_id:source.targetId,p_expected_record:source.expectedRecord,p_new_text:source.newText,p_expected_source:source.expectedSource}});
   if(privateV2&&(receipt?.enquiryId!==source.enquiryId||!/^([a-f0-9]{64})$/.test(receipt.recordHash||'')))throw Error('The private source receipt did not match.');
   const expectedTarget=source.operation==='private_reply_edit_text'?{...source.expectedRecord,text:source.newText}:null;
   if(!receipt||receipt.businessId!==source.businessId||receipt.actorId!==source.ownerId||receipt.operation!==source.operation||receipt.targetId!==source.targetId||receipt.previousRevision!==expectedRevision||receipt.revision!==expectedRevision+1||receipt.schemaVersion!==1||stamp(receipt.target)!==stamp(expectedTarget))throw Error('The private mutation receipt did not match.');
   if(!current()){uncertainMutationIdentity=source.identity;return {...fail('The operation returned after the editor changed. Check the account; nothing was restored.'),uncertain:true};}
   if(privateV2)privateBasis={identity:source.identity,ownerId:source.ownerId,businessId:source.businessId,localRevision:source.revision,revision:receipt.revision,customerId:source.targetId,enquiryId:source.enquiryId,recordHash:receipt.recordHash,sourceHash:source.sourceHash,text:source.newText};
   // This is a target receipt, never a full-snapshot save or permission to restore.
   return {ok:true,receipt:JSON.parse(stamp(receipt)),localChangesRemain:true};
  }catch(error){
   if(sent&&![400,401,403,404,409].includes(error?.status))uncertainMutationIdentity=source.identity;
   return {...fail('Private account operation was not confirmed. Keep current work and check the account; no write was repeated.'),uncertain:uncertainMutationIdentity===source.identity};
  }finally{if(pending===task)pending=null;}
 }
 // Local editor continuity only, minted solely from an exact original PATCH receipt.
 // A matching observation after a lost response is deliberately insufficient.
 const canContinueRevision=({getCurrent,fromRevision,toRevision})=>{
  const current=getCurrent(),receipt=lastOwnSave;
  return !!receipt&&current?.ready===true&&current.identity===receipt.identity&&current.ownerId===receipt.ownerId&&current.businessId===receipt.businessId&&current.revision===receipt.to&&fromRevision===receipt.from&&toRevision===receipt.to;
 };
 // Read a defensive copy of the last exact PATCH representation, never a
 // matching GET after a timeout. This is evidence, not a new write or restore.
 const readOwnSave=({getCurrent,customerId,inboxId})=>{
  const receipt=lastOwnSave;
  if(typeof customerId!=='string'||typeof inboxId!=='string'||!receipt||!canContinueRevision({getCurrent,fromRevision:receipt.from,toRevision:receipt.to})||observed?.identity!==receipt.identity||observed.revision!==receipt.to)return {ok:false};
  try{return {ok:true,businessId:receipt.businessId,revision:receipt.to,payload:JSON.parse(stamp({customers:receipt.payload.customers?.filter(row=>row?.id===customerId)||[],inboxItems:receipt.payload.inboxItems?.filter(row=>row?.id===inboxId)||[]}))};}catch{return {ok:false};}
 };
 return {inspectWorkspace,reconcilePrivateReply,readPrivateReply,preparePrivateReplyEdit,preparePrivateMutation,mutatePrivate,readOwnSave,canContinueRevision,read,save,prepareRestore,restore,isBusy:identity=>pending?.identity===identity};
}
export {createBusinessSnapshotSession};
