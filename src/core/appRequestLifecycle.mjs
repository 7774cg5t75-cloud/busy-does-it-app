/**
 * V3.158 read-only request state machine used by owner service and UI.
 * Never infer a confirmed booking from an accepted request.
 */
const STATUS=Object.freeze(["received","reviewing","accepted","declined","closed"]);
function decideAppRequestTransition(request,next,{bridgeState=""}={}){
 const current=request?.status,kind=request?.request_type;
 if(!STATUS.includes(current)||!STATUS.includes(next)||
   !["booking_request","enquiry"].includes(kind))
  return {ok:false,reason:"Unknown request state or customer action."};
 if(current===next)return {ok:true,noChange:true,customerLabel:"No new update"};
 if(["declined","closed"].includes(current))
  return {ok:false,reason:"A declined or closed request cannot silently reopen."};
 if(current==="accepted"&&next!=="closed")
  return {ok:false,reason:"An accepted request can only be closed."};
 if(kind==="booking_request"&&next==="accepted"&&bridgeState!=="booking_confirmed")
  return {ok:false,reason:"Only a separately confirmed BUSY diary booking can mark this booking request accepted."};
 return {ok:true,noChange:false,
  customerLabel:next==="accepted"?(kind==="booking_request"?"Booking confirmed":"Enquiry accepted"):
   next==="reviewing"?"Business reviewing":next==="declined"?"Declined":
   next==="closed"?"Closed":"Request received",
  doesNotConfirmBooking:kind==="booking_request"&&next!=="accepted"};
}
function appRequestJourney(request,link){
 const type=request?.request_type==="booking_request"?"booking_request":"enquiry";
 const state=STATUS.includes(request?.status)?request.status:"received";
 const confirmed=type==="booking_request"&&state==="accepted"&&
  link?.bridge_state==="booking_confirmed";
 const stages=[{key:"received",label:"Request received",complete:true},
  {key:"reviewing",label:"Business reviewing",
   complete:["reviewing","accepted"].includes(state)||!!link?.bridge_state},
  {key:"response",label:type==="booking_request"?"Business confirms appointment":"Business responds",
   complete:type==="booking_request"?confirmed:state==="accepted"}];
 return {type,status:state,confirmed,stages,terminal:["declined","closed"].includes(state),
  customerMessage:confirmed?"Your appointment was confirmed by the business.":
   state==="declined"?"The business declined this request.":
   state==="closed"?"This request has been closed.":
   type==="booking_request"?"This is a booking REQUEST. You do not have a confirmed appointment yet.":
   "Your enquiry is being processed; a reply or acceptance is not guaranteed.",
  requiresHumanConfirmation:type==="booking_request"&&!confirmed};
}
export {STATUS,decideAppRequestTransition,appRequestJourney};
