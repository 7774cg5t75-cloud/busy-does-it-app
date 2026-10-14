/**
 * V3.221 — static review of migration side effects; no SQL rewriting,
 * automatic sanitization, background jobs, provider calls or installation.
 * Reuse V3.203's line-numbered risk classification and explicitly stop on
 * any sensitive SQL until a real DBA/owner performs a review.
 */
import {compileMigrationRiskLedger} from "./stagingSqlRiskLedgerV3203.mjs";
const SENSITIVE=new Set([
 "cron_schedule","cron_unschedule","external_http","sql_extension",
 "privileged_function","execute_grant","table_grant","schema_destructive",
 "event_trigger","server_secrets","dynamic_sql"
]);
function reviewStagingSqlSideEffectsV3221(migrations=[]){
 const report=compileMigrationRiskLedger(migrations);
 if(!report.ok)return {ok:false,reason:report.reason,
  unattendedMigrationAllowed:false,noSideEffectsExecuted:true};
 const sensitive=report.files.filter(file=>file.signals.some(x=>SENSITIVE.has(x.category)));
 const review=sensitive.map(file=>({
  file:file.filename,
  categories:file.signals.filter(s=>SENSITIVE.has(s.category))
   .map(x=>({category:x.category,lines:[...x.lines]})),
  mayExecuteUnattended:false,requiresExactMigrationReview:true
 }));
 return {ok:true,kind:"staging_sql_side_effect_review_v3221",
  migrationCount:report.fileCount,
  sideEffectReviewFileCount:review.length,
  sourceRiskFindingCount:review.reduce((n,x)=>n+x.categories.length,0),
  categories:report.categories,filesNeedingReview:review,
  noSqlAutoSanitisation:true,automaticProviderIsolationProven:false,
  noScheduledTasksProven:false,
  sourceScanningIsNotFullSqlParsing:true,
  unattendedMigrationAllowed:false,migrationApproved:false,
  noSideEffectsExecuted:true,stagingDbChanged:false,
  nextAction:"Review privileged routines, cron schedules, pg_net/http, external provider targets, secrets, and extension installs line-by-line. Use isolated approval and rollback."};
}
export {reviewStagingSqlSideEffectsV3221};
