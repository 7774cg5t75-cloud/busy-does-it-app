/**
 * V3.128 mobile runtime environment boundary, pure/offline.
 * All staging service endpoints must derive from the SAME separately
 * approved staging project. Missing or unsafe staging config connects to
 * reserved .invalid only, NEVER to either existing active Supabase project.
 * Expo inlines EXPO_PUBLIC_* build variables. Nothing here authenticates
 * an account or provisions a project.
 */
const REF=/^[a-z]{20}$/;
const PUBLISHABLE=/^sb_publishable_[A-Za-z0-9_-]{15,}$/;
const STOP_URL="https://busy-staging-unconfigured.invalid";
function refFromUrl(s){
 if(typeof s!=="string"||s.length>220)return null;
 try{
  const u=new URL(s);
  const match=/^([a-z]{20})\.supabase\.co$/.exec(u.hostname);
  return u.protocol==="https:"&&!u.port&&!u.username&&!u.password&&
    !u.search&&!u.hash&&(u.pathname==="/"||u.pathname==="")?
    match?.[1]||null:null;
 }catch{return null;}
}
function busyRuntimeCloudConfig({
 environment="",productionSupabaseUrl="",productionPublishableKey="",
 productionAiUrl="",stagingSupabaseUrl="",stagingPublishableKey="",
 otherProtectedSupabaseRef=""
}={}){
 const isolated=environment==="isolated-staging";
 if(!isolated){
  return {environment:"existing-development",isolated:false,
    configured:true,baseUrl:productionSupabaseUrl,
    aiUrl:productionAiUrl,
    publishableKey:productionPublishableKey,
    prodFallbackAllowed:true,mayClaimStaging:false};
 }
 const candidate=refFromUrl(stagingSupabaseUrl);
 const prod=refFromUrl(productionSupabaseUrl);
 const separate=!!candidate&&!!prod&&REF.test(otherProtectedSupabaseRef)&&
   new Set([candidate,prod,otherProtectedSupabaseRef]).size===3;
 const configured=separate&&PUBLISHABLE.test(stagingPublishableKey);
 const baseUrl=configured?"https://"+candidate+".supabase.co":STOP_URL;
 return {environment:"isolated-staging",isolated:true,
  configured,baseUrl,
  aiUrl:baseUrl+"/functions/v1/busy-ai-intake",
  publishableKey:configured?stagingPublishableKey:"",
  prodFallbackAllowed:false,mayClaimStaging:false,
  // Access to the staging Auth project remains separately verified.
  realSupabaseAuthVerified:false,hostedStagingVerified:false};
}
export {busyRuntimeCloudConfig,STOP_URL};
