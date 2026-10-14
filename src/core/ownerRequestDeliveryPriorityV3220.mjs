/**
 * V3.220 — private operational recommendation after a business request.
 * Existing signed-in/guest request receipt and outbox remain independent.
 * Requires authorised server readbacks; this pure helper cannot authenticate
 * the booleans or source of inputs. Never sends or retries provider work.
 */
import {reviewRequestRecoveryV3218} from "./requestRecoveryStateV3218.mjs";
import {reviewNotificationOutboxV3219} from "./outboxReconciliationV3219.mjs";
function reviewOwnerRequestDeliveryV3220({
 businessId="",appId="",requestId="",writeState="unknown",
 request=null,requestReadbackAuthorized=false,inbox=null,
 eventKey="",outbox=null,outboxReadbackAuthorized=false
}={}){
 const stored=reviewRequestRecoveryV3218({
  scope:{businessId,appId,requestId},writeState,readback:request,
  readbackAuthorized:requestReadbackAuthorized,inboxProof:inbox,
  outbox:null
 });
 if(!stored.ok)return {ok:false,reason:stored.reason,sendAllowed:false,
  newRequestRecommended:false,providerDelivered:false};
 const delivery=reviewNotificationOutboxV3219({
  businessId,requestId,eventKey,row:outbox,
  readbackAuthorized:outboxReadbackAuthorized
 });
 const saved=stored.savedRequestIndependentlyVerified===true;
 const hasOutbox=delivery.ok===true;
 const urgent=!saved?"check_original_request":
  !stored.ownerInboxVerified?"refresh_owner_inbox":
  hasOutbox&&delivery.outboxState==="dead_letter"?
   "review_failed_notifications":
  hasOutbox&&delivery.outboxState==="failed"?
   "review_notification_retry":
  "review_customer_request";
 return {ok:true,kind:"owner_request_delivery_priority_v3220",
  action:urgent,requestSavedInApp:!!saved,
  currentOwnerInboxVerified:stored.ownerInboxVerified===true,
  notificationState:hasOutbox?delivery.outboxState:"not_verified",
  independentlyVerifiedDelivery:false,
  ownerNeedsReview:true,customerReplySent:false,
  bookedInDiary:false,newRequestRecommended:false,
  requeueAutomatically:false,sendAllowed:false,
  providerDelivered:false,customerContactIncluded:false,
  noCrossTenantDataIncluded:true,notes:!saved?
   "The request outcome is uncertain; reconcile the original server receipt.":
   "Saved requests, owner inbox, push provider state, and calendar confirmation are separate proofs."};
}
export {reviewOwnerRequestDeliveryV3220};
