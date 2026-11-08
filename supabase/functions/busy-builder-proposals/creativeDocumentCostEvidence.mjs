// A narrow owner-approved accounting policy for ONE exact Sol request. This
// never verifies historical cash cost, grants execution, or replaces the
// original central reservation/settlement/unknown-outcome authorities.
import {CREATIVE_DOCUMENT_REVISED_PROFILE} from './creativeDocumentPilotProfiles.mjs';
export const SOL_USAGE_VALUATION_BASIS='owner-approved-sol-usage-valuation.v1';
export const SOL_USAGE_VALUATION_REFERENCE_PREFIX='SOL_USAGE_VALUATION_V1:';
export const SOL_USAGE_VALUATION_WIRE='34d7a83cb0a6056f256af60f7d639acfd09f895fbf286e86898654b42b0aeb33';
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const fresh=(x,now)=>Number.isSafeInteger(x)&&x<=now&&now-x<=86400000;
const text=x=>typeof x==='string'&&x.length>=8&&x.length<=500&&!/[\x00-\x1f\x7f]/.test(x);
const dataOnly=value=>{
 let nodes=0;const seen=new Set();
 const walk=(x,depth=0)=>{
  if(++nodes>250||depth>8)return false;
  if(x===null||typeof x==='boolean')return true;
  if(typeof x==='number')return Number.isFinite(x);
  if(typeof x==='string')return x.length<=2000;
  if(!x||typeof x!=='object'||seen.has(x)||Object.getPrototypeOf(x)!==Object.prototype||Object.getOwnPropertySymbols(x).length)return false;
  seen.add(x);return Object.values(Object.getOwnPropertyDescriptors(x)).every(d=>Object.hasOwn(d,'value')&&walk(d.value,depth+1));
 };return walk(value);
};
const exact=(x,keys)=>x&&Object.keys(x).sort().join(',')===[...keys].sort().join(',');
export function reviewSolUsageValuation(tariff,{model,wireDigest,budgetProfile,inputTokenLimit,totalOutputTokenLimit,now}={}){
 const deny=()=>({ok:false,evidenceBasis:SOL_USAGE_VALUATION_BASIS,cashCostVerified:false,executionAuthorized:false});
 try{
  if(!dataOnly(tariff)||model!=='gpt-6.1-sol'||wireDigest!==SOL_USAGE_VALUATION_WIRE||budgetProfile!==CREATIVE_DOCUMENT_REVISED_PROFILE||inputTokenLimit!==8000||totalOutputTokenLimit!==12000||!Number.isSafeInteger(now))return deny();
  const t=tariff,p=t.valuationPolicy,o=t.officialTariffEvidence;
  if(t.evidenceBasis!==SOL_USAGE_VALUATION_BASIS||t.currency!=='GBP'||t.independentlyVerified!==true||t.allFeesIncluded!==false||t.fxTaxFeesVerified!==false||t.cashCostVerified!==false||t.highestApplicableRates!==true||t.cacheWriteCovered!==true||t.fixedRequestGBP!==0||t.serviceTier!=='default'||t.regionalProcessing!==false||t.caching!==false||t.rateBasis!=='owner-approved-sol-usage-valuation'||t.inputGBPPerMillion!==7.7||t.outputGBPPerMillion!==15.4||!fresh(t.checkedAt,now)||!text(t.reference))return deny();
  if(t.rateEvidence?.independentlyVerified!==true||t.rateEvidence.coversCacheWrite!==true||t.rateEvidence.coversFXTaxAndFees!==false||!text(t.rateEvidence.reference))return deny();
  if(!exact(p,['ownerDecisionSha256','ownerApproved','model','wireDigest','inputTokenLimit','totalOutputTokenLimit','serviceTier','maximumRequests','automaticRetries','tools','inputUSDPerMillion','outputUSDPerMillion','bufferBps','gbpPerUSD','maximumUSD','maximumUsageValuationGBP','accountingOnly','historicalCashCostVerified'])||!sha(p.ownerDecisionSha256)||p.ownerApproved!==true||p.model!==model||p.wireDigest!==wireDigest||p.inputTokenLimit!==8000||p.totalOutputTokenLimit!==12000||p.serviceTier!=='default'||p.maximumRequests!==1||p.automaticRetries!==0||p.tools!==0||p.inputUSDPerMillion!==5||p.outputUSDPerMillion!==10||p.bufferBps!==1000||p.gbpPerUSD!==1.4||p.maximumUSD!==.176||p.maximumUsageValuationGBP!==.2464||p.accountingOnly!==true||p.historicalCashCostVerified!==false)return deny();
  if(!exact(o,['provider','model','serviceTier','inputUSDPerMillion','outputUSDPerMillion','highestApplicableRates','cacheWriteCovered','regionalProcessing','checkedAt','reference','sha256','independentlyVerified'])||o.provider!=='openai-responses'||o.model!==model||o.serviceTier!=='default'||o.inputUSDPerMillion!==5||o.outputUSDPerMillion!==10||o.highestApplicableRates!==true||o.cacheWriteCovered!==true||o.regionalProcessing!==false||!fresh(o.checkedAt,now)||o.checkedAt>t.checkedAt||!text(o.reference)||!sha(o.sha256)||o.independentlyVerified!==true)return deny();
  return {ok:true,evidenceBasis:SOL_USAGE_VALUATION_BASIS,ownerDecisionSha256:p.ownerDecisionSha256,officialTariffEvidenceSha256:o.sha256,maximumMicroGBP:246400,maximumUsageValuationGBP:.2464,maximumUSD:.176,cashCostVerified:false,allFeesIncluded:false,fxTaxFeesVerified:false,executionAuthorized:false};
 }catch{return deny();}
}

// Existing immutable native tariff evidence_reference, not a new ledger field.
export function solUsageValuationTariffReference(review){
 if(review?.ok!==true||review.evidenceBasis!==SOL_USAGE_VALUATION_BASIS||!sha(review.ownerDecisionSha256)||!sha(review.officialTariffEvidenceSha256))throw Error('Validated one-Sol valuation evidence required');
 return SOL_USAGE_VALUATION_REFERENCE_PREFIX+review.ownerDecisionSha256+':'+review.officialTariffEvidenceSha256;
}
