import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {artifacts,sourceSha} from "../staging/generated/preview-worker.mjs";
import {createFictionalHostedPreviewWorker,verifiedPreviewAssets,stageBoundary}
 from "../staging/fictional-hosted-preview-worker-v3129.mjs";
const origin="https://staging.busydoesit.co.uk";
const a="91edb6db-3a02-4de4-9ba8-5c93b4e790a1";
const b="d8836a0e-fbb0-4cb9-a613-509af50eb114";
const ta="fictional_valid_owner_A_access_token_at_least_30";
const tb="fictional_valid_owner_B_access_token_at_least_30";
const env={BUSY_STAGING_SUPABASE_REF:"abcdefghijklmnopqrst",
 BUSY_PRODUCTION_SUPABASE_REF:"qgkmuiipicazmcxxmoxv",
 BUSY_OTHER_PROTECTED_SUPABASE_REF:"rtqqnqbrqpjondvcyann",
 BUSY_STAGING_EXPECTED_HOST:"staging.busydoesit.co.uk",
 BUSY_STAGING_SOURCE_SHA:sourceSha,
 BUSY_STAGING_PUBLISHABLE_KEY:"sb_publishable_offline_ci_public_not_a_real_key",
 BUSY_STAGING_OWNER_A_ID:a,BUSY_STAGING_OWNER_B_ID:b};
let n=0,calls=0;
const eq=(x,y,m)=>{assert.deepEqual(x,y,m);n++};
const yes=(x,m)=>{assert.ok(x,m);n++};
const authFetch=async(url,opts)=>{
 calls++;
 eq(url,"https://abcdefghijklmnopqrst.supabase.co/auth/v1/user","Auth targets staging");
 eq(opts.method,"GET","Auth read-only");
 eq(opts.redirect,"error","Auth redirects denied");
 eq(opts.headers.apikey,env.BUSY_STAGING_PUBLISHABLE_KEY,"Staging public key");
 const t=opts.headers.Authorization;
 return t==="Bearer "+ta?{status:200,json:async()=>({id:a})}:
 t==="Bearer "+tb?{status:200,json:async()=>({id:b})}:
 {status:401,json:async()=>({})};
};
const worker=createFictionalHostedPreviewWorker({assets:artifacts,sourceSha,authFetch});
const path=id=>origin+"/preview/"+id;
async function check(url,expected,token="",method="GET",cfg=env){
 const h=new Headers();if(token)h.set("Authorization","Bearer "+token);
 const r=await worker.fetch(new Request(url,{method,headers:h}),cfg);
 eq(r.status,expected,method+" "+url+" status");
 return r;
}
yes(verifiedPreviewAssets(artifacts,sourceSha),"Two valid versions generated");
eq(artifacts.length,2,"Two fictional websites");
const m=JSON.parse(await readFile(new URL("../staging/generated/preview-manifest.json",import.meta.url),"utf8"));
eq(m.publishedToInternet,false,"No publishing claim");
eq(m.hostedHttpsVerified,false,"No HTTPS-hosted claim");
for(const site of artifacts){
 const r=await check(path(site.id),200,site.slot==="a"?ta:tb);
 const body=await r.text();
 eq(createHash("sha256").update(body).digest("hex"),site.digest,"Exact response checksum");
 eq(r.headers.get("x-content-sha256"),site.digest,"Exact digest header");
 eq(r.headers.get("x-preview-revision"),String(site.revision),"Exact revision");
 yes(body.includes(site.slot==="a"?"Hillside Gardens":"Fire &amp; Table Catering"),"Correct escaped HTML identity");
 yes(!body.includes(site.slot==="a"?"Fire &amp; Table Catering":"Hillside Gardens"),"No foreign content");
 yes(r.headers.get("content-security-policy").includes("default-src 'none'"),"Static-only CSP");
 yes(r.headers.get("x-robots-tag").includes("noindex"),"No indexing");
 eq(r.headers.get("cache-control"),"private, no-store, max-age=0","No public cache");
}
await check(path(artifacts[0].id),404,tb);
await check(path(artifacts[1].id),404,ta);
await check(path(artifacts[0].id),401);
await check(path(artifacts[0].id),404,"fictional_expired_access_token_is_long");
await check(path(artifacts[0].id),405,ta,"POST");
await check(path(artifacts[0].id),405,ta,"DELETE");
await check(path(artifacts[0].id)+"?foo=bar",404,ta);
await check("https://busydoesit.co.uk/preview/"+artifacts[0].id,503,ta);
await check(path(artifacts[0].id),503,ta,"GET",
 {...env,BUSY_STAGING_SUPABASE_REF:env.BUSY_PRODUCTION_SUPABASE_REF});
await check(path(artifacts[0].id),503,ta,"GET",
 {...env,BUSY_STAGING_SUPABASE_REF:env.BUSY_OTHER_PROTECTED_SUPABASE_REF});
await check(path(artifacts[0].id),503,ta,"GET",
 {...env,BUSY_STAGING_SOURCE_SHA:"0".repeat(40)});
await check(path(artifacts[0].id),503,ta,"GET",
 {...env,BUSY_STAGING_PUBLISHABLE_KEY:""});
const h=await check(origin+"/__busy_staging/health",200);
const data=await h.json();
eq(data.fullAppStagingVerified,false,"Marker never claims full staging");
eq(data.genuineAuthVerifiedForThisRequest,false,"Marker never claims Auth");
eq(data.websitePublishedPublicly,false,"Marker never claims public customer site");
await check(origin+"/unknown",404,ta);
const old=calls;
await check(path(artifacts[0].id),401);
eq(calls,old,"No bearer: zero Auth requests");
eq(verifiedPreviewAssets([],sourceSha),false,"No HTML refused");
eq(verifiedPreviewAssets(artifacts,"v3.129"),false,"No branch-name source SHA");
eq(stageBoundary({},new URL(path(artifacts[0].id)),sourceSha),false,"Unconfigured stage refused");
console.log("V3.129 PASS: "+n+" generated website, real Auth verification contract, SHA-256, tenant and write-denial assertions (offline fixture only).");
