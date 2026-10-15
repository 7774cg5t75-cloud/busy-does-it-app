/**
 * V3.215 offline confidence suite. No live endpoints, customer data, provider
 * calls, publish jobs or paid credits. Exercise source pure contracts.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {canonicalWebsiteHandoffUrl,planWebsiteAppRequestHandoff}
 from "../src/core/websiteAppHandoffV3214.mjs";
import {applyWebsiteLayoutOperation}
 from "../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";
import {verifyPublishedWebsiteIntent}
 from "../supabase/functions/busy-mini-app-link/websiteRequestLinkGuardV3215.mjs";
import {websiteEnquiryReadinessV3215}
 from "../src/core/websiteEnquiryReadinessV3215.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let count=0;
const ok=(v,m)=>{assert.ok(v,m);count++;};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++;};
const BID="11111111-1111-4111-8111-111111111111";
const APP="22222222-2222-4222-8222-222222222222";
const VERSION="33333333-3333-4333-8333-333333333333";
const ENDPOINT="https://abcdefghijklmnopqrst.supabase.co/functions/v1/busy-mini-app-link";
const SLUG="example-business";
const website=()=>({id:"site",businessId:BID,generation:15,
 theme:{},sections:[
 {id:"hero",type:"hero",enabled:true,title:"Hello"},
 {id:"contact",type:"contact",enabled:true,email:"approved@example.test"},
 {id:"services",type:"services",enabled:true,items:[{title:"Pitch hire"}]}
]});
const app=()=>({id:APP,business_id:BID,public_slug:SLUG,status:"live",
 current_live_version_id:VERSION});
const version=()=>({id:VERSION,mini_app_id:APP,state:"live",
 config:{modules:[{key:"enquiry",enabled:true},{key:"booking_request",enabled:true}],
  publicProfile:{services:[{name:"Pitch hire"}]}}});
const catalog=()=>[
 {module_key:"enquiry",status:"available",capabilities:{customer_action:true}},
 {module_key:"booking_request",status:"available",
  capabilities:{confirmation_required_by_business:true}}];
const plan=kind=>planWebsiteAppRequestHandoff({
 businessId:BID,website:website(),app:app(),liveVersion:version(),
 endpoint:ENDPOINT,catalog:catalog(),kind
});
const bound=canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:SLUG,
 kind:"enquiry",appId:APP,liveVersionId:VERSION});
ok(bound.startsWith(ENDPOINT+"?slug="+SLUG));
ok(bound.includes("&source=web&intent=enquiry&appId="+APP+"&versionId="+VERSION));
ok(!bound.includes("redirect="));
eq(canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:SLUG,
 kind:"enquiry",appId:APP}),"","Refuse a half-bound link.");
eq(canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:SLUG,
 kind:"enquiry",liveVersionId:VERSION}),"","Refuse a version without app ID.");
eq(canonicalWebsiteHandoffUrl({endpoint:ENDPOINT,slug:SLUG,
 kind:"enquiry",appId:"bogus",liveVersionId:VERSION}),"");
for(const intent of ["enquiry","booking_request"]){
 const prepared=plan(intent);
 ok(prepared.ok,prepared.reason);
 eq(prepared.exactPublishedAppPinnedInLink,true);
 eq(prepared.requiresReapprovalOnAppRepublish,true);
 eq(prepared.url,canonicalWebsiteHandoffUrl({
  endpoint:ENDPOINT,slug:SLUG,kind:intent,appId:APP,liveVersionId:VERSION}));
 const edge=verifyPublishedWebsiteIntent({url:prepared.url,app:app(),version:version()});
 ok(edge.ok,edge.reason);
 eq(edge.kind,intent);
 eq(edge.versionId,VERSION);
 eq(edge.appId,APP);
 eq(edge.recordEntryAllowed,true);
 eq(edge.submitAllowed,false);
 eq(edge.customerRequestCreated,false);
 eq(edge.bookingConfirmed,false);
 eq(edge.receiptVerified,false);
 eq(edge.needsBrowserChallenge,true);
 const operation={action:"connect-app-request",websiteId:"site",
  expectedGeneration:15,expectedBusinessId:BID,intent,
  appId:APP,liveVersionId:VERSION,slug:SLUG,url:prepared.url};
 const edited=applyWebsiteLayoutOperation(website(),operation);
 ok(edited.applied,edited.reason);
 eq(edited.draft.theme.appRequestLinks[intent].url,prepared.url);
 const previous=website();
 eq(previous.theme.appRequestLinks,undefined);
 const bad=[
  {url:prepared.url.replace("appId="+APP,"appId="+BID)},
  {url:prepared.url.replace("versionId="+VERSION,"versionId="+BID)},
  {url:prepared.url+"&next=https://evil.test"},
  {url:prepared.url.replace("&source=web","&source=qr")},
  {url:prepared.url.replace("&intent="+intent,"&intent=enquiry&intent="+intent)},
  {url:prepared.url.replace("https://","http://")},
  {url:prepared.url.replace("abcdefghijklmnopqrst.supabase.co",
   "abcdefghijklmnopqrst.supabase.co.evil.test")},
  {appId:BID},{liveVersionId:BID},{slug:"different"},
  {expectedGeneration:14},{expectedBusinessId:BID.replace("1","2")},
  {customerPayload:{email:"example.test"}}
 ];
 for(const o of bad)eq(applyWebsiteLayoutOperation(website(),{
  ...operation,...o}).applied,false,
  "Never accept a changed owner-approved website handoff.");
}
const liveApp=app(),liveVersion=version();
const reject=(url,appOverride=liveApp,versionOverride=liveVersion)=>verifyPublishedWebsiteIntent({
 url,app:appOverride,version:versionOverride
});
for(const url of [
 bound.replace("&appId="+APP,""),
 bound.replace("&versionId="+VERSION,""),
 bound.replace(APP,BID),bound.replace(VERSION,BID),
 bound+"&redirect=https://evil.test",
 bound+"&appId="+APP,
 bound.replace("source=web","source=qr"),
 bound.replace("intent=enquiry","intent=checkout"),
 bound.replace("slug="+SLUG,"slug=other"),
 bound.replace("&appId="+APP+"&versionId="+VERSION,
  "&versionId="+VERSION+"&appId="+APP),
 bound.replace("appId="+APP,"appId=not-a-uuid")
]){
 const x=reject(url);
 eq(x.ok,false,"Stale or manipulated website links are denied by public server.");
 eq(x.recordEntryAllowed,false);
 eq(x.customerRequestCreated,false);
}
for(const [label,newApp,newVersion] of [
 ["slug recycled",{...liveApp,id:BID},liveVersion],
 ["other business app",{...liveApp,id:BID},liveVersion],
 ["app unpublished",{...liveApp,status:"draft"},liveVersion],
 ["app disabled",{...liveApp,status:"disabled"},liveVersion],
 ["live version changed",{...liveApp,current_live_version_id:BID},liveVersion],
 ["version of another app",liveApp,{...liveVersion,mini_app_id:BID}],
 ["app version not live",liveApp,{...liveVersion,state:"preview_ready"}],
 ["app no enquiry",liveApp,{...liveVersion,config:{...liveVersion.config,
 modules:[{key:"enquiry",enabled:false}]}}],
 ["missing config",liveApp,{...liveVersion,config:null}],
 ["missing version",liveApp,null]
]){
 const result=reject(bound,newApp,newVersion);
 eq(result.ok,false,label);
 eq(result.submitAllowed,false);
}
const bookingUrl=plan("booking_request").url;
for(const badVersion of [
 {...liveVersion,config:{...liveVersion.config,publicProfile:{services:[]}}},
 {...liveVersion,config:{...liveVersion.config,modules:[{key:"booking_request",enabled:false}]}}
]){
 const x=reject(bookingUrl,liveApp,badVersion);
 eq(x.ok,false);
 eq(x.bookingConfirmed,false);
}
const ready=websiteEnquiryReadinessV3215({businessId:BID,website:website(),
 app:app(),liveVersion:version(),catalog:catalog(),endpoint:ENDPOINT});
eq(ready.ok,true);
eq(ready.existingBusinessAppHandoffSupported,true);
eq(ready.nativeWebsiteFormImplemented,false);
eq(ready.canAcceptCustomerData,false);
eq(ready.websiteSubmissionEndpointActive,false);
eq(ready.customerRequestCreated,false);
eq(ready.noNetworkRequest,true);
ok(ready.missing.includes("verified_site_origin"));
ok(ready.missing.includes("abuse_and_browser_challenge"));
ok(ready.missing.includes("customer_consent"));
ok(ready.missing.includes("idempotent_saved_receipt"));
ok(ready.missing.includes("owner_delivery"));
ok(ready.missing.includes("staging"));
eq(ready.currentWebsiteLiveVersionVerified,false);
ok(!JSON.stringify(ready).includes("approved@example.test"),"No customer/business contact leakage.");
const staleWebsite=website();staleWebsite.businessId=BID.replace("1","2");
eq(websiteEnquiryReadinessV3215({businessId:BID,website:staleWebsite,
 app:app(),liveVersion:version(),catalog:catalog(),endpoint:ENDPOINT}).ok,false);
const proof=websiteEnquiryReadinessV3215({businessId:BID,website:website(),
 app:app(),liveVersion:version(),catalog:catalog(),endpoint:ENDPOINT,
 publishing:{draftChangedSinceHosted:false,
  liveDeployment:{id:"dep"},
  website:{current_live_deployment_id:"dep"}},
 deliveryProof:{verified:true}
});
eq(proof.currentWebsiteLiveVersionVerified,false,"A caller boolean and deployment ID alone are not live delivery evidence.");
eq(proof.nativeWebsiteFormImplemented,false);
eq(proof.liveWebsiteContainsApprovedHandoffVerified,false);
const changed=websiteEnquiryReadinessV3215({businessId:BID,website:website(),
 app:app(),liveVersion:version(),catalog:catalog(),endpoint:ENDPOINT,
 publishing:{draftChangedSinceHosted:true,
  liveDeployment:{id:"dep"},website:{current_live_deployment_id:"dep"}},
 deliveryProof:{verified:true}
});
eq(changed.currentWebsiteLiveVersionVerified,false);
const edge=read("supabase/functions/busy-mini-app-link/index.ts");
const renderer=read("src/domain/websiteBuilder.js");
const edit=read("supabase/functions/busy-website-worker/websiteLayoutEditing.mjs");
const ownerUi=read("src/screens/websiteAppHandoffReview.js");
const websiteUi=read("src/screens/websiteBuilder.js");
const continuity=read("src/core/sharedRequestJourneyV3212.mjs");
for(const marker of [
 'import {verifyPublishedWebsiteIntent} from "./websiteRequestLinkGuardV3215.mjs";',
 'url:req.url,app:app.data,version:version.data',
 'if(!bound.ok)return page(409',
 'if(source==="web")',
 '.eq("state", "live")'
])ok(edge.includes(marker),"Public server must gate exact immutable live request: "+marker);
ok(renderer.includes("appId:link.appId,liveVersionId:link.liveVersionId"));
ok(edit.includes('"&appId="+encodeURIComponent(operation.appId)'));
ok(edit.includes('"&versionId="+encodeURIComponent(operation.liveVersionId)'));
ok(continuity.includes("appId:savedLink.appId,liveVersionId:savedLink.liveVersionId"));
ok(ownerUi.includes("websiteEnquiryReadinessV3215({"));
ok(ownerUi.includes("The stored link no longer matches"));
ok(websiteUi.includes("publishing={s.websitePublishingView}"));
ok(websiteUi.includes("deliveryProof={deliveryProof}"));
ok(!renderer.includes("<form action="),"No fictional website-native form.");
ok(read("supabase/functions/busy-mini-app-guest/index.ts")
 .includes("busy_mini_app_create_guest_request"),
 "Real guest intake still uses its server-side transactional procedure.");
const css=read("supabase/functions/busy-website-worker/designSystem.mjs");
ok(css.includes(".busy-app-request-link{display:inline-flex;"),
 "Published website link must be a real touch-sized action.");
ok(css.includes(".busy-app-request-link:focus-visible"),
 "Keyboard users must see a focus indication.");
ok(css.includes("min-height:48px"),"Handoff actions must have a sufficient touch target.");
ok(css.includes("@media(max-width:380px){.busy-app-request-link{width:100%}}"),
 "Long action labels should fit narrow phones.");
console.log("V3.215 "+count+" assertions PASS: exact immutable app/version-bound web links, server fail-closed route, stale owner links, native intake readiness and no fabricated website forms.");
