import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteCustomerJourney} from "../src/core/websiteCustomerJourney.mjs";
import {websiteDomainResponsibilities} from "../src/core/websiteDomainResponsibilities.mjs";
import {evaluateDomainPurchase} from "../src/core/websiteDomainShopping.mjs";
import {compareWebsiteAudits} from "../supabase/functions/busy-website-worker/websiteReviewCycle.mjs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
let n=0;
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);n++};
const yes=(a,msg)=>{assert.ok(a,msg);n++};
// Track 1: Website has one clear next action with NO domain-purchase dependency.
const empty=websiteCustomerJourney({journey:{missingCoreFacts:["name"],nextAction:"brand"}});
eq(empty.next,"describe","Business brief comes first");
eq(empty.domainPurchaseRequired,false,"A domain purchase cannot block starting a site");
eq(empty.addressOptional,true,"Owners may keep BUSY address");
const brief=websiteCustomerJourney({journey:{missingCoreFacts:[],nextAction:"build"}});
eq(brief.next,"design","Customer knows a draft still needs designing");
eq(websiteCustomerJourney({journey:{missingCoreFacts:[],nextAction:"prepare"},hasDraft:true}).next,
"prepare","Private draft needs actual hosted preview");
const view={previewDeployment:{id:"preview-a"},draftChangedSinceHosted:false};
const preview=websiteCustomerJourney({journey:{missingCoreFacts:[],nextAction:"review"},
publishing:view,hasDraft:true});
eq(preview.next,"approve","Exact hosted preview gates approval");
eq(preview.previewVerified,true,"Hosted preview is current, not necessarily approved");
eq(websiteCustomerJourney({journey:{missingCoreFacts:[],nextAction:"review"},
publishing:{...view,draftChangedSinceHosted:true},hasDraft:true}).next,
"prepare","Changed private draft makes previously hosted version outdated");
eq(websiteCustomerJourney({journey:{missingCoreFacts:[],nextAction:"verify"},
publishing:{...view,liveDeployment:{id:"deployment"}},hasDraft:true}).next,
"check-live","Publication must not imply verified health");
eq(websiteCustomerJourney({journey:{missingCoreFacts:[],nextAction:"maintain"},
publishing:{...view,liveDeployment:{id:"deployment"}},proof:{verified:true},hasDraft:true}).next,
"maintain","Only real delivery proof shows verified website");
eq(websiteCustomerJourney({journey:{missingCoreFacts:[],nextAction:"maintain"},
publishing:{...view,liveDeployment:{id:"deployment"}},proof:{verified:false},hasDraft:true}).liveVerified,
false,"A misleading journey flag cannot bypass matching delivery proof");
// Track 2: Plain-language domain customer ownership and no fake renewal dates.
for(const mode of ["busy","existing","new"]){
 const info=websiteDomainResponsibilities({mode,connectedDomain:{hostname:"www.salon.co.uk"}});
 eq(info.managedByBusy,false,"No uncontracted renewal management claimed for "+mode);
 eq(info.verifiedRenewalDate,null,"No invented expiry for "+mode);
}
yes(websiteDomainResponsibilities({mode:"existing"}).message.includes("current registrar"),
"Existing-domain owners know where renewals are handled");
yes(websiteDomainResponsibilities({mode:"new"}).message.includes("cannot register"),
"No fictional domain registration");
yes(websiteDomainResponsibilities({mode:"busy"}).message.includes("confirm"),
"Platform address allocation never assumed");
// Track 3: Providers cannot leak a foreign or expired tenant quote in UI.
const domain="examplebusiness.co.uk",businessId="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const now=Date.parse("2026-10-10T15:05:00Z");
const quote={source:"registrar-live-check",registrable:true,domain,businessId,
 provider:"sample-reseller",quoteId:"quote_123456789abc",
 currency:"GBP",registerMinor:1299,renewMinor:1899,taxMinor:260,totalMinor:1559,
 years:1,premium:false,issuedAt:"2026-10-10T15:04:30Z",
 expiresAt:"2026-10-10T15:09:30Z",renewalDisclosureConfirmed:true,
 termsUrl:"https://example.test/terms"};
