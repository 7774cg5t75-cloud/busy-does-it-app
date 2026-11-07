import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planWebsiteToAppDesign,confirmWebsiteToAppDesign,
 recommendedAppFirstSection,websiteOwnerServices,W2A_TYPE,W2A_SERVICE}
 from "../src/core/websiteToAppBrandTransferV3196.mjs";
import {planAppToWebsiteDesign,confirmAppToWebsiteDesign,A2W_TYPE,A2W_LAYOUT}
 from "../src/core/appToWebsiteBrandTransferV3196.mjs";
import {proposeCoordinatedAppChanges}
 from "../src/core/appCoordinatedStudio.mjs";
import {applyWebsiteLayoutOperation}
 from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {nativePalette} from "../src/core/nativePalette.mjs";
import {buildBusinessBrandDnaSnapshot} from "../src/core/businessBrandDnaV3195.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checked=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checked++};
const ok=(v,m)=>{assert.ok(v,m);checked++};
const bid="00000000-0000-4000-8000-000000003196";
const website={id:"website-draft",businessId:bid,generation:8,
 businessName:"Rosewood Hair Salon",businessType:"hairdresser",
 theme:{primary:"#A85179",typography:"editorial",cardLayout:"rows"},
 sections:[{id:"hero",type:"hero",title:"Rosewood",body:"Beautiful hair"},
 {id:"services",type:"services",enabled:true,items:[
  {id:"cut",title:"Haircut",body:"Consultation and styling"},
  {id:"colour",title:"Highlights",body:"Colour to suit you"}]}]};
const app={id:"private-app",business_id:bid,draft_revision:11,
 draft_config:{
  modules:[{key:"business_profile",enabled:true},{key:"services",enabled:true},
   {key:"booking_request",enabled:true},{key:"enquiry",enabled:true},
   {key:"offers",enabled:true}],
  navigation:["business_profile","services","booking_request","enquiry","offers"],
  presentation:{brandPalette:"forest",typeStyle:"balanced",serviceStyle:"cards"},
  publicProfile:{businessName:"Rosewood Hair Salon",services:[
   {name:"Haircut",description:"Existing app wording"}]}}};
const wb=JSON.stringify(website),ab=JSON.stringify(app);
eq(W2A_TYPE.editorial,"editorial");eq(W2A_SERVICE.rows,"rows");
eq(A2W_TYPE.editorial,"editorial");eq(A2W_LAYOUT.spotlight,"outlines");
eq(recommendedAppFirstSection(website.businessType,app.draft_config),"booking_request");
eq(recommendedAppFirstSection("food stall",app.draft_config),"offers");
eq(recommendedAppFirstSection("plumber",app.draft_config),"enquiry");
eq(recommendedAppFirstSection("retailer",app.draft_config),"services");
eq(recommendedAppFirstSection("unknown",{modules:[{key:"gallery",enabled:true}]}),null);
eq(websiteOwnerServices(website).length,2);
eq(websiteOwnerServices({...website,sections:[{id:"services",type:"services",items:[
 {title:"<script>",body:"Bad"}]}]}),[]);
