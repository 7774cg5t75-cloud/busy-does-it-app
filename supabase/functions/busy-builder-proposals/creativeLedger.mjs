import {stableJson} from '../../../src/core/stableJson.mjs';
import {creativeDocumentPilotProfile} from './creativeDocumentPilotProfiles.mjs';
// Exact original service-only RPCs. Readback proposal is separate and uninstalled.
function originalCreativeLedger({rpc,actor,business,binding,operationId,requestNonce,integrity,clock=()=>Date.now()},maximumOutputTokens,documentProfile=null,expectedModel=null){
 let expectation=null,ownsFreshReservation=false;
 const maximumInputTokens=documentProfile?.inputTokens??4000,maximumMicroGBP=Math.round((documentProfile?.maximumGBP??.10)*1e6);
 const requestBudgetValid=req=>Number.isSafeInteger(req?.inputTokens)&&req.inputTokens>=1&&req.inputTokens<=maximumInputTokens&&Number.isFinite(req.estimatedGBP)&&req.estimatedGBP>=0&&req.estimatedGBP<=maximumMicroGBP/1e6;
 const outputMismatch=pricing=>maximumOutputTokens===1000?pricing.max_output!==1000:pricing.max_output!==maximumOutputTokens;
 // The original legacy bridge omitted this request field and relied on its
 // independently read 1,000-output tariff. Keep that contract; an explicitly
 // supplied incompatible limit is still denied. Revised v2 is server-selected.
 const requestOutputMismatch=request=>maximumOutputTokens===1000?Object.hasOwn(request,'maxOutputTokens')&&request.maxOutputTokens!==1000:request.maxOutputTokens!==maximumOutputTokens;
 // Admission must cover EACH all-in tariff axis, not merely the same combined
 // ceiling with underpriced input/overpriced output. These are independent
 // readback checks of original immutable tariff fields, never another ledger.
 const documentPricingCovered=(pricing,request)=>{
  if(maximumOutputTokens===1000)return true;
  if(pricing.max_input!==maximumInputTokens||!['input_micro_per_1000','output_micro_per_1000','fx_gbp_ppm','buffer_bps'].every(key=>Number.isFinite(pricing[key])&&pricing[key]>=0)||pricing.fx_gbp_ppm<=0||![request.tariffInputGBPPerMillion,request.tariffOutputGBPPerMillion].every(value=>Number.isFinite(value)&&value>=0))return false;
  const microCost=(input,output)=>Math.ceil((input*pricing.input_micro_per_1000+output*pricing.output_micro_per_1000)/1000*pricing.fx_gbp_ppm/1e6*(10000+pricing.buffer_bps)/10000);
  return microCost(maximumInputTokens,0)>=Math.ceil(maximumInputTokens*request.tariffInputGBPPerMillion)&&microCost(0,maximumOutputTokens)>=Math.ceil(maximumOutputTokens*request.tariffOutputGBPPerMillion);
 };
 const args={p_actor:actor,p_business:business,p_operation:operationId,p_request_nonce:requestNonce};
 const read=async()=>{if(!expectation)throw Error('No admitted request');const r=await rpc('busy_ai_operation_read_v1',args);if(r.operationId!==operationId||r.goalHash!==expectation.goalHash||r.model!==expectation.model||stableJson(r.binding)!==stableJson(binding))throw Error('Receipt identity mismatch');return r;};
 const normal=r=>({operationId,scope:expectation.scope,status:r.state==='reserved'?'reserved-undispatched':r.state,attempts:r.attempts,...(documentProfile?.budgetProfile?{budgetProfile:documentProfile.budgetProfile}: {}),inputDigest:expectation.digest,requestDigest:expectation.requestDigest,provider:expectation.provider,model:r.model,tariffRevision:String(r.tariffRevision),admittedGBP:r.maximumMicroGBP/1e6,actualGBP:r.actualMicroGBP==null?null:r.actualMicroGBP/1e6,inputTokens:r.inputTokens,outputTokens:r.outputTokens,providerReceipt:r.providerReceipt,overrun:r.actualMicroGBP>r.maximumMicroGBP,expiresAt:Date.parse(r.createdAt)+30000,fresh:expectation.fresh,authoritativeReadback:true,realUsageSettlementSupported:true});
 return {
  reserve:async req=>{ownsFreshReservation=false;if(!requestBudgetValid(req)||req.operationId!==operationId||requestOutputMismatch(req)||documentProfile?.budgetProfile&&(req.budgetProfile!==documentProfile.budgetProfile||req.model!==expectedModel)||req.scope?.ownerId!==actor||req.scope.businessId!==business||req.scope.projectId!==binding.projectId||req.scope.sourceRevision!==binding.sourceRevision||req.scope.profileRevision!==binding.profileRevision||req.scope.surface!==binding.surface||req.scope.pageId!==binding.pageId)throw Error('Foreign original source or protocol');const goalHash=await integrity.sha256(stableJson({inputDigest:req.digest,requestDigest:req.requestDigest}));expectation={...req,goalHash,fresh:false};const ack=await rpc('busy_ai_reserve_v1',{...args,p_model:req.model,p_feature:'website-design',p_binding:binding,p_goal_hash:goalHash});expectation.fresh=ack.fresh===true;ownsFreshReservation=expectation.fresh;if(!expectation.fresh)throw Error('Existing operation; inspect without replay');const r=await read();if(!Number.isSafeInteger(r.pricing?.max_input)||!Number.isSafeInteger(r.maximumMicroGBP)||r.maximumMicroGBP<0||r.maximumMicroGBP/1e6<req.estimatedGBP||r.maximumMicroGBP>maximumMicroGBP||r.pricing.max_input>maximumInputTokens||r.pricing.max_input<req.inputTokens||outputMismatch(r.pricing)||!documentPricingCovered(r.pricing,req)||String(r.tariffRevision)!==String(req.tariffRevision)||Date.parse(r.createdAt)+30000<=clock())throw Error('Original admission does not cover exact bounded request');return {operationId};},
  readReservation:async()=>normal(await read()),
  dispatch:async()=>rpc('busy_ai_dispatch_v1',args),
  finish:async(_admitted,result)=>{if(!ownsFreshReservation)throw Error('No fresh reservation acknowledgement; inspect without replay');return rpc('busy_ai_finish_v1',{...args,p_outcome:result.outcome,p_input:result.inputTokens??null,p_output:result.outputTokens??null,p_receipt:result.providerReceipt??null});},
  readReceipt:async()=>normal(await read())
 };
}
// Fixed server-owned protocol wrappers, not a client-selected token allowance.
// Both use the SAME original reserve/dispatch/finish/receipt RPCs and ledger.
export function createOriginalCreativeLedger(options){return originalCreativeLedger(options,1000);}
export function createOriginalCreativeDocumentLedger(options){const profile=creativeDocumentPilotProfile(options.model,options.budgetProfile);if(!profile)throw Error('Unsupported server-owned document pilot profile');return originalCreativeLedger(options,profile.outputTokens,profile,options.model);}
