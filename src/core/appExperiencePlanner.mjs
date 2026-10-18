import {reviewApprovedBuilderRecords} from './approvedBuilderRecords.mjs';
import {supportedAppCatalogModule} from './appCatalogSupport.mjs';
import {inspectCapabilityIntent} from './universalBuilderPlanV3210.mjs';
/**
 * V3.153 — business-specific recommendation for functional mini-app modules.
 * Pure planner: reads the currently available server-owned module catalogue.
 * Never activates unsupported/paid modules, fabricates services or mutates a
 * booking/payment. Owner controls actual draft module activation.
 */
const supportedLayouts=Object.freeze(["service-first","gallery-first","contact-first","events-first","minimal"]);
const categories=[
 ["food",/cater|restaurant|food|bakery|coffee|cafe|chef|takeaway|meal|street food|food stall/i],
 ["appointments",/hair|salon|barber|beauty|massage|nail|fitness|yoga|spa|therapy/i],
 ["trades",/electric|plumb|clean|roof|repair|gardener|landscape|builder|painter|decorat/i],
 ["creative",/photograph|videograph|artist|florist|ceramic|pottery|music studio|illustrat|film studio|graphic design/i],
 ["retail",/retail|bookshop|gift shop|jewel|clothing|fashion|boutique shop|independent shop|shopkeeper/i],
 ["learning",/school|tutor|lesson|training|education|academy|instructor|workshop leader|driving instruct/i],
 ["events",/event plan|wedding plan|event venue|conference|theatre|event production|entertainment|performer/i],
 ["professional",/account|consult|law|legal|architect|bookkeep|advisor|coaching/i]
];
function planFunctionalBusinessApp({businessType="",businessName="",businessGoals="",catalog=[],profile={},offerTerms=null,approvedContent=null,businessId=""}={}){
 // Goals are read as evidence of desired CUSTOMER actions, not authority to
 // enable paid, unavailable, unapproved or unimplemented features.
 const goal=String(businessGoals).slice(0,600).toLowerCase();
 const intent=inspectCapabilityIntent(goal),wanted=new Set(intent.requested),declined=new Set(intent.declined);
 const signals={catalogue:wanted.has('catalogue'),booking:wanted.has('booking_request'),gallery:wanted.has('gallery'),enquiry:wanted.has('enquiry'),events:wanted.has('events'),offers:wanted.has('offers')};
 const category=categories.find(([name,re])=>re.test(businessType))?.[0]||"other";
 const available=new Map((Array.isArray(catalog)?catalog:[])
  .filter(x=>typeof x?.module_key==="string"&&supportedAppCatalogModule(catalog,x.module_key))
  .map(x=>[x.module_key,x]));
 const base=["business_profile","services","contact","enquiry"];
 // A suggested request is never a confirmed appointment.
 const withBooking=["appointments","learning"].includes(category)||signals.booking;
 const approvedPhotos=Array.isArray(profile?.assets?.gallery)?
  profile.assets.gallery.filter(x=>(x?.approved===true||x?.marketingOk===true)&&
   ((typeof x?.uri==="string"&&/^https:\/\/[^\s"'<>]+$/i.test(x.uri))||
    (typeof x?.storagePath==="string"&&!!x.storagePath.trim()))):[];
 // Offers live in the actual private app configuration, not necessarily
 // in publicProfile. Only reviewed owner terms can unlock an offer suggestion.
 const terms=Array.isArray(offerTerms)?offerTerms:
  Array.isArray(profile?.offers)?profile.offers:[];
 const approvedOffers=terms.some(
  x=>x?.approved===true&&typeof x?.title==="string"&&!!x.title.trim());
 const ordered=category==="food"?["business_profile","services","gallery","offers","contact","enquiry"]:
  category==="appointments"?["business_profile","services","booking_request","gallery","contact","enquiry"]:
  category==="trades"?["business_profile","services","enquiry","gallery","booking_request","contact"]:
  category==="creative"?["business_profile","gallery","services","enquiry","contact"]:
  category==="retail"?["business_profile","services","gallery","offers","enquiry","contact"]:
  category==="learning"?["business_profile","services","booking_request","enquiry","contact","gallery"]:
  category==="events"?["business_profile","services","gallery","enquiry","booking_request","contact"]:
  category==="professional"?["business_profile","services","enquiry","booking_request","contact"]:
  ["business_profile","services","contact","enquiry","gallery"];
 // Dynamic reordering works for an unfamiliar trade as well as familiar ones.
 const prioritised=ordered.filter(x=>x==="business_profile");
 for(const key of [signals.booking?"booking_request":null,
   signals.gallery?"gallery":null,signals.enquiry?"enquiry":null,
   signals.offers?"offers":null,signals.events?"services":null])
  if(key&&available.has(key)&&!prioritised.includes(key))prioritised.push(key);
 const priorityOrder=[...prioritised,...ordered.filter(key=>!prioritised.includes(key))];
 const suggestions=priorityOrder.filter(key=>available.has(key)).map(key=>{
  const row=available.get(key);
  const requested=base.includes(key)||(key==="booking_request"&&withBooking)||
   (key==="gallery"&&(signals.gallery||
    ["creative","retail","events"].includes(category)&&approvedPhotos.length>0))||
   (key==="offers"&&signals.offers&&approvedOffers);
  const ownerData=key==="gallery"?approvedPhotos.length>0:
   key==="offers"?approvedOffers:true;
  const explicitlyDeclined=declined.has(key);
  return {key,title:row.title||key,available:true,
   suggested:requested&&ownerData&&!explicitlyDeclined,
   explicitlyDeclined,
   actionCapability:row.capabilities?.customer_action===true,
   needsBusinessConfirmation:key==="booking_request",
   reason:explicitlyDeclined?"You asked not to include this action; BUSY will not recommend enabling it.":key==="booking_request"?
    "Customers may request a booking; the business must still confirm it.":
    key==="offers"?"Show only offers with accurate, owner-approved terms.":
    key==="enquiry"?"A tracked enquiry needs verified submission and owner follow-up, not just a Contact link.":
    key==="gallery"?"Show only approved owner photographs; BUSY cannot invent a portfolio.":
    key==="services"?"Explain only owner-supplied services and products.":
    key==="contact"?"Use the owner's approved public contact information.":
    "Uses the owner's approved business information."};
 });
 // The section/navigation proposal is advisory only. No disabled modules
 // are enabled by this function; server catalogue and owner still control them.
 const imageRich=approvedPhotos.length>=2;
 const layout=signals.events||category==="events"?"events-first":
  (signals.gallery||["creative","retail"].includes(category))&&imageRich?"gallery-first":
  (signals.booking||["appointments","learning"].includes(category))?"service-first":
  (signals.enquiry||category==="trades")?"contact-first":
  category==="food"?"events-first":
  category==="retail"?"service-first":"minimal";
 const approvedRecords=reviewApprovedBuilderRecords(approvedContent,businessId);
 const hasApproved=kind=>approvedRecords.ok&&approvedRecords.records.some(row=>row.kind===kind&&row.count>0);
 const missingOwnerFacts=[
  ...((wanted.has('services')||signals.booking)&&(!Array.isArray(profile.services)||!profile.services.length)?['owner_service_details']:[]),
  ...(signals.catalogue&&!hasApproved('product')?['approved_product_records']:[]),
  ...(signals.events&&!hasApproved('event')?['approved_event_records']:[]),
  ...(signals.gallery&&!approvedPhotos.length?["approved_gallery_photos"]:[]),
  ...(signals.offers&&!approvedOffers?["approved_offer_terms"]:[])
 ];
 return {version:2,businessName:String(businessName).slice(0,120),
  businessType:String(businessType).slice(0,120),category,
  layout:supportedLayouts.includes(layout)?layout:"minimal",
  layoutReason:category==="other"?
   "BUSY chose a simple starting point until the business purpose is clearer.":
   "BUSY considered this "+category+" business, customer goals and available features.",
  approvedRecords:approvedRecords.ok?approvedRecords.records.filter(row=>row.count>0&&!declined.has(row.kind==='product'?'catalogue':'events')):[],
  approvedSnapshotAt:approvedRecords.ok?approvedRecords.snapshotAt:null,
  missingOwnerFacts,declinedCapabilities:intent.declined,needsClarification:intent.conflicts.length>0,conflictingCapabilities:intent.conflicts,
  suggestedModules:suggestions,visibleModuleKeys:suggestions.map(x=>x.key),
  understoodGoals:Object.entries(signals).filter(([,yes])=>yes).map(([key])=>key),
  unavailableGoalCapabilities:[
   ...(signals.booking&&!available.has("booking_request")?["booking_request"]:[]),
   ...(signals.gallery&&!available.has("gallery")?["gallery"]:[]),
   ...(signals.enquiry&&!available.has("enquiry")?["enquiry"]:[]),
   ...(signals.offers&&!available.has("offers")?["offers"]:[])
  ],
  excludedUnavailable:(Array.isArray(catalog)?catalog:[]).filter(x=>x?.status!=="available")
    .map(x=>x.module_key).filter(Boolean),
  ownerApprovalRequired:true,usesOnlyAvailableModules:true,
  recommendedNotEnabled:true,customerTaskNotTested:true,
  canChangeLiveApp:false,canConfirmBooking:false,canEnablePayments:false};
}
export {supportedLayouts,planFunctionalBusinessApp};
