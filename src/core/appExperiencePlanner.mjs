/**
 * V3.153 — business-specific recommendation for functional mini-app modules.
 * Pure planner: reads the currently available server-owned module catalogue.
 * Never activates unsupported/paid modules, fabricates services or mutates a
 * booking/payment. Owner controls actual draft module activation.
 */
const supportedLayouts=Object.freeze(["service-first","gallery-first","contact-first","events-first","minimal"]);
const categories=[
 ["food",/cater|restaurant|food|bakery|coffee|cafe|festival|chef|takeaway|meal/i],
 ["appointments",/hair|salon|barber|beauty|massage|nail|fitness|yoga|spa|therapy/i],
 ["trades",/electric|plumb|clean|roof|repair|gardener|landscape|builder|painter|decorat/i],
 ["creative",/photo|design|artist|florist|ceramic|pottery|studio|music|film/i],
 ["professional",/account|consult|law|legal|architect|tutor|bookkeep|advisor|coaching/i]
];
const arrange=(row,keys)=>[...row].sort((a,b)=>{
 const ai=keys.indexOf(a.key),bi=keys.indexOf(b.key);
 return (ai<0?99:ai)-(bi<0?99:bi);
});
function planFunctionalBusinessApp({businessType="",businessName="",catalog=[],profile={}}={}){
 const category=categories.find(([name,re])=>re.test(businessType))?.[0]||"other";
 const available=new Map((Array.isArray(catalog)?catalog:[])
  .filter(x=>x?.status==="available"&&typeof x.module_key==="string")
  .map(x=>[x.module_key,x]));
 const base=["business_profile","services","contact","enquiry"];
 const withBooking=["appointments","trades","professional"].includes(category);
 const ordered=category==="food"?["business_profile","services","gallery","offers","contact","enquiry"]:
  category==="appointments"?["business_profile","services","booking_request","gallery","contact","enquiry"]:
  category==="trades"?["business_profile","services","enquiry","gallery","booking_request","contact"]:
  category==="creative"?["business_profile","gallery","services","enquiry","contact"]:
  category==="professional"?["business_profile","services","enquiry","booking_request","contact"]:
  ["business_profile","services","contact","enquiry","gallery"];
 const suggestions=ordered.filter(key=>available.has(key)).map(key=>{
  const row=available.get(key);
  const requested=base.includes(key)||(key==="booking_request"&&withBooking);
  const ownerData=key==="gallery"?Array.isArray(profile?.assets?.gallery)&&
   profile.assets.gallery.some(x=>x?.approved!==false):
   key==="offers"?false:true;
  return {key,title:row.title||key,available:true,
   suggested:requested&&ownerData,
   actionCapability:row.capabilities?.customer_action===true,
   needsBusinessConfirmation:key==="booking_request",
   reason:key==="booking_request"?
    "Customers may request a booking; the business must still confirm it.":
    key==="offers"?"Available only when the owner supplies approved offer terms.":
    key==="enquiry"?"Customers can send an enquiry through the tested module.":
    "Uses the owner's approved business information."};
 });
 // The section/navigation proposal is advisory only. No disabled modules
 // are enabled by this function; server catalogue and owner still control them.
 const imageRich=Array.isArray(profile?.assets?.gallery)&&profile.assets.gallery.length>=2;
 const layout=category==="food"?"events-first":
  category==="creative"&&imageRich?"gallery-first":
  category==="appointments"?"service-first":
  category==="trades"?"contact-first":"minimal";
 return {version:1,businessName:String(businessName).slice(0,120),
  businessType:String(businessType).slice(0,120),category,
  layout:supportedLayouts.includes(layout)?layout:"minimal",
  suggestedModules:suggestions,visibleModuleKeys:suggestions.map(x=>x.key),
  excludedUnavailable:(Array.isArray(catalog)?catalog:[]).filter(x=>x?.status!=="available")
    .map(x=>x.module_key).filter(Boolean),
  ownerApprovalRequired:true,usesOnlyAvailableModules:true,
  canChangeLiveApp:false,canConfirmBooking:false,canEnablePayments:false};
}
export {supportedLayouts,planFunctionalBusinessApp};
