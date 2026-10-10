/**
 * Private owner-stated website preference guidance. Not conversion tracking.
 * Never use unknown scope or a cross-business summary to personalize.
 */
const allowed=["kept","reverted"];
function websiteOutcomeGuidance(summary,{currentFamily="",currentRevision=""}={}){
 const safe=summary?.scope==="current_business_only"&&
   summary?.source==="owner_explicit_feedback"&&
   summary?.globalLearningEnabled===false&&summary?.modelRetrained===false;
 const decision=safe?summary.latestOwnerDecision:null;
 const sameDesign=allowed.includes(decision?.choice)&&
   decision?.family===currentFamily&&
   typeof decision?.draftVersion==="string"&&
   decision.draftVersion===String(currentRevision);
 const message=sameDesign?
   (decision.choice==="kept"?
     "You told BUSY you kept this design. BUSY can remember that preference for this business.":
     "You told BUSY you changed away from this design. BUSY can suggest a different style next time."):
   safe&&Number.isSafeInteger(summary.eventCount)&&summary.eventCount>0?
    "Your style preferences are saved for this business. Website visits, sales and enquiries have not been measured here.":
    "No verified private design preference is available yet.";
 return {status:sameDesign?"owner-reported-choice":
   safe?"preference-only":"unavailable",
  sameRevision:sameDesign,message,
  observedConversionImprovement:null,verifiedRevenueChange:null,
  websitePerformanceMeasured:false,
  sharedBetweenBusinesses:false,
  trainedAiModel:false,
  ownerSaidKept:sameDesign&&decision.choice==="kept"};
}
export {websiteOutcomeGuidance};
