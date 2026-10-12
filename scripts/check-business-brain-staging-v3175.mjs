import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {compileStagingRunnerHandoff,reviewStagingRunMetadata}
 from "../src/core/stagingRunnerHandoff.mjs";
import {prepareBusinessBrainWork,previewBusinessBrainDecision}
 from "../src/core/businessBrainWorkQueue.mjs";
import {prepareOwnerImprovementPlan}
 from "../src/core/ownerImprovementPlan.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const tenant="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const keys=["business_profile","services","gallery","contact","enquiry",
 "booking_request","offers","loyalty"];
const cfg=(enabled=keys)=>({
 modules:keys.map(key=>({key,enabled:enabled.includes(key)})),
 navigation:keys.filter(key=>enabled.includes(key)),
 presentation:{headerStyle:"refined",navigationStyle:"tabs",
 galleryLayout:"grid",layoutDensity:"comfortable",imageScale:"regular",
 imageCorners:"rounded"},
 publicProfile:{businessName:"Fictional Business",
 services:[{name:"Service A",description:"Owner approved"}],
 assets:{gallery:[{approved:true,alt:"A fictional photo"}]}},
 privateCustomerRecords:[{email:"never-output@example.invalid"}],
 paymentSecrets:{apiKey:"not-a-test-credential"},publishing:{active:true}
});
const website={id:"private-site",generation:8,
 businessName:"Fictional Business",
 sections:[{id:"hero",enabled:true},{id:"contact",enabled:true}],
 pages:[{id:"home",enabled:true}],
 privateVisitors:[{email:"site-secret@example.invalid"}]};
const brand={websiteBrief:{businessName:"Fictional Business",
 description:"Original business description",services:[
 {name:"Service A",description:"Description from owner"}]}};
const app=cfg();
const original=JSON.stringify(app),webOriginal=JSON.stringify(website);

const base={appConfig:app,businessId:tenant,draftRevision:6,
 environment:"isolated_staging",runLabel:"v3175_owner_preview",ownerApproved:true};
assert.equal(compileStagingRunnerHandoff({...base,environment:"production"}).ok,false);
assert.equal(compileStagingRunnerHandoff({...base,environment:"dry_run"}).ok,false);
assert.equal(compileStagingRunnerHandoff({...base,ownerApproved:false}).ok,false);
assert.equal(compileStagingRunnerHandoff({...base,businessId:other.slice(0,10)}).ok,false);
assert.equal(compileStagingRunnerHandoff({...base,draftRevision:0}).ok,false);
assert.equal(compileStagingRunnerHandoff({...base,runLabel:"evil<url>"}).ok,false);
const staged=compileStagingRunnerHandoff(base);
assert.equal(staged.ok,true);
assert.equal(staged.kind,"staging_runner_handoff_v3175");
assert.equal(staged.routeCount,6);
assert.equal(staged.routes.length,6);
assert.ok(staged.allOfflineRulesPass);
assert.ok(staged.routes.every(x=>x.mayProceedToServerChecks));
assert.ok(staged.routes.every(x=>x.receiptChecks.includes("auth")));
assert.equal(staged.runnerIndependentlyAuthenticated,false);
assert.equal(staged.approvalVerifiedServerSide,false);
assert.equal(staged.sessionTenantVerifiedServerSide,false);
assert.equal(staged.productionEndpointAllowed,false);
assert.equal(staged.networkEnabled,false);
assert.equal(staged.canRun,false);
assert.equal(staged.canPublish,false);
assert.equal(staged.noRequestsSubmitted,true);
assert.equal(staged.noCharges,true);
assert.equal(JSON.stringify(staged).includes("never-output@example.invalid"),false);
assert.equal(JSON.stringify(staged).includes("not-a-test-credential"),false);
assert.equal(JSON.stringify(staged).includes(tenant),false);
assert.equal(compileStagingRunnerHandoff({
 ...base,runnerBinding:{kind:"trusted_isolated_runner",
 environment:"isolated_staging",enabled:true}
}).canRun,false,"A forged local binding cannot grant network permission");
const disabled=cfg(keys.filter(x=>x!=="booking_request"));
const missing=compileStagingRunnerHandoff({...base,appConfig:disabled});
assert.equal(missing.ok,true);
assert.equal(missing.allOfflineRulesPass,false);
assert.equal(missing.missingCapabilities.length,3);
assert.ok(missing.routes.filter(x=>x.requestKind==="booking_request")
 .every(x=>x.mayProceedToServerChecks===false));
assert.equal(missing.canRun,false);

