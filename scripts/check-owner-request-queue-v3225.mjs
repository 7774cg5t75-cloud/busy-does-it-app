/**
 * V3.225 private owner Business App queue: aggregate readback, no customer PII
 * and no automatic owner communications. Synthetic fixtures only.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {classifyOwnerRequestQueueV3225 as classify}
 from "../supabase/functions/busy-mini-apps/ownerRequestQueueV3225.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let count=0;
const ok=(x,m)=>{assert.ok(x,m);count++};
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);count++};
const B="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const A="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const R="10101010-1010-4010-8010-101010101010";
const latest=()=>({id:R,business_id:B,mini_app_id:A,
 request_type:"enquiry",status:"received",created_at:"2026-10-14T14:00:00Z"});
const data=()=>({businessId:B,appId:A,received:2,reviewing:1,latest:latest()});
const x=classify(data());
ok(x.ok,x.reason);
eq(x.nextAction,"review_new_requests");
eq(x.pendingTotal,3);
eq(x.received,2);
eq(x.reviewing,1);
eq(x.latestRequestId,R);
eq(x.customerDetailsIncluded,false);
eq(x.customerContactIncluded,false);
eq(x.ownerMessageSent,false);
eq(x.bookingConfirmed,false);
eq(x.providerDelivered,false);
eq(x.independentlyVerifiedByThisFunction,false);
eq(x.ownerApprovalRequiredForReply,true);
const review=classify({...data(),received:0,reviewing:2});
eq(review.nextAction,"continue_reviewing_requests");
eq(review.pendingTotal,2);
const empty=classify({...data(),received:0,reviewing:0,latest:null});
ok(empty.ok);
eq(empty.nextAction,"no_pending_requests");
eq(empty.latestRequestId,null);
for(const edit of [
 {businessId:"not-a-uuid"},{businessId:OTHER,latest:latest()},
 {appId:OTHER},{received:-1},{received:1.5},{received:NaN},
 {received:null},{reviewing:"1"},{reviewing:-1},
 {received:Number.MAX_SAFE_INTEGER},{received:100000001},
 {latest:{...latest(),business_id:OTHER}},
 {latest:{...latest(),mini_app_id:OTHER}},
 {latest:{...latest(),id:"not-a-uuid"}},
 {latest:{...latest(),request_type:"payment"}},
 {latest:{...latest(),status:"invented"}},
 {latest:null}
]){
 const bad=classify({...data(),...edit});
 eq(bad.ok,false);
 eq(bad.ownerMessageSent,false);
 eq(bad.bookingConfirmed,false);
}
const code=read("supabase/functions/busy-mini-apps/index.ts");
ok(code.includes('import {classifyOwnerRequestQueueV3225}'));
ok(code.includes('action === "owner_queue_summary"'));
ok(code.includes('["owner","admin"].includes(member.role)'));
ok(code.includes('.from("busy_mini_app_requests")'));
ok(code.includes('.eq("business_id",businessId)'));
ok(code.includes('.eq("mini_app_id",app.id)'));
ok(code.includes('classifyOwnerRequestQueueV3225({'));
ok(!code.includes('owner_queue_summary") {\n      return json(200,{ok:true,...body}'));
const controller=read("src/app/AppController.js");
ok(controller.includes('miniAppsRequest("owner_queue_summary")'));
ok(controller.includes("proof?.countsFromServerReadback!==true"));
ok(controller.includes("proof?.authenticatedMembershipCheckedAtEndpoint!==true"));
ok(controller.includes("checkOwnerRequestQueue,"));
ok(controller.includes("setOwnerQueueSummary(null)"));
const screen=read("src/screens/miniApps.js");
ok(screen.includes('title="Requests needing attention"'));
ok(screen.includes("s.ownerQueueSummary?.appId===app.id"));
ok(screen.includes("s.ownerQueueSummary?.businessId===app.business_id"));
ok(screen.includes("onPress={s.checkOwnerRequestQueue}"));
ok(screen.includes("onPress={()=>s.openOwnerMiniAppRequest("));
ok(screen.includes("A booking request is not a confirmed appointment."));
console.log("V3.225 owner queue readback contract: "+count+
 " assertions passed; no live request or reply created.");
