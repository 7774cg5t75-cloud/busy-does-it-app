/**
 * V3.128 catches future accidental direct production endpoint references
 * in customer-facing JS. Public project references are not secret, but
 * a staging build must route through the shared environment boundary.
 */
import assert from "node:assert/strict";
import {readdirSync,readFileSync} from "node:fs";
import {join,resolve,relative} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(fileURLToPath(new URL("../src/",import.meta.url)));
const allowRefIn=new Set(["core/runtime.js"]);
const productionRefs=[
 "qgkmuiipicazmcxxmoxv.supabase.co",
 "rtqqnqbrqpjondvcyann.supabase.co"
];
const paths=[];
function walk(dir){
 for(const ent of readdirSync(dir,{withFileTypes:true})){
  const p=join(dir,ent.name);
  if(ent.isDirectory())walk(p);
  else if(/\.(mjs|js)$/.test(ent.name))paths.push(p);
 }
}
walk(root);
const offenders=[];
for(const path of paths){
 const label=relative(root,path).replaceAll("\\","/");
 if(allowRefIn.has(label))continue;
 const code=readFileSync(path,"utf8");
 for(const projectHost of productionRefs){
  if(code.includes(projectHost))offenders.push({source:label,kind:"fixed-supabase-host"});
 }
}
assert.deepEqual(offenders,[],
 "Stage-isolation regression: application modules must derive cloud URLs from the shared runtime, not hard-coded active projects");
const runtime=readFileSync(join(root,"core/runtime.js"),"utf8");
assert.ok(runtime.includes('const BUSY_SUPABASE_URL = CLOUD_CONFIG.baseUrl;'),
 "Cloud origin must be selected by guarded runtime config");
assert.ok(runtime.includes("if (IS_STAGING_BUILD && !CLOUD_CONFIG.configured)"),
 "Disconnected staging build must abort shared network transport before fetch");
assert.ok(runtime.includes('const BUSY_AI_TOKEN = CLOUD_CONFIG.publishableKey;'),
 "No production publishable-key fallback for staging");
console.log("V3.128 PASS: "+paths.length+" application JS modules checked; no hard-coded active cloud host outside guarded runtime.");
