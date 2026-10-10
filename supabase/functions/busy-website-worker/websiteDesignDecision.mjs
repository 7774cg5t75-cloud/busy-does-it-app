/**
 * Clear before/after evaluation: safe measured change is NOT automatically a
 * visual improvement, business outcome, or permission to publish.
 */
import {compareWebsiteAudits,changesAreDesignOnly} from "./websiteReviewCycle.mjs";

function websiteDesignDecision({before=null,after=null,
 originalDraft=null,candidateDraft=null,ownerApproved=false}={}){
 const comparison=compareWebsiteAudits(before,after);
 const invalid=reason=>({status:"needs-review",reason,comparison,
   measuredImprovement:false,ownerApproved:false,
   publishAllowed:false,autoApply:false,measuredRevenueLift:null});
 if(!comparison.valid)return invalid(comparison.reason||"Both viewports must be reviewed");
 if(originalDraft||candidateDraft){
   if(!changesAreDesignOnly(originalDraft,candidateDraft))
     return {status:"regression",reason:"Business facts or customer content changed",
       comparison,measuredImprovement:false,
       ownerApproved:false,publishAllowed:false,autoApply:false,measuredRevenueLift:null};
 }
 if(!comparison.noNewMeasuredProblems)
   return {status:"regression",reason:"New measured layout or accessibility problems",
     comparison,measuredImprovement:false,
     ownerApproved:ownerApproved===true,publishAllowed:false,
     autoApply:false,measuredRevenueLift:null};
 return {status:comparison.improved?"measured-improvement":"safe-alternative",
   reason:comparison.improved?
     "Fewer measured website issues without new regressions; human design judgement still required.":
     "No new measured problems. This does not prove the website is more attractive or converts better.",
   comparison,measuredImprovement:comparison.improved,
   ownerApproved:ownerApproved===true,publishAllowed:false,
   autoApply:false,measuredRevenueLift:null};
}
export {websiteDesignDecision};
