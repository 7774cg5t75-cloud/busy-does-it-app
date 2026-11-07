import {stableJson} from '../../../src/core/stableJson.mjs';

// Comparison APPROVAL metadata only. This is not an authentication boundary,
// account/tariff author, spending store, reservation or provider dispatcher.
// The caller must already have verified the current owner approval, source,
// deployment and renderer. Original central reserve/dispatch/finish/readback
// remain mandatory, including their account/feature/platform aggregate caps.
export const CREATIVE_COMPARISON_APPROVAL_VERSION='busy.creative-comparison-approval.v1';
export const CREATIVE_COMPARISON_PROFILE='busy.quiet-light-comparison.v1';
const SOL='gpt-6.1-sol',ASTRA='gpt-6-astra';
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value);
const integer=(value,min,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(value)&&value>=min&&value<=max;
const safeString=(value,max)=>typeof value==='string'&&value.length>0&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value);
const record=(value,keys)=>{
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.getOwnPropertySymbols(value).length)return false;
 const descriptors=Object.getOwnPropertyDescriptors(value);
 return Object.keys(descriptors).sort().join(',')===[...keys].sort().join(',')&&Object.values(descriptors).every(d=>Object.hasOwn(d,'value'));
};
const dataOnly=value=>{
 let nodes=0;const seen=new Set();
 const walk=(item,depth=0)=>{
  if(++nodes>1024||depth>12)return false;
  if(item===null||typeof item==='boolean')return true;
  if(typeof item==='string')return item.length<=2000000;
  if(typeof item==='number')return Number.isFinite(item);
  if(!item||typeof item!=='object'||seen.has(item)||![Object.prototype,Array.prototype].includes(Object.getPrototypeOf(item))||Object.getOwnPropertySymbols(item).length)return false;
  seen.add(item);const descriptors=Object.getOwnPropertyDescriptors(item);
  return Object.values(descriptors).every(d=>Object.hasOwn(d,'value')&&walk(d.value,depth+1));
 };
 return walk(value);
};
const sourceKeys=['websiteId','generation','profileRevision','snapshotRevision'];
const comparisonKeys=['version','comparisonId','ownerId','businessId','sourceStampDigest','sourceInputDigest','schemaDigest','rendererDigest','source','period','expiresAt','maximumGBP','sol','astra'];
const armKeys=['model','operationId','requestNonce'];
const bindingKeys=['surface','pageId','projectId','sourceRevision','profileRevision','snapshotRevision'];
const deny=reason=>({ok:false,reason,centralAdmissionRequired:true,providerCalls:0,sourceWrites:0});

/**
 * Validate a CLOSED, already owner-reviewed two-operation plan. The receipt
 * port must read the ORIGINAL service-only busy_ai_operation_read_v1 once,
 * using the supplied Sol operation/nonce under the current owner/business.
 * It must retain the runtime's bounded original RPC timeout. No generic model
 * response, public request body or historical B3 approval may supply this plan.
 */
