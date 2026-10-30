/**
 * V3.224 guest POST-COMMIT readback consistency guard.
 * The database RPC can return the original request for a consumed challenge.
 * Compare that original with THIS sanitized request before claiming it was
 * saved and before attempting another owner notification.
 *
 * Does not query, mutate, send, log contact details or reveal differences.
 * A stored payload mismatch is NOT permission to retry/create anything.
 */
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const FIELDS=Object.freeze({
 enquiry:["name","email","phone","service","message"],
 booking_request:["name","email","phone","service","preferredDate","note"]
});
const fail=()=>({ok:false,reason:"This browser's saved request differs from the current submission. Check the original receipt; do not submit again automatically.",
 storedRequestMatchesSubmission:false,mayNotifyOwner:false,
 mayCreateAnotherRequest:false,bookingConfirmed:false,
 customerDetailsIncluded:false});
function verifyStoredGuestSubmissionV3224({
 row=/** @type {Record<string, unknown>|null} */ (null),sanitized=/** @type {Record<string, unknown>|null} */ (null),requestId="",businessId="",appId="",
 challengeId="",requestType="",idempotencyKey=""
}={}){
 const fields=FIELDS[requestType];
 if(!fields||![requestId,businessId,appId,challengeId].every(v=>UUID.test(v))||
  !row||typeof row!=="object"||!sanitized||typeof sanitized!=="object"||
  !sanitized.payload||typeof sanitized.payload!=="object"||
  row.id!==requestId||row.business_id!==businessId||
  row.mini_app_id!==appId||row.guest_challenge_id!==challengeId||
  row.request_type!==requestType||row.request_origin!=="guest_web"||
  row.identity_assurance!=="guest_browser_challenge"||
  !["received","reviewing","accepted","declined","closed"].includes(row.status))
  return fail();
 const a=row.payload,b=sanitized.payload;
 if(!a||typeof a!=="object"||Array.isArray(a)||Array.isArray(b)||
  Object.keys(a).length!==fields.length||
  Object.keys(b).length!==fields.length||
  fields.some(k=>typeof a[k]!=="string"||typeof b[k]!=="string"||
   a[k]!==b[k])||
  ["contact_name","contact_email","contact_phone","service_name",
    "preferred_date_text"].some((k,i)=>{
   const expected=[sanitized.name,sanitized.email,sanitized.phone,
     sanitized.service,sanitized.preferredDate][i]||"";
   return (row[k]||"")!==expected;
  })||
  typeof idempotencyKey!=="string"||
  idempotencyKey.length>180||
  (row.idempotency_key||"")!==idempotencyKey)
  return fail();
 return {ok:true,kind:"guest_saved_payload_proof_v3224",
  storedRequestMatchesSubmission:true,
  storedRequestId:requestId,requestOrigin:"guest_web",
  savedRequestSource:"independently_read_back_row",
  mayNotifyOwner:row.status==="received",
  mayCreateAnotherRequest:false,bookingConfirmed:false,
  providerNotificationDelivered:false,
  customerDetailsIncluded:false,contactDetailsIncluded:false,
  payloadIncluded:false,shouldRetryCreate:false};
}
export {verifyStoredGuestSubmissionV3224};
