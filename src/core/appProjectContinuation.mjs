import {prepareScreenAppComposition,MARKERS} from './appScreenProposal.mjs';
import {reopenPrivateAppProject} from './privateAppProject.mjs';
import {appCompositionContext,reviewAppComposition,initialAppCompositionSelection,prepareAppComposition} from './appGoalComposition.mjs';
import {suggestAppRecordBlocks,appRecordReview,prepareRecordAppComposition} from './appRecordComposition.mjs';
import {validateBuilderProposal} from './governedBuilderProposal.mjs';
import {supportedAppCatalogModule} from './appCatalogSupport.mjs';
import {publicCollection} from './appPublicCollections.mjs';
import {stableJson} from './stableJson.mjs';
const no=reason=>({ok:false,reason,needsClarification:true,mayExecute:false});
const same=(a,b)=>stableJson(a)===stableJson(b);
const collections={catalogue:'product',products:'product',menu:'product',events:'event'};
const visualPhoto='Use larger product photographs.';
const subject=s=>collections[s.id]||(s.module==='services'&&s.title==='Menu'?'product':s.module||null);
export function continueSavedAppProject(input){
 const opened=reopenPrivateAppProject(input);if(!opened.ok)return opened;
 const context=appCompositionContext(input),review=reviewAppComposition(opened.proposal,context,context);if(!review.ok)return review;
 const words=opened.proposal.app.screens.map(s=>subject(s)==='product'?'products':subject(s)==='event'?'events':'').join(' ');
 const suggested=suggestAppRecordBlocks(words,input.feed,input.businessId),savedOrder=opened.proposal.app.screens.map(subject);
 const choices=suggested.map(c=>{const base=input.app.draft_config.contentLayout?.find(b=>b.kind===c.kind)||c;return c.kind==='product'?{...base,...opened.proposal.app.visual.includes('Use rows for product browsing.')?{layout:'rows'}:{},...opened.proposal.app.visual.includes(MARKERS.categories)?{browseMode:'categories'}:{},...opened.proposal.app.visual.includes(MARKERS.details)?{interestEntry:'details'}:{}}:base;}).sort((a,b)=>savedOrder.indexOf(a.kind)-savedOrder.indexOf(b.kind)).map(c=>c.kind==='product'&&opened.proposal.app.visual.includes(visualPhoto)?{...c,imageScale:'large'}:c);
 const recordBasis=choices.length?appRecordReview(input.feed,input.businessId,choices.map(c=>c.kind)):null;
 return {ok:true,proposal:opened.proposal,context,review,selection:initialAppCompositionSelection(review,context),choices,recordBasis,summary:{purpose:opened.proposal.app.purpose,supported:review.rows.filter(r=>r.status==='private-configured').map(r=>r.title),planned:review.rows.filter(r=>r.status!=='private-configured'&&!choices.some(c=>c.kind===subject(r))).map(r=>r.title),collections:choices.map(c=>c.title),originRevision:opened.originRevision,currentRevision:opened.currentRevision,sourceNote:'Using your current saved app and approved information. Earlier app layouts and business facts are not restored.'},mayExecute:false};
}
export function reviewContinuedAppIntent({proposal,context,current}){
 if(!context?.ok||!current?.ok||['ownerId','businessId','projectId','surface'].some(k=>context.scope[k]!==current.scope[k]))return no('Open the same current account and app before reviewing your retained idea.');
 const previous=validateBuilderProposal(proposal,context);if(!previous.ok)return previous;
 return validateBuilderProposal({...JSON.parse(stableJson(previous.proposal)),scope:{...current.scope}},current);
}
export function prepareContinuedAppProject({proposal,context,current,selection,choices,feed,expected}){
 return prepareScreenAppComposition({proposal,context,current,selection,choices,feed,expected});
}
// A bounded correction to reviewed intent. Known choices become ONLY original
// finite Studio operations after a separate preview/approval. No provider/tools.
export function correctAppProject({words,proposal,context,current,selection,choices,feed}){
 if(typeof words!=='string'||!words.trim()||words.length>240||/[<>\u0000-\u001f\u007f]/.test(words)||!selection||!Array.isArray(choices)||!same(context,current))return no('Open the current idea and describe one change.');
 const checked=validateBuilderProposal(proposal,current);if(!checked.ok)return checked;
 const t=words.toLowerCase().replace(/[’‘]/g,"'"),removeBooking=/\b(?:booking|bookings|appointment)\b/.test(t)&&/\b(?:don't need|do not need|remove|without|no longer need)\b/.test(t);
 if(/\b(?:publish|send|pay|charge|purchase|execute|script|sql|api key)\b/.test(t)||(/\b(?:don't|do not|never|not)\b/.test(t)&&!removeBooking))return no('That needs a separate supported review. Your idea is kept.');
 const galleryFirst=/\bgallery\b.*\bbefore\b.*\benquir\w*/.test(t);
 const matches=[['screen_categories',/\b(?:menu|products?)\b/.test(t)&&/\b(?:categories|categorised|categorized)\b/.test(t)],['screen_details',/\bproducts?\b.*\bdetail\w*\b/.test(t)],['screen_faq',/\bfaqs?\b/.test(t)],['screen_contact',/\bcontact\b.*\bmenu\b|\bmenu\b.*\bcontact\b/.test(t)],['screen_gallery',galleryFirst],['collection_order',/\b(?:menu|products?)\b.*\bbefore\b.*\bevents?\b/.test(t)],['events_first',/\b(?:events?|festivals?)\b.*\b(?:top|first|earlier|easier to find)\b/.test(t)],['product_browse',/\b(?:menu|products?)\b.*\b(?:browse|browsing|easier)\b/.test(t)],['product_photos',/\b(?:product|menu)\b.*\b(?:photos?|pictures?|photographs?|images?)\b.*\b(?:bigger|larger)\b/.test(t)],['contact',/\bcontact\b.*\b(?:easier to find|prominent(?:ly)?|earlier|first|top)\b/.test(t)],['services',/\bservices?\b.*\b(?:first|top|earlier|prominent(?:ly)?)\b/.test(t)],['enquiry',/\b(?:enquir\w*|inquir\w*)\b/.test(t)&&!removeBooking&&!galleryFirst],['remove_booking',removeBooking],['explanation',/\b(?:section|explain)\b.*\bhow\b.*\b(?:service|work)\b/.test(t)],['staff',/\bfield (?:staff|team)\b/.test(t)]].filter(([,v])=>v).map(([k])=>k);
 if(matches.length===0)return {...no('I can prepare one supported change or keep a new requirement for review.'),allowLegacy:true};
 if(matches.length!==1||(/\b(?:smaller|regular)\b/.test(t)&&matches[0]==='product_photos'))return no('Describe one clear change: collection order, product photos, contact, services, enquiries or a planned section.');
 const next=JSON.parse(stableJson(checked.proposal));let blocks=JSON.parse(stableJson(choices)),notice='',intent=matches[0];
 if(intent.startsWith('screen_')){
  const key=intent.slice(7),marker=MARKERS[{categories:'categories',details:'details',faq:'faq',contact:'contact',gallery:'gallery'}[key]];
  if(['categories','details'].includes(key)){
   const records=appRecordReview(feed,current.scope.businessId,['product']);if(!records.ok||!blocks.some(b=>b.kind==='product'))return no('Load this business’s current approved products first.');
   if(key==='categories'&&new Set(records.records.map(r=>r.data.category).filter(Boolean)).size<2)return no('These products do not yet have separate approved categories. Review categories in the original product editor; I will not invent or change them here.');
   blocks=blocks.map(b=>b.kind==='product'?{...b,...key==='categories'?{browseMode:'categories'}:{interestEntry:'details'}}:b);
  }
  if(key==='faq'&&!publicCollection('faqs',current.anchor.project.draft_config.publicProfile?.faqs||[]).length)return no('Add and approve your FAQ wording through its original editor first.');
  if(key==='contact'&&!selection.order.includes('contact')||key==='gallery'&&(!current.anchor.project.draft_config.modules.some(m=>m.key==='gallery'&&m.enabled===true)||!selection.order.includes('services')))return no('That needs its original enabled feature first.');
  if(!next.app.visual.includes(marker))next.app.visual.push(marker);
  notice='Screen change prepared using existing approved information. Review the private preview and then Studio; nothing has been saved.';
 }else if(intent==='collection_order'){
  if(!blocks.some(b=>b.kind==='product')||!blocks.some(b=>b.kind==='event'))return no('Load current approved menu/product and event records first.');
  blocks.sort((a,b)=>(a.kind==='product'?0:1)-(b.kind==='product'?0:1));const a=next.app.screens.findIndex(s=>subject(s)==='product'),b=next.app.screens.findIndex(s=>subject(s)==='event');if(a>b&&b>=0)next.app.screens.splice(b,0,...next.app.screens.splice(a,1));
 }else if(intent==='events_first'){
  if(!blocks.some(b=>b.kind==='event'))return no('Load the current approved event collection first.');blocks.sort((a,b)=>(a.kind==='event'?0:1)-(b.kind==='event'?0:1));const index=next.app.screens.findIndex(s=>subject(s)==='event');if(index>=0)next.app.screens.unshift(...next.app.screens.splice(index,1));
 }else if(intent==='product_browse'){
  if(!blocks.some(b=>b.kind==='product'))return no('Load current approved products/menu first.');blocks=blocks.map(b=>b.kind==='product'?{...b,layout:'rows'}:b);if(!next.app.visual.includes('Use rows for product browsing.'))next.app.visual.push('Use rows for product browsing.');
 }else if(intent==='product_photos'){
  if(!blocks.some(b=>b.kind==='product')||!appRecordReview(feed,current.scope.businessId,['product']).ok)return no('Load this business’s current approved product collection first.');
  blocks=blocks.map(b=>b.kind==='product'?{...b,imageScale:'large'}:b);
  if(!next.app.visual.includes(visualPhoto)){if(next.app.visual.length>=8)return no('Review the existing visual preferences before adding another.');next.app.visual.push(visualPhoto);}
 }else if(intent==='contact'||intent==='services'){
  const key=intent==='contact'?'contact':'services',index=next.app.screens.findIndex(s=>s.module===key);if(index<0||!selection.order.includes(key))return no('That screen needs original feature setup first.');next.app.screens.unshift(...next.app.screens.splice(index,1));
 }else if(intent==='enquiry'){
  if(!supportedAppCatalogModule(current.anchor.catalog,'enquiry'))return no('Enquiries need their original available capability and review.');
  if(!next.app.screens.some(s=>s.module==='enquiry'))next.app.screens.push({id:'enquiry',title:'Customer enquiries',module:'enquiry',next:[]});notice='The idea includes enquiries. Only the existing enabled private enquiry preview can be used; no request is sent.';
 }else if(intent==='remove_booking'){
  next.app.screens=next.app.screens.filter(s=>s.module!=='booking_request'&&!(s.module===null&&s.id==='booking_request'));notice='Booking is no longer requested in this idea. Any existing booking feature stays unchanged until its original feature controls are reviewed.';
 }else if(intent==='explanation'){
  const answers=publicCollection('faqs',current.anchor.project.draft_config.publicProfile?.faqs||[]).filter(r=>/how.*(?:work|service)|process/i.test(r.question));
  if(answers.length){const i=next.app.screens.findIndex(s=>s.module==='business_profile');if(i>=0)next.app.screens.unshift(...next.app.screens.splice(i,1));notice='The existing business-information screen already shows your approved explanation. I can bring that screen earlier; the answer is unchanged.';}
  else {if(!next.app.screens.some(s=>s.id==='how_it_works'))next.app.screens.push({id:'how_it_works',title:'How our service works',module:null,next:[]});if(!next.app.unsupported.includes('A how-we-work section needs owner-approved wording and its original content review.'))next.app.unsupported.push('A how-we-work section needs owner-approved wording and its original content review.');notice='Section retained as a requirement. What would you like it to say? No answer was invented.';}
 }else if(intent==='staff'){next.app.users=['Field staff'];notice='Audience updated in the private idea. Staff access, job updates and private operational data are not implemented by this change.';}
 const retainedIds=new Set(next.app.screens.map(s=>s.id));next.app.screens=next.app.screens.map(s=>({...s,next:s.next.filter(id=>retainedIds.has(id))}));
 if(!next.app.workflows.includes(words.trim()))next.app.workflows.push(words.trim());
 const valid=validateBuilderProposal(next,current);if(!valid.ok)return valid;
 const review=reviewAppComposition(valid.proposal,current,current);if(!review.ok)return review;
 const initial=initialAppCompositionSelection(review,current),old=selection.order||[],wanted=review.rows.filter(r=>r.status==='private-configured').map(r=>r.module);
 const retainedOrder=[...old.filter(k=>wanted.includes(k)),...initial.order.filter(k=>!old.includes(k))];const order=['contact','services'].includes(intent)?[intent,...retainedOrder.filter(k=>k!==intent)]:retainedOrder;
 const selected={...selection,order,labels:{...initial.labels,...Object.fromEntries(Object.entries(selection.labels||{}).filter(([k])=>wanted.includes(k)))}};
 return {ok:true,proposal:valid.proposal,review,selection:selected,choices:blocks,recordBasis:blocks.length?appRecordReview(feed,current.scope.businessId,blocks.map(b=>b.kind)):null,notice:notice||'Correction prepared for review. Saved requirements and app screens have not changed.',intent,requiresReview:true,mayExecute:false};
}
