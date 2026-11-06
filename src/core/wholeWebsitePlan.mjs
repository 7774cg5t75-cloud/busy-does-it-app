import {stableJson} from './stableJson.mjs';
import {websiteRequestContent} from './websiteRequestPlan.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
import {websitePhotoSourcesCurrent} from './websitePhotoReview.mjs';
import {wholeSiteServices,wholeSiteBasePageIds,wholeSiteDerivedSourcesCurrent,wholeSiteContentCurrent} from '../../supabase/functions/busy-website-worker/websiteWholeSite.mjs';
const clock=()=>globalThis.performance?.now?.()??Date.now();
const byteLength=s=>{let n=0;for(const c of s){const p=c.codePointAt(0);n+=p<=127?1:p<=2047?2:p<=65535?3:4;}return n;};
const issued=new WeakMap(),used=new WeakSet(),fail=reason=>({ok:false,reason});
export function wholeWebsiteSource(c){return stableJson({ownerId:c.ownerId,businessId:c.businessId,profileRevision:c.profileRevision??null,websiteId:c.website?.id,generation:c.website?.generation,website:websiteRequestContent(c.website)});}
export function isCurrentWholeWebsite(r,c){const seal=r&&issued.get(r);return !!r?.ok&&!!seal&&!used.has(r)&&seal.reviewStamp===stableJson(r)&&seal.sourceStamp===wholeWebsiteSource(c)&&wholeSiteDerivedSourcesCurrent(c.website)&&wholeSiteContentCurrent(c.website)&&websitePhotoSourcesCurrent(c.website);}
const purposes={home:'Understand the business and choose a next step.',services:'Compare the approved services.',about:'Understand the supplied business story and approach.',gallery:'View the photographs approved for this website.',contact:'Find the supplied contact and coverage information.',products:'Explore the current approved product information.',events:'Read the supplied event information.',faq:'Find answers to the supplied questions.'};
function prepare(context,operation,deps,goal){
 const d=context.website;
 if(!context.ownerId||!websiteDraftHasScope(d,context.businessId)||!Number.isSafeInteger(d?.generation)||d.generation<1)return fail('Open your current business and its original private website first.');
 if(context.profileRevision!=null&&(!Number.isSafeInteger(context.profileRevision)||context.profileRevision<1))return fail('Review current business facts first.');
 if(!wholeSiteContentCurrent(d))return fail('Review the current approved menu, product or event information in its original editor before preparing the complete website. Nothing was invented.');
 if(!wholeSiteDerivedSourcesCurrent(d))return fail('A service changed or was removed after its page was prepared. Your page words were kept. Review the original service and its page in Studio before preparing a complete-site change.');
 if(!websitePhotoSourcesCurrent(d))return fail('Review changed, expired or withdrawn photography first. Your website stays unchanged.');
 if(websiteRequestContent(d).length>250000||typeof deps?.pageEdit!=='function'||typeof deps?.renderPage!=='function')return fail('This site needs a smaller supported review. No work was removed.');
 const start=clock(),patch={...operation,expectedWebsiteId:d.id,expectedGeneration:d.generation,expectedBusinessId:context.businessId,...(context.profileRevision!=null?{expectedProfileRevision:context.profileRevision}:{})};
 let edited;try{edited=deps.pageEdit(d,patch);}catch{return fail('The original page editor could not prepare this review. Your current website was kept.');}
 if(!edited?.applied)return fail(edited?.reason||'The supported page change could not be prepared.');
 // A review is detached from the original owner draft: mutating a candidate
 // cannot mutate shared unchanged section objects in the current website.
 let candidate;try{candidate=JSON.parse(JSON.stringify(edited.draft));}catch{return fail('The website could not be safely captured for review. Your current draft was kept.');}
 if(!candidate||!Array.isArray(candidate.pages)||candidate.generation!==d.generation+1||candidate.id!==d.id||candidate.businessId!==context.businessId||candidate.pages.length>10||websiteRequestContent(candidate).length>250000||!wholeSiteDerivedSourcesCurrent(candidate)||!wholeSiteContentCurrent(candidate)||!websitePhotoSourcesCurrent(candidate))return fail('The complete website could not be safely compared. Original wording was kept.');
 const previews={};for(const p of candidate.pages){let html;try{html=deps.renderPage(candidate,p.id,{standalone:true,privatePagePreview:true});}catch{return fail('A page could not be rendered for this review. Nothing was saved.');}if(typeof html!=='string'||html.length>500000||!html.startsWith('<!doctype html>')||/<script\b|data-busy-edit-section|busy.contextual-action.v1/i.test(html))return fail('A page needs safe static preview review. Nothing was saved.');previews[p.id]=html;}
 const pages=candidate.pages.map(p=>({...p,purpose:p.sourceServiceId?'Understand '+p.title+' in detail and choose a relevant enquiry.':purposes[p.id]||'Read the owner-authored information on '+p.title+'.'}));
 const r={ok:true,kind:'reviewed_whole_website',goal,ownerId:context.ownerId,businessId:context.businessId,profileRevision:context.profileRevision??null,sourceStamp:wholeWebsiteSource(context),operation:patch,candidate,pages,previews,accountSaved:false,neverPublishes:true,providerCalls:0,sourceMode:context.profileRevision==null?'private-studio-wording':'current-profile-and-studio',stats:{pages:pages.length,addedPages:pages.length-d.pages.length,sourceServicesReused:operation.serviceIds?.length||0,elapsedMs:Math.round((clock()-start)*100)/100,modelBytes:byteLength(websiteRequestContent(candidate)),renderedBytes:Object.values(previews).reduce((n,x)=>n+byteLength(x),0),providerCalls:0,measuredTokenUsage:null,measuredProviderCost:null},limitations:['Deterministic source reuse, not live AI generation.','New pages repeat no invented business facts.','A photograph is not independent proof of completed work.',...(/previous work|portfolio|completed projects/i.test(goal)?['Only supplied, explicitly reviewed project evidence can support a portfolio; gallery photographs alone do not establish completed work.']:[])],requiresOwnerReview:true};
 issued.set(r,{reviewStamp:stableJson(r),sourceStamp:r.sourceStamp,operationStamp:stableJson(patch),candidateStamp:websiteRequestContent(candidate),generation:candidate.generation});return r;
}
export function prepareWholeWebsite(context,deps){
 if(typeof context.goal!=='string'||context.goal.length>400||!/(website|whole site|complete site)/i.test(context.goal)||/\b(publish|send|pay|charge|deploy|book|invoice)\b/i.test(context.goal))return fail('Describe your private website goal. Publishing, sending and paid actions stay separate.');
 const d=context.website;if(!d)return fail('Prepare your original business website first.');
 const contact=d.sections?.find(s=>s.id==='contact'&&s.enabled!==false);
 if(!contact?.email&&!contact?.phone)return fail('How should customers contact you? Review an approved email address or phone number in Business Identity.');
 const remaining=Math.max(0,10-wholeSiteBasePageIds(d).length-(d.customPages?.length||0)),services=wholeSiteServices(d).filter(s=>!d.customPages?.some(p=>p.sourceServiceId===s.id)).slice(0,Math.min(5,remaining));
 return prepare(context,{action:'compose-service-pages',serviceIds:services.map(s=>s.id)},deps,context.goal);
}
export function prepareWholeWebsiteRefinement(context,request,deps){
 if(typeof request!=='string'||request.length>400)return fail('Describe one supported change.');
 const value=request.trim().replace(/[.!?]+$/,'');
 if(/^change (?:the |my )?contact information$/i.test(value))return fail('Which approved email address or phone number should customers use? Review it in the original Business Identity/contact controls; no destination was guessed.');
 const contact=value.match(/^change (?:the )?contact (email|phone) to (.+)$/i);
 if(contact)return prepare(context,{action:'update-site-contact',field:contact[1].toLowerCase(),value:contact[2]},deps,request);
 const add=value.match(/^add (?:a |an )?(.+?) page$/i);
 if(add){const matches=wholeSiteServices(context.website).filter(s=>s.title.toLocaleLowerCase('en')===add[1].toLocaleLowerCase('en'));if(matches.length!==1)return fail('Which current approved service should have its own page? Add or correct its description in Business Identity first.');return prepare(context,{action:'compose-service-pages',serviceIds:[matches[0].id]},deps,request);}
 const direction=/^make (?:the |my )?website feel more premium$/i.test(value)?'premium':/^make (?:the )?service pages more interesting$/i.test(value)?'services':/^make (?:the )?mobile layout easier to use$/i.test(value)?'mobile':null;
 if(!direction)return fail('I can prepare a current service page or refine supported inner-page typography and phone reading. Your request was kept; nothing was changed.');
 return prepare(context,{action:'refine-site-pages',direction},deps,request);
}
export async function keepWholeWebsite(review,{getContext,apply}={}){
 if(typeof getContext!=='function'||typeof apply!=='function'||!isCurrentWholeWebsite(review,getContext()))return fail('The website, business, source revision or review changed. Prepare a fresh review.');
 // Do not trust mutable client review fields to grant broader operations or different wording.
 const original=getContext(),seal=issued.get(review),operation=JSON.parse(seal.operationStamp);
 used.add(review);
 let result;try{result=await apply(operation);}catch{return {ok:false,unknown:true,mayReplay:false,reason:'Save outcome is unknown. Inspect the original Studio; do not repeat this write.'};}
 const packet=result?.verifiedPrivateReadback,observed=packet?.websiteDraft||result?.localPrivateReadback?.websiteDraft;
 if(!result?.applied||!observed||websiteRequestContent(observed)!==seal.candidateStamp||observed.generation!==seal.generation||packet&&(packet.ownerId!==review.ownerId||packet.businessId!==review.businessId||!/^[a-f0-9]{64}$/.test(packet.recordHash||'')))return {ok:false,unknown:true,mayReplay:false,reason:'The original Studio save was not independently confirmed as this exact result. Inspect it before another attempt.'};
 const now=getContext();if(now.ownerId!==original.ownerId||now.businessId!==original.businessId||(now.profileRevision??null)!==review.profileRevision)return {ok:false,unknown:true,mayReplay:false,reason:'The owner or business context changed while saving. Inspect the original account.'};
 // A delayed acknowledgement cannot dismiss newer unsaved owner wording.
 // React may still expose the original snapshot while the exact readback is
 // being committed; those two exact boundaries are the only safe outcomes.
 const currentStamp=wholeWebsiteSource(now);
 if(currentStamp!==seal.sourceStamp&&currentStamp!==wholeWebsiteSource({...now,website:observed}))return {ok:false,unknown:true,mayReplay:false,reason:'The website changed while saving. Keep your newer wording and inspect the original Studio; this attempt will not be replayed.'};
 return {ok:true,accountSaved:!!packet,kept:true,mayReplay:false,reason:packet?'Your exact complete website was saved and independently reopened. Undo is available in the original Studio.':'Kept in the original private Studio session. Account persistence has not been independently verified.'};
}
