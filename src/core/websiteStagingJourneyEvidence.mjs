/**
 * V3.125 fictional end-to-end website canary proof. All caller data is
 * untrusted: even a passing source-only manifest does not prove a hosted
 * deployment or grant permission to publish.
 */
const ID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
function websiteStagingJourneyEvidence({
 businessId="",ownerBusinessId="",draftGeneration=null,
 hostedGeneration=null,previewDeploymentId="",ownerReviewedDeploymentId="",
 artifactSha256="",independentlyObservedSha256="",
 hostedOrigin="",expectedStagingOrigin="",fictionalDataOnly=false,
 cssMobileReviewed=false,cssDesktopReviewed=false,
 recoveryReadOnly=false,unauthorisedWritesBlocked=false
}={}){
 const own=ID.test(businessId)&&businessId===ownerBusinessId;
 const generation=Number.isSafeInteger(draftGeneration)&&draftGeneration>0&&
   hostedGeneration===draftGeneration;
 let hostOK=false;
 try{
  const host=new URL(hostedOrigin), expected=new URL(expectedStagingOrigin);
  hostOK=host.protocol==="https:"&&expected.protocol==="https:"&&
    host.origin===expected.origin&&host.hostname!=="busydoesit.co.uk"&&
    !host.username&&!host.password&&!host.hash&&!host.search&&
    !expected.username&&!expected.password&&!expected.search&&!expected.hash&&
    expected.pathname==="/"&&host.pathname.startsWith("/preview/");
 }catch{}
 const checks=[
  {id:"owner",passed:own,label:"Exactly one authorised fictional business owner"},
  {id:"fictional",passed:fictionalDataOnly===true,label:"Fictional business content only"},
  {id:"version",passed:generation,label:"Hosted generation equals current private draft generation"},
  {id:"immutable-artifact",passed:HASH.test(artifactSha256)&&
     artifactSha256===independentlyObservedSha256,
   label:"Exact 256-bit artifact hash matches an independent staging observation"},
  {id:"host",passed:hostOK,label:"Preview served from the intended HTTPS staging host"},
  {id:"approval",passed:ID.test(previewDeploymentId)&&
     ownerReviewedDeploymentId===previewDeploymentId,
   label:"Owner reviewed the exact immutable hosted deployment"},
  {id:"visual",passed:cssMobileReviewed===true&&cssDesktopReviewed===true,
   label:"Mobile and desktop review completed"},
  {id:"recovery",passed:recoveryReadOnly===true&&
     unauthorisedWritesBlocked===true,
   label:"Status recovery stays read-only and unauthorised writes are denied"}
 ];
 const missing=checks.filter(x=>!x.passed);
 return {status:missing.length?"blocked":"ready-for-independent-staging-review",
  passed:checks.length-missing.length,total:checks.length,checks,
  next:missing[0]?.label||"Independently attest test evidence before considering any separately approved staging operation.",
  simulated:true,realHostedPreviewVerified:false,
  canPublishPublic:false,canUseRealCustomerData:false,
  canRunPaidAI:false,canChangeDNS:false,automaticRollback:false,
  ownerCanApproveProductionFromThis:false};
}
export {websiteStagingJourneyEvidence};
