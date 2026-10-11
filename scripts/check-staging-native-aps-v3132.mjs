/**
 * Expo SDK 57: verify actual native iOS entitlements after Expo config mods.
 * Guards the Xcode signing failure in EAS build 9a441a9b-a0c2-4cce-995c-2dfbc3e82564.
 * Never runs EAS, signs with Apple, or accesses private keys.
 */
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const root=new URL("../",import.meta.url).pathname;
const source=JSON.parse(readFileSync(new URL("../app.json",import.meta.url),"utf8")).expo;
const c=require("../app.config.js");
const old=process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT;
try {
 delete process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT;
 const normal=c({config:source});
 const defaultPlugins=normal.plugins.map(x=>Array.isArray(x)?x[0]:x);
 assert.ok(defaultPlugins.includes("expo-notifications"),
  "Normal Busy Does It must keep its push notification capability");
 process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT="isolated-staging";
 const stage=c({config:source});
 const stagePlugins=stage.plugins.map(x=>Array.isArray(x)?x[0]:x);
 assert.ok(!stagePlugins.includes("expo-notifications"),
  "Staging test-only app must not request Apple Push Notifications");
 assert.equal(stage.ios.bundleIdentifier,"com.busydoesit.app.staging");
 assert.equal(stage.ios.entitlements?.["aps-environment"],undefined);
} finally {
 if(old===undefined) delete process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT;
 else process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT=old;
}
function inspect(mode){
 const clean={...process.env};
 for(const key of ["EXPO_PUBLIC_BUSY_ENVIRONMENT"]){delete clean[key];}
 if(mode==="stage")clean.EXPO_PUBLIC_BUSY_ENVIRONMENT="isolated-staging";
 const p=spawnSync("npx",["expo","config","--type","introspect","--json"],{
  cwd:root,env:clean,encoding:"utf8",maxBuffer:15*1024*1024,timeout:140000
 });
 assert.equal(p.status,0,mode+" Expo introspection failed: "+(p.stderr||"").slice(-850));
 let o;
 try{o=JSON.parse(p.stdout);}catch{
  throw new Error(mode+" Expo config introspection did not return parseable JSON");
 }
 const native=o?._internal?.modResults?.ios?.entitlements;
 assert.ok(native&&typeof native==="object",
  mode+" Expo config did not expose actual iOS entitlements");
 return {entitlements:native,keys:Object.keys(native)};
}
const stage=inspect("stage");
assert.equal(stage.entitlements["aps-environment"],undefined,
 "Staging compiled configuration still asks for Apple's APNs entitlement");
assert.ok(!stage.keys.some(k=>/aps.environment|push-notification/i.test(k)),
 "Staging must not request any other native Apple push entitlement");
const normal=inspect("normal");
assert.ok(typeof normal.entitlements["aps-environment"]==="string",
 "Normal Busy app must retain its original Expo notifications APNs entitlement");
console.log("V3.132 APNs PASS: native staging Expo introspection has no aps-environment, normal app retains its push entitlement.");
