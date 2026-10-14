/**
 * V3.234 grounded owner NEXT ACTION for a freshly read, single-business
 * original customer conversation. No model-generated claims, writes,
 * external communications, booking changes or provider calls.
 * Latest signed-in customer activity is never treated as an appointment.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const CATEGORIES=new Set(["needsReply","waiting","manual","closed","unknown"]);
function chooseOwnerConversationActionV3234({
 businessId="",appId="",requestId="",decision=null,
 request=null,nowISO=""
}={}){
 const deny=reason=>({ok:false,reason,maySend:false,mayConfirmBooking:false,
  customerNotified:false,externalDeliveryVerified:false});
 const now=Date.parse(nowISO);
 if(![businessId,appId,requestId].every(x=>UUID.test(x))||
    !Number.isFinite(now)||!request||
    request.id!==requestId||request.business_id!==businessId||
    request.mini_app_id!==appId||
    !["enquiry","booking_request"].includes(request.request_type)||
    !["received","reviewing","accepted","declined","closed"].includes(request.status)||
    !decision||decision.ok!==true||
    decision.kind!=="fresh_owner_followup_v3207"||
    decision.businessId!==businessId||decision.appId!==appId||
    decision.requestId!==requestId||
    !CATEGORIES.has(decision.category)||
    decision.canAutoSend!==false||
    decision.ownerApprovalRequired!==true||
    decision.customerOutcomeConfirmed!==false||
    typeof decision.sourceStamp!=="string"||decision.sourceStamp.length<40||
    decision.sourceStamp.length>600)
  return deny("The current saved conversation cannot be matched to its owner.");
 // Request.updated_at can change when an owner merely opens an inbox.
 // Follow-up age must use the original latest saved conversation activity.
 const last=Date.parse(decision.latestRecordedActivityAt||"");
 const elapsed=Number.isFinite(last)&&last>0&&last<=now+60000?
   Math.max(0,Math.floor((now-last)/3600000)):null;
 let action="refresh_conversation",title="Check the latest conversation";
 let explanation="BUSY cannot verify who needs to act next. Review the current saved messages.";
 let urgency="review";
 if(decision.category==="closed"){
  action="no_followup";title="No follow-up needed";
  explanation="This request is closed or declined. BUSY will not reopen it or chase the customer.";
  urgency="none";
 }else if(decision.category==="waiting"){
  action="wait_for_customer";title="Wait for the customer's reply";
  explanation="The latest recorded reply is from your business. Delivery and customer reading have not been proven.";
  urgency="none";
 }else if(decision.category==="manual"){
  if(request.request_origin==="guest_web"||!request.consumer_user_id){
   action="review_guest_contact";title="Review how to reply to this guest";
   explanation="An in-app reply cannot reach this guest's receipt. Check their approved contact route before responding.";
  }else if(request.request_type==="booking_request"&&request.status==="accepted"){
   action="verify_work_booking";title="Check the saved Work booking";
   explanation="The request is accepted, but acceptance alone cannot prove a diary booking or that the customer was informed.";
  }
 }else if(decision.category==="needsReply"&&
          decision.canOfferDraft===true&&
          typeof decision.replyDraft==="string"&&decision.replyDraft.trim()){
  action="prepare_owner_reply";title="Review a reply to this customer";
  explanation=request.request_type==="booking_request"?
   "The customer is waiting for a response. Check availability before promising a time; review and approve any reply.":
   "The saved conversation needs a reply. BUSY can prepare an editable draft for your approval.";
  urgency=elapsed===null?"review":elapsed>=24?"attention":"normal";
 }
 // Even an urgent recommendation remains read-only. A timestamp is not
 // evidence that a notification arrived or a customer read the reply.
 return {ok:true,kind:"owner_next_action_v3234",
  businessId,appId,requestId,action,title,explanation,urgency,
  basedOnCurrentSourceStamp:decision.sourceStamp,
  hoursSinceLatestRecordedActivity:elapsed,
  ownerApprovalRequired:true,source:"authenticated_exact_request_and_two_messages",
  maySend:false,mayConfirmBooking:false,mayCharge:false,
  customerNotified:false,externalDeliveryVerified:false,
  actualOwnerReadVerified:false,hasCustomerContact:false};
}
export {chooseOwnerConversationActionV3234};
