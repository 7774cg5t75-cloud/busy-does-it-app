import {createBuilderProposalContext,builderInterpretationEnvelope,builderProposalResponseSchema,parseBuilderProposalResponse} from '../../../src/core/governedBuilderProposal.mjs';
import {stableJson} from '../../../src/core/stableJson.mjs';
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x);
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const response=(status,code,message,extra={})=>new Response(JSON.stringify({ok:status===200,code,message,...extra}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function readBounded(request){
 if(Number(request.headers.get('content-length'))>4096||!request.headers.get('content-type')?.startsWith('application/json'))throw Error('invalid_request');
 const reader=request.body?.getReader();if(!reader)throw Error('invalid_request');let size=0;const chunks=[];const deadline=Date.now()+3000;
 try{while(true){let timer;let packet;try{packet=await Promise.race([reader.read(),new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('invalid_request'));reader.cancel().catch(()=>{});},Math.max(1,deadline-Date.now()));})]);}finally{clearTimeout(timer);}const {done,value}=packet;if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();throw Error('invalid_request');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),x=>x.toString(16).padStart(2,'0')).join('');
function contextFrom(record,binding){
 return createBuilderProposalContext({ownerId:record.ownerId,businessId:record.businessId,projectId:binding.projectId,sourceRevision:binding.sourceRevision,profileRevision:binding.profileRevision,surface:binding.surface,pageId:binding.pageId,project:record.project,profile:record.profile,catalog:record.catalog});
}
// Dependencies are server-created, never supplied in a request. The only entry
// point wires a deterministic offline provider; no live adapter can be selected.
export function createBuilderProposalGateway(deps){
 return async function handle(request){
  if(deps.enabled!==true||deps.projectUrl!=='https://pnjdlogwegnqbsfpcofw.supabase.co'||deps.providerMode!=='offline-simulation')return response(503,'disabled','This preparation service is not enabled. Your work is unchanged.');
  if(request.method!=='POST')return response(405,'method','Use a private preparation request.');
  const authorization=request.headers.get('authorization')||'';
  if(!/^Bearer [^\s]{20,4096}$/.test(authorization))return response(401,'sign_in','Sign in again before preparing this idea.');
  let owner,body,context,admissionAttempted=false,dispatched=false,settled=false;const requestNonce=crypto.randomUUID();
  try{
   owner=await deps.authenticate(authorization.slice(7));if(!uuid(owner?.id))return response(401,'sign_in','Sign in again before preparing this idea.');
   body=await readBounded(request);
   if(!exact(body,['version','operationId','businessId','binding','goal'])||body.version!==1||!uuid(body.operationId)||!uuid(body.businessId)||typeof body.goal!=='string'||body.goal.trim().length===0||body.goal.length>240||/[<>\u0000-\u001f\u007f]/.test(body.goal)||!exact(body.binding,['surface','projectId','sourceRevision','profileRevision','snapshotRevision','pageId'])||!['website','app'].includes(body.binding.surface)||typeof body.binding.projectId!=='string'||body.binding.projectId.length>100||!['sourceRevision','profileRevision','snapshotRevision'].every(k=>Number.isSafeInteger(body.binding[k])&&body.binding[k]>0))return response(400,'invalid_request','Describe one supported idea for your current project.');
   const params={p_actor:owner.id,p_business:body.businessId,p_binding:body.binding};
   context=contextFrom(await deps.rpc('busy_ai_context_v1',params),body.binding);if(!context.ok||context.scope.ownerId!==owner.id||context.scope.businessId!==body.businessId)throw Error('source_changed');
   const envelope=builderInterpretationEnvelope(context,body.goal);if(envelope.ok===false)throw Error('invalid_request');
   admissionAttempted=true;
   const receipt=await deps.rpc('busy_ai_reserve_v1',{...params,p_operation:body.operationId,p_request_nonce:requestNonce,p_model:body.binding.surface==='website'?'offline-website-v1':'offline-app-v1',p_feature:body.binding.surface==='website'?'website-design':'app-requirements',p_goal_hash:await hash(stableJson({goal:body.goal,scope:context.scope}))});
   if(!receipt.fresh)return response(409,'already_recorded','This request is already recorded. Inspect its outcome before starting another.');
   const current=contextFrom(await deps.rpc('busy_ai_context_v1',params),body.binding);if(stableJson(context)!==stableJson(current))throw Error('source_changed');
   if(request.signal.aborted)throw Error('cancelled');
   await deps.rpc('busy_ai_dispatch_v1',{p_actor:owner.id,p_business:body.businessId,p_operation:body.operationId,p_request_nonce:requestNonce});dispatched=true;
   const controller=new AbortController();let timer;
   const aborted=()=>controller.abort();request.signal.addEventListener('abort',aborted,{once:true});
   let raw;
   if(request.signal.aborted)throw Error('unknown');
   try{raw=await Promise.race([Promise.resolve().then(()=>deps.offlineProvider(envelope,{schema:builderProposalResponseSchema(context),signal:controller.signal})),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('unknown'));},5000);controller.signal.addEventListener('abort',()=>reject(Error('unknown')),{once:true});})]);}finally{clearTimeout(timer);request.signal.removeEventListener('abort',aborted);}
   // Simulation usage is known to be zero. No model-supplied usage or amount is
   // accepted, and this is explicitly not a real provider/billing receipt.
   await deps.rpc('busy_ai_finish_v1',{p_actor:owner.id,p_business:body.businessId,p_operation:body.operationId,p_request_nonce:requestNonce,p_outcome:'settled',p_input:0,p_output:0,p_receipt:'offline:'+body.operationId});settled=true;
   const checked=parseBuilderProposalResponse(raw,context);if(!checked.ok)return response(422,'unsupported_proposal','That suggestion could not be safely prepared. Your original work is unchanged.');
   const after=contextFrom(await deps.rpc('busy_ai_context_v1',params),body.binding);if(stableJson(context)!==stableJson(after)||request.signal.aborted)throw Error('source_changed');
   return response(200,'review','Review the proposed idea before changing your private draft.',{proposal:checked.proposal,simulation:true,requiresOwnerReview:true,mayExecute:false,operationId:body.operationId});
  }catch(error){
   if(admissionAttempted&&owner?.id&&uuid(body?.operationId)&&uuid(body?.businessId)&&!settled){
    // An acknowledgement may be lost even when dispatch committed. Release is
    // allowed only if the database proves the operation never dispatched.
    try{await deps.rpc('busy_ai_finish_v1',{p_actor:owner.id,p_business:body.businessId,p_operation:body.operationId,p_request_nonce:requestNonce,p_outcome:dispatched?'unknown':'released'});}catch{try{await deps.rpc('busy_ai_finish_v1',{p_actor:owner.id,p_business:body.businessId,p_operation:body.operationId,p_request_nonce:requestNonce,p_outcome:'unknown'});}catch{}}
   }
   if(!owner)return response(401,'sign_in','Your sign-in could not be verified. Reconnect before preparing this idea.');
   const code=String(error?.message||'');
   if(code==='invalid_request'||error instanceof SyntaxError)return response(400,'invalid_request','This request could not be read safely. Your work is unchanged.');
   if(/allowance|ceiling|Tariff|admission|entitlement/i.test(code))return response(429,'allowance_unavailable','This request cannot use your included AI allowance right now. Your work is safe; supported manual editing is still available.');
   return response(409,dispatched&&!settled?'outcome_unknown':'review_changed',dispatched&&!settled?'The result is not confirmed. Do not repeat this request until its recorded outcome is checked.':'Your access or project changed, or preparation is unavailable. Open the current project before another review.');
  }
 };
}
