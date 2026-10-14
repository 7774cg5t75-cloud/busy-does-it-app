/**
 * V3.235 real extracted follow-up flow with STRICT offline store, owner
 * outcome evidence, denial on foreign rows/failures, and code-health gates.
 * The fake store is NOT a Supabase Auth/JWT or browser staging test.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {readCurrentOwnerFollowupV3235 as readCurrent}
 from "../supabase/functions/busy-mini-apps/ownerFollowupReadbackV3235.mjs";
import {verifyOwnerOutcomeEvidenceV3235 as verify}
 from "../src/core/ownerOutcomeProofV3235.mjs";
import {checkCurrentOwnerFollowup as review}
 from "../src/core/followupProofV3207.mjs";
let n=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);n++};
const ok=(v,m)=>{assert.ok(v,m);n++};
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const R="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const U="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const M="ffffffff-ffff-4fff-8fff-ffffffffffff";
const nowISO="2026-10-14T22:20:00.000Z";
const req=(more={})=>({id:R,business_id:B,mini_app_id:A,
 request_type:"enquiry",status:"received",request_origin:"busy_marketplace",
 consumer_user_id:U,created_at:"2026-10-13T10:00:00Z",
 updated_at:"2026-10-14T22:00:00Z",...more});
const message=(role="business",more={})=>({id:M,business_id:B,
 mini_app_id:A,request_id:R,sender_role:role,
 created_at:"2026-10-14T18:00:00Z",...more});
function storeFixture(request,messages=[],{requestError=null,messageError=null}={}){
 const calls=[];
 const store={from(table){
  if(!["busy_mini_app_requests","busy_mini_app_request_messages"].includes(table))
   throw Error("Wrong table "+table);
  const conditions=[],orders=[];let queryLimit=null,selection="";
  const q={
   select(cols){selection=cols;return this},
   eq(k,v){conditions.push([k,v]);return this},
   order(k,options){orders.push([k,options?.ascending]);return this},
   maybeSingle(){if(table!=="busy_mini_app_requests")throw Error("Missing original request.");
    calls.push({table,conditions,orders,queryLimit,selection});
    return Promise.resolve({data:request,error:requestError})},
   limit(value){if(table!=="busy_mini_app_request_messages")throw Error("Bounded messages only.");
    queryLimit=value;calls.push({table,conditions,orders,queryLimit,selection});
    return Promise.resolve({data:messages,error:messageError})}
  };
  return q;
 }};
 return {store,calls};
}
async function run(row=req(),messages=[],opts={}){
 const {store,calls}=storeFixture(row,messages,opts);
 const result=await readCurrent({businessId:B,appId:A,
  requestId:R,store,nowISO});
 eq(calls.length,2);
 eq(calls[0].table,"busy_mini_app_requests");
 eq(calls[1].table,"busy_mini_app_request_messages");
 eq(calls[1].queryLimit,2);
 eq(calls[1].orders,[["created_at",false],["id",false]]);
 for(const call of calls){
  ok(call.conditions.some(x=>x[0]==="business_id"&&x[1]===B));
  ok(call.conditions.some(x=>x[0]==="mini_app_id"&&x[1]===A));
  ok(call.conditions.some(x=>(x[0]==="id"||x[0]==="request_id")&&x[1]===R));
  ok(!/contact_email|contact_phone|name|message_body|body/.test(call.selection));
 }
 eq(result.outcomeEvidence.ok,true);
 eq(result.outcomeEvidence.sourceStamp,result.sourceStamp);
 eq(result.outcomeEvidence.customerNotified,false);
 eq(result.outcomeEvidence.outcomeConfirmed,false);
 eq(result.outcomeEvidence.paymentVerified,false);
 eq(result.outcomeEvidence.calendarProviderSynced,false);
 eq(result.nextAction.maySend,false);
 const proof=verify({businessId:B,appId:A,requestId:R,
  followup:{...result,ok:true},evidence:result.outcomeEvidence});
 eq(proof.ok,true);
 const shown=review({businessId:B,appId:A,requestId:R,
  result:{...result,ok:true}});
 eq(shown.ok,true);
 eq(shown.outcomeEvidence.ok,true);
 eq(shown.outcomeEvidence.sourceStamp,result.sourceStamp);
 eq(shown.outcomeEvidence.outcomeConfirmed,false);
 eq(shown.outcomeEvidence.maySend,false);
 return {result,proof,shown};
}
const newReq=await run();
eq(newReq.result.outcomeEvidence.stage,"reply_needs_review");
eq(newReq.result.nextAction.action,"prepare_owner_reply");
const replied=await run(req(),[message()]);
eq(replied.result.outcomeEvidence.stage,"business_reply_recorded");
eq(replied.result.nextAction.action,"wait_for_customer");
eq(replied.result.outcomeEvidence.followupNeeded,false);
const booking=await run(req({request_type:"booking_request",status:"accepted"}));
eq(booking.result.outcomeEvidence.stage,"request_accepted_only");
eq(booking.result.nextAction.action,"verify_work_booking");
eq(booking.result.outcomeEvidence.bookingFulfilled,false);
const finished=await run(req({status:"closed"}));
eq(finished.result.outcomeEvidence.stage,"request_marked_finished");
eq(finished.result.outcomeEvidence.outcomeConfirmed,false);
const declined=await run(req({status:"declined"}));
eq(declined.result.outcomeEvidence.stage,"request_marked_finished");
const guest=await run(req({request_origin:"guest_web",consumer_user_id:null}));
eq(guest.result.outcomeEvidence.stage,"manual_contact_review");
eq(guest.result.nextAction.action,"review_guest_contact");
const unknown=await run(req(),[
 message("customer",{created_at:"2026-10-14T10:00:00Z"}),
 message("business",{id:OTHER,created_at:"2026-10-14T10:00:00Z"})
]);
eq(unknown.result.outcomeEvidence.stage,"evidence_incomplete");
for(const wrong of [
 {businessId:OTHER,appId:A,requestId:R,followup:{...newReq.result,ok:true},evidence:newReq.result.outcomeEvidence},
 {businessId:B,appId:OTHER,requestId:R,followup:{...newReq.result,ok:true},evidence:newReq.result.outcomeEvidence},
 {businessId:B,appId:A,requestId:OTHER,followup:{...newReq.result,ok:true},evidence:newReq.result.outcomeEvidence},
 {businessId:B,appId:A,requestId:R,followup:{...newReq.result,ok:true},evidence:{...newReq.result.outcomeEvidence,customerNotified:true}},
 {businessId:B,appId:A,requestId:R,followup:{...newReq.result,ok:true},evidence:{...newReq.result.outcomeEvidence,outcomeConfirmed:true}},
 {businessId:B,appId:A,requestId:R,followup:{...newReq.result,ok:true},evidence:{...newReq.result.outcomeEvidence,sourceStamp:"stale"}},
 {businessId:B,appId:A,requestId:R,followup:{...newReq.result,ok:true},evidence:{...newReq.result.outcomeEvidence,paymentVerified:true}},
 {businessId:B,appId:A,requestId:R,followup:{...newReq.result,ok:true},evidence:{...newReq.result.outcomeEvidence,stage:"invented"}},
 ]){
  const x=verify(wrong);eq(x.ok,false);eq(x.maySend,false);
}
for(const [row,messages,opts] of [
 [{...req(),business_id:OTHER},[],{}],
 [{...req(),mini_app_id:OTHER},[],{}],
 [null,[],{}],
 [req(),[message("customer",{business_id:OTHER})],{}],
 [req(),[message("business",{request_id:OTHER})],{}],
 [req(),[],{requestError:"DB outage"}],
 [req(),[],{messageError:"DB outage"}]
]){
 const f=storeFixture(row,messages,opts);
 let threw=false;try{await readCurrent({businessId:B,appId:A,requestId:R,
  store:f.store,nowISO})}catch{threw=true}
 ok(threw,"Wrong tenant or failed read must reject.");
}
const code=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const edge=code("supabase/functions/busy-mini-apps/index.ts");
const start=edge.indexOf("async function currentOwnerFollowup(");
const end=edge.indexOf("async function customerRequestDetail(",start);
const thin=edge.slice(start,end);
ok(thin.length<650,"Followup route must stay small, preventing renewed controller sprawl.");
ok(thin.includes("readCurrentOwnerFollowupV3235({"));
ok(thin.includes("store:supabase"));
ok(thin.includes("new Date().toISOString()"));
ok(!thin.includes(".from("));
ok(edge.includes('if (action === "owner_followup_check")'));
ok(edge.includes('if(!["owner","admin"].includes(member.role))'));
const backend=code("supabase/functions/busy-mini-apps/ownerFollowupReadbackV3235.mjs");
ok(backend.includes("classifyOwnerOutcomeEvidenceV3235"));
ok(backend.includes('store.from("busy_mini_app_requests")'));
ok(backend.includes('store.from("busy_mini_app_request_messages")'));
ok(backend.includes(".limit(2)"));
const screen=code("src/screens/miniApps.js");
ok(screen.includes("s.ownerFollowupReview.outcomeEvidence.summary"));
ok(screen.includes("Use as an editable draft"));
ok(screen.includes("Nothing is sent automatically"));
const oldProof=code("src/core/followupProofV3207.mjs");
ok(oldProof.includes("verifyOwnerOutcomeEvidenceV3235"));
ok(oldProof.includes("outcomeEvidence:outcome?.ok?outcome:null"));
execFileSync(process.execPath,["scripts/prepare-outcome-staging-v3235.mjs"],{stdio:"pipe"});
const plan=JSON.parse(readFileSync("/tmp/bdi-v3235-outcome-stage/review.json","utf8"));
eq(plan.priorRealJWTScenarios.length,11);
eq(plan.priorBookingScenarios.length,11);
eq(plan.priorFollowupScenarios.length,12);
eq(plan.realOutcomeScenarios.length,8);
eq(plan.versionedSqlMigrations,69);
ok(plan.realOutcomeScenarios.every(x=>x.status==="not_verified"&&x.liveOwnerApprovalNeeded));
ok(plan.sourceHashes.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)));
for(const k of ["canInstall","ownerApproved","hostedSqlExecuted",
 "realAuthJWTTested","backupRestoreProved","providerContacted",
 "paidBuildUsed","productionTouched","actualUserOutcomeVerified"])
 eq(plan[k],false);
console.log("V3.235: "+n+" exact tenant readback, saved outcome truth, code health and owner UI assertions passed.");
