/**
 * V3.124 Global-Ready display foundation. Explicit values only: never guess
 * currency/tax/locales from phone location or route customers to another
 * region automatically. Formatting DOES NOT set billing, legal jurisdiction,
 * data residency, translation or regional provider availability.
 */
const ISO=/^[A-Z]{2}$/,CUR=/^[A-Z]{3}$/;
function websiteRegionalReadiness({locale="",currency="",timeZone="",
 countryCode="",languageApproved=false,regionalConsentReviewed=false}={}){
 let normalizedLocale=null,normalizedCurrency=null,normalizedZone=null;
 let languageValid=false,moneyValid=false,zoneValid=false;
 if(typeof locale==="string"&&locale.length<=24){
  try{const val=new Intl.DateTimeFormat(locale).resolvedOptions().locale;
    if(locale.length>0&&val.toLowerCase().startsWith(locale.split("-")[0].toLowerCase())){
      normalizedLocale=val;languageValid=true;
    }
  }catch{}
 }
 if(CUR.test(currency)){
  try{normalizedCurrency=new Intl.NumberFormat(
    normalizedLocale||"en-GB",{style:"currency",currency})
    .resolvedOptions().currency;
    moneyValid=normalizedCurrency===currency;
  }catch{}
 }
 if(typeof timeZone==="string"&&timeZone.length<80&&timeZone){
  try{normalizedZone=new Intl.DateTimeFormat("en-GB",
    {timeZone}).resolvedOptions().timeZone;zoneValid=!!normalizedZone;}catch{}
 }
 const countryValid=ISO.test(countryCode);
 const checks=[
  {id:"locale",passed:languageValid&&languageApproved===true,
   label:"Explicit locale chosen and customer-facing translation reviewed"},
  {id:"currency",passed:moneyValid,label:"Valid display currency explicitly configured"},
  {id:"timezone",passed:zoneValid,label:"Named IANA timezone for appointments and scheduling"},
  {id:"country",passed:countryValid,label:"Business country explicitly confirmed"},
  {id:"consent",passed:regionalConsentReviewed===true,
   label:"Regional privacy, supplier and data residency obligations separately reviewed"}
 ];
 const pass=checks.filter(x=>x.passed).length;
 return {status:pass===checks.length?"display-context-reviewed":"needs-regional-review",
  checks,passed:pass,total:checks.length,
  locale:normalizedLocale,currency:normalizedCurrency,
  timeZone:normalizedZone,countryCode:countryValid?countryCode:null,
  canApplyBilling:false,canCollectTax:false,canSwitchResidency:false,
  canTranslateAutomatically:false,globalComplianceVerified:false,
  canReleaseInternationally:false,requiresRegionSpecificLegalReview:true};
}
export {websiteRegionalReadiness};
