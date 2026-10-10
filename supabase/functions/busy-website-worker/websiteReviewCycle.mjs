/**
 * V3.104 — private visual design review cycle.
 * Pure orchestration: trusted caller supplies tenant-scoped screenshot capture,
 * credit reservation, genuine model review and private-draft rebuild.
 * No network access, database writes or publication in this module.
 */
import {applyApprovedVisualProposals} from "./visualCriticContract.mjs";

const array=x=>Array.isArray(x)?x:[];
const clean=x=>String(x||"").trim();
const idOf=draft=>[clean(draft?.id),clean(draft?.updatedAt),String(draft?.generation||0)].join("|");
function visualRisks(data){
 const m=data?.mobileAudit,d=data?.desktopAudit;
 if(!m||!d)return ["Both desktop and mobile screenshot measurements are required"];
 const problems=[];
 for(const [type,a]of [["mobile",m],["desktop",d]]){
   if(a.horizontalOverflowPixels>2)problems.push(type+" horizontal overflow");
   if(a.headingVisible===false)problems.push(type+" heading hidden");
   if(a.navigationFits===false)problems.push(type+" navigation overflow");
   if(a.heroHeadingFontPx>0&&a.heroHeadingFontPx<22)problems.push(type+" heading too small");
 }
 return problems;
}
function changesAreDesignOnly(original,revised){
 if(!original||!revised||original.id!==revised.id)return false;
 const keys=["businessName","businessType","brandLabel","serviceArea","description",
   "sections","seo","publish","readiness","sourceSummary","slug"];
 return keys.every(k=>JSON.stringify(original[k])===JSON.stringify(revised[k]));
}
async function runWebsiteDesignReviewCycle({
 draft,tenantId,allowedTenantId,consent=false,allowPaidReview=false,
 creditReservation=null,captureScreenshots,visionReview,rebuildPrivateDraft,
 ownerApprovedSuggestions=false,reviewId=""
}={}){
 if(!draft?.id||!tenantId||!allowedTenantId||tenantId!==allowedTenantId)
   return {status:"not-authorized",calls:0,reason:"Website and authenticated business must match"};
 if(!consent)return {status:"consent-required",calls:0,reason:"Website owner must opt into screenshot review"};
 if(typeof captureScreenshots!=="function")
   return {status:"capture-unavailable",calls:0,reason:"Trusted private screenshot capture not connected"};
 const originalId=idOf(draft);
 const first=await captureScreenshots(draft,{stage:"original",tenantId,reviewId});
 if(!first?.mobile||!first?.desktop)
   return {status:"capture-failed",calls:0,reason:"Two private website screenshots are required"};
 const initialRisks=visualRisks(first);
 const overview={mobileAudit:first.mobileAudit||null,desktopAudit:first.desktopAudit||null,
   issues:initialRisks,screenshotSource:first.source||"private-renderer"};
 if(!allowPaidReview || typeof visionReview!=="function"){
   return {status:"visual-audit-only",calls:0,original:overview,
     reason:"Layout measurements captured. Paid screenshot AI is not connected."};
 }
 if(!creditReservation?.reservationId||creditReservation?.tenantId!==tenantId||
   creditReservation?.status!=="reserved"||Number(creditReservation?.maxCalls)!==1)
   return {status:"credit-reservation-required",calls:0,original:overview,
     reason:"An authenticated, atomic credit reservation is required before one paid review"};
 // Exactly one call; the engine never retries or starts an unreserved re-review.
 const result=await visionReview({
   mobile:first.mobile,desktop:first.desktop,
   approvedPhotos:Number(draft.designPlan?.signals?.approvedPhotos||0)
 });
 if(result?.status!=="completed"||result?.source!=="screenshot-ai"||
   result?.providerCalls!==1||result?.report?.valid!==true||
   result.report.source!=="actual-screenshot-review")
   return {status:"review-unverified",calls:1,original:overview,
     reason:"Vision provider did not return a verified, design-only screenshot critique"};
 const base={status:"reviewed",calls:1,original:overview,aiReport:result.report,
   usage:result.usage||{},reservationId:creditReservation.reservationId,
   published:false,originalDraftVersion:originalId};
 if(!ownerApprovedSuggestions)return {...base,status:"approval-required",
   reason:"Owner must approve proposed visual changes before a private candidate is generated"};
 const applied=applyApprovedVisualProposals(draft,result.report,{ownerApproved:true});
 if(!applied.applied||typeof rebuildPrivateDraft!=="function")
   return {...base,status:"no-safe-edits",reason:applied.reason};
 if(!changesAreDesignOnly(draft,applied.draft))
   return {...base,status:"rejected-unsafe-change",reason:"Proposal altered customer business content"};
 // Rebuild complete generated HTML and fresh page model, never mutate the source.
 const candidate=await rebuildPrivateDraft(applied.draft,{tenantId,reviewId,stage:"candidate"});
 if(!changesAreDesignOnly(draft,candidate)||!candidate?.html)
   return {...base,status:"rejected-unsafe-change",reason:"Candidate rebuild changed owner facts or failed"};
 const second=await captureScreenshots(candidate,{stage:"candidate",tenantId,reviewId});
 if(!second?.mobile||!second?.desktop)
   return {...base,status:"candidate-capture-failed",reason:"Improved candidate could not be visually rechecked"};
 const revisedRisks=visualRisks(second);
 return {...base,status:"candidate-ready",candidate,
   revised:{mobileAudit:second.mobileAudit||null,desktopAudit:second.desktopAudit||null,
     issues:revisedRisks,screenshotSource:second.source||"private-renderer"},
   comparison:{
     originalProblemCount:initialRisks.length,
     candidateProblemCount:revisedRisks.length,
     improved:revisedRisks.length<initialRisks.length,
     noNewMeasuredProblems:revisedRisks.length<=initialRisks.length
   },
   reason:"Private before/after comparison complete. Not automatically published. Fresh AI re-review needs another explicit reservation."};
}
export {visualRisks,changesAreDesignOnly,runWebsiteDesignReviewCycle};
