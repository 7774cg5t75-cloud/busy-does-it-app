/**
 * V3.125 — configuration-only nonproduction boundary. Do not perform network
 * requests, inspect private credentials, assume a Supabase project exists, or
 * treat a passing local config as proof of cloud security.
 */
const REF=/^[a-z]{20}$/;
const SHA=/^[a-f0-9]{40}$/i;
function originOf(raw){
 if(typeof raw!=="string"||!raw||raw.length>250)return null;
 try {
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.username||u.password||u.port||
     u.search||u.hash||u.pathname!=="/")return null;
  return u.origin;
 }catch{return null;}
}
function supabaseProjectRef(origin){
 if(!origin)return null;
 const match=/^https:\/\/([a-z]{20})\.supabase\.co$/.exec(origin);
 return match?.[1]||null;
}
function stagingEnvironmentGuard({
 stagingSupabaseUrl="",productionSupabaseUrl="",stagingHostingUrl="",
 expectedHostingHost="",buildProfile="",sourceCommit="",
 publicKeyKind="",productionCredentialsPresent=null,customerDataPresent=null,
 paidProvidersEnabled=null,productionWritesAllowed=null
}={}){
 const stagingOrigin=originOf(stagingSupabaseUrl),
   productionOrigin=originOf(productionSupabaseUrl),
   hostingOrigin=originOf(stagingHostingUrl);
 const stageRef=supabaseProjectRef(stagingOrigin),
   prodRef=supabaseProjectRef(productionOrigin);
 const hostingHost=hostingOrigin?new URL(hostingOrigin).hostname:null;
 const checks=[
  {id:"separate-project",passed:!!stageRef&&!!prodRef&&
    REF.test(stageRef)&&REF.test(prodRef)&&stageRef!==prodRef,
   label:"Different explicitly identified staging and production Supabase projects"},
  {id:"isolated-host",passed:!!hostingOrigin&&
    typeof expectedHostingHost==="string"&&expectedHostingHost.length>0&&
    expectedHostingHost!=="busydoesit.co.uk"&&
    expectedHostingHost!=="sites.busydoesit.co.uk"&&
    hostingHost===expectedHostingHost&&
    !["busydoesit.co.uk","sites.busydoesit.co.uk"].includes(hostingHost),
   label:"Dedicated HTTPS staging website host, separate from public delivery"},
  {id:"build",passed:buildProfile==="preview"||buildProfile==="staging",
   label:"Explicit nonproduction build profile"},
  {id:"source",passed:typeof sourceCommit==="string"&&SHA.test(sourceCommit),
   label:"Immutable source commit recorded for deployed test build"},
  {id:"publishable-only",passed:publicKeyKind==="sb_publishable",
   label:"Mobile/public configuration uses a publishable key only"},
  {id:"production-denied",passed:productionCredentialsPresent===false&&
    productionWritesAllowed===false&&customerDataPresent===false&&
    paidProvidersEnabled===false,
   label:"No production credentials, real customer data, external writes or paid providers"}
 ];
 const missing=checks.filter(x=>!x.passed);
 return {status:missing.length?"blocked":"configuration-review-only",
  checks,passed:checks.length-missing.length,total:checks.length,
  next:missing[0]?.label||"Verify real isolated infrastructure and RLS with independently reviewed traces.",
  // No account identifiers, key values or URLs are included in results/logs.
  canProbeCloudAutomatically:false,canDeployAutomatically:false,
  canRunSql:false,canPublishPublic:false,canSpendMoney:false,
  actualCloudVerified:false,founderApprovalStillRequired:true};
}
export {stagingEnvironmentGuard};
