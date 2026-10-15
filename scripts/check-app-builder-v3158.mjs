import {preflightRequestBridge} from "../supabase/functions/busy-mini-apps/requestBridgePreflight.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {reviewPrivateAppServices} from "../src/core/appServiceCollection.mjs";
import {proposeCoordinatedAppChanges,planAppVoiceInstructions} from "../src/core/appCoordinatedStudio.mjs";
import {appRequestJourney,decideAppRequestTransition} from "../src/core/appRequestLifecycle.mjs";
import {appVisibleCaptureReceipt,currentAppVisibleCapture} from "../src/core/appRenderedEvidence.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const appId="00000000-0000-4000-8000-000000000158";
const modules=["business_profile","services","gallery","booking_request","enquiry","contact"]
 .map(key=>({key,enabled:true}));
const original={modules,navigation:modules.map(x=>x.key),
 publicProfile:{businessName:"Jenny's Salon",
  services:[{id:"cut",name:"Haircut",description:"From £25"},
   {id:"colour",name:"Colour",description:"Consultation first"}],
  contact:{email:"jenny@example.test"}},
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",navigationStyle:"tabs"},
 secretCustomerData:[{name:"Private Jane"}],payments:{enabled:false}};
const src=JSON.stringify(original);
const updated=[{id:"cut",name:"Premium haircut",description:"From £25"},
 {id:"colour",name:"Colour",description:"Consultation first"},
 {id:"styling",name:"Bridal styling",description:"Ask for availability"}];
const proof=reviewPrivateAppServices(original,updated);
assert.equal(proof.ok,true,proof.reason);
assert.equal(proof.nextConfig.publicProfile.services.length,3);
assert.equal(JSON.stringify(original),src);
const changes=proposeCoordinatedAppChanges(original,[
 {kind:"services",value:updated},
 {kind:"first",moduleKey:"booking_request"},
 {kind:"appearance",field:"layoutDensity",value:"airy"}
]);
assert.equal(changes.ok,true,changes.reason);
assert.equal(changes.changes.length,3);
assert.equal(changes.nextConfig.navigation[0],"booking_request");
assert.equal(changes.nextConfig.publicProfile.services[0].name,"Premium haircut");
assert.equal(changes.nextConfig.secretCustomerData,original.secretCustomerData);
assert.equal(changes.nextConfig.payments.enabled,false);
assert.equal(changes.publishes,false);
assert.equal(changes.chargesCustomers,false);
const undo=proposeCoordinatedAppChanges(changes.nextConfig,changes.undoOperations);
assert.equal(undo.ok,true,undo.reason);
assert.deepEqual(undo.nextConfig.publicProfile.services,original.publicProfile.services);
assert.deepEqual(undo.nextConfig.navigation,original.navigation);
assert.deepEqual(undo.nextConfig.presentation,original.presentation);
const empty=proposeCoordinatedAppChanges(original,[{kind:"services",value:[]}]);
assert.equal(empty.ok,true,empty.reason);
assert.equal(proposeCoordinatedAppChanges(empty.nextConfig,empty.undoOperations).ok,true);
for(const bad of [
 [{id:"cut",name:"Same",description:""},{id:"cut",name:"Other",description:""}],
 [{id:"x",name:"Same",description:""},{id:"z",name:"same",description:""}],
 [{id:"evil",name:"Scam",description:"",apiToken:"secret"}],
 [{id:"evil",name:"<script>",description:""}],
 Array(31).fill({id:"dup",name:"Service",description:""}),
])assert.equal(reviewPrivateAppServices(original,bad).ok,false);
assert.equal(reviewPrivateAppServices({modules:[{key:"services",enabled:false}]},updated).ok,false);
assert.equal(planAppVoiceInstructions(original,"Put services on top").ok,true);
assert.equal(planAppVoiceInstructions(original,"Remove a customer from the database").ok,false);
const base={status:"received",request_type:"booking_request"};
assert.equal(decideAppRequestTransition(base,"reviewing").ok,true);
assert.equal(decideAppRequestTransition(base,"accepted").ok,false,
 "Received booking request cannot bypass diary confirmation");
assert.equal(decideAppRequestTransition({...base,status:"reviewing"},"accepted",
 {bridgeState:"booking_draft"}).ok,false);
