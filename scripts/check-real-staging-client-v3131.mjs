import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createStagingAuthInspector,validateStagingAuthConfig,FIXTURES}
 from "../src/staging/stagingAuthInspectorV3131.mjs";
const stage="https://pnjdlogwegnqbsfpcofw.supabase.co";
const key="sb_publishable_offline_test_only_123456789";
const config={environment:"isolated-staging",baseUrl:stage,publishableKey:key};
const ids={a:"91edb6db-3a02-4de4-9ba8-5c93b4e790a1",
 b:"d8836a0e-fbb0-4cb9-a613-509af50eb114"};
const tokens={a:"fictional_A_access_token_not_signed_for_unit_tests",
 b:"fictional_B_access_token_not_signed_for_unit_tests"};
let n=0;
const eq=(actual,expected,label)=>{assert.deepEqual(actual,expected,label);n++;};
const yes=(value,label)=>{assert.ok(value,label);n++;};
const rejects=async(fn,reason)=>{await assert.rejects(fn,e=>e?.message===reason);n++;};
function service({leak=false,wrongUser=false,anonLeak=false,passwordRejected=false,
 networkError=false,logoutFail=false,waitOwn=false}={}){
 const requests=[];
 const fetchImpl=async(url,opts)=>{
  // The entire URL must stay in independently approved staging, forever.
  yes(url.startsWith(stage+"/"),"Exactly pinned Supabase staging project origin");
  yes(!url.includes("qgkmuiipicazmcxxmoxv")&&!url.includes("rtqqnqbrqpjondvcyann"),
    "No production or Slow Roast project host referenced");
  eq(opts.redirect,"error","Remote redirects must never be followed");
  eq(opts.cache,"no-store","Authentication and tenant checks never cached");
  requests.push({path:url.slice(stage.length),method:opts.method,
    hasAuth:!!opts.headers.Authorization});
  if(networkError)throw new Error("fixture-offline");
  const u=new URL(url),auth=opts.headers.Authorization||"";
  const send=(status,json)=>({status,json:async()=>json});
  if(u.pathname==="/auth/v1/token"){
   eq(opts.method,"POST","Sign-in is the only credential write");
   yes(!auth,"No bearer on password exchange");
   const submitted=JSON.parse(opts.body);
   const found=Object.keys(FIXTURES).find(x=>FIXTURES[x].email===submitted.email);
   if(passwordRejected||!found)return send(400,{error:"invalid_grant"});
   eq(submitted.password,"only-entered-on-test-device","Password only passes to Supabase Auth");
   return send(200,{access_token:tokens[found],refresh_token:"private_unused_refresh_token",
     user:{id:ids[found],email:FIXTURES[found].email}});
  }
  if(u.pathname==="/auth/v1/logout"){
   eq(opts.method,"POST","Sign-out contacts only Auth endpoint");
   return send(logoutFail?503:204,null);
  }
  if(u.pathname==="/auth/v1/user"){
   eq(opts.method,"GET","Identity from server-side Supabase GET only");
   const owner=Object.keys(tokens).find(x=>auth==="Bearer "+tokens[x]);
   if(!owner)return send(401,{});
   return send(200,{id:wrongUser?ids[owner==="a"?"b":"a"]:ids[owner],
    email:FIXTURES[owner].email});
  }
  if(u.pathname==="/rest/v1/busy_staging_rls_canary"){
   eq(opts.method,"GET","No business row mutation");
   eq(u.searchParams.get("select"),"id,owner_id,marker",
      "Read-only fixed canary fields");
   const row=u.searchParams.get("id")?.replace(/^eq\./,"");
   const owner=Object.keys(tokens).find(x=>auth==="Bearer "+tokens[x]);
   const subject=Object.keys(FIXTURES).find(x=>FIXTURES[x].row===row);
   if(waitOwn&&owner&&owner===subject)await new Promise(r=>setTimeout(r,5));
   if(!owner)return anonLeak?send(200,[{id:row}]):
    send(200,[]);
   if(!subject||(!leak&&subject!==owner))return send(200,[]);
   return send(200,[{id:row,owner_id:ids[subject],marker:"fictional-tenant-only"}]);
  }
  throw Error("Unexpected endpoint in fake staging client");
 };
 return {inspector:createStagingAuthInspector({config,fetchImpl}),requests};
}
eq(validateStagingAuthConfig(config),true,"Exact isolated project can be configured");
for(const bad of [
 {...config,environment:""},
 {...config,environment:"production"},
 {...config,baseUrl:"https://qgkmuiipicazmcxxmoxv.supabase.co"},
 {...config,baseUrl:"https://rtqqnqbrqpjondvcyann.supabase.co"},
 {...config,baseUrl:"http://pnjdlogwegnqbsfpcofw.supabase.co"},
 {...config,baseUrl:"https://abcdefghijklmnopqrst.supabase.co"},
 {...config,publishableKey:"sb_secret_service_role_key"},
 {...config,publishableKey:""}
])eq(validateStagingAuthConfig(bad),false,"Any unsafe configuration fails closed");
const missing=createStagingAuthInspector({config:{...config,publishableKey:""},fetchImpl:()=>{
 throw Error("forbidden cloud contact");
}});
eq(missing.configured,false,"No key is not network-capable");
await rejects(()=>missing.signIn(FIXTURES.a.email,"secret"),"staging-not-configured");
for(const user of ["a","b"]){
 const client=service(),inspector=client.inspector;
 eq(inspector.signedIn,false,"No persisted session before sign-in");
 const result=await inspector.signIn(FIXTURES[user].email,
   "only-entered-on-test-device");
 eq(result.status,"genuine-staging-auth-and-rls-verified",
   "All real-shaped Auth and RLS requests verified");
 eq(result.account,user==="a"?"Owner A":"Owner B","Correct test owner identity");
 eq(result.ownRowVisible,true,"Owner's test row visible");
 eq(result.foreignRowHidden,true,"Other tenant's row hidden");
 eq(result.anonymousDenied,true,"Anon cannot see own row");
 eq(result.storedOnDevice,false,"No persistent refresh or access tokens");
 eq(result.hostedPreviewVerified,false,"No false external deployment claim");
 eq(inspector.signedIn,true,"Temporary in-memory session exists");
 const recheck=await inspector.recheck();
 eq(recheck.status,result.status,"Fresh getUser + database check succeeds");
 const output=JSON.stringify(result)+JSON.stringify(recheck);
 yes(!output.includes(tokens[user])&&!output.includes("private_unused_refresh_token"),
   "No access or refresh token in user-facing evidence");
 yes(!output.includes(ids[user]),"No test user UUID leaked into result");
 const signedOut=await inspector.signOut();
 eq(signedOut.localSessionCleared,true,"Signout clears memory");
 eq(signedOut.remoteLogoutVerified,true,"Fake Auth logout 204 accepted");
 eq(inspector.signedIn,false,"Session cleared");
 await rejects(()=>inspector.recheck(),"staging-no-session");
 yes(client.requests.every(x=>x.method==="GET"||
   (x.method==="POST"&&/^\/auth\/v1\/(token|logout)/.test(x.path))),
   "No mutations to test business rows");
}
await rejects(()=>service().inspector.signIn("other@example.invalid","any"),
 "staging-test-account-required");
