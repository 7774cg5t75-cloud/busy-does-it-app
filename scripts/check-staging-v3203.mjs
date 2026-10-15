import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {compileMigrationRiskLedger}
 from "../src/core/stagingSqlRiskLedgerV3203.mjs";
import {checkTenantProbeConfig,runTenantReadProbe,
 HOST,SAFE_EDGE,APPROVAL,NAME_A,NAME_B}
 from "../src/core/stagingTwoTenantAppProbeV3203.mjs";
import {checkCustomerRequestReplay}
 from "../supabase/functions/busy-mini-apps/customerRequestReplayV3203.mjs";
const ROOT=fileURLToPath(new URL("../",import.meta.url));
const read=p=>readFileSync(join(ROOT,p),"utf8");
let checks=0;
function eq(a,b){assert.deepEqual(a,b);checks++;}
function ok(v,m){assert.ok(v,m);checks++;}
const files=readdirSync(join(ROOT,"supabase/migrations")).filter(x=>x.endsWith(".sql")).sort()
 .map(name=>({name,sql:read("supabase/migrations/"+name)}));
const report=compileMigrationRiskLedger(files);
ok(report.ok,report.reason);eq(report.fileCount,69);
eq(report.approvedToInstall,false);eq(report.executedSql,false);
ok(report.filesFlagged>30);ok(report.sideEffectSensitiveFiles>1);
ok(report.categories.privileged_function>0);
ok(report.categories.table_grant>0);
ok(report.categories.cron_schedule>0);
ok(report.categories.sql_extension>0);
ok(report.categories.external_http>0);
const rpc=report.files.find(x=>x.filename.includes("v3199_atomic_first_private_app"));
ok(rpc.needsHumanReview);ok(rpc.signals.some(x=>x.category==="privileged_function"));
ok(rpc.signals.every(x=>x.lines.every(n=>Number.isSafeInteger(n)&&n>0)));
const synthetic=compileMigrationRiskLedger([{
 name:"20261013000000_example.sql",
 sql:"-- cron.schedule('fake')\nselect 1;\ncreate extension if not exists pgcrypto;\nselect cron.schedule('test','* * * * *', 'select 1');\n"
}]);
ok(synthetic.ok);
eq(synthetic.files[0].signals.some(x=>x.category==="cron_schedule"),true);
eq(synthetic.files[0].signals.find(x=>x.category==="cron_schedule").lines,[4]);
eq(compileMigrationRiskLedger([{name:"bad.sql",sql:"select 1"}]).ok,false);
eq(compileMigrationRiskLedger([files[0],files[0]]).ok,false);
const user="00000000-0000-4000-8000-000000003203";
const b="00000000-0000-4000-8000-000000003204";
const app="00000000-0000-4000-8000-000000003205";
const payload={name:"Alice",email:"a@example.invalid",phone:"",
 service:"Consultation",message:"Can I ask about a service?"};
const saved={id:"request-1",business_id:b,mini_app_id:app,consumer_user_id:user,
 request_type:"enquiry",module_key:"enquiry",payload};
const input={businessId:b,appId:app,consumerUserId:user,
 requestType:"enquiry",moduleKey:"enquiry",payload};
const replay=checkCustomerRequestReplay({existing:saved,...input});
ok(replay.ok);eq(replay.reused,true);
eq(replay.notificationNotRetried,true);
for(const value of [
 {businessId:"other"},
 {appId:"other"},
 {consumerUserId:"other"},
 {requestType:"booking_request"},
 {moduleKey:"booking_request"},
 {payload:{...payload,message:"Different question"}},
 {payload:{...payload,email:"someoneelse@example.invalid"}},
 {payload:{...payload,note:"extra"}},
 {existing:{...saved,business_id:"other"}},
 {existing:{...saved,request_type:"booking_request"}},
 {existing:{...saved,payload:{...payload,message:"Edited"}}}
]){const q=checkCustomerRequestReplay({existing:saved,...input,...value});
 eq(q.ok,false);eq(q.mayInsertAnotherRequest,false);}
const bookingPayload={name:"Sam",email:"",phone:"01234",
 service:"Haircut",preferredDate:"2026-11-02",note:"Afternoon preferred"};
ok(checkCustomerRequestReplay({businessId:b,appId:app,consumerUserId:user,
 requestType:"booking_request",moduleKey:"booking_request",
 payload:bookingPayload,existing:{...saved,request_type:"booking_request",
 module_key:"booking_request",payload:bookingPayload}}).ok);
const aa="11111111-1111-4111-8111-111111111111";
const bb="22222222-2222-4222-8222-222222222222";
const ba="33333333-3333-4333-8333-333333333333";
const bc="44444444-4444-4444-8444-444444444444";
const tokenA="aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbb.ccccccccccccccccc";
const tokenB="dddddddddd.eeeeeeeeeeeeeeeeeeee.ffffffffffffffffff";
const env={BDI_STAGING_TENANT_READ_APPROVAL:APPROVAL,
 BDI_STAGING_OWNER_A_ID:aa,BDI_STAGING_OWNER_B_ID:bb,
 BDI_STAGING_BUSINESS_A_ID:ba,BDI_STAGING_BUSINESS_B_ID:bc,
 BDI_STAGING_OWNER_A_JWT:tokenA,BDI_STAGING_OWNER_B_JWT:tokenB,
 BDI_STAGING_PUBLISHABLE_KEY:"sb_publishable_STAGING_PUBLIC_TEST_VALID"};
