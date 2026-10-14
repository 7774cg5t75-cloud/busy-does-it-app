/**
 * V3.234 client trust boundary for BUSY's server-sourced next step.
 * Refuse stale or another-business suggestions; never imply permission
 * to send a reply, take payment or confirm a diary booking.
 */
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const choices={
 needsReply:new Set(["prepare_owner_reply"]),
 waiting:new Set(["wait_for_customer"]),
 closed:new Set(["no_followup"]),
 manual:new Set(["review_guest_contact","verify_work_booking","refresh_conversation"]),
 unknown:new Set(["refresh_conversation"])
};
function verifyOwnerNextStepV3234({
 businessId="",appId="",requestId="",decision=null,nextAction=null
}={}){
 const deny=reason=>({ok:false,reason,maySend:false,
  mayConfirmBooking:false,noAutomaticCustomerContact:true});
 if(![businessId,appId,requestId].every(x=>ID.test(x))||
  !decision||decision.ok!==true||
  !choices[decision.category]||!nextAction||
  nextAction.ok!==true||nextAction.kind!=="owner_next_action_v3234"||
  nextAction.businessId!==businessId||nextAction.appId!==appId||
  nextAction.requestId!==requestId||
  nextAction.basedOnCurrentSourceStamp!==decision.sourceStamp||
  !choices[decision.category].has(nextAction.action)||
  typeof nextAction.title!=="string"||nextAction.title.length<4||
  nextAction.title.length>110||
  typeof nextAction.explanation!=="string"||
  nextAction.explanation.length<12||nextAction.explanation.length>500||
  !["none","normal","attention","review"].includes(nextAction.urgency)||
  nextAction.ownerApprovalRequired!==true||
  nextAction.maySend!==false||nextAction.mayConfirmBooking!==false||
  nextAction.mayCharge!==false||nextAction.customerNotified!==false||
  nextAction.externalDeliveryVerified!==false||
  nextAction.hasCustomerContact!==false)
  return deny("BUSY needs to recheck the latest saved conversation before suggesting an action.");
 return {ok:true,title:nextAction.title,explanation:nextAction.explanation,
  action:nextAction.action,urgency:nextAction.urgency,
  sourceStamp:nextAction.basedOnCurrentSourceStamp,
  ownerApprovalRequired:true,maySend:false,mayConfirmBooking:false,
  noAutomaticCustomerContact:true,providerDelivered:false};
}
export {verifyOwnerNextStepV3234};
