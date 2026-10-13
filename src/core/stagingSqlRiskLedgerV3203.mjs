/**
 * V3.203 detailed deterministic SQL *risk* register for the isolated staging
 * package. Signals are NOT a SQL parser, safety proof or install permission.
 * Line numbers are emitted without SQL text to avoid leaking literals/secrets.
 */
const FILE=/^20\d{12}_[a-z0-9_]+\.sql$/;
const CATEGORY=Object.freeze([
 ["cron_schedule",/\bcron\s*\.\s*schedule\s*\(/gi,"Disable scheduler jobs unless separately approved"],
 ["cron_unschedule",/\bcron\s*\.\s*unschedule\s*\(/gi,"Check existing scheduler state and rollback"],
 ["external_http",/\bnet\s*\.\s*http_(?:post|get|delete|put)\s*\(/gi,"Block external provider HTTP and outbound callbacks"],
 ["sql_extension",/\bcreate\s+extension\b/gi,"Review available extensions and privileges"],
 ["privileged_function",/\bsecurity\s+definer\b/gi,"Audit owner, search path and EXECUTE grants"],
 ["execute_grant",/\bgrant\s+execute\b/gi,"Ensure PUBLIC, anon and authenticated never obtain trusted RPCs"],
 ["table_grant",/\bgrant\s+(?:select|insert|update|delete|all)\b/gi,"Review grants and forced tenant RLS"],
 ["rls_policy",/\b(?:create|alter)\s+policy\b/gi,"Verify policies and roles with independent Auth JWTs"],
 ["schema_destructive",/\b(?:drop\s+(?:table|schema|column)|truncate\s+table|delete\s+from)\b/gi,"Review destructive operations and recovery"],
 ["event_trigger",/\b(?:create|alter|drop)\s+event\s+trigger\b/gi,"Preserve the staging RLS canary and protected event triggers"],
 ["server_secrets",/\b(?:vault\s*\.|current_setting\s*\(|service_role_key|secret_key)\b/gi,"Use staging-only credentials; do not contact live providers"],
 ["dynamic_sql",/\bexecute\s+(?:format\s*\(|['\w])/gi,"Review dynamic SQL and elevated execution context"]
]);
const BAD=reason=>({ok:false,reason,approvedToInstall:false,executedSql:false});
const stripCommentsKeepLines=s=>s.replace(/\/\*[\s\S]*?\*\//g,m=>m.replace(/[^\n]/g," "))
 .replace(/--[^\n]*/g,m=>" ".repeat(m.length));
const lineNo=(s,index)=>s.slice(0,index).split("\n").length;
function compileMigrationRiskLedger(migrations=[]){
 if(!Array.isArray(migrations)||migrations.length<1||migrations.length>300||
    migrations.some(x=>!x||!FILE.test(x.name||"")||
      typeof x.sql!=="string"||x.sql.length>300000))
   return BAD("Provide a bounded, complete repository migration source.");
 const sorted=[...migrations].sort((a,b)=>a.name.localeCompare(b.name));
 if(new Set(sorted.map(x=>x.name)).size!==sorted.length)
   return BAD("Duplicate migration filename; stop installation review.");
 const files=sorted.map(({name,sql})=>{
  const stripped=stripCommentsKeepLines(sql);
  const signals=[];
  for(const [category,regex,action] of CATEGORY){
   const hits=[...stripped.matchAll(regex)].slice(0,80);
   if(hits.length)signals.push({category,occurrences:hits.length,
      lines:[...new Set(hits.map(x=>lineNo(stripped,x.index)))].slice(0,25),
      operatorAction:action});
  }
  const blocking=signals.filter(s=>[
   "cron_schedule","external_http","sql_extension",
   "schema_destructive","event_trigger","server_secrets",
   "dynamic_sql"
  ].includes(s.category));
  return {filename:name,signals,blockingCategories:blocking.map(x=>x.category),
   needsHumanReview:signals.length>0,
   externalSideEffectsMightOccur:blocking.length>0,
   approvedToExecute:false};
 });
 const categories=Object.fromEntries(CATEGORY.map(([cat])=>[
  cat,files.filter(f=>f.signals.some(s=>s.category===cat)).length]));
 return {ok:true,kind:"staging_sql_line_review_v3203",
  fileCount:files.length,filesFlagged:files.filter(x=>x.needsHumanReview).length,
  sideEffectSensitiveFiles:files.filter(x=>x.externalSideEffectsMightOccur).length,
  categories,files,manualDecisionsRequired:[
   "Separate staging account, inspected project ref and restored backup",
   "Disable cron schedules, remote HTTP and provider notifications by reviewed migration plan",
   "Verify exact service_role execute permissions and tenant RLS by authenticated tests",
   "Review dynamic SQL, secrets, triggers, destructive actions and extension ownership",
   "Approve each installation phase separately, stopping if source or target changed"
  ],sqlParserComplete:false,absenceOfSignalProvesSafety:false,
  automaticallyNeutralisesSideEffects:false,
  approvedToInstall:false,executedSql:false,
  externalProvidersContacted:false,productionTouched:false};
}
export {CATEGORY,compileMigrationRiskLedger};
