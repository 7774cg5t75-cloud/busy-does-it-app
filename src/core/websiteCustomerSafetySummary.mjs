/**
 * V3.123 customer-facing safety coach: joins the TRUE persisted publishing
 * state, exact-version approval UI, and read-only recovery status. It makes
 * no service request and grants no permission. One useful next step is
 * prioritized; secondary technical information stays hidden until requested.
 */
import {websitePublishApprovalGuide} from "./websitePublishApprovalGuide.mjs";
import {websiteRecoveryCoach} from "./websiteRecoveryCoach.mjs";
function websiteCustomerSafetySummary({
 publishing=null,openedId="",reviewedId="",businessReady=false,
 hasDraft=false,publicDeliveryVerified=false
}={}){
 const view=publishing||{};
 const preview=view.previewDeployment||null;
 const approval=websitePublishApprovalGuide({
  preview,live:view.liveDeployment||null,view,openedId,reviewedId
 });
 const recovery=websiteRecoveryCoach(view);
 const active=!!view.activeJob&&
  ["queued","processing","retry_wait","running"].includes(view.activeJob.status);
 let next="Check business details",reason="Confirm what your business offers and how customers reach you.",
   category="business";
 if(businessReady!==true){
  next="Check business details";
 }else if(!hasDraft){
  next="Create my private website";
  reason="BUSY will build a private first design for you to review.";
  category="private-draft";
 }else if(active||recovery.status==="in-progress"){
  next="Check progress";
  reason="BUSY has an unfinished website job. Wait and refresh before submitting another action.";
  category="wait";
 }else if(recovery.status==="owner-dns"){
  next="Check my domain instructions";
  reason="Your domain provider needs a change from you. BUSY cannot safely change your DNS for you.";
  category="owner-action";
 }else if(recovery.status==="automatic"){
  next="Check recovery progress";
  reason="A bounded recovery check is already scheduled. Do not start a competing retry.";
  category="wait";
 }else if(recovery.status==="manual-recovery"){
  next="Review recovery options";
  reason="A retry may be available, but only after you review the recorded failure.";
  category="manual-recovery";
 }else if(view.draftChangedSinceHosted===true||
          !preview&&!view.liveDeployment){
  next="Prepare an updated website preview";
  reason="Your private changes cannot go public until a new hosted version is prepared.";
  category="prepare";
 }else if(preview&&view.canPublish===true&&!approval.readyForOwnerClick){
  next="Review hosted preview";
  reason=approval.next;
  category="review";
 }else if(approval.readyForOwnerClick){
  next="Choose whether to Go Live";
  reason="The reviewed version is ready for an owner click. The server still checks exact version and permissions.";
  category="approval";
 }else if(view.liveDeployment?.id&&publicDeliveryVerified!==true){
  next="Check the public website";
  reason="The website has a publication record but real HTTPS delivery still needs verification.";
  category="verify";
 }else if(publicDeliveryVerified===true&&view.liveDeployment?.id){
  next="Manage my live website";
  reason="The public version is verified. New changes remain private until you approve them.";
  category="manage";
 }else{
  next="Check my website status";
  reason="Refresh the saved website state before making changes.";
  category="check";
 }
 return {category,next,reason,approval, recovery,
   liveVerified:publicDeliveryVerified===true&&!!view.liveDeployment?.id,
   automaticPublication:false,automaticRetryOfWrites:false,
   publicWebsiteChanged:false,paidServiceCalled:false,
   ownerApprovalRequired:true,mayChangeDns:false};
}
export {websiteCustomerSafetySummary};
