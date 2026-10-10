/**
 * V3.111 registrar-independent domain shopping foundation.
 *
 * The idea generator is offline and makes ZERO availability/price claims.
 * All future purchase flows must use live provider-sourced, business-bound,
 * unexpired quotes and fresh checkout consent. No network or purchase here.
 */
const own=x=>String(x||"").trim();
const EXTENSIONS=["co.uk","com","uk"];
const exactDomain=(value)=>{
 const d=own(value).toLowerCase();
 if(d.length>90||!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:co\.uk|com|uk)$/.test(d))return "";
 if(d.startsWith("xn--"))return ""; // IDN risk needs registrar-specific support later.
 return d;
};
function localDomainIdeas(input){
 const raw=own(input).toLowerCase();
 if(!raw||raw.length>100)return {ideas:[],liveLookupPerformed:false,message:"Enter a short business name to see ideas."};
 const direct=exactDomain(raw);
 const base=direct?direct.split(".")[0]:raw.replace(/[^a-z0-9]+/g,"");
 if(!/^[a-z0-9][a-z0-9-]{0,47}$/.test(base)||base.length<3||
    /^xn--/.test(base)||base==="busydoesit")
   return {ideas:[],liveLookupPerformed:false,message:"Try a business name of at least three letters or numbers."};
 const names=[direct,...EXTENSIONS.map(ext=>base+"."+ext)].filter(Boolean);
 return {
   ideas:[...new Set(names)].slice(0,3).map(name=>({
     domain:name,availability:"not-checked",registrationPrice:null,renewalPrice:null,
     claim:"Name idea only — availability and prices are not checked."
   })),
   liveLookupPerformed:false,
   message:"Ideas only. BUSY has not checked whether any domain is available or what it costs."
 };
}
const money=x=>Number.isSafeInteger(x)&&x>=0&&x<=10_000_000;
const quoteReason=(quote,{domain,businessId,now})=>{
 const errors=[];
 if(!quote||typeof quote!=="object")return ["Live domain quote missing."];
 const timestamp=Number.isFinite(now)?now:Date.now();
 const issued=Date.parse(own(quote.issuedAt)),expires=Date.parse(own(quote.expiresAt));
 if(quote.source!=="registrar-live-check"||quote.registrable!==true)
   errors.push("Real-time registrar availability has not been verified.");
 if(quote.domain!==exactDomain(domain)||!exactDomain(domain))
   errors.push("Quoted domain does not match the requested domain.");
 if(!businessId||quote.businessId!==businessId)
   errors.push("Quote belongs to a different business.");
 if(!/^[a-z0-9][a-z0-9-]{2,62}$/.test(own(quote.provider))||
    !/^[a-zA-Z0-9_-]{10,140}$/.test(own(quote.quoteId)))
   errors.push("No traceable registrar quote.");
 if(!["GBP","USD","EUR"].includes(quote.currency))
   errors.push("Currency is unsupported.");
 if(!money(quote.registerMinor)||!money(quote.renewMinor)||
    !money(quote.taxMinor)||!money(quote.totalMinor)||
    quote.totalMinor!==quote.registerMinor+quote.taxMinor)
   errors.push("Registration, tax or renewal charges are missing or inconsistent.");
 if(!Number.isSafeInteger(quote.years)||quote.years<1||quote.years>10)
   errors.push("Registration duration is not specified.");
 if(!Number.isFinite(issued)||!Number.isFinite(expires)||
    issued>timestamp||timestamp>=expires||expires-issued>10*60*1000||
    issued<timestamp-10*60*1000)
   errors.push("Live quote is expired or incorrectly timed.");
 if(typeof quote.premium!=="boolean")errors.push("Premium status is missing.");
 if(quote.renewalDisclosureConfirmed!==true)
   errors.push("Renewal price has not been independently disclosed.");
 if(typeof quote.termsUrl!=="string"||!/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(quote.termsUrl))
   errors.push("Registrar terms are not available through HTTPS.");
 return errors;
};
function evaluateDomainPurchase({
 domain="",businessId="",quote=null,now=Date.now(),
 registrarEnabled=false,ownerApproved=false,termsAccepted=false,
 renewalsAcknowledged=false,registrantVerified=false,
 paymentAuthorized=false,checkoutIdempotencyKey=""
}={}){
 const quoteIssues=quoteReason(quote,{domain,businessId,now});
 const reasons=[...quoteIssues];
 if(registrarEnabled!==true)reasons.push("Registrar purchases are not enabled in BUSY.");
 if(ownerApproved!==true)reasons.push("The business owner has not approved this purchase.");
 if(termsAccepted!==true)reasons.push("Registrar terms must be accepted.");
 if(renewalsAcknowledged!==true)reasons.push("The renewal price and expiry conditions must be acknowledged.");
 if(registrantVerified!==true)reasons.push("Customer registrant details must be verified.");
 if(paymentAuthorized!==true)reasons.push("An explicit payment authorization is required.");
 if(!/^[a-zA-Z0-9_-]{16,120}$/.test(checkoutIdempotencyKey))
   reasons.push("A stable one-time checkout reference is required.");
 return {
   canPrepareCheckout:reasons.length===0,
   canExecutePurchase:false, // No purchasing adapter, DB ledger or licensed reseller is connected.
   reasons,
   // Display quoted amounts only after *all* provider/tenant/freshness terms pass.
   // An invalid foreign-tenant quote must not leak another customer's prices.
   transparentCharges:quote&&quoteIssues.length===0?
      {currency:quote.currency,registerMinor:quote.registerMinor,
        taxMinor:quote.taxMinor,totalMinor:quote.totalMinor,
        renewMinor:quote.renewMinor,years:quote.years,premium:quote.premium}:null,
   note:"Preview only. Purchasing, billing, renewals and domain registration remain disabled."
 };
}
export {exactDomain,localDomainIdeas,evaluateDomainPurchase};
