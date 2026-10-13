/**
 * V3.197: useful, non-pushy owner app opportunity. Commercial claims are
 * strictly gated on a trusted, business-scoped provider-ledger readback.
 * No scheduled nudges, outbound messages, spend, subscriptions or purchases.
 */
const clean=(s,max=140)=>typeof s==="string"&&s.length<=max&&
 !/[<>\u0000-\u001f\u007f]/.test(s)?s.trim():"";
function recommendOwnerBusinessApp({
 businessId="",website=null,app=null,businessType="",services=[],
 entitlement=null,dismissed=false
}={}){
 if(!clean(businessId,128)||dismissed===true||app||
    !website||typeof website!=="object"||!Array.isArray(website.sections)||
    !Number.isSafeInteger(website.generation)||website.generation<1||
    website.business_id&&website.business_id!==businessId||
    website.businessId&&website.businessId!==businessId)
  return {show:false,reason:"No eligible owner recommendation."};
 const type=clean(businessType,120).toLowerCase();
 const appointments=/hair|barber|beauty|salon|appointment|massage|nail|therap|clinic|tutor/.test(type);
 const enquiries=/plumb|electric|repair|builder|gardening|cleaning|trade|contractor/.test(type);
 const food=/food|cater|bakery|cafe|coffee|roast|restaurant|stall|takeaway/.test(type);
 const hasServices=Array.isArray(services)&&services.some(s=>clean(s?.name,120));
 const hasWebsiteServices=website.sections.some(s=>s?.type==="services"&&
  Array.isArray(s.items)&&s.items.some(x=>clean(x?.title,120)));
 const helpful=appointments||enquiries||food||hasServices||hasWebsiteServices;
 if(!helpful)return {show:false,reason:"Insufficient evidence that an app would help."};
 const reason=appointments?
  "Customers could send booking requests and review your services without hunting through a website.":
  enquiries?"A simple enquiry and services app could help customers contact you when they need work done.":
  food?"An app could make menus, offers and enquiries easier to find for returning customers.":
  "You already have services customers may want to find quickly on their phones.";
 const confirmed=entitlement?.verified===true&&entitlement?.eligible===true&&
  entitlement?.businessId===businessId&&
  Number.isSafeInteger(entitlement?.remaining)&&entitlement.remaining>0&&
  entitlement?.authorizesBuild===false;
 return {show:true,kind:"owner_app_opportunity_v3197",
  businessId,reason,entitlementVerified:confirmed,
  includedBenefitText:confirmed?
   "Your verified subscription currently has a standalone app creation allowance available.":
   "",
  entitlementText:confirmed?
   "This benefit is confirmed for your business. App-store accounts, signing and distribution may still involve separate charges or sign-ups.":
   "Check your subscription to see whether standalone app creation is included. No entitlement has been confirmed.",
  headline:confirmed?"An app could help — and you have an included allowance":
   "Your business might benefit from an app",
  ownerCanDismiss:true,ownerActionOnly:true,neverAutoCreates:true,
  neverAutoContacts:true,doesNotGuaranteeStoreDistribution:true,
  proposalNotProofOfBusinessOutcome:true};
}
export {recommendOwnerBusinessApp};
