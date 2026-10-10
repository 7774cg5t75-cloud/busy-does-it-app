/**
 * V3.132 verify two actual Expo iOS JS exports:
 * - staging: inlines only public staging-key config and shows the test gate
 * - normal: has no staging public API key in its bundled JavaScript
 * Signing, publishing and Expo account actions are NOT performed here.
 */
import {spawnSync} from "node:child_process";
import {readFileSync,rmSync,existsSync,readdirSync,statSync} from "node:fs";
import {join,resolve} from "node:path";
import assert from "node:assert/strict";
const root=resolve(new URL("../",import.meta.url).pathname);
const config=JSON.parse(readFileSync(join(root,"eas.json"),"utf8")).build.staging;
const env=config.env;
const stageKey=env.EXPO_PUBLIC_BUSY_STAGING_PUBLISHABLE_KEY;
assert.ok(/^sb_publishable_[A-Za-z0-9_-]{15,}$/.test(stageKey));
const work="/tmp/busy-v3132-exports";
rmSync(work,{recursive:true,force:true});
function sources(where){
 const strings=[];
 function scan(path){
  for(const name of readdirSync(path)){
   const f=join(path,name);
   if(statSync(f).isDirectory())scan(f);
   else if(/\.(js|mjs|map)$/.test(f))strings.push(readFileSync(f,"utf8"));
  }
 }
 scan(where);
 return {bundleCount:strings.length,combined:strings.join("\n")};
}
function exportBundle(name,variables){
 const path=join(work,name);
 const inherited={...process.env};
 for(const key of [
  "EXPO_PUBLIC_BUSY_ENVIRONMENT",
  "EXPO_PUBLIC_BUSY_STAGING_SUPABASE_URL",
  "EXPO_PUBLIC_BUSY_STAGING_PUBLISHABLE_KEY"
 ])delete inherited[key];
 const res=spawnSync("npx",["expo","export","--platform","ios","--output-dir",path],{
   cwd:root,env:{...inherited,...variables},encoding:"utf8",timeout:180000,
   maxBuffer:6*1024*1024
 });
 if(res.error||res.status!==0){
  const safe=(res.stderr||"").replaceAll(stageKey,"[public-client-key]");
  throw new Error(name+" Expo export failed: "+safe.slice(-900));
 }
 assert.ok(existsSync(path),name+" export path missing");
 return sources(path);
}
const stage=exportBundle("staging",env);
assert.ok(stage.bundleCount>0,"Staging JS bundle files exist");
assert.ok(stage.combined.includes("pnjdlogwegnqbsfpcofw.supabase.co"),
 "Staging output must point to the exact independently created Supabase host");
assert.ok(stage.combined.includes(stageKey),
 "Staging client is embedded with actual public publishable key");
assert.ok(stage.combined.includes("Test real Busy sign-in"),
 "Staging login interface is included in the actual iOS JS export");
const normal=exportBundle("normal",{});
assert.ok(normal.bundleCount>0,"Normal iOS JS bundle files exist");
assert.ok(!normal.combined.includes(stageKey),
 "Normal iPhone build must not embed the staging public key");
console.log("V3.132 PASS: separate real staging and normal iOS JavaScript exports with expected stage public-key injection; both offline; no EAS/Apple signing performed.");
