/**
 * V3.221 — source-only review of the already-existing V3.180 STAGING-ONLY
 * business core baseline. This is NOT a full SQL parser, real permissions
 * proof, an installer, a credential check or an authorisation to deploy.
 */
const REQUIRED=[
 ["business_table",/\bcreate\s+table\s+if\s+not\s+exists\s+public\.busy_businesses\s*\(/i],
 ["membership_table",/\bcreate\s+table\s+if\s+not\s+exists\s+public\.busy_business_memberships\s*\(/i],
 ["auth_user_fk",/\breferences\s+auth\.users\s*\(\s*id\s*\)/i],
 ["business_fk",/\breferences\s+public\.busy_businesses\s*\(\s*id\s*\)/i],
 ["member_pk",/\bprimary\s+key\s*\(\s*business_id\s*,\s*user_id\s*\)/i],
 ["business_rls",/\balter\s+table\s+public\.busy_businesses\s+enable\s+row\s+level\s+security/i],
 ["member_rls",/\balter\s+table\s+public\.busy_business_memberships\s+enable\s+row\s+level\s+security/i],
 ["business_forced_rls",/\balter\s+table\s+public\.busy_businesses\s+force\s+row\s+level\s+security/i],
 ["member_forced_rls",/\balter\s+table\s+public\.busy_business_memberships\s+force\s+row\s+level\s+security/i],
 ["no_direct_business_client_access",/\brevoke\s+all\s+on\s+table\s+public\.busy_businesses\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i],
 ["no_direct_membership_client_access",/\brevoke\s+all\s+on\s+table\s+public\.busy_business_memberships\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i],
 ["role_allowlist",/\brole\s+text\s+not\s+null\s+check\s*\(\s*role\s+in\s*\(\s*'owner'\s*,\s*'admin'\s*,\s*'staff'\s*,\s*'viewer'\s*\)\s*\)/i],
 ["staging_label",/staging.only|isolated staging.compatibility/i]
];
const DANGEROUS=[
 ["external_network",/\b(?:net\s*\.\s*http_(?:get|post|put|delete)|http_get|http_post)\s*\(/i],
 ["scheduled_workers",/\bcron\s*\.\s*schedule\s*\(/i],
 ["secret_access",/\b(?:vault\s*\.|service_role_key|secret_key)\b/i],
 ["data_wipe",/\b(?:drop\s+(?:table|schema)|truncate\s+table|delete\s+from)\b/i],
 ["public_open_grants",/\bgrant\s+(?:all|select|insert|update|delete|execute)\b[^;]*\bto\s+(?:public|anon|authenticated)\b/i]
];
const no=reason=>({ok:false,reason,executeAllowed:false,
 approvedToInstall:false,rollbackVerified:false,
 tenantIsolationVerified:false,realStagingApplied:false});
function reviewStagingBusinessBaselineV3221({
 filePath="",sql="",stagingProjectRef="",observedCanary=false
}={}){
 if(filePath!=="staging/ISOLATED_ONLY_business_core_v3180.sql"||
  stagingProjectRef!=="pnjdlogwegnqbsfpcofw"||
  typeof sql!=="string"||sql.length<600||sql.length>30000)
  return no("Only the existing bounded, staging-only business baseline for the known isolated project may be reviewed.");
 const clean=sql.replace(/\/\*[\s\S]*?\*\//g," ").replace(/--[^\n]*/g," ");
 const checks=REQUIRED.map(([id,re])=>({id,sourcePatternFound:re.test(
    id==="staging_label"?sql:clean)}));
 const warnings=DANGEROUS.filter(([,re])=>re.test(clean)).map(([id])=>id);
 return {ok:true,kind:"staging_business_baseline_review_v3221",
  filePath,requiredChecks:checks,missing:checks.filter(x=>!x.sourcePatternFound).map(x=>x.id),
  dangerousSourceSignals:warnings,
  observedCanaryReported:observedCanary===true,
  sourceAppearsCompatible:checks.every(x=>x.sourcePatternFound)&&warnings.length===0,
  sourceRegexDoesNotProveSqlSafety:true,
  memberRlsRequiresAuthenticatedTwoTenantProof:true,
  productionSchemaIdentityUnknown:true,
  missingNotNullAndForeignKeyBehavioursMustBeTested:true,
  noActualDatabaseReads:true,noProviderCalls:true,mayExecuteSql:false,
  executeAllowed:false,approvedToInstall:false,rollbackVerified:false,
  tenantIsolationVerified:false,realStagingApplied:false,
  nextAction:"Independently verify two real Auth users, owner membership revocation, RLS, production-schema parity and recoverable backup in isolated staging before any installation approval."};
}
export {REQUIRED,DANGEROUS,reviewStagingBusinessBaselineV3221};
