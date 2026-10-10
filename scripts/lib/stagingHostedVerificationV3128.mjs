/**
 * V3.128 manual, unauthenticated HTTPS marker observation.
 * No Supabase JWT, business identity, customer data or privileged key is sent
 * to the staging host. This establishes only the exact marker/version route.
 */
const SHA=/^[a-f0-9]{40}$/i;
const REF=/^[a-z]{20}$/;
function hostedStagingMarkerConfig(p={}){
 let url=null;
 try{
  url=new URL(p.baseUrl||"");
 }catch{}
 const valid=!!url&&url.protocol==="https:"&&
  url.pathname==="/"&&!url.search&&!url.hash&&!url.username&&!url.password&&!url.port&&
  url.hostname===p.expectedHost&&
  !["busydoesit.co.uk","sites.busydoesit.co.uk"].includes(url.hostname)&&
  /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(url.hostname)&&
  SHA.test(p.sourceSha||"")&&REF.test(p.stagingRef||"")&&
  REF.test(p.productionRef||"")&&p.stagingRef!==p.productionRef&&
  p.approval==="APPROVE_READ_ONLY_STAGING_AUTH_3128";
 return {valid,readyToProbe:valid,doesNotApproveCloudDeployment:true};
}
async function checkHostedStagingMarker(p={},fetchImpl=fetch){
 if(!hostedStagingMarkerConfig(p).valid)
  return {status:"blocked",reason:"invalid-host-or-approval",hostedResponseVerified:false};
 const markerUrl=p.baseUrl+"__busy_staging/health";
 let response=null,data=null;
 try{
  response=await fetchImpl(markerUrl,{method:"GET",redirect:"error",
   cache:"no-store",signal:AbortSignal.timeout(5000),headers:{
    Accept:"application/json"
   }});
  if(response?.status===200) data=await response.json();
 }catch{}
 const verified=response?.status===200&&data?.status==="marker-ready"&&
   data?.environment==="isolated-staging"&&
   data?.sourceCommit===p.sourceSha&&
   data?.cloudAuthenticationVerified===false&&
   data?.websitePublishingReady===false&&
   response.headers?.get("x-robots-tag")?.includes("noindex")&&
   response.headers?.get("cache-control")?.includes("no-store");
 return {status:verified?"host-marker-observed":"blocked",
  hostedResponseVerified:!!verified,sourceCommitMatched:!!verified,
  genuineSupabaseAuthVerified:false,realWebsiteBuilderVerified:false,
  privateSitePublishingEnabled:false,customerPilotAuthorised:false,
  // No host names, project references, private headers or content included.
  manualReviewRequired:true};
}
export {hostedStagingMarkerConfig,checkHostedStagingMarker};
