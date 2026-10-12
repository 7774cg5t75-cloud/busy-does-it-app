/**
 * V3.172 — a staging test contract, not a network test runner.
 *
 * Live evidence must be supplied later by authenticated isolated-staging
 * integrations. This module only lists required proof, checks allowable
 * evidence metadata and refuses "verified" claims based on manual flags,
 * fictional scenarios, stale revisions or cross-tenant receipts.
 */
const CONTRACT=Object.freeze([
 {id:"auth",label:"Authenticated and tenant-scoped request",type:"security"},
 {id:"submitted",label:"Request persisted once with an idempotent receipt",type:"server"},
 {id:"owner_inbox",label:"Visible to the correct business owner",type:"server"},
 {id:"status",label:"Customer status matches server request state",type:"server"},
 {id:"reply_delivery",label:"Reply delivered through the supported customer channel",type:"delivery"},
 {id:"diary",label:"Separately confirmed diary booking when booking is accepted",type:"booking"},
 {id:"guest",label:"Guest web receipt and reply limitations verified",type:"delivery"},
 {id:"standalone",label:"Standalone package tested independently",type:"device"},
 {id:"device",label:"Real phone/tablet, large text and screen reader reviewed",type:"device"}
]);
const KINDS=["booking_request","enquiry"];
const CHANNELS=["busy_marketplace","standalone","guest_web"];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function stagingJourneyTestPlan({kind="booking_request",channel="busy_marketplace"}={}){
 if(!KINDS.includes(kind)||!CHANNELS.includes(channel))return {
  ok:false,reason:"Select a supported request and customer entry route."};
 const steps=CONTRACT.filter(x=>
  x.id!=="diary"||kind==="booking_request").map(x=>({
   id:x.id,label:x.label,type:x.type,
   state:"not_verified",sourceRequired:"authoritative_isolated_staging",
   evidenceAttached:false
  }));
 return {ok:true,kind:"isolated_staging_qa_contract_v3172",
  requestKind:kind,channel,steps,requiredCount:steps.length,
  verifiedCount:0,untestedCount:steps.length,
  recommendedNext:"Run isolated authenticated tests with fabricated customer identities and inspect backend receipts.",
  safeToRunAutomatically:false,hasRunLiveRequests:false,
  noCredentialsIncluded:true,requiresTenantIsolation:true,
  noCustomerMessagesSent:true,noBookingCreated:true,
  ownerApprovesAnyRealRun:true};
}
function evaluateStagingEvidence({
 kind="booking_request",channel="busy_marketplace",
 businessId="",requestRevision=0,receipts=[]
}={}){
 const plan=stagingJourneyTestPlan({kind,channel});
 if(!plan.ok)return plan;
 if(!UUID.test(businessId)||!Number.isSafeInteger(requestRevision)||
    requestRevision<1||!Array.isArray(receipts)||receipts.length>32)
  return {ok:false,reason:"Authoritative staging evidence must specify a valid tenant and request revision."};
 const accepted=new Set(),rejected=[];
 for(const receipt of receipts){
  const id=receipt?.id,source=receipt?.source,
   rowBusiness=receipt?.businessId,revision=receipt?.requestRevision;
  if(!plan.steps.some(x=>x.id===id)||accepted.has(id)||
     source!=="isolated_staging_authoritative"||
     rowBusiness!==businessId||revision!==requestRevision||
     receipt?.status!=="passed"||receipt?.synthetic===true||
     receipt?.liveCustomerData===true||
     typeof receipt?.attestationId!=="string"||
     !UUID.test(receipt.attestationId)){
   rejected.push(typeof id==="string"&&id.length<40&&/^[a-z_]+$/.test(id)?
    id:"invalid_evidence");
   continue;
  }
  // Important: even a metadata-shaped receipt is not independently
  // authenticated by this client-side function. It is NEVER release proof.
  accepted.add(id);
 }
 const missing=plan.steps.filter(x=>!accepted.has(x.id)).map(x=>x.id);
 return {ok:true,kind:"staging_receipt_metadata_review_v3172",
  requestKind:kind,channel,
  providedReceiptCount:receipts.length,formatAccepted:accepted.size,
  rejectedEvidenceIds:rejected,missingProofIds:missing,
  allMetadataPresent:missing.length===0,
  independentlyAuthenticated:false,allLiveChecksVerified:false,
  mustVerifyServerSignaturesAndLogs:true,doNotTreatAsReleaseApproval:true,
  noSecretsReturned:true,noAttestationIdsReturned:true,
  noAutomaticMessages:true,noBookKeepingChanged:true,
  noPublishing:true};
}
export {CONTRACT,stagingJourneyTestPlan,evaluateStagingEvidence};
