import {connectedBuilderObservation} from './connectedBuilderObservation.mjs';
import {stableJson} from './stableJson.mjs';
export function websiteCopySuggestions(basis,{ownerId,businessId,website}){
 if(!connectedBuilderObservation(basis,{ownerId,businessId},'profile')||stableJson(basis.websiteDraft)!==stableJson(website))return {ok:false,reason:'Reopen current approved business details before suggesting wording.'};
 const p=basis.profile,names=(p.services||[]).map(s=>s.name).filter(Boolean).slice(0,2),choices=[p.tagline,names.length?names.join(' & ')+(p.serviceArea?' — '+p.serviceArea:''):'',p.businessName].filter(s=>typeof s==='string'&&s.trim()&&s.length<=140&&!/[<>\u0000-\u001f]/.test(s));
 return {ok:true,choices:[...new Set(choices)].map(headline=>({headline,explanation:'Suggested presentation of your approved words; review before using. This does not change shared business facts.'})),sourceRevision:basis.profileRevision,sourceHash:basis.profileHash,requiresOwnerApproval:true};
}
