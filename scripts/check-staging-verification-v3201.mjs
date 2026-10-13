import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessStagingSchemaReadiness,STAGING_REF,BASE,JOURNEY,EXT,
 REQUIRED_MIGRATIONS} from "../src/core/stagingSchemaReadinessV3201.mjs";
import {BASE_URL,SYNTHETIC_NAME,preflightIsolatedFirstAppRace,
 evaluateIsolatedFirstAppRace}
 from "../src/core/stagingFirstAppRaceV3201.mjs";
import {runIsolatedRace,SAFE_ENDPOINT,APPROVAL}
 from "./run-isolated-first-app-race-v3201.mjs";
import {assessStagingRequestReadbacks}
 from "../src/core/stagingRequestReadbacksV3201.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const project=STAGING_REF,now=Date.parse("2026-10-13T07:35:00Z");
let checks=0;
function ok(v,m){assert.ok(v,m);checks++;}
function eq(a,b,m){assert.deepEqual(a,b,m);checks++;}
const b="00000000-0000-4000-8000-000000003201";
const a="00000000-0000-4000-8000-000000003202";
const rid="00000000-0000-4000-8000-000000003203";
const status=(app)=>({ok:true,businessId:b,role:"owner",app,
 publicProfile:{profile:{businessName:SYNTHETIC_NAME}}});
const app={id:a,business_id:b,app_key:"main",status:"draft",
 discoverable:false,draft_revision:2};
const observed={projectRef:project,source:"direct_supabase_staging_read_only",
 observedAt:"2026-10-13T07:30:33.632Z",
 publicTables:["busy_staging_rls_canary"],
 migrations:["staging_canary_owner_read_v3130",
 "restrict_staging_rls_event_helper_v3130"],
 extensions:["pgcrypto"],functions:[],uniqueConstraints:[],
 canaryPreserved:true,backupVerified:false,
 fullMigrationReviewComplete:false,authRolesReviewed:false,
 ownerApprovedInstall:false,
 isolatedEdgeDeployed:false,syntheticFixtureVerified:false};
const blocked=assessStagingSchemaReadiness(observed,now);
ok(blocked.ok);
eq(blocked.expectedProjectRef,project);
eq(blocked.schemaComplete,false);
eq(blocked.canRunFirstAppConcurrencyTest,false);
eq(blocked.canRunRealCustomerJourney,false);
ok(blocked.missingBase.includes("busy_mini_apps"));
ok(blocked.missingBase.includes("busy_public_business_profiles"));
ok(blocked.missingJourney.includes("busy_staging_qa_runs"));
ok(blocked.missingMigrations.includes("v3199_atomic_first_private_app"));
ok(blocked.missingExtensions.includes("pgmq"));
eq(blocked.atomicRpcPresent,false);
eq(blocked.uniqueFirstAppKeyPresent,false);
eq(blocked.noSchemaChanged,true);
eq(blocked.noAutomaticMigrationExecution,true);
for(const change of [
 {projectRef:"wrong"},
 {source:"owner_says_staging"},
 {observedAt:"2026-10-10T08:00:00Z"},
 {observedAt:"2026-10-20T12:00:00Z"},
 {publicTables:"many"},
 {functions:[null]},
 {migrations:Array.from({length:2001},()=> "x")},
])eq(assessStagingSchemaReadiness({...observed,...change},now).ok,false);
const complete={...observed,publicTables:[...BASE,...JOURNEY],
 migrations:[...REQUIRED_MIGRATIONS],
 extensions:[...EXT],
 functions:["busy_create_first_mini_app_draft_v3199"],
 uniqueConstraints:["busy_mini_apps_business_id_app_key_key"],
 backupVerified:true,fullMigrationReviewComplete:true,
 authRolesReviewed:true,ownerApprovedInstall:true,
 isolatedEdgeDeployed:true,syntheticFixtureVerified:true};
