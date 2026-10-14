/**
 * V3.220 — no-execution phase approval/rollback safety review.
 * Never convert a user-supplied true flag into proof of an installed schema.
 * Missing source integrity, staging identity, real restore or tenant RLS
 * blocks the next phase; even all flags true cannot auto-execute.
 */
const fail=reason=>({ok:false,reason,mayApply:false,
 installationVerified:false,publicEndpointEnabled:false});
function reviewStagingPhaseV3220({plan=null,phaseId="",proof=null}={}){
 if(!plan?.ok||plan.canaryCompatible!==true||
  !Array.isArray(plan.phases)||!phaseId||
  !plan.phases.some(p=>p.id===phaseId)||!proof||typeof proof!=="object")
  return fail("A matching source plan, clean canary and a bounded phase review are required.");
 const phase=plan.phases.find(p=>p.id===phaseId);
 const marks=[
  ["matching_project","Exact isolated staging project identity independently checked"],
  ["immutable_source","File-level SQL hashes checked against reviewed source"],
  ["extension_review","Needed Postgres extensions and privileges reviewed"],
  ["side_effect_review","Scheduled jobs, external HTTP, elevated functions and secrets reviewed"],
  ["migration_ledger","Existing migration history reconciled without overwriting the canary"],
  ["backup_restore","Recoverable backup and restore separately rehearsed"],
  ["tenant_rls","Cross-business Auth/JWT ownership and RLS independently tested"],
  ["approval","Explicit owner approval for this exact phase, not all phases"]
 ];
 const gates=marks.map(([key,title])=>({
  key,title,reported:proof[key]===true,
  independentlyVerifiedByThisFunction:false
 }));
 const reporting=gates.every(x=>x.reported);
 const requested=!!proof.previouslyApplied;
 return {ok:true,kind:"staging_phase_readiness_v3220",
  phaseId,sourceFiles:phase.fileCount,
  reviewSignals:phase.flagged.length,
  evidenceClaimsComplete:reporting,
  selfReportedApplied:requested,
  gates,missing:gates.filter(x=>!x.reported).map(x=>x.key),
  evidenceOrigin:"caller_claim_only",
  ownerApprovalVerifiedByThisFunction:false,
  sourceHashVerifiedByThisFunction:false,
  realRestoreVerifiedByThisFunction:false,
  tenantSecurityVerifiedByThisFunction:false,
  mayApply:false,installationVerified:false,
  publicEndpointEnabled:false,productionChanged:false,
  nextStep:reporting?
    "Independent operator verification and explicit staging approval are still required before any SQL.":
    gates.find(x=>!x.reported)?.title};
}
export {reviewStagingPhaseV3220};
