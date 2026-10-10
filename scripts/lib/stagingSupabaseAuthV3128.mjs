/**
 * V3.128: independently contacted Supabase Auth and PostgREST evidence.
 * This file is Node-only, and is NOT imported into the public iPhone bundle.
 * Calls are GET-only; never log tokens, email addresses, raw responses or URLs.
 * Run only against a separately approved dedicated staging project with
 * two disposable test Auth users and a disposable RLS canary table.
 */
const REF=/^[a-z]{20}$/;
const ID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const KEY=/^sb_publishable_[A-Za-z0-9_-]{15,}$/;
const isToken=x=>typeof x==="string"&&x.length>=30&&
  !/\s/.test(x)&&!x.startsWith("sb_");
function stagingAuthConfigCheck(p={}){
 const checks=[
  {id:"project",ok:REF.test(p.stagingRef||"")&&
    REF.test(p.productionRef||"")&&REF.test(p.otherProtectedRef||"")&&
    p.stagingRef!==p.productionRef&&p.stagingRef!==p.otherProtectedRef&&
    p.productionRef!==p.otherProtectedRef},
  {id:"public-key",ok:KEY.test(p.publishableKey||"")},
  {id:"owners",ok:ID.test(p.ownerA||"")&&ID.test(p.ownerB||"")&&
    p.ownerA!==p.ownerB},
  {id:"fixture-rows",ok:ID.test(p.rowA||"")&&ID.test(p.rowB||"")&&
    p.rowA!==p.rowB},
  {id:"session-tokens",ok:[p.tokenA,p.tokenB,p.rejectedToken]
      .every(isToken)&&new Set([p.tokenA,p.tokenB,p.rejectedToken]).size===3},
  {id:"manual-approval",ok:p.approval==="APPROVE_READ_ONLY_STAGING_AUTH_3128"},
  {id:"source-sha",ok:/^[a-f0-9]{40}$/i.test(p.sourceSha||"")}
 ];
 return {status:checks.every(x=>x.ok)?"configuration-valid":"blocked",
  passed:checks.filter(x=>x.ok).length,total:checks.length,
  missing:checks.filter(x=>!x.ok).map(x=>x.id),
  // No secret, project ID, user ID or environment URL in the output.
  cloudContacted:false,productionAccessible:false};
}
async function fetchSafe(fetchImpl,url,headers){
 try{
  const r=await fetchImpl(url,{method:"GET",headers,redirect:"error",
   cache:"no-store",signal:AbortSignal.timeout(5000)});
  const status=Number.isInteger(r?.status)?r.status:0;
  let data=null;
  if(status===200){
   try{data=await r.json();}catch{}
  }
  return {status,data};
 }catch{return {status:0,data:null};}
}
async function probeStagingSupabaseAuth(p={},fetchImpl=fetch){
 const config=stagingAuthConfigCheck(p);
 if(config.status!=="configuration-valid")
   return {status:"blocked",phase:"configuration",missing:config.missing,
    checks:[],passed:0,total:10,hasIndependentAuthResponse:false,
    productionWrites:false,customerAccessAuthorised:false};
 const origin="https://"+p.stagingRef+".supabase.co";
 const userUrl=origin+"/auth/v1/user";
 const baseHeaders={apikey:p.publishableKey,Accept:"application/json"};
 const identities=[];
 for(const [label,token,id] of [
  ["owner-a",p.tokenA,p.ownerA],["owner-b",p.tokenB,p.ownerB]]){
  const resp=await fetchSafe(fetchImpl,userUrl,{
   ...baseHeaders,Authorization:"Bearer "+token});
  const actual=resp.data?.id;
  const ok=resp.status===200&&typeof actual==="string"&&actual===id;
  identities.push({id:"auth-"+label,passed:ok,httpStatus:resp.status});
 }
 // Do not even ask for tenant records unless BOTH real Auth identities matched.
 if(!identities.every(x=>x.passed))
   return {status:"blocked",phase:"auth",passed:identities.filter(x=>x.passed).length,
    total:10,checks:identities,hasIndependentAuthResponse:true,
    productionWrites:false,customerAccessAuthorised:false};
 const authRejectCases=[
  ["auth-rejected-token",p.rejectedToken],
  ["auth-no-session",null]
 ];
 const checks=[...identities];
 for(const [name,token] of authRejectCases){
  const resp=await fetchSafe(fetchImpl,userUrl,{
   ...baseHeaders,...(token?{Authorization:"Bearer "+token}:{})});
  checks.push({id:name,httpStatus:resp.status,
   passed:resp.status===401||resp.status===403});
 }
 const cases=[
  ["a-own",p.tokenA,p.rowA,p.ownerA,true],
  ["b-own",p.tokenB,p.rowB,p.ownerB,true],
  ["a-foreign",p.tokenA,p.rowB,p.ownerB,false],
  ["b-foreign",p.tokenB,p.rowA,p.ownerA,false],
  ["anon",null,p.rowA,p.ownerA,false],
  ["rejected",p.rejectedToken,p.rowA,p.ownerA,false]
 ];
 for(const [name,token,row,owner,own] of cases){
  const url=new URL(origin+"/rest/v1/busy_staging_rls_canary");
  url.searchParams.set("select","id,owner_id");
  url.searchParams.set("id","eq."+row);
  const r=await fetchSafe(fetchImpl,url.toString(),{
   ...baseHeaders,...(token?{Authorization:"Bearer "+token}:{})});
  const validRows=Array.isArray(r.data)&&r.data.every(v=>
    v&&typeof v.id==="string"&&typeof v.owner_id==="string");
  const passed=own?r.status===200&&validRows&&r.data.length===1&&
    r.data[0].id===row&&r.data[0].owner_id===owner:
    (r.status===200&&validRows&&r.data.length===0)||
      [401,403,404].includes(r.status);
  checks.push({id:"rls-"+name,httpStatus:r.status,passed:!!passed,
   // Aggregate only: no returned rows or tenant identifiers are logged.
   resultRows:Array.isArray(r.data)?r.data.length:null});
 }
 const passed=checks.filter(x=>x.passed).length;
 return {status:passed===checks.length?
     "real-staging-observations-need-independent-review":"blocked",
  phase:"auth-and-read-only-rls",checks,passed,total:checks.length,
  hasIndependentAuthResponse:true,actualStagingEndpointContacted:true,
  independentlyAttested:false,writePoliciesVerified:false,
  allApplicationTablesVerified:false,customerAccessAuthorised:false,
  productionWrites:false,publicLaunchAuthorised:false,
  next:"Verify signatures/session lifecycle, application table write policies, HTTPS previews and rollback independently."};
}
export {stagingAuthConfigCheck,probeStagingSupabaseAuth};
