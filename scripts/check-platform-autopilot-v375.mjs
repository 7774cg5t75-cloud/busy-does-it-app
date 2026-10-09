import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 managedHostname,probeManagedWebsite,hasProviderReceipt,socialEvidence,
 appEvidence,buildExternalRealityDigest
} from "../supabase/functions/busy-founder-ops/externalReality.mjs";

const website="11111111-1111-4111-8111-111111111111";
const deployment="22222222-2222-4222-8222-222222222222";
const site={id:website,current_live_deployment_id:deployment,
 default_hostname:"sample.busydoesit.co.uk"};
assert.equal(managedHostname(site.default_hostname),site.default_hostname);
for(const host of ["localhost","localhost.busydoesit.co.uk.evil.test",
 "evil.example.net","site.busydoesit.co.uk:443","site.busydoesit.co.uk/path",
 "https://site.busydoesit.co.uk","127.0.0.1","sample.busydoesit.co.uk.",
 "sub.sample.busydoesit.co.uk","site.BUSYDOESIT.CO.UK"])
 assert.equal(managedHostname(host),null,host);
let calls=0;
const fakeFetch=async(url,options)=>{
 calls++;
 assert.equal(url,"https://sample.busydoesit.co.uk/");
 assert.equal(options.method,"HEAD");
 assert.equal(options.redirect,"manual");
 assert.equal(options.headers.Accept,"text/html");
 assert.ok(options.signal);
 return {status:200,headers:new Headers({
   "x-busy-deployment":deployment,"x-busy-website":website,
   "content-type":"text/html; charset=utf-8"
 })};
};
assert.equal(await probeManagedWebsite(site,{fetchImpl:fakeFetch}),"deployment_responding");
assert.equal(calls,1);
assert.equal(await probeManagedWebsite({...site,default_hostname:"evil.example.net"},
  {fetchImpl:()=>{throw Error("must never call")}}),"unverified");
assert.equal(await probeManagedWebsite(site,{fetchImpl:async()=>({status:302,headers:new Headers({location:"https://evil.test"})})}),"unverified");
assert.equal(await probeManagedWebsite(site,{fetchImpl:async()=>({status:503,headers:new Headers()})}),"unreachable");
assert.equal(await probeManagedWebsite(site,{fetchImpl:async()=>{throw Error("timeout")}}),"unreachable");
assert.equal(await probeManagedWebsite(site,{fetchImpl:async()=>({status:200,headers:new Headers({
 "x-busy-deployment":"wrong","x-busy-website":website,"content-type":"text/html"
})})}),"mismatch");
assert.equal(await probeManagedWebsite(site,{timeoutMs:7000,fetchImpl:fakeFetch}),"unverified");
assert.equal(calls,1);

assert.equal(hasProviderReceipt("Facebook",{id:"888_999"}),true);
assert.equal(hasProviderReceipt("Instagram",{id:"123456789"}),true);
assert.equal(hasProviderReceipt("Google Business",{name:"accounts/1/locations/2/localPosts/3"}),true);
for(const v of [{error:"failed"},{id:""},{id:"a",raw_content:"unsafe"},{id:12},{id:"hello world"}])
 assert.equal(hasProviderReceipt("Facebook",v),false);
assert.equal(hasProviderReceipt("Google Business",{id:"foo"}),false);
assert.deepEqual(socialEvidence({status:"Published",
 channels:["Facebook","Instagram","Google Business"],
 provider_results:{"Facebook":{id:"123_456"},
  "Instagram":{error:"declined"},"Google Business":{name:"accounts/1/locations/2/localPosts/3"}}}),
 {accepted:2,unverified:0,failed:1});
assert.deepEqual(socialEvidence({status:"Published",channels:["Facebook"],
 provider_results:{Facebook:{status:"ok"}}}),{accepted:0,unverified:1,failed:0});
assert.deepEqual(socialEvidence({status:"Failed",channels:["Facebook"]}),
 {accepted:0,unverified:0,failed:1});
assert.equal(appEvidence({status:"published",current_live_version_id:deployment,
 public_web_version_id:deployment,public_web_status:"published"}),"deployment_recorded");
assert.equal(appEvidence({current_live_version_id:deployment,
 public_web_version_id:website,public_web_status:"published"}),"version_mismatch");
assert.equal(appEvidence({current_live_version_id:deployment,
 public_web_version_id:deployment,public_web_status:"pending"}),"not_verified");
assert.equal(appEvidence({status:"published"}),"not_deployed");
const d=buildExternalRealityDigest({
 checkedAt:"2026-10-09T12:00:00Z",
 websiteChecks:["deployment_responding","unreachable","mismatch","unverified"],
 socialRows:[{status:"Published",channels:["Facebook"],provider_results:{"Facebook":{id:"123"}}}],
 appRows:[{current_live_version_id:deployment,public_web_version_id:deployment,public_web_status:"published"}]
});
assert.equal(d.scope,"founder_aggregate_sample");
assert.equal(d.mode,"on_demand_read_only");
assert.equal(d.automaticRetryAllowed,false);
assert.equal(d.website.sampled,4);
assert.equal(d.website.outcomes.deployment_responding,1);
assert.equal(d.social.channels.providerAccepted,1);
assert.equal(d.apps.outcomes.deployment_recorded,1);
assert.ok(!JSON.stringify(d).includes(deployment));
const unknown=buildExternalRealityDigest({websiteChecks:null,socialRows:null,appRows:null});
assert.equal(unknown.website.status,"unavailable");
assert.equal(unknown.website.outcomes,null);
assert.equal(unknown.social.channels,null);
assert.equal(unknown.apps.sampled,null);
const edge=readFileSync(new URL("../supabase/functions/busy-founder-ops/index.ts",import.meta.url),"utf8");
const client=readFileSync(new URL("../src/app/AppController.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../src/screens/founderOperations.js",import.meta.url),"utf8");
const ci=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
assert.ok(edge.indexOf('if(!founder)return send(403')<
          edge.indexOf('if(action==="verify_external"'));
assert.ok(edge.includes('if(action==="verify_external"&&Object.keys(payload).length===1)'));
assert.ok(edge.includes('{"current_live_deployment_id":"not.is.null"}'));
assert.ok(edge.includes('{"current_live_version_id":"not.is.null"}'));
assert.ok(edge.includes('{"status":"in.(Published,Partial failure,Failed)"}'));
assert.ok(edge.includes('websiteChecks,socialRows:posts,appRows:apps'));
assert.ok(edge.includes('"updated_at.desc",4'));
assert.ok(client.includes('body:JSON.stringify({action:"verify_external"})'));
assert.ok(client.includes("fetchExternalReality,"));
assert.ok(ui.includes("V3.75 • Reality Check Engine"));
assert.ok(ui.includes("realityNonce.current"));
assert.ok(ui.includes("onPress={verifyExternal}"));
assert.ok(!ui.includes("expo_push_token"));
assert.ok(ci.includes("node scripts/check-platform-autopilot-v375.mjs"));
console.log("V3.75 PASS: bounded HTTPS probing, no arbitrary host redirects, provider receipt classification, app version distinctions, founder role gate, UI and CI wiring");
