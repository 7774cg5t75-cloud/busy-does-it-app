/**
 * V3.132 — static, no-network staging iOS build profile safety contract.
 * Public Supabase publishable keys are embedded in iOS clients by design.
 * NEVER add sb_secret_, service-role JWT, user passwords or signing credentials.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const eas=JSON.parse(read("eas.json"));
const app=JSON.parse(read("app.json")).expo;
const c=require("../app.config.js");
const stage=eas.build.staging;
const prod=eas.build.production;
const develop=eas.build.development;
const preview=eas.build.preview;
let n=0;
function eq(actual,want,message){assert.deepEqual(actual,want,message);n++;}
function ok(v,message){assert.ok(v,message);n++;}
eq(stage.developmentClient,false,"Standalone staging opens without a Metro dev server");
eq(stage.distribution,"internal","Staging build is internal, not App Store");
eq(stage.environment,"preview","EAS uses supported separate preview env, never production env");
eq(stage.channel,"staging","Separate OTA channel for staging");
eq(stage.env.EXPO_PUBLIC_BUSY_ENVIRONMENT,"isolated-staging","Explicit stage-only gate");
eq(stage.env.EXPO_PUBLIC_BUSY_STAGING_SUPABASE_URL,
 "https://pnjdlogwegnqbsfpcofw.supabase.co",
 "Exact staging project, no redirect or production origin");
ok(/^sb_publishable_[A-Za-z0-9_-]{15,}$/.test(
 stage.env.EXPO_PUBLIC_BUSY_STAGING_PUBLISHABLE_KEY),
 "Staging embeds only valid client-safe publishable key");
ok(!stage.env.EXPO_PUBLIC_BUSY_STAGING_PUBLISHABLE_KEY.includes("sb_secret"),
 "No secret service-role key in iOS build");
ok(!JSON.stringify(stage).includes("qgkmuiipicazmcxxmoxv")&&
   !JSON.stringify(stage).includes("rtqqnqbrqpjondvcyann"),
 "Build profile never points at either protected production project");
ok(!JSON.stringify(stage).includes("password")&&
   !JSON.stringify(stage).includes("refresh_token")&&
   !JSON.stringify(stage).includes("service_role"),
 "No private credentials or access sessions in stage EAS profile");
eq(prod.channel,"production","Production OTA channel unchanged");
eq(preview.channel,"preview","Normal preview OTA channel unchanged");
eq(develop.env.BUSY_BUILD_PROFILE,"development",
 "Normal development build environment stays intact");
ok(!prod.env.EXPO_PUBLIC_BUSY_STAGING_SUPABASE_URL,
 "Production EAS profile not modified to use staging");
const before=process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT;
try{
  process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT="isolated-staging";
  const config=c({config:app});
  eq(config.ios.bundleIdentifier,"com.busydoesit.app.staging",
     "New iOS app installs alongside normal Busy app");
  eq(config.android.package,"com.busydoesit.app.staging",
     "New Android test package independent");
  eq(config.scheme,"busydoesit-staging","Separate iOS deep-link scheme");
  eq(config.name,"Busy Does It Staging","Staging clearly identifiable");
  eq(config.extra?.eas?.projectId,app.extra?.eas?.projectId,
     "EAS Project ID preserved for existing Expo account; no new account needed");
  process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT="";
  const normal=c({config:app});
  eq(normal.ios.bundleIdentifier,app.ios.bundleIdentifier,
    "Production iOS bundle identity unchanged");
  eq(normal.name,app.name,"Normal app still has same name");
}finally{
 if(before===undefined)delete process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT;
 else process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT=before;
}
const appEntry=read("App.js");
ok(appEntry.includes('const isStaging=process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT==="isolated-staging"'),
   "Staging build is selected from an explicitly inlined mode");
ok(appEntry.includes('require("./src/staging/StagingSignInScreen").default'),
   "Staging app uses the genuine inspector screen");
ok(appEntry.includes('require("./BusyDoesItApp").default'),
   "Normal app still loads its original controller");
ok(!/\bimport\s+BusyDoesItApp/.test(appEntry),
   "No eager production-module side effects before staging gate");
const inspector=read("src/staging/stagingAuthInspectorV3131.mjs");
ok(inspector.includes('const STAGING="pnjdlogwegnqbsfpcofw"'),
 "Inspector refuses alternate third Supabase project");
ok(inspector.includes('method:"POST"')&&inspector.includes("/auth/v1/user"),
 "Full real Auth session must come from genuine Supabase");
ok(!inspector.includes("AsyncStorage")&&!inspector.includes("SecureStore"),
 "Private test session stays in memory, never in device storage");
const workflow=read(".github/workflows/production-check.yml");
ok(workflow.includes("check-staging-ios-profile-v3132.mjs"),
 "Standard CI has permanent staging iPhone profile gate");
console.log("V3.132 PASS: "+n+" isolated standalone staging iOS profile and public-key safety assertions.");
