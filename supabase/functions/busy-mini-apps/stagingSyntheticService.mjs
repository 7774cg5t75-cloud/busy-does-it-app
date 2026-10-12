/**
 * V3.177 test-only backend round trip. Call only after:
 *  - requireUser + owner/admin membership,
 *  - isolatedStagingGuard checking SERVER environment,
 *  - explicit owner approval on each request.
 * Never touches customer request, notification, diary, publishing or payment
 * tables. This is a genuine isolated staging DB write/read, NOT customer E2E.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS=new Set(["booking_request","enquiry"]);
const CHANNELS=new Set(["busy_marketplace","standalone","guest_web"]);
async function runSyntheticStagingProbe(
 supabase,appForBusiness,businessId,userId,body,requestKey){
 if(body?.ownerApproved!==true||!KINDS.has(body?.journeyKind)||
    !CHANNELS.has(body?.channel)||typeof requestKey!=="string"||
    !/^[A-Za-z0-9:_-]{8,160}$/.test(requestKey))
  throw Error("Choose a permitted synthetic test route and approve this isolated staging run.");
 const app=await appForBusiness(businessId);
 if(!app||!UUID.test(app.id)||app.id!==body.appId||
    !Number.isSafeInteger(body.expectedRevision)||
    body.expectedRevision<1||
    Number(app.draft_revision)!==body.expectedRevision)
  throw Error("Your private Business App changed. Refresh before testing.");
 const entry={business_id:businessId,owner_user_id:userId,
  app_id:app.id,draft_revision:body.expectedRevision,
  request_key:requestKey,journey_kind:body.journeyKind,
  channel:body.channel,synthetic_state:"recorded"};
 const created=await supabase.from("busy_staging_qa_runs")
  .insert(entry).select("id").single();
 if(created.error&&created.error.code!=="23505")
  throw Error("The isolated synthetic staging store is not ready.");
 const selected=await supabase.from("busy_staging_qa_runs")
  .select("id,app_id,draft_revision,journey_kind,channel,synthetic_state")
  .eq("business_id",businessId).eq("owner_user_id",userId)
  .eq("request_key",requestKey).maybeSingle();
 const r=selected.data;
 if(selected.error||!r||r.app_id!==app.id||
  Number(r.draft_revision)!==body.expectedRevision||
  r.journey_kind!==body.journeyKind||r.channel!==body.channel||
  r.synthetic_state!=="recorded")
  throw Error("The staging request key did not match the original test.");
 return {syntheticDatabaseRoundTripVerified:true,
  evidenceType:"isolated_staging_synthetic_db_round_trip",
  appId:app.id,draftRevision:body.expectedRevision,
  journeyKind:body.journeyKind,channel:body.channel,
  idempotentRepeat:created.error?.code==="23505",
  serverReadBackVerified:true,ownerMembershipCheckedByCaller:true,
  noCustomerRequestCreated:true,noInboxDeliveryVerified:true,
  noDiaryBookingCreated:true,noCustomerMessagesSent:true,
  noRealBusinessOutcomeProven:true,notProductionReleaseProof:true};
}
export {runSyntheticStagingProbe};
