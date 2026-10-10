import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectRecordedWebsiteDeployment} from "../src/core/websiteDeploymentSelection.mjs";
import {stagingCanaryInputCheck,stagingCanaryReadEvidence} from "../src/core/stagingCanaryReadEvidence.mjs";
import {websiteReleaseReadiness} from "../src/core/websiteReleaseReadiness.mjs";
import {websiteStagingReadiness} from "../src/core/websiteStagingReadiness.mjs";
let n=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const ok=(x,m)=>{assert.ok(x,m);n++};
const a="91edb6db-3a02-4de4-9ba8-5c93b4e790a1",
 b="d8836a0e-fbb0-4cb9-a613-509af50eb114",
 x="20f9279e-0dcf-4b1b-aad0-4952c4aab332",
 y="0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf";
const rows=[
 {id:x,state:"preview_ready",source_generation:9},
 {id:y,state:"preview_ready",source_generation:7},
 {id:a,state:"live",source_generation:6}
];
const current=selectRecordedWebsiteDeployment({
 deployments:[rows[1],rows[0],rows[2]],
 website:{current_preview_deployment_id:x},kind:"preview"});
eq(current.id,x,"Out-of-order list cannot supersede exact current preview");
eq(selectRecordedWebsiteDeployment({
 deployments:rows,website:{current_preview_deployment_id:"missing"},kind:"preview"}),
 null,"Invalid canonical pointer never silently falls back");
eq(selectRecordedWebsiteDeployment({
 deployments:rows,website:{current_preview_deployment_id:null},kind:"preview"}),
 null,"Two unordered preview_ready candidates are ambiguous");
eq(selectRecordedWebsiteDeployment({
 deployments:[rows[0]],website:{},kind:"preview"}).id,x,
 "One unambiguous legacy preview can be displayed");
eq(selectRecordedWebsiteDeployment({
 deployments:rows,website:{current_live_deployment_id:a},kind:"live"}).id,a,
 "Canonical live deployment selected explicitly");
eq(selectRecordedWebsiteDeployment({
 deployments:[rows[0],rows[0]],website:{current_preview_deployment_id:x},kind:"preview"}),
 null,"Duplicate canonical IDs fail closed");
eq(selectRecordedWebsiteDeployment({
 deployments:[{id:x,state:"failed"},rows[1]],
 website:{current_preview_deployment_id:x},kind:"preview"}),
 null,"Failed canonical deployment cannot masquerade as preview");
eq(selectRecordedWebsiteDeployment({
 deployments:[rows[0]],website:{current_preview_deployment_id:42},kind:"preview"}),
 null,"Non-string canonical IDs fail closed");
eq(selectRecordedWebsiteDeployment({
 deployments:rows,website:null,kind:"unknown"}),
 null,"Unknown deployment kind unavailable");
const params={
 stagingRef:"abcdefghijklmnopqrst",productionRef:"zyxwvutsrqponmlkjihg",
 ownerA:a,ownerB:b,rowA:x,rowB:y,
 publishableKey:"sb_publishable_source_fixture",
 tokenA:"fictional_auth_token_for_owner_a",
 tokenB:"fictional_auth_token_for_owner_b",
 expiredToken:"fictional_expired_token_for_cannot_access",
 manualApproval:"APPROVE_ISOLATED_STAGING_READS"
};
eq(stagingCanaryInputCheck(params).valid,true,"Complete isolated canary metadata");
eq(stagingCanaryInputCheck({...params,stagingRef:params.productionRef}).valid,
 false,"Cannot point a staging canary at named production project");
eq(stagingCanaryInputCheck({...params,ownerB:a}).valid,false,
 "Two independent Auth users required");
eq(stagingCanaryInputCheck({...params,tokenB:params.tokenA}).valid,false,
 "Separate owner tokens required");
eq(stagingCanaryInputCheck({...params,publishableKey:"sb_secret_123"}).valid,false,
 "Only public key permitted in read-only probe");
let network=0;
await assert.rejects(()=>stagingCanaryReadEvidence({...params,manualApproval:""},async()=>{
 network++;throw Error("must not send");
}),/Manual staging read approval required/);n++;
eq(network,0,"Unapproved probe makes no network call");
await assert.rejects(()=>stagingCanaryReadEvidence({...params,ownerB:a},async()=>{
 network++;throw Error("must not send");
}),/Incomplete isolated-staging canary input/);n++;
eq(network,0,"Invalid owner evidence sends nothing");
const fetchFake=async(url,{method,headers,redirect})=>{
 network++;
 eq(method,"GET","Read-only HTTP transport");
 eq(redirect,"error","Do not silently follow redirects to another project");
 ok(url.startsWith("https://abcdefghijklmnopqrst.supabase.co/rest/v1/"),
   "Only declared fictional staging host used");
 eq(headers.apikey,params.publishableKey,"Publishable header used");
 const target=new URL(url).searchParams.get("id").slice(3);
 const token=headers.Authorization?.slice(7)||"";
 if(!token||token===params.expiredToken)
   return {status:401,ok:false};
 const requestedBy=token===params.tokenA?a:token===params.tokenB?b:"";
 const owner=target===x?a:target===y?b:"";
 return {status:200,ok:true,json:async()=>owner===requestedBy?
   [{id:target,owner_id:owner}]:[]};
};
const outcome=await stagingCanaryReadEvidence(params,fetchFake);
eq(outcome.passed,6,"Both own reads and two-way foreign/anon/expired checks");
eq(outcome.status,"observations-await-independent-review",
 "Fixture cannot certify a real Supabase project");
eq(outcome.independentlyAttested,false,"Source-only traces never certify staging");
eq(outcome.writeIsolationVerified,false,"GETs cannot prove RLS denied writes");
eq(outcome.fullAppTenantSecurityVerified,false,
 "Fixture probes do not cover all app endpoints");
eq(network,6,"Exactly six guarded read-only operations");
const leak=await stagingCanaryReadEvidence(params,async(url,{headers})=>{
 const target=new URL(url).searchParams.get("id").slice(3);
 return {status:200,ok:true,json:async()=>[{id:target,owner_id:a}]};
});
eq(leak.status,"blocked","Returning foreign record fails closed");
eq(leak.cases.some(c=>c.id==="a-foreign"&&!c.passed),true,
 "A foreign tenant data leak is detected");
const docs=readFileSync(new URL("../src/domain/websitePublishing.js",import.meta.url),"utf8");
ok(docs.includes("selectRecordedWebsiteDeployment({"),
 "Production website publishing view uses exact deployment selector");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
ok(workflow.includes("check-website-exact-version-v3126.mjs"),
 "Standard CI covers new preview and cloud scope");
eq(websiteReleaseReadiness().status,"blocked","Production release remains blocked");
eq(websiteStagingReadiness().status,"blocked","No real cloud staging has been certified");
console.log("V3.126 PASS: "+n+" exact website version, read-only canary, tenant boundaries and release assertions.");
