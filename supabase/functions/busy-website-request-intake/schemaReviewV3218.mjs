/**
 * V3.218 — non-deployable, declarative Postgres schema/RPC REVIEW CONTRACT.
 * Does NOT create tables, change RLS, enable a public endpoint or run SQL.
 * Existing busy_mini_app_requests schema/origin constraints must be inspected
 * before any proposed migration is authored or executed in isolated staging.
 */
const VERSION="website-intake-draft-v1";
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const TABLES=Object.freeze([
 {name:"busy_website_form_approvals_v1",
  scope:["business_id","website_id","deployment_id","app_id","app_version_id"],
  purpose:"Owner-approved, immutable notice revision and allowed fields; no visitor details.",
  constraints:["owner authorization","deployment pinned","revocation","no public writes"]},
 {name:"busy_website_intake_challenges_v1",
  scope:["business_id","website_id","deployment_id","challenge_id"],
  purpose:"One-time server-issued challenge, hashed proof, expiry, traffic and consent version.",
  constraints:["expires","single-use","rate-limited","no raw browser secrets"]},
 {name:"busy_website_request_idempotency_v1",
  scope:["business_id","website_id","deployment_id","request_type","key_digest"],
  purpose:"Durable unique replay key and canonical payload digest; links to shared request ID.",
  constraints:["unique composite source key","payload conflict deny","atomic lock","no PII"]},
 {name:"busy_website_request_outbox_v1",
  scope:["business_id","request_id","event_type"],
  purpose:"Durable independent notification delivery and retry evidence.",
  constraints:["unique event","delivery state distinct from saved request","bounded retries"]}
]);
const RPC_STEPS=Object.freeze([
 "resolve server-owned current website, owner-approved deployment and immutable app",
 "verify unexpired server-issued proof plus approved notice and abuse limits",
 "lock unique scope and compare payload digest within one database transaction",
 "consume challenge and insert ONE request in existing busy_mini_app_requests",
 "atomically persist idempotency ledger and pending outbox event",
 "return only stored ID; separately authenticate and read back saved receipt"
]);
function reviewWebsiteIntakeMigrationV3218({
 existingRequestColumns=[],knownOrigins=[],requestOriginConstraintReviewed=false,
 ownerAccessPolicyReviewed=false,providerAuditReviewed=false,
 realDatabaseSchemaInspected=false,stagingMigrationApplied=false
}={}){
 const columns=Array.isArray(existingRequestColumns)?existingRequestColumns:[];
 const origins=Array.isArray(knownOrigins)?knownOrigins:[];
 const needs=["id","business_id","mini_app_id","request_type","status","request_origin"];
 const missing=needs.filter(k=>!columns.includes(k));
 const checks=[
  {id:"actual_schema",passed:realDatabaseSchemaInspected===true,
   why:"Read the actual staging schema and constraints; do not guess from source files."},
  {id:"shared_columns",passed:missing.length===0,
   why:"Reconcile the existing Business App request columns and NOT NULL references."},
  {id:"origin_enum",passed:requestOriginConstraintReviewed===true&&
   origins.includes("guest_web")&&origins.includes("signed_in"),
   why:"Inspect and safely extend the actual request_origin check/enum before adding website_native."},
  {id:"owner_rls",passed:ownerAccessPolicyReviewed===true,
   why:"Ensure only scoped server RPC and authenticated owner readback may access records."},
  {id:"outbox",passed:providerAuditReviewed===true,
   why:"Check current notification deliveries/outbox before adding a duplicate."}
 ];
 const passCount=checks.filter(x=>x.passed).length;
 // These inputs are evidence FLAGS, never proof that a database change ran.
 return {ok:true,kind:"website_intake_schema_review_v3218",
  version:VERSION,tables:TABLES.map(x=>({...x,scope:[...x.scope],
   constraints:[...x.constraints]})),rpcOutline:[...RPC_STEPS],
  checks,missingSharedColumns:missing,sourceChecksPassed:passCount,
  knownRequiredSourceColumns:needs,
  intendedExistingRequestTable:"busy_mini_app_requests",
  proposedOrigin:"website_native",
  intendedUniqueKey:[
   "business_id","website_id","deployment_id","request_type","key_digest"],
  noRawIdempotencyKeyStored:true,noVisitorPIIInDedupLedger:true,
  sameRequestDatabaseRequired:true,atomicityRequiresPostgresRpc:true,
  newSqlMigrationCommitted:false,migrationExecuted:false,
  // Never equate caller-reported staging progress with actual trusted proof.
  externalStagingClaimReported:stagingMigrationApplied===true,
  deployReady:false,publicEndpointEnabled:false,
  schemaChangesAppliedByThisFunction:false,
  nextStep:passCount===checks.length?
   "Security and data owners must review actual SQL, run isolated migrations and independently verify RLS and concurrency.":
   checks.find(x=>!x.passed).why};
}
export {VERSION,TABLES,RPC_STEPS,reviewWebsiteIntakeMigrationV3218};
