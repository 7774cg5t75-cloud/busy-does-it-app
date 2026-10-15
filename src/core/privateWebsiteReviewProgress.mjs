import {reviewPrivateWebsiteCandidateWidthsV3239} from "./privateWebsiteCandidateWidthV3239.mjs";
import {inspectCurrentWebsiteCandidateV3240} from "./websiteCurrentCandidateV3240.mjs";

function currentWebsiteDesignCandidate(candidate,{businessId,website,pageId}={}){
 return !!candidate&&!!businessId&&candidate.businessId===businessId&&
  candidate.websiteId===website?.id&&candidate.baseGeneration===website?.generation&&
  candidate.pageId===pageId&&(!website.businessId||website.businessId===businessId)&&
  (!website.business_id||website.business_id===businessId);
}
function privateWebsiteReviewProgress(state,{businessId,website,pageId,candidate,mode}={}){
 if(!currentWebsiteDesignCandidate(candidate,{businessId,website,pageId}))
  return {ok:false,mayKeep:false,next:null,reason:"The private design changed. Prepare it again in the current business."};
 const args={businessId,website,pageId,candidateId:candidate.id,baseGeneration:candidate.baseGeneration};
 const review=state?reviewPrivateWebsiteCandidateWidthsV3239(state,args):null;
 if(state&&!review?.ok)return {ok:false,mayKeep:false,next:null,reason:review.reason};
 const widths=["phone","tablet","desktop"];
 let next=null;
 for(const width of widths){
  for(const variant of ["original","candidate"]){
   if(!state?.records?.[width]?.[variant]){next={mode:width,variant};break;}
  }
  if(next)break;
 }
 const current=state?inspectCurrentWebsiteCandidateV3240(state,{...args,mode}):null;
 return {ok:true,mayKeep:current?.ok===true&&current.safeForPrivateApproval===true,
  review,current,next,complete:review?.complete===true,
  hasRegressions:review?.hasRegressions===true,
  nextLabel:review?.hasRegressions?"A checked layout became worse. Return to the original or inspect that width.":
   next?"Check "+next.variant+" on "+next.mode:
    "All three widths are checked. Review the appearance before keeping the design.",
  noScreenshots:true,noCustomerJourneyProof:true};
}
export {currentWebsiteDesignCandidate,privateWebsiteReviewProgress};