const check=q=>evaluateDomainPurchase({domain,businessId,quote:q,now});
eq(check(quote).transparentCharges.totalMinor,1559,"Valid trusted prices visible for informed consent even before checkout");
eq(check({...quote,businessId:"another-tenant"}).transparentCharges,null,
"Wrong tenant's price cannot leak into owner-facing payment information");
eq(check({...quote,expiresAt:"2026-10-10T15:04:45Z"}).transparentCharges,null,
"Expired quote cannot appear to be current");
eq(check({...quote,source:"cached-idea"}).transparentCharges,null,
"Unverified offline idea never becomes a price");
eq(check({...quote,renewMinor:null}).transparentCharges,null,
"Missing renewal pricing is never presented");
eq(check({...quote,totalMinor:1299}).transparentCharges,null,
"Inconsistent tax and total reject display");
eq(check(quote).canExecutePurchase,false,"Even trusted real-shaped quote cannot purchase");
// Track 4: Real design review must retain coverage, not only reduce warning totals.
const quality=(overrides={})=>({version:1,assessedTextCount:14,
unassessedContrastCount:0,lowContrastCount:0,smallBodyTextCount:0,
smallTouchTargetCount:0,unnamedControlsCount:0,missingInputLabelCount:0,
missingImageAltCount:0,headingLevelSkips:0,hasDocumentLanguage:true,
hasMainLandmark:true,...overrides});
const audit=(q)=>({mobileAudit:{horizontalOverflowPixels:0,headingVisible:true,
navigationFits:true,heroHeadingFontPx:36,qualityAudit:q},
desktopAudit:{horizontalOverflowPixels:0,headingVisible:true,
navigationFits:true,heroHeadingFontPx:48,qualityAudit:q}});
eq(compareWebsiteAudits(audit(quality()),audit(quality())).noNewMeasuredProblems,
true,"Equal measured evidence is acceptable without pretending improvement");
eq(compareWebsiteAudits(audit(quality()),audit(quality({unassessedContrastCount:1}))).noNewMeasuredProblems,
false,"Newly unmeasurable contrast rejects a candidate");
eq(compareWebsiteAudits(audit(quality()),audit(quality({assessedTextCount:13}))).noNewMeasuredProblems,
false,"Lost review coverage rejects a candidate");
yes(compareWebsiteAudits(audit(quality()),audit(quality({assessedTextCount:13}))).worsenedMetrics
 .some(x=>x.includes("coverage decreased")),"Lost measurement coverage has an explicit reason");
eq(compareWebsiteAudits(audit(quality()),audit(quality({smallTouchTargetCount:1}))).noNewMeasuredProblems,
false,"Undersized mobile actions are rejected");
const screen=readFileSync(new URL("../src/screens/websiteBuilder.js",import.meta.url),"utf8");
yes(screen.includes("Show me another design style"),"Customer can rotate without technical instructions");
yes(screen.includes("designChoices[designOptionIndex%designChoices.length]"),
"Different buttons actually select a different alternative");
yes(screen.includes("setDesignOptionIndex(current=>"),"Alternative selection changes state");
yes(screen.includes("websiteCustomerJourney({"),"Customer website roadmap is shown in the real editor");
const address=readFileSync(new URL("../src/screens/websitePublishing.js",import.meta.url),"utf8");
yes(address.includes("websiteDomainResponsibilities({mode:addressChoice"),
"Customer sees renewal ownership guidance within domain options");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
yes(workflow.includes("check-website-multi-track-v3114.mjs"),"All four contracts run in normal foundation CI");
const design=websiteDesignAlternative({id:"draft-1",businessType:"Festival catering",
theme:{designFamily:"artisan"},sections:[{id:"hero"}]});
yes(design.options.length>1,"Industry-specific site has real style alternatives");
console.log("V3.114 PASS: "+n+" customer simplicity, domain ownership, quote secrecy and honest website review checks.");
