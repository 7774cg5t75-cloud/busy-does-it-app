import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {websiteStagingReadiness} from "../src/core/websiteStagingReadiness.mjs";
import {websiteCloudIsolationEvidence} from "../src/core/websiteCloudIsolationEvidence.mjs";
import {websiteRegionalReadiness} from "../src/core/websiteRegionalReadiness.mjs";
import {formatBusinessAppointment,formatBusinessCurrency} from "../src/core/websiteRegionDisplay.mjs";
import {websiteDecisionEvidence} from "../src/core/websiteDecisionEvidence.mjs";
import {designPreferenceSummary} from "../supabase/functions/busy-website-publish/designFeedback.mjs";
import {websiteDesignAlternative} from "../src/core/websiteDesignAlternatives.mjs";
import {websitePilotReadiness} from "../src/core/websitePilotReadiness.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
import {founderOperationalPriorities} from "../src/core/founderOperationalPriorities.mjs";
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};const yes=(x,m)=>{assert.ok(x,m);n++};
const a="91edb6db-3a02-4de4-9ba8-5c93b4e790a1",
 b="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const empty=websiteStagingReadiness();
eq(empty.status,"blocked","Staging isn't active by default");
eq(empty.passed,0,"No fake cloud proof");
eq(empty.total,12,"Twelve independent staging checks");
eq(empty.canRunAutomatically,false,"No automatic cloud probe");
eq(empty.canTouchProduction,false,"No production access");
eq(empty.canApplyMigrations,false,"No migration execution");
eq(empty.canSpendMoney,false,"No paid provider calls");
eq(empty.canEnrollCustomers,false,"No beta enrollment");
const keys=empty.checks.map(x=>x.id);
const evidence=Object.fromEntries(keys.map(k=>[k,{passed:true,source:"staging-live-check",
 traceId:"evidence_"+k, businessA:a,businessB:b}]));
const scoped={environment:"isolated-staging",businessA:a,businessB:b,
 productionCredentialsPresent:false,productionWritesAllowed:false,evidence};
eq(websiteStagingReadiness(scoped).status,"blocked",
 "Claimed fictional traces cannot certify real cloud");
eq(websiteStagingReadiness({...scoped,businessB:a,
 source:"independently-verified-staging"}).status,"blocked",
 "Two different business accounts required");
eq(websiteStagingReadiness({...scoped,source:"independently-verified-staging",
 productionCredentialsPresent:true}).status,"blocked","Production secret forbidden");
eq(websiteStagingReadiness({...scoped,source:"independently-verified-staging",
 productionWritesAllowed:true}).status,"blocked","Production writes forbidden");
const unreviewed=websiteStagingReadiness({...scoped,
 source:"independently-verified-staging",evidence:{...evidence,tenant:{...evidence.tenant,passed:false}}});
eq(unreviewed.status,"blocked","RLS must be verified independently");
eq(unreviewed.checks.find(x=>x.id==="tenant").passed,false,
 "A mere claim cannot stand in for tenant testing");
const ready=websiteStagingReadiness({...scoped,source:"independently-verified-staging"});
eq(ready.status,"ready-for-manual-staging-review",
 "Supplied staging evidence is only ready for separate human review");
eq(ready.manualApprovalStillRequired,true,"No auto-deploy even with manifest");
eq(ready.canClaimProductionReady,false,"A staging manifest is not production certification");
eq(ready.verifiedSource,"claimed-staging-evidence-needs-independent-review",
 "A self-supplied source label is not independent attestation");
const observations=[
 ["a-own-read",200,1],["b-own-read",200,1],
 ["a-reads-b",403,0],["b-reads-a",404,0],
 ["a-writes-b",403,0],["b-writes-a",403,0],
 ["expired-session",401,0],["unauthenticated",401,0]
].map(([which,httpStatus,rowCount])=>({case:which,
 httpStatus,rowCount,tenantA:a,tenantB:b,sawForeignData:false}));