assert.equal(decideAppRequestTransition({...base,status:"reviewing"},"accepted",
 {bridgeState:"booking_confirmed"}).ok,true);
assert.equal(decideAppRequestTransition({...base,status:"declined"},"reviewing").ok,false);
assert.equal(decideAppRequestTransition({...base,status:"closed"},"received").ok,false);
assert.equal(decideAppRequestTransition({...base,status:"accepted"},"reviewing").ok,false);
assert.equal(decideAppRequestTransition({status:"received",request_type:"enquiry"},"accepted").ok,true);
const draftJourney=appRequestJourney({...base,status:"reviewing"},{bridge_state:"booking_draft"});
assert.equal(draftJourney.confirmed,false);
assert.equal(draftJourney.requiresHumanConfirmation,true);
const confirmed=appRequestJourney({...base,status:"accepted"},{bridge_state:"booking_confirmed"});
assert.equal(confirmed.confirmed,true);
assert.equal(appRequestJourney({...base,status:"accepted"},null).confirmed,false,
 "Legacy accepted labels must not prove confirmed diary entry");
const capture=appVisibleCaptureReceipt({appId,revision:3,
 screenshotUri:"file:///tmp/screenshot.png",width:390,height:844,platform:"ios",
 capturedAt:"2026-10-11T19:10:00Z"});
assert.equal(capture.ok,true,capture.reason);
assert.equal(capture.realDevicePixelCapture,true);
assert.equal(capture.aiVisualReviewCompleted,false);
assert.equal(capture.screenshotAuthenticatedByServer,false);
assert.equal(capture.fullScrollProven,false);
assert.equal(currentAppVisibleCapture(capture,{appId,revision:3}),true);
assert.equal(currentAppVisibleCapture(capture,{appId,revision:4}),false);
assert.equal(appVisibleCaptureReceipt({...capture,screenshotUri:"https://attacker.invalid/img"}).ok,false);
assert.equal(appVisibleCaptureReceipt({...capture,platform:"web"}).ok,false);
assert.equal(read("src/core/appServiceCollection.mjs"),
 read("supabase/functions/busy-mini-apps/appServiceCollection.mjs"));
assert.equal(read("src/core/appRequestLifecycle.mjs"),
 read("supabase/functions/busy-mini-apps/appRequestLifecycle.mjs"));
assert.equal(read("src/core/appCoordinatedStudio.mjs"),
 read("supabase/functions/busy-mini-apps/appCoordinatedStudio.mjs"));
const edge=read("supabase/functions/busy-mini-apps/index.ts");
for(const term of ['decideAppRequestTransition(current.data,status',
 'body?.ownerApproved!==true','busy_mark_mini_app_request_link_v3181',
 '.eq("status",freshness.expectedStatus)', '.eq("updated_at",freshness.expectedUpdatedAt)','apply_coordinated_edits',
 '.eq("draft_revision",expected)'])
 assert.ok(edge.includes(term),"Backend safety not wired: "+term);
assert.ok(read("supabase/migrations/20261012193000_v3_181_durable_work_booking_ledger.sql").includes("busy_mark_mini_app_request_link_v3180"));
assert.ok(read("supabase/migrations/20261012183000_v3_180_atomic_business_app_handoff.sql").includes("v_prior.action_record_id is distinct from p_action_record_id"));
assert.equal(preflightRequestBridge({request:{request_type:"booking_request",status:"reviewing"},existing:{bridge_state:"booking_draft",customer_record_id:"customer",action_record_id:"original"},bridgeState:"booking_draft",customerRecordId:"customer",actionRecordId:"different"}).ok,false);
const ui=read("src/screens/miniApps.js"),controller=read("src/app/AppController.js");
for(const term of ["Capture visible screen","appVisibleCaptureReceipt",
 "Preview edited service","Preview removal of this service",
 "Request progress","Undo my last approved batch"])
 assert.ok(ui.includes(term),"App UI not wired: "+term);
assert.ok(controller.includes("ownerApproved:true,"));
const pkg=JSON.parse(read("package.json"));
assert.equal(pkg.dependencies["react-native-view-shot"],"4.0.3");
console.log("V3.158 PASS: individual services, atomic approval/undo, safe request transitions, native visible screen capture contract and no false booking confirmation.");