const ready=assessStagingSchemaReadiness(complete,now);
ok(ready.ok);eq(ready.schemaComplete,true);
eq(ready.canRunFirstAppConcurrencyTest,true);
eq(ready.canRunRealCustomerJourney,false);
eq(ready.realJwtAuthorizationVerified,false);
eq(ready.realAppCreated,false);
eq(assessStagingSchemaReadiness({...complete,ownerApprovedInstall:false},now)
 .canRunFirstAppConcurrencyTest,false);
eq(assessStagingSchemaReadiness({...complete,isolatedEdgeDeployed:false},now)
 .canRunFirstAppConcurrencyTest,false);
eq(assessStagingSchemaReadiness({...complete,syntheticFixtureVerified:false},now)
 .canRunFirstAppConcurrencyTest,false);
eq(assessStagingSchemaReadiness({...complete,
 functions:[]},now).canRunFirstAppConcurrencyTest,false);
eq(assessStagingSchemaReadiness({...complete,
 uniqueConstraints:[]},now).canRunFirstAppConcurrencyTest,false);
const before=status(null),after=status(app);
const preflight=preflightIsolatedFirstAppRace({
 projectRef:project,baseUrl:BASE_URL+"/",businessId:b,
 ownerApproved:true,verifiedSyntheticBusiness:true,ownerStatus:before
});
ok(preflight.ok);eq(preflight.mayMakeCustomerRequests,false);
for(const override of [
 {projectRef:"another"},
 {baseUrl:"https://evil.example/"},
 {baseUrl:BASE_URL+"/redirect"},
 {baseUrl:"http://"+project+".supabase.co/"},
 {businessId:"not-a-uuid"},
 {ownerApproved:false},
 {verifiedSyntheticBusiness:false},
 {ownerStatus:status(app)},
 {ownerStatus:{...before,businessId:"another"}},
 {ownerStatus:{...before,role:"member"}},
 {ownerStatus:{...before,publicProfile:{profile:{businessName:"Real business"}}}},
])eq(preflightIsolatedFirstAppRace({
 projectRef:project,baseUrl:BASE_URL+"/",businessId:b,
 ownerApproved:true,verifiedSyntheticBusiness:true,ownerStatus:before,...override}).ok,false);
const winner={ok:true,atomicFirstCreate:true,app};
const loser={ok:false,httpStatus:400};
const evaluated=evaluateIsolatedFirstAppRace({
 businessId:b,before,responses:[winner,loser],after});
ok(evaluated.ok);
eq(evaluated.exactlyOneSuccessObserved,true);
eq(evaluated.databaseRowCountIndependentlyAudited,false);
eq(evaluated.customerJourneyVerified,false);
for(const caseInput of [
 {responses:[winner,winner]},
 {responses:[winner,{...winner,app:{...app,id:rid}}]},
 {responses:[loser,loser]},
 {responses:[winner,{ok:true}]},
 {after:status({...app,draft_revision:3})},
 {before:status(app)},
 {after:status({...app,discoverable:true})},
 {after:status({...app,business_id:"another"})},
 {businessId:"another"},
])eq(evaluateIsolatedFirstAppRace({businessId:b,before,
 responses:[winner,loser],after,...caseInput}).ok,false);
const offline=await runIsolatedRace({argv:[],env:{},
 fetchImpl:()=>{throw Error("Network MUST never be reached in no-op");}});
ok(offline.ok);eq(offline.networkRequests,0);
eq(offline.executionPermitted,false);
let transportCalls=0;
const settings={BDI_STAGING_TEST_BUSINESS_ID:b,
 BDI_STAGING_OWNER_JWT:"synthetic.jwt.signature",
 BDI_STAGING_PUBLISHABLE_KEY:"sb_publishable_STAGING_KEY_EXAMPLE_LONG",
 BDI_STAGING_RACE_APPROVAL:APPROVAL};
await assert.rejects(()=>runIsolatedRace({argv:["--run-against-staging"],
 env:{...settings,BDI_STAGING_RACE_APPROVAL:"no"},
 fetchImpl:()=>{transportCalls++;}}));checks++;
