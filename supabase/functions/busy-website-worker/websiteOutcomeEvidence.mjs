/**
 * Compare independent browser quality evidence with exact-revision owner
 * feedback, without treating either as analytics or permitting publication.
 * Caller must provide the server-authorised business identity.
 */
import {websiteDesignDecision} from "./websiteDesignDecision.mjs";
const choices=new Set(["kept","reverted"]);
function websiteOutcomeEvidence({
 before=null,after=null,originalDraft=null,candidateDraft=null,
 businessId="",authorizedBusinessId="",family="",revision="",
 feedback=null
}={}){
 const verifiedBusiness=typeof businessId==="string"&&businessId.length>0&&
   businessId===authorizedBusinessId;
 if(!verifiedBusiness)return {
   status:"not-authorized",design:null,ownerDecision:null,
   verifiedSalesLift:null,verifiedConversionLift:null,
   published:false,autoApply:false,crossBusinessLearning:false
 };
 const design=websiteDesignDecision({before,after,originalDraft,candidateDraft});
 const outcome=feedback?.scope==="current_business_only"&&
   feedback?.source==="owner_explicit_feedback"&&
   feedback?.globalLearningEnabled===false?
   feedback.latestOwnerDecision:null;
 const matching=choices.has(outcome?.choice)&&outcome.family===family&&
   typeof revision==="string"&&revision.length>0&&
   outcome.draftVersion===revision;
 const decision=matching?{
   choice:outcome.choice,source:"explicit_owner_report",
   note:"The owner reported a design choice; visits, enquiries and sales were not independently measured."
 }:null;
 return {status:design.status==="regression"?"regression":
   design.status==="needs-review"?"insufficient-quality-evidence":
   decision?"owner-choice-and-browser-review":"browser-review-only",
  design,ownerDecision:decision,verifiedSalesLift:null,
  verifiedConversionLift:null,published:false,
  autoApply:false,crossBusinessLearning:false,
  evidenceSources:decision?["rendered_browser_quality","owner_explicit_feedback"]:
    ["rendered_browser_quality"]};
}
export {websiteOutcomeEvidence};
