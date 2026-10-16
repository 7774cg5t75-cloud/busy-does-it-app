/**
 * V3.210 - universal, industry-agnostic capability planner.
 * Pure deterministic preparation based on a bounded owner request and the
 * actual current private website / controlled Business App module catalogue.
 *
 * Never executes a generated request or describes mocked/on-screen capability
 * as a live, working customer journey. Any unfamiliar requirement has a safe
 * "needs design" route instead of being rejected for its business category.
 */
import {validPublicCollection} from './appPublicCollections.mjs';
import {CAPABILITIES,getUniversalCapability,VERSION}
 from "./universalCapabilityCatalogV3210.mjs";
import {enabledAppKeys} from "./appSectionOrder.mjs";

const MAX_REQUEST=1400,MAX_REQUESTED=18;
const clean=value=>typeof value==="string"?value.trim():"";
const list=value=>Array.isArray(value)?value:[];
const INTENTS=Object.freeze([
 ["gallery",/\b(?:photo(?:graph)?s?|pictures?|images?|portfolios?|galler(?:y|ies)|showcase (?:our )?work)\b/i],
 ["faq",/\b(?:faqs?|frequently asked|questions and answers)\b/i],
 ["testimonials",/\b(?:testimonials?|customer reviews?|client reviews?)\b/i],
 ["services",/\b(?:services?|service list|treatments?|menu|menus|what we (?:do|offer))\b/i],
 ["contact",/\b(?:contact details?|phone number|opening hours|address|find us|location map)\b/i],
 ["enquiry",/\b(?:enquir(?:e|es|ed|ing|y|ies)|inquir(?:e|es|ed|ing|y|ies)|quot(?:e|es)|contact forms?|send (?:a )?message|lead forms?)\b/i],
 ["booking_request",/\b(?:book(?:ings?|able)?|reservations?|reserve|appointments?|hire|rentals?|pitches|pitch booking)\b/i],
 ["availability",/\b(?:availability|available (?:dates?|pitches|rooms?|slots?|stock)|realtime (?:slots?|stock)|real.time (?:slots?|stock)|calendar availability|inventory|capacity)\b/i],
 ["accounts",/\b(?:sign.?in|log.?in|logins?|user accounts?|customer accounts?|register (?:an )?account|customer profiles?|member login)\b/i],
 ["catalogue",/\b(?:online (?:shop|store)|products?|catalogue|catalog|product listings?|stock listings?|e.?commerce)\b/i],
 ["checkout",/\b(?:shopping carts?|baskets?|checkouts?|place (?:an )?orders?|online orders?)\b/i],
 ["payments",/\b(?:pay(?:ments?|ing)?|card payments?|stripe|paypal|billing|charge customers?)\b/i],
 ["deposits",/\b(?:deposits?|reservation fees?|booking fees?)\b/i],
 ["memberships",/\b(?:memberships?|members only|gated (?:area|content)|member portals?)\b/i],
 ["subscriptions",/\b(?:subscriptions?|monthly billing|recurring payments?|monthly fees?)\b/i],
 ["uploads",/\b(?:upload(?:s|ing)?|submit (?:a )?(?:file|photo|document)|user submitted photos?|file submissions?)\b/i],
 ["voting",/\b(?:vot(?:e|es|ing)|polls?|competitions?|contests?)\b/i],
 ["events",/\b(?:event calendars?|event listings?|event schedules?|upcoming events?|concert schedules?|festival lineups?)\b/i],
 ["tickets",/\b(?:tickets?|ticketing|admissions?)\b/i],
 ["donations",/\b(?:donat(?:e|ion|ions)|fundrais(?:e|ing)|charity payments?)\b/i],
 ["search",/\b(?:search (?:my |the |for )?(?:site|website|products|listings|directory)|search bars?|directories|filters?)\b/i],
 ["notifications",/\b(?:confirmation e.?mails?|confirmation messages?|sms|email reminders?|text reminders?|automatic reminders?|send (?:a )?confirmation)\b/i],
 ["offers",/\b(?:discounts?|promotions?|special offers?|coupons?|voucher codes?|special deals?)\b/i],
 ["loyalty",/\b(?:loyalty|reward points?|stamps? cards?|repeat customer rewards?)\b/i],
 ["course_content",/\b(?:online courses?|lessons?|training modules?|tutorials?|learning platforms?|homework)\b/i],
 ["custom_feature",/\b(?:custom integrat(?:e|ion|ions)|bespoke|special functionality|custom workflow|connect to my|sync with my|custom api)\b/i]
]);
const validOwnerText=text=>typeof text==="string"&&text.length<=MAX_REQUEST&&
 !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text);
