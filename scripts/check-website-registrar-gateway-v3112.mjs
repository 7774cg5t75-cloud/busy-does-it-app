import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validDomain,normalizeRegistrarLookup,checkRegistrarDomain}
 from "../supabase/functions/busy-website-publish/domainRegistrarGateway.mjs";
let n=0;
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);n++};
const ok=(a,msg)=>{assert.ok(a,msg);n++};
const tenant="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const other="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const domain="gardenstudio.co.uk", now=Date.parse("2026-10-10T16:00:00Z");
eq(validDomain(domain),domain,"A supported UK domain");
eq(validDomain("GARDENSTUDIO.CO.UK"),domain,"Case normalized");
for(const bad of ["www.example.co.uk","example.other","http://gardenstudio.co.uk",
"gardenstudio.co.uk/foo","xn--abc.uk","semi;colon.com","bad  host.uk"])
 eq(validDomain(bad),"","Disallow unsupported lookup "+bad);
const off=await checkRegistrarDomain({domain,businessId:tenant,now});
eq(off.status,"not-connected","No connected registrar");
eq(off.liveLookupPerformed,false,"Never imply real lookup occurred");
eq(off.availability,"unknown","No fabricated availability");
eq(off.quote,null,"No fabricated price");
eq(off.checkoutEnabled,false,"Domain purchase is disabled");
let calls=0;
const forbidden=async()=>{calls++;throw Error("Not allowed");};
const disabled=await checkRegistrarDomain({domain,businessId:tenant,
 adapter:{id:"opensrs-qa",liveEnabled:false,lookup:forbidden},now});
eq(disabled.status,"not-connected","No calls while disabled");
eq(calls,0,"Zero billable provider calls");
eq((await checkRegistrarDomain({domain:"www.example.co.uk",businessId:tenant,
 adapter:{id:"opensrs-qa",liveEnabled:true,lookup:forbidden},now})).status,
 "invalid","Invalid domain rejected before lookup");
eq(calls,0,"Invalid input makes zero provider calls");
const raw={live:true,domain,businessId:tenant,provider:"opensrs-qa",
 availability:"available",checkedAt:"2026-10-10T15:59:30.000Z",
 pricing:{quoteId:"quote_test_123456789",currency:"GBP",
 registrationMinor:1299,renewalMinor:1899,taxMinor:260,
 totalMinor:1559,years:1,premium:false,taxIncluded:false,
 issuedAt:"2026-10-10T15:59:30.000Z",expiresAt:"2026-10-10T16:05:00.000Z",
 termsUrl:"https://example.test/terms"}};
const normal=input=>normalizeRegistrarLookup({domain,businessId:tenant,providerId:"opensrs-qa",
 raw:input,now});
const good=normal(raw);
eq(good.availability,"available","Valid synthetic provider quote validated");
eq(good.quote.registrationMinor,1299,"Registration fee preserved");
eq(good.quote.renewalMinor,1899,"Renewal fee preserved");
eq(good.quote.totalMinor,1559,"Full first charge preserved");
eq(good.checkoutEnabled,false,"Even valid quotes cannot register or pay");
for(const bad of [
 {...raw,domain:"someother.com"},{...raw,businessId:other},
 {...raw,provider:"another"},{...raw,live:false},
 {...raw,checkedAt:"2026-10-10T15:30:00.000Z"},
 {...raw,pricing:{...raw.pricing,totalMinor:1299}},
 {...raw,pricing:{...raw.pricing,renewalMinor:null}},
 {...raw,pricing:{...raw.pricing,premium:null}},
 {...raw,pricing:{...raw.pricing,years:0}},
 {...raw,pricing:{...raw.pricing,expiresAt:"2026-10-10T15:59:00.000Z"}},
 {...raw,pricing:{...raw.pricing,termsUrl:"http://example.test/terms"}},
 {...raw,pricing:{...raw.pricing,taxMinor:-1}}
]){
 const answer=normal(bad);
 eq(answer.availability,"unknown","Untrusted/stale provider response fails closed");
 eq(answer.quote,null,"No untrusted price displayed");
}
const taken=normal({...raw,availability:"unavailable",pricing:null});
eq(taken.availability,"unavailable","Provider can report unavailable");
eq(taken.quote,null,"Unavailable name has no buyable quote");
const enabled=await checkRegistrarDomain({domain,businessId:tenant,
 adapter:{id:"opensrs-qa",liveEnabled:true,lookup:async({domain:d,businessId:b})=>{
  calls++;eq(d,domain,"Exact domain bound");
  eq(b,tenant,"Exact business bound");return raw;}},now});
eq(enabled.availability,"available","Synthetic adapter integration contract");
eq(calls,1,"Only test-only explicitly enabled adapter was called");
const failed=await checkRegistrarDomain({domain,businessId:tenant,
 adapter:{id:"opensrs-qa",liveEnabled:true,lookup:async()=>{throw Error("provider down");}},now});
eq(failed.status,"unavailable-service","Provider failure handled safely");
eq(failed.availability,"unknown","Unknown result remains unknown");
const backend=readFileSync(new URL("../supabase/functions/busy-website-publish/index.ts",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
ok(backend.includes('"registrar_search",')&&backend.includes('if(action==="registrar_search")'),
 "Action is in owner/admin membership gate");
ok(backend.includes("checkRegistrarDomain({domain,businessId,adapter:null})"),
 "Live provider calls are hard-disabled");
ok(backend.includes("writeActions.has(action)"),"Owner/admin gate retained");
ok(app.includes('websitePublishingRequest("registrar_search",{domain})'),"App calls authenticated gateway");
ok(app.includes("data?.registrar?.checkoutEnabled!==false"),"App rejects unexpected checkout");
ok(ui.includes("Check if live domain search is connected"),"User knows this is a status check");
ok(ui.includes("Searching here cannot register or buy a domain."),"User sees no-purchase guarantee");
ok(ui.includes("registrarRequestRef.current!==domainToCheck"),"Outdated replies are ignored");
console.log("V3.112 PASS: "+n+" domain contracts, business isolation, exact quotes, no hidden charges or purchases.");