eq(transportCalls,0);
const calls=[];
const mock=async(url,options)=>{
 calls.push({url,action:JSON.parse(options.body).action,
  headerNames:Object.keys(options.headers),redirect:options.redirect,
  payload:JSON.parse(options.body)});
 const index=calls.length;
 const payload=index===1?before:
  index===2?winner:index===3?loser:after;
 return {ok:index!==3,status:index===3?400:200,
  json:async()=>payload};
};
const result=await runIsolatedRace({argv:["--run-against-staging"],
 env:settings,fetchImpl:mock,uid:()=>rid});
ok(result.ok);
eq(result.networkRequests,4);
eq(result.exactlyOneSuccessObserved,true);
eq(result.noCustomerRequestsSent,true);
eq(result.noProductionConnections,true);
eq(result.externalProviderCalls,0);
eq(calls.length,4);
ok(calls.every(x=>x.url===SAFE_ENDPOINT&&x.redirect==="error"));
eq(calls.map(x=>x.action),["owner_status","build_draft","build_draft","owner_status"]);
ok(calls.slice(1,3).every(x=>x.payload.expectedNoExistingApp===true));
ok(calls.every(x=>x.payload.businessId===b));
ok(calls.slice(1,3).every(x=>x.payload.profileDraft.businessName===SYNTHETIC_NAME));
ok(!JSON.stringify(result).includes("synthetic.jwt.signature"));
const wrong=async()=>({ok:true,status:200,json:async()=>status(app)});
await assert.rejects(()=>runIsolatedRace({argv:["--run-against-staging"],
 env:settings,fetchImpl:wrong,uid:()=>rid}));checks++;
const request={id:rid,business_id:b,mini_app_id:a,
 request_type:"enquiry",status:"received"};
const okReq={ok:true,reused:false,request};
const replay={ok:true,reused:true,request};
const owner={ok:true,businessId:b,role:"owner",app,
 requests:[request]};
const customerDetail={ok:true,detail:{request}};
const record=assessStagingRequestReadbacks({
 businessId:b,appId:a,kind:"enquiry",first:okReq,replay,
 ownerSnapshot:owner,customerDetail});
ok(record.ok,record.reason);
eq(record.idempotentRetryObserved,true);
eq(record.ownerInboxReadbackObserved,true);
eq(record.customerReadbackObserved,true);
eq(record.verifiedExternalNotificationDelivery,false);
eq(record.endToEndCustomerOutcomeVerified,false);
eq(record.noContentOrPIIReturned,true);
for(const override of [
 {businessId:"other"},
 {appId:"other"},
 {kind:"booking_request"},
 {replay:{...replay,reused:false}},
 {replay:{...replay,request:{...request,id:a}}},
 {first:{...okReq,request:{...request,business_id:"other"}}},
 {ownerSnapshot:{...owner,requests:[]}},
 {ownerSnapshot:{...owner,role:"member"}},
 {ownerSnapshot:{...owner,businessId:"other"}},
 {customerDetail:{...customerDetail,ok:false}},
])eq(assessStagingRequestReadbacks({
 businessId:b,appId:a,kind:"enquiry",first:okReq,replay,
 ownerSnapshot:owner,customerDetail,...override}).ok,false);
const sql=read("staging/READ_ONLY_v3201_schema_inventory.sql");
ok(sql.includes("pg_catalog.pg_class"));
ok(sql.includes("pg_catalog.pg_constraint"));
ok(sql.includes("busy_create_first_mini_app_draft_v3199"));
const statement=sql.replace(/--[^\n]*/g,"");
ok(!/\b(create|alter|drop|update|delete|insert|truncate|grant|revoke|copy)\b/i.test(statement),
 "Read-only schema inventory must never perform SQL mutations");
const cli=read("scripts/run-isolated-first-app-race-v3201.mjs");
ok(cli.includes("redirect:\"error\""));
ok(cli.includes('argv[0]!=="--run-against-staging"'));
ok(cli.includes("BDI_STAGING_RACE_APPROVAL"));
ok(cli.includes('api("owner_status")'));
ok(cli.includes('api("build_draft"'));
ok(!cli.includes('api("publish"'));
console.log("V3.201 "+checks+" staging dependency, isolation, "+
 "synthetic first-app concurrency, request receipt and no-network default contracts PASS.");