const fresh=planWebsiteToAppDesign({website,app,businessId:bid,mode:"new"});
ok(fresh.ok);eq(fresh.operations,[]);eq(fresh.autoPublishes,false);
eq(fresh.startFresh,true);
for(const mode of ["match","adapt"]){
 const plan=planWebsiteToAppDesign({website,app,businessId:bid,
  mode,includeServices:true});
 ok(plan.ok,plan.reason);eq(plan.mode,mode);
 ok(plan.operations.every(op=>["appearance","services","first"].includes(op.kind)));
 ok(plan.operations.some(op=>op.kind==="appearance"&&op.field==="brandAccent"&&op.value==="#A85179"));
 ok(plan.operations.some(op=>op.kind==="appearance"&&op.field==="typeStyle"&&op.value==="editorial"));
 ok(plan.operations.some(op=>op.kind==="appearance"&&op.field==="serviceStyle"&&op.value==="rows"));
 const copy=plan.operations.find(op=>op.kind==="services");
 ok(copy);eq(copy.value.length,2);
 eq(copy.value[0].description,"Existing app wording");
 eq(copy.value[1].name,"Highlights");
 eq(copy.value[1].description,"Colour to suit you");
 const preview=proposeCoordinatedAppChanges(app.draft_config,plan.operations);
 ok(preview.ok,preview.reason);
 eq(preview.nextConfig.presentation.brandAccent,"#A85179");
 eq(preview.nextConfig.presentation.brandPalette,"custom");
 eq(preview.nextConfig.presentation.typeStyle,"editorial");
 eq(preview.nextConfig.presentation.serviceStyle,"rows");
 ok(!plan.operations.some(op=>op.kind==="module"));
 ok(!plan.operations.some(op=>op.kind==="publish"));
 eq(plan.privateOnly,true);eq(plan.autoPublishes,false);
 eq(plan.chargesCustomers,false);
 const confirmed=confirmWebsiteToAppDesign({website,app,businessId:bid,evidence:plan});
 ok(confirmed.ok,confirmed.reason);
 eq(confirmed.exactPreview,plan.exactPreview);
 eq(confirmWebsiteToAppDesign({website:{...website,generation:9},app,businessId:bid,evidence:plan}).ok,false);
 eq(confirmWebsiteToAppDesign({website,app:{...app,draft_revision:12},businessId:bid,evidence:plan}).ok,false);
 eq(confirmWebsiteToAppDesign({website,app,businessId:"other",evidence:plan}).ok,false);
 eq(confirmWebsiteToAppDesign({website:{...website,theme:{...website.theme,primary:"#111111"}},app,businessId:bid,evidence:plan}).ok,false);
 eq(confirmWebsiteToAppDesign({website,app,businessId:bid,
  evidence:{...plan,operations:[{kind:"appearance",field:"brandAccent",value:"#FFFFFF"}]}}).ok,false);
 if(mode==="adapt"){
  ok(plan.operations.some(op=>op.kind==="first"&&op.moduleKey==="booking_request"));
  eq(preview.nextConfig.navigation[0],"booking_request");
 }else{
  eq(plan.operations.some(op=>op.kind==="first"),false);
  eq(preview.nextConfig.navigation[0],"business_profile");
 }
}
eq(JSON.stringify(website),wb);
eq(JSON.stringify(app),ab);
const simple=planWebsiteToAppDesign({website,app,businessId:bid,
 mode:"adapt",includeServices:false});
ok(simple.ok);eq(simple.operations.some(x=>x.kind==="services"),false);
eq(planWebsiteToAppDesign({website:{...website,businessId:"alien"},app,businessId:bid}).ok,false);
eq(planWebsiteToAppDesign({website,app:{...app,business_id:"alien"},businessId:bid}).ok,false);
eq(planWebsiteToAppDesign({website,app,businessId:bid,mode:"surprise"}).ok,false);
eq(planWebsiteToAppDesign({website:{...website,theme:{primary:"javascript:evil",typography:"oops"}},app,businessId:bid,mode:"match",includeServices:false}).ok,false);
const invalidServices=planWebsiteToAppDesign({website:{...website,
 sections:[{id:"services",type:"services",items:[{title:"<img src=x>",body:"unsafe"}]}]},
 app,businessId:bid,mode:"match",includeServices:true});
ok(invalidServices.ok);eq(invalidServices.operations.some(x=>x.kind==="services"),false);
eq(invalidServices.operations.some(x=>x.kind==="appearance"),true);
const a2w=planAppToWebsiteDesign({website,app,businessId:bid,
 mode:"adapt",includeServices:true});
ok(a2w.ok,a2w.reason);
eq(a2w.privateOnly,true);eq(a2w.neverPublishes,true);
eq(a2w.sourceAppRevision,11);
eq(a2w.targetWebsiteGeneration,8);
ok(a2w.operations.some(x=>x.action==="brand-colour"));
ok(a2w.operations.some(x=>x.action==="style"&&x.field==="typography"));
ok(a2w.operations.some(x=>x.action==="style"&&x.field==="cardLayout"));
eq(a2w.serviceCopyCount,0); // website already has app "Haircut"
const wplan=planAppToWebsiteDesign({
 website:{...website,sections:website.sections.filter(x=>x.id!=="services")},
 app,businessId:bid,mode:"match",includeServices:true});
