import {stableJson} from '../../../src/core/stableJson.mjs';

const fail=(status,providerCalls=0)=>({ok:false,status,providerCalls,maySave:false,mayPublish:false,mayRetry:false});
async function boundedProviderJson(response,signal,maximumBytes){
 if(!response?.ok||!response.headers?.get('content-type')?.startsWith('application/json')||Number(response.headers.get('content-length'))>maximumBytes)throw Error('uncertain');
 const reader=response.body?.getReader();if(!reader)throw Error('uncertain');let size=0;const parts=[];
 try{while(true){if(signal.aborted)throw Error('uncertain');const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maximumBytes){await reader.cancel();throw Error('uncertain');}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}

// ONE transport/dispatch/settlement engine for the reviewed legacy Home protocol
// and the separately versioned whole-site protocol. Protocols are server imports,
// never request properties, model output, a public switch or a second AI ledger.
export function createGovernedCreativeExecution(deps,protocol){
 let attempted=false;
 return async function compare(prepared){
  let calls=0,admitted=null,admissionAttempted=false,dispatchAttempted=false,settled=false,readback=null;
  const now=()=>deps.clock?.()??Date.now();
  try{
   const policy=await deps.readServerPolicy?.();
   if(policy?.liveCreativeEnabled!==true||policy?.pilotExecutionEnabled!==true||policy.provider!=='openai-responses'||!/^[-a-zA-Z0-9_.]{1,100}$/.test(policy.model||'')||attempted)return fail('disabled');
   attempted=true;
   if(!['readCurrent','verifyApproval','readTariff','countRequestTokens','reserve','readReservation','dispatch','finish','readReceipt','readCredential'].every(key=>typeof deps[key]==='function')||typeof deps.integrity?.sha256!=='function'||typeof deps.transport!=='function')return fail('server-authority-unavailable');
   const current=await deps.readCurrent();
   const pilot=await protocol.admit(prepared,current,policy,{...deps,now:now(),
    reserve:async request=>{admissionAttempted=true;admitted=await deps.reserve(request);return admitted;}
   });
   if(!pilot.ok){if(admissionAttempted)throw Error('admission');return fail('admission-denied');}
   // Bounds come from the imported protocol's verified admission, never the
   // request body or model output. Legacy callers keep their historical caps.
   const bounds=protocol.boundsFor?protocol.boundsFor(pilot):{inputTokens:4000,outputTokens:protocol.maximumOutputTokens,maximumGBP:.10,responseTimeoutMs:protocol.responseTimeoutMs};
   if(!bounds||!Number.isSafeInteger(bounds.inputTokens)||bounds.inputTokens<1||bounds.inputTokens>8000||!Number.isSafeInteger(bounds.outputTokens)||bounds.outputTokens<1||bounds.outputTokens>12000||!Number.isFinite(bounds.maximumGBP)||bounds.maximumGBP<=0||bounds.maximumGBP>1||!Number.isSafeInteger(bounds.responseTimeoutMs)||bounds.responseTimeoutMs<1||bounds.responseTimeoutMs>120000)throw Error('protocol');
   const {wire,wireDigest,approval}=pilot;
   if(await deps.integrity.sha256(stableJson(wire))!==wireDigest)throw Error('wire');
   if(!await protocol.current(prepared,await deps.readCurrent())||approval.expiresAt<=now())throw Error('stale');
   if(stableJson(await deps.readServerPolicy())!==stableJson(policy)||stableJson(await deps.verifyApproval(pilot.digest))!==stableJson(approval))throw Error('revoked');
   // The lazy credential is read only after original admission and source checks.
   const secret=await deps.readCredential(policy.provider);
   if(typeof secret!=='string'||secret.length<20||secret.length>4096||/[\r\n]/.test(secret))throw Error('credential');
   dispatchAttempted=true;await deps.dispatch(admitted);
   const dispatched=await deps.readReservation(admitted);
   if(dispatched?.status!=='dispatched'||dispatched.attempts!==1||dispatched.operationId!==pilot.operationId||dispatched.inputDigest!==pilot.digest||dispatched.requestDigest!==wireDigest)throw Error('uncertain');
   if(!await protocol.current(prepared,await deps.readCurrent())||stableJson(await deps.readServerPolicy())!==stableJson(policy)||stableJson(await deps.verifyApproval(pilot.digest))!==stableJson(approval)||approval.expiresAt<=now())throw Error('revoked');
   const controller=new AbortController();let timer,response;
   try{
    calls=1;
    response=await Promise.race([(async()=>{
     const raw=await deps.transport('https://api.openai.com/v1/responses',{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:stableJson(wire),signal:controller.signal});
     return boundedProviderJson(raw,controller.signal,protocol.maximumResponseBytes);
    })(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('uncertain'));},bounds.responseTimeoutMs);})]);
   }finally{clearTimeout(timer);controller.abort();}
   const usage=response?.usage,receipt=response?.id;
   if(typeof receipt!=='string'||!/^resp_[A-Za-z0-9_-]{1,145}$/.test(receipt)||response.model!==policy.model||!Number.isSafeInteger(usage?.input_tokens)||!Number.isSafeInteger(usage?.output_tokens)||usage.input_tokens<1||usage.output_tokens<0||usage.input_tokens>1000000||usage.output_tokens>1000000||protocol.accountingResponse&&protocol.accountingResponse(response)!==true)throw Error('uncertain');
   // Total output includes invisible reasoning. Settle real usage even when the
   // response is incomplete, unsafe, invalid, unchanged or aesthetically poor.
   try{await deps.finish(admitted,{outcome:'settled',inputTokens:usage.input_tokens,outputTokens:usage.output_tokens,providerReceipt:receipt,requestDigest:wireDigest});}catch{/* Independent readback, never a second inference, resolves a lost finish acknowledgement. */}
   readback=await deps.readReceipt(admitted);
   if(readback?.status!=='settled'||readback.inputTokens!==usage.input_tokens||readback.outputTokens!==usage.output_tokens||readback.providerReceipt!==receipt||readback.inputDigest!==pilot.digest||readback.requestDigest!==wireDigest||!Number.isFinite(readback.actualGBP)||readback.actualGBP<0)throw Error('uncertain');
   settled=true;
   if(usage.input_tokens>bounds.inputTokens||usage.output_tokens>bounds.outputTokens||readback.actualGBP>bounds.maximumGBP||readback.overrun===true)return {...fail('usage-overrun',calls),receipt:readback};
   const latest=await deps.readCurrent();
   if(!await protocol.current(prepared,latest))return {...fail('source-changed-after-provider',calls),receipt:readback};
   const reviewed=await protocol.review({prepared,current:latest,response,readback,pilot,deps,policy});
   if(!reviewed.ok)return {...fail(reviewed.status||'invalid-proposal',calls),receipt:readback};
   return {ok:true,status:'review-required',origin:'real-model',review:reviewed.review,...(reviewed.proposal?{proposal:reviewed.proposal}:{}),receipt:readback,requestDigest:wireDigest,providerCalls:calls,maySave:false,mayPublish:false,mayRetry:false,originalStudioApprovalRequired:true};
  }catch{
   if((admitted||admissionAttempted)&&!settled){try{await deps.finish(admitted,{outcome:dispatchAttempted?'unknown':'released'});}catch{/* Original authority retains liability. An existing/uncertain operation is never replayed. */}}
   return {...fail(dispatchAttempted?'unknown-outcome':'pre-dispatch-denied',calls),...(settled?{receipt:readback}: {})};
  }
 };
}
