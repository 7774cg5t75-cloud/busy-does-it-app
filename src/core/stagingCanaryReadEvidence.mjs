/**
 * V3.126 read-only authenticated PostgREST probe harness. Operates only
 * after a manual, separate isolated-staging approval. An assertion of passing
 * results is never itself independent production-readiness certification.
 */
const UUID=/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
const REF=/^[a-z]{20}$/;
function stagingCanaryInputCheck({stagingRef="",productionRef="",ownerA="",ownerB="",
  rowA="",rowB="",publishableKey="",tokenA="",tokenB="",expiredToken=""}={}){
 const checks=[
  REF.test(stagingRef)&&REF.test(productionRef)&&stagingRef!==productionRef,
  UUID.test(ownerA)&&UUID.test(ownerB)&&ownerA!==ownerB,
  UUID.test(rowA)&&UUID.test(rowB)&&rowA!==rowB,
  typeof publishableKey==="string"&&publishableKey.startsWith("sb_publishable_"),
  [tokenA,tokenB,expiredToken].every(s=>typeof s==="string"&&s.length>20)&&
    tokenA!==tokenB&&tokenA!==expiredToken&&tokenB!==expiredToken
 ];
 return {valid:checks.every(Boolean),matched:checks.filter(Boolean).length,total:checks.length};
}
async function stagingCanaryReadEvidence(params={},fetchImpl=fetch){
 const gate=stagingCanaryInputCheck(params);
 if(!gate.valid)throw Error("Incomplete isolated-staging canary input. No request sent.");
 if(params.manualApproval!=="APPROVE_ISOLATED_STAGING_READS")
  throw Error("Manual staging read approval required. No request sent.");
 const base="https://"+params.stagingRef+".supabase.co/rest/v1/busy_staging_rls_canary";
 const cases=[
  ["a-own",params.tokenA,params.rowA,params.ownerA,true],
  ["b-own",params.tokenB,params.rowB,params.ownerB,true],
  ["a-foreign",params.tokenA,params.rowB,params.ownerB,false],
  ["b-foreign",params.tokenB,params.rowA,params.ownerA,false],
  ["anonymous","",params.rowA,params.ownerA,false],
  ["expired",params.expiredToken,params.rowA,params.ownerA,false]
 ];
 const results=[];
 for(const [id,token,row,owner,own] of cases){
  const url=new URL(base);
  url.searchParams.set("select","id,owner_id");
  url.searchParams.set("id","eq."+row);
  let response;
  try{
   response=await fetchImpl(url.toString(),{
    method:"GET",headers:{
     apikey:params.publishableKey,
     ...(token?{Authorization:"Bearer "+token}:{})
    },redirect:"error",signal:AbortSignal.timeout(5000)
   });
  }catch{
   results.push({id,passed:false,status:"network-failure"});
   continue;
  }
  let rows=[];
  if(response.ok){
   try{rows=await response.json();}catch{rows=null;}
  }
  const validRows=Array.isArray(rows)&&rows.every(v=>
    v&&typeof v==="object"&&typeof v.id==="string"&&
    typeof v.owner_id==="string");
  const passed=own?(response.status===200&&validRows&&
    rows.length===1&&rows[0].id===row&&rows[0].owner_id===owner):
   ((response.status===200&&validRows&&rows.length===0)||
      [401,403,404].includes(response.status));
  results.push({id,passed:!!passed,httpStatus:response.status,
   returnedRows:Array.isArray(rows)?rows.length:null});
 }
 return {status:results.every(r=>r.passed)?"observations-await-independent-review":"blocked",
  passed:results.filter(r=>r.passed).length,total:results.length,
  cases:results,source:"read-only-staging-observations",
  independentlyAttested:false,fullAppTenantSecurityVerified:false,
  liveWebsiteVerified:false,writeIsolationVerified:false,
  mayRunMigrations:false,mayPublish:false,maySpend:false,
  canAuthoriseProduction:false,
  next:"Review actual authenticated observations, real app tenant policies, and denied write checks separately."};
}
export {stagingCanaryInputCheck,stagingCanaryReadEvidence};
