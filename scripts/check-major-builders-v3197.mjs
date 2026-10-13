import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareFirstAppFromWebsite,confirmFirstAppFromWebsite,validWebsiteSource}
 from "../src/core/firstAppFromWebsiteV3197.mjs";
import {recommendOwnerBusinessApp}
 from "../src/core/ownerAppOpportunityV3197.mjs";
import {planWebsiteToAppDesign} from "../src/core/websiteToAppBrandTransferV3196.mjs";
import {decideStandaloneEligibility}
 from "../supabase/functions/busy-mini-apps/standaloneEligibility.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let assertions=0;
const ok=(v,m)=>{assert.ok(v,m);assertions++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);assertions++};
const bid="00000000-0000-4000-8000-000000003197";
const website={id:"owner-website",businessId:bid,generation:12,
 businessName:"Example Florist",businessType:"florist",
 theme:{primary:"#ac5d81",typography:"editorial",cardLayout:"rows"},
 sections:[
 {id:"hero",type:"hero",enabled:true,title:"Example Florist",
  body:"Fresh flowers made for you"},
 {id:"about",type:"about",enabled:true,body:"Local florist in Devon."},
 {id:"services",type:"services",enabled:true,
  items:[{id:"bouquets",title:"Bouquets",body:"Seasonal blooms"},
   {id:"weddings",title:"Wedding flowers",body:"Made to order"}]},
 {id:"gallery",type:"gallery",enabled:true,items:[
  {uri:"https://private.example/photos/unapproved.jpg",
   caption:"PRIVATE_ASSET_DO_NOT_COPY"}]}
 ]};
const original=JSON.stringify(website);
ok(validWebsiteSource(website,bid));
for(const invalid of [
 null,{},[],{...website,businessId:"different-business"},
 {...website,business_id:"different-business"},
 {...website,generation:0},{...website,generation:"12"},
 {...website,sections:"not-a-list"},{...website,id:""}
])eq(Boolean(validWebsiteSource(invalid,bid)),false);
eq(Boolean(validWebsiteSource(website,"")),false);
for(const mode of ["adapt","match"]){
 const plan=prepareFirstAppFromWebsite({website,app:null,businessId:bid,mode});
 ok(plan.ok,plan.reason);eq(plan.mode,mode);
 eq(plan.profileDraft.businessName,"Example Florist");
 eq(plan.profileDraft.businessType,"florist");
 eq(plan.profileDraft.tagline,"Fresh flowers made for you");
 eq(plan.profileDraft.about,"Local florist in Devon.");
 eq(plan.profileDraft.services.length,2);
 eq(plan.profileDraft.services[0].name,"Bouquets");
 eq(plan.profileDraft.services[1].description,"Made to order");
 eq(plan.brandColour,"#AC5D81");
 eq(plan.websiteType,"editorial");
 eq(plan.websiteCard,"rows");
 eq(plan.privateOnly,true);
 eq(plan.requiresOwnerApproval,true);
 eq(plan.autoPublishes,false);
 eq(plan.offersStoreApp,false);
 eq(plan.separateAppearanceSave,true);
 const raw=JSON.stringify(plan);
 for(const unsafe of ["PRIVATE_ASSET_DO_NOT_COPY","unapproved.jpg",
  "photos","customers","privateEmail"])
  ok(!raw.includes(unsafe),"Unsafe website data propagated: "+unsafe);
 const confirmed=confirmFirstAppFromWebsite({website,app:null,
  businessId:bid,evidence:plan});
 ok(confirmed.ok,confirmed.reason);
 eq(confirmed.source,plan.source);
 eq(confirmFirstAppFromWebsite({website:{...website,generation:13},
  app:null,businessId:bid,evidence:plan}).ok,false);
 eq(confirmFirstAppFromWebsite({website:{...website,id:"another"},
  app:null,businessId:bid,evidence:plan}).ok,false);
 eq(confirmFirstAppFromWebsite({website:{...website,
  sections:website.sections.map(s=>s.id==="services"?{...s,items:[
   {id:"changed",title:"Bouquets",body:"New owner wording"}]}:s)},
  app:null,businessId:bid,evidence:plan}).ok,false);
 eq(confirmFirstAppFromWebsite({website,app:null,businessId:bid,
  evidence:{...plan,profileDraft:{...plan.profileDraft,
  services:[{name:"Overridden service"}]}}}).ok,false);
 eq(confirmFirstAppFromWebsite({website,app:null,businessId:bid,
  evidence:{...plan,source:"tampered"}}).ok,false);
 eq(confirmFirstAppFromWebsite({website,app:{id:"already-owned"},
  businessId:bid,evidence:plan}).ok,false);
 eq(confirmFirstAppFromWebsite({website,app:null,businessId:"other",evidence:plan}).ok,false);
}
const none=prepareFirstAppFromWebsite({website,app:null,businessId:bid,mode:"new"});
ok(none.ok);eq(none.startFresh,true);eq(none.autoPublishes,false);
eq(confirmFirstAppFromWebsite({website,app:null,businessId:bid,evidence:none}).ok,false);
eq(prepareFirstAppFromWebsite({website,app:null,businessId:bid,mode:"copy-images"}).ok,false);
eq(prepareFirstAppFromWebsite({website,app:{id:"exists"},businessId:bid}).ok,false);
eq(prepareFirstAppFromWebsite({website:{...website,businessName:""},app:null,businessId:bid}).ok,false);
eq(prepareFirstAppFromWebsite({website:{...website,businessName:"<script>"},app:null,businessId:bid}).ok,false);
eq(prepareFirstAppFromWebsite({website:{...website,sections:[{id:"services",type:"services",
 items:[{title:"<script>",body:"Unsafe"}]}]},app:null,businessId:bid}).profileDraft.services.length,0);
