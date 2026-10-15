import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {publicNativeMiniAppProjection}
 from "../supabase/functions/busy-mini-app-guest/publicNativeProjection.mjs";
import {publicNativeOffers,publicNativeLoyalty}
 from "../supabase/functions/busy-mini-app-guest/publicNativeExtrasV3190.mjs";
import {verifiedPublicRuntime,validPublicRead}
 from "../standalone/template/nativeBusinessClient.js";
import {editWebsiteDraftField}
 from "../supabase/functions/busy-website-worker/websiteStructuredEditing.mjs";
import {applyWebsiteVisualEdit}
 from "../supabase/functions/busy-website-worker/designEdits.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const id=n=>"00000000-0000-4000-8000-"+n;
let assertions=0;
const eq=(a,b)=>{assert.deepEqual(a,b);assertions++};
const yes=x=>{assert.ok(x);assertions++};
const aId=id("000000003190"),vId=id("000000003191");
const app={id:aId,status:"live",current_live_version_id:vId,public_slug:"flower-shop"};
const today=new Date().toISOString().slice(0,10);
const offer={approved:true,title:"Autumn delivery",body:"Ask about availability",
 terms:"Subject to business confirmation",startDate:"",endDate:"",
 internalCode:"SECRET_CLIENT_COUPON"};
const config={modules:["business_profile","services","offers","loyalty"].map(key=>({key,enabled:true})),
 display:{name:"Flower Shop"},publicProfile:{businessName:"Flower Shop"},
 offers:[offer,{...offer,approved:false,title:"Hidden unpublished"}],
 loyalty:{programName:"Visit rewards",reward:"A seasonal gift",
   terms:"Owner confirms eligible visits",targetStamps:5,
   customerBalances:[{email:"PRIVATE_MEMBER"}]}};
const version={id:vId,config};
const projected=publicNativeMiniAppProjection(app,version,{
 expectedAppId:aId,expectedVersionId:vId});
yes(projected.ok);
eq(projected.offers.length,1);eq(projected.offers[0].title,"Autumn delivery");
eq(projected.loyalty.targetStamps,5);eq(projected.loyalty.redemptionEnabled,false);
eq(projected.loyalty.personalBalanceAvailable,false);
yes(projected.moduleKeys.includes("offers"));
yes(projected.moduleKeys.includes("loyalty"));
for(const term of ["SECRET_CLIENT_COUPON","PRIVATE_MEMBER","Hidden unpublished"]){
 yes(!JSON.stringify(projected).includes(term));
}
const pubDisabled=publicNativeMiniAppProjection(app,
 {...version,config:{...config,modules:[{key:"business_profile",enabled:true}]}},
 {expectedAppId:aId,expectedVersionId:vId});
eq(pubDisabled.offers.length,0);eq(pubDisabled.loyalty,null);
eq(pubDisabled.moduleKeys.includes("offers"),false);
eq(publicNativeMiniAppProjection({...app,status:"draft"},version,{
 expectedAppId:aId,expectedVersionId:vId}).ok,false);
eq(publicNativeMiniAppProjection(app,{...version,id:id("000000003192")},{
 expectedAppId:aId,expectedVersionId:vId}).ok,false);
eq(publicNativeOffers({...config,offers:[{...offer,startDate:"9999-01-01"}]},
 {today}).length,0);
eq(publicNativeOffers({...config,offers:[{...offer,endDate:"2000-01-01"}]},
 {today}).length,0);
eq(publicNativeOffers({...config,offers:[{...offer,terms:""}]},
 {today}).length,0);
eq(publicNativeOffers({...config,offers:[{...offer,title:"<script>"}]},
 {today}).length,0);
eq(publicNativeOffers({...config,offers:[{...offer,startDate:"2026-02-30"}]},
 {today}).length,0);
eq(publicNativeLoyalty({...config,loyalty:{...config.loyalty,targetStamps:0}}),null);
eq(publicNativeLoyalty({...config,loyalty:{...config.loyalty,terms:""}}),null);
const runtime={enabled:true,ownerApproved:true,liveOnly:true,canCollectPayments:false,
 slug:"flower-shop",expectedAppId:aId,expectedVersionId:vId,
 endpoint:"https://staging-project.supabase.co/functions/v1/busy-mini-app-guest",
 publicWebEndpoint:"https://staging-project.supabase.co/functions/v1/busy-mini-app-link"};
