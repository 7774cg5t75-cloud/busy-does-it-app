import {connectedBuilderObservation} from './connectedBuilderObservation.mjs';
import {stableJson} from './stableJson.mjs';
// A finite owner statement, not inference of trading facts from a marketing goal.
export function introductionProposal(text,profile={}){
 if(typeof text!=='string'||text.length>400||/[<>\u0000-\u001f]/.test(text))return {ok:false,reason:'Use a short plain-language introduction.'};
 const match=/^I run (?:a|an) ([a-z][a-z &/-]{1,80}?)\.?\s*(?:I need|and need) a professional website\.?$/i.exec(text.trim());
 if(!match)return {ok:false,reason:'Tell me the business type, or edit the exact details below. Nothing has been guessed.'};
 return {ok:true,profile:{...profile,businessType:match[1].trim()},requiresOwnerApproval:true,explanation:'Only the business type you stated is proposed. Your business name, services, contact details and existing wording are kept.'};
}
export function businessIntroductionQuestions(profile,{forWebsite=false}={}){
 const p=profile||{},questions=[];
 if(!String(p.businessName||'').trim())questions.push({field:'businessName',label:'What is your business called?'});
 if(!String(p.description||'').trim()&&!p.services?.some(s=>s.name?.trim()))questions.push({field:'description',label:'What do you offer, and who is it for?'});
 if(forWebsite&&!p.services?.some(s=>s.name?.trim()))questions.push({field:'services',label:'What is the first service you want customers to understand? Add it under service descriptions.'});
 if(!p.contact?.email&&!p.contact?.phone)questions.push({field:'contact',label:'How should customers contact you? Add a public email or phone when you are ready.'});
 return questions;
}
export function reviewBusinessIntroduction(basis,{ownerId,businessId,profile}){
 const first=!!ownerId&&!!businessId&&basis?.actorId===ownerId&&basis.businessId===businessId&&Number.isSafeInteger(basis.revision)&&basis.revision>=1&&basis.profile===null&&basis.profileRevision===null&&basis.profileHash===null&&basis.websiteDraft===null&&basis.websiteDraftHash===null&&!basis.operationId&&basis.ownOperationReceipt!==true;
 if(!(first||connectedBuilderObservation(basis,{ownerId,businessId},'profile'))||!profile||typeof profile!=='object'||Array.isArray(profile)||businessIntroductionQuestions(profile).some(q=>q.field!=='contact'))return {ok:false,reason:'Review the current account and the essential business details first.'};
 const allowed=['businessName','businessType','tagline','description','serviceArea','services','contact','toneOfVoice'];
 if(Object.keys(profile).some(k=>!allowed.includes(k)))return {ok:false,reason:'Use the original supported business details.'};
 return {ok:true,basis,profile:JSON.parse(stableJson(profile)),sourceRevision:basis.profileRevision,requiresOwnerApproval:true,existingDraftsUnchanged:true};
}
