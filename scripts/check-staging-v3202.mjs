import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {prepareStagingInstallSequence}
 from "../src/core/stagingInstallSequenceV3202.mjs";
import {assessSyntheticStagingAction}
 from "../src/core/stagingActionGateV3202.mjs";
import {runStagingAuthEvidence,APPROVAL}
 from "./run-staging-auth-evidence-v3202.mjs";
import {STAGING_REF}
 from "../src/core/stagingSchemaReadinessV3201.mjs";
const ROOT=fileURLToPath(new URL("../",import.meta.url));
const read=p=>readFileSync(join(ROOT,p),"utf8");
const recorded=JSON.parse(read("staging/recorded-readonly-observation-v3202.json"));
const observed={...recorded,tables:recorded.publicTables};
const migrations=readdirSync(join(ROOT,"supabase/migrations"))
 .filter(n=>n.endsWith(".sql")).sort()
 .map(name=>({name,sql:read("supabase/migrations/"+name)}));
let count=0;
const ok=(v,m)=>{assert.ok(v,m);count++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++};
const plan=prepareStagingInstallSequence({...observed,migrations,
 baselineSql:read("staging/ISOLATED_ONLY_business_core_v3180.sql"),
 packageVerified:true});
ok(plan.ok,plan.reason);
eq(plan.projectRef,STAGING_REF);
eq(plan.migrationCount,migrations.length);
eq(plan.migrationCount,65);
eq(plan.expectedFileCount,66);
eq(plan.phases.length,4);
eq(plan.phases.map(x=>x.orderedStep),[1,2,3,4]);
eq(plan.phases.reduce((a,p)=>a+p.sourceFileCount,0),66);
ok(plan.phases[0].files[0].includes("business_core_v3180"));
ok(plan.phases[1].files.every(x=>!x.includes("v3_39_busy_apps")));
ok(plan.phases[2].files[0].includes("v3_39_busy_apps_marketplace"));
ok(plan.phases[3].files[0].includes("v3_180_atomic_business_app_handoff"));
ok(plan.phases[3].files.at(-1).includes("v3199_atomic_first_private_app"));
eq(plan.automaticSqlExecution,false);eq(plan.installationAuthorised,false);
eq(plan.databaseWrites,0);eq(plan.migrationsApplied,0);
eq(plan.productionTouched,false);eq(plan.permissionToDeployEdge,false);
ok(plan.riskCategoryCounts.privileged_routines>0);
ok(plan.riskCategoryCounts.privileges_or_policies>0);
ok(plan.riskCategoryCounts.scheduled_work>0);
ok(plan.missingExtensions.includes("pgmq"));
ok(plan.missingExtensions.includes("pg_cron"));
ok(plan.missingExtensions.includes("pg_net"));
for(const bad of [
 {projectRef:"wrong"},
 {source:"unverified_user_notes"},
 {tables:[]},
 {tables:["busy_staging_rls_canary","busy_mini_apps"]},
 {ledger:[...observed.ledger,"20261013120000"]},
 {canaryPreserved:false},
 {packageVerified:false}
]){
 const r=prepareStagingInstallSequence({...observed,migrations,
  baselineSql:read("staging/ISOLATED_ONLY_business_core_v3180.sql"),
  packageVerified:true,...bad});
 eq(r.ok,false,"Unsafe installation inventory must fail closed.");
 eq(r.installationAuthorised,false);
}
const noFirst=migrations.filter(x=>!x.name.includes("v3199_atomic_first_private_app"));
eq(prepareStagingInstallSequence({...observed,migrations:noFirst,
 baselineSql:read("staging/ISOLATED_ONLY_business_core_v3180.sql"),
 packageVerified:true}).ok,false);
const appId="00000000-0000-4000-8000-000000003202";
const businessId="00000000-0000-4000-8000-000000003203";
const app={id:appId,business_id:businessId,draft_revision:5};
const p={ok:true,businessId,appId,draftRevision:5,
 stagingConnectionVerified:true,noRequestsSubmitted:true};
const named=["apps","website_deployments","app_owner_history",
 "website_owner_history","synthetic_qa"];
const audit={ok:true,businessId,appId,draftRevision:5,
 readOnly:true,source:"authenticated_staging_server_schema_read_only",
 kind:"isolated_staging_install_audit_v3178",
 installationReadyForSyntheticTesting:true,
 checks:named.map(id=>({id,status:"reachable"}))};
const gate=assessSyntheticStagingAction({businessId,app,probe:p,install:audit});
ok(gate.ok,gate.why);
eq(gate.customerRequestAllowed,false);
eq(gate.installationPermitted,false);
eq(gate.needsNewOwnerConfirmation,true);
for(const bad of [
 {businessId:"another"},
 {app:{...app,draft_revision:6}},
 {app:{...app,business_id:"another"}},
 {app:{...app,id:"malformed"}},
 {probe:null},{probe:{...p,businessId:"another"}},
 {probe:{...p,appId:"another"}},
 {probe:{...p,draftRevision:4}},
 {probe:{...p,stagingConnectionVerified:false}},
 {install:null},{install:{...audit,businessId:"another"}},
 {install:{...audit,draftRevision:4}},
 {install:{...audit,source:"user_attested"}},
 {install:{...audit,installationReadyForSyntheticTesting:false}},
 {install:{...audit,checks:audit.checks.slice(1)}},
 {install:{...audit,checks:[...audit.checks.slice(0,4),{
  id:"synthetic_qa",status:"unavailable"}]}}
]){
 const r=assessSyntheticStagingAction({businessId,app,probe:p,
  install:audit,...bad});
 eq(r.ok,false);
 eq(r.mayRunSyntheticWrite,false);
}
const noOp=await runStagingAuthEvidence({argv:[],env:{},
 fetchImpl:()=>{throw Error("No network should happen in default mode");}});
