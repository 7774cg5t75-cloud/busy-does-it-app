import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validPrivateBuilderPair,reviewedPairIsCurrent}
 from "../src/core/ownerBuilderDraftGuardV3195.mjs";
import {buildBusinessBrandDnaSnapshot,planBrandDnaContentBrief,CHANNELS}
 from "../src/core/businessBrandDnaV3195.mjs";
import {planMatchAppBrandToWebsite,confirmMatchAppBrandToWebsite}
 from "../src/core/ownerBuilderBrandBridgeV3193.mjs";
import {planMatchAppTypeToWebsite,confirmMatchAppTypeToWebsite}
 from "../src/core/ownerBuilderTypographyBridgeV3194.mjs";
import {planCopyMissingAppServices,confirmCopyMissingAppServices}
 from "../src/core/ownerBuilderServiceBridgeV3192.mjs";
import {applyWebsiteLayoutOperation}
 from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let tests=0;
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);tests++};
const ok=(x,message="Expected true")=>{assert.ok(x,message);tests++};
const id=tail=>"00000000-0000-4000-8000-"+tail;
const businessId=id("000000003195");
const website={id:"private-website-v3195",generation:12,
 businessName:"Example Florist",theme:{primary:"#336688",typography:"friendly"},
 sections:[{id:"hero",type:"hero",title:"Flowers",body:"Carefully arranged flowers."},
 {id:"about",type:"about",body:"Local florists in Devon."},
 {id:"services",type:"services",enabled:true,items:[
  {id:"owner-1",title:"Bouquets",body:"Website owner wording"}]}]};
const app={id:id("000000003196"),business_id:businessId,draft_revision:7,
 draft_config:{
  display:{name:"Example Florist",tagline:"Flowers for special days"},
  presentation:{brandPalette:"forest",typeStyle:"editorial",serviceStyle:"rows"},
  modules:[{key:"business_profile",enabled:true},{key:"services",enabled:true}],
  publicProfile:{
   businessName:"Example Florist",tagline:"Fresh flowers made for you",
   about:"Independent Devon flower studio",
   privateOwnerRecord:"DO_NOT_LEAK_INTERNAL_OWNER_RECORD",
   contact:{privateEmail:"secret-owner@example.test",phone:"+4412345678"},
   services:[
    {name:"Bouquets",description:"Seasonal blooms"},
    {name:"Wedding flowers",description:"Arrangements for celebrations"}],
   assets:{gallery:[
    {approved:true,uri:"https://example.invalid/approved.jpg",alt:"White wedding roses",caption:"Wedding flowers"},
    {approved:false,uri:"https://example.invalid/PRIVATE.jpg",alt:"DO_NOT_EXPOSE"},
    {approved:true,uri:"javascript:alert(1)",alt:"Unsafe"},
    {uri:"https://example.invalid/unapproved.jpg",caption:"Unapproved"},
    {approved:true,uri:"https://attacker@example.invalid/img.jpg",alt:"Credentials"},
    {approved:true,uri:"https://example.invalid/a.jpg",alt:"<script>"},
    {approved:true,uri:"https://example.invalid/good.jpg",alt:"Garden arrangement"}
   ],logo:{approved:false,uri:"https://example.invalid/private-logo.jpg"}}
  }
 }};
const websiteBefore=JSON.stringify(website);
const appBefore=JSON.stringify(app);
ok(validPrivateBuilderPair(website,app,businessId));
for(const invalid of [
 [null,app,businessId],[website,null,businessId],
 [{...website,id:""},app,businessId],
 [{...website,generation:0},app,businessId],
 [{...website,generation:1.5},app,businessId],
 [{...website,sections:"oops"},app,businessId],
 [website,{...app,id:""},businessId],
 [website,{...app,business_id:"other-tenant"},businessId],
 [website,{...app,draft_revision:0},businessId],
 [website,{...app,draft_revision:"7"},businessId],
 [website,{...app,draft_config:{modules:"no"}},businessId],
 [website,app,""],[website,app,{}]
 ])eq(validPrivateBuilderPair(...invalid),false);
