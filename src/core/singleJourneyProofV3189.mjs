/* V3.189: single-request evidence policy. Auth/tenant checks MUST occur before readback. */
const isId=x=>typeof x==="string"&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
function reviewSingleJourney({businessId,appId,request,messages=[],work=[],links=[],complete={}}={}){
 const bad={ok:false,reason:"Complete authorised records are needed.",automaticActionAllowed:false};
 if(!isId(businessId)||!isId(appId)||!request||request.business_id!==businessId||
  request.mini_app_id!==appId||!isId(request.id)||
  !["received","reviewing","accepted","declined","closed"].includes(request.status)||
  !["enquiry","booking_request"].includes(request.request_type)||
  !Array.isArray(messages)||messages.length>150||!Array.isArray(work)||work.length>200||
  !Array.isArray(links)||links.length>200||!complete||
  typeof complete!=="object"||Array.isArray(complete))return bad;
 const rows=[...messages,...work,...links];
 if(rows.some(r=>!r||r.business_id!==businessId||r.request_id!==request.id||
  (r.mini_app_id!==undefined&&r.mini_app_id!==appId)))return bad;
 if(messages.some(m=>!["business","customer"].includes(m.sender_role))||
  work.some(w=>!["confirmed","cancelled"].includes(w.state))||
  links.some(l=>typeof l.bridge_state!=="string"))return bad;
 const allRead=["request","messages","work","links"].every(k=>complete[k]===true);
 const hasReply=messages.some(m=>m.sender_role==="business");
 const active=work.filter(w=>w.state==="confirmed");
 const cancelled=work.filter(w=>w.state==="cancelled");
 const confirmedLink=links.some(l=>l.bridge_state==="booking_confirmed");
 const problems=[];
 if(work.length>1||links.length>1)problems.push("competing_records");
 if(["closed","declined"].includes(request.status)&&active.length>0)
  problems.push("closed_request_has_active_booking");
 if(allRead&&request.status==="accepted"&&request.request_type==="booking_request"&&
  (active.length!==1||!confirmedLink))problems.push("accepted_booking_needs_reconciliation");
 const next=problems.length?
  "Check the request and Work booking together before changing it.":
  !allRead?"Read the complete booking and conversation first.":
  !hasReply?"Check whether a reply is needed before sending one.":
  "Saved records were checked; delivery and actual completion still need verification.";
 return {ok:true,kind:"single_journey_proof_v3189",issues:problems,
  sourceReportedComplete:allRead,ownerReplySaved:hasReply,
  replyNotFoundInCompleteRecord:allRead&&!hasReply,
  confirmedInBusyWork:allRead&&problems.length===0&&
   request.request_type==="booking_request"&&request.status==="accepted"&&
   work.length===1&&links.length===1&&active.length===1&&confirmedLink,
  cancelledInBusyWork:allRead&&problems.length===0&&
   request.request_type==="booking_request"&&
   ["closed","declined"].includes(request.status)&&
   work.length===1&&cancelled.length===1&&active.length===0,
  next,independentJwtVerified:false,deviceDeliveryVerified:false,
  jobCompletedVerified:false,automaticActionAllowed:false,
  returnsCustomerContent:false};
}
export {reviewSingleJourney};
