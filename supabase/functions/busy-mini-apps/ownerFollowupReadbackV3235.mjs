/**
 * V3.235: extracted owner follow-up read path from giant Edge controller.
 * Caller must perform real Auth membership/owner role check FIRST.
 * Dependencies are injected so query ordering and no-write policy can be
 * regression tested offline with a strict scoped fake store.
 */
import {decideFreshOwnerFollowup} from "./freshOwnerFollowupV3207.mjs";
import {chooseOwnerConversationActionV3234} from "./ownerConversationActionV3234.mjs";
import {classifyOwnerOutcomeEvidenceV3235} from "./ownerOutcomeEvidenceV3235.mjs";
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
async function readCurrentOwnerFollowupV3235({
 businessId="",requestId="",appId="",store=null,nowISO=""
}={}){
 if(!ID.test(businessId)||!ID.test(requestId)||!ID.test(appId)||
  !store||typeof store.from!=="function"||
  !Number.isFinite(Date.parse(nowISO)))
  throw Error("The original authorised customer conversation is unavailable.");
 const request=await store.from("busy_mini_app_requests")
  .select("id,business_id,mini_app_id,request_type,status,request_origin,consumer_user_id,created_at,updated_at")
  .eq("business_id",businessId).eq("mini_app_id",appId)
  .eq("id",requestId).maybeSingle();
 if(request.error)throw Error("BUSY could not read the original request.");
 if(!request.data)throw Error("This business request is unavailable.");
 const messages=await store.from("busy_mini_app_request_messages")
  .select("id,business_id,mini_app_id,request_id,sender_role,created_at")
  .eq("business_id",businessId).eq("mini_app_id",appId)
  .eq("request_id",requestId)
  .order("created_at",{ascending:false})
  .order("id",{ascending:false})
  .limit(2);
 if(messages.error)throw Error("BUSY could not read the current conversation.");
 const decision=decideFreshOwnerFollowup({
  businessId,appId,requestId,row:request.data,
  messages:messages.data||[],nowISO
 });
 if(!decision.ok)throw Error(decision.reason);
 const nextAction=chooseOwnerConversationActionV3234({
  businessId,appId,requestId,request:request.data,decision,nowISO
 });
 if(!nextAction.ok)throw Error(nextAction.reason);
 const outcomeEvidence=classifyOwnerOutcomeEvidenceV3235({
  businessId,appId,requestId,request:request.data,decision
 });
 if(!outcomeEvidence.ok)throw Error(outcomeEvidence.reason);
 return {...decision,nextAction,outcomeEvidence};
}
export {readCurrentOwnerFollowupV3235};
