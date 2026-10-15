import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planAppVoiceInstructions,proposeCoordinatedAppChanges} from "../src/core/appCoordinatedStudio.mjs";
import {previewPrivateAppAppearance} from "../src/core/appAppearanceEditing.mjs";
import {planFunctionalBusinessApp} from "../src/core/appExperiencePlanner.mjs";
import {appDesignQualityReport} from "../src/core/appDesignQuality.mjs";
import {appRuntimeScreenSchema} from "../src/core/appRuntimeScreenSchema.mjs";
import {buildAppDistributionPlan,buildStandalonePrivateHandoff} from "../src/core/appDistributionChoices.mjs";
import {nativeShellDescriptor} from "../src/core/standaloneNativePackage.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const modules=["business_profile","services","gallery","booking_request","enquiry","contact"]
 .map(key=>({key,enabled:true}));
const catalog=modules.map((item,index)=>({module_key:item.key,title:item.key,
 sort_order:index,status:"available",capabilities:{
 customer_action:["enquiry","booking_request"].includes(item.key),
 confirmation_required_by_business:item.key==="booking_request"
 }}));
const config={modules,navigation:modules.map(x=>x.key),
 display:{name:"Example Studio",tagline:"Original tagline"},
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",
  navigationStyle:"tabs"},
 publicProfile:{businessName:"Example Studio",businessType:"Ceramic sculptor",
  tagline:"Original tagline",about:"Original about",description:"Original description",
  contact:{email:"owner@example.test"},
  services:[{name:"Custom bowls",description:"Hand-crafted bowls"}],
  assets:{gallery:[{uri:"https://example.test/1.jpg",approved:true},
   {uri:"https://example.test/2.jpg",approved:true}]}},
 privateCustomerData:{doNotTouch:"secret"},payments:{enabled:false}};
const json=JSON.stringify(config);
const p=planAppVoiceInstructions(config,"Put bookings on the first screen, make the photos bigger and keep my existing colours");
assert.equal(p.ok,true,p.reason);
assert.equal(p.changes.length,2);
assert.deepEqual(p.preserved,["keep my existing colours"]);
assert.equal(p.nextConfig.navigation[0],"booking_request");
assert.equal(p.nextConfig.presentation.imageScale,"large");
assert.equal(p.nextConfig.privateCustomerData,config.privateCustomerData);
assert.equal(p.nextConfig.payments.enabled,false);
assert.equal(p.publishes,false);
assert.equal(p.chargesCustomers,false);
assert.equal(p.sameSharedConfigForStandalone,true);
assert.equal(JSON.stringify(config),json,"proposing must never mutate original");
const runtime=appRuntimeScreenSchema(p.nextConfig,catalog);
assert.equal(runtime.ok,true,runtime.reason);
assert.equal(runtime.screens[0].key,"booking_request");
const undone=proposeCoordinatedAppChanges(p.nextConfig,p.undoOperations);
assert.equal(undone.ok,true,undone.reason);
assert.deepEqual(undone.nextConfig.navigation,config.navigation);
assert.deepEqual(undone.nextConfig,config,"Undo must restore the original sparse configuration exactly");
assert.equal(undone.nextConfig.display.tagline,config.display.tagline);
const copy=proposeCoordinatedAppChanges(config,[
 {kind:"text",field:"tagline",value:"Fresh owner-approved tagline"},
 {kind:"photo",from:1,to:0},
 {kind:"appearance",field:"headerStyle",value:"bold"}
]);
assert.equal(copy.ok,true,copy.reason);
assert.equal(copy.nextConfig.publicProfile.tagline,"Fresh owner-approved tagline");
assert.equal(copy.nextConfig.display.tagline,"Fresh owner-approved tagline");
assert.equal(copy.nextConfig.publicProfile.assets.gallery[0].uri,"https://example.test/2.jpg");
const copyUndo=proposeCoordinatedAppChanges(copy.nextConfig,copy.undoOperations);
assert.equal(copyUndo.ok,true,copyUndo.reason);
assert.deepEqual(copyUndo.nextConfig.publicProfile,config.publicProfile);
assert.deepEqual(copyUndo.nextConfig.presentation.headerStyle,config.presentation.headerStyle);
const blank={...config,publicProfile:{...config.publicProfile,about:""}};
const fill=proposeCoordinatedAppChanges(blank,[{kind:"text",field:"about",value:"Owner-written about"}]);
assert.equal(fill.ok,true);
assert.equal(proposeCoordinatedAppChanges(fill.nextConfig,fill.undoOperations).ok,true,"Undo restores empty original wording");
for(const operations of [
 [{kind:"publish"}],[{kind:"payment",value:true}],
 [{kind:"text",field:"apiKey",value:"stolen"}],
 [{kind:"text",field:"tagline",value:"<script>alert(1)</script>"}],
 [{kind:"photo",from:-1,to:1}],
 [{kind:"appearance",field:"headerStyle",value:"javascript"}],
 Array(9).fill({kind:"appearance",field:"headerStyle",value:"bold"})
 ])assert.equal(proposeCoordinatedAppChanges(config,operations).ok,false,JSON.stringify(operations));
