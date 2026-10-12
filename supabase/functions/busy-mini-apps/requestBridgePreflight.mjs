/**
 * V3.179: fail-closed check BEFORE writing an owner request handoff.
 * The service must first scope the request and existing link to the authenticated
 * business; only the DB can guarantee atomic multi-row updates (not this helper).
 * Owner-entered IDs and dates are NOT independent diary-delivery evidence.
 */
const STATES=["linked","enquiry_linked","booking_draft","booking_confirmed","closed"];
const ID=/^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,159}$/;
function validBookingDate(date,time){
 if(typeof date!=="string"||typeof time!=="string"||
   !/^20\d{2}-\d{2}-\d{2}$/.test(date)||
   !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return false;
 const dt=new Date(date+"T"+time+":00Z");
 return !Number.isNaN(dt.getTime())&&dt.toISOString().slice(0,10)===date;
}
function preflightRequestBridge({
 request=null,existing=null,bridgeState="",customerRecordId="",
 actionRecordId="",metadata=null,ownerApproved=false
}={}){
 const fail=reason=>({ok:false,reason});
 if(!request||!["booking_request","enquiry"].includes(request.request_type)||
   !["received","reviewing","accepted"].includes(request.status)||
   !STATES.includes(bridgeState)||
   !ID.test(customerRecordId)||actionRecordId!==""&&!ID.test(actionRecordId))
  return fail("Use a current, open request and valid owner-linked record IDs.");
 const booking=request.request_type==="booking_request";
 if((bridgeState==="enquiry_linked"&&booking)||
   (["booking_draft","booking_confirmed"].includes(bridgeState)&&!booking))
  return fail("Booking and enquiry actions cannot be mixed.");
 if(["booking_draft","booking_confirmed"].includes(bridgeState)&&!actionRecordId)
  return fail("Choose a linked customer and a draft booking action.");
 if(existing&&(!STATES.includes(existing.bridge_state)||
   existing.customer_record_id!==customerRecordId||
   (existing.action_record_id||"")!==actionRecordId&&
     // A previously customer-only link may acquire its first action ID.
     !!existing.action_record_id))
  return fail("A previous request link cannot silently change customer or action.");
 const prior=existing?.bridge_state||"";
 if(prior==="closed"&&bridgeState!=="closed")
  return fail("Closed handoffs cannot silently reopen.");
 if(prior==="booking_confirmed"&&bridgeState!=="booking_confirmed"&&bridgeState!=="closed")
  return fail("A confirmed owner handoff cannot be downgraded.");
 if(prior==="booking_draft"&&["linked","enquiry_linked"].includes(bridgeState))
  return fail("A booking draft cannot silently return to a customer-only link.");
 const nextStatus=bridgeState==="booking_confirmed"?"accepted":
   bridgeState==="closed"?"closed":"reviewing";
 if(request.status==="accepted"&&nextStatus!=="accepted"&&nextStatus!=="closed")
  return fail("Accepted requests cannot return to review.");
 if(bridgeState==="booking_confirmed"){
  if(ownerApproved!==true||!existing||
    !["booking_draft","booking_confirmed"].includes(prior)||
    !validBookingDate(metadata?.bookingDate,metadata?.bookingTime)||
    (request.status==="accepted"&&prior!=="booking_confirmed"))
   return fail("Confirm a matching existing booking draft, date, time and explicit owner approval.");
 }
 const noChange=!!existing&&prior===bridgeState&&
   request.status===nextStatus&&
   (bridgeState!=="booking_confirmed"||
    (existing.metadata?.bookingDate===metadata?.bookingDate&&
     existing.metadata?.bookingTime===metadata?.bookingTime));
 return {ok:true,nextStatus,noChange,ownerAttested:bridgeState==="booking_confirmed",
  independentDiaryReceiptVerified:false,customerDeliveryVerified:false,
  crossTenantDatabaseProof:false,requiresServerSideTransaction:true};
}
export {validBookingDate,preflightRequestBridge};