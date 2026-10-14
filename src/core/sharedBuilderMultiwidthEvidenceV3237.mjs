/**
 * V3.237: fail-closed evaluator for FUTURE real website preview evidence.
 * A source-bound DOM report is a measurement claim, NOT a screenshot,
 * accessibility certification, native app proof or publishing permission.
 * Fake fixture reports used by CI must never be presented as real captures.
 */
import {compareWebsiteVisualReports}
 from "./websiteMeasuredDesignCoach.mjs";
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ranges={phone:[320,600],tablet:[601,1000],desktop:[1001,2200]};
const fail=reason=>({ok:false,reason,eligibleForOwnerReview:false,
 canApply:false,canPublish:false,proofOfLiveCustomerJourney:false});
function reviewSharedBuilderMultiwidthEvidenceV3237({
 businessId="",website=null,plan=null,pageId="",deviceReports=[]
}={}){
 if(!UUID.test(businessId)||website?.businessId&&website.businessId!==businessId||
    website?.business_id&&website.business_id!==businessId||
    !website?.id||!Number.isSafeInteger(website.generation)||
    website.generation<1||!Array.isArray(website.pages)||
    !website.pages.some(p=>p?.id===pageId&&p.enabled!==false)||
    plan?.ok!==true||plan.kind!=="universal_builder_plan_v3210"||
    plan.businessId!==businessId||plan.planningOnly!==true||
    plan.noPublishPerformed!==true||plan.noChargeMade!==true||
    plan.source?.websiteId!==website.id||
    plan.source?.websiteRevision!==website.generation)
  return fail("Use the current private website, exact business, page and source revision.");
 if(!Array.isArray(deviceReports)||deviceReports.length!==3)
  return fail("Supply separate same-revision phone, tablet and desktop measurements.");
 const seen=new Set(),results=[];
 for(const d of deviceReports){
  if(!d||!Object.hasOwn(ranges,d.device)||seen.has(d.device)||
     !Number.isSafeInteger(d.width)||d.width<ranges[d.device][0]||
     d.width>ranges[d.device][1]||
     d.businessId!==businessId||d.websiteId!==website.id||
     d.generation!==website.generation||d.pageId!==pageId||
     d.original?.counts?.viewport!==d.width||
     d.candidate?.counts?.viewport!==d.width||
     d.original?.counts?.width<0||d.candidate?.counts?.width<0)
   return fail("Measurements must identify the same page and revision at distinct supported widths.");
  seen.add(d.device);
  const comparison=compareWebsiteVisualReports(d.original,d.candidate);
  if(!comparison.valid)return fail("One device comparison lacks comparable measured layout evidence.");
  results.push({device:d.device,width:d.width,
   originalWarnings:comparison.originalProblemCount,
   candidateWarnings:comparison.candidateProblemCount,
   regressions:[...comparison.regressions].slice(0,15),
   improved:comparison.improved,
   noNewMeasuredProblems:comparison.noNewMeasuredProblems});
 }
 if(seen.size!==3)return fail("Phone, tablet and desktop evidence are all required.");
 const regressions=results.filter(x=>!x.noNewMeasuredProblems);
 const improvements=results.filter(x=>x.improved);
 const eligible=regressions.length===0&&improvements.length>0;
 return {
  ok:true,kind:"shared_builder_multiwidth_evidence_v3237",
  businessId,source:{websiteId:website.id,websiteRevision:website.generation,
   pageId},results:results.sort((a,b)=>a.width-b.width),
  regressionDevices:regressions.map(x=>x.device),
  improvementDevices:improvements.map(x=>x.device),
  eligibleForOwnerReview:eligible,
  summary:regressions.length?
   "Keep the original: a measured warning increased on at least one screen.":
   improvements.length?
    "The candidate reduced measured warnings without known regressions at these three widths. Human visual review is still needed.":
    "No measured improvement across these three widths; compare the original visually.",
  evidenceClass:"client_supplied_dom_measurements_not_authenticated_screenshots",
  captureProvenanceNotVerified:true,
  notAnAestheticScore:true,notAccessibilityCertification:true,
  noActualScreenshotsCapturedByThisModule:true,
  noAppDeviceMeasurement:true,ownerApprovalRequired:true,
  canApply:false,canPublish:false,canContactCustomer:false,
  proofOfLiveCustomerJourney:false,noCrossBusinessSharing:true
 };
}
export {reviewSharedBuilderMultiwidthEvidenceV3237};