import assert from "node:assert/strict";
import {hostedStagingMarkerConfig,checkHostedStagingMarker}
 from "./lib/stagingHostedVerificationV3128.mjs";
const p={baseUrl:"https://staging.busydoesit.co.uk/",
 expectedHost:"staging.busydoesit.co.uk",sourceSha:"f".repeat(40),
 stagingRef:"abcdefghijklmnopqrst",productionRef:"zyxwvutsrqponmlkjihg",
 approval:"APPROVE_READ_ONLY_STAGING_AUTH_3128"};
let count=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++};
eq(hostedStagingMarkerConfig(p).valid,true,"Dedicated HTTPS marker config valid");
eq(hostedStagingMarkerConfig({...p,baseUrl:"http://staging.busydoesit.co.uk/"}).valid,
 false,"Reject HTTP");
eq(hostedStagingMarkerConfig({...p,baseUrl:"https://busydoesit.co.uk/",
 expectedHost:"busydoesit.co.uk"}).valid,false,"Never treat public root as staging");
eq(hostedStagingMarkerConfig({...p,stagingRef:p.productionRef}).valid,
 false,"Staging ref cannot equal production");
eq(hostedStagingMarkerConfig({...p,approval:""}).valid,false,
 "No host probing without explicit approval");
eq(hostedStagingMarkerConfig({...p,sourceSha:"latest"}).valid,false,
 "Pin source to full commit");
let calls=0;
const fixture=async(url,opts)=>{
 calls++;
 eq(url,p.baseUrl+"__busy_staging/health","Exact health path only");
 eq(opts.method,"GET","No host writes");
 eq(opts.headers.Authorization,undefined,"No Supabase identity sent to stage host");
 eq(opts.redirect,"error","No redirect to unintended location");
 return {status:200,headers:new Headers({
  "x-robots-tag":"noindex, nofollow","cache-control":"private, no-store"}),
  json:async()=>({status:"marker-ready",environment:"isolated-staging",
   sourceCommit:p.sourceSha,cloudAuthenticationVerified:false,
   websitePublishingReady:false})};
};
const result=await checkHostedStagingMarker(p,fixture);
eq(result.status,"host-marker-observed","Hosting marker can be observed in isolation");
eq(result.genuineSupabaseAuthVerified,false,
 "Separate auth verification required");
eq(result.realWebsiteBuilderVerified,false,
 "A marker does not prove end-to-end website building");
eq(calls,1,"Bounded one GET");
const blocked=await checkHostedStagingMarker({...p,approval:""},async()=>{
 throw Error("no requests expected");
});
eq(blocked.status,"blocked","No network contact for unapproved marker");
const mismatched=await checkHostedStagingMarker(p,async()=>({
 status:200,headers:new Headers({
  "x-robots-tag":"noindex","cache-control":"no-store"}),
 json:async()=>({status:"marker-ready",environment:"isolated-staging",
  sourceCommit:"0".repeat(40),cloudAuthenticationVerified:false,
  websitePublishingReady:false})
}));
eq(mismatched.status,"blocked","Wrong source commit fails even over HTTPS");
const unprotected=await checkHostedStagingMarker(p,async()=>({
 status:200,headers:new Headers({
  "cache-control":"public, max-age=86400"}),
 json:async()=>({status:"marker-ready",environment:"isolated-staging",
  sourceCommit:p.sourceSha,cloudAuthenticationVerified:false,
  websitePublishingReady:false})
}));
eq(unprotected.status,"blocked","Missing noindex/private response fails");
console.log("V3.128 PASS: "+count+" isolated hosted HTTPS marker transport and fail-closed assertions.");
