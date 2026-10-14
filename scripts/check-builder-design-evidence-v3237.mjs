import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planUniversalBuilderRequest} from "../src/core/universalBuilderPlanV3210.mjs";
import {reviewSharedBuilderDesignDecisionV3237 as decide}
 from "../src/core/sharedBuilderDesignDecisionV3237.mjs";
import {reviewSharedBuilderMultiwidthEvidenceV3237 as evidence}
 from "../src/core/sharedBuilderMultiwidthEvidenceV3237.mjs";

const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const website={id:"test-site",businessId:B,generation:8,
 businessType:"Independent business",pages:[{id:"home",enabled:true}],
 sections:[{id:"hero",type:"hero",enabled:true,title:"Hello"},
 {id:"services",type:"services",enabled:true,items:[{title:"Owner service"}]},
 {id:"contact",type:"contact",enabled:true,email:"hello@example.test"}],
 theme:{primary:"#123abc",lockedSections:["hero"]}};
const app={id:"test-app",business_id:B,draft_revision:12,
 draft_config:{
  modules:[{key:"business_profile",enabled:true},
   {key:"services",enabled:true},{key:"enquiry",enabled:true},
   {key:"booking_request",enabled:true}],
  navigation:["business_profile","services","enquiry","booking_request"],
  presentation:{brandPalette:"custom",brandAccent:"#123abc",
   ownerLockedElements:["approved-logo"]},
  publicProfile:{businessName:"Example business"}
 }};
const catalog=[
 {module_key:"business_profile",status:"available",capabilities:{}},
 {module_key:"services",status:"available",capabilities:{}},
 {module_key:"enquiry",status:"available",capabilities:{customer_action:true}},
 {module_key:"booking_request",status:"available",
  capabilities:{confirmation_required_by_business:true}}
];
let count=0;
function eq(a,b){assert.deepEqual(a,b);count++}
function ok(x){assert.ok(x);count++}
function make(request,w=website,a=app){
 return planUniversalBuilderRequest({request,businessId:B,businessType:"Business",
  website:w,app:a,catalog});
}
const enquiry=make("Customers can enquire about our services");
ok(enquiry.ok);
const a=decide({plan:enquiry,businessId:B,website,app,surface:"app"});
ok(a.ok);eq(a.recommendedDirection,"task_first");
eq(a.noRenderedCandidate,true);eq(a.noScreenshotEvidence,true);
eq(a.mayApply,false);eq(a.mayPublish,false);
eq(a.noVisualWinnerClaim,true);eq(a.noCustomerOutcomeVerified,true);
eq(a.ownerOverridesUntouched,true);eq(a.options.length,2);
eq(a.options[0].id,"calm_clarity");eq(a.options[1].id,"task_first");
eq(a.options[1].planningPriority,"review_first");
eq(a.privateTaskCandidates,2);
eq(a.ownerLocksObserved,1);
eq(a.brandEvidence.state,"same_explicit_accent");
ok(a.options[1].coordinatedChecks.length>2);
ok(a.evidenceNeeded.some(x=>x.includes("tablet")));
for(const option of a.options){
 eq(option.safeToApply,false);eq(option.scoreNotMeasured,true);
 eq(option.ownerMustApprove,true);eq(option.requiresScreenshots,true);
}
const web=decide({plan:enquiry,businessId:B,website,app,surface:"website"});
ok(web.ok);eq(web.recommendedDirection,"task_first");
eq(web.ownerLocksObserved,1);
const missingWeb=decide({plan:make("Customers book appointments"),
 businessId:B,website,app,surface:"website"});
ok(missingWeb.ok);eq(missingWeb.recommendedDirection,"calm_clarity");
ok(missingWeb.options[1].blockers.length>0);
ok(missingWeb.alignment.some(x=>x.capabilityId==="booking_request"));
const unknown=decide({plan:make("Create a holographic experience"),
 businessId:B,website,app,surface:"app"});
ok(unknown.ok);eq(unknown.recommendedDirection,"calm_clarity");
ok(unknown.blockedCapabilities>0);
const different=decide({plan:enquiry,businessId:B,website,
 app:{...app,draft_config:{...app.draft_config,presentation:{
  ...app.draft_config.presentation,brandAccent:"#000000"}}},surface:"app"});
ok(different.ok);
eq(different.brandEvidence.state,"distinct_explicit_accents");
const missingAccent=decide({plan:enquiry,businessId:B,website,
 app:{...app,draft_config:{...app.draft_config,presentation:{
  ...app.draft_config.presentation,brandPalette:"default"}}},surface:"app"});
