/**
 * V3.184: one shared owner/customer reply boundary. SQL commits message,
 * reviewing event, updated_at and unread together; provider push follows.
 * Client request-id must remain stable across transport retries for true
 * idempotence. Success is a DB receipt, never proof of push delivery.
 */
async function sendAtomicConversation(supabase,{
 actorUserId,businessId,requestId,senderRole,message,idempotencyKey
}={}){
 if(!actorUserId||!businessId||!requestId||
   !["business","customer"].includes(senderRole)||
   typeof message!=="string"||!message.trim()||message.length>3000||
   typeof idempotencyKey!=="string"||
   !/^[A-Za-z0-9:_-]{8,180}$/.test(idempotencyKey))
  throw new Error("Choose a signed-in customer conversation with a valid reply and request ID.");
 const result=await supabase.rpc("busy_send_mini_app_message_v3185",{
  p_actor_user_id:actorUserId,p_business_id:businessId,
  p_request_id:requestId,p_sender_role:senderRole,p_body:message,
  p_idempotency_key:idempotencyKey
 });
 if(result.error)throw result.error;
 const value=result.data;
 if(!value||typeof value.changed!=="boolean"||
   value.databaseMessageSaved!==true||
   value.providerDeliveryVerified!==false||
   value.deliveryIntentDurable!==true||
   typeof value.outboxId!=="string"||
   value.message?.request_id!==requestId||
   value.message?.business_id!==businessId||
   value.message?.sender_user_id!==actorUserId||
   value.message?.sender_role!==senderRole)
  throw new Error("The saved reply receipt could not be verified. Refresh the conversation.");
 return {reused:value.changed===false,message:value.message,
   databaseMessageSaved:true,customerDeliveryVerified:false,
   providerDeliveryVerified:false,
   outboxId:value.outboxId,outboxState:value.outboxState,
   deliveryIntentDurable:true};
}
export {sendAtomicConversation};
