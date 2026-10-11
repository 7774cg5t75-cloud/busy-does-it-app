import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {sha256Ascii,solveGuestChallenge} from "../standalone/template/nativeGuestProof.js";
import {validateNativeGuestRequest,sendNativeGuestRequest}
 from "../standalone/template/nativeGuestRequests.js";
import {verifiedPublicRuntime,validPublicRead,publicNativeApp,secureGuestRequestLink}
 from "../standalone/template/nativeBusinessClient.js";
import {publicNativeRuntimePlan} from "../src/core/nativeAppRuntimePlan.mjs";
import {nativeShellDescriptor} from "../src/core/standaloneNativePackage.mjs";
import {publicNativeMiniAppProjection} from "../supabase/functions/busy-mini-app-guest/publicNativeProjection.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const id=s=>"00000000-0000-4000-8000-"+s;
const appId=id("000000001155"),versionId=id("000000001156");
const app={id:appId,status:"live",public_slug:"example-salon",
 current_live_version_id:versionId,display_name:"Example Salon"};
const version={id:versionId,mini_app_id:appId,state:"live",
 config:{display:{name:"Example Salon",tagline:"Hair and beauty"},
  modules:["business_profile","services","contact","gallery","enquiry","booking_request"]
   .map(key=>({key,enabled:true})),
  publicProfile:{businessName:"Example Salon",description:"Owner-approved text",
   services:[{name:"Cut and colour",description:"Owner-approved service"}],
   contact:{phone:"01392 000000",email:"hello@example.test"},
   assets:{hero:{uri:"https://example.test/hero.png"},gallery:[
    {uri:"https://example.test/one.png",approved:true},
    {uri:"https://example.test/not-approved.png",approved:false}
   ]},
   privateNotes:"SECRET DO NOT SEND",clientRecords:[{phone:"private"}]},
  ownerToken:"DO_NOT_PUBLISH",builderPlan:{rawPrompt:"secret"},
  privateClientData:[{name:"Private client"}]}};
const scoped={expectedAppId:appId,expectedVersionId:versionId};
const pub=publicNativeMiniAppProjection(app,version,scoped);
assert.equal(pub.ok,true,pub.reason);
assert.equal(pub.supportsBookingRequest,true);
assert.equal(pub.services.length,1);
assert.equal(pub.gallery.length,1);
for(const secret of ["DO_NOT_PUBLISH","SECRET DO NOT SEND","Private client","not-approved.png"])
 assert.ok(!JSON.stringify(pub).includes(secret),"Do not expose owner/private data");
for(const [a,v,sc] of [
 [{...app,status:"draft"},version,scoped],
 [app,{...version,id:id("000000001157")},scoped],
 [app,version,{expectedAppId:appId,expectedVersionId:id("000000001157")}],
 [{...app,current_live_version_id:null},version,scoped]
])assert.equal(publicNativeMiniAppProjection(a,v,sc).ok,false);
const runtime=publicNativeRuntimePlan({app,version,
 origin:"https://preview-project.supabase.co/",ownerApproved:true});
assert.ok(runtime.ok,runtime.reason);
assert.ok(verifiedPublicRuntime(runtime.runtime));

const reviewedManifest={
 ok:true,kind:"private_standalone_planning_manifest_v1",
 ownerAppId:appId,previewVersionId:versionId,
 previewVersionNo:1,sourceDraftRevision:1,
 platformTargets:["ios","android"],appName:"Example Salon",
 modules:["business_profile","booking_request"],
 screenSchema:{ok:true,screens:[
  {key:"business_profile",component:"BusinessIdentity",title:"About",customerRequest:false},
  {key:"booking_request",component:"CustomerBookingRequest",title:"Book",customerRequest:true,
    requiresBusinessConfirmation:true}
 ]},
 automaticallyPublished:false,packageProduced:false,appStoreSubmitted:false,
 chargesCreated:false,requiresVerifiedBilling:true
};
const offline=nativeShellDescriptor(reviewedManifest);
assert.equal(offline.ok,true);
assert.equal(offline.runtimeConnection.enabled,false);
const connected=nativeShellDescriptor(reviewedManifest,{runtimeEvidence:{
 app,version,origin:"https://preview-project.supabase.co/",ownerApproved:true
}});
assert.equal(connected.ok,true,connected.reason);
assert.equal(connected.runtimeConnection.enabled,true);
assert.equal(connected.runtimeConnection.expectedVersionId,versionId);
assert.equal(connected.signingConfigured,false);
assert.equal(connected.buildIsProductionReady,false);
const disconnected=nativeShellDescriptor(reviewedManifest,{runtimeEvidence:{
 app,version:{...version,id:id("000000001157")},
 origin:"https://preview-project.supabase.co/",ownerApproved:true
}});
assert.equal(disconnected.ok,false,"No version mismatch may enable native network access");