yes(verifiedPublicRuntime(runtime));yes(validPublicRead(projected,runtime));
eq(validPublicRead({...projected,offers:[{...projected.offers[0],title:"<script>"}]},runtime),false);
eq(validPublicRead({...projected,loyalty:{...projected.loyalty,redemptionEnabled:true}},runtime),false);
eq(validPublicRead({...projected,moduleKeys:["business_profile"],offers:projected.offers},runtime),false);
const native=read("standalone/template/App.js");
yes(native.includes('screen.key==="offers"'));
yes(native.includes('screen.key==="loyalty"'));
yes(native.includes("This app does not award stamps or redeem rewards automatically."));
yes(native.includes('initialService={chosen.key==="booking_request"&&requestedIntent==="booking_request"?'));
yes(native.includes('service:initialService'));
yes(native.includes('setCurrent(intent)'));
yes(native.includes('onRequestService?.(service.name,"booking_request")'));
yes(native.includes('app.supportsBookingRequest&&app.moduleKeys?.includes("booking_request")'));
yes(!native.includes("submitAutomatically"));

const draft={id:"private-website",sections:[
 {id:"services",type:"services",enabled:true,items:[
   {id:"roses",title:"Rose arrangements",body:"Delivered locally"}]},
 {id:"faq",type:"faq",enabled:true,items:[
   {id:"delivery",title:"Do you deliver?",body:"Ask the shop"}]}
]};
const add={kind:"structured",action:"add-item",sectionId:"faq",
 title:"How soon can you deliver?",body:"Please contact us for availability."};
const result=applyWebsiteVisualEdit(draft,add);
yes(result.applied);eq(result.draft.sections[1].items.length,2);
eq(draft.sections[1].items.length,1);
yes(result.draft.sections[1].items[1].id.startsWith("owner-how-soon"));
const service=editWebsiteDraftField(draft,{action:"add-item",sectionId:"services",
 title:"Seasonal flowers",body:"Owner-supplied choice"});
yes(service.applied);eq(service.draft.sections[0].items.length,2);
eq(editWebsiteDraftField(draft,{...add,title:"Do you deliver?"}).applied,false);
eq(editWebsiteDraftField(draft,{...add,title:"Unsafe <script>"}).applied,false);
eq(editWebsiteDraftField(draft,{...add,apiKey:"unsafe"}).applied,false);
eq(editWebsiteDraftField(draft,{...add,sectionId:"gallery"}).applied,false);
const added=result.draft.sections[1].items[1];
const remove={action:"remove-item",sectionId:"faq",itemId:added.id,
 expectedTitle:added.title};
eq(editWebsiteDraftField(result.draft,{...remove,expectedTitle:"stale"}).applied,false);
const gone=editWebsiteDraftField(result.draft,remove);
yes(gone.applied);eq(gone.draft.sections[1].items.length,1);
eq(result.draft.sections[1].items.length,2);
eq(editWebsiteDraftField(result.draft,{...remove,itemId:"unrelated"}).applied,false);
eq(editWebsiteDraftField(draft,{...remove,sectionId:"services"}).applied,false);
const websiteUi=read("src/screens/websiteContentEditor.js");
yes(websiteUi.includes('action:"add-item"'));
yes(websiteUi.includes('action:"remove-item"'));
yes(websiteUi.includes('expectedTitle:item.title'));
yes(websiteUi.includes("Add FAQ to private draft"));
const appController=read("src/app/AppController.js");
yes(appController.includes("setWebsiteUndo(items=>[...items,current].slice(-8))"));
yes(appController.includes("applyStructuredWebsiteEdit(websiteDraft, patch)"));
console.log("V3.190 "+assertions+
 " native public content, client schema, website editing and safe owner UI assertions PASS.");

assert.ok(appController.includes("checkPrivateWebsiteDraftCommit({current,candidate:nextDraft"));
