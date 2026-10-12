/**
 * V3.184 read-only migration risk inventory: not a SQL parser, migration
 * executor, connection, automated approval or signed DBA security audit.
 */
const RULES=[
 ["extension_setup",/\bcreate\s+extension\b|\bpgmq\b|\bpg_cron\b|\bpg_net\b/i],
 ["scheduled_work",/\bcron\.schedule\b|\bcron\.unschedule\b/i],
 ["network_io",/\bnet\.http_|https?:\/\/|dblink\b/i],
 ["secret_or_key_access",/\b(?:vault|secret|apikey|authorization|service_role_key|supabase_url)\b/i],
 ["privileged_routines",/\bsecurity\s+definer\b/i],
 ["privileges_or_policies",/\b(?:grant|revoke)\b|\bcreate\s+policy\b|\brow\s+level\s+security\b/i],
 ["data_or_schema_destructiveness",/\b(?:drop\s+(?:table|schema|column)|truncate\s+|delete\s+from\s+|alter\s+table\s+.*drop\s+)\b/i]
];
function reviewMigrationSideEffects(migrations=[]){
 if(!Array.isArray(migrations)||migrations.length>300||
    migrations.some(f=>typeof f?.name!=="string"||
      !/^20\d{12}_[a-z0-9_]+\.sql$/.test(f.name)||
      typeof f.sql!=="string"||f.sql.length>300000))
  return {ok:false,reason:"Use only a bounded repository SQL migration inventory."};
 const findings=migrations.map(file=>{
  const sql=file.sql.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,"");
  const categories=RULES.filter(([,pattern])=>pattern.test(sql)).map(([key])=>key);
  return {name:file.name,categories,needsHumanReview:categories.length>0};
 });
 const byCategory=Object.fromEntries(RULES.map(([kind])=>
  [kind,findings.filter(x=>x.categories.includes(kind)).length]));
 const reviewedFiles=findings.filter(x=>x.needsHumanReview).length;
 return {ok:true,kind:"staging_migration_side_effect_review_v3184",
  migrationCount:findings.length,filesWithReviewSignals:reviewedFiles,
  byCategory,findings:findings.filter(x=>x.needsHumanReview),
  reviewSignalsAreNotConfirmedSecurityProblems:true,
  missingSignalsDoNotProveSafety:true,requiresDBAPermissionReview:true,
  requiresExternalEndpointsInspection:true,
  requiresVerifiedBackupAndRollbackPlan:true,
  canAutomaticallyInstall:false,installationPerformed:false};
}
export {reviewMigrationSideEffects};
