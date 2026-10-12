/**
 * V3.180: shared owner-authored facts, distinct website/app experiences.
 * This never syncs drafts, guesses business details or grants server access.
 * Scope must be independently verified again by the authenticated Edge
 * writer before ANY later save. This is read-only client-side guidance.
 */
import {reviewBusinessInformation} from "./businessInfoClarity.mjs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAP={
 different_business_names:"Check the business name on both surfaces",
 different_service_sets:"Check the actual services offered",
 different_service_counts:"Review which services each surface displays",
 missing_service_description:"Review descriptions without making them identical",
 missing_business_name:"Confirm the website business name",
 missing_app_business_name:"Confirm the Business App name"
};
function prepareCoordinatedBuilderReview({
 businessId="",appBusinessId="",websiteBusinessId="",
 websiteDraft=null,brandBrain={},appConfig=null,
 websiteRevision=0,appRevision=0
}={}){
 if(!UUID.test(businessId)||appBusinessId!==businessId||
   websiteBusinessId!==businessId||!websiteDraft||
   !Array.isArray(websiteDraft.sections)||!appConfig||
   !Array.isArray(appConfig.modules)||
   !Number.isSafeInteger(websiteRevision)||websiteRevision<1||
   !Number.isSafeInteger(appRevision)||appRevision<1||
   websiteDraft.generation!==websiteRevision)
  return {ok:false,reason:"Open current private website and app drafts for the same business."};
 const clarity=reviewBusinessInformation({websiteDraft,brandBrain,appConfig,
  scope:{authorizedBusinessId:businessId,websiteBusinessId,appBusinessId}});
 if(!clarity.ok)return clarity;
 const seen=new Set(),actions=[];
 for(const issue of clarity.issues){
  if(!MAP[issue.id]||seen.has(issue.id))continue;
  seen.add(issue.id);
  actions.push({key:issue.id,surface:issue.surface,
   title:MAP[issue.id],
   next:"Review the existing approved information in the private editors.",
   ownerApprovalRequired:true,automaticallyApplied:false});
 }
 return {ok:true,kind:"coordinated_builder_review_v3180",
  websiteRevision,appRevision,unresolvedFactChecks:actions.length,
  sharedServiceOverlapCount:clarity.matchingServiceNamesCount,
  websiteOnlyServiceCount:clarity.websiteOnlyServiceNamesCount,
  appOnlyServiceCount:clarity.appOnlyServiceNamesCount,
  actions:actions.slice(0,6),
  sameBusinessOnly:true,readOnlyLocalReview:true,
  preserveIndependentLayouts:true,preserveWebsiteAndAppBrandVariations:true,
  noTextOrPrivateDetailsReturned:true,noUnapprovedCopying:true,
  requiresServerScopeAndRevisionRecheckBeforeFutureWrites:true,
  ownerMustApproveAnyChanges:true,noPublishing:true,noSpend:true};
}
export {prepareCoordinatedBuilderReview};