eq(JSON.stringify(website),original);
// Following an authenticated first draft, the V3.196 existing-app design
// planner must still prepare only supported private atomic edits.
const sampleApp={id:"new-private-app",business_id:bid,draft_revision:3,
 draft_config:{modules:[
  {key:"business_profile",enabled:true},{key:"services",enabled:true},
  {key:"enquiry",enabled:true}],navigation:[
  "business_profile","services","enquiry"],
  presentation:{brandPalette:"forest",typeStyle:"balanced",serviceStyle:"cards"},
  publicProfile:{businessName:"Example Florist",
   services:[{name:"Bouquets",description:"Seasonal blooms"}]}}};
const adapt=planWebsiteToAppDesign({website,app:sampleApp,businessId:bid,mode:"adapt",includeServices:false});
ok(adapt.ok,adapt.reason);
ok(adapt.operations.every(x=>x.kind==="appearance"||x.kind==="first"));
ok(adapt.operations.some(x=>x.kind==="appearance"&&x.field==="brandAccent"&&x.value==="#AC5D81"));
ok(!adapt.operations.some(x=>x.kind==="services"));
eq(adapt.privateOnly,true);
eq(adapt.autoPublishes,false);
// Provider readback is the ONLY positive path for "included benefit".
const baseline=recommendOwnerBusinessApp({businessId:bid,website,
 app:null,businessType:"florist",
 services:[{name:"Bouquets"}]});