const isolation=websiteCloudIsolationEvidence({tenantA:a,tenantB:b,observations});
eq(isolation.total,8,"Eight independent cross-tenant and session cases");
eq(isolation.passed,8,"Complete fictional isolation set");
eq(isolation.status,"fixture-only","Passing fixtures aren't real RLS evidence");
eq(isolation.realCloudVerified,false,"Never claim real Supabase tested");
eq(isolation.canAuthorizeCustomerPilot,false,"Fixture can't authorise customers");
eq(isolation.canMigrateProduction,false,"Fixture can't apply SQL");
eq(websiteCloudIsolationEvidence({tenantA:a,tenantB:a,
 observations}).status,"blocked","One tenant can't prove isolation");
eq(websiteCloudIsolationEvidence({tenantA:a,tenantB:b,
 observations:observations.filter(x=>x.case!=="expired-session")}).status,"blocked",
 "Session expiry must be checked");
eq(websiteCloudIsolationEvidence({tenantA:a,tenantB:b,
 observations:observations.map(x=>x.case==="a-reads-b"?
 {...x,httpStatus:200,rowCount:1,sawForeignData:true}:x)}).status,"blocked",
 "Cross-tenant leak is a hard failure");
eq(websiteCloudIsolationEvidence({tenantA:a,tenantB:b,
 observations:observations.map(x=>x.case==="a-own-read"?
 {...x,rowCount:0}:x)}).status,"blocked",
 "An account that can't read its own record doesn't pass");
eq(websiteCloudIsolationEvidence({tenantA:a,tenantB:b,
 observations,source:"verified_isolated_staging_trace"}).realCloudVerified,false,
 "Source strings alone cannot attest real cloud testing");
const nullRegion=websiteRegionalReadiness();
eq(nullRegion.status,"needs-regional-review","No guess from device location");
eq(nullRegion.passed,0,"No region defaults count as compliance");
eq(nullRegion.canApplyBilling,false,"Region choice doesn't enable billing");
eq(nullRegion.canSwitchResidency,false,"Region doesn't move tenant data");
eq(nullRegion.canTranslateAutomatically,false,"No unapproved language translation");
const region=websiteRegionalReadiness({locale:"en-GB",currency:"GBP",
 timeZone:"Europe/London",countryCode:"GB",languageApproved:true,
 regionalConsentReviewed:true});
eq(region.status,"display-context-reviewed","Explicit UK display metadata reviewed");
eq(region.passed,5,"Five distinct regional display gates");
eq(region.globalComplianceVerified,false,"No legal compliance claim");
eq(region.canReleaseInternationally,false,"Global release remains gated");
eq(websiteRegionalReadiness({locale:"en-GB",currency:"GBP",
 timeZone:"Mars/London",countryCode:"GB"}).checks.find(x=>x.id==="timezone").passed,
 false,"Invalid IANA time zone denied");
eq(websiteRegionalReadiness({locale:"en-GB",currency:"GBP",
 timeZone:"Europe/London",countryCode:"ZZ"}).checks.find(x=>x.id==="country").passed,
 false,"Fictional country code refused");
eq(websiteRegionalReadiness({locale:"en-GB",currency:"gBp",
 timeZone:"Europe/London",countryCode:"GB"}).checks.find(x=>x.id==="currency").passed,
 false,"Lower-case or unknown currency is not silently normalized");
eq(websiteRegionalReadiness({locale:"en-GB",currency:"GBP",
 timeZone:"Europe/London",countryCode:"GB"}).checks.find(x=>x.id==="locale").passed,
 false,"Translation approval can't be assumed");
const before=formatBusinessAppointment("2026-03-29T00:30:00Z",region);
const after=formatBusinessAppointment("2026-03-29T01:30:00Z",region);
eq(before.status,"display-only","UTC appointment can be shown locally");
yes(before.text.includes("00:30"),"BST transition begins in GMT at 00:30");
yes(after.text.includes("02:30"),"UK daylight saving makes 01:30 UTC become 02:30");
eq(before.storedUtc,"2026-03-29T00:30:00.000Z","UTC booking instant unchanged");
eq(after.serverBookingCreated,false,"Regional formatter never schedules appointments");
const ny=websiteRegionalReadiness({locale:"en-US",currency:"USD",
 timeZone:"America/New_York",countryCode:"US",languageApproved:true,
 regionalConsentReviewed:true});
