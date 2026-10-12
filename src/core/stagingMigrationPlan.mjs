/**
 * V3.179: inspect the repository's migrations without opening a database.
 * This is NOT a SQL executor, staging connection, production switch or RLS test.
 */
const TABLE=/^[a-z][a-z0-9_]*$/;
function collect(pattern,sql){
 const values=[]; for(const hit of sql.matchAll(pattern)) if(TABLE.test(hit[1]))values.push(hit[1]);
 return [...new Set(values)];
}
function analyseStagingMigrations(migrations,{existingTables=[]}={}){
 if(!Array.isArray(migrations)||!migrations.length||
    !Array.isArray(existingTables)||existingTables.some(t=>!TABLE.test(t))||
    migrations.some(m=>!/^20\d{12}_[a-z0-9_]+\.sql$/.test(m?.name||"")||
      typeof m.sql!=="string"||m.sql.length>300000))
  return {ok:false,reason:"Provide repository migration filenames and SQL only."};
 const files=[...migrations].sort((a,b)=>a.name.localeCompare(b.name));
 if(new Set(files.map(f=>f.name)).size!==files.length)return {ok:false,reason:"Repeated migration filename."};
 const provided=new Set(existingTables);
 const createdByRepo=new Set();
 const records=files.map(m=>{
  const sql=m.sql.replace(/--[^\n]*/g,"").replace(/\/\*[\s\S]*?\*\//g,"");
  const creates=collect(/\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z][a-z0-9_]*)\s*\(/gi,sql);
  const foreignKeys=collect(/\breferences\s+public\.([a-z][a-z0-9_]*)\s*\(/gi,sql);
  const alters=collect(/\balter\s+table\s+(?:if\s+exists\s+)?public\.([a-z][a-z0-9_]*)\b/gi,sql);
  creates.forEach(t=>createdByRepo.add(t));
  return {name:m.name,creates,requires:[...new Set([...foreignKeys,...alters])]};
 });
 const seen=new Set(provided);
 const violations=[];
 for(const file of records){
  for(const name of file.requires){
   if(seen.has(name)||file.creates.includes(name))continue;
   violations.push({migration:file.name,table:name,
     kind:createdByRepo.has(name)?"out_of_order_or_missing_prerequisite":"external_baseline_required"});
  }
  file.creates.forEach(t=>seen.add(t));
 }
 const missingBaseline=[...new Set(violations.filter(v=>v.kind==="external_baseline_required").map(v=>v.table))].sort();
 const orderingIssues=violations.filter(v=>v.kind==="out_of_order_or_missing_prerequisite");
 return {ok:true,kind:"staging_install_plan_v3179",
  migrationCount:records.length,firstMigration:records[0].name,
  lastMigration:records.at(-1).name,createdTableCount:createdByRepo.size,
  missingBaseline,orderingIssues,violations,
  requiresPriorSchemaReview:true,requiresIndependentPostgresRLSChecks:true,
  requiresSeparateOwnerApprovalForStagingChanges:true,
  safeToApplyAutomatically:false,productionChangesMade:false,
  sqlApplied:false,edgeFunctionsDeployed:false,
  sequence:records.map(r=>({name:r.name,creates:r.creates.length}))};
}
export {analyseStagingMigrations};
