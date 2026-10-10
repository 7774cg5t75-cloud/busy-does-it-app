import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
import {busyRuntimeCloudConfig,STOP_URL}
 from "../src/core/stagingRuntimeIsolation.mjs";
const require=createRequire(import.meta.url);
const prod="https://qgkmuiipicazmcxxmoxv.supabase.co";
const other="rtqqnqbrqpjondvcyann";
const fixture={
 environment:"isolated-staging",
 productionSupabaseUrl:prod,
 productionPublishableKey:"sb_publishable_PRODUCTION_PUBLIC_TEST_KEY",
 productionAiUrl:prod+"/functions/v1/busy-ai-intake",
 stagingSupabaseUrl:"https://abcdefghijklmnopqrst.supabase.co",
 stagingPublishableKey:"sb_publishable_STAGING_PUBLIC_TEST_KEY",
 otherProtectedSupabaseRef:other
};
let n=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const truth=(v,m)=>{assert.ok(v,m);n++};
const missing=busyRuntimeCloudConfig({...fixture,stagingSupabaseUrl:""});
eq(missing.configured,false,"Missing staging project must fail closed");
eq(missing.baseUrl,STOP_URL,"No production fallback on empty staging URL");
eq(missing.publishableKey,"","No production key fallback");
eq(missing.prodFallbackAllowed,false,"Staging explicitly disallows fallback");
eq(missing.aiUrl,STOP_URL+"/functions/v1/busy-ai-intake",
 "Unconfigured staging AI intake targets reserved unreachable domain");
const configured=busyRuntimeCloudConfig(fixture);
eq(configured.configured,true,"Separately provided staging metadata usable");
eq(configured.baseUrl,"https://abcdefghijklmnopqrst.supabase.co",
 "All backend URLs share one dedicated project");
eq(configured.publishableKey,fixture.stagingPublishableKey,
 "Staging uses only staging publishable key");
eq(configured.realSupabaseAuthVerified,false,
 "Config is not proof that real Auth works");
eq(configured.hostedStagingVerified,false,
 "Config is not proof that staging website exists");
for(const bad of [prod,"https://"+other+".supabase.co",
 "http://abcdefghijklmnopqrst.supabase.co",
 "https://abcdefghijklmnopqrst.supabase.co/auth/v1/user",
 "https://example.com",
 "https://user:password@abcdefghijklmnopqrst.supabase.co"]){
 eq(busyRuntimeCloudConfig({...fixture,stagingSupabaseUrl:bad}).configured,
  false,"Disallowed project URL or credentials cannot be staged");
}
eq(busyRuntimeCloudConfig({...fixture,stagingPublishableKey:"sb_secret_PRIVATE"}).configured,
 false,"No service-role/secret API key in mobile build");
eq(busyRuntimeCloudConfig({...fixture,stagingPublishableKey:""}).publishableKey,
 "","No missing-key fallback");
const prodDefault=busyRuntimeCloudConfig({...fixture,environment:""});
eq(prodDefault.isolated,false,"Default build keeps current development behaviour");
eq(prodDefault.baseUrl,prod,"Current nonstaging branch still points at previous cloud root");
const eas=JSON.parse(readFileSync(new URL("../eas.json",import.meta.url),"utf8"));
eq(eas.build.staging.env.EXPO_PUBLIC_BUSY_ENVIRONMENT,"isolated-staging",
 "Dedicated EAS profile enables true isolation guard");
eq(eas.build.staging.channel,"staging","No accidental production OTA channel");
eq(eas.build.staging.distribution,"internal","Staging uses internal distribution");
const configBuilder=require("../app.config.js");
const app=JSON.parse(readFileSync(new URL("../app.json",import.meta.url),"utf8")).expo;
const prev=process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT;
try{
 process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT="isolated-staging";
 const stage=configBuilder({config:app});
 eq(stage.name,"Busy Does It Staging","Staging visibly named");
 eq(stage.ios.bundleIdentifier,"com.busydoesit.app.staging",
  "iPhone staging and production apps can coexist");
 eq(stage.android.package,"com.busydoesit.app.staging",
  "Android staging and production packages distinct");
 eq(stage.scheme,"busydoesit-staging","Staging deep-link scheme distinct");
 process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT="";
 const normal=configBuilder({config:app});
 eq(normal.ios.bundleIdentifier,app.ios.bundleIdentifier,
  "Existing normal iPhone bundle identifier preserved");
 eq(normal.scheme,app.scheme,"Original deep link scheme preserved");
}finally{
 if(prev===undefined)delete process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT;
 else process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT=prev;
}
const runtime=readFileSync(new URL("../src/core/runtime.js",import.meta.url),"utf8");
truth(runtime.includes('import {busyRuntimeCloudConfig} from "./stagingRuntimeIsolation.mjs"'),
 "Real shared app runtime imports staging isolation decision");
truth(runtime.includes('process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT === "isolated-staging"'),
 "Runtime checks explicit build label, not device local settings");
truth(runtime.includes('const BUSY_SUPABASE_URL = CLOUD_CONFIG.baseUrl;'),
 "Runtime database/Auth transport uses guarded base URL");
truth(runtime.includes("const BUSY_AI_TOKEN = CLOUD_CONFIG.publishableKey;"),
 "Auth and REST never use a production key when staging");
for(const endpoint of ["busy-command","busy-social-content","busy-social-publish",
 "busy-website-publish","busy-website-design-review","busy-mini-apps",
 "busy-mini-app-link","busy-push-dispatch","busy-calendar-oauth",
 "busy-calendar-sync","busy-production-watch"]){
 truth(runtime.includes('BUSY_SUPABASE_URL+"/functions/v1/'+endpoint+'"'),
  "Runtime "+endpoint+" derives from selected project");
}
truth(runtime.includes('busy-owner-session-v3.128-isolated-staging'),
 "Test app cannot reload normal founder owner-session storage");
truth(runtime.includes('@busy-stage-user-v3128:'),
 "Staging owner cache separated from current phone cache");
console.log("V3.128 PASS: "+n+" mobile staging project, key, EAS identifier and endpoint isolation assertions.");
