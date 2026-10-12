/**
 * V3.187 connected site/App/customer-journey owner review.
 * Joins ONLY bounded findings from two separately scoped, already-computed
 * private reviews. Never combines raw customer data or synchronises drafts.
 */
const TASKS=new Set(["book","enquire","services"]);
function coordinateCustomerJourneyReview({
 goal="book",businessId="",websiteBusinessId="",appBusinessId="",
 websiteRevision=0,appRevision=0,builderReview=null,outcomeProof=null
}={}){
 if(!TASKS.has(goal)||!businessId||websiteBusinessId!==businessId||
   appBusinessId!==businessId||!builderReview?.ok||
   !Number.isSafeInteger(websiteRevision)||websiteRevision<1||
   !Number.isSafeInteger(appRevision)||appRevision<1||
   builderReview.websiteRevision!==websiteRevision||
   builderReview.appRevision!==appRevision)
  return {ok:false,reason:"Review the current website and app drafts for the same business."};
 const suggestions=[];
 if(builderReview.unresolvedFactChecks>0)
  suggestions.push({id:"check_approved_service_facts",area:"both",
   title:"Review the shared business information",
   reason:"Website and app facts may differ. Differences can be intentional.",
   next:"Compare approved information in both private editors; don't copy it automatically."});
 if(goal==="book"&&outcomeProof?.ok===true&&
    outcomeProof.counts.acceptedWithoutConfirmedWork>0)
  suggestions.push({id:"confirm_booking_work_path",area:"work",
   title:"Check whether accepted bookings reached Work",
   reason:"Some saved accepted requests have no matching confirmed Work entry.",
   next:"Open the original request and inspect the ledger before promising a booking."});
 if(goal==="enquire"&&outcomeProof?.ok===true&&
    outcomeProof.counts.requestsWithoutStoredOwnerReply>0)
  suggestions.push({id:"check_owner_reply_path",area:"customers",
   title:"Check unanswered customer enquiries",
   reason:"Some sampled requests do not have a recorded owner reply.",
   next:"Check the actual conversation; message delivery is not proven."});
 if(["book","enquire"].includes(goal))
  suggestions.push({id:"verify_cross_surface_customer_route",area:"both",
   title:"Test the full customer journey from website and app",
   reason:"A visible page or app button is not proof that the request arrives.",
   next:"Use separately authorised staging accounts and signed JWTs to check request, reply and outcome."});
 return {ok:true,kind:"connected_customer_journey_review_v3187",
  goal,websiteRevision,appRevision,
  actions:suggestions.slice(0,4),
  proposedChangesApplied:0,ownerReviewRequired:true,
  sharedFactsComparedWithoutRawText:true,
  separateWebsiteAndAppDesignPreserved:true,
  customerRequestDetailsIncluded:false,
  realWebsiteSubmissionVerified:false,
  realAppSubmissionVerified:false,
  realEndToEndCompletionVerified:false,
  providerDeliveryVerified:false,
  noAutomaticPublishing:true,noMessageSent:true,noCostIncurred:true};
}
export {coordinateCustomerJourneyReview};
