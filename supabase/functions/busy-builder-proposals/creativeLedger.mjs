import {stableJson} from '../../../src/core/stableJson.mjs';
// Exact original service-only RPCs. Readback proposal is separate and uninstalled.
export function createOriginalCreativeLedger({rpc,actor,business,binding,operationId,requestNonce,integrity,clock=()=>Date.now()}){
 let expectation=null;
 const args={p_actor:actor,p_business:business,p_operation:operationId,p_request_nonce:requestNonce};
 const read=async()=>{if(!expectation)throw Error('No admitted request');const r=await rpc('busy_ai_operation_read_v1',args);if(r.operationId!==operationId||r.goalHash!==expectation.goalHash||r.model!==expectation.model||stableJson(r.binding)!==stableJson(binding))throw Error('Receipt identity mismatch');return r;};
 const normal=r=>({operationId,scope:expectation.scope,status:r.state==='reserved'?'reserved-undispatched':r.state,attempts:r.attempts,inputDigest:expectation.digest,requestDigest:expectation.requestDigest,provider:expectation.provider,model:r.model,tariffRevision:String(r.tariffRevision),admittedGBP:r.maximumMicroGBP/1e6,actualGBP:r.actualMicroGBP==null?null:r.actualMicroGBP/1e6,inputTokens:r.inputTokens,outputTokens:r.outputTokens,providerReceipt:r.providerReceipt,overrun:r.actualMicroGBP>r.maximumMicroGBP,expiresAt:Date.parse(r.createdAt)+30000,fresh:expectation.fresh,authoritativeReadback:true,realUsageSettlementSupported:true});
 return {
  reserve:async req=>{if(req.scope?.ownerId!==actor||req.scope.businessId!==business||req.scope.projectId!==binding.projectId||req.scope.sourceRevision!==binding.sourceRevision||req.scope.profileRevision!==binding.profileRevision||req.scope.surface!==binding.surface||req.scope.pageId!==binding.pageId)throw Error('Foreign original source');const goalHash=await integrity.sha256(stableJson({inputDigest:req.digest,requestDigest:req.requestDigest}));expectation={...req,goalHash,fresh:false};const ack=await rpc('busy_ai_reserve_v1',{...args,p_model:req.model,p_feature:'website-design',p_binding:binding,p_goal_hash:goalHash});expectation.fresh=ack.fresh===true;if(!expectation.fresh)throw Error('Existing operation; inspect without replay');const r=await read();if(r.maximumMicroGBP/1e6<req.estimatedGBP||r.maximumMicroGBP>100000||r.pricing.max_input>4000||r.pricing.max_input<req.inputTokens||r.pricing.max_output!==1000||String(r.tariffRevision)!==String(req.tariffRevision)||Date.parse(r.createdAt)+30000<=clock())throw Error('Original admission does not cover exact bounded request');return {operationId};},
  readReservation:async()=>normal(await read()),
  dispatch:async()=>rpc('busy_ai_dispatch_v1',args),
  finish:async(_admitted,result)=>rpc('busy_ai_finish_v1',{...args,p_outcome:result.outcome,p_input:result.inputTokens??null,p_output:result.outputTokens??null,p_receipt:result.providerReceipt??null}),
  readReceipt:async()=>normal(await read())
 };
}
