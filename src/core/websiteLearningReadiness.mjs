/**
 * V3.116 controlled deployment preflight. Never performs any deployment or
 * migration. A written gate guards an owner-approved canary only; no global
 * learning, retrospective consent, photo uploads or model retraining.
 */
function websiteLearningReadiness(evidence={}){
 const checks=[
  ["schema","Production migration verified by an authorised database operator",
   evidence.schemaConfirmed===true],
  ["rls","Service-only table access and tenant isolation tested",
   evidence.tenantIsolationTested===true],
  ["owner","Fresh owner/admin permissions and idempotent feedback retries tested",
   evidence.authAndReplayTested===true],
  ["deletion","Customer clear action verified, including backups and retention disclosure",
   evidence.deletionProcessReviewed===true],
  ["retention","Appropriate purpose, retention period and privacy notice approved",
   evidence.retentionAndNoticeApproved===true],
  ["canary","Explicit founder-approved single-business canary",
   evidence.canaryOwnerApproved===true],
  ["rollback","Reversible rollout and disable switch prepared",
   evidence.rollbackVerified===true]
 ].map(([id,label,passed])=>({id,label,passed}));
 const complete=checks.every(x=>x.passed);
 return {status:complete?"reviewed-for-manual-deployment":"blocked",
  checks,missing:checks.filter(x=>!x.passed).map(x=>x.label),
  mayDeployAutomatically:false,mayEnableCrossBusinessLearning:false,
  modelSelfTraining:false,
  message:complete?"Readiness checklist completed; deployment still requires a separate operator decision.":
   "Keep website style memory disabled in production until every privacy and deployment check is independently verified."};
}
export {websiteLearningReadiness};
