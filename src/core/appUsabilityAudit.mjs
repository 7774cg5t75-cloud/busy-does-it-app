/**
 * V3.160 independent, deterministic inspection of an app's PUBLIC CONFIG.
 * This is not OCR, pixel measurement, accessibility certification, an AI
 * review, app-store approval, or evidence of a live customer request.
 * It never reads private customer records or makes changes.
 */
import {OPTIONS,DEFAULTS} from "./appAppearanceEditing.mjs";
const names=Object.freeze({business_profile:"About",services:"Services",
 gallery:"Photos",contact:"Contact",enquiry:"Enquiries",
 booking_request:"Booking requests",offers:"Offers",loyalty:"Loyalty"});
const safe=v=>typeof v==="string"?v.trim():"";
function auditBusinessAppUsability(config){
 const issues=[],passed=[],moduleList=Array.isArray(config?.modules)?config.modules:[];
 const enabled=moduleList.filter(x=>x?.enabled===true).map(x=>x.key);
 const profile=config?.publicProfile||{},assets=profile.assets||{};
 const choices={...DEFAULTS,...config?.presentation};
 const add=(id,severity,message,suggestion)=>{
   issues.push({id,severity,message,suggestion,kind:"static_configuration"});
 };
 if(!safe(profile.businessName)&&!safe(config?.display?.name))
  add("business_identity","important","The app has no public business name.","Add the approved business name before release.");
 else passed.push("business_name_present");
 if(enabled.length>7)add("navigation_length","advisory",
  "There are many main sections for a small mobile screen.",
  "Review whether customers can find bookings and enquiries quickly.");
 else passed.push("manageable_section_count");
 const primary=enabled.filter(x=>["booking_request","enquiry","contact"].includes(x));
 if(primary.length===0)add("contact_path","important",
  "Customers have no enabled contact, enquiry or booking route.",
  "Enable a supported customer action and verify its full live journey.");
 else passed.push("customer_action_present");
 const list=Array.isArray(profile.services)?profile.services:[];
 if(enabled.includes("services")&&(!list.length||list.some(x=>!safe(x?.name))))
  add("service_information","important","Some services have no owner-approved public name.",
   "Add clear service names in the private Services editor.");
 else if(enabled.includes("services"))passed.push("services_named");
 const gallery=Array.isArray(assets.gallery)?assets.gallery:[];
 if(enabled.includes("gallery")&&gallery.length===0)
  add("empty_gallery","advisory","The Gallery section currently has no photographs.",
   "Add approved images or hide this unfinished section.");
 const approvedPhotos=gallery.filter(x=>x?.approved===true||x?.marketingOk===true);
 if(enabled.includes("gallery")&&approvedPhotos.some(x=>
  !safe(x?.alt)&&!safe(x?.caption)&&!safe(x?.description)))
  add("photo_descriptions","advisory","Some approved photos have no descriptive text.",
   "Review image accessibility descriptions before publication.");
 if(choices.galleryLayout==="grid"&&choices.imageScale==="large")
  add("gallery_density","advisory",
   "Large photos in a grid may be harder to scan on narrow devices.",
   "Compare a stacked gallery on a real phone.");
 if(enabled.includes("booking_request"))add("booking_journey_untested","needs_test",
  "A booking request is not a confirmed appointment.",
  "Test request submission, acknowledgement and business confirmation end-to-end.");
 if(enabled.includes("enquiry"))add("enquiry_journey_untested","needs_test",
  "This configuration cannot prove real enquiries are delivered.",
  "Test acknowledgement, business response and customer status on a real device.");
 add("screen_reader_untested","needs_test",
  "Static checks cannot verify VoiceOver or TalkBack behaviour.",
  "Test every interactive control using a screen reader.");
 add("tap_targets_untested","needs_test",
  "The app must be inspected for actual touch target size and spacing.",
  "Test physical tap targets on a phone and tablet.");
 add("text_scaling_untested","needs_test",
  "The preview cannot prove large OS text will fit all screens.",
  "Test large text and accessibility zoom on both platforms.");
 add("contrast_untested","needs_test",
  "The screenshot has not been independently measured for text contrast.",
  "Check foreground/background contrast using an instrumented tool.");
 return {ok:!!config&&Array.isArray(config.modules),
  kind:"static_app_usability_audit_v3160",issues,passed,
  importantCount:issues.filter(x=>x.severity==="important").length,
  manualTestsNeeded:issues.filter(x=>x.severity==="needs_test").length,
  neverCertifiesAccessibility:true,pixelMeasurementPerformed:false,
  noCustomerDataIncluded:true,safeAutomaticEdits:[],createdBookings:false,
  proofSource:"finite_public_config_rules_only"};
}
function compareBusinessAppDesign(before,after){
 if(!before||!after||!Array.isArray(before.modules)||!Array.isArray(after.modules))
  return {ok:false,reason:"Choose two real private Business App configurations."};
 const original=before.presentation||{},candidate=after.presentation||{},changes=[];
 if(Object.keys(candidate).some(k=>!Object.prototype.hasOwnProperty.call(OPTIONS,k)||
    !OPTIONS[k].includes(candidate[k])))
  return {ok:false,reason:"The proposed design contains an unsupported appearance setting."};
 for(const field of Object.keys(OPTIONS)){
  const old=original[field]||DEFAULTS[field],now=candidate[field]||DEFAULTS[field];
  if(old!==now)changes.push({field,from:old,to:now,label:field.replace(/([A-Z])/g," $1").toLowerCase()});
 }
 const order=v=>Array.isArray(v.navigation)?v.navigation:
   v.modules.filter(x=>x.enabled===true).map(x=>x.key);
 if(JSON.stringify(order(before))!==JSON.stringify(order(after)))
  changes.push({field:"navigationOrder",from:order(before).map(x=>names[x]||x).join(", "),
   to:order(after).map(x=>names[x]||x).join(", "),label:"section order"});
 const modulesUnchanged=JSON.stringify(before.modules)===JSON.stringify(after.modules);
 const businessUnchanged=JSON.stringify(before.publicProfile)===JSON.stringify(after.publicProfile);
 const operationalUnchanged=["offers","loyalty","permissions","payments",
  "runtimeConnection"].every(k=>JSON.stringify(before[k])===JSON.stringify(after[k]));
 return {ok:true,kind:"private_app_comparison_v3160",changes,
  changeCount:changes.length,modulesUnchanged,
  businessContentUnchanged:businessUnchanged,
  operationalSettingsUnchanged:operationalUnchanged,
  designOnly:modulesUnchanged&&businessUnchanged&&operationalUnchanged,
  publicUntilApproved:false,approvedForPublishing:false,
  screenshotsCompared:false,layoutPixelsMeasured:false,
  warning:"This compares supported configuration fields, not image pixels or live behaviour."};
}
export {auditBusinessAppUsability,compareBusinessAppDesign};