const jan=formatBusinessAppointment("2026-01-12T12:00:00Z",ny);
yes(jan.text.includes("07:00"),"New York winter time is five hours behind UTC");
eq(formatBusinessAppointment("2026-01-12T12:00:00",ny).status,
 "unavailable","Local dates cannot be misinterpreted as UTC");
const gbp=formatBusinessCurrency(12345,region);
eq(gbp.status,"display-only","Amounts format without payment");
yes(gbp.text.includes("123.45"),"Pounds converted from smallest units");
eq(gbp.customerCharged,false,"Formatting doesn't take payment");
eq(gbp.actualPaymentVerified,false,"No invoice claimed");
eq(gbp.taxIncluded,null,"Unknown tax never inferred");
const jp=websiteRegionalReadiness({locale:"ja-JP",currency:"JPY",
 timeZone:"Asia/Tokyo",countryCode:"JP",languageApproved:true,
 regionalConsentReviewed:true});
yes(formatBusinessCurrency(1250,jp).text.includes("1,250"),
 "Zero-decimal JPY display works without FX conversion");
eq(formatBusinessCurrency(12.5,region).status,"unavailable",
 "Fractional smallest-unit currency rejected");
const choices=designPreferenceSummary([
 {design_family:"minimal",preference:"kept",draft_version:"1"},
 {design_family:"boutique",preference:"rejected",draft_version:"1"}
]);
const draft={id:"fictional",sections:[{id:"hero"}],
 theme:{designFamily:"organic"},businessType:"Gardening"};
const options=websiteDesignAlternative(draft,{
 likedFamilies:choices.likedFamilies,rejectedFamilies:choices.rejectedFamilies});
const evidenceFor=family=>websiteDecisionEvidence({summary:choices,
 option:{family},quality:{priority:[{title:"Confirm contact details"}]},
 currentBusinessId:a,authorizedBusinessId:a});
eq(evidenceFor("minimal").status,"owner-preferred","Owner preference recognized for business");
eq(evidenceFor("minimal").previousOwnerPreferenceUsed,true,"Explicit owner history only");
eq(evidenceFor("boutique").status,"owner-rejected","Owner's dislike accurately marked");
eq(evidenceFor("boutique").suggestedAutomatically,false,
 "Previously rejected styles never recommended by default");
eq(evidenceFor("minimal").firstImportantFact,"Confirm contact details",
 "Real business gaps can outrank design polish");
eq(websiteDecisionEvidence({summary:choices,option:{family:"minimal"},
 currentBusinessId:a,authorizedBusinessId:b}).status,
 "business-context","Cross-tenant preference ignored");
eq(evidenceFor("minimal").measuredConversionLift,null,
 "No fabricated conversion lift");
eq(evidenceFor("minimal").canModifyPublicWebsite,false,
 "Recommendations cannot publish");
eq(options.suggested.family,"minimal","Actual recommendation uses this owner's history");
eq(websitePilotReadiness().status,"blocked","Sandbox not provisioned");
eq(websiteReleaseReadiness().status,"blocked","Global release still blocked");
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const founder=read("src/screens/founderOperations.js");
yes(founder.includes("websiteStagingReadiness()"),
 "Actual founder screen keeps twelve staging checks fail-closed");
yes(founder.includes("Real Supabase staging"),"Cloud staged rollout blockers visible");
const builder=read("src/screens/websiteBuilder.js");
yes(builder.includes("websiteRegionalReadiness({"),"Actual website editor includes regional readiness");
yes(builder.includes("websiteDecisionEvidence({"),"Actual editor attributes style recommendations");
const migration=read("supabase/migrations/20261010182000_v3115_website_design_feedback.sql");
yes(migration.includes("enable row level security"),"Private feedback source declares RLS");
yes(migration.includes("revoke all on public.busy_website_design_feedback"),
 "Private feedback source forbids public/anon SQL access");
yes(migration.includes("aggregate_consent=false"),"No cross-business learning authorization");
const production=read(".github/workflows/production-check.yml");
yes(production.includes("check-website-staging-global-v3124.mjs"),
 "Normal production foundation workflow includes staging/global regression");
console.log("V3.124 PASS: "+n+" staged cloud, isolation, privacy, worldwide display and decision checks.");
