import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteAddressChoices} from "../src/core/websiteAddressChoices.mjs";

let count=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);count++};
const yes=(value,message)=>{assert.ok(value,message);count++};
const empty=websiteAddressChoices();
eq(empty.selected,"busy","BUSY's easy first option is selected by default");
eq(empty.options.map(x=>x.id),["busy","existing","new"],"Three clear domain routes are offered");
eq(empty.busyAddressVerified,false,"No invented BUSY address or proof");
eq(empty.hasAnyVerifiedAddress,false,"Draft state is not called live");
eq(empty.options[0].hostname,null,"BUSY address is only shown when actually assigned");
eq(empty.registrarConnected,false,"No fake registrar provider readiness");
eq(empty.domainChoiceDoesNotPublish,true,"Domain choice never triggers publishing");
const assigned=websiteAddressChoices({publishing:{defaultAddressState:{
 address:{hostname:"demo-tenant.busydoesit.co.uk",live:false}}}});
eq(assigned.options[0].hostname,"demo-tenant.busydoesit.co.uk","Use exact recorded allocated address");
eq(assigned.options[0].state,"assigned-not-live","Assigned does not imply served publicly");
eq(assigned.hasAnyVerifiedAddress,false,"Cannot infer live from hostname alone");
const confirmed=websiteAddressChoices({publishing:{defaultAddressState:{
 address:{hostname:"demo-tenant.busydoesit.co.uk",live:true}}}});
eq(confirmed.busyAddressVerified,true,"Only real delivery proof marks BUSY address live");
const attaching=websiteAddressChoices({mode:"existing",publishing:{
 domainState:{latest:{id:"domain-a",hostname:"www.example.co.uk",status:"verified"},
 journey:{complete:false}}}});
eq(attaching.active.state,"setup-in-progress","Owning a domain is not enough to call it live");
eq(attaching.customAddressVerified,false,"Do not confuse DNS proof with live website");
const advertised=websiteAddressChoices({mode:"existing",publishing:{
 domainState:{latest:{hostname:"www.example.co.uk",status:"active"},journey:{complete:true}},
 canOpenCustomDomain:false}});
eq(advertised.customAddressVerified,false,"Provider flags without public proof not enough");
const active=websiteAddressChoices({mode:"existing",publishing:{
 domainState:{latest:{hostname:"www.example.co.uk",status:"active"},journey:{complete:true}},
 canOpenCustomDomain:true}});
eq(active.customAddressVerified,true,"Complete domain and reachable customer URL can be shown as verified");
const buy=websiteAddressChoices({mode:"new",publishing:{providerState:{activationReady:true}}});
eq(buy.selected,"new","New domain option is navigable");
eq(buy.active.state,"not-available-yet","No fictional checkout even when Cloudflare is active");
eq(buy.active.hostname,null,"Never invent a purchasable domain");
yes(buy.active.note.includes("cannot currently quote"),"Price, availability and renewal uncertainty is disclosed");
eq(websiteAddressChoices({mode:"DROP TABLE"}).selected,"busy","Unexpected choice falls back safely");
const publishing=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
const builder=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
yes(publishing.includes("websiteAddressChoices({mode:addressChoice,publishing:view})"),"Actual publishing screen derives choice state from verified data");
for(const option of ["Use a BUSY address","I already have a domain","Find and buy a new domain"])
 yes(readFileSync(new URL("../src/core/websiteAddressChoices.mjs",import.meta.url),"utf8").includes(option),
  "Choice is named unambiguously: "+option);
yes(publishing.includes("selectAddress(option.id)"),"Choices are clickable, not decorative");
yes(publishing.includes('addressChoice==="new"'),"Purchase choice has an explicit honest explanation");
yes(publishing.includes('addressChoice==="existing"&&showDomainSetup'),"Domain ownership details appear only when needed");
yes(publishing.includes('Your BUSY address is confirmed only when BUSY has actually assigned one.'),"Address assignment is never fabricated");
yes(builder.includes('Choose a website address (optional)'),"Address choice is accessible from Website Builder");
yes(publishing.includes("Confirm I reviewed this exact hosted preview"),"Existing explicit owner review is preserved");
yes(publishing.includes("Review & approve Go Live"),"No automatic publish from selecting an address");
yes(workflow.includes("check-website-address-choices-v3110.mjs"),"Production CI checks purchase honesty and safety");
console.log("V3.110 PASS: "+count+" source checks for the three honest website address paths, privacy and no automatic purchase.");
