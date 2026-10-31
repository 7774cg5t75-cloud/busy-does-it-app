/**
 * V3.207: one-owner, one-request, immediately observed follow-up decision.
 * This is designed for a fresh tenant-authorised DB read, NOT the bounded
 * 30-request/150-message dashboard sample. It never sends or books.
 *
 * Two newest messages are required to identify an ambiguous timestamp tie.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATES=new Set(["received","reviewing","accepted","declined","closed"]);
const TYPES=new Set(["enquiry","booking_request"]);
const DRAFT={
 enquiry:"Thank you for your enquiry. I'll review the details and get back to you.",
 booking_request:"Thank you for your booking request. I'll check the details before confirming whether an appointment is available."
};
const fail=reason=>({ok:/** @type {const} */ (false),reason,canOfferDraft:false,canAutoSend:false,
 independentProviderDeliveryVerified:false,customerOutcomeConfirmed:false});
function decideFreshOwnerFollowup({
 businessId="",appId="",requestId="",row=null,messages=[],
 nowISO=""
}={}){
 const now=Date.parse(nowISO);
 const stamp=t=>{
  const v=Date.parse(t||"");
  return Number.isFinite(v)&&v>0&&v<=now+60000?v:null;
 };
 if(!UUID.test(businessId)||!UUID.test(appId)||!UUID.test(requestId)||
   !Number.isFinite(now)||!row||row.id!==requestId||
   row.business_id!==businessId||row.mini_app_id!==appId||
   !TYPES.has(row.request_type)||!STATES.has(row.status)||
   !Array.isArray(messages)||messages.length>2||
   messages.some(m=>!m||!UUID.test(m.id)||m.business_id!==businessId||
      m.mini_app_id!==appId||m.request_id!==requestId||
      !["business","customer"].includes(m.sender_role))||
   new Set(messages.map(m=>m.id)).size!==messages.length)
  return fail("A current, single-business authenticated request and at most two latest messages are required.");
 const created=stamp(row.created_at),updated=stamp(row.updated_at);
 const latest=messages[0]||null,second=messages[1]||null;
 const latestTime=latest?stamp(latest.created_at):null;
 const secondTime=second?stamp(second.created_at):null;
 let category="unknown",why="Not enough current evidence to recommend a reply.";
 if(!created||!updated||updated<created||
    (latest&&(!latestTime||latestTime<created))||
    (second&&(!secondTime||secondTime<created))||
    (latest&&second&&latestTime<secondTime)){
  why="The request or message timestamps need reviewing.";
 }else if(latest&&second&&latestTime===secondTime){
  why="The two newest messages share a timestamp, so Busy cannot reliably tell who replied last.";
 }else if(["closed","declined"].includes(row.status)){
  category="closed";
  why="The request is closed or declined. Busy will not reopen or chase it.";
 }else if(row.request_origin==="guest_web"||!row.consumer_user_id){
  category="manual";
  why="This was a guest request. The in-app reply would not reach the guest receipt.";
 }else if(row.request_type==="booking_request"&&row.status==="accepted"){
  category="manual";
  why="Booking acceptance still needs the linked diary confirmation checked.";
 }else if(latest?.sender_role==="business"){
  category="waiting";
  why="The latest saved message was from this business. Its delivery and customer reading remain unverified.";
 }else{
  category="needsReply";
  why=latest?
   "The customer sent the latest saved message and no newer business reply was found.":
   "No saved business reply was found for this request.";
 }
 const sourceStamp=[
  requestId,row.status,row.updated_at,latest?.id||"none",
  latest?.created_at||"none",latest?.sender_role||"none",
  second?.id||"none",second?.created_at||"none"
 ].join("|");
 const suggestion=category==="needsReply"?DRAFT[row.request_type]:null;
 return {ok:/** @type {const} */ (true),kind:"fresh_owner_followup_v3207",
  businessId,appId,requestId,requestType:row.request_type,
  category,why,sourceStamp,
  latestMessageRole:latest?.sender_role||"none",
  checkedMessageCount:messages.length,
  latestRecordedActivityAt:latestTime!==null&&
    latestTime>=created?latest.created_at:row.created_at,
  canOfferDraft:!!suggestion,replyDraft:suggestion,
  ownerApprovalRequired:true,
  canAutoSend:false,autoPublished:false,noMessagesChanged:true,
  senderIdentityIncluded:false,customerDataIncluded:false,
  independentProviderDeliveryVerified:false,customerReadVerified:false,
  confirmedAppointment:false,customerOutcomeConfirmed:false,
  evidenceSource:"owner_authenticated_one_request_readback",
  notAllBusinessRequestsChecked:true};
}
export {decideFreshOwnerFollowup,DRAFT};