const receipt=(step,changes={})=>({
 step,source:"isolated_staging_server_receipt",
 environment:"isolated_staging",businessId:tenant,
 revision:6,runLabel:"v3175_owner_preview",
 channel:"busy_marketplace",requestKind:"booking_request",
 outcome:"passed",containsLiveCustomerData:false,
 ...changes
});
const args={businessId:tenant,revision:6,
 runLabel:"v3175_owner_preview",route:"busy_marketplace",
 kind:"booking_request"};
assert.equal(reviewStagingRunMetadata({}).ok,false);
assert.equal(reviewStagingRunMetadata({...args,
 route:"real_production"}).ok,false);
assert.equal(reviewStagingRunMetadata({...args,receipts:Array(25).fill(receipt("auth"))}).ok,false);
const meta=reviewStagingRunMetadata({...args,receipts:[
 receipt("auth"),receipt("submitted"),receipt("diary"),
 receipt("owner_inbox",{businessId:other}),
 receipt("reply_delivery",{revision:5}),
 receipt("status",{outcome:"not_run"}),
 receipt("guest",{containsLiveCustomerData:true}),
 receipt("standalone",{email:"secret@example.invalid"}),
 receipt("device",{rawPayload:{token:"secret"}}),
 receipt("auth")
]});
assert.equal(meta.ok,true);
assert.equal(meta.formatAccepted,3);
assert.equal(meta.rejectedCount,7);
assert.equal(meta.independentlyVerified,false);
assert.equal(meta.serverSignatureChecked,false);
assert.equal(meta.actualNetworkDeliveryProven,false);
assert.equal(meta.canUseForRelease,false);
assert.equal(meta.cannotAuthoriseBooking,true);
assert.equal(JSON.stringify(meta).includes(other),false);
assert.equal(JSON.stringify(meta).includes("secret@example.invalid"),false);
assert.equal(JSON.stringify(meta).includes("token"),false);
const steps=staged.routes.find(x=>x.channel==="busy_marketplace"&&
 x.requestKind==="booking_request").receiptChecks;
const forgedAll=reviewStagingRunMetadata({...args,
 receipts:steps.map(step=>receipt(step))});
assert.equal(forgedAll.missing.length,0);
assert.equal(forgedAll.independentlyVerified,false,
 "All client-supplied fields still cannot authenticate a staging run");
assert.equal(forgedAll.canUseForRelease,false);
assert.equal(reviewStagingRunMetadata({...args,
 receipts:[receipt("auth",{channel:"guest_web"})]}).formatAccepted,0);

const current={businessId:tenant,goal:"book",
 appConfig:app,appRevision:6,websiteRevision:0};
const queue=prepareBusinessBrainWork(current);
assert.equal(queue.ok,true);
assert.equal(queue.kind,"business_brain_owner_work_queue_v3175");
assert.equal(queue.items.length<=3,true);
assert.ok(queue.items.length>0);
assert.ok(queue.items.every(x=>x.executionAttempted===false));
assert.ok(queue.items.every(x=>x.permissions.mayEdit===false&&
 x.permissions.maySpend===false&&x.permissions.mayPublish===false&&
 x.permissions.maySendCustomerMessages===false));
assert.equal(queue.noCrossTenantLearning,true);
assert.equal(queue.noCustomerDataRead,true);
assert.equal(queue.noAutomaticEdits,true);
assert.equal(queue.noAutomaticPublishing,true);
assert.equal(JSON.stringify(queue).includes("never-output@example.invalid"),false);
assert.equal(JSON.stringify(queue).includes("not-a-test-credential"),false);
assert.equal(JSON.stringify(queue).includes("Owner approved"),false);
assert.equal(prepareBusinessBrainWork({...current,businessId:"invalid"}).ok,false);
assert.equal(prepareBusinessBrainWork({...current,
 ownerDecisions:Array(81).fill({})}).ok,false);
const first=queue.items[0];
const decisions=[{
 businessId:tenant,goal:"book",actionId:first.id,
 surface:first.surface,decision:"rejected",appRevision:6,websiteRevision:0
}];
const rejected=prepareBusinessBrainWork({...current,ownerDecisions:decisions});
assert.equal(rejected.ok,true);
assert.ok(!rejected.items.some(x=>x.id===first.id));
assert.ok(rejected.suppressed.some(x=>x.id===first.id));
const wrongSurface=prepareBusinessBrainWork({...current,
 ownerDecisions:[{...decisions[0],surface:first.surface==="app"?"website":"app"}]});
assert.ok(wrongSurface.items.some(x=>x.id===first.id),
 "A decision about a different surface must not suppress this action");
const wrongTenant=prepareBusinessBrainWork({...current,
 ownerDecisions:[{...decisions[0],businessId:other}]});
