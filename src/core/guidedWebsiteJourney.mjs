import {planBusyGoal} from './busyGoalPlan.mjs';
import {prepareWebsiteRequest,websiteRequestContent} from './websiteRequestPlan.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
import {reviewWebsitePhoto,websitePhotoChoices,websitePhotoSourcesCurrent} from './websitePhotoReview.mjs';
import {premiumWebsiteDirections} from './premiumWebsiteDirections.mjs';
const fail=reason=>({ok:false,reason});
export function guidedWebsiteCandidate(journey){
 if(!journey?.ok||!journey.plan?.ok)return null;
 try{return {...JSON.parse(journey.plan.boundaries.at(-1)),generation:journey.plan.generation+journey.plan.groups.length};}catch{return null;}
}
export function currentGuidedWebsite(journey,{website,businessId,ownerId,profileRevision}){return websitePhotoSourcesCurrent(website)&&!!journey?.ok&&journey.plan?.kind==='reviewed_website_request'&&journey.plan.groups?.length===1&&journey.plan.boundaries?.length===2&&journey.profileRevision===profileRevision&&journey.ownerId===ownerId&&journey.businessId===businessId&&websiteDraftHasScope(website,businessId)&&website?.id===journey.plan.draftId&&website.generation===journey.plan.generation&&websiteRequestContent(website)===journey.plan.boundaries[0];}
export function prepareGuidedWebsite({website,businessId,ownerId,profileRevision,goal},deps){
 if(!ownerId||!websiteDraftHasScope(website,businessId))return fail('Open this business’s current private website first.');
 if(typeof goal!=='string'||goal.length>400)return fail('Describe one supported website goal.');
 const normal=goal.trim().replace(/[.!?]+$/,'').replace(/^I run (?:a|an) (.+?) and need a professional website$/i,'I need a professional website for my $1');
 const photos=(website.sections||[]).flatMap(s=>s.type==='hero'?[s.asset]:s.type==='gallery'?s.items||[]:[]).filter(Boolean);if(photos.some(a=>[a.businessId,a.business_id].some(id=>id&&id!==businessId)||['revoked','withdrawn','deleted'].includes(a.status)||a.expiresAt&&Date.parse(a.expiresAt)<=Date.now()))return fail('Review the changed or unavailable original photographs before preparing this website.');
 const p=planBusyGoal({request:normal,surface:'website',website,businessId},deps);
 if(!p.ready||!p.prepared)return fail(p.question||'Describe a supported private website design change. Nothing was changed.');
 const chosen=websitePhotoChoices(website).length?JSON.parse(p.prepared.boundaries.at(-1)).theme?.heroComposition:'typography-first';if(!chosen)return fail('Start with a professional website design goal, then refine it.');
 const instruction='use the reviewed "'+chosen+'" opening',plan=prepareWebsiteRequest(website,{draftId:website.id,pageId:'home',generation:website.generation,instruction},deps);if(!plan.ok)return plan;
 return {ok:true,kind:'guided_private_website',ownerId,businessId,profileRevision,goal,instruction,adjustments:[{kind:'family',instruction}],plan,rejected:[],kept:false,accountSaved:false,publicActivation:false};
}
export function refineGuidedWebsite(journey,context,options={},deps){
 if(!options||Array.isArray(options)||Object.keys(options).some(k=>!['request','photoPath','headline','rejectCurrent'].includes(k)))return fail('Choose one supported correction.');
 const {request='',photoPath='',headline='',rejectCurrent=false}=options;if([request,photoPath,headline].some(v=>typeof v!=='string')||request.length>400||typeof rejectCurrent!=='boolean'||[request,photoPath,headline].filter(Boolean).length!==1)return fail('Choose one unambiguous correction at a time.');
 if(!currentGuidedWebsite(journey,context))return fail('The business or website has changed. Keep your wording and prepare a fresh review.');
 const candidate=guidedWebsiteCandidate(journey);if(!candidate||candidate.id!==context.website.id||candidate.businessId!==context.businessId)return fail('This preview is malformed. Prepare a fresh review.');let instruction='',kind='';let rejected=journey.rejected||[];
 if(photoPath){kind='photo';const r=reviewWebsitePhoto(context.website,photoPath);if(!r.ok)return r;instruction='use approved photo "'+photoPath+'" for the hero';}
 else if(headline){kind='headline';if(typeof headline!=='string'||!headline.trim()||headline.length>140||/["<>\u0000-\u001f]/.test(headline))return fail('Use a plain headline of up to140 characters.');instruction='change the hero heading to "'+headline+'"';}
 else if(/^(?:try (?:something|a design) completely different|try another design)$/i.test(request.trim())){
  kind='family';if(rejectCurrent)rejected=[...new Set([...rejected,candidate.theme?.heroComposition])];
  const next=premiumWebsiteDirections(candidate,{rejected})[0];if(!next)return fail('No new suitable direction with the current approved content. Your design stays unchanged.');instruction='prepare a '+next.id+' homepage';
 }else if(/^frame the photograph higher on phones$/i.test(request.trim())){if(!candidate.sections.some(s=>s.type==='hero'&&s.asset?.approved===true))return fail('Choose a current approved photograph first.');kind='phoneCrop';instruction='focus the hero photograph at top on phones';}
 else if(/^centre the photograph on desktop$/i.test(request.trim())){if(!candidate.sections.some(s=>s.type==='hero'&&s.asset?.approved===true))return fail('Choose a current approved photograph first.');kind='desktopCrop';instruction='focus the hero photograph at center on desktop';}
 else if(/^make it feel warmer and more welcoming$/i.test(request.trim())){kind='warmth';instruction='make the page warmer without changing colours';}
 else if(/^make (?:the )?food photographs bigger$/i.test(request.trim())){kind='gallery';instruction='make the gallery photos bigger';}
 else if(/^make (?:the )?mobile (?:version|layout) less crowded$/i.test(request.trim())){kind='mobile';instruction='give the page more space on phones';}
 else if(/^make (?:our|the) services easier for customers to understand$/i.test(request.trim())){kind='services';instruction='show services as a directory';}
 else if(/^let customers browse my service details$/i.test(request.trim())){kind='services';instruction='show services as a linked guide';}
 else if(/^tell our story more clearly$/i.test(request.trim())){kind='story';instruction='show about text as an editorial layout';}
 else if(/^make it easier for customers to enquire$/i.test(request.trim())){kind='contact';instruction='make the main button stand out';}
 else if(/^put (?:our|the) menu before (?:the )?story section$/i.test(request.trim())){
  kind='menu';const menu=candidate.sections.filter(s=>s.enabled!==false&&s.type==='products'),story=candidate.sections.filter(s=>s.enabled!==false&&s.type==='about');if(menu.length!==1||story.length!==1)return fail('Choose one existing approved menu and story section on the current page.');instruction='move '+menu[0].id+' before '+story[0].id;
 }else return fail('That change needs clarification or is unavailable. No partial change was prepared.');
 let baseAdjustments=journey.adjustments;if(kind==='photo'&&candidate.theme?.heroComposition==='typography-first'){const next=premiumWebsiteDirections(candidate,{rejected})[0];if(!next)return fail('Select a suitable photographic direction first.');baseAdjustments=baseAdjustments.map(a=>a.kind==='family'?{kind:'family',instruction:'use the reviewed "'+next.id+'" opening'}:a);}
 const adjustments=[...baseAdjustments.filter(a=>a.kind!==kind),{kind,instruction}],combined=adjustments.map(a=>a.instruction).join('; '),plan=prepareWebsiteRequest(context.website,{draftId:context.website.id,pageId:'home',generation:context.website.generation,instruction:combined},deps);
 if(!plan.ok)return plan;if(plan.groups.length!==1)return fail('Keep a smaller set of changes in one review. Your website is unchanged.');return {...journey,instruction:combined,adjustments,plan,rejected,kept:false,accountSaved:false};
}
// Save only original finite wire groups. A local kept draft is not an account
// receipt. Any uncertain result fences this attempt; never automatically retry.
const attempted=new WeakSet();
export async function keepGuidedWebsite(journey,{getContext,apply,onProgress=()=>{}}){
 let context=getContext();if(!currentGuidedWebsite(journey,context))return fail('Review the current website before keeping this design.');
 if(attempted.has(journey))return fail('This review was already attempted. Inspect the original website before a new review.');
 if(typeof apply!=='function')return fail('The original Studio save authority is unavailable.');
 attempted.add(journey);let verified=true;
 for(let i=0;i<journey.plan.groups.length;i++){
  context=getContext();if(context.ownerId!==journey.ownerId||context.businessId!==journey.businessId||context.website?.id!==journey.plan.draftId||context.website.generation!==journey.plan.generation+i||websiteRequestContent(context.website)!==journey.plan.boundaries[i])return fail('The source changed. Earlier confirmed parts remain; no operation was replayed.');
  let r;try{r=await apply({pageId:'home',generation:context.website.generation,instruction:journey.plan.groups[i].instruction});}catch{return {ok:false,unknown:true,mayReplay:false,reason:'The outcome is unknown. Inspect the original account; this attempt will not be replayed.'};}
  const after=getContext();if(after.ownerId!==journey.ownerId||after.businessId!==journey.businessId)return {ok:false,unknown:true,mayReplay:false,reason:'The account changed while saving. Inspect the original account without replaying.'};
  if(!r?.applied)return {ok:false,unknown:true,mayReplay:false,reason:r?.reason||'Save not confirmed. Inspect the original account; do not send this attempt again.'};
  const packet=r.verifiedPrivateReadback;
  if(packet){if(!/^[a-f0-9]{64}$/.test(packet.recordHash||'')||packet.ownerId!==journey.ownerId||packet.businessId!==journey.businessId||packet.websiteDraft?.id!==journey.plan.draftId||packet.websiteDraft.generation!==journey.plan.generation+i+1||websiteRequestContent(packet.websiteDraft)!==journey.plan.boundaries[i+1])return {ok:false,unknown:true,mayReplay:false,reason:'The independent account result differs from your review. Stop and inspect it.'};}
  else verified=false;
  onProgress({completed:i+1,observed:packet?.websiteDraft||r.draft});
 }
 return {ok:true,kept:true,accountSaved:verified,reason:verified?'Your exact reviewed website was saved and independently reopened.':'Kept in the private Studio session. An account save has not been independently verified.',mayReplay:false};
}
