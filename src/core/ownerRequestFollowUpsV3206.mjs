/**
 * V3.206 — factual, bounded follow-up triage for actual owner-scoped
 * Business App requests and timestamped, role-scoped message checkpoints.
 *
 * Read-only. These are suggestions for OWNER review, not instructions to
 * send, and never a claim of delivered notification or confirmed booking.
 * Missing/truncated history suppresses "unanswered" certainty.
 */
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATES=new Set(["received","reviewing","accepted","declined","closed"]);
const TYPES=new Set(["enquiry","booking_request"]);
const FAIL=reason=>({ok:false,reason,items:[],counts:{
 needsReply:0,waiting:0,manualReview:0,doneOrClosed:0,unknown:0},
 automaticallySends:false,confirmedDelivery:false});
const asTime=(value,now)=>{
 const x=Date.parse(value||"");
 return Number.isFinite(x)&&x>=0&&x<=now+60000?x:null;
};
const REPLY={
 enquiry:"Thank you for your enquiry. I've received your message and will review it before getting back to you.",
 booking_request:"Thank you for your booking request. I'll check the details and get back to you. Your appointment isn't confirmed yet."
};
function evaluateOwnerRequestFollowUps({
 businessId="",appId="",requests=[],messages=[],
 messagesTruncated=false,requestsTruncated=false,nowISO=""
}={}){
 const now=Date.parse(nowISO);
 if(!ID.test(businessId)||!ID.test(appId)||!Number.isFinite(now)||
    !Array.isArray(requests)||requests.length>30||
    !Array.isArray(messages)||messages.length>150||
    requests.some(r=>!r||!ID.test(r.id)||r.business_id!==businessId||
      r.mini_app_id!==appId||!TYPES.has(r.request_type)||
      !STATES.has(r.status))||
    messages.some(m=>!m||!ID.test(m.id)||!ID.test(m.request_id)||
      m.business_id!==businessId||m.mini_app_id!==appId||
      !["business","customer"].includes(m.sender_role))||
    new Set(requests.map(x=>x.id)).size!==requests.length||
    new Set(messages.map(x=>x.id)).size!==messages.length)
  return FAIL("Busy needs current authenticated business requests and a valid, bounded message snapshot.");
 const byId=new Map();
 for(const m of messages){
  if(!byId.has(m.request_id))byId.set(m.request_id,[]);
  byId.get(m.request_id).push(m);
 }
 let counts={needsReply:0,waiting:0,manualReview:0,doneOrClosed:0,unknown:0};
 const items=requests.map(r=>{
  const history=byId.get(r.id)||[];
  const requestTime=asTime(r.created_at,now);
  const stamps=history.map(x=>({...x,at:asTime(x.created_at,now)}));
  const isGuest=r.request_origin==="guest_web"||!r.consumer_user_id;
  const noHistoryCertainty=messagesTruncated===true||
    stamps.some(x=>x.at===null)||requestTime===null;
  const incoming=stamps.filter(m=>m.sender_role==="customer")
    .reduce((mx,m)=>Math.max(mx,m.at||0),0);
  const outgoing=stamps.filter(m=>m.sender_role==="business")
    .reduce((mx,m)=>Math.max(mx,m.at||0),0);
  const inboundAt=Math.max(incoming,requestTime||0);
  const latestActivity=Math.max(inboundAt,outgoing);
  const elapsedHours=Number.isFinite(latestActivity)&&latestActivity>0?
    Math.max(0,Math.floor((now-latestActivity)/3600000)):null;
  const terminal=["declined","closed"].includes(r.status);
  let category="unknown",why="",suggestion="",template=null;
  if(terminal){
   category="doneOrClosed";
   why="The request is marked declined or closed. Busy won't automatically reopen or chase it.";
   suggestion="Review only if the owner needs to handle an existing obligation.";
  }else if(isGuest){
   category="manualReview";
   why="This came from a public guest. The BUSY chat does not reach the guest receipt.";
   suggestion="Review the supplied contact method before any manual reply.";
  }else if(noHistoryCertainty){
   category="unknown";
   why="Request or message history is incomplete; Busy cannot prove which message came last.";
   suggestion="Open the signed-in conversation before deciding whether to reply.";
  }else if(r.request_type==="booking_request"&&r.status==="accepted"){
   category="manualReview";
   why="Acceptance alone does not prove a diary appointment or customer notification.";
   suggestion="Check the linked booking and customer communication.";
  }else if(outgoing>=inboundAt&&outgoing>0){
   category="waiting";
   why="The last recorded in-app reply is from the business. This does not prove delivery or that the customer read it.";
   suggestion="Wait for the customer or review again later; do not send a duplicate chase.";
  }else if(r.status==="received"||r.status==="reviewing"||r.status==="accepted"){
   category="needsReply";
   why=history.some(m=>m.sender_role==="customer")?
    "A signed-in customer has replied more recently than the last recorded business message.":
    "The saved customer request has no more recent business reply in the complete message snapshot.";
   suggestion="Review the conversation and prepare a useful reply. Owner approval is required before sending.";
   // Only prepare conservative non-personalised text, never invent availability,
   // price, quote, consent, an accepted booking or any completed task.
   template=REPLY[r.request_type];
  }
  counts[category]++;
  const urgency=category==="needsReply"?
    elapsedHours>=48?3:elapsedHours>=12?2:1:
    category==="manualReview"?1:0;
  return {requestId:r.id,appId,requestType:r.request_type,
   status:r.status,category,why,suggestion,
   replyDraft:template,ownerApprovalRequired:true,
   guestRequiresOutOfAppContact:isGuest,
   hoursSinceLatestRecordedActivity:elapsedHours,
   priority:urgency,source:"authenticated_owner_status_snapshot",
   sourceHistoryTruncated:messagesTruncated===true,
   sourceRequestsTruncated:requestsTruncated===true,
   noProviderDeliveryEvidence:true,noBookingConfirmationClaim:true,
   noCustomerContactDataIncluded:true,canAutoSend:false};
 }).sort((a,b)=>b.priority-a.priority||
    ["needsReply","manualReview","unknown","waiting","doneOrClosed"].indexOf(a.category)-
    ["needsReply","manualReview","unknown","waiting","doneOrClosed"].indexOf(b.category));
 return {ok:true,kind:"owner_request_followups_v3206",
  businessId,appId,items,counts,
  limitedToRecentRequests:requestsTruncated===true||requests.length>=30,
  messageHistoryIncomplete:messagesTruncated===true,
  evidenceLevel:"owner_scoped_database_snapshot",
  needsOwnerApprovalForEveryMessage:true,
  sendsMessages:false,retriesNotifications:false,
  externalDeliveryVerified:false,diaryBookingConfirmed:false,
  automaticLearning:false,crossBusinessLearning:false,
  noContactDetailsCopied:true};
}
export {REPLY,evaluateOwnerRequestFollowUps};