function negativeMatch(text,index){
 // A nearby literal negation is not positive permission to recommend a feature.
 const left=text.slice(Math.max(0,index-24),index);
 return /(?:\b(?:no|without|don't need|do not need|not looking for|avoid)\s+(?:online |customer |any )?)$/i.test(left);
}
function detectRequestedCapabilities(request){
 const found=[];
 for(const [id,re] of INTENTS){
  const match=re.exec(request);
  // Visitor uploads do not imply a ready owner-approved public portfolio.
  const visitorUpload=id==="gallery"&&
   /\b(?:upload|submit|send)\s+(?:their\s+|own\s+|some\s+)?(?:photos?|images?|pictures?|files?)\b/i.test(request)&&
   !/\b(?:show|display|portfolio|galler(?:y|ies))\b/i.test(request);
  if(match&&!negativeMatch(request,match.index)&&!visitorUpload)found.push(id);
 }
 // Deposits and donations are separate explicitly approved workflows, never
 // a synonym for generic payment collection or evidence of charge authority.
 // Their shared prerequisites will be inserted as dependencies below.
 return [...new Set(found)].slice(0,MAX_REQUESTED);
}
function expandDependencies(explicit){
 const seen=new Set(["identity"]),result=["identity"];
 const visit=(id,depth)=>{
  if(depth>CAPABILITIES.length||seen.has(id))return;
  const capability=getUniversalCapability(id);
  if(!capability)return;
  for(const parent of capability.dependsOn)visit(parent,depth+1);
  seen.add(id);result.push(id);
 };
 for(const id of explicit)visit(id,0);
 return result;
}
function assessSurfaceCapability(capability,surface,{website,app,catalog=[],businessId=""}={}){
 const descriptor=capability[surface];
 if(descriptor.kind==="planned")return {
  status:"requires_new_implementation",reason:descriptor.reason,
  presentInDraft:false,liveVerified:false};
 if(descriptor.kind==="guarded")return {
  status:"requires_service_verification",reason:descriptor.reason,
  presentInDraft:false,liveVerified:false};
 if(descriptor.kind==="section"){
  const enabled=!!(website&&list(website.sections)
   .some(section=>section?.id===descriptor.id&&section.enabled!==false));
  return {status:enabled?"present_in_private_draft":"supported_section_not_present",
   reason:enabled?
    "This section exists in the private draft; content, public deployment and behaviour remain unverified.":
    "A supported website section could be prepared using owner-approved information.",
   presentInDraft:enabled,liveVerified:false,sectionId:descriptor.id};
 }
 if(descriptor.kind==="module"){
  const item=list(catalog).find(row=>row?.module_key===descriptor.id&&
   row.status==="available");
  const eligible=!!item&&
   (descriptor.id!=="booking_request"||
    item.capabilities?.confirmation_required_by_business===true)&&
   (descriptor.id!=="enquiry"||item.capabilities?.customer_action===true);
  if(!eligible)return {status:"runtime_module_not_verified_available",
   reason:"The current business-scoped module catalogue does not verify this customer capability.",
   presentInDraft:false,liveVerified:false,moduleKey:descriptor.id};
  const matchingApp=app&&(!businessId||app.business_id===businessId)&&
   Number.isSafeInteger(app.draft_revision)&&app.draft_revision>0;
  // The controlled app runtime additionally rejects offers without approved
  // terms; do not mark the app draft as even privately configured if that
  // exact runtime precondition is absent.
  const termsReady=descriptor.id!=="offers"||
   list(app?.draft_config?.offers).some(x=>x?.approved===true&&
    typeof x?.title==="string"&&!!x.title.trim());
  const contentReady=!capability.publicContentField||
   (validPublicCollection(capability.publicContentField,app?.draft_config?.publicProfile?.[capability.publicContentField])&&
    app.draft_config.publicProfile[capability.publicContentField].length>0);
  const enabled=matchingApp&&termsReady&&contentReady&&list(app.draft_config?.modules).some(
   module=>module?.key===descriptor.id&&module.enabled===true)&&
   enabledAppKeys(app.draft_config).ok;
  return {status:enabled?"present_in_private_draft":"available_module_needs_owner_setup",
   reason:enabled?
    "An available module is enabled in the private app draft; no live task outcome is proven.":
    "This module is catalogue-available but has not been confirmed as enabled in a valid current private draft.",
   presentInDraft:!!enabled,liveVerified:false,moduleKey:descriptor.id};
 }
 return {status:"unknown_not_verified",reason:"This capability is not independently verified.",
  presentInDraft:false,liveVerified:false};
}
function planWebsiteSectionComposition(website,explicit=[]){
 if(!website||!Array.isArray(website.sections))return {
  ok:false,reason:"Create a private website draft before preparing a layout comparison."};
 const current=website.sections.filter(s=>s&&typeof s.id==="string"&&
  s.enabled!==false).map(s=>s.id);
 const existing=new Set(current);
 const supplied=list(website.designPlan?.sectionOrder).filter(x=>existing.has(x));
 const order=[...new Set([...supplied,...current])];
 const ownerOrder=list(website.theme?.sectionOrder).filter(x=>existing.has(x));
 if(ownerOrder.length)return {ok:true,reason:"An owner-chosen section order is already recorded. BUSY will not replace it.",
  before:order,proposed:[...order],changesSuggested:false,ownerOrderPreserved:true,
  privatePreviewOnly:true,noEditApplied:true};
 const desired=[],missingContent=[];
 const hasContent=id=>{
  const block=list(website.sections).find(section=>section?.id===id&&
    section.enabled!==false);
  if(!block)return false;
  if(id==="gallery")return list(block.items).some(photo=>photo?.approved!==false&&
    (typeof photo?.storagePath==="string"&&!!photo.storagePath.trim()||
     typeof photo?.uri==="string"&&/^https:\/\/[^\s"'<>]+$/i.test(photo.uri)));
  if(id==="services")return list(block.items).some(item=>
    typeof item?.title==="string"&&!!item.title.trim());
  if(id==="faq")return list(block.items).some(item=>
    typeof item?.title==="string"&&!!item.title.trim()&&
    typeof item?.body==="string"&&!!item.body.trim());
  if(id==="testimonials")return list(block.items).some(item=>
    typeof item?.body==="string"&&!!item.body.trim());
  if(id==="contact")return !!(clean(block.phone)||clean(block.email));
  return true;
 };
 const push=id=>{
  if(!existing.has(id))return;
  if(!hasContent(id)){
   if(!missingContent.includes(id))missingContent.push(id);
   return;
  }
  if(!desired.includes(id))desired.push(id);
 };
 for(const id of explicit){
  if(["gallery"].includes(id))push("gallery");
  if(["services","catalogue","course_content"].includes(id))push("services");
  if(["faq"].includes(id))push("faq");
  if(["testimonials"].includes(id))push("testimonials");
  if(["enquiry","booking_request","contact","deposits","payments"].includes(id))push("contact");
 }
 const hero=order.includes("hero")?["hero"]:[];
 const rest=order.filter(x=>x!=="hero"&&!desired.includes(x));
 // These are ONLY presently enabled section IDs, never generated components.
 const proposed=[...hero,...desired.filter(x=>x!=="hero"),
  ...rest];
 const changesSuggested=JSON.stringify(order)!==JSON.stringify(proposed);
 return {ok:true,before:order,proposed,
  priorityExistingSections:desired,contentNotYetReady:missingContent,
  changesSuggested,ownerOrderPreserved:false,
  reason:changesSuggested?
   "A private section-order alternative follows the stated customer goal; review before making any change.":
   "The relevant existing sections are already prominent or no safe reorder applies.",
  privatePreviewOnly:true,noEditApplied:true,noNewSections:true,
  noBookingOrCheckoutCreated:true};
}
function planUniversalBuilderRequest({
 request="",businessType="",businessId="",website=null,app=null,catalog=[]
}={}){
 if(!validOwnerText(request)||typeof businessType!=="string"||
   businessType.length>160||typeof businessId!=="string"||businessId.length>128)
  return {ok:false,reason:"Enter a short plain-language requirement (up to 1,400 characters)."};
 if((website||app)&&!businessId)
  return {ok:false,reason:"Choose the signed-in business workspace before reviewing a private draft."};
 if(website?.businessId&&website.businessId!==businessId)
  return {ok:false,reason:"The website belongs to a different business workspace."};
 if(app&&app.business_id!==businessId)
  return {ok:false,reason:"The Business App belongs to a different business workspace."};
 const goal=clean(request);
 const explicit=detectRequestedCapabilities(goal);
 const unfamiliar=!!goal&&!explicit.length;
 const wanted=unfamiliar?["custom_feature"]:explicit;
 const ids=expandDependencies(wanted);
 const capabilities=ids.map(id=>{
  const def=getUniversalCapability(id);
  return {id,title:def.title,description:def.description,version:def.version,
   explicitlyRequested:wanted.includes(id),dependencyOnly:!wanted.includes(id),
   prerequisites:[...def.dependsOn],
   website:assessSurfaceCapability(def,"website",{website,app,catalog,businessId}),
   app:assessSurfaceCapability(def,"app",{website,app,catalog,businessId}),
   requiresExternalProvider:def.externalProviderNeeded===true,
   financialRisk:def.financialRisk===true,
   customerRequestType:def.customerRequestType||null,
   authoritativeReceiptRequired:def.authoritativeReceiptRequired===true,
   independentDiaryConfirmationRequired:def.independentDiaryConfirmationRequired===true,
   ownerApprovalRequired:true,
   noLiveEvidence:true};
 });
 const supportedInWebsite=capabilities.filter(c=>c.website.presentInDraft).length;
 const supportedInApp=capabilities.filter(c=>c.app.presentInDraft).length;
 const needsDevelopment=capabilities.filter(c=>
  c.website.status==="requires_new_implementation"||
  c.app.status==="requires_new_implementation").map(c=>c.id);
 const gaps=capabilities.filter(c=>c.explicitlyRequested&&
  (c.website.status!=="present_in_private_draft"||
   c.app.status!=="present_in_private_draft")).map(c=>c.id);
 const sectionPlan=planWebsiteSectionComposition(website,wanted);
 return {ok:true,kind:"universal_builder_plan_v3210",version:VERSION,
  businessId:businessId||null,businessType:clean(businessType).slice(0,160),
  source:{websiteId:website?.id||null,websiteRevision:website?.generation||null,
   appId:app?.id||null,appRevision:app?.draft_revision||null},
  detectedGoals:wanted,unfamiliarRequirement:unfamiliar,
  noIndustryRestrictions:true,capabilities,capabilityCount:capabilities.length,
  websiteDraftComponents:supportedInWebsite,appDraftModules:supportedInApp,
  developmentGaps:[...new Set(needsDevelopment)],requestedFeaturesNeedingReview:gaps,
  sectionPlan,
  summary:unfamiliar?
   "This requirement does not match BUSY's currently described building blocks. It needs owner-reviewed bespoke planning, not a generic refusal or invented feature.":
   wanted.length?
    "BUSY identified "+wanted.length+" requested capability type(s) and "+(ids.length-wanted.length)+
     " foundational/dependent capability type(s). Review the evidence for each surface.":
    "A universal business identity foundation is possible. Describe what customers need to do to get a more specific plan.",
  ownerApprovalRequired:true,planningOnly:true,allLiveOutcomesUnverified:true,
  generatedExecutableCode:false,noModulesEnabled:true,noChangeSaved:true,
  noChargeMade:true,noPublishPerformed:true,noCrossBusinessLearning:true};
}
export {INTENTS,detectRequestedCapabilities,planWebsiteSectionComposition,
 assessSurfaceCapability,planUniversalBuilderRequest};
