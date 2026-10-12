/** V3.179: deterministic founder triage from bounded, explicitly observed facts.
 * Never mistake missing telemetry for a healthy service; never triggers repairs.
 */
const ASSETS=["database","edge","tenant_access","booking","enquiry","website","standalone"];
const STATE=["verified","missing","unverified","failed"];
const ORDER={failed:0,missing:1,unverified:2,verified:3};
function founderReadinessTriage({observations=[],environment="isolated_staging"}={}){
 if(environment!=="isolated_staging"||!Array.isArray(observations)||
   observations.length>ASSETS.length||observations.some(o=>
   !ASSETS.includes(o?.asset)||!STATE.includes(o?.state))||
   new Set(observations.map(o=>o.asset)).size!==observations.length)
  return {ok:false,reason:"Provide bounded, identified isolated staging observations."};
 const known=new Map(observations.map(o=>[o.asset,o.state]));
 const items=ASSETS.map(asset=>({asset,
  state:known.get(asset)||"unverified",
  requiresAttention:(known.get(asset)||"unverified")!=="verified"}))
  .sort((a,b)=>ORDER[a.state]-ORDER[b.state]||ASSETS.indexOf(a.asset)-ASSETS.indexOf(b.asset));
 const unverified=items.filter(x=>x.state!=="verified").length;
 return {ok:true,kind:"founder_readiness_triage_v3179",items,
  nextSafeReview:items.find(x=>x.requiresAttention)?.asset||"routine_review",
  unresolved:unverified,allObservedVerified:unverified===0,
  // These states are observations only; they cannot override release gates.
  releaseAuthorized:false,notProductionTelemetry:true,
  dataSourceMustBeVerifiedExternally:true,
  noTenantDataReturned:true,noAutomaticRemediation:true,
  noCustomerNotifications:true,noCharges:true};
}
export {founderReadinessTriage};