ok(noOp.ok);eq(noOp.networkRequests,0);
eq(noOp.authenticatedTenantIsolationVerified,false);
const denied=await runStagingAuthEvidence({
 argv:["--verify-read-only"],env:{BDI_STAGING_TWO_OWNER_READ_APPROVAL:"no"},
 fetchImpl:()=>{throw Error("Invalid approval must not contact network");}
});
eq(denied.ok,false);eq(denied.realEndpointContacted,false);
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const rowA="20f9279e-0dcf-4b1b-aad0-4952c4aab332";
const rowB="0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf";
const tokenA="fictional-owner-a-token-but-really-long-1";
const tokenB="fictional-owner-b-token-but-really-long-2";
const rejectedToken="fictional-rejected-token-but-long-3";
const env={
 BDI_STAGING_TWO_OWNER_READ_APPROVAL:APPROVAL,
 BDI_STAGING_PUBLISHABLE_KEY:"sb_publishable_EXAMPLE_LONG_PUBLIC_ONLY",
 BDI_STAGING_OWNER_A_ID:a,BDI_STAGING_OWNER_B_ID:b,
 BDI_STAGING_OWNER_A_JWT:tokenA,BDI_STAGING_OWNER_B_JWT:tokenB,
 BDI_STAGING_REJECTED_JWT:rejectedToken,
 BDI_STAGING_SOURCE_SHA:"a".repeat(40)
};
const calls=[];
const mockFetch=async(url,options)=>{
 calls.push({url,method:options.method,redirect:options.redirect,
  auth:options.headers.Authorization||""});
 const auth=options.headers.Authorization||"";
 const own=auth==="Bearer "+tokenA?a:auth==="Bearer "+tokenB?b:null;
 const invalid=auth==="Bearer "+rejectedToken;
 if(url.endsWith("/auth/v1/user")){
  return own?{status:200,json:async()=>({id:own})}:
   {status:invalid?401:403,json:async()=>({error:"access denied"})};
 }
 if(url.includes("/rest/v1/busy_staging_rls_canary")){
  if(!own)return {status:403,json:async()=>({error:"no access"})};
  const id=new URL(url).searchParams.get("id")?.replace("eq.","");
  const matching=(own===a&&id===rowA)||(own===b&&id===rowB);
  return {status:200,json:async()=>matching?[{id,owner_id:own}]:[]};
 }
 throw Error("Unknown endpoint");
};
const auth=await runStagingAuthEvidence({
 argv:["--verify-read-only"],env,fetchImpl:mockFetch
});
ok(auth.ok,JSON.stringify(auth));
eq(auth.passed,10);eq(auth.total,10);
eq(auth.ownerJWTIdentityVerified,true);
eq(auth.canaryCrossTenantIsolationObserved,true);
eq(auth.applicationRequestIsolationVerified,false);
eq(auth.actualProviderDeliveryVerified,false);
eq(auth.approvalDoesNotPermitWrites,true);
eq(auth.productionTouched,false);
eq(calls.length,10);
ok(calls.every(c=>c.method==="GET"&&c.redirect==="error"));
ok(calls.every(c=>c.url.startsWith("https://pnjdlogwegnqbsfpcofw.supabase.co/")));
ok(calls.every(c=>!c.url.includes("token=")));
ok(!JSON.stringify(auth).includes(tokenA));
ok(!JSON.stringify(auth).includes(tokenB));
ok(!JSON.stringify(auth).includes(rejectedToken));
const wrongIdentity=await runStagingAuthEvidence({
 argv:["--verify-read-only"],env,
 fetchImpl:async(url,opts)=>{
  const r=await mockFetch(url,opts);
  if(url.endsWith("/auth/v1/user")&&opts.headers.Authorization==="Bearer "+tokenA)
   return {status:200,json:async()=>({id:b})};
  return r;
 }
});
eq(wrongIdentity.ok,false);
eq(wrongIdentity.applicationRequestIsolationVerified,false);
const ui=read("src/screens/miniApps.js");
const ctrl=read("src/app/AppController.js");
ok(ui.includes("!syntheticStagingGate.ok"));
ok(ui.includes("assessSyntheticStagingAction({"));
ok(ui.includes("setStagingProbe(null);\n    setStagingInstallAudit(null);\n    setStagingSyntheticResult(null);"));
ok(ctrl.includes("return {ok:true,businessId,appId,draftRevision:Number(expectedRevision),"));
console.log("V3.202 "+count+" staging migration, RLS JWT, latest-revision safety and no-write-default contracts PASS.");
