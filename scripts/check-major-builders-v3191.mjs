import {websiteBuilderTestHarnessV3222} from "./lib/website-builder-test-harness-v3222.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {publicNativeMiniAppProjection}
 from "../supabase/functions/busy-mini-app-guest/publicNativeProjection.mjs";
import {verifiedPublicRuntime,validPublicRead}
 from "../standalone/template/nativeBusinessClient.js";
import {nativeContactAction,searchPublicNativeServices}
 from "../standalone/template/nativeCustomerActions.mjs";
import {editWebsiteDraftField}
 from "../supabase/functions/busy-website-worker/websiteStructuredEditing.mjs";
import {planWebsiteDesign}
 from "../supabase/functions/busy-website-worker/designPlanner.mjs";
import {designForWebsite,designCss}
 from "../supabase/functions/busy-website-worker/designSystem.mjs";
import {reviewWebsiteDesign}
 from "../supabase/functions/busy-website-worker/designReview.mjs";
import {applyWebsiteVisualEdit}
 from "../supabase/functions/busy-website-worker/designEdits.mjs";
import {canonicalWebsiteHandoffUrl} from "../src/core/websiteAppHandoffV3214.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const {buildWebsiteDraft,applyStructuredWebsiteEdit}=websiteBuilderTestHarnessV3222(["buildWebsiteDraft","applyStructuredWebsiteEdit"]);


const id=tail=>"00000000-0000-4000-8000-"+tail;
let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const ok=(a,msg)=>{assert.ok(a,msg);n++};
const appId=id("000000003191"),versionId=id("000000003192");
const app={id:appId,status:"live",current_live_version_id:versionId,public_slug:"florist-app"};
const version={id:versionId,config:{
 display:{name:"Florist Demo"},
 modules:["business_profile","gallery","services","contact","booking_request"]
  .map(key=>({key,enabled:true})),
 publicProfile:{businessName:"Florist Demo",contact:{
  phone:"+44 (0) 1234 567 890",email:"hello@florist.example",
  openingHours:"By appointment"},
  services:[{name:"Bouquets",description:"Seasonal flowers"},
   {name:"Arrangements",description:"Flowers for events"}],
  assets:{gallery:[
   {approved:true,uri:"https://media.example/roses.jpg",
    alt:"Red roses in a glass vase",caption:"Fresh roses"},
   {approved:true,uri:"https://media.example/orchid.jpg",
    alt:"",caption:""},
   {approved:false,uri:"https://media.example/private.jpg",
    alt:"Private owner notes"},
   {approved:true,uri:"https://media.example/wrong.jpg",
    alt:"<img src=x>",caption:"Untrusted"}
  ]},privateOwnerRecord:"SECRET_DO_NOT_EXPOSE"}
}};
const scoped={expectedAppId:appId,expectedVersionId:versionId};
const pub=publicNativeMiniAppProjection(app,version,scoped);
ok(pub.ok);
eq(pub.gallery.length,3);
eq(pub.gallery[0].alt,"Red roses in a glass vase");
eq(pub.gallery[0].caption,"Fresh roses");
eq(pub.gallery[1].caption,"");
eq(pub.gallery[2].alt,"");
ok(!JSON.stringify(pub).includes("SECRET_DO_NOT_EXPOSE"));
ok(!JSON.stringify(pub).includes("private.jpg"));
ok(!JSON.stringify(pub).includes("<img"));
const runtime={enabled:true,ownerApproved:true,liveOnly:true,canCollectPayments:false,
 slug:"florist-app",expectedAppId:appId,expectedVersionId:versionId,
 endpoint:"https://sample-project.supabase.co/functions/v1/busy-mini-app-guest",
 publicWebEndpoint:"https://sample-project.supabase.co/functions/v1/busy-mini-app-link"};
ok(verifiedPublicRuntime(runtime));
ok(validPublicRead(pub,runtime));
eq(validPublicRead({...pub,gallery:[{uri:"javascript:alert(1)",alt:"",caption:""}]},runtime),false);
eq(validPublicRead({...pub,gallery:[{uri:"https://someone@media.example/one.jpg",alt:"",caption:""}]},runtime),false);
eq(validPublicRead({...pub,gallery:[{uri:"https://media.example/a.jpg",alt:"<script>",caption:""}]},runtime),false);
eq(validPublicRead({...pub,gallery:[{uri:"https://media.example/a.jpg",alt:"",caption:"x".repeat(241)}]},runtime),false);
eq(validPublicRead({...pub,versionId:id("000000003193")},runtime),false);
eq(validPublicRead({...pub,gallery:Array(16).fill(pub.gallery[0])},runtime),false);
eq(nativeContactAction(pub.contact,"phone").url,"tel:+4401234567890");
eq(nativeContactAction(pub.contact,"email").url,"mailto:hello@florist.example");
eq(nativeContactAction({phone:"01234\n567890"},"phone").ok,false);
eq(nativeContactAction({phone:"555;909090"},"phone").ok,false);
eq(nativeContactAction({email:"bad@example.test?subject=spam"},"email").ok,false);
eq(nativeContactAction({email:"javascript:alert(1)"},"email").ok,false);
eq(nativeContactAction(pub.contact,"payments").ok,false);
eq(searchPublicNativeServices(pub.services,"bouq").length,1);
eq(searchPublicNativeServices(pub.services,"EVENTS")[0].name,"Arrangements");
eq(searchPublicNativeServices(pub.services,"unused").length,0);
eq(searchPublicNativeServices(pub.services,"x".repeat(81)).length,0);
ok(read("scripts/prepare-standalone-prototype-v3154.mjs")
 .includes('"nativeCustomerActions.mjs"'),"Native helper must be copied into unsigned standalone app exports.");
