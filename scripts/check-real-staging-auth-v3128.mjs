import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stagingAuthConfigCheck,probeStagingSupabaseAuth}
 from "./lib/stagingSupabaseAuthV3128.mjs";
const A="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const B="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const RA="20f9279e-0dcf-4b1b-aad0-4952c4aab332";
const RB="0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf";
const aToken="fictional_Bearer_A_token_for_CI_ONLY";
const bToken="fictional_Bearer_B_token_for_CI_ONLY";
const rejected="fictional_expired_or_invalid_token_CI_ONLY";
const p={stagingRef:"abcdefghijklmnopqrst",
 productionRef:"zyxwvutsrqponmlkjihg",
 otherProtectedRef:"mnbvcxzlkjhgfdsapoiu",
 publishableKey:"sb_publishable_just_for_ci_fixture_not_real",
 ownerA:A,ownerB:B,rowA:RA,rowB:RB,
 tokenA:aToken,tokenB:bToken,rejectedToken:rejected,
 approval:"APPROVE_READ_ONLY_STAGING_AUTH_3128",
 sourceSha:"f".repeat(40)};
let n=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++;};
const yes=(a,m)=>{assert.ok(a,m);n++;};
eq(stagingAuthConfigCheck().status,"blocked","Blank secrets must block");
eq(stagingAuthConfigCheck(p).status,"configuration-valid","Fully fictional metadata is structurally valid");
eq(stagingAuthConfigCheck({...p,stagingRef:p.productionRef}).status,"blocked",
 "Must never query real production project as staging");
eq(stagingAuthConfigCheck({...p,stagingRef:p.otherProtectedRef}).status,"blocked",
 "Unrelated active project cannot become staging");
eq(stagingAuthConfigCheck({...p,ownerA:p.ownerB}).status,"blocked",
 "Owners must be distinct");
eq(stagingAuthConfigCheck({...p,tokenB:p.tokenA}).status,"blocked",
 "Two test Auth sessions must be distinct");
eq(stagingAuthConfigCheck({...p,publishableKey:"sb_secret_invalid"}).status,"blocked",
 "Server-only elevated keys never pass");
eq(stagingAuthConfigCheck({...p,sourceSha:"v3.128"}).status,"blocked",
 "Staging verification requires pinned commit");
eq(stagingAuthConfigCheck({...p,approval:""}).status,"blocked",
 "Explicit manual approval required");
let calls=[];
function fakeResponse(status,data){return {status,json:async()=>data};}
const fixture=async(url,opts)=>{
 calls.push({url,method:opts.method,redirect:opts.redirect});
 yes(opts.method==="GET"&&opts.redirect==="error","No writes or redirects");
 yes(url.startsWith("https://abcdefghijklmnopqrst.supabase.co/"),
   "Requests only target designated staging project");
 const auth=opts.headers.Authorization||"";
 const token=auth.replace(/^Bearer /,"");
 if(new URL(url).pathname==="/auth/v1/user"){
  if(token===aToken)return fakeResponse(200,{id:A,email:"private-a@test.invalid"});
  if(token===bToken)return fakeResponse(200,{id:B,email:"private-b@test.invalid"});
  return fakeResponse(401,{message:"not authorized"});
 }
 if(new URL(url).pathname!=="/rest/v1/busy_staging_rls_canary")
   throw Error("unexpected path");
 const row=new URL(url).searchParams.get("id").slice(3);
 const actualOwner=row===RA?A:row===RB?B:null;
 if(token!==aToken&&token!==bToken)return fakeResponse(401,null);
 const requestingOwner=token===aToken?A:B;
 return fakeResponse(200,actualOwner===requestingOwner?
   [{id:row,owner_id:actualOwner,personal_detail:"must-not-log"}]:[]);
};
const answer=await probeStagingSupabaseAuth(p,fixture);
eq(answer.status,"real-staging-observations-need-independent-review",
 "Successful network-shaped fixture still requires independent review");
eq(answer.passed,10,"Ten expected authentication and RLS cases");
eq(answer.checks.length,10,"Two Auth identities, two rejected identities, six reads");
eq(calls.length,10,"Exactly ten GET requests");
eq(answer.independentlyAttested,false,"No independent attestation from a fixture");
eq(answer.writePoliciesVerified,false,"Read-only GETs cannot certify UPDATE/DELETE");
eq(answer.publicLaunchAuthorised,false,"No production release authorized");
const publicOutput=JSON.stringify(answer);
yes(!publicOutput.includes("private-a")&&!publicOutput.includes("personal_detail"),
 "Sensitive response body excluded");
yes(!publicOutput.includes(aToken)&&!publicOutput.includes(p.publishableKey),
 "No secrets in evidence");
let failCalls=0;
const noApproval=await probeStagingSupabaseAuth({...p,approval:""},async()=>{
 failCalls++;throw Error("unexpected request");
});
eq(noApproval.status,"blocked","No approval blocks without touching cloud");
eq(failCalls,0,"Zero requests for unapproved configuration");
let readRequests=0;
const swapped=await probeStagingSupabaseAuth(p,async(url,opts)=>{
 if(url.includes("/rest/"))readRequests++;
 if(url.endsWith("/auth/v1/user")&&opts.headers.Authorization==="Bearer "+aToken)
  return fakeResponse(200,{id:B});
 return fixture(url,opts);
});
eq(swapped.phase,"auth","Mismatched server-supplied owner aborts the probe");
eq(readRequests,0,"No data table queried after wrong authenticated owner");
const leak=await probeStagingSupabaseAuth(p,async(url,opts)=>{
 if(url.includes("/rest/v1/")&&new URL(url).searchParams.get("id")==="eq."+RB&&
   opts.headers.Authorization==="Bearer "+aToken)
  return fakeResponse(200,[{id:RB,owner_id:B}]);
 return fixture(url,opts);
});
eq(leak.status,"blocked","A true cross-tenant leak invalidates staging");
eq(leak.checks.find(x=>x.id==="rls-a-foreign").passed,false,
 "Cross-tenant leak visible only as failed case");
const falseAuth=await probeStagingSupabaseAuth(p,async(url,opts)=>{
 if(url.endsWith("/auth/v1/user")&&!opts.headers.Authorization)
  return fakeResponse(200,{id:A});
 return fixture(url,opts);
});
eq(falseAuth.status,"blocked","Unexpected accepted anonymous Auth request fails");
const script=readFileSync(new URL("./run-real-staging-auth-v3128.mjs",import.meta.url),"utf8");
yes(script.includes("probeStagingSupabaseAuth({"),
 "Manual real cloud runner is wired to guarded probe");
const wf=readFileSync(new URL("../.github/workflows/real-staging-auth-v3128.yml",import.meta.url),"utf8");
yes(wf.includes("github.event_name == 'workflow_dispatch'"),
 "Cloud contact occurs only after manual workflow dispatch");
yes(wf.includes("environment: isolated-staging"),
 "Credential isolation is named in workflow");
yes(!wf.includes("SUPABASE_SERVICE_ROLE_KEY")&&!wf.includes("SUPABASE_ACCESS_TOKEN"),
 "No elevated management credentials used by the workflow");
const prod=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
yes(prod.includes("check-real-staging-auth-v3128.mjs"),"Normal source CI covers auth guard");
console.log("V3.128 PASS: "+n+" guarded Auth/RLS, wrong-project, redaction and staging workflow assertions.");
