/**
 * V3.180: measured STORAGE state from the authenticated owner request feed.
 * No sales/conversion prediction, no claims of external delivery or model training.
 * Aggregation is business/app scoped and deliberately strips customer content.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reviewBusinessBrainObservedOutcomes({
 businessId="",appId="",requests=[],links=[],nowISO=""
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||
   !Array.isArray(requests)||requests.length>2000||
   !Array.isArray(links)||links.length>2000)
  return {ok:false,reason:"Review a current private owner request snapshot."};
 const now=Date.parse(nowISO);
 const clockValid=typeof nowISO==="string"&&Number.isFinite(now);
 const records=new Map();
 let excluded=0,invalid=0;
 for(const r of requests){
  if(r?.business_id!==businessId||r?.mini_app_id!==appId||
     !UUID.test(r?.id||"")){excluded++;continue;}
  if(records.has(r.id)||!["booking_request","enquiry"].includes(r.request_type)||
     !["received","reviewing","accepted","declined","closed"].includes(r.status)){
   invalid++;continue;
  }
  records.set(r.id,r);
 }
 const connected=new Map();
 for(const l of links){
  if(l?.business_id!==businessId||!records.has(l?.request_id)||
     connected.has(l.request_id))continue;
  connected.set(l.request_id,l);
 }
 const metrics={requests:0,enquiries:0,bookingRequests:0,
  awaitingOwner:0,awaitingOver48Hours:0,acceptedEnquiries:0,
  ownerMarkedBookings:0,declined:0,unlinked:0,conflictingBookingStates:0,
  guestWeb:0,signedIn:0,otherOrigin:0};
 for(const [id,r] of records){
  const link=connected.get(id),booking=r.request_type==="booking_request";
  metrics.requests++;
  if(booking)metrics.bookingRequests++;else metrics.enquiries++;
  if(["received","reviewing"].includes(r.status)){
   metrics.awaitingOwner++;
   const created=Date.parse(r.created_at||"");
   if(clockValid&&Number.isFinite(created)&&created<=now&&
     now-created>=48*3600*1000)metrics.awaitingOver48Hours++;
  }
  if(r.status==="declined")metrics.declined++;
  if(!booking&&r.status==="accepted")metrics.acceptedEnquiries++;
  if(!link)metrics.unlinked++;
  const ownerConfirmed=link?.bridge_state==="booking_confirmed";
  if(booking&&r.status==="accepted"&&ownerConfirmed)
   metrics.ownerMarkedBookings++;
  if(booking&&(r.status==="accepted")!==!!ownerConfirmed)
   metrics.conflictingBookingStates++;
  if(r.request_origin==="guest_web")metrics.guestWeb++;
  else if(r.request_origin==="signed_in")metrics.signedIn++;
  else metrics.otherOrigin++;
 }
 const priority=metrics.conflictingBookingStates?
  {id:"review_conflicting_bookings",severity:"attention",
    why:"A stored booking status and its owner link do not agree."}:
  metrics.awaitingOver48Hours?
  {id:"review_waiting_customers",severity:"attention",
    why:"Some real stored enquiries or booking requests have waited over 48 hours."}:
  metrics.unlinked?
  {id:"review_unlinked_requests",severity:"review",
    why:"Some stored requests have not been connected to a customer record."}:
  {id:"verify_external_delivery",severity:"unverified",
    why:"Stored request progress is not proof a customer reply arrived or a diary event exists."};
 return {ok:true,kind:"business_brain_observed_outcomes_v3180",
  businessId,appId,metrics,excludedOtherBusinessOrApp:excluded,
  malformedOrDuplicateRows:invalid,
  nextOwnerReview:priority,
  observationType:"owner_scoped_stored_requests",
  timestampsUsable:clockValid,
  measuredExternalDelivery:false,verifiedDiaryEntries:0,
  measuredCustomerConversion:false,measuredBusinessRevenue:false,
  improvementImpactProven:false,crossBusinessComparison:false,
  customerContentReturned:false,privateEvidenceOnly:true,
  noAutomaticMessages:true,noAutomaticEdits:true};
}
export {reviewBusinessBrainObservedOutcomes};
