/**
 * V3.218 — pure idempotent request WRITE DECISION under hypothetical server
 * facts. NEVER executes SQL or returns visitor data, receipts or authority.
 * Concurrency safety must come from a unique Postgres constraint plus atomic
 * challenge consumption, NOT JavaScript maps or a client-supplied readback.
 */
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const HASH=/^[a-f0-9]{64}$/;
const TYPES=new Set(["enquiry","booking_request"]);
const fail=(reason,disposition="reject")=>({
 ok:false,reason,disposition,mayInsert:false,verifiedSaved:false,
 publicEndpointEnabled:false,bookingConfirmed:false,notificationDelivered:false});
function decision({scope=null,keyDigest="",payloadDigest="",
 ledger=null,challenge=null,now=""}={}){
 if(!scope||!UUID.test(scope.businessId)||!UUID.test(scope.websiteId)||
   !UUID.test(scope.deploymentId)||!UUID.test(scope.appId)||
   !TYPES.has(scope.requestType)||!HASH.test(keyDigest)||
   !HASH.test(payloadDigest))
  return fail("Missing valid server-owned request scope or opaque digests.");
 // Never allow a browser-provided row or idempotency key to cross business,
 // website, deployment or request type.
 const dimensions=["businessId","websiteId","deploymentId","requestType"];
 if(ledger!==null){
  if(!ledger||typeof ledger!=="object"||
     dimensions.some(k=>ledger[k]!==scope[k])||
     ledger.keyDigest!==keyDigest)
    return fail("Idempotency state belongs to a different source.");
  if(ledger.payloadDigest!==payloadDigest)
    return fail("An idempotency key cannot be reused for a different payload.","conflict");
  if(ledger.state==="committed"&&UUID.test(ledger.requestId))
   return {ok:true,kind:"idempotency_rehearsal_v3218",
    disposition:"lookup_existing_receipt",requestIdHint:ledger.requestId,
    independentServerReadbackRequired:true,mayInsert:false,
    verifiedSaved:false,publicEndpointEnabled:false,
    bookingConfirmed:false,notificationDelivered:false,
    reason:"An existing ID is only a pointer; the server must independently authenticate and read it."};
  if(["claiming","unknown","committed"].includes(ledger.state))
   return {ok:true,kind:"idempotency_rehearsal_v3218",
    disposition:"reconcile_before_retry",mayInsert:false,
    verifiedSaved:false,publicEndpointEnabled:false,
    bookingConfirmed:false,notificationDelivered:false,
    reason:"The previous write outcome is uncertain. Reconcile the same unique scope; never create another request."};
  return fail("Unknown idempotency state must fail closed.");
 }
 const epoch=Date.parse(now),expiry=Date.parse(challenge?.expiresAt);
 if(!challenge||dimensions.some(k=>challenge[k]!==scope[k])||
    challenge.keyDigest!==keyDigest||challenge.state!=="verified"||
    challenge.consumed!==false||challenge.abuseLimitsPassed!==true||
    !Number.isFinite(epoch)||!Number.isFinite(expiry)||
    expiry<=epoch||expiry-epoch>15*60*1000)
  return fail("A live verified, source-bound, unconsumed challenge is required.");
 return {ok:true,kind:"idempotency_rehearsal_v3218",
  disposition:"requires_atomic_rpc",mayInsert:false,
  atomicInsertNeeded:true,challengeMustBeConsumedInSameTransaction:true,
  uniqueConstraintNeeded:true,digestComparisonRequired:true,
  independentServerReadbackRequired:true,verifiedSaved:false,
  publicEndpointEnabled:false,bookingConfirmed:false,
  notificationDelivered:false,
  reason:"Source-only decision. No request exists until server Postgres commits and an authorised readback verifies it."};
}
export {decision as rehearseWebsiteRequestIdempotencyV3218};