for(const v of [
 {...runtime.runtime,endpoint:"https://evil.invalid/functions/v1/busy-mini-app-guest"},
 {...runtime.runtime,expectedVersionId:id("000000001157")},
 {...runtime.runtime,canCollectPayments:true},
 {...runtime.runtime,ownerApproved:false}
]){
 if(v.expectedVersionId!==runtime.runtime.expectedVersionId){
  assert.equal(validPublicRead(pub,v),false);
 }else assert.equal(verifiedPublicRuntime(v),false);
}
assert.equal(publicNativeRuntimePlan({app,version,origin:"https://evil.invalid/",ownerApproved:true}).ok,false);
assert.equal(publicNativeRuntimePlan({app,version,origin:"http://preview-project.supabase.co/",ownerApproved:true}).ok,false);
assert.equal(publicNativeRuntimePlan({app,version,origin:"https://preview-project.supabase.co/",ownerApproved:false}).ok,false);
const fetched=await publicNativeApp(runtime.runtime,async(url,opts)=>{
 assert.ok(url.endsWith("/busy-mini-app-guest"));
 const sent=JSON.parse(opts.body);
 assert.equal(sent.action,"public_app");assert.equal(sent.expectedVersionId,versionId);
 return {ok:true,json:async()=>pub};
});
assert.equal(fetched.ok,true);
assert.equal((await publicNativeApp(runtime.runtime,async()=>({
 ok:true,json:async()=>({...pub,versionId:id("000000001157")})
}))).ok,false);
const link=secureGuestRequestLink(runtime.runtime,"booking_request");
assert.equal(link.ok,true);
assert.ok(link.url.includes("intent=booking_request"));
assert.ok(link.url.startsWith("https://preview-project.supabase.co/"));
assert.equal(secureGuestRequestLink(runtime.runtime,"payments").ok,false);
for(const item of ["","abc","hello","x:y", "some multilingual — text"]){
 const expected=createHash("sha256").update(item).digest("hex");
 if(!/[^\x20-\x7e]/.test(item))
  assert.equal(sha256Ascii(item),expected);
}
const seed="ABCDEF12345_67890",token="ABCDEF12345678901234567890abcDEF";
const challenge={seed,token,difficulty:3};
const result=await solveGuestChallenge(challenge,{yieldToUI:async()=>{},
 timeoutMs:45000});
assert.ok(result.ok,result.reason);
assert.ok(createHash("sha256").update(seed+":"+token+":"+result.solution).digest("hex").startsWith("000"));
assert.equal((await solveGuestChallenge({...challenge,difficulty:7})).ok,false);
const form={name:"Sam",email:"sam@example.test",phone:"",
 service:"Haircut",preferredDate:"Wednesday",message:"Could I book?",note:"Any time"};
assert.ok(validateNativeGuestRequest("booking_request",form).ok);
assert.equal(validateNativeGuestRequest("booking_request",{...form,service:""}).ok,false);
assert.equal(validateNativeGuestRequest("enquiry",{...form,message:""}).ok,false);
let calls=0;
const clientReply=await sendNativeGuestRequest(runtime.runtime,pub,"booking_request",form,{
 solve:async c=>{assert.equal(c.difficulty,3);return {ok:true,solution:result.solution};},
 fetcher:async(url,opts)=>{
  calls++;assert.equal(url,runtime.runtime.endpoint);
  const body=JSON.parse(opts.body);
  if(body.action==="challenge"){
   assert.equal(body.slug,app.public_slug);
   return {ok:true,json:async()=>({ok:true,challenge:{
    challengeId:id("000000001158"),requestType:"booking_request",...challenge}})};
  }
  assert.equal(body.action,"submit");
  assert.equal(body.solution,result.solution);
  assert.equal(body.payload.name,"Sam");
  assert.equal(body.idempotencyKey,id("000000001158"));
  return {ok:true,json:async()=>({ok:true,request:{
   id:id("000000001159"),type:"booking_request",status:"received"}})};
 }
});
assert.equal(calls,2);
assert.equal(clientReply.ok,true,clientReply.reason);
assert.equal(clientReply.ownerConfirmed,false);
assert.equal(clientReply.receiptHeldInMemoryOnly,true);
assert.equal((await sendNativeGuestRequest(runtime.runtime,pub,"payments",form)).ok,false);
assert.equal((await sendNativeGuestRequest({...runtime.runtime,enabled:false},pub,"booking_request",form)).ok,false);
const backend=read("supabase/functions/busy-mini-app-guest/index.ts");
assert.ok(backend.includes('if (action === "public_app")'));
assert.ok(backend.includes('const {app,version}=await liveApp(slug);'));
assert.ok(backend.includes("expectedVersionId"));
assert.ok(backend.includes("requireEnabledModule(version, requestType)"));
assert.ok(backend.includes("await validProof("));
assert.ok(read("standalone/template/App.js").includes("sendNativeGuestRequest(runtime,live,type,input)"));
console.log("V3.155 NATIVE PUBLIC/BOOKING PASS: SHA256 PoW, real guest challenge/submit contract, live version isolation and private owner data exclusion.");