const evidence={businessId,appId:app.id,appRevision:app.draft_revision,
 websiteId:website.id,websiteGeneration:website.generation};
ok(reviewedPairIsCurrent(website,app,businessId,evidence));
eq(reviewedPairIsCurrent(website,app,businessId,{...evidence,appRevision:8}),false);
eq(reviewedPairIsCurrent(website,app,businessId,{...evidence,websiteGeneration:11}),false);
eq(reviewedPairIsCurrent(website,app,businessId,{...evidence,appId:"elsewhere"}),false);
eq(reviewedPairIsCurrent(website,app,"other",evidence),false);
const copy=planCopyMissingAppServices(website,app,{businessId});
ok(copy.ok,copy.reason);eq(copy.addedCount,1);
ok(confirmCopyMissingAppServices(website,app,{businessId,evidence:copy}).ok);
eq(confirmCopyMissingAppServices({...website,generation:13},app,
 {businessId,evidence:copy}).ok,false);
eq(confirmCopyMissingAppServices(website,{...app,business_id:"other"},
 {businessId,evidence:copy}).ok,false);
const colour=planMatchAppBrandToWebsite(website,app,{businessId});
ok(colour.ok,colour.reason);
ok(confirmMatchAppBrandToWebsite(website,app,{businessId,evidence:colour}).ok);
eq(confirmMatchAppBrandToWebsite(website,{...app,draft_revision:8},
 {businessId,evidence:colour}).ok,false);
const fonts=planMatchAppTypeToWebsite(website,app,{businessId});
ok(fonts.ok,fonts.reason);
ok(confirmMatchAppTypeToWebsite(website,app,{businessId,evidence:fonts}).ok);
eq(confirmMatchAppTypeToWebsite({...website,generation:13},app,
 {businessId,evidence:fonts}).ok,false);

// Private read-only snapshot across existing app + website.
// No auto-acceptance of unapproved imagery or private customer/contact data.
const dna=buildBusinessBrandDnaSnapshot({website,app,businessId});
ok(dna.ok,dna.reason);
eq(dna.schema,"private_brand_dna_draft_v1");
eq(dna.businessId,businessId);
eq(dna.identity.name,"Example Florist");
eq(dna.identity.tagline,"Fresh flowers made for you");
eq(dna.design.palette,"forest");
eq(dna.design.appTypography,"editorial");
eq(dna.design.websiteTypography,"friendly");
eq(dna.design.serviceLayout,"rows");
eq(dna.design.websiteColour,"#336688");
eq(dna.voice.ownerChosenTone,null);
eq(dna.voice.status,"not-yet-specified");
eq(dna.assets.logoUrl,"");
eq(dna.assets.photos.length,3);
eq(dna.assets.photos[0].alt,"White wedding roses");
eq(dna.services.length,2);
eq(dna.conflicts.length,4);
ok(dna.conflicts.some(x=>x.includes('shared service description(s) differ')));
ok(dna.conflicts.some(x=>x.includes('Service coverage differs:')));
eq(dna.privateOnly,true);eq(dna.requiresOwnerReview,true);
eq(dna.autoPublishes,false);eq(dna.savesBrandMemory,false);
const serialized=JSON.stringify(dna);
for(const privateValue of ["DO_NOT_LEAK","secret-owner","PRIVATE.jpg",
 "private-logo","unapproved.jpg","javascript:","attacker@","<script>"])
 ok(!serialized.includes(privateValue),"Sensitive or unsafe text leaked: "+privateValue);
