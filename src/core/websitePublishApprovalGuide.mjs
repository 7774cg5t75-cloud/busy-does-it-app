/**
 * V3.121: customer-facing preflight for an exact immutable hosted version.
 * This is NOT an authorization token. Server-side tenant, hash, owner and
 * fresh-preflight checks remain authoritative even when this returns ready.
 */
function websitePublishApprovalGuide({preview=null,live=null,view=null,
 openedId="",reviewedId=""}={}){
 const data=view||{};
 const hasPreview=typeof preview?.id==="string"&&preview.id.length>0;
 const fresh=hasPreview&&data.draftChangedSinceHosted===false;
 const sameLive=hasPreview&&live?.id===preview.id;
 const busy=!!data.activeJob&&["queued","processing","retry_wait","running"].includes(
   data.activeJob.status);
 const opened=fresh&&openedId===preview.id;
 const reviewed=opened&&reviewedId===preview.id;
 const serverReady=data.canPublish===true;
 const checks=[
  {id:"hosted",passed:hasPreview,label:"An immutable hosted version is available"},
  {id:"current",passed:fresh,label:"Hosted version matches the latest private draft"},
  {id:"not-live",passed:!sameLive&&hasPreview,label:"This is not the current public version"},
  {id:"job",passed:!busy,label:"No conflicting publishing job is running"},
  {id:"server",passed:serverReady,label:"The server permits publishing this version"},
  {id:"opened",passed:opened,label:"Customer opened this exact hosted preview"},
  {id:"reviewed",passed:reviewed,label:"Customer confirmed reviewing this version"}
 ];
 const ready=checks.every(x=>x.passed);
 const first=checks.find(x=>!x.passed);
 const next=!hasPreview?"Prepare a hosted preview from the private draft.":
  !fresh?"Your draft has changed. Prepare and review a NEW hosted preview before Go Live.":
  sameLive?"This version is already recorded as the live deployment.":
  busy?"Wait for the current publishing job. Refresh its status before continuing.":
  !serverReady?"Publishing is not currently allowed; refresh the status and resolve the server-reported issue.":
  !opened?"Open the exact hosted preview and check your real business details.":
  !reviewed?"Confirm that you checked the exact hosted website.":
  "You can choose Go Live. BUSY will still verify the version and owner permissions on the server.";
 return {status:ready?"ready-for-owner-click":"blocked",
  readyForOwnerClick:ready,
  next,missing:first?.id||null,checks,
  exactHostedId:hasPreview?preview.id:null,
  ownerApprovalRequired:true,autoPublish:false,serverAuthorized:false,
  published:false,willCharge:false};
}
export {websitePublishApprovalGuide};
