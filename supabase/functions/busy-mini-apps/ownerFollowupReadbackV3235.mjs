/**
 * V3.235: extracted owner follow-up read path from giant Edge controller.
 * Caller must perform real Auth membership/owner role check FIRST.
 * Dependencies are injected so query ordering and no-write policy can be
 * regression tested offline with a strict scoped fake store.
 */
import {decideFreshOwnerFollowup} from "./freshOwnerFollowupV3207.mjs";
import {chooseOwnerConversationActionV3234} from "./ownerConversationActionV3234.mjs";
import {classifyOwnerOutcomeEvidenceV3235} from "./ownerOutcomeEvidenceV3235.mjs";
import {prepareOwnerConversation,parseEnquiryListingReference,conversationReviewSignal} from "./ownerConversationPreparation.mjs";
import {publicBusinessContent} from './businessContentRecords.mjs';
const ID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
async function readCurrentOwnerFollowupV3235({
 businessId="",requestId="",appId="",store=null,nowISO="",prepareReply=false
}={}){
 if(!ID.test(businessId)||!ID.test(requestId)||!ID.test(appId)||
  !store||typeof store.from!=="function"||
  !Number.isFinite(Date.parse(nowISO)))
  throw Error("The original authorised customer conversation is unavailable.");
 const request=await store.from("busy_mini_app_requests")
  .select("id,business_id,mini_app_id,request_type,status,request_origin,consumer_user_id,created_at,updated_at"+(prepareReply?",payload,service_name":""))
  .eq("business_id",businessId).eq("mini_app_id",appId)
  .eq("id",requestId).maybeSingle();
 if(request.error)throw Error("BUSY could not read the original request.");
 if(!request.data)throw Error("This business request is unavailable.");
 const messages=await store.from("busy_mini_app_request_messages")
  .select("id,business_id,mini_app_id,request_id,sender_role,created_at"+(prepareReply?",body":""))
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
 const signal=prepareReply&&decision.category==='needsReply'?conversationReviewSignal(messages.data?.[0]?.sender_role==='customer'?messages.data[0].body:request.data.payload?.message):null;
 if(signal){
  decision.category='manual';decision.canOfferDraft=false;decision.replyDraft=null;
  decision.why=signal==='review_contact_preference'?
   'The customer may have asked to stop contact. Review their preferences; Busy will not prepare a follow-up.':
   'The customer may be finished with this enquiry. Review whether to close it; no status has been changed.';
 }
 if(prepareReply&&decision.category==="needsReply"){
  const app=await store.from("busy_mini_apps").select("id,business_id,current_live_version_id")
   .eq("business_id",businessId).eq("id",appId).maybeSingle();
  if(app.error||app.data?.id!==appId||app.data?.business_id!==businessId)
   throw Error("The current published app could not be checked.");
  let config=null;const versionId=app.data.current_live_version_id;
  if(versionId){
   const version=await store.from("busy_mini_app_versions").select("id,mini_app_id,state,config")
    .eq("mini_app_id",appId).eq("id",versionId).maybeSingle();
   if(version.error||version.data?.id!==versionId||version.data?.mini_app_id!==appId||version.data?.state!=='live')
    throw Error("The approved app facts could not be checked.");
   config=version.data.config;
  }
  decision.sourceStamp+="|facts:"+(versionId||"none");
  let listingFeed=null;const selection=parseEnquiryListingReference(request.data.payload?.message);
  if(selection){
   const listing=await store.from('busy_business_content').select('id,business_id,kind,revision,published,published_revision')
    .eq('business_id',businessId).eq('id',selection.recordId).maybeSingle();
   if(listing.error)throw Error('The selected approved listing could not be checked.');
   if(listing.data&&(listing.data.business_id!==businessId||listing.data.id!==selection.recordId))throw Error('The selected listing does not match this business.');
   listingFeed=publicBusinessContent(listing.data?[listing.data]:[],businessId,{now:nowISO});
   if(!listingFeed.ok)throw Error('The selected public listing needs review.');
   decision.sourceStamp+='|listing:'+selection.recordId+':'+(listing.data?.published_revision||'missing');
  }
  const preparation=prepareOwnerConversation({request:request.data,
   latestMessage:messages.data?.[0]||null,publishedConfig:config,listingFeed,businessId,now:Date.parse(nowISO)});
  decision.replyDraft=preparation.draft;
  decision.preparation=preparation;
  decision.customerDataIncluded=true;
 }
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
