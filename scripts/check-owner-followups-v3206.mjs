import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateOwnerRequestFollowUps,REPLY}
 from "../src/core/ownerRequestFollowUpsV3206.mjs";
import {buildMiniAppsView} from "../src/domain/miniApps.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checks=0;
function ok(v,m){assert.ok(v,m);checks++;}
function eq(a,b,m){assert.deepEqual(a,b,m);checks++;}
const businessId="11111111-1111-4111-8111-111111111111";
const otherBusinessId="22222222-2222-4222-8222-222222222222";
const appId="33333333-3333-4333-8333-333333333333";
const otherAppId="44444444-4444-4444-8444-444444444444";
const nowISO="2026-10-13T10:00:00.000Z";
const uuid=i=>("00000000-0000-4000-8000-"+String(i).padStart(12,"0"));
const req=(id,more={})=>({
 id:uuid(id),business_id:businessId,mini_app_id:appId,
 request_type:"enquiry",status:"received",request_origin:"busy_marketplace",
 consumer_user_id:uuid(70),created_at:"2026-10-11T07:00:00.000Z",
 business_unread_count:1,...more});
const msg=(id,requestId,sender_role,created_at,more={})=>({
 id:uuid(id),business_id:businessId,mini_app_id:appId,
 request_id:uuid(requestId),sender_role,created_at,...more});
const run=(requests,messages=[],more={})=>
 evaluateOwnerRequestFollowUps({
 businessId,appId,requests,messages,nowISO,
 messagesTruncated:false,requestsTruncated:false,...more
 });
const fresh=run([req(1)]);
ok(fresh.ok,fresh.reason);
eq(fresh.counts.needsReply,1);
eq(fresh.counts.waiting,0);
eq(fresh.items[0].category,"needsReply");
eq(fresh.items[0].priority,3);
eq(fresh.items[0].requestId,uuid(1));
eq(fresh.items[0].replyDraft,REPLY.enquiry);
eq(fresh.items[0].canAutoSend,false);
eq(fresh.sendsMessages,false);
eq(fresh.externalDeliveryVerified,false);
eq(fresh.automaticLearning,false);
const booking=run([req(2,{request_type:"booking_request"})]);
eq(booking.items[0].replyDraft,REPLY.booking_request);
ok(booking.items[0].replyDraft.includes("isn't confirmed"));
const answered=run([req(1)],[msg(20,1,"business","2026-10-12T14:00:00.000Z")]);
ok(answered.ok);
eq(answered.counts.waiting,1);
eq(answered.counts.needsReply,0);
eq(answered.items[0].replyDraft,null);
eq(answered.items[0].noProviderDeliveryEvidence,true);
const newerCustomer=run([req(1)],[msg(20,1,"business","2026-10-12T14:00:00.000Z"),
 msg(21,1,"customer","2026-10-13T09:00:00.000Z")]);
eq(newerCustomer.counts.needsReply,1);
ok(newerCustomer.items[0].why.includes("more recently"));
eq(newerCustomer.items[0].priority,1);
const newerOwner=run([req(1)],[msg(21,1,"customer","2026-10-12T14:00:00.000Z"),
 msg(20,1,"business","2026-10-13T09:00:00.000Z")]);
eq(newerOwner.counts.waiting,1);
const guest=run([req(3,{request_origin:"guest_web",consumer_user_id:null})]);
eq(guest.counts.manualReview,1);
eq(guest.items[0].replyDraft,null);
eq(guest.items[0].guestRequiresOutOfAppContact,true);
const guestWithCustomer=run([req(3,{request_origin:"guest_web"})],
 [msg(20,3,"business","2026-10-12T14:00:00.000Z")]);
