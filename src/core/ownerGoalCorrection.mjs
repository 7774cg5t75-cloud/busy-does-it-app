import {connectedBuilderObservation} from './connectedBuilderObservation.mjs';
import {stableJson} from './stableJson.mjs';
// Interpret only explicit owner statements. A proposal is not approved memory.
export function classifyOwnerCorrection(text){
 if(typeof text!=='string'||text.length>400||/[<>\u0000-\u001f\u007f]/.test(text))return null;
 const value=text.normalize('NFKC').replace(/[’‘]/g,"'").trim().replace(/[.!?]+$/,'');
 const area=/^(?:i (?:normally|usually) work|we (?:normally|usually) work) within ([0-9]{1,3}) miles?$/i.exec(value);
 if(area){const miles=Number(area[1]);return miles>=1&&miles<=250?{kind:'service-area',field:'serviceArea',value,scope:'future-approved-facts',explanation:'Keep this exact owner-reported service area. A starting point or guaranteed coverage is not inferred.'}:null;}
 if(/^(?:please )?(?:don't|do not|never) use that slogan again$/i.test(value))return {kind:'clear-tagline',field:'tagline',value:'',scope:'future-approved-facts',explanation:'Review removing the current approved short promise below. Existing website, App and Creator wording stays unchanged. This is not a general banned-phrase list.'};
 if(/^i prefer\b/i.test(value)&&/\b(shorter|friendlier|friendly|concise|warm)\b/i.test(value))return {kind:'wording-guidance',scope:'task-only-until-supported',explanation:'Choose the writing treatment in Content Creator for this draft. A lasting combined writing preference is not connected to the approved account contract yet.'};
 if(/^(?:make|i prefer)\b/i.test(value)&&/\b(websites?|designs?)\b/i.test(value)&&/\b(colou?rful|colou?rs?)\b/i.test(value))return {kind:'design-guidance',scope:'needs-choice',explanation:'Which approved colours would you like to use? A general request does not change branding or save a lasting rule.'};
 return null;
}
export function prepareOwnerGoalCorrection(text,basis,{ownerId,businessId}){
 const intent=classifyOwnerCorrection(text);
 if(!intent||intent.scope!=='future-approved-facts')return {ok:false,reason:intent?.explanation||'Describe the exact business detail you want to correct.'};
 if(!connectedBuilderObservation(basis,{ownerId,businessId},'profile'))return {ok:false,reason:'Inspect your current approved business details first.'};
 if(intent.kind==='clear-tagline'&&!basis.profile.tagline)return {ok:false,reason:'There is no approved short promise to remove. Other saved wording has not been changed.'};
 const profile={...basis.profile,[intent.field]:intent.value};if(stableJson(profile)===stableJson(basis.profile))return {ok:false,reason:'This exact correction is already in your approved details.'};
 return {ok:true,intent,profile,before:basis.profile[intent.field]||'',after:intent.value,sourceRevision:basis.profileRevision,sourceStamp:stableJson(basis.profile),requiresOwnerApproval:true,existingDraftsUnchanged:true};
}
