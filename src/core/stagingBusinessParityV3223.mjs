/**
 * V3.223 — read-only SOURCE CONTRACT comparison for an isolated business
 * bootstrap. NOT a schema dump, actual production parity proof, SQL parser,
 * permission grant, installer, owner approval or database operation.
 * Reuse V3.221 baseline checks; never copy credential-bearing production
 * bridge or a real business/customer table into staging.
 */
import {reviewStagingBusinessBaselineV3221}
 from "./stagingFirstPhaseSafetyV3221.mjs";
const BASE="staging/ISOLATED_ONLY_business_core_v3180.sql";
const BRIDGE="supabase/schema/v3_25_production_bridge.sql";
const STAGING_REF="pnjdlogwegnqbsfpcofw";
const CONTRACT=Object.freeze({
 busy_businesses:["id","name","created_by","created_at","updated_at"],
 busy_business_memberships:["business_id","user_id","role","created_at"]
});
const SENSITIVE=Object.freeze([
 "access_token","refresh_token","provider_account_email",
 "expo_push_token","provider_receipts","route_data"
]);
const safeResult=reason=>({ok:false,reason,sourceCompatible:false,
 mayApply:false,productionParityProven:false,realTenantRlsTested:false,
 rollbackTested:false,stagingChanged:false});
function stripSqlComments(sql){
 return sql.replace(/\/\*[\s\S]*?\*\//g," ").replace(/--[^\n]*/g,"");
}
function extractColumns(sql,table){
 const pattern=new RegExp("create\\s+table\\s+if\\s+not\\s+exists\\s+public\\."+
   table+"\\s*\\(([\\s\\S]*?)\\n\\s*\\);","i");
 const match=pattern.exec(stripSqlComments(sql));
 if(!match)return [];
 return match[1].split("\n").map(line=>
   /^\s*([a-z_][a-z_0-9]*)\s+(?:uuid|text|timestamptz|boolean|jsonb|integer)\b/i.exec(line)?.[1])
  .filter(Boolean);
}
function inspectStagingBusinessParityV3223({
 baselineSql="",bridgeSql="",baselinePath=BASE,bridgePath=BRIDGE,
 projectRef=STAGING_REF
}={}){
 if(baselinePath!==BASE||bridgePath!==BRIDGE||projectRef!==STAGING_REF||
  typeof baselineSql!=="string"||baselineSql.length<500||baselineSql.length>30000||
  typeof bridgeSql!=="string"||bridgeSql.length<700||bridgeSql.length>60000)
  return safeResult("Review only the pinned staging-only core and the source-only production bridge reference.");
 const baseline=reviewStagingBusinessBaselineV3221({
  filePath:BASE,sql:baselineSql,stagingProjectRef:projectRef
 });
 if(!baseline.ok)return safeResult("The existing baseline source could not be reviewed.");
 const fields=Object.fromEntries(Object.keys(CONTRACT).map(name=>[
   name,extractColumns(baselineSql,name)]));
 const missing=Object.entries(CONTRACT).flatMap(([name,required])=>
  required.filter(field=>!fields[name].includes(field))
   .map(field=>name+"."+field));
 const bridge=stripSqlComments(bridgeSql);
 const refs=[...bridge.matchAll(/\breferences\s+public\.(busy_businesses|busy_business_memberships)\s*\(\s*([a-z_][a-z_0-9]*)\s*\)/gi)]
  .map(m=>({table:m[1].toLowerCase(),column:m[2].toLowerCase()}));
 const missingReferences=refs.filter(ref=>!fields[ref.table]?.includes(ref.column));
 const authUserReferences=(bridge.match(/\breferences\s+auth\.users\s*\(\s*id\s*\)/gi)||[]).length;
 const bridgeSensitive=SENSITIVE.filter(field=>
   new RegExp("\\b"+field+"\\b","i").test(bridge));
 const bridgeIncludesOperationalObjects=bridgeSensitive.length>0||
  /\bbusy_(?:push_devices|calendar_connections|push_deliveries)\b/i.test(bridge);
 const sourceCompatible=baseline.sourceAppearsCompatible&&
  missing.length===0&&refs.length>0&&missingReferences.length===0;
 return {ok:true,kind:"staging_business_source_parity_v3223",
  projectRef,baselinePath,bridgePath,
  baselineColumns:fields,missingBaselineColumns:missing,
  bridgeForeignKeyReferences:refs,missingBridgeReferences:missingReferences,
  bridgeAuthUserReferenceCount:authUserReferences,
  bridgeContainsServerOnlyOrCredentialRelatedObjects:bridgeIncludesOperationalObjects,
  sensitiveFieldsFoundInBridge:bridgeSensitive,
  warning:"The bridge is a historical, potentially stale SOURCE REFERENCE; never deploy it as a staging baseline or copy credential/data columns.",
  sourceCompatible,authoritativeProductionSchemaCompared:false,
  sourceRegexNotSqlParser:true,
  securityDefinerPrivilegesVerified:false,
  liveSchemaCompared:false,tenantAuthorizationVerified:false,
  productionParityProven:false,realTenantRlsTested:false,
  rollbackTested:false,mayApply:false,stagingChanged:false,
  nextStep:sourceCompatible?
   "Review actual target catalogue/privileges and disposable backup-restore with a database operator before phase-one approval.":
   "HALT source compatibility: reconcile missing baseline columns, RLS or foreign-key references before phase-one approval."};
}
export {BASE,BRIDGE,STAGING_REF,CONTRACT,
 inspectStagingBusinessParityV3223};
