import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildAppDistributionPlan,buildStandalonePrivateHandoff,
 standaloneEntitlementEvidence,COSTS} from "../src/core/appDistributionChoices.mjs";
import {planFunctionalBusinessApp} from "../src/core/appExperiencePlanner.mjs";
import {appRuntimeScreenSchema} from "../src/core/appRuntimeScreenSchema.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const appId="00000000-0000-4000-8000-000000000011";
const versionId="00000000-0000-4000-8000-000000000012";
const catalog=["business_profile","services","gallery","contact","enquiry","booking_request","offers",
 "payments","loyalty"].map((key,i)=>({
 module_key:key,title:key,sort_order:i*10, status:["payments","loyalty"].includes(key)?"planned":"available",
 capabilities:key==="enquiry"?{customer_action:true,request_type:"enquiry"}:
  key==="booking_request"?{customer_action:true,request_type:"booking_request",
   confirmation_required_by_business:true}:{} }));
const app={id:appId,display_name:"Jenny's Salon",draft_revision:5,status:"draft"};
const preview={id:versionId,version_no:2,source_draft_revision:5,
 config:{display:{name:"Jenny's Salon"},modules:[
  {key:"business_profile",enabled:true},{key:"services",enabled:true},
  {key:"booking_request",enabled:true},{key:"enquiry",enabled:true},
  {key:"gallery",enabled:false}],publicProfile:{businessName:"Jenny's Salon",
   phone:"01392 123456"}}};
const proof=buildAppDistributionPlan({mode:"busy_marketplace",app,preview});
assert.ok(proof.ok&&proof.proof.matches);
assert.equal(proof.mayPublishMarketplace,false);
assert.equal(proof.costs.length,0);
assert.equal(proof.mayPackageOrSubmit,false);
const denied=standaloneEntitlementEvidence({tierId:"premium",standaloneIncluded:true});
assert.equal(denied.verified,false,"Never trust claimed tier");
const claimed=standaloneEntitlementEvidence({source:"verified_billing",tierId:"premium",
 standaloneIncluded:true,confirmed:true,status:"active"});
assert.ok(claimed.verified);
assert.equal(standaloneEntitlementEvidence({...{source:"verified_billing",tierId:"premium",
 standaloneIncluded:true,confirmed:true,status:"expired"}}).verified,false);
const acknowledge={externalFees:true,externalAccounts:true,storeApproval:true,ongoingCosts:true};
const standalone=buildAppDistributionPlan({mode:"standalone",app,preview,
 acknowledgements:acknowledge,requestedPlatforms:["ios","android"]});
assert.ok(standalone.ok);
assert.ok(standalone.proof.matches);
assert.equal(standalone.eligible.verified,false);
assert.equal(standalone.mayPackageOrSubmit,false);
assert.equal(standalone.mayCharge,false);
assert.ok(standalone.missing.some(x=>/Higher-tier/.test(x)));
assert.equal(COSTS.length,4);
const manifest=buildStandalonePrivateHandoff({app,preview,plan:standalone,
 catalog,ownerConfirmed:true});
assert.ok(manifest.ok,manifest.reason);
assert.equal(manifest.kind,"private_standalone_planning_manifest_v1");
assert.equal(manifest.previewVersionId,versionId);
assert.deepEqual(manifest.modules,["business_profile","services","booking_request","enquiry"]);
assert.ok(manifest.screenSchema.ok);
assert.equal(manifest.screenSchema.screens.find(x=>x.key==="booking_request").confirmationAutomatic,false);
for(const property of ["automaticallyPublished","packageProduced","appStoreSubmitted","chargesCreated"])
 assert.equal(manifest[property],false,"No production action: "+property);
assert.equal(manifest.requiresVerifiedBilling,true);
assert.ok(!JSON.stringify(manifest).includes("01392 123456"),
 "Standalone handoff must not include customer contact details");
assert.equal(buildStandalonePrivateHandoff({app,preview,plan:standalone,
 catalog,ownerConfirmed:false}).ok,false);
assert.equal(buildStandalonePrivateHandoff({app,preview:{...preview,source_draft_revision:4},
 plan:standalone,catalog,ownerConfirmed:true}).ok,false,"Stale preview");
assert.equal(buildStandalonePrivateHandoff({app,preview,
 plan:buildAppDistributionPlan({mode:"standalone",app,preview}),catalog,
 ownerConfirmed:true}).ok,false,"No bypassing cost acknowledgements");
assert.equal(buildAppDistributionPlan({mode:"standalone",app,preview,
 requestedPlatforms:["ios","ios"]}).ok,false);
assert.equal(buildAppDistributionPlan({mode:"invalid",app,preview}).ok,false);
for(const key of ["payments","loyalty"]){
 const illegal={...preview.config,modules:[...preview.config.modules,{key,enabled:true}]};
 assert.equal(appRuntimeScreenSchema(illegal,catalog).ok,false,
  "Never activate planned module: "+key);
}
assert.equal(appRuntimeScreenSchema({...preview.config,
 modules:[{key:"booking_request",enabled:true}]},catalog).ok,false,"Public profile mandatory");
const tamperedCatalog=catalog.map(x=>x.module_key==="booking_request"?
 {...x,capabilities:{customer_action:true}}:x);
assert.equal(appRuntimeScreenSchema(preview.config,tamperedCatalog).ok,false,
 "Backend must require explicit manual booking confirmation");
const unknown={...preview.config,modules:[...preview.config.modules,
 {key:"external_payment_gateway",enabled:true}]};
assert.equal(appRuntimeScreenSchema(unknown,catalog).ok,false);
const types=[
 "Hair salon","Restaurant","Festival catering","Electrician","Plumber","Landscaper",
 "Legal consultancy","Accountant","Photography studio","Pottery workshop",
 "Aquarium maintenance","Book shop","Hydroponic sensors"
];
const categories=new Set(),layouts=new Set();
for(const type of types){
 const planned=planFunctionalBusinessApp({businessType:type,businessName:"Example "+type,
  catalog,profile:{assets:{gallery:[]}}});
 categories.add(planned.category);layouts.add(planned.layout);
 assert.ok(planned.ownerApprovalRequired&&planned.canEnablePayments===false);
 assert.ok(planned.suggestedModules.length>0,"Functional app "+type);
 assert.ok(planned.suggestedModules.every(m=>m.available));
 assert.ok(planned.excludedUnavailable.includes("payments"));
 assert.ok(planned.excludedUnavailable.includes("loyalty"));
}
assert.ok(categories.size>=5);
assert.ok(layouts.size>=3);
const ui=read("src/screens/miniApps.js");
for(const token of [
 "Inside Busy, standalone, or eventually both",
 "Standalone inclusion in a higher subscription is planned",
 "Apple and Google decide whether to accept an app",
 "standaloneHandoff.sourceDraftRevision===app?.draft_revision",
 "buildStandalonePrivateHandoff({app,preview:view.previewVersion",
 "planFunctionalBusinessApp({","never enables payment collection"
])assert.ok(ui.toLowerCase().includes(token.toLowerCase()),"App UI disclosure: "+token);
console.log("V3.153 APP PATHS PASS: marketplace and private standalone planning, 13 businesses, catalogue restrictions, verified-billing gate, external costs, no confirmed bookings, no app-store submission.");
