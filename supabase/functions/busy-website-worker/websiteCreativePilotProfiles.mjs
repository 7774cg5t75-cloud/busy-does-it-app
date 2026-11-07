// Shared finite receipt/wire bounds. The SERVER selects the profile; knowing
// these public constants grants no provider, financial, review or save authority.
export const CREATIVE_DOCUMENT_REVISED_PROFILE='busy.quiet-light-comparison.v1';
const historical=Object.freeze({budgetProfile:null,inputTokens:4000,outputTokens:4000,maximumGBP:.10,requests:1,retries:0,reasoning:'low',responseTimeoutMs:60000});
const revised=Object.freeze({
 'gpt-6.1-sol':Object.freeze({budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,inputTokens:8000,outputTokens:12000,maximumGBP:.25,requests:1,retries:0,reasoning:'medium',responseTimeoutMs:120000}),
 'gpt-6-astra':Object.freeze({budgetProfile:CREATIVE_DOCUMENT_REVISED_PROFILE,inputTokens:8000,outputTokens:12000,maximumGBP:1,requests:1,retries:0,reasoning:'medium',responseTimeoutMs:120000})
});
export function creativeDocumentPilotProfile(model,budgetProfile){
 if(budgetProfile===undefined||budgetProfile===null)return historical;
 return budgetProfile===CREATIVE_DOCUMENT_REVISED_PROFILE&&Object.hasOwn(revised,model)?revised[model]:null;
}