eq(missingAccent.brandEvidence.state,"insufficient_comparable_tokens");
const failedCases=[
 {businessId:OTHER,website,app,plan:enquiry},
 {businessId:B,website:{...website,generation:9},app,plan:enquiry},
 {businessId:B,website,app:{...app,draft_revision:13},plan:enquiry},
 {businessId:B,website,app:{...app,business_id:OTHER},plan:enquiry},
 {businessId:B,website,app,plan:{...enquiry,noChargeMade:false}},
 {businessId:B,website,app,plan:{...enquiry,capabilities:[{
  ...enquiry.capabilities[0],app:{status:"invented"}}]}}
];
for(const args of failedCases){
 const result=decide({...args,surface:"app"});
 eq(result.ok,false);eq(result.mayApply,false);eq(result.mayPublish,false);
}
const nodraft=decide({plan:make("Customers enquire",website,null),
 businessId:B,website,app:null,surface:"app"});
ok(nodraft.ok);eq(nodraft.options.length,0);eq(nodraft.mayApply,false);
const counts=(width,overflow=0)=>({
 viewport:width,width:width+(overflow?20:0),overflow,
 unloadedImages:0,missingAlt:0,smallTargets:0,badAnchors:0,
 clippedHeadings:0,lowContrast:0,smallBodyText:0,
 contrastUnknown:0,contrastChecked:7
});
const report=(width,hasWarning)=>({
 counts:counts(width,hasWarning?1:0),
 issues:hasWarning?[{id:"overflow",label:"Measured overflow"}]:[]
});
const measurements=[
 {device:"phone",width:390},
 {device:"tablet",width:768},
 {device:"desktop",width:1280}
].map(x=>({...x,businessId:B,websiteId:website.id,
 generation:8,pageId:"home",original:report(x.width,true),
 candidate:report(x.width,false)}));
const context={businessId:B,website,plan:enquiry,pageId:"home"};
const good=evidence({...context,deviceReports:measurements});
ok(good.ok);eq(good.eligibleForOwnerReview,true);
eq(good.improvementDevices.length,3);
eq(good.regressionDevices.length,0);
eq(good.canApply,false);eq(good.canPublish,false);
eq(good.captureProvenanceNotVerified,true);
eq(good.notAnAestheticScore,true);
eq(good.proofOfLiveCustomerJourney,false);
const unchanged=evidence({...context,deviceReports:measurements.map(x=>({
 ...x,candidate:report(x.width,true)}))});
ok(unchanged.ok);eq(unchanged.eligibleForOwnerReview,false);
const worse=evidence({...context,deviceReports:measurements.map((x,i)=>({
 ...x,original:report(x.width,i===0?false:true),
 candidate:report(x.width,i===0?true:false)}))});
ok(worse.ok);eq(worse.eligibleForOwnerReview,false);
eq(worse.regressionDevices.length,1);
for(const data of [
 measurements.slice(0,2),
 [...measurements,measurements[0]],
 measurements.map((x,i)=>i===0?{...x,generation:9}:x),
 measurements.map((x,i)=>i===0?{...x,businessId:OTHER}:x),
 measurements.map((x,i)=>i===0?{...x,original:report(500,true)}:x),
 measurements.map((x,i)=>i===0?{...x,candidate:{counts:{},issues:[]}}:x),
 measurements.map((x,i)=>i===0?{...x,device:"desktop"}:x),
 measurements.map((x,i)=>i===0?{...x,width:200}:x)
]){
 const bad=evidence({...context,deviceReports:data});
 eq(bad.ok,false);eq(bad.canApply,false);eq(bad.canPublish,false);
}
eq(evidence({...context,businessId:OTHER,
 deviceReports:measurements}).ok,false);
eq(evidence({...context,website:{...website,generation:9},
 deviceReports:measurements}).ok,false);
eq(evidence({...context,pageId:"unknown",
 deviceReports:measurements}).ok,false);
const ui=readFileSync(new URL("../src/screens/universalBuilderPlanReview.js",import.meta.url),"utf8");
ok(ui.includes("reviewSharedBuilderDesignDecisionV3237"));
ok(ui.includes("BUSY would review this approach first"));
ok(ui.includes("Neither approach has been rendered"));
const source=readFileSync(new URL("../src/core/sharedBuilderDesignDecisionV3237.mjs",import.meta.url),"utf8");
ok(!source.includes("fetch("));
ok(!source.includes("localStorage"));
console.log("V3.237: "+count+" offline shared-builder design, tenant, brand and multiwidth evidence assertions passed.");