ok(baseline.show);eq(baseline.entitlementVerified,false);
eq(baseline.includedBenefitText,"");
ok(baseline.entitlementText.includes("Check your subscription"));
eq(baseline.ownerCanDismiss,true);eq(baseline.neverAutoCreates,true);
for(const mock of [
 {verified:true,eligible:true,remaining:2,businessId:"other",authorizesBuild:false},
 {verified:false,eligible:true,remaining:2,businessId:bid,authorizesBuild:false},
 {verified:true,eligible:false,remaining:2,businessId:bid,authorizesBuild:false},
 {verified:true,eligible:true,remaining:0,businessId:bid,authorizesBuild:false},
 {verified:true,eligible:true,remaining:"2",businessId:bid,authorizesBuild:false},
 {verified:true,eligible:true,remaining:2,businessId:bid,authorizesBuild:true},
 {tier:"premium",included:true,free:true,businessId:bid}
]){
 const suggestion=recommendOwnerBusinessApp({businessId:bid,website,
  businessType:"florist",entitlement:mock});
 eq(suggestion.entitlementVerified,false);
 eq(suggestion.includedBenefitText,"");
}
const trusted=decideStandaloneEligibility({
 business_id:bid,source:"verified_provider_webhook",
 provider_verified:true,status:"active",external_subscription_id:"sub_sample_123",
 allowance:2,used:1,period_end:"2027-10-13T00:00:00Z"
},{businessId:bid,nowISO:"2026-10-13T00:00:00Z"});
ok(trusted.verified);ok(trusted.eligible);eq(trusted.remaining,1);
const verified=recommendOwnerBusinessApp({businessId:bid,website,
 businessType:"florist",entitlement:{...trusted,businessId:bid,authorizesBuild:false}});
ok(verified.entitlementVerified);
ok(verified.includedBenefitText.includes("verified subscription"));
ok(verified.entitlementText.includes("App-store accounts"));
eq(verified.doesNotGuaranteeStoreDistribution,true);
for(const row of [
 {...trusted,businessId:"other",authorizesBuild:false},
 {...trusted,businessId:bid,authorizesBuild:true},
 {verified:true,eligible:true,remaining:2,businessId:bid}
]){
 const x=recommendOwnerBusinessApp({businessId:bid,website,
 businessType:"florist",entitlement:row});
 eq(x.entitlementVerified,false);
}
for(const input of [
 {businessId:bid,website,app:{id:"exists"},businessType:"florist"},
 {businessId:bid,website,dismissed:true,businessType:"florist"},
 {businessId:"other",website,businessType:"florist"},
 {businessId:bid,website:{...website,generation:0},businessType:"florist"},
 {businessId:bid,website:{...website,sections:[]},businessType:""},
 {businessId:bid,website:null,businessType:"florist"}
])eq(recommendOwnerBusinessApp(input).show,false);
const controller=read("src/app/AppController.js");
const server=read("supabase/functions/busy-mini-apps/index.ts");
const appUi=read("src/screens/miniApps.js");
const firstUi=read("src/screens/firstAppFromWebsite.js");
const home=read("src/screens/home.js");
for(const token of [
 'const createPrivateAppFromWebsite=async evidence=>',
 'confirmFirstAppFromWebsite({',
 'firstAppFromWebsiteInFlightRef.current=true',
 'expectedNoExistingApp:true',
 'miniAppsRequest("build_draft"',
 'applyMiniAppsStatus(built.status)',
 'miniAppsRequest("apply_coordinated_edits"',
 'expectedRevision:createdApp.draft_revision,ownerApproved:true',
 'appearanceApplied:false',
 'createPrivateAppFromWebsite,'
])ok(controller.includes(token),"Missing trusted first-app integration: "+token);
ok(server.includes('if(body?.expectedNoExistingApp===true)'));
ok(server.includes('const existing=await appForBusiness(businessId)'));
ok(server.includes('if(existing)throw new Error('));
ok(firstUi.includes("Approve and create my PRIVATE app draft"));
ok(firstUi.includes("onCheckBenefit?.()"));
ok(firstUi.includes("confirmFirstAppFromWebsite({"));
ok(firstUi.includes("No website images, private contacts or customers are copied."));
ok(appUi.includes("<FirstAppFromWebsite website={s.websiteDraft}"));
ok(appUi.includes("onCreate={s.createPrivateAppFromWebsite}"));
ok(home.includes("recommendOwnerBusinessApp({"));
ok(home.includes('actionLabel:"Explore an app"'));
ok(home.includes('canIgnore:true'));
ok(!home.includes('id:"app-benefit",free:true'));
console.log("V3.197 "+assertions+
 " first-app, review freshness, industry adaptation, verified-benefit and non-spam contracts PASS.");
