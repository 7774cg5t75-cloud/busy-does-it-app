import {prepareLiveCreativePilot} from '../../../src/core/websiteCreativePilot.mjs';
import {prepareCreativeComparison} from '../../../src/core/websiteCreativeComparison.mjs';
import {parseBuilderProposalResponse,prepareGovernedBuilderReview,createBuilderProposalContext} from '../../../src/core/governedBuilderProposal.mjs';
import {stableJson} from '../../../src/core/stableJson.mjs';
const fail=(status,providerCalls=0)=>({ok:false,status,providerCalls,maySave:false,mayPublish:false,mayRetry:false});
// Provider wire subset only; original validator still enforces uniqueness and all bounds.
export function creativeProviderSchema(schema){
 let nodes=0;
 const walk=(s,depth=0)=>{if(!s||typeof s!=='object'||Array.isArray(s)||depth>10||++nodes>500)throw Error('Unsupported schema');
  const allowed=['type','properties','required','additionalProperties','items','enum','const','anyOf','minItems','maxItems','minLength','maxLength','uniqueItems'];
  if(Object.keys(s).some(k=>!allowed.includes(k)))throw Error('Unsupported schema keyword');
  const n=Object.fromEntries(Object.entries(s).filter(([k])=>!['const','uniqueItems'].includes(k)));
  if(Object.hasOwn(s,'const'))n.enum=[s.const];
  if(n.enum&&!n.type){const t=n.enum.map(v=>Number.isInteger(v)?'integer':typeof v);if(!t.length||t.some(v=>v!==t[0])||!['string','integer','boolean'].includes(t[0]))throw Error('Unsupported enum');n.type=t[0];}
  if(n.properties){if(n.additionalProperties!==false||!Array.isArray(n.required)||Object.keys(n.properties).some(k=>!n.required.includes(k))||n.required.some(k=>!Object.hasOwn(n.properties,k)))throw Error('Open schema');n.properties=Object.fromEntries(Object.entries(n.properties).map(([k,v])=>[k,walk(v,depth+1)]));}
  if(n.items)n.items=walk(n.items,depth+1);if(n.anyOf)n.anyOf=n.anyOf.map(v=>walk(v,depth+1));return n;
 };const result=walk(schema);if(result.type!=='object'||result.anyOf)throw Error('Root object required');return result;
}
export function creativeProviderRequest(envelope,model){return {model,store:false,max_output_tokens:1000,reasoning:{effort:"low"},tools:[],input:stableJson(envelope.input),text:{format:{type:'json_schema',name:'busy_art_direction',strict:true,schema:creativeProviderSchema(envelope.schema)}}};}
async function boundedProviderJson(response,signal){
 if(!response?.ok||!response.headers?.get('content-type')?.startsWith('application/json')||Number(response.headers.get('content-length'))>32768)throw Error('uncertain');
 const reader=response.body?.getReader();if(!reader)throw Error('uncertain');let size=0,parts=[];
 try{while(true){if(signal.aborted)throw Error('uncertain');const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32768){await reader.cancel();throw Error('uncertain');}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let n=0;for(const p of parts){bytes.set(p,n);n+=p.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
// Server-created dependencies only. There is NO import or activation path in index.ts.
// The offline zero-usage callback is never used here. Tests inject a synthetic HTTP transport.
// Future Edge bootstrap only: constructing this factory does not read a secret or enable policy.
// The fixed reader cannot be replaced by a request property or a supplied credential callback.
export function createDenoLiveCreativeAdapter(serverDeps={}){
 return createLiveCreativeAdapter({...serverDeps,readCredential:provider=>{
  if(provider!=='openai-responses')return null;
  try{return typeof Deno==='undefined'?null:Deno.env.get('BUSY_OPENAI_CREATIVE_PILOT_KEY');}
  catch{return null;} // Missing env permission/runtime is a generic denial; never expose errors.
 }});
}
export function createLiveCreativeAdapter(deps={}){
 let attempted=false;
 return async function compare(prepared){
  let calls=0,admitted=null,admissionAttempted=false,dispatchAttempted=false,settled=false;
  const now=()=>deps.clock?.()??Date.now();
  try{
   const policy=await deps.readServerPolicy?.();
   if(policy?.liveCreativeEnabled!==true||policy?.pilotExecutionEnabled!==true||policy.provider!=='openai-responses'||!/^[-a-zA-Z0-9_.]{1,100}$/.test(policy.model||'')||attempted)return fail('disabled');
   attempted=true;
   if(!['readCurrent','verifyApproval','readTariff','countRequestTokens','reserve','readReservation','dispatch','finish','readReceipt','readCredential'].every(k=>typeof deps[k]==='function')||typeof deps.integrity?.sha256!=='function'||typeof deps.transport!=='function')return fail('server-authority-unavailable');
   const current=await deps.readCurrent();
   let wire,wireDigest,approval;
   const pilot=await prepareLiveCreativePilot(prepared,current,{now:now(),integrity:deps.integrity,
    verifyApproval:async digest=>{approval=await deps.verifyApproval(digest);return approval?.provider===policy.provider&&approval?.model===policy.model?approval:null;},
    readTariff:async(provider,model)=>{const t=await deps.readTariff(provider,model);return t?.modelAvailable===true&&t?.availabilityVerified===true&&t?.fixedRequestGBP===0?t:null;},
    countTokens:async envelope=>{wire=creativeProviderRequest(envelope,policy.model);wireDigest=await deps.integrity.sha256(stableJson(wire));return deps.countRequestTokens(wire,policy.model);},
    inspectCentralReservation:async req=>{admissionAttempted=true;admitted=await deps.reserve({...req,requestDigest:wireDigest,approvalReceipt:approval.receipt});const read=await deps.readReservation(admitted);return read;}});
   if(!pilot.ok){if(admissionAttempted)throw Error('admission');return fail('admission-denied');}
   const fresh=await deps.readCurrent(),freshPrepared=prepareCreativeComparison(fresh,prepared.input.goal);
   if(!freshPrepared.ok||freshPrepared.anchor!==prepared.anchor||stableJson(freshPrepared.input)!==stableJson(prepared.input)||approval.expiresAt<=now())throw Error('stale');
   if(stableJson(await deps.readServerPolicy())!==stableJson(policy)||stableJson(await deps.verifyApproval(pilot.digest))!==stableJson(approval))throw Error('revoked');
   const secret=await deps.readCredential(policy.provider);if(typeof secret!=='string'||secret.length<20||secret.length>4096||/[\r\n]/.test(secret))throw Error('credential');
   dispatchAttempted=true;await deps.dispatch(admitted);
   const dispatched=await deps.readReservation(admitted);
   if(dispatched?.status!=='dispatched'||dispatched.attempts!==1||dispatched.operationId!==pilot.operationId||dispatched.inputDigest!==pilot.digest||dispatched.requestDigest!==wireDigest)throw Error('uncertain');
   const atDispatch=await deps.readCurrent();if(prepareCreativeComparison(atDispatch,prepared.input.goal).anchor!==prepared.anchor||stableJson(await deps.readServerPolicy())!==stableJson(policy)||stableJson(await deps.verifyApproval(pilot.digest))!==stableJson(approval)||approval.expiresAt<=now())throw Error('revoked');
   const controller=new AbortController();let timer;
   let response;
   try{calls=1;response=await Promise.race([(async()=>{const r=await deps.transport('https://api.openai.com/v1/responses',{method:'POST',redirect:'error',headers:{'Authorization':'Bearer '+secret,'Content-Type':'application/json'},body:stableJson(wire),signal:controller.signal});return boundedProviderJson(r,controller.signal);})(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('uncertain'));},15000);})]);}finally{clearTimeout(timer);controller.abort();}
   const usage=response?.usage,receipt=response?.id;
   if(typeof receipt!=='string'||!/^resp_[A-Za-z0-9_-]{1,145}$/.test(receipt)||response.model!==policy.model||!Number.isSafeInteger(usage?.input_tokens)||!Number.isSafeInteger(usage?.output_tokens)||usage.input_tokens<1||usage.output_tokens<0||usage.input_tokens>1000000||usage.output_tokens>1000000)throw Error('uncertain');
   try{await deps.finish(admitted,{outcome:'settled',inputTokens:usage.input_tokens,outputTokens:usage.output_tokens,providerReceipt:receipt,requestDigest:wireDigest});}catch{/* Lost settlement acknowledgement requires independent read, never inference replay. */}
   const readback=await deps.readReceipt(admitted);
   if(readback?.status!=='settled'||readback.inputTokens!==usage.input_tokens||readback.outputTokens!==usage.output_tokens||readback.providerReceipt!==receipt||readback.inputDigest!==pilot.digest||readback.requestDigest!==wireDigest||!Number.isFinite(readback.actualGBP)||readback.actualGBP<0)throw Error('uncertain');
   settled=true;
   if(usage.input_tokens>4000||usage.output_tokens>1000||readback.actualGBP>0.10||readback.overrun===true)return {...fail('usage-overrun',calls),receipt:readback};
   const output=response.output,message=Array.isArray(output)?output.filter(x=>x?.type==='message'):[];
   if(response.status!=='completed'||!Array.isArray(output)||output.length>2||output.some(x=>!['message','reasoning'].includes(x?.type))||message.length!==1||message[0].role!=='assistant'||!Array.isArray(message[0].content)||message[0].content.length!==1||message[0].content[0].type!=='output_text')return {...fail('invalid-proposal',calls),receipt:readback};
   const latest=await deps.readCurrent(),latestPrepared=prepareCreativeComparison(latest,prepared.input.goal);if(!latestPrepared.ok||latestPrepared.anchor!==prepared.anchor)return {...fail('source-changed-after-provider',calls),receipt:readback};
   const parsed=parseBuilderProposalResponse(message[0].content[0].text,prepared.source);if(!parsed.ok)return {...fail('invalid-proposal',calls),receipt:readback};
   const source=createBuilderProposalContext({...latest,projectId:latest.website.id,sourceRevision:latest.website.generation,surface:'website',pageId:'home',project:latest.website});
   const review=prepareGovernedBuilderReview(parsed.proposal,prepared.source,source,deps.planner);if(!review.ok)return {...fail('unsupported-or-unchanged-proposal',calls),receipt:readback};
   return {ok:true,status:'review-required',origin:'real-model',review,receipt:readback,requestDigest:wireDigest,providerCalls:calls,maySave:false,mayPublish:false,mayRetry:false,originalStudioApprovalRequired:true};
  }catch{
   if((admitted||admissionAttempted)&&!settled){try{await deps.finish(admitted,{outcome:dispatchAttempted?'unknown':'released'});}catch{/* Original central authority retains uncertainty; never replay. */}}
   return fail(dispatchAttempted?'unknown-outcome':'pre-dispatch-denied',calls);
  }
 };
}
