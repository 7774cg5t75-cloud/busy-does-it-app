import {stableJson} from "./stableJson.mjs";
// The original authenticated snapshot REST/CAS route. No second backend,
// persistence queue, migration or automatic mutation retry.
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const stamp=stableJson;
const rowOf=rows=>Array.isArray(rows)?rows.length===1?rows[0]:null:rows;
// Fixed owner-private response policy shared by editor save and account recovery.
function validPrivateReplyProjection(value,{businessId,ownerId,customerId,enquiryId,revision}){
 const only=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
 return !!(only(value,['businessId','ownerId','customerId','enquiryId','revision','schemaVersion','recordHash','sourceHash','eligible','reply','customer','enquiry'])&&value.businessId===businessId&&value.ownerId===ownerId&&value.customerId===customerId&&value.enquiryId===enquiryId&&value.revision===revision&&value.schemaVersion===1&&typeof value.eligible==='boolean'&&only(value.reply,['text'])&&typeof value.reply.text==='string'&&only(value.customer,['id','name'])&&value.customer.id===customerId&&typeof value.customer.name==='string'&&only(value.enquiry,['id','rawText'])&&value.enquiry.id===enquiryId&&typeof value.enquiry.rawText==='string'&&/^([a-f0-9]{64})$/.test(value.recordHash||'')&&/^([a-f0-9]{64})$/.test(value.sourceHash||''));
}
// Fixed initial Enquiry projections share validation across original review and
// interrupted readback. This validates evidence only; ticket ownership stays here.
function validInitialEnquiryProjection(packet,{businessId,ownerId,revision,customerId=null,enquiryId}){
 const only=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
 if(packet?.businessId!==businessId||packet.ownerId!==ownerId||packet.revision!==revision||packet.schemaVersion!==1||!/^([a-f0-9]{64})$/.test(packet.sourceHash||''))return false;
 if(!customerId)return only(packet,['businessId','ownerId','revision','schemaVersion','sourceHash','pending'])&&only(packet.pending,['id','rawText','source'])&&packet.pending.id===enquiryId&&['id','rawText','source'].every(k=>typeof packet.pending[k]==='string');
 return only(packet,['businessId','ownerId','revision','schemaVersion','sourceHash','customerHash','customer','enquiry'])&&/^([a-f0-9]{64})$/.test(packet.customerHash||'')&&only(packet.customer,['id','name','service','phone','email','address','contactOk'])&&packet.customer.id===customerId&&Object.entries(packet.customer).every(([k,v])=>k==='contactOk'?typeof v==='boolean':typeof v==='string')&&only(packet.enquiry,['id','status','filedCustomerId','filedStage','reviewedAt','queuedAt','rawText'])&&Object.values(packet.enquiry).every(v=>typeof v==='string')&&packet.enquiry.id===enquiryId&&packet.enquiry.status==='Filed'&&packet.enquiry.filedStage==='Enquiry'&&packet.enquiry.filedCustomerId===customerId;
}
function createBusinessSnapshotSession(){
 let pending=null,observed=null,lastOwnSave=null,writeBlockedIdentity=null,uncertainMutationIdentity=null;
 let legacyWorkspacePaused=false;
 let privateBasis=null; // Exact own target receipt; never a full local snapshot revision.
 const enquiryReviews=new WeakMap();
 const mutationTickets=new WeakMap(),privateReviews=new WeakMap(),discoveredReplies=new WeakMap(),recoveryReviews=new WeakMap();
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
 // Discovery/recovery is read evidence only. Never mint an own-save receipt,
 // restore local records, or trust a caller-created list entry as authority.
 // Read-only interrupted-work discovery. Tickets are recognition evidence only;
 // they cannot be consumed by any mutation preparer or clear an uncertain write.
 const interruptedEntries=new WeakMap();
 async function discoverInterruptedEnquiries({businessId,ownerId,isCurrent,ownerAccessToken,request,after=null}){
  if(!uuid.test(businessId||'')||!uuid.test(ownerId||'')||!isCurrent())return {ok:false};
  try{
   const token=await ownerAccessToken();if(!token||!isCurrent())return {ok:false};
   const list=await request('rpc/busy_owner_enquiry_discover_v1',{method:'POST',token,body:{p_business_id:businessId,p_after_enquiry_id:after}});
   if(!isCurrent()||!list||Object.keys(list).sort().join(',')!=='businessId,hasMore,items,nextAfter,ownerId,revision,schemaVersion'||list.businessId!==businessId||list.ownerId!==ownerId||list.schemaVersion!==1||!Number.isSafeInteger(list.revision)||list.revision<1||!Array.isArray(list.items)||list.items.length>25||typeof list.hasMore!=='boolean'||(list.hasMore?list.nextAfter!==list.items.at(-1)?.enquiryId:list.nextAfter!==null))return {ok:false};
   let previous=after||'';
   for(const e of list.items){if(!e||Object.keys(e).sort().join(',')!=='customerId,customerName,enquiryId,state'||typeof e.enquiryId!=='string'||!/^[A-Za-z0-9_-]{1,240}$/.test(e.enquiryId)||e.enquiryId<=previous||typeof e.customerName!=='string'||e.customerName.length>240||!['Pending','FiledWithoutReply','FiledWithReply'].includes(e.state)||(e.state==='Pending'?e.customerId!==null:typeof e.customerId!=='string'||e.customerId.length<1||e.customerId.length>240))return {ok:false};previous=e.enquiryId;}
   const copy=JSON.parse(stamp(list));for(const e of copy.items)interruptedEntries.set(e,{businessId,ownerId,revision:list.revision,cursor:after,entryStamp:stamp(e)});return {ok:true,list:copy};
  }catch{return {ok:false};}
 }
 async function inspectInterruptedEnquiry({entry,isCurrent,ownerAccessToken,request}){
  const source=interruptedEntries.get(entry);if(!source||stamp(entry)!==source.entryStamp||!isCurrent())return {ok:false};
  try{
   const token=await ownerAccessToken();if(!token||!isCurrent())return {ok:false};
   // Refresh discovery at the SAME revision before selecting a narrow projection.
   // A new revision or changed classification requires a new owner selection.
   // Recheck only the original bounded page. No whole-account scan or
   // unrelated-record expansion just to inspect one selected enquiry.
   const page=await discoverInterruptedEnquiries({...source,isCurrent,ownerAccessToken:async()=>token,request,after:source.cursor});
   if(!isCurrent()||!page.ok||page.list.revision!==source.revision||!page.list.items.some(e=>stamp(e)===source.entryStamp))return {ok:false};
   const body={p_business_id:source.businessId,p_expected_revision:source.revision,p_enquiry_id:entry.enquiryId,...entry.customerId?{p_customer_id:entry.customerId}:{}};
   const packet=await request(entry.state==='Pending'?'rpc/busy_owner_pending_review_v1':entry.state==='FiledWithoutReply'?'rpc/busy_owner_first_reply_review_v1':'rpc/busy_owner_reply_review_v1',{method:'POST',token,body});
   if(!isCurrent()||packet?.businessId!==source.businessId||packet.ownerId!==source.ownerId||packet.revision!==source.revision||packet.schemaVersion!==1)return {ok:false};
   if(entry.state==='FiledWithReply'){
    if(!validPrivateReplyProjection(packet,{...source,customerId:entry.customerId,enquiryId:entry.enquiryId})||!packet.eligible)return {ok:false};
   }else if(!validInitialEnquiryProjection(packet,{...source,customerId:entry.customerId,enquiryId:entry.enquiryId}))return {ok:false};
   return {ok:true,observation:JSON.parse(stamp(packet)),state:entry.state,receipt:null};
  }catch{return {ok:false};}
 }
 async function discoverPrivateReplies({businessId,ownerId,isCurrent,ownerAccessToken,request,after=null}){
  if(!uuid.test(businessId||'')||!uuid.test(ownerId||'')||!isCurrent())return {ok:false};
  try{
   const token=await ownerAccessToken();if(!token||!isCurrent())return {ok:false};
   const list=await request('rpc/busy_owner_reply_discover_v1',{method:'POST',token,body:{p_business_id:businessId,p_after_customer_id:after}});
   if(!isCurrent()||!list||Object.keys(list).sort().join(',')!=='businessId,hasMore,items,nextAfter,ownerId,revision,schemaVersion'||list.businessId!==businessId||list.ownerId!==ownerId||list.schemaVersion!==1||!Number.isSafeInteger(list.revision)||list.revision<1||!Array.isArray(list.items)||list.items.length>25||typeof list.hasMore!=='boolean'||(list.hasMore?list.nextAfter!==list.items.at(-1)?.customerId:list.nextAfter!==null))return {ok:false};
   const ids=new Set();for(const entry of list.items){if(!entry||Object.keys(entry).sort().join(',')!=='customerId,customerName,enquiryId'||![entry.customerId,entry.enquiryId].every(id=>typeof id==='string'&&id.length>0&&id.length<=240)||typeof entry.customerName!=='string'||entry.customerName.length>240||ids.has(entry.customerId))return {ok:false};ids.add(entry.customerId);}
   const copy=JSON.parse(stamp(list));for(const entry of copy.items)discoveredReplies.set(entry,{businessId,ownerId,revision:list.revision,entryStamp:stamp(entry)});return {ok:true,list:copy};
  }catch{return {ok:false};}
 }
 async function inspectDiscoveredReply({entry,review,isCurrent,ownerAccessToken,request}){
  const source=review?recoveryReviews.get(review):discoveredReplies.get(entry);
  if(!source||!isCurrent()||entry&&stamp(entry)!==source.entryStamp||review&&stamp(review)!==source.reviewStamp)return {ok:false};
  if(review)recoveryReviews.delete(review); // One use, including denied/interrupted reads.
  const customerId=review?.customerId||entry.customerId,enquiryId=review?.enquiryId||entry.enquiryId;
  try{
   const token=await ownerAccessToken();if(!token||!isCurrent())return {ok:false};
   const value=await request('rpc/busy_owner_reply_review_v1',{method:'POST',token,body:{p_business_id:source.businessId,p_customer_id:customerId,p_enquiry_id:enquiryId,p_expected_revision:source.revision}});
   if(!isCurrent()||!validPrivateReplyProjection(value,{...source,customerId,enquiryId})||value.eligible!==true||review&&(value.recordHash!==review.recordHash||value.sourceHash!==review.sourceHash||value.reply.text!==review.reply.text||value.enquiry.rawText!==review.enquiry.rawText))return {ok:false};
   if(review)recoveryReviews.delete(review); // One-use opening authority after recheck.
   const copy=JSON.parse(stamp(value));if(!review)recoveryReviews.set(copy,{...source,reviewStamp:stamp(copy)});return {ok:true,review:copy};
  }catch{return {ok:false};}
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
   if(uncertainMutationIdentity===source.identity){
    // Read-only observation cannot recover a lost own-operation receipt.
    const recovered=source.recoveredReply;
    if(recovered){
     const value=await request('rpc/busy_owner_reply_review_v1',{method:'POST',token,body:{p_business_id:source.businessId,p_customer_id:recovered.customerId,p_enquiry_id:recovered.enquiryId,p_expected_revision:metadata.revision}});
     if(current()&&validPrivateReplyProjection(value,{businessId:source.businessId,ownerId:source.ownerId,customerId:recovered.customerId,enquiryId:recovered.enquiryId,revision:metadata.revision})&&value.eligible&&value.sourceHash===recovered.sourceHash)return {...fail('observedUncertain'),observedRevision:metadata.revision,observedText:value.reply.text};
    }
    return {...fail('unresolved'),observedRevision:metadata.revision};
   }
   const basis=privateBasis;
   if(!basis||basis.identity!==source.identity||basis.ownerId!==source.ownerId||basis.businessId!==source.businessId||basis.localRevision!==source.revision)return {...fail('reviewRequired'),observedRevision:metadata.revision};
   if(metadata.revision!==basis.revision)return {...fail('conflict'),observedRevision:metadata.revision};
   return {ok:true,status:'ownReceiptObserved',revision:metadata.revision,localChangesRemain:true};
  }catch{return fail('unresolved');}finally{if(pending===task)pending=null;}
 }
 // Exact owner-private projection; never falls back to raw snapshot SELECT.
 async function readPrivateReply({getCurrent,ownerAccessToken,request,customerId,enquiryId}){
  const source=getCurrent();if(!source?.ready||source.role!=='owner'||!uuid.test(source.ownerId||'')||!uuid.test(source.businessId||'')||!Number.isSafeInteger(source.inputEpoch)||!Number.isSafeInteger(source.revision)||pending?.identity===source.identity)return {ok:false};
  const basis=privateBasis?.identity===source.identity&&privateBasis.customerId===customerId&&privateBasis.enquiryId===enquiryId?privateBasis:null;let accountRevision=source.revision;
  const captured=stamp(source.getPayload());
  if(basis?.identity===source.identity){
   if(basis.ownerId!==source.ownerId||basis.businessId!==source.businessId||basis.localRevision!==source.revision||basis.customerId!==customerId||basis.enquiryId!==enquiryId)return {ok:false,status:'reviewRequired'};
   const checked=await reconcilePrivateReply({getCurrent,ownerAccessToken,request});if(!checked.ok)return checked;accountRevision=checked.revision;
  }
  // An account-only editor has no local snapshot revision authority. Observe
  // metadata afresh, then check the exact opened source/record before review.
  if(source.recoveredReply&&!basis){
   const token=await ownerAccessToken();if(!token)return {ok:false};
   const metadata=await request('rpc/busy_owner_account_revision_v1',{method:'POST',token,body:{p_business_id:source.businessId}});
   if(!metadata||Object.keys(metadata).sort().join(',')!=='businessId,ownerId,revision,schemaVersion'||metadata.businessId!==source.businessId||metadata.ownerId!==source.ownerId||metadata.schemaVersion!==1||!Number.isSafeInteger(metadata.revision)||metadata.revision<source.recoveredReply.revision)return {ok:false,status:'reviewRequired'};
   accountRevision=metadata.revision;
  }
  const current=()=>{try{const v=getCurrent();return v?.ready&&v.identity===source.identity&&v.ownerId===source.ownerId&&v.businessId===source.businessId&&v.role==='owner'&&v.revision===source.revision&&v.inputEpoch===source.inputEpoch&&stamp(v.getPayload())===captured;}catch{return false;}};
  const task={identity:source.identity};pending=task;
  try{
   const token=await ownerAccessToken();if(!token||!current())return {ok:false};
   const review=await request('rpc/busy_owner_reply_review_v1',{method:'POST',token,body:{p_business_id:source.businessId,p_customer_id:customerId,p_enquiry_id:enquiryId,p_expected_revision:accountRevision}});
   if(!current()||!validPrivateReplyProjection(review,{businessId:source.businessId,ownerId:source.ownerId,customerId,enquiryId,revision:accountRevision}))return {ok:false};
   if(basis?.identity===source.identity&&(review.recordHash!==basis.recordHash||review.sourceHash!==basis.sourceHash||review.reply.text!==basis.text))return {ok:false,status:'reviewRequired'};
   if(source.recoveredReply&&!basis&&(review.recordHash!==source.recoveredReply.recordHash||review.sourceHash!==source.recoveredReply.sourceHash||review.enquiry.rawText!==source.recoveredReply.enquiry.rawText||review.reply.text!==source.recoveredReply.reply.text))return {ok:false,status:'reviewRequired'};
   const copy=JSON.parse(stamp(review));privateReviews.set(copy,{...source,accountRevision,payloadStamp:captured,reviewStamp:stamp(copy)});return {ok:true,review:copy};
  }catch{return {ok:false};}finally{if(pending===task)pending=null;}
 }
 function preparePrivateReplyEdit({getCurrent,review,newText}){
  const source=review&&privateReviews.get(review),live=getCurrent();
  if(!source||privateBasis?.identity===source.identity&&privateBasis.customerId===(review?.customerId||source.targetId)&&privateBasis.revision!==source.accountRevision||review.eligible!==true||typeof newText!=='string'||!newText.trim()||pending?.identity===source.identity||uncertainMutationIdentity===source.identity)return null;
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
  if(!current()||source.protocol==='owner_reply_v2'&&privateBasis?.identity===source.identity&&privateBasis.customerId===source.targetId&&privateBasis.revision!==source.accountRevision||pending?.identity===source.identity||uncertainMutationIdentity===source.identity)return fail('The workspace, current words or save state changed. Nothing was sent.');
  const task={identity:source.identity};pending=task;let sent=false;
  try{
   const token=await ownerAccessToken();if(!token||!current())return fail('The signed-in workspace or current words changed. Nothing was sent.');
   sent=true;lastOwnSave=null;observed=null;writeBlockedIdentity=source.identity;
   const creating=source.protocol==='owner_reply_create',privateV2=source.protocol==='owner_reply_v2'||creating,expectedRevision=privateV2?source.accountRevision:source.revision;
   const receipt=await request(creating?'rpc/busy_owner_reply_create_v1':privateV2?'rpc/busy_owner_reply_text_v2':'rpc/busy_snapshot_private_mutation_v1',{method:'POST',token,body:creating?{p_business_id:source.businessId,p_expected_revision:expectedRevision,p_customer_id:source.targetId,p_enquiry_id:source.enquiryId,p_customer_hash:source.customerHash,p_source_hash:source.sourceHash,p_text:source.newText}:privateV2?{p_business_id:source.businessId,p_customer_id:source.targetId,p_enquiry_id:source.enquiryId,p_expected_revision:expectedRevision,p_record_hash:source.recordHash,p_source_hash:source.sourceHash,p_new_text:source.newText}:{p_business_id:source.businessId,p_expected_revision:source.revision,p_expected_schema:1,p_operation:source.operation,p_target_id:source.targetId,p_expected_record:source.expectedRecord,p_new_text:source.newText,p_expected_source:source.expectedSource}});
   if(creating&&!/^([a-f0-9]{64})$/.test(receipt?.sourceHash||''))throw Error('Invalid created source receipt');
   if(privateV2&&(receipt?.enquiryId!==source.enquiryId||!/^([a-f0-9]{64})$/.test(receipt.recordHash||'')))throw Error('The private source receipt did not match.');
   const expectedTarget=['private_reply_edit_text','private_reply_create'].includes(source.operation)?{...source.expectedRecord,text:source.newText}:null;
   if(!receipt||receipt.businessId!==source.businessId||receipt.actorId!==source.ownerId||receipt.operation!==source.operation||receipt.targetId!==source.targetId||receipt.previousRevision!==expectedRevision||receipt.revision!==expectedRevision+1||receipt.schemaVersion!==1||stamp(receipt.target)!==stamp(expectedTarget))throw Error('The private mutation receipt did not match.');
   if(!current()){uncertainMutationIdentity=source.identity;return {...fail('The operation returned after the editor changed. Check the account; nothing was restored.'),uncertain:true};}
   if(privateV2)privateBasis={identity:source.identity,ownerId:source.ownerId,businessId:source.businessId,localRevision:source.revision,revision:receipt.revision,customerId:source.targetId,enquiryId:source.enquiryId,recordHash:receipt.recordHash,sourceHash:creating?receipt.sourceHash:source.sourceHash,text:source.newText};
   // This is a target receipt, never a full-snapshot save or permission to restore.
   return {ok:true,receipt:JSON.parse(stamp(receipt)),localChangesRemain:true};
  }catch(error){
   if(sent&&![400,401,403,404,409].includes(error?.status))uncertainMutationIdentity=source.identity;
   return {...fail('Private account operation was not confirmed. Keep current work and check the account; no write was repeated.'),uncertain:uncertainMutationIdentity===source.identity};
  }finally{if(pending===task)pending=null;}
 }

 // Initial intake stays finite: metadata -> narrow source review -> one-use
 // registration/filing. These tickets never confirm unrelated device work.
 const exactContext=(source,getCurrent,captured)=>{try{const v=getCurrent();return v?.ready&&v.role==='owner'&&v.identity===source.identity&&v.businessId===source.businessId&&v.ownerId===source.ownerId&&v.revision===source.revision&&v.inputEpoch===source.inputEpoch&&stamp(v.getPayload())===captured;}catch{return false;}};
 async function reviewEnquiry({getCurrent,enquiryId=null,ownerAccessToken,request,customerId=null}){
  const source=getCurrent();if(!source?.ready||source.role!=='owner'||!uuid.test(source.businessId||'')||!uuid.test(source.ownerId||'')||!Number.isSafeInteger(source.inputEpoch)||pending?.identity===source.identity||uncertainMutationIdentity===source.identity)return {ok:false};
  const captured=stamp(source.getPayload()),current=()=>exactContext(source,getCurrent,captured),task={identity:source.identity};pending=task;
  try{
   const token=await ownerAccessToken();if(!token||!current())return {ok:false};
   const m=await request('rpc/busy_owner_account_revision_v1',{method:'POST',token,body:{p_business_id:source.businessId}});
   if(!current()||!m||Object.keys(m).sort().join(',')!=='businessId,ownerId,revision,schemaVersion'||m.businessId!==source.businessId||m.ownerId!==source.ownerId||m.schemaVersion!==1||!Number.isSafeInteger(m.revision)||m.revision<1)return {ok:false};
   let packet=m;
   if(enquiryId){
    packet=await request(customerId?'rpc/busy_owner_first_reply_review_v1':'rpc/busy_owner_pending_review_v1',{method:'POST',token,body:{p_business_id:source.businessId,p_expected_revision:m.revision,p_enquiry_id:enquiryId,...customerId?{p_customer_id:customerId}:{}}});
    if(!current()||!validInitialEnquiryProjection(packet,{...source,revision:m.revision,customerId,enquiryId}))return {ok:false};
   }
   const review=JSON.parse(stamp(packet));enquiryReviews.set(review,{...source,accountRevision:m.revision,payloadStamp:captured,reviewStamp:stamp(review),customerId,enquiryId});return {ok:true,review};
  }catch{return {ok:false};}finally{if(pending===task)pending=null;}
 }
 function prepareEnquiryOperation({getCurrent,review,capture,manual=null,newText=null}){
  const source=enquiryReviews.get(review);if(!source||stamp(review)!==source.reviewStamp||!exactContext(source,getCurrent,source.payloadStamp)||pending?.identity===source.identity||uncertainMutationIdentity===source.identity)return null;
  const ticket={};
  if(source.customerId){
   if(typeof newText!=='string'||!newText.trim())return null;
   mutationTickets.set(ticket,{...source,protocol:'owner_reply_create',operation:'private_reply_create',targetId:source.customerId,enquiryId:source.enquiryId,customerHash:review.customerHash,sourceHash:review.sourceHash,expectedRecord:{},newText});
  }else{
   if(source.enquiryId?(!capture||capture.enquiryId!==source.enquiryId||capture.sourceHash!==review.sourceHash):(!manual||typeof manual.enquiryId!=='string'||typeof manual.rawText!=='string'))return null;
   const body=source.enquiryId?{p_business_id:source.businessId,p_expected_revision:source.accountRevision,p_capture:JSON.parse(stamp(capture))}:{p_business_id:source.businessId,p_expected_revision:source.accountRevision,p_enquiry_id:manual.enquiryId,p_raw_text:manual.rawText};
   enquiryReviews.set(ticket,{...source,body,path:source.enquiryId?'rpc/busy_owner_first_enquiry_v1':'rpc/busy_owner_manual_source_v1',operation:source.enquiryId?'first_enquiry_filing':'manual_source_registration'});
  }
  enquiryReviews.delete(review);return ticket;
 }
 async function commitEnquiry({getCurrent,ticket,ownerAccessToken,request}){
  const source=enquiryReviews.get(ticket);enquiryReviews.delete(ticket);if(!source?.body||!exactContext(source,getCurrent,source.payloadStamp)||pending?.identity===source.identity||uncertainMutationIdentity===source.identity)return {ok:false};
  const task={identity:source.identity};pending=task;let sent=false;
  try{
   const token=await ownerAccessToken();if(!token||!exactContext(source,getCurrent,source.payloadStamp))return {ok:false};
   sent=true;const receipt=await request(source.path,{method:'POST',token,body:source.body});
   const capture=source.body.p_capture,fields=capture?['businessId','actorId','operation','customerId','enquiryId','sourceRecordId','intakeId','activityId','previousRevision','revision','schemaVersion','filedStage']:['businessId','actorId','operation','enquiryId','previousRevision','revision','schemaVersion'];
   if(!receipt||Object.keys(receipt).sort().join(',')!==fields.sort().join(',')||receipt.businessId!==source.businessId||receipt.actorId!==source.ownerId||receipt.operation!==source.operation||receipt.previousRevision!==source.accountRevision||receipt.revision!==source.accountRevision+1||receipt.schemaVersion!==1||receipt.enquiryId!==(capture?.enquiryId||source.body.p_enquiry_id)||capture&&(['customerId','sourceRecordId','intakeId','activityId'].some(k=>receipt[k]!==capture[k])||receipt.filedStage!=='Enquiry'))throw Error('Receipt mismatch');
   if(!exactContext(source,getCurrent,source.payloadStamp))throw Error('Current capture changed');
   lastOwnSave=null;observed=null;writeBlockedIdentity=source.identity;return {ok:true,receipt:JSON.parse(stamp(receipt)),localChangesRemain:true};
  }catch(error){if(sent&&![400,401,403,404,409].includes(error?.status))uncertainMutationIdentity=source.identity;return {ok:false,uncertain:uncertainMutationIdentity===source.identity};}
  finally{if(pending===task)pending=null;}
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
 return {hasUncertainMutation:identity=>uncertainMutationIdentity===identity,discoverInterruptedEnquiries,inspectInterruptedEnquiry,reviewEnquiry,prepareEnquiryOperation,commitEnquiry,discoverPrivateReplies,inspectDiscoveredReply,inspectWorkspace,reconcilePrivateReply,readPrivateReply,preparePrivateReplyEdit,preparePrivateMutation,mutatePrivate,readOwnSave,canContinueRevision,read,save,prepareRestore,restore,isBusy:identity=>pending?.identity===identity};
}
export {createBusinessSnapshotSession};