const native=read("standalone/template/App.js");
for(const marker of ['onPress={()=>onOpenContact?.(key)}',
 'Linking.openURL(action.url)','setRefreshSequence(x=>x+1)',
 'setLoading(true);setError("");setLive(null)',
 'searchPublicNativeServices(app.services||[],query)',
 'photo.caption?<Text',
 'accessibilityLabel={String(photo.alt||photo.caption||"Business photo "+(i+1))}'])
 ok(native.includes(marker),"Native UI wiring missing: "+marker);
ok(!native.includes("Automatically confirm your booking"));
const marketplace=read("src/screens/miniApps.js");
ok(marketplace.includes("{String(asset.caption).slice(0,240)}"),
 "Marketplace Business App must show approved gallery captions too.");
ok(marketplace.includes('accessibilityLabel={String(asset.alt||asset.caption||'),
 "Marketplace Business App must preserve owner-authored accessibility text.");


const seed={brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Florist Demo",businessType:"Florist",
 description:"Seasonal flowers for local customers."}}};
const first=buildWebsiteDraft(seed);
const initial=JSON.stringify(first);
ok(!first.sections.some(s=>s.id==="faq"));
ok(!first.sections.some(s=>s.id==="services"));
const createFaq={action:"create-collection",sectionId:"faq",
 title:"How do deliveries work?",body:"Contact us for availability."};
const addedFaq=applyStructuredWebsiteEdit(first,createFaq);
ok(addedFaq.applied);ok(addedFaq.draft.html.includes("How do deliveries work?"));
ok(addedFaq.draft.pages.some(p=>p.id==="faq")||
 addedFaq.draft.pages.some(p=>p.id==="home"&&p.sectionIds.includes("faq")));
const faqId=addedFaq.draft.sections.find(s=>s.id==="faq").items[0].id;
const createService={action:"create-collection",sectionId:"services",
 title:"Seasonal bouquets",body:"Owner-written description"};
const addedService=applyStructuredWebsiteEdit(addedFaq.draft,createService);
ok(addedService.applied);ok(addedService.draft.html.includes("Seasonal bouquets"));
ok(addedService.draft.pages.some(p=>p.id==="services")||
 addedService.draft.pages.some(p=>p.id==="home"&&p.sectionIds.includes("services")));
const secondItem=applyStructuredWebsiteEdit(addedService.draft,{action:"add-item",
 sectionId:"services",title:"Wedding flowers",body:"Flowers for your wedding"});
ok(secondItem.applied);
const serviceId=secondItem.draft.sections.find(s=>s.id==="services").items[1].id;
const move={action:"move-item",sectionId:"services",
 itemId:serviceId,expectedTitle:"Wedding flowers",direction:"up"};
const reordered=applyStructuredWebsiteEdit(secondItem.draft,move);
ok(reordered.applied);
eq(reordered.draft.sections.find(s=>s.id==="services").items.map(i=>i.title),
 ["Wedding flowers","Seasonal bouquets"]);
eq(applyStructuredWebsiteEdit(secondItem.draft,{...move,expectedTitle:"Stale name"}).applied,false);
eq(applyStructuredWebsiteEdit(reordered.draft,move).applied,false);
eq(applyStructuredWebsiteEdit(reordered.draft,{...move,direction:"sideways"}).applied,false);
eq(applyStructuredWebsiteEdit(reordered.draft,{...move,apiToken:"steal"}).applied,false);
eq(applyStructuredWebsiteEdit(reordered.draft,createService).applied,false);
eq(applyStructuredWebsiteEdit(first,{...createService,title:"<script>"}).applied,false);
eq(applyStructuredWebsiteEdit(first,{...createService,body:""}).applied,false);
const textEdit=applyStructuredWebsiteEdit(reordered.draft,{sectionId:"faq",itemId:faqId,
 field:"body",value:"We will confirm an available delivery time."});
ok(textEdit.applied);
eq(textEdit.draft.sections.find(s=>s.id==="faq").ownerEditedItems,true);
const refreshed=buildWebsiteDraft({brandBrain:{websiteReady:true,websiteBrief:{
 businessName:"Florist Demo",services:[{id:"overwrite",name:"Overwritten service",
  description:"Business Brain refreshed this"}],
 faqs:[{id:"bad",question:"New draft FAQ",answer:"Unused"}]}},
 previousDraft:textEdit.draft});
eq(refreshed.sections.find(s=>s.id==="faq").items[0].body,
 "We will confirm an available delivery time.");
eq(refreshed.sections.find(s=>s.id==="services").items.map(i=>i.title),
 ["Wedding flowers","Seasonal bouquets"]);
eq(JSON.stringify(first),initial);
eq(textEdit.draft.publicStatus,"Not published");
const screen=read("src/screens/websiteContentEditor.js");
for(const marker of ['action:"create-collection"','action:"move-item"',
 'action:"remove-item"','expectedTitle:item.title','setConfirmRemoval(null)'])
 ok(screen.includes(marker),"Website owner editor integration: "+marker);
console.log("V3.191 "+n+" builder feature, immutable projection, native action and owner-website preservation checks PASS.");
