/**
 * V3.187 -- externally observed isolated-staging readiness as a collection
 * of independent gates, NOT a permission decision or a SQL executor.
 * Never infer a checked item from a script being present or a canary being green.
 */
const PROJECT="pnjdlogwegnqbsfpcofw";
const EXPECTED=["pgcrypto","pgmq","pg_cron","pg_net"];
const REQUIRED=[
 ["project_identity","Confirm isolated staging project ref independently"],
 ["migration_integrity","Verify the numbered SQL and SHA-256 manifest"],
 ["extension_review","Review and install required extensions in staging only"],
 ["sql_side_effect_review","Review grants, cron, external calls and destructive SQL"],
 ["rollback_restore_test","Document and TEST isolated staging restoration"],
 ["auth_role_contract","Review auth.users, membership roles, RLS and service grants"],
 ["migration_ledger_reconciled","Reconcile two existing canary migrations"],
 ["edge_secrets_isolated","Check staging-only Edge secrets and callbacks"],
 ["owner_authorisation","Obtain explicit separate approval for staging installation"]
];
function createStagingExecutionGate({
 projectRef="",projectHealthy=false,canaryPresent=false,
 publicAppTables=0,edgeFunctionCount=0,extensions={},
 checks={}
}={}){
 if(typeof checks!=="object"||!checks||Array.isArray(checks)||
  typeof extensions!=="object"||!extensions||Array.isArray(extensions)||
  !Number.isSafeInteger(publicAppTables)||publicAppTables<0||
  !Number.isSafeInteger(edgeFunctionCount)||edgeFunctionCount<0)
  return {ok:false,reason:"Provide bounded, separately verified staging observations."};
 const known={
  project_identity:projectRef===PROJECT&&projectHealthy===true&&canaryPresent===true,
  extension_review:EXPECTED.every(x=>extensions[x]===true),
 };
 const gates=REQUIRED.map(([id,instruction])=>({
  id,instruction,
  // project and installed-extension facts are not self-approved via booleans
  passed:id in known?known[id]===true:checks[id]===true,
  observation:id in known?"project_or_extension_observation":"requires_independent_documented_review"
 }));
 const blockers=gates.filter(x=>!x.passed).map(x=>x.id);
 const exercise=[
  {id:"fictional_auth_isolation",why:"Two owners and consumers must use real signed staging JWTs"},
  {id:"enquiry_owner_reply",why:"Request, saved reply and unread must be observed from separate accounts"},
  {id:"ambiguous_retry",why:"Retry after an interrupted response must not insert another message"},
  {id:"booking_work_cancel",why:"Work ledger and customer request status must agree after confirmation and cancellation"},
  {id:"notification_gateway",why:"Check submitted/failed/unknown gateway evidence, never infer device delivery"},
  {id:"website_app_consistency",why:"Approved business facts must agree where intended, without copying private drafts"},
  {id:"rollback_recovery",why:"Recover isolated staging without affecting the canary or production"}
 ];
 return {ok:true,kind:"isolated_staging_review_gate_v3187",
  targetProjectRef:PROJECT,observedProjectRef:projectRef,
  blockers,gates,plannedExercises:exercise,
  existingAppTablesObserved:publicAppTables,
  edgeFunctionsObserved:edgeFunctionCount,
  missingExtensions:EXPECTED.filter(x=>extensions[x]!==true),
  preparedForIndependentHumanReview:blockers.length===0,
  actualOwnerApprovalIndependentlyProven:false,
  installationAuthorisedByThisResult:false,
  installationExecuted:false,productionUntouchedByThisModule:true,
  genuineJwtTestPerformed:false,realCustomerOutcomesProven:false};
}
export {createStagingExecutionGate};
