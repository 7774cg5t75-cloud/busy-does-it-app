import {createDenoLiveCreativeAdapter} from './liveCreativeAdapter.mjs';
import {createOriginalCreativeLedger} from './creativeLedger.mjs';
import {prepareCreativeComparison} from '../../../src/core/websiteCreativeComparison.mjs';
import {createBuilderProposalContext} from '../../../src/core/governedBuilderProposal.mjs';
import {stableJson} from '../../../src/core/stableJson.mjs';
export const CREATIVE_STAGING_URL='https://pnjdlogwegnqbsfpcofw.supabase.co';
// A reviewed server deployment artifact, never a request body or a secret-presence switch.
export const disabledCreativeExecution=Object.freeze({version:1,projectUrl:CREATIVE_STAGING_URL,enabled:false,executionEnabled:false,execution:null});
const uuid=x=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(x);
const digest=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const reply=(status,code,extra={})=>new Response(JSON.stringify({ok:status===200,code,maySave:false,mayPublish:false,mayRetry:false,...extra}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function readOperation(request){
 if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>256)throw Error('body');
 const reader=request.body?.getReader();if(!reader)throw Error('body');let size=0,parts=[],timer;
 try{return await Promise.race([(async()=>{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>256)throw Error('body');parts.push(value);}const bytes=new Uint8Array(size);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length;}const b=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));if(!b||Array.isArray(b)||Object.keys(b).sort().join(',')!=='operationId,version'||b.version!==1||!uuid(b.operationId))throw Error('body');return b.operationId;})(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('body')),3000);})]);}
 finally{clearTimeout(timer);try{await reader.cancel();}catch{}reader.releaseLock();}
}
// All ports/configuration are server-created. No client goal, source, provider, tariff,
// approval, token count, credential or nonce is accepted. The original public gateway is untouched.
export function createStagingCreativeExecutionHandler(deps){
 return async request=>{
  let m,owner,e;
  try{
   m=structuredClone(await deps.readManifest());
   if(m?.version!==1||m.projectUrl!==CREATIVE_STAGING_URL||deps.projectUrl!==CREATIVE_STAGING_URL||m.enabled!==true||m.executionEnabled!==true)return reply(503,'disabled');
   if(request.method!=='POST')return reply(405,'method');
   const token=request.headers.get('authorization')||'';
   if(!/^Bearer [^\s]{20,4096}$/.test(token))return reply(401,'sign_in');
   try{owner=await deps.authenticate(token.slice(7));}catch{return reply(401,'sign_in');}
   if(!uuid(owner?.id)||owner.anonymous===true)return reply(401,'sign_in');
   e=m.execution;
   if(!e||!uuid(e.ownerId)||owner.id!==e.ownerId||!uuid(e.businessId)||!uuid(e.operationId)||!uuid(e.requestNonce)||e.operationId===e.requestNonce||!digest(e.inputDigest)||!digest(e.wireDigest)||e.provider!=='openai-responses'||!e.approval||e.approval.receipt!==e.approvalReceipt||!e.approvalReceipt||e.approval.wireDigest!==e.wireDigest)return reply(403,'execution_not_approved');
   if(await readOperation(request)!==e.operationId)return reply(403,'wrong_operation');
   if(request.signal.aborted)return reply(409,'cancelled');
   const manifestDigest=await deps.integrity.sha256(stableJson(m));
   const unchanged=async()=>!request.signal.aborted&&await deps.integrity.sha256(stableJson(await deps.readManifest()))===manifestDigest;
   const b=e.binding;
   if(!b||Object.keys(b).sort().join(',')!=='pageId,profileRevision,projectId,snapshotRevision,sourceRevision,surface'||b.surface!=='website'||b.pageId!=='home'||!['sourceRevision','profileRevision','snapshotRevision'].every(k=>Number.isSafeInteger(b[k])&&b[k]>0)||typeof e.goal!=='string')return reply(403,'invalid_binding');
   const readCurrent=async()=>{
    const r=await deps.rpc('busy_ai_context_v1',{p_actor:owner.id,p_business:e.businessId,p_binding:b});
    if(r?.ownerId!==owner.id||r.businessId!==e.businessId)throw Error('foreign');
    const c=createBuilderProposalContext({ownerId:owner.id,businessId:e.businessId,projectId:b.projectId,sourceRevision:b.sourceRevision,profileRevision:b.profileRevision,surface:'website',pageId:'home',project:r.project,profile:r.profile,catalog:r.catalog});
    if(!c.ok)throw Error('source');return {ownerId:owner.id,businessId:e.businessId,profileRevision:b.profileRevision,website:c.anchor.project,profile:c.anchor.profile};
   };
   const current=await readCurrent(),prepared=prepareCreativeComparison(current,e.goal);
   if(!prepared.ok)return reply(409,'source_changed');
   const ledger=createOriginalCreativeLedger({rpc:deps.rpc,actor:owner.id,business:e.businessId,binding:b,operationId:e.operationId,requestNonce:e.requestNonce,integrity:deps.integrity,clock:deps.clock});
   const adapter=(deps.adapterFactory||createDenoLiveCreativeAdapter)({
    ...ledger,integrity:deps.integrity,clock:deps.clock,planner:deps.planner,readCurrent,
    readServerPolicy:async()=>await unchanged()?{liveCreativeEnabled:true,pilotExecutionEnabled:true,provider:e.provider,model:e.model,manifestDigest}:null,
    verifyApproval:async d=>await unchanged()&&d===e.inputDigest&&e.approval.inputDigest===d&&e.approval.operationId===e.operationId?structuredClone(e.approval):null,
    readTariff:async(provider,model)=>await unchanged()&&provider===e.provider&&model===e.model?structuredClone(e.tariff):null,
    countRequestTokens:async(wire,model)=>{
     const c=e.tokenEvidence,now=deps.clock?.()??Date.now();
     if(!await unchanged()||model!==e.model||!c?.independentlyVerified||!c.reference||c.wireDigest!==e.wireDigest||!Number.isSafeInteger(c.checkedAt)||c.checkedAt>now||now-c.checkedAt>86400000||await deps.integrity.sha256(stableJson(wire))!==e.wireDigest)throw Error('count');
     return c.tokens;
    },transport:deps.transport
   });
   const result=await adapter(prepared);
   if(!result.ok)return reply(result.status==='unknown-outcome'?409:422,result.status,{providerCalls:result.providerCalls,inspectOriginalReceipt:['unknown-outcome','pre-dispatch-denied','admission-denied'].includes(result.status)});
   return reply(200,'review_required',{origin:'real-model',review:result.review,receipt:result.receipt,requestDigest:result.requestDigest,originalStudioApprovalRequired:true});
  }catch{return reply(owner?409:503,'preparation_unavailable');}
 };
}
