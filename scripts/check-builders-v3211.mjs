import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyWebsiteLayoutOperation}
 from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {planUniversalBuilderRequest}
 from "../src/core/universalBuilderPlanV3210.mjs";
import {planUniversalAppNavigation,confirmUniversalAppNavigation}
 from "../src/core/universalAppNavigationV3211.mjs";
import {proposeCoordinatedAppChanges}
 from "../src/core/appCoordinatedStudio.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
let checks=0;
const ok=(v,msg)=>{assert.ok(v,msg);checks++};
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
const id="00000000-0000-4000-8000-000000003211";
const draft=()=>({
 id:"site",businessId:id,generation:8,businessType:"unusual caravan and photography site",
 businessName:"Example Owner",
 theme:{},
 designPlan:{sectionOrder:["hero","about","services","gallery","contact"]},
 sections:[
  {id:"hero",type:"hero",enabled:true,title:"Example",body:"Owner text"},
  {id:"services",type:"services",enabled:true,items:[{title:"Pitches"}]},
  {id:"about",type:"text",enabled:true,title:"Our story",body:"Owner history"},
  {id:"gallery",type:"gallery",enabled:true,items:[{approved:true,storagePath:"a.jpg"}]},
  {id:"contact",type:"contact",enabled:true,email:"example@example.test"}
 ]
});
const catalog=[
 ["business_profile",{}],["services",{}],["contact",{}],["gallery",{}],
 ["enquiry",{customer_action:true}],
 ["booking_request",{confirmation_required_by_business:true}],
 ["offers",{}]
].map(([module_key,capabilities])=>({module_key,status:"available",
 capabilities,title:module_key}));
const makeApp=(keys=["business_profile","contact","services","enquiry","gallery","booking_request"])=>({
 id:"app",business_id:id,draft_revision:6,category:"experimental business",
 draft_config:{modules:keys.map(key=>({key,enabled:true})),navigation:[...keys],
  publicProfile:{businessName:"Example Owner",services:[{name:"Pitch hire"}],
   assets:{gallery:[{approved:true,uri:"https://example.test/photo.jpg"}]}},
  offers:[]}
});
const request="Show our photographs, services and let people request bookings and pay deposits.";
const web=draft(),app=makeApp();
const requirements=planUniversalBuilderRequest({request,businessId:id,
 businessType:"caravan park photography studio",website:web,app,catalog});
ok(requirements.ok,requirements.reason);
ok(requirements.sectionPlan.changesSuggested);
eq(requirements.sectionPlan.before,["hero","about","services","gallery","contact"]);
eq(requirements.sectionPlan.proposed.slice(0,3),["hero","gallery","services"]);
const op={
 action:"apply-reviewed-composition",websiteId:web.id,
 expectedGeneration:web.generation,expectedBusinessId:id,
 before:requirements.sectionPlan.before,
 proposed:requirements.sectionPlan.proposed
};
const edited=applyWebsiteLayoutOperation(web,op);
ok(edited.applied,edited.reason);
eq(edited.draft.theme.sectionOrder,requirements.sectionPlan.proposed);
eq(web.theme.sectionOrder,undefined,"Source remains unchanged for undo history.");
eq(edited.draft.sections.map(({items,...section})=>section),
 web.sections.map(({items,...section})=>section),
 "A composition edit must preserve every original section field.");
eq(edited.draft.sections.map(s=>s.items||[]),
 web.sections.map(s=>s.items||[]),
 "A composition edit must preserve all section items and copy.");