export async function validateCreativeComparisonAdmission({comparison,current,prepared,projection,solProjection,operationId,requestNonce,binding,expectedRendererDigest,now,estimatedGBP,readReceipt,digestBytes}={}){
 try{
  if(!dataOnly(comparison)||!dataOnly(binding)||!record(comparison,comparisonKeys)||!record(comparison.source,sourceKeys)||!record(comparison.sol,armKeys)||!record(comparison.astra,armKeys)||!record(binding,bindingKeys))return deny('invalid-comparison-shape');
  // Check data properties before cloning, so a supplied getter cannot run.
  const plan=structuredClone(comparison),originalBinding=structuredClone(binding);
  if(plan.version!==CREATIVE_COMPARISON_APPROVAL_VERSION||plan.maximumGBP!==3||![plan.comparisonId,plan.ownerId,plan.businessId,plan.sol.operationId,plan.sol.requestNonce,plan.astra.operationId,plan.astra.requestNonce].every(uuid)||new Set([plan.comparisonId,plan.sol.operationId,plan.sol.requestNonce,plan.astra.operationId,plan.astra.requestNonce]).size!==5)return deny('invalid-comparison-identity');
  if(plan.sol.model!==SOL||plan.astra.model!==ASTRA||!uuid(operationId)||!uuid(requestNonce))return deny('invalid-comparison-model');
  if(!integer(now,1)||!integer(plan.expiresAt,1)||plan.expiresAt<=now||plan.expiresAt>now+3600000)return deny('expired-comparison');
  const date=new Date(now),period=date.toISOString().slice(0,7)+'-01',periodEnd=Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1);
  if(plan.period!==period||plan.expiresAt>=periodEnd)return deny('comparison-period-mismatch');
  if(![plan.sourceStampDigest,plan.sourceInputDigest,plan.schemaDigest,plan.rendererDigest,expectedRendererDigest].every(hash)||plan.rendererDigest!==expectedRendererDigest||typeof digestBytes!=='function')return deny('comparison-renderer-mismatch');
  if(current?.ownerId!==plan.ownerId||current.businessId!==plan.businessId||!safeString(current.website?.id,180)||!integer(current.website.generation,1)||!integer(current.profileRevision,1)||!safeString(prepared?.sourceStamp,2000000))return deny('comparison-source-mismatch');
  if(originalBinding.surface!=='website'||originalBinding.pageId!=='home'||originalBinding.projectId!==current.website.id||originalBinding.sourceRevision!==current.website.generation||originalBinding.profileRevision!==current.profileRevision||!integer(originalBinding.snapshotRevision,1)||stableJson(plan.source)!==stableJson({websiteId:current.website.id,generation:current.website.generation,profileRevision:current.profileRevision,snapshotRevision:originalBinding.snapshotRevision}))return deny('comparison-source-mismatch');
  if(await digestBytes(prepared.sourceStamp)!==plan.sourceStampDigest||prepared.inputDigest!==plan.sourceInputDigest)return deny('comparison-source-mismatch');
  const validProjection=(p,model,ceiling)=>p?.ok===true&&p.model===model&&p.budgetProfile===CREATIVE_COMPARISON_PROFILE&&p.inputDigest===plan.sourceInputDigest&&p.schemaDigest===plan.schemaDigest&&p.sourceStamp===prepared.sourceStamp&&hash(p.envelopeDigest)&&hash(p.requestDigest)&&p.limits?.inputTokens===8000&&p.limits.outputTokens===12000&&p.limits.maximumGBP===ceiling&&p.limits.requests===1&&p.limits.retries===0;
  if(!validProjection(solProjection,SOL,.25))return deny('comparison-projection-mismatch');
  const arm=projection?.model===SOL?'sol':projection?.model===ASTRA?'astra':null;
  const maximumMicroGBP=arm==='sol'?250000:1000000;
  if(!arm||!validProjection(projection,arm==='sol'?SOL:ASTRA,maximumMicroGBP/1e6)||plan[arm].operationId!==operationId||plan[arm].requestNonce!==requestNonce)return deny('comparison-operation-mismatch');
  if(!Number.isFinite(estimatedGBP)||estimatedGBP<=0||Math.ceil(estimatedGBP*1e6)>maximumMicroGBP)return deny('comparison-request-ceiling');
  if(arm==='sol')return {ok:true,comparisonId:plan.comparisonId,period,arm,operationId,priorCostMicroGBP:0,maximumCurrentMicroGBP:maximumMicroGBP,maximumComparisonLiabilityMicroGBP:maximumMicroGBP,aggregateCeilingMicroGBP:3000000,centralAdmissionRequired:true,providerCalls:0,sourceWrites:0};
  if(typeof readReceipt!=='function')return deny('comparison-sol-receipt-unavailable');
  // ONE independently read original receipt, never a second dispatch or a
  // request to repair/release an uncertain earlier Sol operation.
  const receipt=await readReceipt({operationId:plan.sol.operationId,requestNonce:plan.sol.requestNonce});
  const requiredReceipt=['operationId','state','attempts','model','goalHash','binding','maximumMicroGBP','actualMicroGBP','inputTokens','outputTokens','providerReceipt','pricing','createdAt'];
  if(!dataOnly(receipt)||!record(receipt,[...requiredReceipt,'tariffRevision']))return deny('comparison-sol-receipt-invalid');
  const prior=structuredClone(receipt);
  const expectedGoal=await digestBytes(stableJson({inputDigest:solProjection.envelopeDigest,requestDigest:solProjection.requestDigest}));
  if(prior.operationId!==plan.sol.operationId||prior.state!=='settled'||prior.attempts!==1||prior.model!==SOL||!integer(prior.tariffRevision,1)||!hash(expectedGoal)||prior.goalHash!==expectedGoal||!record(prior.binding,bindingKeys)||stableJson(prior.binding)!==stableJson(originalBinding))return deny('comparison-sol-receipt-invalid');
  if(!integer(prior.maximumMicroGBP,1,250000)||!integer(prior.actualMicroGBP,0,prior.maximumMicroGBP)||!integer(prior.inputTokens,1,8000)||!integer(prior.outputTokens,0,12000)||typeof prior.providerReceipt!=='string'||!/^resp_[A-Za-z0-9_-]{1,145}$/.test(prior.providerReceipt)||prior.pricing?.max_input!==8000||prior.pricing.max_output!==12000)return deny('comparison-sol-liability-unresolved');
  const createdAt=Date.parse(prior.createdAt);
  if(!Number.isFinite(createdAt)||createdAt>now||new Date(createdAt).toISOString().slice(0,7)+'-01'!==period)return deny('comparison-sol-receipt-period');
  const maximumComparisonLiabilityMicroGBP=prior.actualMicroGBP+maximumMicroGBP;
  if(maximumComparisonLiabilityMicroGBP>3000000)return deny('comparison-aggregate-ceiling');
  return {ok:true,comparisonId:plan.comparisonId,period,arm,operationId,priorCostMicroGBP:prior.actualMicroGBP,maximumCurrentMicroGBP:maximumMicroGBP,maximumComparisonLiabilityMicroGBP,aggregateCeilingMicroGBP:3000000,centralAdmissionRequired:true,providerCalls:0,sourceWrites:0};
 }catch{return deny('comparison-inspect-only');}
}
