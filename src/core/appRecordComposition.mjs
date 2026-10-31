import {reviewApprovedBuilderRecords} from './approvedBuilderRecords.mjs';
import {selectBusinessContent,validContentLayout,publicBusinessContent} from './businessContentRecords.mjs';
import {proposeCoordinatedAppChanges} from './appCoordinatedStudio.mjs';
import {bindPrivateAppProposal} from './privateAppEditSession.mjs';
import {prepareAppComposition} from './appGoalComposition.mjs';
import {stableJson} from './stableJson.mjs';
const no=reason=>({ok:false,reason,mayExecute:false});
const equal=(a,b)=>stableJson(a)===stableJson(b);
export function approvedCompositionFeed(response,businessId){
 if(response?.ok!==true||response.businessId!==businessId||!Array.isArray(response.records)||response.records.some(r=>!Number.isSafeInteger(r?.revision)||r.revision<1))return no('The business record response did not match.');
 const feed=publicBusinessContent(response.records,businessId);
 return feed.ok&&reviewApprovedBuilderRecords(feed,businessId).ok?feed:no('Current approved records are unavailable.');
}
export function appRecordReview(feed,businessId,kinds,{now=Date.now()}={}){
 const review=reviewApprovedBuilderRecords(feed,businessId,{now});
 if(!review.ok||!Array.isArray(kinds)||!kinds.length||kinds.length>2||new Set(kinds).size!==kinds.length||kinds.some(k=>!['product','event'].includes(k))||new Set(feed.records.map(r=>r.id)).size!==feed.records.length)return no(review.reason||'Choose distinct current product or event records.');
 const records=kinds.flatMap(kind=>selectBusinessContent(feed,{kind,now}).filter(r=>!['cancelled','archived'].includes(r.data.status)));
 if(kinds.some(kind=>!records.some(r=>r.kind===kind)))return no('Load approved, current listings for each selected collection.');
 return {ok:true,businessId,kinds:[...kinds],records:JSON.parse(stableJson(records)),checkedAt:feed.checkedAt,privateLayoutOnly:true};
}
export function currentAppRecordReview(review,feed,businessId){
 if(!review?.ok||review.businessId!==businessId)return false;
 const current=appRecordReview(feed,businessId,review.kinds);
 return current.ok&&equal(current.records,review.records);
}
export function suggestAppRecordBlocks(goal,feed,businessId){
 const valid=reviewApprovedBuilderRecords(feed,businessId);if(!valid.ok)return [];
 const wanted=[];
 if(/\b(?:menu|products?|catalogue|catalog)\b/i.test(goal))wanted.push(['product',/\bmenu\b/i.test(goal)?'Menu':'Products','rows']);
 if(/\b(?:events?|trading next)\b/i.test(goal))wanted.push(['event','Upcoming events','cards']);
 return wanted.filter(([kind])=>appRecordReview(feed,businessId,[kind]).ok).map(([kind,title,layout])=>({kind,title,layout}));
}
// Only existing content_layout/navigation/appearance operations reach Studio.
// Source facts stay in busy_business_content. A layout is not a pinned copy.
export function prepareRecordAppComposition({context,current,proposal,selection,feed,choices,expected}={}){
 if(!context?.ok||!Array.isArray(choices)||!choices.length||!validContentLayout(choices))return no('Choose supported product and event collections.');
 const businessId=context.scope.businessId,review=appRecordReview(feed,businessId,choices.map(c=>c.kind));if(!review.ok)return review;
 if(expected&&!currentAppRecordReview(expected,feed,businessId))return no('Approved listings changed. Reload them and review a fresh idea.');
 for(const c of choices)if(c.featuredId&&!review.records.some(r=>r.id===c.featuredId&&r.kind===c.kind))return no('Choose a featured listing from this business and this collection.');
 const base=prepareAppComposition({context,current,proposal,selection});
 // No-op base appearance is fine; a real record collection may still be new.
 if(!base.ok&&base.code!=='no_changes')return base;
 const config=context.anchor.project.draft_config,old=config.contentLayout||[];
 if(!validContentLayout(old)||!config.modules.some(m=>m.key==='business_profile'&&m.enabled===true))return no('Open the existing business-information screen and supported content layout.');
 const next=[...choices.map(c=>({...old.find(b=>b.kind===c.kind),...c})),...old.filter(b=>!choices.some(c=>c.kind===b.kind))];
 const operations=[...(base.ok?base.operations:[]),...equal(old,next)?[]:[{kind:'content_layout',value:next}]];
 if(!operations.length)return no('These approved collections already match your saved layout.');
 const checked=proposeCoordinatedAppChanges(config,operations);if(!checked.ok)return checked;
 const bound=bindPrivateAppProposal(checked,{businessId,app:context.anchor.project});
 return bound?{...bound,recordReview:review,businessContentPreview:feed,mayExecute:false,explanation:{summary:'Only the collection layout and listed design choices are saved. Prices, dates and photographs remain in the original approved records; future refreshes use their latest approved revisions.'}}:no('The private app changed. Prepare a fresh review.');
}
// Finite task corrections. Never rewrites prices, dates, services or approvals.
export function refineRecordAppChoice(words,{selection,choices,config}={}){
 if(typeof words!=='string'||words.length>240||!selection||!Array.isArray(choices))return no('Describe one supported layout change.');
 const next=JSON.parse(stableJson({selection,choices}));
 if(/\b(?:enquir\w*|contact us)\b/i.test(words)&&/\b(?:products?|menu|services?|events?)\b/i.test(words)){if(!config?.modules?.some(m=>m.key==='enquiry'&&m.enabled===true))return no('Enable enquiries through the original feature review first. Nothing was changed.');return {ok:true,...next,taskOnly:true,alreadyConfigured:true,nextAction:'The original enquiry action is already enabled. Try the private customer preview below; no request will be sent.'};}
 if(/\bmenu\b.*\b(?:browse|browsing|easier)\b/i.test(words)&&choices.some(c=>c.kind==='product')){next.choices=choices.map(c=>c.kind==='product'?{...c,layout:'rows'}:c);}
 else if(/\bevents?\b.*\b(?:top|first|earlier)\b/i.test(words)&&choices.some(c=>c.kind==='event')){next.choices=[...choices.filter(c=>c.kind==='event'),...choices.filter(c=>c.kind!=='event')];next.selection.order=['business_profile',...selection.order.filter(k=>k!=='business_profile')];}
 else if(/\b(?:photos?|photographs?|pictures?)\b.*\b(?:bigger|larger)\b/i.test(words)&&config?.modules?.some(m=>m.key==='gallery'&&m.enabled===true)&&config.publicProfile?.assets?.gallery?.some(p=>p.approved===true||p.marketingOk===true)){next.selection.appearance.imageScale='large';}
 else if(/\bcontact\b.*\b(?:prominent(?:ly)?|first|top|earlier)\b/i.test(words)&&selection.order.includes('contact')){next.selection.order=['contact',...selection.order.filter(k=>k!=='contact')];}
 else return no('I can refine collection browsing, event order, existing gallery size or contact prominence. Your idea is kept.');
 return {ok:true,...next,taskOnly:true};
}
