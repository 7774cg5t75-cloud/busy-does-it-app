import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareGetPaidQuoteDraft,reviewGetPaidNextStep} from "../src/core/getPaidIntelligenceV3183.mjs";
import {assessStagingInstallationReadiness} from "../src/core/stagingApprovalGateV3183.mjs";
import {report as intelligence} from "./track-intelligence-v3183.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
let count=0;
const ok=x=>{assert.ok(x);count++;};
const eq=(a,b)=>{assert.deepEqual(a,b);count++;};
const b="11111111-1111-4111-8111-111111111111";
const c={id:"local-12",name:"Alice Brown",service:"Tap installation",business_id:b};
const quote=opts=>prepareGetPaidQuoteDraft({businessId:b,customer:c,
 brief:"Repair the tap for £125, materials included.",ownerCustomerVerified:true,...opts});
const r=quote();
ok(r.ok);eq(r.amountPence,12500);eq(r.amountDisplay,"125.00");
ok(r.message.includes("£125.00"));eq(r.quoteSent,false);
eq(r.paymentTaken,false);eq(r.createdInvoice,false);
eq(r.localOwnerScopeChecked,true);eq(r.externalOwnershipNotIndependentlyVerified,true);
ok(!quote({ownerCustomerVerified:false}).ok);
ok(!quote({businessId:"not-a-uuid"}).ok);
ok(!quote({customer:{...c,business_id:"22222222-2222-4222-8222-222222222222"}}).ok);
ok(!quote({brief:"The cost might be £125 or £150."}).ok);
ok(!quote({brief:"Please charge £125.000."}).ok);
ok(!quote({brief:"Please charge £1,2."}).ok);
ok(!quote({brief:"Please charge £0."}).ok);
ok(!quote({brief:"£125 including VAT and excluding VAT"}).ok);
ok(!quote({currentAmount:"1,2"}).ok);
const updated=quote({brief:"Please quote £165",currentAmount:"125"});
ok(updated.ok);eq(updated.changedExistingAmount,true);eq(updated.amountPence,16500);
const carry=quote({brief:"Please prepare the quote",currentAmount:"125.50"});
ok(carry.ok);eq(carry.amountSource,"existing_owner_quote_field");eq(carry.amountPence,12550);
const next=opts=>reviewGetPaidNextStep({businessId:b,customer:c,
 ownerCustomerVerified:true,action:{type:"quote",done:true,
 details:{quoteStatus:"Sent",followUpDueDate:"2026-10-10"}},
 nowISO:"2026-10-12T19:00:00Z",todayISO:"2026-10-12",...opts});
eq(next().priority,"attention");eq(next().reminderSent,false);
eq(next({todayISO:"2026-10-09"}).priority,"review");
ok(!next({ownerCustomerVerified:false}).ok);
eq(next({action:{type:"booking",done:true,details:{bookingStatus:"Completed"}}}).paymentReceivedVerified,false);
ok(next({action:{type:"booking",done:true,details:{bookingStatus:"Completed"}}}).next.includes("invoice"));
ok(next({action:{type:"booking",done:true,details:{bookingStatus:"Cancelled"}}}).next.includes("No automatic"));
const page=read("src/components/GetPaidOwnerReview.js");
const work=read("src/screens/work.js");
ok(page.includes("ownerCustomerVerified:owned"));
ok(page.includes("s.customers.some("));
ok(page.includes("type===\"quote\""));
ok(page.includes('type==="booking"&&bookingStatus==="Completed"'));
ok(page.includes("todayISO,"));
ok(work.includes('import GetPaidOwnerReview from "../components/GetPaidOwnerReview"'));
ok(work.includes('type="quote" todayISO={todayISO}'));
ok(work.includes('type="booking" bookingStatus={bookingStatus} todayISO={todayISO}'));
ok(!work.includes("getPaidIntelligenceV3182.mjs"));
const staging=assessStagingInstallationReadiness({
 projectRef:b,projectHealthy:true,canaryPreserved:true,
 extensions:{pgcrypto:true,pgmq:false,pg_cron:false,pg_net:false}
});
ok(staging.ok);ok(staging.blockers.includes("targetIsolatedProject"));
eq(staging.missingExtensions,["pgmq","pg_cron","pg_net"]);
eq(staging.installationExecuted,false);
const ready=assessStagingInstallationReadiness({
 projectRef:"pnjdlogwegnqbsfpcofw",projectHealthy:true,canaryPreserved:true,
 backupVerified:true,migrationReviewComplete:true,authRolesReviewed:true,
 ownerApprovedInstall:true,extensions:{pgcrypto:true,pgmq:true,pg_cron:true,pg_net:true}
});
ok(ready.ok);eq(ready.reviewedPrerequisites,true);
eq(ready.noAutomaticInstallation,true);eq(ready.requiresHumanExecutionAfterSeparateApproval,true);
const noApproval=assessStagingInstallationReadiness({
 projectRef:"pnjdlogwegnqbsfpcofw",projectHealthy:true,canaryPreserved:true,
 backupVerified:true,migrationReviewComplete:true,authRolesReviewed:true,
 ownerApprovedInstall:false,extensions:{pgcrypto:true,pgmq:true,pg_cron:true,pg_net:true}
});
ok(noApproval.blockers.includes("explicitOwnerApproval"));
ok(!assessStagingInstallationReadiness({extensions:[]}).ok);
ok(intelligence.codeFiles>=570);
ok(intelligence.codePhysicalLines>90000);
ok(intelligence.coreFiles>=120);
ok(intelligence.migrationFiles>=60);
ok(intelligence.surveyedCapabilities.length>=8);
ok(intelligence.surveyedCapabilities.every(v=>v.hostedEndToEndVerified===false));
ok(intelligence.surveyedCapabilities.some(v=>v.id==="get_paid_owner_drafts"&&v.sourceAndOwnerWired));
eq(intelligence.calibratedIQScore,null);
eq(intelligence.realCustomerJourneysProven,false);
console.log("V3.183 "+count+" focused Get Paid, staging and intelligence inventory assertions passed.");
