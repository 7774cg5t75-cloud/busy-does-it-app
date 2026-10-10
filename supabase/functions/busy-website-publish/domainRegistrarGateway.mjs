/**
 * Registrar-agnostic lookup boundary for BUSY website addresses.
 *
 * No concrete registrar adapter or secrets are included. The live request
 * handler deliberately passes NO adapter. Inert/untrusted results always
 * remain "unknown" and never become a price, ownership or checkout claim.
 */
const normalize=value=>String(value||"").trim().toLowerCase();
const validDomain=value=>{
  const domain=normalize(value);
  if(domain.length>90||domain.startsWith("xn--"))return "";
  return /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?\.(?:co\.uk|uk|com)$/.test(domain)?domain:"";
};
const validBusiness=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const minorUnits=n=>Number.isSafeInteger(n)&&n>=0&&n<=10000000;
const result=(domain,status,message,extra={})=>({
  domain:domain||null,status,liveLookupPerformed:false,
  availability:"unknown",quote:null,registrarConnected:false,
  checkoutEnabled:false,message,...extra
});
/** Validate source-provided registration + renewal price *before* displaying. */
function normalizeRegistrarLookup({domain,businessId,providerId,raw,now=Date.now()}={}){
  const requested=validDomain(domain);
  const adapter=normalize(providerId);
  if(!requested||!validBusiness(businessId)||!/^[a-z][a-z0-9-]{2,63}$/.test(adapter))
    return result(requested,"invalid","Domain or registrar context could not be verified.");
  if(!raw||raw.live!==true||raw.domain!==requested||
     raw.businessId!==businessId||raw.provider!==adapter||
     !["available","unavailable"].includes(raw.availability))
    return result(requested,"unverified","The registrar did not return a trustworthy live result.");
  const checkedAt=Date.parse(raw.checkedAt);
  if(!Number.isFinite(checkedAt)||checkedAt>now||checkedAt<now-120000)
    return result(requested,"expired","The registrar result needs a fresh check.");
  if(raw.availability==="unavailable")
    return {...result(requested,"checked","The registrar currently reports this domain is unavailable."),
      liveLookupPerformed:true,availability:"unavailable",registrarConnected:true};
  const p=raw.pricing||{};
  const issuedAt=Date.parse(p.issuedAt),expiresAt=Date.parse(p.expiresAt);
  const total=p.registrationMinor+p.taxMinor;
  if(!minorUnits(p.registrationMinor)||!minorUnits(p.renewalMinor)||
     !minorUnits(p.taxMinor)||!minorUnits(p.totalMinor)||total!==p.totalMinor||
     !["GBP","EUR","USD"].includes(p.currency)||
     p.years!==1||typeof p.premium!=="boolean"||
     typeof p.taxIncluded!=="boolean"||
     !Number.isFinite(issuedAt)||!Number.isFinite(expiresAt)||
     issuedAt>now||expiresAt<=now||expiresAt-issuedAt>600000||
     !/^[a-zA-Z0-9_-]{10,120}$/.test(String(p.quoteId||""))||
     typeof p.termsUrl!=="string"||!/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(p.termsUrl))
    return result(requested,"price-unverified",
      "Availability was checked, but a complete current registration and renewal quote is missing.");
  return {...result(requested,"checked",
      "Live registrar information received. Prices still require approval before checkout."),
    liveLookupPerformed:true,availability:"available",registrarConnected:true,
    quote:{domain:requested,businessId,provider:adapter,quoteId:p.quoteId,
      currency:p.currency,registrationMinor:p.registrationMinor,
      taxMinor:p.taxMinor,totalMinor:p.totalMinor,renewalMinor:p.renewalMinor,
      years:p.years,premium:p.premium,taxIncluded:p.taxIncluded,
      issuedAt:p.issuedAt,expiresAt:p.expiresAt,termsUrl:p.termsUrl},
    checkoutEnabled:false};
}
/**
 * Injection is SERVER ONLY, never from a request body.
 * The released code deliberately supplies null so no network request occurs.
 */
async function checkRegistrarDomain({domain,businessId,adapter=null,now=Date.now()}={}){
 const clean=validDomain(domain);
 if(!clean||!validBusiness(businessId))
   return result(clean,"invalid","Enter a valid .co.uk, .uk or .com domain.");
 if(!adapter||adapter.liveEnabled!==true||
    typeof adapter.lookup!=="function"||typeof adapter.id!=="string")
   return result(clean,"not-connected",
     "Real domain availability and prices are not connected yet. These are ideas only; no purchase is possible.");
 try{
   const raw=await adapter.lookup({domain:clean,businessId});
   return normalizeRegistrarLookup({domain:clean,businessId,providerId:adapter.id,raw,now});
 }catch{
   return result(clean,"unavailable-service",
     "The registrar check could not be completed. No domain was purchased.");
 }
}
export {validDomain,normalizeRegistrarLookup,checkRegistrarDomain};
