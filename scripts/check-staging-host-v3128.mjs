import assert from "node:assert/strict";
import worker,{healthBoundary} from "../staging/isolated-staging-worker-v3128.mjs";
const env={
 BUSY_STAGING_SUPABASE_REF:"abcdefghijklmnopqrst",
 BUSY_PRODUCTION_SUPABASE_REF:"zyxwvutsrqponmlkjihg",
 BUSY_OTHER_PROTECTED_SUPABASE_REF:"mnbvcxzlkjhgfdsapoiu",
 BUSY_STAGING_EXPECTED_HOST:"staging.busydoesit.co.uk",
 BUSY_STAGING_SOURCE_SHA:"a".repeat(40)
};
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const ok=(v,m)=>{assert.ok(v,m);n++};
const url="https://staging.busydoesit.co.uk/__busy_staging/health";
eq(healthBoundary(env,new URL(url)),true,"Distinct project/host and commit satisfy marker-only guard");
eq(healthBoundary({...env,BUSY_STAGING_SUPABASE_REF:env.BUSY_PRODUCTION_SUPABASE_REF},
 new URL(url)),false,"Same project must fail");
eq(healthBoundary({...env,BUSY_STAGING_SUPABASE_REF:env.BUSY_OTHER_PROTECTED_SUPABASE_REF},
 new URL(url)),false,"Another protected project may not become staging");
eq(healthBoundary({...env,BUSY_STAGING_SOURCE_SHA:"v3.128"},new URL(url)),
 false,"Version labels cannot replace a pinned source commit");
eq(healthBoundary({...env,BUSY_STAGING_EXPECTED_HOST:"busydoesit.co.uk"},
 new URL("https://busydoesit.co.uk/__busy_staging/health")),false,
 "Public BUSY root domain forbidden");
eq(healthBoundary({...env,BUSY_STAGING_EXPECTED_HOST:"sites.busydoesit.co.uk"},
 new URL("https://sites.busydoesit.co.uk/__busy_staging/health")),false,
 "Production site subdomain forbidden");
eq(healthBoundary(env,new URL("http://staging.busydoesit.co.uk/__busy_staging/health")),
 false,"HTTPS-only stage host");
eq(healthBoundary(env,new URL("https://elsewhere.example/__busy_staging/health")),
 false,"No other host accepted");
async function request(url,method="GET",scope=env){
 const res=await worker.fetch(new Request(url,{method}),scope);
 return {status:res.status,headers:res.headers,data:await res.text()};
}
const ready=await request(url);
eq(ready.status,200,"Staging marker responds only with valid separate environment");
const marker=JSON.parse(ready.data);
eq(marker.status,"marker-ready","Clearly just a staging route marker");
eq(marker.cloudAuthenticationVerified,false,"Never claim Supabase tested from marker");
eq(marker.websitePublishingReady,false,"Never claim hosted website builder from marker");
ok(!ready.data.includes("abcdefghijklmnopqrst"),
 "No public exposure of new staging project reference");
eq(ready.headers.get("cache-control"),"private, no-store, max-age=0",
 "Health response not cacheable");
ok(ready.headers.get("x-robots-tag").includes("noindex"),
 "Staging marker excluded from indexing");
eq((await request(url,"HEAD")).status,200,"HEAD supported without data");
eq((await request(url,"POST")).status,405,"Writes denied");
eq((await request("https://staging.busydoesit.co.uk/")).status,404,
 "No general website serving at staging marker");
eq((await request(url+"?foo=bar")).status,404,"No query param ambiguity");
eq((await request(url,"GET",{...env,BUSY_STAGING_SOURCE_SHA:""})).status,503,
 "Missing config fails closed");
const script=await import("node:fs");
const config=script.readFileSync(new URL("../staging/wrangler.staging.example.toml",import.meta.url),"utf8");
ok(config.includes("workers_dev = false"),"No implicit worker.dev route");
ok(!config.includes("zone_id =")&&!config.includes("account_id ="),
 "Deployment credentials deliberately absent");
console.log("V3.128 PASS: "+n+" staging-only hostname, no-write health marker and honest evidence assertions.");
