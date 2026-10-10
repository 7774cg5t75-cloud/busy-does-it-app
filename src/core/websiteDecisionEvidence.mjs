/**
 * Business-specific source attribution for design advice.
 * A liked/rejected preference is explicit owner feedback, not measured sales.
 * Refuse cross-tenant feedback even when a caller accidentally supplies it.
 */
function websiteDecisionEvidence({summary=null,option=null,quality=null,
 currentBusinessId="",authorizedBusinessId=""}={}){
 const scoped=typeof currentBusinessId==="string"&&currentBusinessId.length>0&&
  currentBusinessId===authorizedBusinessId;
 const trusted=scoped&&summary?.scope==="current_business_only"&&
  summary?.source==="owner_explicit_feedback"&&
  summary?.globalLearningEnabled===false&&summary?.modelRetrained===false;
 const family=typeof option?.family==="string"?option.family:null;
 const liked=trusted&&Array.isArray(summary.likedFamilies)&&
  summary.likedFamilies.includes(family);
 const rejected=trusted&&Array.isArray(summary.rejectedFamilies)&&
  summary.rejectedFamilies.includes(family);
 const fact=Array.isArray(quality?.priority)?quality.priority[0]:null;
 const status=!family?"no-option":rejected?"owner-rejected":
   liked?"owner-preferred":"business-context";
 const explanation=!family?
  "BUSY needs a real private draft before suggesting a different look.":
  rejected?"You previously rejected this style. BUSY won't recommend it automatically.":
  liked?"You previously liked this style for this business. BUSY can suggest a private variation.":
  "This style is based on your business category, not measured sales.";
 return {status,family,explanation,
  suggestedAutomatically:!!family&&!rejected,
  previousOwnerPreferenceUsed:!!liked||!!rejected,
  firstImportantFact:typeof fact?.title==="string"?fact.title:null,
  mustPreserveApprovedCustomerFacts:true,
  ownedPhotosOnly:true,customerApprovalStillRequired:true,
  canModifyPublicWebsite:false,mayApplyAutomatically:false,
  measuredTrafficLift:null,measuredConversionLift:null,
  globalPatternLearning:false,modelRetrained:false};
}
export {websiteDecisionEvidence};
