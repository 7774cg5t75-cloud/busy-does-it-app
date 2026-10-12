/**
 * V3.171 — honest request progress communications for the existing BUSY app.
 *
 * No new request state transitions. This is a display-only, privacy-bounded
 * adapter to the V3.158 state machine, shared by customer and owner UI.
 * A diary-link bridge signal without matching request acceptance is flagged,
 * never silently described as customer-visible confirmation. No customer names,
 * message bodies, tokens, dates, or private status details leave this adapter.
 */
import {appRequestJourney} from "./appRequestLifecycle.mjs";
const VALID_TYPES=["booking_request","enquiry"];
const VALID_STATES=["received","reviewing","accepted","declined","closed"];
const VALID_BRIDGES=["","linked_customer","booking_draft","booking_confirmed"];
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
function describeRequestExperience(request,link,{audience="customer"}={}){
 if(!request||!VALID_TYPES.includes(request.request_type)||
    !VALID_STATES.includes(request.status)||
    !["customer","business"].includes(audience))
  return {ok:false,reason:"A valid request state and display audience are required."};
 const type=request.request_type,state=request.status;
 const bridge=typeof link?.bridge_state==="string"&&
    VALID_BRIDGES.includes(link.bridge_state)?link.bridge_state:"";
 // A linked confirmed diary record alone is not proof that the customer's
 // accepted request state has also been propagated to this UI.
 const acceptedBooking=type==="booking_request"&&state==="accepted"&&bridge==="booking_confirmed";
 const inconsistent=type==="booking_request"&&
    (state==="accepted"&&bridge!=="booking_confirmed"||
     bridge==="booking_confirmed"&&state!=="accepted");
 const safeJourney=appRequestJourney(
  {request_type:type,status:state},
  type==="booking_request"?{bridge_state:bridge}:null);
 const guest=request.request_origin==="guest_web";
 let label="",explanation="",nextStep="";
 if(type==="booking_request"){
  if(state==="declined"){
   label="Request declined";explanation="The business declined this booking request.";
   nextStep="Contact the business if you want to discuss another date.";
  }else if(state==="closed"){
   label="Request closed";explanation="This booking request has been closed.";
   nextStep="Ask the business before assuming you have an appointment.";
  }else if(inconsistent){
   label="Booking confirmation needs checking";
   explanation="The request and diary records do not yet agree. This screen cannot confirm your appointment.";
   nextStep=audience==="business"?
    "Check the linked diary booking and request status before telling the customer it is confirmed.":
    "Contact the business to check whether your appointment is confirmed.";
  }else if(acceptedBooking){
   label="Booking confirmed";
   explanation="The linked BUSY diary booking and accepted request are both recorded.";
   nextStep="Review the confirmed appointment details in your booking.";
  }else if(bridge==="booking_draft"){
   label="Booking being arranged";
   explanation="The business has started a draft booking, but your appointment is not yet confirmed.";
   nextStep="The business must confirm the date and time in the diary.";
  }else if(state==="reviewing"||bridge==="linked_customer"){
   label="Business reviewing booking";
   explanation="Your booking request is being reviewed; no appointment is confirmed.";
   nextStep="Wait for the business to confirm the date and time.";
  }else{
   label="Booking request received";
   explanation="The request has been received, but no appointment is confirmed.";
   nextStep="Wait for the business to review your request.";
  }
 }else{
  if(state==="declined"){
   label="Enquiry declined";explanation="The business declined this enquiry.";
   nextStep="Contact the business directly if you need clarification.";
  }else if(state==="closed"){
   label="Enquiry closed";explanation="This enquiry has been closed.";
   nextStep="Contact the business if you still need help.";
  }else if(state==="accepted"){
   label="Enquiry accepted";explanation="The business marked the enquiry accepted. This does not mean a reply was delivered.";
   nextStep="Check your messages for a reply from the business.";
  }else if(state==="reviewing"){
   label="Business reviewing enquiry";
   explanation="The business is reviewing the enquiry. No reply has been verified.";
   nextStep="Check the conversation for an update.";
  }else{
   label="Enquiry received";
   explanation="Your enquiry was received. No reply has been verified.";
   nextStep="Check the conversation for an update.";
  }
 }
 // The public guest browser receipt is not a two-way BUSY chat channel.
 if(guest){
  nextStep=audience==="business"?
   "Guest web requests need follow-up using the customer-supplied contact details; BUSY chat messages are not delivered to the guest receipt.":
   "Check your receipt for status, or contact the business directly. BUSY chat replies are not delivered through the guest receipt.";
 }
 return {ok:true,kind:"bounded_request_experience_v3171",
  type,state,audience,guestWeb:guest,
  title:label,explanation,nextStep,
  stageLabels:safeJourney.stages.map(x=>({key:x.key,label:x.label,
   complete:x.complete&&!inconsistent})),
  confirmationRecorded:acceptedBooking,
  cannotConfirmBooking: type==="booking_request"&&!acceptedBooking,
  inconsistentRecords:inconsistent,
  guestReplyDeliveryUnverified:guest,
  aCustomerReplyWasNotAssumed:true,
  derivedFromStatusOnly:true,noCustomerDataIncluded:true,
  noNotificationSent:true,noBookingChanged:true,noStateTransition:true,
  noPublishing:true};
}
export {describeRequestExperience};
