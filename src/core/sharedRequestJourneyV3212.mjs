/**
 * V3.212 — one privacy-minimal customer REQUEST contract for BOTH builders.
 *
 * Current website drafts provide public contact presentation, NOT a transactional
 * website request endpoint. Business Apps already have guarded request modules.
 * Reuse their actual finite runtime and V3.158 request lifecycle; never claim
 * delivery, business acceptance or diary confirmation from a static draft.
 *
 * Pure read-only review: this module NEVER creates a request, writes customer
 * data, joins tenants, sends a notification, pays a provider or publishes.
 */
import {validPrivateBuilderPair} from "./ownerBuilderDraftGuardV3195.mjs";
import {appRuntimeScreenSchema} from "./appRuntimeScreenSchema.mjs";
import {enabledAppKeys} from "./appSectionOrder.mjs";
import {appRequestJourney,decideAppRequestTransition}
 from "./appRequestLifecycle.mjs";
import {evaluateResponsiveApp} from "./appResponsiveDesign.mjs";
import {canonicalWebsiteHandoffUrl} from "./websiteAppHandoffV3214.mjs";

const TYPES=Object.freeze(["enquiry","booking_request"]);
const clean=v=>typeof v==="string"?v.trim():"";
const list=v=>Array.isArray(v)?v:[];
const fail=reason=>({ok:false,reason,readOnly:true,
 noCustomerDataIncluded:true,noBookingConfirmed:true,noProviderDeliveryProven:true});