eq(guestWithCustomer.counts.manualReview,1);
const closed=run([req(4,{status:"closed"})]);
eq(closed.counts.doneOrClosed,1);
eq(closed.items[0].replyDraft,null);
const declined=run([req(4,{status:"declined"})]);
eq(declined.counts.doneOrClosed,1);
const acceptedBooking=run([req(4,{request_type:"booking_request",status:"accepted"})]);
eq(acceptedBooking.counts.manualReview,1);
ok(acceptedBooking.items[0].why.includes("does not prove"));
eq(acceptedBooking.items[0].noBookingConfirmationClaim,true);
const acceptedEnquiry=run([req(4,{status:"accepted"})]);
eq(acceptedEnquiry.counts.needsReply,1);
const noTime=run([req(4,{created_at:""})]);
eq(noTime.counts.unknown,1);
eq(noTime.items[0].replyDraft,null);
const futureTime=run([req(4,{created_at:"2099-01-01T00:00:00Z"})]);
eq(futureTime.counts.unknown,1);
const badMessageTime=run([req(4)],[msg(20,4,"customer","invalid")]);
eq(badMessageTime.counts.unknown,1);
const historyIncomplete=run([req(1)],[],{messagesTruncated:true});
eq(historyIncomplete.counts.unknown,1);
eq(historyIncomplete.items[0].replyDraft,null);
eq(historyIncomplete.messageHistoryIncomplete,true);
const someMissing=run([req(1),req(2)],[
 msg(20,1,"business","2026-10-13T09:00:00.000Z")
],{messagesTruncated:true});
eq(someMissing.counts.unknown,2);
const partiallyPaginated=run([req(1)],[],{requestsTruncated:true});
eq(partiallyPaginated.counts.needsReply,1);
eq(partiallyPaginated.limitedToRecentRequests,true);
for(const more of [
 {businessId:otherBusinessId},
 {appId:"bad"},
 {nowISO:"bad"},
 {requests:[req(1),req(1)]},
 {requests:[{...req(1),business_id:otherBusinessId}]},
 {requests:[{...req(1),mini_app_id:otherAppId}]},
 {requests:[{...req(1),request_type:"sale_won"}]},
 {requests:[{...req(1),status:"magically_delivered"}]},
 {messages:[{...msg(20,1,"business",nowISO),business_id:otherBusinessId}]},
 {messages:[{...msg(20,1,"business",nowISO),mini_app_id:otherAppId}]},
 {messages:[{...msg(20,1,"business",nowISO),sender_role:"system"}]},
 {messages:[msg(20,1,"business",nowISO),msg(20,1,"business",nowISO)]},
 {requests:Array.from({length:31},(_,i)=>req(i+1))},
 {messages:Array.from({length:151},(_,i)=>msg(i+1,1,"business",nowISO))}
]){
 const r=evaluateOwnerRequestFollowUps({
 businessId,appId,requests:[req(1)],messages:[],
 nowISO,...more
 });
 eq(r.ok,false);
 eq(r.items.length,0);
 eq(r.automaticallySends,false);
}
const multi=run([req(4,{status:"closed"}),req(2,{
 request_type:"booking_request",created_at:"2026-10-13T08:30:00Z"}),
 req(1,{created_at:"2026-10-11T07:00:00.000Z"})]);
ok(multi.ok);
eq(multi.items[0].requestId,uuid(1));
eq(multi.items[1].requestId,uuid(2));
eq(multi.items[2].category,"doneOrClosed");
eq(multi.counts.needsReply,2);
const safeJSON=JSON.stringify(multi);
ok(!safeJSON.includes("contact_name"));
ok(!safeJSON.includes("contact_email"));
const view=buildMiniAppsView({app:{
 id:appId,business_id:businessId,
 draft_config:{modules:[],publicProfile:{},navigation:[]},
 status:"draft",draft_revision:1
},requests:[req(1)],messageCheckpoints:{rows:[],truncated:false}});
ok(view.followUpIntelligence.ok);
eq(view.followUpIntelligence.counts.needsReply,1);
const missingMessages=buildMiniAppsView({app:{
 id:appId,business_id:businessId,
 status:"draft",draft_config:{modules:[],navigation:[]},
 draft_revision:1},requests:[req(1)]});
eq(missingMessages.followUpIntelligence,null);
const controller=read("src/app/AppController.js");
const edge=read("supabase/functions/busy-mini-apps/index.ts");
const domain=read("src/domain/miniApps.js");
const screen=read("src/screens/miniApps.js");
for(const needle of [
 "messageCheckpoints:data?.messageCheckpoints?.rows",
 "messageDeliveryOutbox:data?.messageDeliveryOutbox?.rows",
 "pushGatewayEvidence:data?.pushGatewayEvidence||null",
])ok(controller.includes(needle),"Missing owner status evidence transport "+needle);
ok(edge.includes('request_id,sender_role,created_at'));
ok(edge.includes('.limit(150)'));
ok(domain.includes("evaluateOwnerRequestFollowUps({"));
ok(domain.includes("followUpIntelligence,"));
ok(screen.includes("Open request and prepare reply"));
ok(screen.includes("Use as an editable draft"));
ok(screen.includes("Nothing is sent automatically"));
ok(screen.includes("Keep my text"));
ok(!REPLY.enquiry.includes("tomorrow"));
ok(!REPLY.booking_request.toLowerCase().includes("confirmed for"));
console.log("V3.206 "+checks+
 " triage, stale evidence, owner reply precedence, guest safety, bounded Business Brain and UI contracts PASS.");
