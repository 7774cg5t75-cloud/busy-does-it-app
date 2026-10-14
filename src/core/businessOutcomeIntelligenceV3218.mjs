/**
 * V3.218 — privacy-minimal Business Brain priorities from OWNER-scoped
 * aggregate evidence. This never fetches data; the caller must supply
 * independently authorised server metrics. Client flags aren't server proof.
 * No cross-business learning, retraining, send, provider spend or publishing.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const KEYS=["enquiriesReceived","waitingForOwner","acceptedEnquiries",
 "bookingRequests","independentlyConfirmedBookings","websiteVisits"];
const fail=reason=>({ok:false,reason,priority:"verify_business_evidence",
  recommendations:[],aggregatedLearningPerformed:false,
  noNewCustomerActions:true,noExternalCalls:true});
function reviewBusinessOutcomesV3218({
 businessId="",rollup=null,authorisedBusinessId="",ownerSharingConsent=false
}={}){
 if(!UUID.test(businessId)||businessId!==authorisedBusinessId||
    !rollup||rollup.business_id!==businessId||
    rollup.source!=="server_authorized_rollup"||
    typeof rollup.period_start!=="string"||
    !/^\d{4}-\d{2}-\d{2}$/.test(rollup.period_start))
   return fail("Only a same-business authorised rollup may inform owner priorities.");
 if(KEYS.some(k=>!Number.isSafeInteger(rollup[k])||
    rollup[k]<0||rollup[k]>1000000))
   return fail("Metrics must be bounded whole counts from one verified reporting period.");
 if(rollup.waitingForOwner>rollup.enquiriesReceived||
    rollup.acceptedEnquiries>rollup.enquiriesReceived||
    rollup.independentlyConfirmedBookings>rollup.bookingRequests)
   return fail("Report counts conflict. Verify their common period and sources.");
 // Read-only recommendations are presented as hypotheses, not causal proof.
 const ideas=[];
 const add=(id,title,reason)=>ideas.push({id,title,reason,
  ownerReviewRequired:true,autoActionPermitted:false});
 if(rollup.waitingForOwner>0)
   add("review_waiting","Review enquiries waiting for you",
    "The business's source-labelled report includes requests awaiting owner review.");
 if(rollup.enquiriesReceived>=5&&rollup.acceptedEnquiries===0)
   add("review_conversion","Review how enquiries are handled",
    "Received enquiries are recorded, but none are marked accepted in this period.");
 if(rollup.bookingRequests>0&&rollup.independentlyConfirmedBookings===0)
   add("review_booking_proofs","Check booking confirmations",
    "Booking requests exist without an independently confirmed appointment count.");
 if(rollup.websiteVisits>=50&&rollup.enquiriesReceived===0)
   add("review_contact_path","Review how website visitors can enquire",
    "Reported visits exist without requests; source comparability must be checked before attributing the cause.");
 if(!ideas.length)
   add("keep_evidence_current","Keep checking genuine customer outcomes",
    "No action should be invented from an incomplete or non-actionable report.");
 return {ok:true,kind:"business_outcome_priorities_v3218",
  businessId,periodStart:rollup.period_start,
  priority:ideas[0].id,recommendations:ideas.slice(0,4),
  evidenceSourceLabel:"provided_server_authorized_rollup_unattested_by_this_module",
  independentlyFetchedByThisModule:false,
  ownerSharingConsentReported:ownerSharingConsent===true,
  aggregatedLearningPerformed:false,crossBusinessDataReturned:false,
  retrainingPerformed:false,customerDetailsReturned:false,
  ownerApprovalRequired:true,noNewCustomerActions:true,
  noExternalCalls:true,allOutcomesRequireServerVerification:true};
}
export {reviewBusinessOutcomesV3218};