function requestTransitionEvidence({kind="enquiry",status="received",
 bridgeState="",nextStatus=""}={}){
 if(!TYPES.includes(kind)||!["received","reviewing","accepted","declined","closed"].includes(status)||
    typeof bridgeState!=="string"||bridgeState.length>60)
  return fail("Use a recognised request kind and saved request status.");
 // This is a demonstration of existing state rules. An untrusted client-provided
 // bridge_state is NOT independently verified by the server; do not label any
 // synthetic/example request as an actual customer receipt.
 const record={request_type:kind,status};
 const journey=appRequestJourney(record,{bridge_state:bridgeState});
 const next=nextStatus?decideAppRequestTransition(record,nextStatus,
  {bridgeState}):null;
 // Deliberately never pass the raw, potentially "confirmed:true" synthetic
 // journey into customer-facing evidence. The state machine is only an
 // illustrative rule evaluation until a signed-in server readback proves it.
 const guardedJourney={type:journey.type,status:journey.status,
  confirmed:false,
  stages:journey.stages.map(s=>({key:s.key,label:s.label,complete:false})),
  customerMessage:"Example only — no actual customer request or diary receipt was fetched.",
  requiresHumanConfirmation:kind==="booking_request"};
 return {ok:true,kind,status,journey:guardedJourney,
  hypotheticalRuleWouldConfirm:journey.confirmed===true,
  proposedTransition:next,
  bookingProofWouldBeRequired:kind==="booking_request"&&
   (status==="accepted"||nextStatus==="accepted"),
  exampleOnly:true,serverReceiptNotQueried:true,independentProof:false,
  customerDataIncluded:false,realBookingConfirmed:false,
  outboundReplySent:false,providerDelivered:false};
}
function reviewSharedRequestJourney({
 businessId="",website=null,app=null,catalog=[],kind="enquiry"
}={}){
 if(!TYPES.includes(kind))return fail("Choose enquiries or booking requests.");
 if(!validPrivateBuilderPair(website,app,businessId))
  return fail("Choose two current private drafts belonging to the same business.");
 if(!Array.isArray(catalog)||catalog.length>50)
  return fail("A bounded owner-scoped Business App catalogue is required.");
 const runtime=appRuntimeScreenSchema(app.draft_config,catalog);
 const nav=enabledAppKeys(app.draft_config);
 if(!nav.ok)return fail("The app has invalid or stale navigation.");
 const appAvailable=!!runtime.ok&&
  runtime.screens.some(s=>s.key===kind&&s.customerRequest===true);
 const websiteSections=list(website.sections).filter(s=>s?.enabled!==false);
 const contact=websiteSections.find(s=>s?.id==="contact");
 const hasContact=!!(clean(contact?.phone)||clean(contact?.email));
 const hero=websiteSections.find(s=>s?.id==="hero");
 const hasValidContactAnchor=hasContact&&clean(hero?.ctaHref)==="#contact"&&
  !!clean(hero?.cta);
 const appServices=list(app.draft_config?.publicProfile?.services).some(
  s=>typeof s?.name==="string"&&!!s.name.trim());
 const webServices=list(websiteSections.find(s=>s?.id==="services")?.items).some(
  s=>typeof s?.title==="string"&&!!s.title.trim());
 const taskReady=appAvailable&&(kind!=="booking_request"||appServices);
 const savedLink=website?.theme?.appRequestLinks?.[kind];
 let handoffMatchesCurrentApp=false;
 if(hasContact&&savedLink?.ownerApproved===true&&
   savedLink.intent===kind&&savedLink.appId===app.id&&
   savedLink.liveVersionId===app.current_live_version_id&&
   ["live","update_pending"].includes(app.status)&&
   typeof savedLink.url==="string"){
  try{
   const u=new URL(savedLink.url);
   handoffMatchesCurrentApp=savedLink.url===canonicalWebsiteHandoffUrl({
    endpoint:u.origin+u.pathname,slug:savedLink.slug,kind,
     appId:savedLink.appId,liveVersionId:savedLink.liveVersionId
   });
  }catch{/* No trustworthy active website handoff proof. */}
 }
 const customerActions={
  website:handoffMatchesCurrentApp?
   "private_app_handoff_configured_public_click_unverified":
   hasContact?"public_contact_details_only":"contact_information_missing",
  app:taskReady?"private_app_request_module_present":
   !runtime.ok?"runtime_not_verified":
   appAvailable?"owner_service_information_needed":
   "request_module_unavailable_or_disabled"
 };
 const gapIds=[
  ...(!hasContact?["website_public_contact_details"]:[]),
  ...(hasContact&&!hasValidContactAnchor?["website_hero_contact_route"]:[]),
  ...(kind==="booking_request"&&!webServices?["website_recorded_services"]:[]),
  ...(kind==="booking_request"&&!appServices?["app_recorded_services"]:[]),
  ...(!runtime.ok?["app_supported_runtime"]:[]),
  ...(!appAvailable?["app_request_module"]:[]),
  "website_transactional_request_endpoint_unverified",
  ...(handoffMatchesCurrentApp?["website_public_handoff_click_and_delivery_unverified"]:[]),
  "real_customer_submission_unverified",
  "owner_receipt_and_reply_unverified",
  ...(kind==="booking_request"?[
   "real_availability_and_diary_confirmation_unverified"
  ]:[]),
  "external_notification_delivery_unverified"
 ];
 const responsive=runtime.ok?evaluateResponsiveApp(app.draft_config):null;
 const widths=responsive?.ok?responsive.profiles.map(row=>({
  id:row.id,logicalWidth:row.assumedContentWidth,
  navigation:row.layout.navigation,
  warnings:row.warnings.map(x=>x.key),
  estimatedOnly:true
 })):[];
 const websiteOrder=list(website.theme?.sectionOrder).length?
  list(website.theme.sectionOrder):list(website.designPlan?.sectionOrder);
 const contactIndex=websiteOrder.indexOf("contact");
 const priority=contactIndex<0?"not_recorded":
  contactIndex<=2?"prominent":"later_on_page";
 const previewExplanation=kind==="booking_request"?
  "The app can show a booking REQUEST module, but an appointment still needs separately verified availability, a confirmed diary record and owner-approved handoff.":
  "The app can show a tracked enquiry module, but the website's Contact section is not automatically a submission endpoint, saved owner receipt or delivered reply.";
 return {ok:true,kind:"shared_request_journey_v3212",
  requestKind:kind,businessId,
  source:{websiteId:website.id,websiteGeneration:website.generation,
   appId:app.id,appRevision:app.draft_revision},
  customerActions,website:{
   ownerApprovedAppHandoffInPrivateDraft:handoffMatchesCurrentApp,
   handoffPublicVisitVerified:false,
   handoffDeliveryVerified:false,
   publicContactVisible:hasContact,
   heroPointsToContact:hasValidContactAnchor,
   contactPriority:priority,recordedServices:webServices,
   transactionalFormVerified:false},
  app:{runtimeValidated:runtime.ok,requestScreenPresent:appAvailable,
   recordedServices:appServices,requestReadyForDesign:taskReady,
   customerRequestSubmitted:false,bookingConfirmed:false},
  gaps:gapIds,summary:previewExplanation,
  responsive:{method:"static_rule_only",appWidths:widths,
   websiteViewportMeasurementsAvailable:false,
   phoneScreenshotReviewed:false,tabletScreenshotReviewed:false,
   desktopScreenshotReviewed:false},
  requestContract:{requestType:kind,
   sourceSurfaceChoices:["website","busy_marketplace","standalone_app"],
   authenticatedTenantServerBoundaryRequired:true,
   idempotentReceiptRequired:true,
   ownerInboxAndReplyReceiptRequired:true,
   ...(kind==="booking_request"?{
     confirmedAvailabilityRequired:true,
     diaryCommitAndBookingReceiptRequired:true
   }:{})},
  ownerApprovalRequired:true,sourceRevisionMustBeRechecked:true,
  noBusinessFactsCopied:true,noCustomerDataIncluded:true,
  noRealRequestCreated:true,noDatabaseRead:true,noNetworkCalled:true,
  noCustomerMessageSent:true,noBookingConfirmed:true,
  noProviderDeliveryProven:true,noWebsiteFormInstalled:true,
  noModuleEnabled:true,noPublicChange:true,
  visualAdviceNotPixelMeasured:true};
}
export {TYPES,requestTransitionEvidence,reviewSharedRequestJourney};