eq(edited.draft.businessId,id);
eq(edited.draft.generation,8,"The private controller wraps withHtml to bump the generation.");
for(const wrong of [
 {...op,websiteId:"another"},
 {...op,expectedBusinessId:"another"},
 {...op,expectedBusinessId:""},
 {...op,expectedBusinessId:null},
 {...op,expectedGeneration:7},
 {...op,before:["hero","services","about","gallery","contact"]},
 {...op,proposed:["hero","gallery","unknown","services","contact"]},
 {...op,proposed:["hero","about","services","gallery","contact"]},
 {...op,proposed:["gallery","hero","about","services","contact"]},
 {...op,proposed:["hero","gallery","gallery","services","contact"]},
 {...op,proposed:["hero","gallery","services","contact"]},
 {...op,customHtml:"<script>bad</script>"}
]){
 const result=applyWebsiteLayoutOperation(web,wrong);
 eq(result.applied,false,"Atomic website operation rejects forged/stale/incomplete proposals.");
 eq(web.theme.sectionOrder,undefined,"Failed operation cannot mutate original.");
}
eq(applyWebsiteLayoutOperation(edited.draft,op).applied,false,
 "A duplicate apply cannot silently change the section order.");
const anotherDraft={...web,sections:web.sections.map(s=>s.id==="gallery"?
  {...s,enabled:false}:s)};
eq(applyWebsiteLayoutOperation(anotherDraft,op).applied,false,
 "Hidden sections make the reviewed operation stale.");
// A section that exists but has no approved/usable business information
// is not a good customer-first experience; it stays editable, not promoted.
const emptyGallery={...web,sections:web.sections.map(s=>s.id==="gallery"?
 {...s,items:[]}:s)};
const emptyPlan=planUniversalBuilderRequest({request,businessId:id,
 website:emptyGallery,app,catalog});
ok(emptyPlan.ok);
ok(emptyPlan.sectionPlan.contentNotYetReady.includes("gallery"));
ok(emptyPlan.sectionPlan.proposed.indexOf("gallery")>
 emptyPlan.sectionPlan.proposed.indexOf("services"));
const incompleteService={...web,sections:web.sections.map(s=>s.id==="services"?
 {...s,items:[]}:s)};
const missingService=planUniversalBuilderRequest({request,businessId:id,
 website:incompleteService,app,catalog});
ok(missingService.sectionPlan.contentNotYetReady.includes("services"));
const visitorUpload=planUniversalBuilderRequest({
 request:"Let customers upload images and vote in competitions.",
 businessId:id,website:web,app,catalog
});
ok(visitorUpload.detectedGoals.includes("uploads"));
ok(visitorUpload.detectedGoals.includes("voting"));
ok(!visitorUpload.detectedGoals.includes("gallery"),
 "A customer upload should not imply an approved public gallery.");
const appReview=planUniversalAppNavigation({businessId:id,request,
 app,website:web,catalog});
ok(appReview.ok,appReview.reason);
ok(appReview.preview,"Approved existing app screens can be reviewed.");
eq(appReview.preview.before,app.draft_config.navigation);
eq(appReview.preview.after[0],"business_profile");
eq(appReview.preview.after[1],"gallery");
eq(appReview.preview.after[2],"services");
eq(appReview.preview.after[3],"booking_request");
eq(appReview.preview.operations.length,1);
eq(appReview.preview.operations[0].kind,"navigation");
const prepared=proposeCoordinatedAppChanges(app.draft_config,appReview.preview.operations);
ok(prepared.ok);
eq(prepared.nextConfig.navigation,appReview.preview.after);
eq(prepared.privateOnly,true);
eq(prepared.publishes,false);
eq(prepared.chargesCustomers,false);
eq(prepared.changesBookings,false);
eq(confirmUniversalAppNavigation({businessId:id,request,app,website:web,catalog,
 review:appReview}).ok,true);
for(const changed of [
 {app:{...app,draft_revision:7}},
 {app:{...app,id:"other"}},
 {app:{...app,business_id:"other"}},
 {website:{...web,generation:9}},
 {website:{...web,businessId:"other"}},
 {catalog:catalog.map(c=>c.module_key==="booking_request"?
   {...c,status:"planned"}:c)},
 {request:"Show our photographs and services"},
 {review:{...appReview,preview:{...appReview.preview,
    operations:[{kind:"navigation",value:["business_profile","gallery","contact"]}]}}},
 {review:{...appReview,preview:{...appReview.preview,
    before:["business_profile","gallery"]}}}
]){
 const r=confirmUniversalAppNavigation({businessId:id,request,app,website:web,
 catalog,review:appReview,...changed});
 eq(r.ok,false,"An app approval with changed evidence must fail.");
}
const appNoServices=makeApp();
appNoServices.draft_config.publicProfile.services=[];
const noServices=planUniversalAppNavigation({businessId:id,request:"Book a service",
 app:appNoServices,catalog});
