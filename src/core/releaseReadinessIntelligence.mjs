/**
 * V3.178 — a truthful, bounded launch-readiness assessment.
 * NEVER interpret a client-provided success flag as independent proof.
 * Authentication, server project identity, actual RLS tests, provider
 * delivery, physical devices, app-store distribution and owner approval are
 * distinct mandatory gates. No scoring can make a blocked gate disappear.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABLE_IDS=["apps","website_deployments","app_owner_history",
 "website_owner_history","synthetic_qa"];
const GATES=Object.freeze([
 ["staging_install","Isolated backend installation"],
 ["staging_access","Owner access in staging"],
 ["tenant_isolation","Cross-business privacy testing"],
 ["customer_booking","Actual booking request and diary confirmation"],
 ["enquiry_delivery","Actual enquiry and reply delivery"],
 ["website_hosting","Current website and rollback checks"],
 ["standalone_distribution","Independent app distribution checks"],
 ["physical_devices","iPhone, Android, tablet and assistive technology"],
 ["billing_privacy","Consent, billing, usage and data-protection review"],
 ["release_owner_approval","Explicit final owner release approval"]
]);
function evaluateReleaseReadiness({
 businessId="",appId="",draftRevision=0,
 installAudit=null,syntheticEvidence=null,
 independentProofs=[]
}={}){
 if(!UUID.test(businessId)||!UUID.test(appId)||
   !Number.isSafeInteger(draftRevision)||draftRevision<1||
   !Array.isArray(independentProofs)||independentProofs.length>30)
  return {ok:false,reason:"A current private business and draft revision are required."};
 const validAudit=installAudit?.ok===true&&
   installAudit?.kind==="isolated_staging_install_audit_v3178"&&
   installAudit?.source==="authenticated_staging_server_schema_read_only"&&
   installAudit?.businessId===businessId&&installAudit?.appId===appId&&
   installAudit?.draftRevision===draftRevision&&
   installAudit?.readOnly===true&&installAudit?.sourceRowsReturned===false&&
   Array.isArray(installAudit?.checks)&&installAudit.checks.length===TABLE_IDS.length&&
   TABLE_IDS.every(id=>installAudit.checks.some(x=>x.id===id&&
    ["reachable","unavailable"].includes(x.status)))&&
   new Set(installAudit.checks.map(x=>x.id)).size===TABLE_IDS.length;
 const reached=validAudit?installAudit.checks.filter(x=>x.status==="reachable").length:0;
 const installed=validAudit&&reached===TABLE_IDS.length;
 const validSynthetic=syntheticEvidence?.ok===true&&
   syntheticEvidence?.businessId===businessId&&
   syntheticEvidence?.appId===appId&&
   syntheticEvidence?.draftRevision===draftRevision&&
   syntheticEvidence?.syntheticDatabaseRoundTripVerified===true&&
   syntheticEvidence?.serverReadBackVerified===true&&
   syntheticEvidence?.evidenceType==="isolated_staging_synthetic_db_round_trip"&&
   syntheticEvidence?.noCustomerRequestCreated===true;
 // Independent proof packages are a future BACKEND-verification input;
 // this client-side evaluator does not accept them as certified proof.
 const statuses={
  staging_install:installed?"installation_reported_by_server":"blocked",
  staging_access:validAudit?"server_reported_not_independently_audited":"blocked",
  tenant_isolation:"not_verified",
  customer_booking:"not_verified",
  enquiry_delivery:"not_verified",
  website_hosting:"not_verified",
  standalone_distribution:"not_verified",
  physical_devices:"not_verified",
  billing_privacy:"not_verified",
  release_owner_approval:"not_authorised"
 };
 const gates=GATES.map(([id,label])=>({id,label,status:statuses[id],
  independentlyVerified:false,
  releaseBlocking:true}));
 const blockers=(!validAudit?["Connect the authorised isolated staging backend."]:
   !installed?["Install the required migrations and Edge services in isolated staging."]:
    ["Independently verify staging authentication, tenancy and RLS."]);
 blockers.push("Prove real test-only booking and enquiry delivery, status, replies and confirmed diary.");
 blockers.push("Verify hosted websites, standalone builds and real-device accessibility.");
 blockers.push("Audit consent, billing, privacy and credits before owner release approval.");
 return {ok:true,kind:"release_readiness_v3178",
  draftRevision,gateCount:gates.length,gates,
  visibleStagingTables:reached,totalStagingTables:TABLE_IDS.length,
  receivedStagingServerAudit:!!validAudit,
  stagingInstallReported:!!installed,
  syntheticDbRoundTripReported:!!validSynthetic,
  independentProofItemsIgnored:independentProofs.length,
  independentlyVerifiedGateCount:0,
  unresolvedMandatoryGates:gates.length,
  releaseState:"not_ready",
  blockers:blockers.slice(0,5),
  nextPriority:!installed?"Install and verify the isolated staging backend first.":
   "Run independently authenticated cross-tenant and real customer-journey tests.",
  noAutomaticPublish:true,noCustomerContact:true,
  noSpendAuthorised:true,ownerApprovalStillRequired:true,
  launchPermitted:false};
}
export {GATES,TABLE_IDS,evaluateReleaseReadiness};