eq(checkTenantProbeConfig({env,argv:["--verify-owners-read-only"]}).runAllowed,true);
const inspected=JSON.stringify(checkTenantProbeConfig({env,argv:["--verify-owners-read-only"]}));
ok(!inspected.includes(tokenA));ok(!inspected.includes(tokenB));
ok(!inspected.includes(env.BDI_STAGING_PUBLISHABLE_KEY));
let calls=0;
const noOp=await runTenantReadProbe({argv:[],env:{},fetchImpl:()=>{calls++;throw Error("No network allowed");}});
ok(noOp.ok);eq(noOp.requestsMade,0);eq(calls,0);
const blocked=await runTenantReadProbe({argv:["--verify-owners-read-only"],
 env:{...env,BDI_STAGING_TENANT_READ_APPROVAL:"no"},
 fetchImpl:()=>{calls++;throw Error("No network allowed");}});
eq(blocked.ok,false);eq(calls,0);
const trace=[];
const fixture=async(url,options)=>{
 trace.push({url,method:options.method,redirect:options.redirect,body:options.body});
 const auth=options.headers.Authorization==="Bearer "+tokenA?aa:
 options.headers.Authorization==="Bearer "+tokenB?bb:"unknown";
 if(url.endsWith("/auth/v1/user"))return {status:200,json:async()=>({id:auth})};
 if(url!==SAFE_EDGE)throw Error("Unexpected destination");
 const body=JSON.parse(options.body);
 if(body.action!=="owner_status")throw Error("Unexpected action");
 const own=(auth===aa&&body.businessId===ba)||(auth===bb&&body.businessId===bc);
 return own?{status:200,json:async()=>({
  ok:true,businessId:body.businessId,role:"owner",app:null,
  publicProfile:{business_id:body.businessId,
   profile:{businessName:auth===aa?NAME_A:NAME_B}},
  requests:[{contact_email:"SENSITIVE_NOT_FOR_LOG"}]
 })}:{status:400,json:async()=>({error:"not a member"})};
};
const good=await runTenantReadProbe({env,argv:["--verify-owners-read-only"],fetchImpl:fixture});
ok(good.ok,good.reason);eq(good.requestsMade,6);
eq(good.actualTenantJWTVerified,true);
eq(good.crossTenantDeniedBothDirections,true);
eq(good.noCustomerWrites,true);
eq(good.customerRequestDelivered,false);
ok(trace.every(x=>x.url.startsWith(HOST+"/")&&x.redirect==="error"));
eq(trace.filter(x=>x.method==="POST").length,4);
ok(trace.filter(x=>x.method==="POST").every(x=>JSON.parse(x.body).action==="owner_status"));
ok(!JSON.stringify(good).includes("SENSITIVE_NOT_FOR_LOG"));
ok(!JSON.stringify(good).includes(tokenA));
ok(!JSON.stringify(good).includes(tokenB));
let attempts=0;
const badIdentity=await runTenantReadProbe({env,argv:["--verify-owners-read-only"],
 fetchImpl:async(url,options)=>{
  attempts++;if(url.endsWith("/auth/v1/user"))return {status:200,json:async()=>({id:bc})};
  return fixture(url,options);
 }});
eq(badIdentity.ok,false);eq(attempts,2);
const published=await runTenantReadProbe({env,argv:["--verify-owners-read-only"],
 fetchImpl:async(url,options)=>{
  if(url===SAFE_EDGE){
   const body=JSON.parse(options.body);
   const own=options.headers.Authorization==="Bearer "+tokenA?ba:bc;
   if(body.businessId===own)return {status:200,json:async()=>({
    ok:true,businessId:own,role:"owner",
    publicProfile:{business_id:own,profile:{businessName:own===ba?NAME_A:NAME_B}},
    app:{id:"55555555-5555-4555-8555-555555555555",business_id:own,
     status:"live",discoverable:true}
   })};
   return {status:400,json:async()=>({error:"denied"})};
  }
  return fixture(url,options);
 }});
eq(published.ok,false);
const edge=read("supabase/functions/busy-mini-apps/index.ts");
const controller=read("src/app/AppController.js");
ok(edge.includes('import {checkCustomerRequestReplay} from "./customerRequestReplayV3203.mjs"'));
ok(edge.includes("if(!replay.ok)throw Error(replay.reason)"));
ok(edge.includes("savedRequestConfirmed:requestEvidence?.verifiedSaved===true,"));
ok(edge.includes("eventRecorded,"));
ok(edge.includes("notificationDeliveryVerified:false"));
ok(edge.indexOf("if (requestId) {",edge.indexOf("async function submitRequest("))<
 edge.indexOf("const since = new Date(",edge.indexOf("async function submitRequest(")));
ok(controller.includes('requestKey:key'));
ok(controller.includes('customerRequestPendingRef.current=null;'));
ok(controller.includes('customerRequestInFlightRef.current=attempt;'));
ok(controller.includes('customerRequestInFlightRef.current===attempt'));
ok(controller.includes('isCurrent:scopeStillCurrent'));
ok(controller.includes('Check My BUSY Apps before retrying'));
const sql=read("staging/READ_ONLY_v3203_post_phase_attestation.sql");
ok(sql.includes("busy_create_first_mini_app_draft_v3199"));
ok(sql.includes("unique_first_app_business_key_count"));
ok(sql.includes("preserved_canary_row_count"));
ok(!/(^|\n)\s*(?:insert|update|delete|alter|drop|create|grant|revoke|truncate)\b/im.test(sql.replace(/--[^\n]*/g,"")));
console.log("V3.203 "+checks+" migration risk, two-owner staging, request idempotency and read-only proof contracts PASS.");
