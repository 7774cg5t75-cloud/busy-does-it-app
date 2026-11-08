import {stableJson} from '../../../src/core/stableJson.mjs';
import {WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION} from './websiteIntelligenceProviderProjection.mjs';
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from '../busy-website-worker/websiteCreativePilotProfiles.mjs';

export const CREATIVE_INPUT_COUNT_ENDPOINT='https://api.openai.com/v1/responses/input_tokens';
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const need=x=>{if(!x)throw Error('count_refused');};
// Exact current Responses count fields, independently checked against official
// openai-node InputTokenCountParams blob188c68f5e4e79fe1751c032a2a690c64ab4ed493.
// Inference-only max_output_tokens/service_tier/store are deliberately omitted.
export async function projectCreativeInputCountRequest(projection,sha256){
 need(typeof sha256==='function'&&projection?.ok===true&&projection.version===WEBSITE_CREATIVE_DOCUMENT_PROVIDER_VERSION&&projection.budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE);
 need(projection.model==='gpt-6.1-sol'&&[projection.requestDigest,projection.inputDigest,projection.schemaDigest].every(sha));
 const wire=projection.wire,fields=['input','max_output_tokens','model','reasoning','service_tier','store','text','tool_choice','tools'];
 need(plain(wire)&&Object.keys(wire).sort().join(',')===fields.sort().join(',')&&wire.model===projection.model&&typeof wire.input==='string');
 need(wire.max_output_tokens===12000&&wire.reasoning?.effort==='medium'&&Object.keys(wire.reasoning).length===1&&wire.service_tier==='default'&&wire.store===false&&wire.tool_choice==='none'&&Array.isArray(wire.tools)&&wire.tools.length===0);
 need(plain(wire.text)&&wire.text.format?.type==='json_schema'&&wire.text.format.strict===true);
 const complete=stableJson(wire);need(new TextEncoder().encode(complete).byteLength<=98304&&await sha256(complete)===projection.requestDigest&&await sha256(wire.input)===projection.inputDigest&&await sha256(stableJson(wire.text.format.schema))===projection.schemaDigest);
 const body=stableJson({input:wire.input,model:wire.model,reasoning:wire.reasoning,text:wire.text,tool_choice:wire.tool_choice,tools:wire.tools}),countBodyDigest=await sha256(body);need(sha(countBodyDigest));
 return {model:wire.model,wireDigest:projection.requestDigest,sourceInputDigest:projection.inputDigest,schemaDigest:projection.schemaDigest,countBodyDigest,body};
}

// Low-level SERVER port only: no route, CLI, credential reader or default fetch.
// claimApprovedCount must use the EXISTING protected exact-run approval and
// durable one-use authority before returning true for these exact digests.
// This port cannot establish that authority or turn a model/client flag into it.
export function createCreativeInputCountPort(server={}){
 let attempted=false;
 return async projection=>{
  const receipt={version:'busy.creative-input-count-receipt.v1',ok:false,status:'denied',httpRequestsAttempted:0,inferenceCalls:0,mayReplay:false,mayGenerate:false,maySave:false,mayPublish:false,independentlyVerified:false};
  if(attempted)return receipt;attempted=true;
  let controller,timer,reader;
  try{
   need(['sha256','transport','claimApprovedCount','readCredential'].every(k=>typeof server[k]==='function'));
   const request=await projectCreativeInputCountRequest(projection,server.sha256);
   const {body,...identity}=request;Object.assign(receipt,identity);
   need(await server.claimApprovedCount({...identity})===true);
   const secret=await server.readCredential('openai-responses');need(typeof secret==='string'&&secret.length<=4096&&/^sk-[A-Za-z0-9_-]{17,4093}$/.test(secret));
   controller=new AbortController();
   const task=async()=>{
    receipt.httpRequestsAttempted=1;
    const r=await server.transport(CREATIVE_INPUT_COUNT_ENDPOINT,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body,signal:controller.signal});
    receipt.httpStatus=r?.status;
    need(r?.status===200&&r.redirected!==true&&(!r.url||r.url===CREATIVE_INPUT_COUNT_ENDPOINT)&&r.headers?.get('content-type')?.startsWith('application/json'));
    const length=r.headers.get('content-length');need(length===null||/^\d+$/.test(length)&&Number(length)<=4096);
    reader=r.body?.getReader();need(reader);let size=0;const parts=[];
    for(;;){need(!controller.signal.aborted);const part=await reader.read();if(part.done)break;size+=part.value.byteLength;need(size<=4096);parts.push(part.value);}
    const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.byteLength;}
    const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes),value=JSON.parse(text);
    need(plain(value)&&Object.keys(value).sort().join(',')==='input_tokens,object'&&value.object==='response.input_tokens'&&Number.isSafeInteger(value.input_tokens)&&value.input_tokens>=1&&value.input_tokens<=1000000);
    const checkedAt=server.clock?.()??Date.now(),responseDigest=await server.sha256(text);need(Number.isSafeInteger(checkedAt)&&sha(responseDigest));
    const providerRequestId=r.headers.get('x-request-id');need(providerRequestId===null||/^req_[A-Za-z0-9_-]{1,150}$/.test(providerRequestId));
    return {tokens:value.input_tokens,fitsInputLimit:value.input_tokens<=8000,responseDigest,providerRequestId,checkedAt};
   };
   const outcome=await Promise.race([task(),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('deadline'));},10000);})]);
   Object.assign(receipt,outcome,{ok:outcome.fitsInputLimit,status:outcome.fitsInputLimit?'counted':'counted-input-limit-exceeded',method:'responses-input-tokens',completeRequest:true});
   return receipt;
  }catch{return {...receipt,status:receipt.httpRequestsAttempted?'count-outcome-unconfirmed':'denied'};}
  finally{clearTimeout(timer);controller?.abort();if(reader){try{reader.cancel().catch(()=>{});}catch{}try{reader.releaseLock();}catch{}}}
 };
}
