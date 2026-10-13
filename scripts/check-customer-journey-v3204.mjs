import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareCustomerReceipt,validRequestReceiptKey}
 from "../supabase/functions/busy-mini-apps/customerRequestReceiptV3204.mjs";
import {evaluateCustomerRequestOutcome,customerRequestNotice}
 from "../src/core/customerJourneyOutcomeV3204.mjs";
import {runStagingCustomerReceiptRead,APPROVAL,HOST,ENDPOINT}
 from "./run-staging-customer-receipt-v3204.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
const ok=(v,m)=>{assert.ok(v,m);checks++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
const user="00000000-0000-4000-8000-000000003204";
const other="00000000-0000-4000-8000-000000003205";
const app="00000000-0000-4000-8000-000000003206";
const req="00000000-0000-4000-8000-000000003207";
const slug="bdi-staging-service-v3204";
const key="customer-request-1728800000-abc123de";
const row={id:req,mini_app_id:app,consumer_user_id:user,
 idempotency_key:key,request_type:"booking_request",status:"received",
 payload:{name:"DO_NOT_RETURN",phone:"PRIVATE_NUMBER"},contact_email:"PRIVATE_EMAIL"};
const source={userId:user,appId:app,slug,requestType:"booking_request",requestKey:key};
ok(validRequestReceiptKey(key));
for(const invalid of ["","a","has spaces", "x".repeat(181),"fail?12345"])
 eq(validRequestReceiptKey(invalid),false);
const receipt=prepareCustomerReceipt({...source,row});
ok(receipt.ok);eq(receipt.found,true);
eq(receipt.verifiedSaved,true);
eq(receipt.receipt.id,req);
eq(receipt.receipt.appId,app);
eq(receipt.receipt.notificationDelivered,false);
eq(receipt.receipt.diaryConfirmed,false);
for(const word of ["DO_NOT_RETURN","PRIVATE_NUMBER","PRIVATE_EMAIL",key,user])
 ok(!JSON.stringify(receipt).includes(word));
const missing=prepareCustomerReceipt({...source,row:null});
ok(missing.ok);eq(missing.found,false);
eq(missing.verifiedSaved,false);
for(const change of [
 {userId:other},{appId:other},{requestType:"enquiry"},
 {requestKey:"other-request-key"},{slug:""},
 {row:{...row,mini_app_id:other}},
 {row:{...row,consumer_user_id:other}},
 {row:{...row,idempotency_key:"other-request-key"}},
 {row:{...row,request_type:"enquiry"}},
 {row:{...row,status:"we-made-a-sale"}},
 {row:{...row,id:"not-a-uuid"}}
])eq(prepareCustomerReceipt({...source,row,...change}).ok,false);
const readback=evaluateCustomerRequestOutcome({businessAppId:app,
 customerUserId:user,requestType:"booking_request",
 response:{ok:true,...receipt},evidenceSource:"read_only_customer_receipt"});
ok(readback.ok,readback.reason);
eq(readback.canClaimSavedRequest,true);
eq(readback.evidenceLevel,"authenticated_customer_readback");
eq(readback.canClaimNotificationDelivery,false);
eq(readback.canClaimConfirmedAppointment,false);
eq(readback.canClaimCustomerConverted,false);
eq(readback.crossTenantLearningAllowed,false);
eq(readback.businessAppId,app);
ok(customerRequestNotice(readback).includes("earlier saved request"));
ok(customerRequestNotice(readback).includes("NOT a confirmed appointment"));
const submitted=evaluateCustomerRequestOutcome({businessAppId:app,
 customerUserId:user,requestType:"booking_request",
 response:{ok:true,reused:false,savedRequestConfirmed:true,request:{
 id:req,mini_app_id:app,consumer_user_id:user,request_type:"booking_request",status:"received"}},
 evidenceSource:"submit_response"});
ok(submitted.ok);eq(submitted.canClaimSavedRequest,true);
eq(submitted.canClaimBusinessReply,false);
eq(submitted.evidenceLevel,"authenticated_submission_response");
const retry=evaluateCustomerRequestOutcome({businessAppId:app,
 customerUserId:user,requestType:"booking_request",
 response:{ok:true,reused:true,request:{
 id:req,mini_app_id:app,consumer_user_id:user,request_type:"booking_request",status:"received"}},
 evidenceSource:"submit_response"});
ok(retry.ok);
for(const change of [
 {businessAppId:other},
 // Readback is bound by the server's authenticated user filter.
 // User ID is intentionally absent from the privacy-minimal receipt.
 {requestType:"enquiry"},
 {response:{ok:true,found:false,verifiedSaved:false}},
 {response:{ok:true,...receipt,receipt:{...receipt.receipt,appId:other}}},
 {response:{ok:true,...receipt,receipt:{...receipt.receipt,status:"fake"}}},
 {response:{...receipt,ok:false}},
 {evidenceSource:"untrusted_mock"},
])eq(evaluateCustomerRequestOutcome({businessAppId:app,
 customerUserId:user,requestType:"booking_request",
 response:{ok:true,...receipt},evidenceSource:"read_only_customer_receipt",
 ...change}).ok,false);
eq(evaluateCustomerRequestOutcome({businessAppId:app,
 customerUserId:user,requestType:"booking_request",
 response:{ok:true,request:{id:req,mini_app_id:app,consumer_user_id:user,
  request_type:"booking_request",status:"received"}},
 evidenceSource:"submit_response"}).ok,false);
eq(evaluateCustomerRequestOutcome({businessAppId:app,
 customerUserId:other,requestType:"booking_request",
 response:{ok:true,reused:true,request:{id:req,mini_app_id:app,
  consumer_user_id:user,request_type:"booking_request",status:"received"}},
 evidenceSource:"submit_response"}).ok,false);
const noOp=await runStagingCustomerReceiptRead({
 argv:[],env:{},fetchImpl:()=>{throw Error("No network allowed");}
});
ok(noOp.ok);eq(noOp.networkRequests,0);
eq(noOp.realSavedRequestVerified,false);
let calls=0;
const stop=await runStagingCustomerReceiptRead({
 argv:["--verify-read-only"],env:{},fetchImpl:()=>{calls++;throw Error("No network");}
});
eq(stop.ok,false);eq(calls,0);
const aToken="aaaaabbbbb.ccccdddddd.eeeeffffff";
const bToken="ggggghhhhh.iiiijjjjjj.kkkkllllll";
const env={BDI_STAGING_RECEIPT_APPROVAL:APPROVAL,
 BDI_STAGING_RECEIPT_CUSTOMER_A_ID:user,BDI_STAGING_RECEIPT_CUSTOMER_B_ID:other,
 BDI_STAGING_RECEIPT_APP_ID:app,BDI_STAGING_RECEIPT_CUSTOMER_A_JWT:aToken,
 BDI_STAGING_RECEIPT_CUSTOMER_B_JWT:bToken,
 BDI_STAGING_PUBLISHABLE_KEY:"sb_publishable_TEST_ONLY_PUBLIC_LONG_KEY",
 BDI_STAGING_RECEIPT_APP_SLUG:slug,
 BDI_STAGING_RECEIPT_REQUEST_KEY:key,
 BDI_STAGING_RECEIPT_KIND:"booking_request"};
const trace=[];
const mock=async(url,options)=>{
 trace.push({url,options});
 const bearer=options.headers.Authorization;
 if(url===HOST+"/auth/v1/user")
  return {status:200,json:async()=>({id:bearer==="Bearer "+aToken?user:other})};
 if(url===ENDPOINT)return {status:200,json:async()=>bearer==="Bearer "+aToken?
  {ok:true,...receipt}:{ok:true,found:false,verifiedSaved:false}};
 throw Error("Unexpected URL");
};
const verified=await runStagingCustomerReceiptRead({
 argv:["--verify-read-only"],env,fetchImpl:mock
});
ok(verified.ok);
eq(verified.networkRequests,4);
eq(verified.originalCustomerReceiptSeen,true);
eq(verified.crossCustomerRequestDenied,true);
eq(verified.customerRequestDelivered,undefined);
eq(verified.confirmedDiaryBooking,false);
eq(verified.realCustomerOutcomeVerified,false);
ok(!JSON.stringify(verified).includes(key));
ok(!JSON.stringify(verified).includes(aToken));
ok(!JSON.stringify(verified).includes(bToken));
ok(trace.every(x=>x.url.startsWith(HOST)));
ok(trace.every(x=>x.options.redirect==="error"));
ok(trace.filter(x=>x.url===ENDPOINT).every(x=>
 JSON.parse(x.options.body).action==="request_receipt"));
ok(trace.filter(x=>x.url===ENDPOINT).every(x=>x.options.method==="POST"));
const wrong=await runStagingCustomerReceiptRead({
 argv:["--verify-read-only"],env,
 fetchImpl:async(url,options)=>{
 if(url===ENDPOINT)return {status:200,json:async()=>({ok:true,...receipt})};
 return mock(url,options);
 }});
eq(wrong.ok,false);
const mismatch=await runStagingCustomerReceiptRead({
 argv:["--verify-read-only"],env,
 fetchImpl:async(url,options)=>{
 if(url.endsWith("/auth/v1/user"))return {
   status:200,json:async()=>({id:other})};
 return mock(url,options);
 }});
eq(mismatch.ok,false);
const edge=read("supabase/functions/busy-mini-apps/index.ts");
const ctl=read("src/app/AppController.js");
const ui=read("src/screens/miniApps.js");
for(const phrase of [
 'async function customerRequestReceipt(userId:string,body:any)',
 '.eq("consumer_user_id",userId)',
 '.eq("idempotency_key",requestKey)',
 '.select("id,mini_app_id,consumer_user_id,idempotency_key,request_type,status")',
 'if (action === "request_receipt")',
 '...(await customerRequestReceipt(user.id,body))'
])ok(edge.includes(phrase),"Missing tenant-scoped receipt server guard: "+phrase);
ok(edge.indexOf('if (action === "request_receipt")')<
   edge.indexOf('if (action === "submit_request")'));
for(const phrase of [
 'customerRequestPendingRef.current=null;',
 'evaluateCustomerRequestOutcome({',
 '"request_receipt"',
 'requestKey:key',
 'customerRequestNotice(verified)',
 'scopeStillCurrent()',
 'activeCustomerRequestScopeRef.current===expectedScope',
 'latestCustomerRequestOutcome,'
])ok(ctl.includes(phrase),"Missing client receipt recovery: "+phrase);
const ownerState=ctl.indexOf("const [ownerSession, setOwnerSession]");
const scopeEffect=ctl.indexOf('activeCustomerRequestScopeRef.current=[');
ok(ownerState>=0&&scopeEffect>ownerState);
ok(ui.includes('s.latestCustomerRequestOutcome.businessAppId===detail?.app?.id'));
ok(ui.includes('What Busy has verified'));
ok(!ui.includes('s.go("myBusyApps")'));
console.log("V3.204 "+checks+" receipt isolation, ambiguous submission recovery, Business Brain evidence and no-live-side-effects contracts PASS.");
