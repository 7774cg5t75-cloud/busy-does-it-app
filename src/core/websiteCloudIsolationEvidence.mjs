/**
 * V3.124 independent-cloud canary contract. Consume staging observations;
 * never perform the operation. Never treat expected 401/403 as passing
 * unless the observing harness identified exact foreign/own tenant cases.
 * Caller-supplied synthetic fixture evidence is always flagged as simulation.
 */
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function websiteCloudIsolationEvidence({tenantA="",tenantB="",observations=[],
 source="offline_fixture"}={}){
 const separate=uuid.test(tenantA)&&uuid.test(tenantB)&&tenantA!==tenantB;
 const known=new Map();
 const names=["a-own-read","b-own-read","a-reads-b","b-reads-a",
   "a-writes-b","b-writes-a","expired-session","unauthenticated"];
 for(const o of Array.isArray(observations)?observations:[]){
  if(!o||!names.includes(o.case)||known.has(o.case))continue;
  known.set(o.case,o);
 }
 const requirements=names.map(name=>{
  const o=known.get(name);
  const own=name==="a-own-read"||name==="b-own-read";
  const status=Number(o?.httpStatus);
  // A row-level security denial may be 403, 404 or empty 200; distinguish
  // empty lists from meaningful data, not just the HTTP status.
  const denied=[401,403,404].includes(status)||
    (status===200&&o?.rowCount===0&&o?.sawForeignData===false);
  const passed=separate&&o?.tenantA===tenantA&&o?.tenantB===tenantB&&
   o?.sawForeignData===false&&
   (own?status===200&&o?.rowCount===1:denied);
  return {id:name,passed,reason:passed?"Observed expected isolation":"Missing or unsafe isolation evidence"};
 });
 const allPass=requirements.every(x=>x.passed);
 const live=source==="verified_isolated_staging_trace";
 return {status:!allPass?"blocked":live?"evidence-for-manual-staging-review":"fixture-only",
  checks:requirements,passed:requirements.filter(x=>x.passed).length,total:requirements.length,
  simulated:!live,realCloudVerified:allPass&&live,
  canTouchProduction:false,canMigrateProduction:false,
  canAuthorizeCustomerPilot:false,containsCustomerData:false,
  next:!allPass?"Verify every expected cross-tenant denial on a disposable isolated project.":
    live?"Independently review staging traces before any further rollout.":
    "Offline fixture passed. Real Supabase RLS and expiry probes still required."};
}
export {websiteCloudIsolationEvidence};
