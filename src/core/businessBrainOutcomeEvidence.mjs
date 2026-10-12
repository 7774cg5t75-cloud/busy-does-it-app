/** V3.177 — evidence-limited Business Brain outcome evaluation.
 * A staging synthetic round-trip proves one isolated DB write/read ONLY,
 * never customer conversion, diary booking, email delivery or sales.
 */
const KINDS=["booking_request","enquiry"];
const CHANNELS=["busy_marketplace","standalone","guest_web"];
function assessBrainOutcomeEvidence({
 businessId="",appId="",revision=0,evidence=null,
 routeKind="booking_request",channel="busy_marketplace"
}={}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 if(!uuid.test(businessId)||!uuid.test(appId)||
  !Number.isSafeInteger(revision)||revision<1||
  !KINDS.includes(routeKind)||!CHANNELS.includes(channel))
  return {ok:false,reason:"Choose a current private app and supported journey."};
 const match=evidence?.businessId===businessId&&
  evidence?.appId===appId&&evidence?.draftRevision===revision&&
  evidence?.journeyKind===routeKind&&evidence?.channel===channel&&
  evidence?.syntheticDatabaseRoundTripVerified===true&&
  evidence?.evidenceType==="isolated_staging_synthetic_db_round_trip"&&
  evidence?.serverReadBackVerified===true&&
  evidence?.noCustomerRequestCreated===true&&
  evidence?.noCustomerMessagesSent===true;
 return {ok:true,kind:"bounded_outcome_evidence_v3177",
  syntheticStagingEvidencePresented:!!match,
  conclusion:match?"staging_db_round_trip_only":"unverified",
  canClaimRealBookings:false,canClaimRealEnquiries:false,
  canClaimActualMessageDelivery:false,canClaimCustomerConversion:false,
  canClaimSalesLift:false,readOnlyEvaluation:true,
  ownerMustApproveLiveChanges:true,notReleaseApproval:true,
  nextStep:match?"Test the real customer request flow in isolated staging with server-authorised evidence.":
    "Get a valid authenticated staging result, then verify a real customer journey separately."};
}
export {assessBrainOutcomeEvidence};