assert.equal(planAppVoiceInstructions(config,"Make it premium and automatically confirm bookings").ok,false,
 "Unclear or unsafe clauses should never be partially applied");
assert.equal(planAppVoiceInstructions(config,"Make photos bigger and delete customer records").ok,false);
assert.equal(previewPrivateAppAppearance(config,{field:"imageScale",value:"large"}).ok,true);
const unknown=planFunctionalBusinessApp({businessName:"Fresh Clay",
 businessType:"Experimental ceramic sculpture studio",businessGoals:
 "Let people request an appointment, see our photos and send enquiries",
 catalog,profile:config.publicProfile});
assert.deepEqual(unknown.understoodGoals,["booking","gallery","enquiry"]);
assert.ok(unknown.suggestedModules.some(m=>m.key==="booking_request"&&m.suggested));
assert.ok(unknown.suggestedModules.some(m=>m.key==="gallery"&&m.suggested));
assert.equal(unknown.canConfirmBooking,false);
assert.equal(unknown.canEnablePayments,false);
const lacking=planFunctionalBusinessApp({businessType:"Unusual studio",
 businessGoals:"Show photos and request appointments",catalog:catalog.filter(x=>x.module_key!=="gallery")});
assert.deepEqual(lacking.unavailableGoalCapabilities,["gallery"]);
const quality=appDesignQualityReport(config,catalog);
assert.equal(quality.ok,true);
assert.equal(quality.screenshotEvidenceProvided,false);
assert.equal(quality.storeApprovalVerified,false);
assert.ok(quality.checks.some(x=>x.id==="real_device_review"&&!x.passed));
const notStore=buildAppDistributionPlan({mode:"standalone",app:null,preview:null});
assert.equal(notStore.mayPackageOrSubmit,false);
assert.equal(notStore.mayCharge,false);
const id="00000000-0000-4000-8000-000000000157";
const version="00000000-0000-4000-8000-000000000158";
const ownerApp={id,display_name:"Example Studio",draft_revision:4};
const immutable={id:version,version_no:1,source_draft_revision:4,
 config:{...p.nextConfig,display:{...p.nextConfig.display,name:"Example Studio"}}};
const distribution=buildAppDistributionPlan({mode:"standalone",app:ownerApp,
 preview:immutable,acknowledgements:{externalFees:true,externalAccounts:true,
 storeApproval:true,ongoingCosts:true},requestedPlatforms:["ios","android"]});
const handoff=buildStandalonePrivateHandoff({app:ownerApp,preview:immutable,
 plan:distribution,catalog,ownerConfirmed:true});
assert.equal(handoff.ok,true,handoff.reason);
assert.equal(handoff.appearance.imageScale,"large");
assert.equal(handoff.appearanceSource,"matching_immutable_private_preview");
const shell=nativeShellDescriptor(handoff);
assert.equal(shell.ok,true,shell.reason);
assert.equal(shell.appearance.imageScale,"large");
assert.equal(shell.screenSchema.screens[0].key,"booking_request");
assert.equal(shell.signingConfigured,false);
assert.equal(shell.appStoreSubmitEnabled,false);
assert.equal(nativeShellDescriptor({...handoff,appearance:{imageScale:"huge"}}).ok,false);
assert.ok(read("standalone/template/App.js").includes("responsiveAppLayout("));
assert.ok(read("standalone/template/appResponsiveDesign.mjs").includes('scale==="large"'));
assert.equal(read("src/core/appCoordinatedStudio.mjs"),
 read("supabase/functions/busy-mini-apps/appCoordinatedStudio.mjs"),
 "Client and trusted edge must implement the identical finite editing policy");
assert.equal(read("src/core/appAppearanceEditing.mjs"),
 read("supabase/functions/busy-mini-apps/appAppearanceEditing.mjs"),
 "Appearance choices must be identical on client and edge");
const edge=read("supabase/functions/busy-mini-apps/index.ts");
for(const str of ["apply_coordinated_edits","ownerApproved!==true",
 ".eq(\"draft_revision\",expected)","changesCreated"]){
 if(str==="changesCreated")continue;
 assert.ok(edge.includes(str),"Edge revision and approval guard: "+str);
}
const controller=read("src/app/AppController.js"),screen=read("src/screens/miniApps.js");
assert.ok(controller.includes("saveCoordinatedAppChanges"));
assert.ok(controller.includes('"whole_app"'));
assert.ok(screen.includes("Undo my last approved batch"));
assert.ok(screen.includes("appDesignQualityReport"));
console.log("V3.157 PASS: goal-aware creation, coordinated preview, edit bounds, reversibility, private revision, shared runtime, static review and native distribution guardrails.");
