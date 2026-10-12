/**
 * V3.185: honest push-submission evidence, not customer notification proof.
 * Never returns user IDs, push tokens, message text or other tenant details.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function reviewMessageDeliveryIntents({
 businessId="",appId="",rows=[],truncated=false,nowISO=""
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||!Array.isArray(rows)||rows.length>100||
   rows.some(r=>r?.business_id!==businessId||r?.mini_app_id!==appId||
    !UUID.test(r?.id||"")||!UUID.test(r?.request_id||"")||
    !["business","customer"].includes(r?.recipient_role)||
    !["pending","submitted_unverified","no_submission_evidence"].includes(r?.state)))
  return {ok:false,reason:"Current authenticated owner notification summary required."};
 const ids=new Set();
 const counts={total:0,pending:0,pendingOver60Minutes:0,
   submissionWithoutProviderReceipt:0,submittedButDeliveryUnverified:0,
   retriedAttemptCount:0};
 const now=Date.parse(nowISO);
 const canAge=typeof nowISO==="string"&&Number.isFinite(now);
 for(const r of rows){
  if(ids.has(r.id))return {ok:false,reason:"Repeated notification rows need server review."};
  ids.add(r.id);counts.total++;
  if(r.state==="pending"){
   counts.pending++;
   const created=Date.parse(r.created_at||"");
   if(canAge&&Number.isFinite(created)&&now>=created&&now-created>=3600000)
     counts.pendingOver60Minutes++;
  }
  if(r.state==="no_submission_evidence")counts.submissionWithoutProviderReceipt++;
  if(r.state==="submitted_unverified")counts.submittedButDeliveryUnverified++;
  if(Number(r.attempt_count)>1)counts.retriedAttemptCount++;
 }
 const recommendation=counts.pendingOver60Minutes?
  "Review customer messages whose notification attempt was never recorded.":
  counts.submissionWithoutProviderReceipt?
  "Review conversations with no confirmed push submission; the message remains saved.":
  counts.pending?
  "Wait for the notification submission check, then inspect any outstanding records.":
  "Provider submissions are still not proof that customers saw notifications.";
 return {ok:true,kind:"message_delivery_intent_evidence_v3185",
  counts,nextOwnerReview:recommendation,
  coveragePartial:truncated===true||rows.length>=100,
  timestampsUsable:canAge,customerDeliveryVerified:false,
  pushProviderSubmissionNotDeviceReceipt:true,
  noAutomaticResend:true,noCrossBusinessLearning:true,
  customerDetailsReturned:false,productionPushVerified:false};
}
export {reviewMessageDeliveryIntents};
