/**
 * V3.132 — real external HTTPS probe, WITHOUT passwords, JWTs or mutations.
 * Run only in GitHub Actions against the approved nonproduction project.
 * This is anonymous boundary verification, NOT an authenticated sign-in.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const eas=JSON.parse(readFileSync(new URL("../eas.json",import.meta.url),"utf8"));
const e=eas.build?.staging?.env||{};
const origin=e.EXPO_PUBLIC_BUSY_STAGING_SUPABASE_URL;
const key=e.EXPO_PUBLIC_BUSY_STAGING_PUBLISHABLE_KEY;
assert.equal(origin,"https://pnjdlogwegnqbsfpcofw.supabase.co",
 "Never probe an unexpected host");
assert.match(key||"",/^sb_publishable_[A-Za-z0-9_-]{15,}$/,
 "Use only the project's public, not elevated, key");
async function safeGet(path){
 const url=new URL(path,origin);
 assert.equal(url.origin,origin);
 let r;
 try{
  r=await fetch(url.href,{method:"GET",
   headers:{apikey:key,Accept:"application/json"},
   redirect:"error",cache:"no-store",signal:AbortSignal.timeout(10000)});
 }catch{
  throw new Error("Staging read-only HTTPS probe unavailable; no pass recorded");
 }
 let body=null;
 try{body=await r.json();}catch{}
 return {status:r.status,body};
}
// No token is provided. A production RLS leak would return records here,
// which MUST fail this gate even if the endpoint is otherwise reachable.
const user=await safeGet("/auth/v1/user");
assert.ok([401,403].includes(user.status),
 "Unauthenticated real staging user endpoint must reject without JWT");
const row=await safeGet("/rest/v1/busy_staging_rls_canary?select=id,owner_id&limit=3");
const denied=[401,403].includes(row.status)||
 (row.status===200&&Array.isArray(row.body)&&row.body.length===0);
assert.ok(denied,"Real staging Data API must deny anonymous business record access");
// Do not print raw responses, project keys, user IDs or business data.
console.log("V3.132 PASS: real HTTPS Supabase staging anonymous Auth user endpoint denied and fictional business table produced no anonymous rows. No test password or access JWT used.");
console.log("V3.132 status only: user="+user.status+", canary="+row.status+".");
