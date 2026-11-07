// Server-only original-authority transport for one separately approved B3 run.
// No HTTP server, environment lookup, deployment, logging, provider API,
// publication endpoint, token refresh or automatic retry is defined here.
export const AI_LAB_B3_RUNTIME_VERSION='busy.ai-lab-b3-runtime.v1';
export const AI_LAB_B3_URL='https://sbvkrvksnruiclcvclbd.supabase.co';
const PROJECT='sbvkrvksnruiclcvclbd',ORGANIZATION='wrjfgasxtlznzfzmfrif';
const OWNER_EMAIL='quiet-light-owner@busy-ai-lab.invalid';
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
const digest=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
const exact=(v,keys)=>object(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const positive=v=>Number.isSafeInteger(v)&&v>0;
const nullableHash=v=>v===null||digest(v);
const encoder=new TextEncoder();
const EXPECTED_EMPTY_SOURCE=Symbol('independently-authenticated-missing-workspace');
const OWNER_RPCS=Object.freeze({
 busy_connected_workspaces_v1:[],
 busy_connected_initialize_v1:['p_business_id'],
 busy_connected_builder_read_v1:['p_business_id'],
 busy_connected_profile_write_v1:['p_business_id','p_expected_revision','p_expected_profile','p_profile','p_owner_approved']
});
const SERVICE_RPCS=Object.freeze({busy_connected_website_commit_v1:['p_business_id','p_actor_id','p_expected_revision','p_expected_draft','p_candidate','p_profile_revision']});
const WRITE_LIMITS=Object.freeze({busy_connected_initialize_v1:1,busy_connected_profile_write_v1:1,busy_connected_website_commit_v1:4});
export class AiLabB3RuntimeError extends Error{
 constructor(code,unknownOutcome=false){super('AI Lab B3 stopped: '+code);this.name='AiLabB3RuntimeError';this.code=code;this.unknownOutcome=unknownOutcome;this.mayReplay=false;}
}
const fail=(code,unknown=false)=>new AiLabB3RuntimeError(code,unknown);

function validateGate(m,now){
 if(!exact(m,['version','projectId','organizationId','region','ownerId','businessId','executionId','requestNonce','sourcePlanDigest','approval'])||m.version!==AI_LAB_B3_RUNTIME_VERSION||m.projectId!==PROJECT||m.organizationId!==ORGANIZATION||m.region!=='eu-west-1'||!['ownerId','businessId','executionId','requestNonce'].every(k=>uuid(m[k]))||new Set([m.ownerId,m.businessId,m.executionId,m.requestNonce]).size!==4||!digest(m.sourcePlanDigest)||!exact(m.approval,['status','manifestDigest','expiresAt'])||m.approval.status!=='owner-approved'||!digest(m.approval.manifestDigest)||typeof m.approval.expiresAt!=='string')return false;
 const expiry=Date.parse(m.approval.expiresAt);
 return Number.isFinite(now)&&Number.isFinite(expiry)&&expiry>now&&expiry-now<=86400000;
}
function serializable(value,seen=new Set(),depth=0,counter={n:0}){
 if(++counter.n>18000||depth>40)throw fail('request_size');
 if(value===null||typeof value==='string'||typeof value==='boolean'||value===undefined)return;
 if(typeof value==='number'){if(!Number.isFinite(value))throw fail('request_schema');return;}
 if(!Array.isArray(value)&&!object(value))throw fail('request_schema');
 if(seen.has(value))throw fail('request_schema');seen.add(value);
 for(const d of Object.values(Object.getOwnPropertyDescriptors(value))){if(!('value'in d))throw fail('request_schema');serializable(d.value,seen,depth+1,counter);}
 seen.delete(value);
}
function wireArguments(args){
 serializable(args);let text;
 try{text=JSON.stringify(args);}catch{throw fail('request_schema');}
 if(typeof text!=='string'||encoder.encode(text).byteLength>650000)throw fail('request_size');
 return {text,value:JSON.parse(text)};
}
function validateArgs(name,a,m,service){
 const registry=service?SERVICE_RPCS:OWNER_RPCS,keys=typeof name==='string'&&Object.hasOwn(registry,name)?registry[name]:null;
 if(!keys||!exact(a,keys)||(name!=='busy_connected_workspaces_v1'&&a.p_business_id!==m.businessId))throw fail('rpc_scope');
 if(name==='busy_connected_profile_write_v1'&&(!Number.isSafeInteger(a.p_expected_revision)||a.p_expected_revision<0||a.p_owner_approved!==true||!object(a.p_profile)||(a.p_expected_profile!==null&&!object(a.p_expected_profile))))throw fail('rpc_arguments');
 if(service){
  const c=a.p_candidate,e=a.p_expected_draft;
  if(a.p_actor_id!==m.ownerId||!positive(a.p_expected_revision)||!positive(a.p_profile_revision)||!object(c)||(e!==null&&!object(e))||c.businessId!==m.businessId||c.status!=='Draft'||c.publicStatus!=='Not published'||!positive(c.generation)||c.generation!==(e===null?1:e.generation+1)||(e!==null&&(e.businessId!==m.businessId||c.id!==e.id))||typeof c.id!=='string'||c.id.length<1||c.id.length>160)throw fail('rpc_arguments');
 }
}
function validateMember(v,m){
 return exact(v,['actorId','items'])&&v.actorId===m.ownerId&&Array.isArray(v.items)&&v.items.length===1&&exact(v.items[0],['businessId','businessName','role'])&&v.items[0].businessId===m.businessId&&v.items[0].businessName==='Quiet Light Studio'&&v.items[0].role==='owner';
}
function validateOwner(v,m){
 return object(v)&&v.id===m.ownerId&&v.email===OWNER_EMAIL&&v.role==='authenticated'&&v.aud==='authenticated'&&v.is_anonymous===false&&typeof v.email_confirmed_at==='string'&&Number.isFinite(Date.parse(v.email_confirmed_at))&&v.deleted_at==null&&v.banned_until==null&&v.is_super_admin!==true&&v.is_sso_user!==true&&Array.isArray(v.identities)&&v.identities.length===1&&v.identities[0]?.provider==='email'&&v.identities[0]?.user_id===m.ownerId;
}
function validRpcResult(name,r,a,m){
 if(name==='busy_connected_workspaces_v1')return validateMember(r,m);
 if(!object(r)||r.actorId!==m.ownerId||r.businessId!==m.businessId)return false;
 if(name==='busy_connected_builder_read_v1'||name==='busy_connected_initialize_v1'){
  return exact(r,['actorId','businessId','revision','websiteUndoCount','websiteRedoCount','websiteHistoryHash','websiteDraft','websiteDraftHash','profileRevision','profileHash','profile'])&&positive(r.revision)&&['websiteUndoCount','websiteRedoCount'].every(k=>Number.isSafeInteger(r[k])&&r[k]>=0&&r[k]<=8)&&nullableHash(r.websiteHistoryHash)&&nullableHash(r.websiteDraftHash)&&nullableHash(r.profileHash)&&(r.profileRevision===null||positive(r.profileRevision))&&(r.profile===null||object(r.profile))&&(r.websiteDraft===null||(object(r.websiteDraft)&&r.websiteDraft.businessId===m.businessId));
 }
 if(name==='busy_connected_profile_write_v1')return exact(r,['businessId','actorId','profileRevision','profile','privateOnly','publicationChanged','recordHash'])&&r.profileRevision===a.p_expected_revision+1&&object(r.profile)&&r.privateOnly===true&&r.publicationChanged===false&&digest(r.recordHash);
 return exact(r,['ok','businessId','actorId','previousRevision','revision','draftId','generation','recordHash','privateOnly','operation','undoCount','redoCount','historyHash'])&&r.ok===true&&r.previousRevision===a.p_expected_revision&&r.revision===a.p_expected_revision+1&&r.draftId===a.p_candidate.id&&r.generation===a.p_candidate.generation&&digest(r.recordHash)&&r.privateOnly===true&&r.operation==='edit'&&Number.isSafeInteger(r.undoCount)&&r.undoCount>=0&&r.undoCount<=8&&r.redoCount===0&&digest(r.historyHash);
}

export function createAiLabB3Runtime(manifest,{fetchImpl,credentialReader,ownerPasswordReader,consumeDispatchPermit,now=Date.now,requestTimeoutMs=10000}={}){
 let m=null,state='disabled',locked=false,session=null,keys=null,loginAttempted=false,permitAttempted=false,permitConsumed=false;
 const writes={},counts={authSignIns:0,nativeUserReads:0,ownerRpcs:0,serviceRpcs:0};
 const timeout=Number.isSafeInteger(requestTimeoutMs)&&requestTimeoutMs>=1&&requestTimeoutMs<=10000?requestTimeoutMs:10000;
 try{if(validateGate(manifest,now())&&[fetchImpl,credentialReader,ownerPasswordReader,consumeDispatchPermit].every(v=>typeof v==='function')){m=Object.freeze({...manifest,approval:Object.freeze({...manifest.approval})});state='unused';}}catch{/* Disabled without credential reads or network access. */}
 const halt=(code,unknown=false)=>{state='stopped';session=null;keys=null;return fail(code,unknown);};
 const current=()=>{if(state==='disabled')throw fail('disabled');if(state==='stopped'||state==='closed')throw fail('already_stopped');if(!validateGate(m,now()))throw halt('approval_expired');};
 const exclusive=async fn=>{
  current();if(locked)throw fail('in_flight');locked=true;
  try{return await fn();}catch(error){const safe=error instanceof AiLabB3RuntimeError?error:fail('runtime_unavailable');state='stopped';session=null;keys=null;throw safe;}finally{locked=false;}
 };
 async function request(path,{method='GET',headers={},body,write=false,maxBytes=650000,probeEmpty=false}={}){
  current();const controller=new AbortController();let timer,reader;
  const requestUrl=AI_LAB_B3_URL+path;
  const execute=async()=>{
   const response=await fetchImpl(requestUrl,{method,headers:{Accept:'application/json',...headers},body,signal:controller.signal,redirect:'error',cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
   if(!response||!Number.isInteger(response.status)||response.status<100||response.status>599)throw fail('response_schema',write);
   if(response.url&&response.url!==requestUrl)throw fail('response_origin',write);
   // PostgREST maps PostgreSQL40* toHTTP500. This one read-only probe permits
   // only the exact original missing-workspace error, never a generic500.
   const expectedError=probeEmpty&&response.status===500;
   if((response.status<200||response.status>=300)&&!expectedError){try{void response.body?.cancel()?.catch(()=>{});}catch{}throw fail(response.status===401||response.status===403?'access_denied':'request_rejected',write&&response.status>=500);}
   const limit=expectedError?2048:maxBytes;
   const type=response.headers?.get('content-type')||'',length=response.headers?.get('content-length');
   if(!/^application\/json(?:;|$)/i.test(type)||(length!==null&&length!==undefined&&(!/^\d+$/.test(length)||Number(length)>limit)))throw fail('response_size_or_type',write);
   reader=response.body?.getReader();if(!reader)throw fail('response_schema',write);
   let size=0;const chunks=[];
   while(true){const part=await reader.read();if(part.done)break;if(!(part.value instanceof Uint8Array)||(size+=part.value.byteLength)>limit)throw fail('response_size',write);chunks.push(part.value);}
   const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.byteLength;}
   let json;try{json=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw fail('response_json',write);}
   if(expectedError){if(exact(json,['code','message','details','hint'])&&json.code==='40001'&&json.message==='Workspace unavailable'&&json.details===null&&json.hint===null)return EXPECTED_EMPTY_SOURCE;throw fail('source_probe_denied');}
   return json;
  };
  try{return await Promise.race([execute(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(fail('request_timeout',write));},Math.min(timeout,Math.max(1,Date.parse(m.approval.expiresAt)-now())));})]);}
  catch(error){if(error instanceof AiLabB3RuntimeError)throw error;throw fail('transport_unavailable',write);}
  finally{clearTimeout(timer);try{void reader?.cancel()?.catch(()=>{});}catch{}try{reader?.releaseLock();}catch{}}
 }
 async function signInOnce(){
  current();if(session){if(session.expiresAt<=now())throw halt('native_session_expired');return;}
  if(loginAttempted)throw halt('native_sign_in_already_attempted');
  const expected={executionId:m.executionId,requestNonce:m.requestNonce,manifestDigest:m.approval.manifestDigest};
  let permit;
  permitAttempted=true;
  try{permit=await consumeDispatchPermit(Object.freeze({...expected,sourcePlanDigest:m.sourcePlanDigest,ownerId:m.ownerId,businessId:m.businessId}));}catch{throw halt('dispatch_permit_unavailable');}
  if(!exact(permit,['status','executionId','requestNonce','manifestDigest'])||permit.status!=='consumed'||!Object.keys(expected).every(k=>permit[k]===expected[k]))throw halt('dispatch_permit_denied');
  current();permitConsumed=true;
  let supplied,password;
  try{supplied=await credentialReader();password=await ownerPasswordReader();}catch{throw halt('credentials_unavailable');}
  if(!exact(supplied,['publishableKey','serviceKey'])||typeof supplied.publishableKey!=='string'||!/^sb_publishable_[A-Za-z0-9_-]{16,512}$/.test(supplied.publishableKey)||typeof supplied.serviceKey!=='string'||!/^sb_secret_[A-Za-z0-9_-]{16,512}$/.test(supplied.serviceKey)||typeof password!=='string'||password.length<8||password.length>1024)throw halt('credentials_invalid');
  keys={publishableKey:supplied.publishableKey,serviceKey:supplied.serviceKey};supplied=null;
  current();loginAttempted=true;counts.authSignIns++;state='authenticated';
  let reply;
  try{reply=await request('/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:keys.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({email:OWNER_EMAIL,password}),write:true,maxBytes:32768});}finally{password=null;}
  if(!object(reply)||typeof reply.access_token!=='string'||!/^[-A-Za-z0-9_]+\.[-A-Za-z0-9_]+\.[-A-Za-z0-9_]+$/.test(reply.access_token)||reply.access_token.length<20||reply.access_token.length>16384||typeof reply.token_type!=='string'||reply.token_type.toLowerCase()!=='bearer'||!positive(reply.expires_in)||reply.expires_in>86400||!validateOwner(reply.user,m))throw halt('native_sign_in_response',true);
  session={token:reply.access_token,expiresAt:now()+reply.expires_in*1000};
 }
 const ownerHeaders=()=>({apikey:keys.publishableKey,Authorization:'Bearer '+session.token,'Content-Type':'application/json','Accept-Profile':'public','Content-Profile':'public'});
 async function callRpc(name,a,service){
  const encoded=wireArguments(a);validateArgs(name,encoded.value,m,service);
  const write=Object.hasOwn(WRITE_LIMITS,name);
  if(write){if((writes[name]||0)>=WRITE_LIMITS[name])throw fail('write_limit');writes[name]=(writes[name]||0)+1;}
  counts[service?'serviceRpcs':'ownerRpcs']++;
  const r=await request('/rest/v1/rpc/'+name,{method:'POST',headers:service?{apikey:keys.serviceKey,'Content-Type':'application/json','Accept-Profile':'public','Content-Profile':'public'}:ownerHeaders(),body:encoded.text,write});
  if(!validRpcResult(name,r,encoded.value,m))throw fail('rpc_response',write);
  const serial=JSON.stringify(r);
  if([keys.publishableKey,keys.serviceKey,session.token].some(secret=>serial.includes(secret)))throw fail('credential_in_rpc_response',write);
  return r;
 }
 async function identityAndMembership(){
  await signInOnce();current();if(session.expiresAt<=now())throw halt('native_session_expired');
  counts.nativeUserReads++;
  const owner=await request('/auth/v1/user',{headers:{apikey:keys.publishableKey,Authorization:'Bearer '+session.token},maxBytes:32768});
  if(!validateOwner(owner,m))throw fail('native_identity_changed');
  const membership=await callRpc('busy_connected_workspaces_v1',{},false);
  return {owner:Object.freeze({id:m.ownerId,anonymous:false,emailConfirmed:true}),membership};
 }
 return Object.freeze({
  verifyOwner:()=>exclusive(async()=>(await identityAndMembership()).owner),
  probeEmptySource:()=>exclusive(async()=>{await identityAndMembership();counts.ownerRpcs++;const result=await request('/rest/v1/rpc/busy_connected_builder_read_v1',{method:'POST',headers:ownerHeaders(),body:JSON.stringify({p_business_id:m.businessId}),probeEmpty:true});if(result!==EXPECTED_EMPTY_SOURCE)throw fail('source_already_exists_or_unverified');return Object.freeze({empty:true});}),
  ownerRpc:(name,args)=>exclusive(async()=>{const a=wireArguments(args).value;validateArgs(name,a,m,false);const checked=await identityAndMembership();return name==='busy_connected_workspaces_v1'?checked.membership:callRpc(name,a,false);}),
  serviceRpc:(name,args)=>exclusive(async()=>{const a=wireArguments(args).value;validateArgs(name,a,m,true);await identityAndMembership();return callRpc(name,a,true);}),
  // Consumed means acknowledgement verified, never proof that an attempted
  // permit with a lost acknowledgement remained unused. Inspect durable state.
  inspect:()=>Object.freeze({state,permitAttempted,permitConsumed,loginAttempted,authenticated:session!==null,mayReplay:false,providerCalls:0,counts:Object.freeze({...counts}),writes:Object.freeze({...writes})}),
  close:()=>{state='closed';session=null;keys=null;}
 });
}
