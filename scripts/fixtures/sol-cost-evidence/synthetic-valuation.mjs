// Engineering fixture ONLY. These receipt/pricing hashes and approvals are
// invented test inputs, never evidence of a real account or owner permission.
import {SOL_USAGE_VALUATION_BASIS,SOL_USAGE_VALUATION_WIRE} from '../../../supabase/functions/busy-builder-proposals/creativeDocumentCostEvidence.mjs';
export function syntheticSolUsageValuationTariff(now){return {
 provider:'openai-responses',model:'gpt-6.1-sol',currency:'GBP',independentlyVerified:true,
 evidenceBasis:SOL_USAGE_VALUATION_BASIS,allFeesIncluded:false,fxTaxFeesVerified:false,cashCostVerified:false,
 modelAvailable:true,availabilityVerified:true,highestApplicableRates:true,cacheWriteCovered:true,
 serviceTier:'default',regionalProcessing:false,caching:false,fixedRequestGBP:0,
 rateBasis:'owner-approved-sol-usage-valuation',inputGBPPerMillion:7.7,outputGBPPerMillion:15.4,
 revision:'1',reference:'SYNTHETIC_SOL_USAGE_VALUATION_NOT_REAL_EVIDENCE',checkedAt:now,
 rateEvidence:{independentlyVerified:true,coversCacheWrite:true,coversFXTaxAndFees:false,reference:'SYNTHETIC official-rate/policy evidence, no actual cash verification'},
 valuationPolicy:{ownerDecisionSha256:'a'.repeat(64),ownerApproved:true,model:'gpt-6.1-sol',wireDigest:SOL_USAGE_VALUATION_WIRE,inputTokenLimit:8000,totalOutputTokenLimit:12000,serviceTier:'default',maximumRequests:1,automaticRetries:0,tools:0,inputUSDPerMillion:5,outputUSDPerMillion:10,bufferBps:1000,gbpPerUSD:1.4,maximumUSD:.176,maximumUsageValuationGBP:.2464,accountingOnly:true,historicalCashCostVerified:false},
 officialTariffEvidence:{provider:'openai-responses',model:'gpt-6.1-sol',serviceTier:'default',inputUSDPerMillion:5,outputUSDPerMillion:10,highestApplicableRates:true,cacheWriteCovered:true,regionalProcessing:false,checkedAt:now,reference:'SYNTHETIC_OFFICIAL_PRICE_CAPTURE_NOT_GENUINE',sha256:'b'.repeat(64),independentlyVerified:true}
};}