ok(wplan.ok,wplan.reason);
eq(wplan.serviceCopyCount,1);
eq(wplan.addedServices[0].title,"Haircut");
ok(wplan.proposedDraft.sections.some(s=>s.id==="services"));
ok(confirmAppToWebsiteDesign({website,app,businessId:bid,evidence:a2w}).ok);
eq(confirmAppToWebsiteDesign({website,app:{...app,draft_revision:12},
 businessId:bid,evidence:a2w}).ok,false);
eq(confirmAppToWebsiteDesign({website:{...website,generation:9},
 app,businessId:bid,evidence:a2w}).ok,false);
eq(confirmAppToWebsiteDesign({website,app,businessId:bid,
 evidence:{...a2w,operations:[{action:"brand-colour",value:"#FFFFFF"}]}}).ok,false);
eq(confirmAppToWebsiteDesign({website,app,businessId:bid,
 evidence:{...a2w,addedServices:[{title:"fake"}]}}).ok,false);
eq(planAppToWebsiteDesign({website:{...website,businessId:"foreign"},
 app,businessId:bid}).ok,false);
const independent=planAppToWebsiteDesign({website,app,businessId:bid,mode:"new"});
ok(independent.ok);eq(independent.operations,[]);eq(independent.requiresOwnerApproval,false);
let after=website;
for(const op of a2w.operations){
 const applied=applyWebsiteLayoutOperation(after,op);
 ok(applied.applied,applied.reason);after=applied.draft;
}
eq(after.sections.map(x=>x.title),website.sections.map(x=>x.title));
eq(after.sections.find(x=>x.id==="services").items[0].body,
 website.sections.find(x=>x.id==="services").items[0].body);
eq(after.theme.primary,nativePalette("forest").accent);
eq(after.theme.typography,"confident");
eq(after.theme.cardLayout,"cards");
// Shared Brand DNA snapshot remains the source of business context;
// transfer planners never mutate the source or publish on behalf of owner.
const dna=buildBusinessBrandDnaSnapshot({website,app,businessId:bid});
ok(dna.ok);eq(dna.design.websiteColour,"#A85179");
eq(JSON.stringify(website),wb);eq(JSON.stringify(app),ab);
// UI and authenticated existing server actions are genuinely connected.
const owner=read("src/screens/websiteToAppDesignTransfer.js");
const site=read("src/screens/appToWebsiteDesignTransfer.js");
const mini=read("src/screens/miniApps.js");
const websiteUI=read("src/screens/websiteBuilder.js");
const ctrl=read("src/app/AppController.js");
const edge=read("supabase/functions/busy-mini-apps/index.ts");
for(const str of ["Match my website closely","Keep my brand, adapt for an app",
 "Start fresh","Review my website-to-app design","onPreview?.(proposal)",
 "confirmWebsiteToAppDesign({website,app,businessId,evidence:review})"])
 ok(owner.includes(str),"Missing Website->App owner experience "+str);
for(const str of ["Match the app's style closely","Keep my brand, adapt for a website",
 "Approve this PRIVATE website change","confirmAppToWebsiteDesign({website,app,businessId,evidence:review})"])
 ok(site.includes(str),"Missing App->Website owner experience "+str);
ok(/<WebsiteToAppDesignTransfer\b[^>]*website=\{s\.websiteDraft\}/.test(mini));
ok(mini.includes("onPreview={setStudioPreview}"));
ok(/<AppToWebsiteDesignTransfer\b[^>]*website=\{draft\}/.test(websiteUI));
ok(websiteUI.includes("onApply={s.applyAppDesignToWebsite}"));
ok(ctrl.includes("const applyAppDesignToWebsite=evidence=>"));
ok(ctrl.includes("confirmAppToWebsiteDesign({website:current,app,businessId,evidence})"));
ok(ctrl.includes("commitReviewedBuilderDraft(current,next,"));
ok(ctrl.includes("saveCoordinatedAppChanges=async("));
ok(ctrl.includes('miniAppsRequest("apply_coordinated_edits"'));
ok(edge.includes('action === "apply_coordinated_edits"'));
ok(edge.includes('ownerApproved:true')||edge.includes('ownerApproved===true')||
 edge.includes("ownerApproved !== true"));
// This is NOT an app creation, automated publisher, or live outcome proof.
console.log("V3.196 "+checked+" two-way owner-controlled Brand DNA adaptation, same-tenant/private contracts, atomic builder flows and industry recommendations PASS.");