await rejects(()=>service({passwordRejected:true}).inspector.signIn(
 FIXTURES.a.email,"wrong-password"),"staging-sign-in-failed");
await rejects(()=>service({wrongUser:true}).inspector.signIn(
 FIXTURES.a.email,"only-entered-on-test-device"),"staging-own-row-failed");
await rejects(()=>service({leak:true}).inspector.signIn(
 FIXTURES.a.email,"only-entered-on-test-device"),
 "staging-cross-owner-denial-failed");
await rejects(()=>service({anonLeak:true}).inspector.signIn(
 FIXTURES.a.email,"only-entered-on-test-device"),
 "staging-anonymous-denial-failed");
await rejects(()=>service({networkError:true}).inspector.signIn(
 FIXTURES.a.email,"only-entered-on-test-device"),
 "staging-network-unavailable");
const failLogout=service({logoutFail:true}).inspector;
await failLogout.signIn(FIXTURES.a.email,"only-entered-on-test-device");
const failed=await failLogout.signOut();
eq(failed.localSessionCleared,true,"Local state clears when server logout fails");
eq(failed.remoteLogoutVerified,false,"Cannot claim revoked remote session");
eq(failed.accessJwtMayRemainValidUntilExpiry,true,"Honest JWT expiration disclaimer");
eq(failLogout.signedIn,false,"Remote error cannot retain local Auth access");
const stale=service({waitOwn:true}).inspector;
const inFlight=stale.signIn(FIXTURES.a.email,"only-entered-on-test-device");
stale.clearLocal();
await rejects(()=>inFlight,"staging-session-cancelled");
eq(stale.signedIn,false,"Late Auth response cannot resurrect signed-out identity");
const root=readFileSync(new URL("../App.js",import.meta.url),"utf8");
yes(root.includes('process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT==="isolated-staging"'),
 "App boots into staging screen only with explicit EAS setting");
yes(root.includes("isolated?StagingSignInScreen:BusyDoesItApp"),
 "Normal Busy Does It app stays default");
const ui=readFileSync(new URL("../src/staging/StagingSignInScreen.js",import.meta.url),"utf8");
yes(ui.includes("secureTextEntry"),"Password obscured on screen");
yes(ui.includes('setPassword("");'),"Password cleared from UI upon submission");
yes(!/\b(import|require|setItem|multiSet|SecureStore\.setItemAsync)\b[^\n]*(AsyncStorage|SecureStore|secure-store|async-storage)/i.test(ui),
 "Session never written to device persistence");
yes(!ui.includes("console.log")&&!ui.includes("console.error"),
 "No credentials printed to application logs");
yes(ui.includes("Recheck access")&&ui.includes("Sign out and clear session"),
 "Developer can retest expired sessions and clear local identity");
const workflow=readFileSync(new URL("../.github/workflows/production-check.yml",import.meta.url),"utf8");
yes(workflow.includes("check-real-staging-client-v3131.mjs"),
 "Default CI exercises native staging inspector guard");
console.log("V3.131 PASS: "+n+" fixture-only real-Auth transport, tenant, denial, expiry boundary, logout and staging app checks; no cloud sign-in executed.");
