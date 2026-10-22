import {stableJson} from "./stableJson.mjs";
// The original authenticated snapshot REST/CAS route. No second backend,
// persistence queue, migration or automatic mutation retry.
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const stamp=stableJson;
const rowOf=rows=>Array.isArray(rows)?rows.length===1?rows[0]:null:rows;
function createBusinessSnapshotSession(){
 let pending=null,observed=null,lastOwnSave=null;
 const tickets=new WeakMap();
 function prepareRestore(getCurrent){
  const source=getCurrent();
  if(!uuid.test(source?.ownerId||'')||!uuid.test(source?.businessId||'')||!source.ready)return null;
  try{const ticket={};tickets.set(ticket,{...source,payloadStamp:stamp(source.getPayload())});return ticket;}catch{return null;}
 }
 async function restore({ticket,getCurrent,ownerAccessToken,request,schemaVersion}){
  const source=ticket&&tickets.get(ticket),fail=reason=>({ok:false,reason});
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
  const current=()=>{const live=getCurrent();return live?.identity===start?.identity&&live.ownerId===start.ownerId&&live.businessId===start.businessId&&live.revision===start.revision&&live.ready===true;};
  if(!Number.isSafeInteger(schemaVersion)||schemaVersion<1)return fail('The snapshot format must be verified before saving.');
  if(!uuid.test(start?.ownerId||'')||!uuid.test(start?.businessId||'')||!Number.isSafeInteger(start.revision)||start.revision<1||!start.ready)return fail('Open the current signed-in business before saving.');
  if(pending?.identity===start.identity)return {...fail('This business save is already being checked.'),busy:true};
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
 return {readOwnSave,canContinueRevision,read,save,prepareRestore,restore,isBusy:identity=>pending?.identity===identity};
}
export {createBusinessSnapshotSession};