ok(noServices.ok);
ok(!noServices.promotedExistingModules.includes("booking_request"),
 "An empty service list must never drive a booking-first recommendation.");
const noGallery=makeApp();
noGallery.draft_config.publicProfile.assets.gallery=[];
const noGalleryResult=planUniversalAppNavigation({businessId:id,
 request:"Show our photo gallery",app:noGallery,catalog});
ok(noGalleryResult.ok);
ok(!noGalleryResult.promotedExistingModules.includes("gallery"),
 "An empty gallery must not become the customer's first screen.");
const unsupported=planUniversalAppNavigation({businessId:id,
 request:"Let members upload images and vote in a competition",app,catalog});
ok(unsupported.ok);
eq(unsupported.preview,null);
eq(unsupported.noNewModules,true);
eq(unsupported.neverPublishes,true);
const invalidRuntime=planUniversalAppNavigation({businessId:id,request,app,
 catalog:catalog.map(c=>c.module_key==="enquiry"?{...c,capabilities:{}}:c)});
eq(invalidRuntime.ok,false,"Actual runtime must verify existing enabled enquiry module.");
const invalidNav=planUniversalAppNavigation({businessId:id,request,
 app:{...app,draft_config:{...app.draft_config,navigation:["services"]}},catalog});
eq(invalidNav.ok,false);
const missingTenant=planUniversalAppNavigation({businessId:"",
 request,app,catalog});
eq(missingTenant.ok,false);
const crossTenant=planUniversalAppNavigation({businessId:"another",
 request,app,catalog});
eq(crossTenant.ok,false);
const approvedOffersApp=makeApp(
 ["business_profile","contact","services","offers"]);
approvedOffersApp.draft_config.offers=[{approved:true,title:"Offer"}];
const offersResult=planUniversalAppNavigation({businessId:id,
 request:"Advertise our special offers",app:approvedOffersApp,catalog});
ok(offersResult.ok);
eq(offersResult.preview?.after[1],"offers");
const source=read("src/screens/universalBuilderPlanReview.js");
const websiteUI=read("src/screens/websiteBuilder.js");
const appUI=read("src/screens/miniApps.js");
const trusted=read("src/app/AppController.js");
for(const fragment of [
 "confirmUniversalAppNavigation({businessId,request:reviewedGoal",
 'action:"apply-reviewed-composition"',
 "onApplyWebsiteComposition?.({",
 "onSaveAppChanges?.({",
 "expectedRevision:fresh.appRevision",
 "Approve one private app navigation change",
 "Approve this private website section order",
 "setReport(null);setNavigationReview(null)"
])ok(source.includes(fragment),"Shared UI needs "+fragment);
ok(websiteUI.includes("onApplyWebsiteComposition={s.applyWebsiteLayoutAction}"));
ok(appUI.includes("onSaveAppChanges={s.saveCoordinatedAppChanges}"));
ok(trusted.includes("applyWebsiteLayoutChange(websiteDraft, operation)"));
ok(trusted.includes("setWebsiteUndo(items=>[...items,current]"));
ok(trusted.includes('miniAppsRequest("apply_coordinated_edits"'));
ok(trusted.includes("Number(data.app.draft_revision)!==Number(expectedRevision)+1"));
ok(read("src/core/universalBuilderPlanV3210.mjs").includes("planWebsiteSectionComposition"));
ok(read("supabase/functions/busy-website-worker/websiteLayoutEditing.mjs")
 .includes('if(action==="apply-reviewed-composition"){'));
console.log("V3.211 "+checks+" assertions PASS: atomic website approval, revision/tenant checks, real app catalogue, no unsupported modules, undo and two-builder source wiring.");

assert.ok(trusted.includes("checkPrivateWebsiteDraftCommit({current,candidate:nextDraft"));
