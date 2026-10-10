import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {exactDomain,localDomainIdeas,evaluateDomainPurchase} from "../src/core/websiteDomainShopping.mjs";
let count=0;
const eq=(a,b,why)=>{assert.deepEqual(a,b,why);count++};
const yes=(x,why)=>{assert.ok(x,why);count++};
eq(exactDomain("  HAIRSALON.CO.UK "),"hairsalon.co.uk","Normalised domain");
eq(exactDomain("Jenny's Salon"),"","Raw business names cannot be passed as domains");
eq(exactDomain("demo.busydoesit.co.uk"),"","Cannot confuse a subdomain with a purchasable root");
eq(exactDomain("xn--abc.uk"),"","IDNs require separate provider-specific support");
eq(exactDomain("example.invalid"),"","Unsupported extensions blocked");
eq(localDomainIdeas("").ideas.length,0,"Blank ideas are not a search");
eq(localDomainIdeas("a").ideas.length,0,"Unclear one-letter business produces no names");
eq(localDomainIdeas("Jenny's Hair Salon").ideas.map(x=>x.domain),
 ["jennyshairsalon.co.uk","jennyshairsalon.com","jennyshairsalon.uk"],
 "Three offline sensible English-market suggestions");
eq(localDomainIdeas("TEST-SHOP.CO.UK").ideas.length,3,"User's selected exact domain is first");
const demo=localDomainIdeas("Orchard Gardens");
eq(demo.liveLookupPerformed,false,"Ideas never run registrar lookups");
yes(demo.ideas.every(x=>x.availability==="not-checked"&&
 x.registrationPrice===null&&x.renewalPrice===null),"Cannot imply availability or prices");
eq(localDomainIdeas("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa").ideas.length,0,
 "Extreme long input gets no unsafe domain");
const now=Date.parse("2026-10-10T15:05:00Z");
const domain="examplebusiness.co.uk";
const businessId="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const quote={
 source:"registrar-live-check",registrable:true,domain,businessId,
 provider:"mock-reseller-qa",quoteId:"quote_123456789abc",
 currency:"GBP",registerMinor:1299,renewMinor:1899,
 taxMinor:260,totalMinor:1559,years:1,premium:false,
 issuedAt:"2026-10-10T15:04:30Z",expiresAt:"2026-10-10T15:09:30Z",
 renewalDisclosureConfirmed:true,termsUrl:"https://example.test/terms",
};
const approval={domain,businessId,quote,now,
 registrarEnabled:true,ownerApproved:true,termsAccepted:true,
 renewalsAcknowledged:true,registrantVerified:true,paymentAuthorized:true,
 checkoutIdempotencyKey:"business91-checkout-123456"};
const reviewed=evaluateDomainPurchase(approval);
eq(reviewed.canPrepareCheckout,true,"An explicitly approved truthful quote could be used by a future adapter");
eq(reviewed.canExecutePurchase,false,"Even a fully valid quote cannot purchase without a real licensed adapter");
eq(reviewed.transparentCharges.renewMinor,1899,"Renewal price cannot be hidden");
eq(evaluateDomainPurchase({...approval,registrarEnabled:false}).canPrepareCheckout,false,
 "No registrar means no checkout");
eq(evaluateDomainPurchase({...approval,ownerApproved:false}).canPrepareCheckout,false,
 "Explicit owner confirmation is mandatory");
eq(evaluateDomainPurchase({...approval,paymentAuthorized:false}).canPrepareCheckout,false,
 "No charges without payment authorization");
eq(evaluateDomainPurchase({...approval,renewalsAcknowledged:false}).canPrepareCheckout,false,
 "Customer acknowledges future renewals");
eq(evaluateDomainPurchase({...approval,termsAccepted:false}).canPrepareCheckout,false,
 "Customer accepts registrar terms");
eq(evaluateDomainPurchase({...approval,registrantVerified:false}).canPrepareCheckout,false,
 "Registrants must be genuine and verified");
eq(evaluateDomainPurchase({...approval,checkoutIdempotencyKey:""}).canPrepareCheckout,false,
 "Retries require a stable unique key");
eq(evaluateDomainPurchase({...approval,businessId:"some-other-business"}).canPrepareCheckout,false,
 "Quotes cannot move between tenants");
eq(evaluateDomainPurchase({...approval,domain:"anotherdomain.com"}).canPrepareCheckout,false,
 "Quote cannot be reused for another domain");
eq(evaluateDomainPurchase({...approval,now:Date.parse(quote.expiresAt)}).canPrepareCheckout,false,
 "Expired availability/price cannot be purchased");
eq(evaluateDomainPurchase({...approval,quote:{...quote,renewMinor:null}}).canPrepareCheckout,false,
 "Renewal prices cannot be omitted");
eq(evaluateDomainPurchase({...approval,quote:{...quote,totalMinor:1299}}).canPrepareCheckout,false,
 "Tax must reconcile to total");
eq(evaluateDomainPurchase({...approval,quote:{...quote,premium:null}}).canPrepareCheckout,false,
 "Premium domain status must be explicit");
eq(evaluateDomainPurchase({...approval,quote:{...quote,issuedAt:"2026-10-09T15:00:00Z"}}).canPrepareCheckout,false,
 "Stale price quote fails closed");
eq(evaluateDomainPurchase({...approval,quote:{...quote,source:"cached-search"}}).canPrepareCheckout,false,
 "Cached result is never a real-time registration quote");
eq(evaluateDomainPurchase({...approval,quote:{...quote,registrable:false}}).canPrepareCheckout,false,
 "Unavailable domains can never move to checkout");
eq(evaluateDomainPurchase({}).canPrepareCheckout,false,
 "Empty input is safe");
const ui=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
yes(ui.includes('localDomainIdeas(domainIdeaInput)'),"Actual mobile screen uses offline-only helper");
yes(ui.includes('Show possible names (not availability)'),"Button makes lack of live check clear");
yes(ui.includes('value={domainIdeaInput}'),"Users control their input");
yes(ui.includes('label="Business name or domain idea"'),"Domain input is labelled");
yes(ui.includes('domainIdeaPreview.ideas.map'),"UI displays each generated candidate");
yes(ui.includes('idea.claim'),"Every idea carries a no-availability warning");
yes(ui.includes('registered')===false||ui.includes('no domain availability'),"UI does not state a purchased domain exists");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
yes(workflow.includes('check-website-domain-shopping-v3111.mjs'),"Contract checked on every production branch");
console.log("V3.111 PASS: "+count+" offline domain-name, truthful-quote, tenant isolation and purchase-consent checks.");
