/**
 * V3.150 private visual AI design studio.
 *
 * AI must first review VERIFIED screenshots from an authenticated, opted-in,
 * metered hosted-preview request. The model's enum-only proposals are staged
 * as 1–3 *reversible private candidates*, never published or persisted.
 *
 * This does not claim that the model independently re-inspected subsequent
 * screenshots: new rendered candidates still need real mobile/desktop checks.
 * Shared design decisions (not screenshot/evidence payloads) are suitable for
 * reuse by future builders.
 */
import {applyApprovedVisualProposals} from "../../supabase/functions/busy-website-worker/visualCriticContract.mjs";
import {privateBuilderRevisionMatches,privateBuilderVisualIntegrity} from "./privateBuilderBoundary.mjs";
const fail=reason=>({ok:false,reason,candidates:[]});
function previewWebsiteAIStudio(draft,{report,pageId="home",sourceGeneration,
  draftId,deploymentId,reviewDeploymentId}={}, {rebuild,render}={}){
 if(!privateBuilderRevisionMatches(draft,{draftId,generation:sourceGeneration,pageId})||
  !deploymentId||reviewDeploymentId!==deploymentId)
  return fail("This visual review is from a different website or revision.");
 if(!report?.valid||report.providerConfirmed!==true||
    report.source!=="actual-screenshot-review"||report.requiresOwnerReview!==true)
  return fail("A genuine completed screenshot review is required.");
 if(typeof rebuild!=="function"||typeof render!=="function")
  return fail("The website preview renderer is unavailable.");
 if(!Array.isArray(report.proposals)||!report.proposals.length||report.proposals.length>3)
  return fail("No supported design changes were suggested.");
 let originalHtml;
 try{originalHtml=render(draft,pageId);}catch{return fail("Original website preview unavailable.");}
 const safeHtml=html=>typeof html==="string"&&html.length<500000&&
   html.startsWith("<!doctype html>")&&!/<script\b|data-busy-edit-section/i.test(html);
 if(!safeHtml(originalHtml))return fail("Only static private website HTML can be previewed.");
 const candidates=[];
 for(let count=1;count<=report.proposals.length;count++){
  const proposal={...report,proposals:report.proposals.slice(0,count)};
  // This flag enables pure in-memory calculation only. It does not mean
  // customer approval: result.draft is NOT passed to the React app state.
  const staged=applyApprovedVisualProposals(draft,proposal,{ownerApproved:true});
  if(!staged.applied)continue;
  let next,html;
  try{next=rebuild(staged.draft);html=render(next,pageId);}catch{continue;}
  if(!next||next.id!==draft.id||next.generation<=draft.generation||!safeHtml(html))continue;
  // Reuse the same revision/presentation-only boundary future builders
  // can adopt; reject changes to navigation, contacts, media or identities.
  if(!privateBuilderVisualIntegrity(draft,next).ok)continue;
  candidates.push({count,html,description:report.proposals.slice(0,count)
    .map(p=>String(p.reason||p.path+" → "+p.value).slice(0,180)),
    generation:draft.generation,originalHtml});
 }
 return candidates.length
  ?{ok:true,draftId:draft.id,generation:draft.generation,pageId,deploymentId,
    candidates,originalHtml,requiresOwnerApproval:true,autoPublished:false,
    laterScreenshotReviewRequired:true,
    message:"BUSY prepared "+candidates.length+
      " private design alternative(s) from the verified AI review. Compare and choose; no changes were saved."}
  :fail("No safe design alternative could be prepared from these AI suggestions.");
}
export {previewWebsiteAIStudio};
