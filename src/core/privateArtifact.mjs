import {validateCalculation,calculatePrivateRules} from './privateCalculation.mjs';
import {validatePrivateForm,evaluatePrivateForm} from './privateForm.mjs';
import {stableJson} from './stableJson.mjs';
export const validatePrivateArtifact=spec=>spec?.kind==='private-form'?validatePrivateForm(spec):validateCalculation(spec);
export const evaluatePrivateArtifact=(spec,values)=>spec?.kind==='private-form'?evaluatePrivateForm(spec,values):calculatePrivateRules(spec,values);
export function privateArtifactExamplesMatch(spec){return spec.cases.every(c=>{const r=evaluatePrivateArtifact(spec,spec.kind==='private-form'?c.values:c.inputs);return r.ok&&(spec.kind!=='private-form'||r.valid===c.valid)&&stableJson(r.outputs)===stableJson(spec.kind==='private-form'?c.outputs:c.expected);});}
export function reopenPrivateArtifactDraft(spec,context){
 const valid=validatePrivateArtifact(spec),s=context?.scope;if(!valid.ok||!context?.ok||['ownerId','businessId','projectId'].some(k=>spec.scope[k]!==s[k])||spec.scope.sourceRevision>s.sourceRevision)return {ok:false,reason:'Open the exact current owned App and original artifact.'};
 const scope=Object.fromEntries(['ownerId','businessId','projectId','sourceRevision'].map(k=>[k,s[k]])),next=JSON.parse(stableJson(valid.spec));next.scope=scope;if(next.kind==='private-form'&&next.calculation)next.calculation.scope=scope;return validatePrivateArtifact(next);
}