eq(JSON.stringify(website),websiteBefore);
eq(JSON.stringify(app),appBefore);
for(const channel of CHANNELS){
 const brief=planBrandDnaContentBrief(dna,{channel,goal:"Prepare a new design."});
 ok(brief.ok,"Channel "+channel);
 eq(brief.channel,channel);
 eq(brief.businessId,businessId);
 eq(brief.source.websiteGeneration,12);
 eq(brief.source.appDraftRevision,7);
 eq(brief.previewOnly,true);eq(brief.autoPublishes,false);
 eq(brief.didNotGenerateContent,true);eq(brief.noProviderCalls,true);
 eq(brief.ownerMustApprove,true);
 eq(brief.services[1].name,"Wedding flowers");
 ok(!JSON.stringify(brief).includes("secret-owner"));
}
eq(planBrandDnaContentBrief(dna,{channel:"privateCustomerList"}).ok,false);
eq(planBrandDnaContentBrief(dna,{channel:"social",goal:"<script>"}).ok,false);
eq(planBrandDnaContentBrief(dna,{channel:"social",goal:"x".repeat(241)}).ok,false);
eq(planBrandDnaContentBrief({ok:true},{channel:"social"}).ok,false);
eq(buildBusinessBrandDnaSnapshot({website,app:{...app,business_id:"another"},businessId}).ok,false);
eq(buildBusinessBrandDnaSnapshot({website:{...website,generation:0},app,businessId}).ok,false);
const explicit={...app,draft_config:{...app.draft_config,
 publicProfile:{...app.draft_config.publicProfile,
 brandVoice:{tone:"professional"}}}};
const ownerTone=buildBusinessBrandDnaSnapshot({website,app:explicit,businessId});
eq(ownerTone.voice.ownerChosenTone,"professional");
eq(buildBusinessBrandDnaSnapshot({website,app:{...explicit,draft_config:{
 ...explicit.draft_config,publicProfile:{
 ...explicit.draft_config.publicProfile,brandVoice:{tone:"Invented and flamboyant"}}}},businessId}).voice.ownerChosenTone,null);
const malicious={...app,draft_config:{...app.draft_config,
 publicProfile:{...app.draft_config.publicProfile,
 businessName:"<script>alert(1)</script>",
 services:[{name:"<img>",description:"Unsafe"},
 {name:"Flowers",description:"<svg onload=evil()>"}]}}};
const bad=buildBusinessBrandDnaSnapshot({website,app:malicious,businessId});
ok(bad.ok);
eq(bad.identity.name,"Example Florist"); // falls back to approved draft display
eq(bad.services.length,1);
eq(bad.services[0].description,"");
// Both builders show one shared component, with NO hidden publish/AI action.
const ui=read("src/screens/businessBrandDnaPreview.js");
ok(ui.includes("buildBusinessBrandDnaSnapshot({website,app,businessId})"));
ok(ui.includes("planBrandDnaContentBrief(dna,{channel,"));
ok(ui.includes("onPress={()=>setChannel(key)}"));
// V3.198 can now prepare a PRIVATE text draft; no publication remains guaranteed.
ok(ui.includes("Nothing has been published."));
ok(read("src/screens/websiteBuilder.js").includes("<BusinessBrandDnaPreview website={draft}"));
ok(read("src/screens/miniApps.js").includes("<BusinessBrandDnaPreview website={s.websiteDraft}"));
// Architectural consolidation must stay wired in the reviewed actions.
for(const path of [
 "src/core/ownerBuilderBrandBridgeV3193.mjs",
 "src/core/ownerBuilderTypographyBridgeV3194.mjs",
 "src/core/ownerBuilderServiceBridgeV3192.mjs"
 ]){
 const text=read(path);
 ok(text.includes("validPrivateBuilderPair("),path+" missing shared guard");
 ok(text.includes("reviewedPairIsCurrent("),path+" missing approval guard");
}
const ctrl=read("src/app/AppController.js");
ok(ctrl.includes("const commitReviewedBuilderDraft="));
eq((ctrl.match(/commitReviewedBuilderDraft\(current,/g)||[]).length,6);
ok(ctrl.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"));
ok(ctrl.includes("confirmMatchAppBrandToWebsite(current,app,{businessId,evidence})"));
ok(ctrl.includes("confirmMatchAppTypeToWebsite(current,app,{businessId,evidence})"));
ok(ctrl.includes("confirmCopyMissingAppServices(current,app,{businessId,evidence})"));
// Rendering boundaries: both site design tokens are private operations.
const privateColour=applyWebsiteLayoutOperation(website,{action:"brand-colour",value:"#336699"});
ok(privateColour.applied);
eq(privateColour.draft.theme.primary,"#336699");
console.log("V3.195 "+tests+
 " same-tenant, private Brand DNA, channel planning and architecture/refactor regressions PASS.");
