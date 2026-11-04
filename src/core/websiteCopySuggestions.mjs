import {connectedBuilderObservation} from './connectedBuilderObservation.mjs';
import {stableJson} from './stableJson.mjs';
export function websiteCopySuggestions(basis,{ownerId,businessId,website}){
 if(!connectedBuilderObservation(basis,{ownerId,businessId},'profile')||stableJson(basis.websiteDraft)!==stableJson(website))return {ok:false,reason:'Reopen current approved business details before suggesting wording.'};
 const p=basis.profile,names=(p.services||[]).map(s=>s.name).filter(Boolean).slice(0,2),choices=[p.tagline,names.length?names.join(' & ')+(p.serviceArea?' — '+p.serviceArea:''):'',p.businessName].filter(s=>typeof s==='string'&&s.trim()&&s.length<=140&&!/[<>\u0000-\u001f]/.test(s));
 const firstSentence=String(p.description||'').match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0]?.trim();if(firstSentence&&firstSentence.length<=140&&!/["<>\u0000-\u001f]/.test(firstSentence))choices.push(firstSentence);
 const contentOptions=[];
 if(typeof p.description==='string'&&p.description.length<=800&&p.description.trim()&&!/["<>\u0000-\u001f]/.test(p.description))contentOptions.push({kind:'introduction',text:p.description,label:'Explain what you offer',source:'Exact approved business description'});
 if(names.length&&String(names[0]).length<=110)contentOptions.push({kind:'actionLabel',text:'Ask about '+names[0],label:'Make the next step specific',source:'Approved first service name; a suggested enquiry label, not a transaction'});
 if(('The thinking behind '+p.businessName).length<=140&&website.sections?.some(s=>s.id==='about'&&s.enabled!==false))contentOptions.push({kind:'storyHeading',text:'The thinking behind '+p.businessName,label:'Give your story its own introduction',source:'Suggested presentation heading using the approved business name; not a founding-history claim'});
 return {ok:true,choices:[...new Set(choices)].map(headline=>({headline,explanation:'Suggested presentation of your approved words; review before using. This does not change shared business facts.'})),contentOptions,sourceRevision:basis.profileRevision,sourceHash:basis.profileHash,websiteId:website.id,websiteGeneration:website.generation,requiresOwnerApproval:true};
}

// Optional gaps in the current channel, never a new business-profile store.
// Owner words are saved only through the existing Website Studio review.
export function websiteStoryQuestions(website){
 const visible=(website?.sections||[]).filter(s=>s.enabled!==false),story=visible.find(s=>s.id==='about'),services=visible.find(s=>s.type==='services');
 const essentials=[];if(!visible.some(s=>s.type==='contact'&&(s.email||s.phone)))essentials.push('What public email or phone should customers use?');
 const optional=[];if(story&&(!story.body||story.body.length<100||/^Contact|^Owner supplied/i.test(story.body)))optional.push('What would you like customers to know about your approach? Your own story or way of working is useful; it is optional.');
 const missing=services?.items?.find(i=>!i.body||/^Owner supplied scope|^Contact us to discuss/i.test(i.body));if(missing)optional.push('What does “'+missing.title+'” involve for your customer? Add a description in the original service editor when useful.');
 return {essentials,optional,existingWordsKept:true,requiresReview:true,neverInfersFacts:true};
}