assert.ok(wrongTenant.items.some(x=>x.id===first.id));
const staleDecision=prepareBusinessBrainWork({...current,
 ownerDecisions:[{...decisions[0],appRevision:5}]});
assert.ok(staleDecision.items.some(x=>x.id===first.id));
const postponed=prepareBusinessBrainWork({...current,
 ownerDecisions:[{...decisions[0],decision:"postponed"}]});
assert.ok(postponed.suppressed.some(x=>x.id===first.id));
const approved=prepareBusinessBrainWork({...current,
 ownerDecisions:[{...decisions[0],decision:"approved"}]});
assert.equal(approved.items.find(x=>x.id===first.id).state,"owner_agreed_not_executed");
assert.equal(approved.noAutomaticEdits,true);
const decision=previewBusinessBrainDecision(queue,{
 businessId:tenant,currentBusinessId:tenant,actionId:first.id,
 appRevision:6,websiteRevision:0,decision:"approved"});
assert.equal(decision.ok,true);
assert.equal(decision.persistencePerformed,false);
assert.equal(decision.businessActionExecuted,false);
assert.equal(decision.allowedToPublish,false);
assert.equal(decision.ownerMustConfirmInExistingEditor,true);
assert.equal(previewBusinessBrainDecision(queue,{
 businessId:tenant,currentBusinessId:other,actionId:first.id,
 appRevision:6,websiteRevision:0}).ok,false);
assert.equal(previewBusinessBrainDecision(queue,{
 businessId:tenant,currentBusinessId:tenant,actionId:first.id,
 appRevision:7,websiteRevision:0}).ok,false);
assert.equal(previewBusinessBrainDecision(queue,{
 businessId:tenant,currentBusinessId:tenant,actionId:"not_queued",
 appRevision:6,websiteRevision:0}).ok,false);
const webQueue=prepareBusinessBrainWork({
 businessId:tenant,goal:"services",websiteDraft:website,
 websiteRevision:8,brandBrain:brand});
assert.equal(webQueue.ok,true);
assert.equal(webQueue.websiteRevision,8);
assert.equal(webQueue.noProviderCalls,true);
const sameScope={authorizedBusinessId:tenant,
 websiteBusinessId:tenant,appBusinessId:tenant};
assert.equal(prepareBusinessBrainWork({
 businessId:tenant,goal:"book",websiteDraft:website,
 websiteRevision:8,appConfig:app,appRevision:6
}).ok,false);
assert.equal(prepareBusinessBrainWork({
 businessId:tenant,goal:"book",websiteDraft:website,websiteRevision:8,
 appConfig:app,appRevision:6,
 scope:{...sameScope,appBusinessId:other}
}).ok,false);
const combined=prepareBusinessBrainWork({
 businessId:tenant,goal:"book",websiteDraft:website,
 websiteRevision:8,appConfig:app,appRevision:6,scope:sameScope});
assert.equal(combined.ok,true);
assert.equal(combined.items.length<=3,true);
assert.equal(JSON.stringify(combined).includes("site-secret@example.invalid"),false);
assert.equal(prepareBusinessBrainWork({...current,appRevision:0}).ok,false);
assert.equal(JSON.stringify(app),original);
assert.equal(JSON.stringify(website),webOriginal);

const appUi=read("src/screens/miniApps.js");
for(const key of ["businessBrainWorkQueue.mjs",
 "prepareBusinessBrainWork({","stagingRunnerHandoff.mjs",
 "compileStagingRunnerHandoff({",
 "Prepare a staging handoff (no live tests)",
 "V3.175 • Busy's prepared work",
 "Network requests: zero; publishing: disabled."]){
 assert.ok(appUi.includes(key),"App Studio missing: "+key);
}
const websiteUi=read("src/screens/websiteBuilder.js");
for(const key of ["businessBrainWorkQueue.mjs",
 "prepareBusinessBrainWork({",
 "V3.175 • Business Brain's next actions",
 "No public changes, provider calls or spending"]){
 assert.ok(websiteUi.includes(key),"Website Builder missing: "+key);
}
const wf=read(".github/workflows/business-brain-staging-v3175.yml");
for(const key of ["node scripts/check-business-brain-staging-v3175.mjs",
 "node scripts/check-offline-staging-device-v3174.mjs",
 "node scripts/check-multi-feature-intelligence-v3173.mjs",
 "node scripts/check-shared-customer-journeys-v3172.mjs",
 "expo export --platform ios","expo export --platform android",
 "prepare-standalone-prototype-v3154.mjs"]){
 assert.ok(wf.includes(key),"CI workflow missing: "+key);
}
console.log("V3.175 PASS: six-route staging handoff never executes; malicious/stale/cross-tenant receipts fail; Business Brain revision/owner choices gated; both builders and CI connected.");
