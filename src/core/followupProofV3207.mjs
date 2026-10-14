/**
 * V3.207: trust only a current owner-scoped server decision, never the
 * old 30-row overview, before filling an editable customer reply.
 * No network, persistence, sending or external side effects here.
 */
import {verifyOwnerNextStepV3234} from "./followupNextActionV3234.mjs";
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const CATEGORIES=new Set(["needsReply","waiting","closed","manual","unknown"]);
const reject=reason=>({ok:false,reason,mayPrepareDraft:false,
 maySendWithoutApproval:false,confirmedDelivery:false});
function checkCurrentOwnerFollowup({
 businessId="",appId="",requestId="",result=null,previousStamp=null
}={}){
 if(![businessId,appId,requestId].every(x=>ID.test(x))||
   result?.ok!==true||result?.kind!=="fresh_owner_followup_v3207"||
   result.businessId!==businessId||result.appId!==appId||
   result.requestId!==requestId||
   !CATEGORIES.has(result.category)||
   typeof result.sourceStamp!=="string"||
   result.sourceStamp.length<40||result.sourceStamp.length>600||
   typeof result.why!=="string"||result.why.length>600||
   result.canAutoSend!==false||
   result.independentProviderDeliveryVerified!==false||
   result.customerOutcomeConfirmed!==false||
   result.ownerApprovalRequired!==true)
  return reject("BUSY could not confirm this current owner-scoped request.");
 const canPrepare=result.category==="needsReply"&&
   result.canOfferDraft===true&&
   ["enquiry","booking_request"].includes(result.requestType)&&
   typeof result.replyDraft==="string"&&result.replyDraft.trim()&&
   result.replyDraft.length<=600;
 if(result.category!=="needsReply"&&
    (result.canOfferDraft!==false||result.replyDraft!==null))
  return reject("The current customer request does not justify a draft reply.");
 if(result.category==="needsReply"&&!canPrepare)
  return reject("The proposed reply needs fresh owner review.");
 if(previousStamp!==null&&previousStamp!==result.sourceStamp)
  return {...reject("The conversation changed. Review the latest evidence before preparing a reply."),
   changedSinceReview:true};
 // Present next-step evidence must match the exact stamped conversation.
 // Absent legacy evidence keeps older offline source fixtures compatible.
 const nextStep=result.nextAction===undefined?null:
  verifyOwnerNextStepV3234({businessId,appId,requestId,
   decision:result,nextAction:result.nextAction});
 if(nextStep&&!nextStep.ok)return reject(nextStep.reason);
 return {ok:true,kind:"owner_followup_review_v3207",
  businessId,appId,requestId,
  category:result.category,why:result.why,
  nextStep:nextStep?.ok?nextStep:null,
  sourceStamp:result.sourceStamp,
  requestType:result.requestType,
  draft:canPrepare?result.replyDraft:null,
  mayPrepareDraft:!!canPrepare,
  needsOwnerApproval:true,maySendWithoutApproval:false,
  deliveryOrReadVerified:false,diaryBookingConfirmed:false,
  checkedUsingFreshServerReadback:true,
  copiedCustomerInformation:false,
  futureCustomerActionsScheduled:false};
}
export {checkCurrentOwnerFollowup};
