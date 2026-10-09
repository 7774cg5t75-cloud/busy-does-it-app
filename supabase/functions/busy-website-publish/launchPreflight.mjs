/**
 * V3.77 Go Live preflight. This is a database-state / immutable-artifact gate,
 * NOT proof that an external host will be reachable after the job completes.
 * It never publishes, bills, suspends, or changes any customer content.
 */
function evaluateLaunchPreflight({website=null,deployment=null}={}){
  const siteValid=typeof website?.id==="string"&&website.id.length>0&&
    typeof website?.business_id==="string"&&website.business_id.length>0;
  const ownership=siteValid&&deployment?.website_id===website.id&&
    deployment?.business_id===website.business_id;
  const previewReady=deployment?.state==="preview_ready";
  const preparedArtifact=typeof deployment?.preview_storage_path==="string"&&
    deployment.preview_storage_path.trim().length>0&&
    typeof deployment?.content_hash==="string"&&deployment.content_hash.length>=32;
  const alreadyLive=ownership&&deployment?.state==="live";
  const canApprove=!!(ownership&&previewReady&&preparedArtifact);
  const checks={
    businessWebsite:!!ownership,
    exactHostedPreview:!!previewReady,
    immutableArtifact:!!preparedArtifact
  };
  const issues=[];
  if(!ownership)issues.push("The selected website version does not match this business's main website.");
  if(!previewReady&&!alreadyLive)issues.push("Prepare and review the exact hosted preview first.");
  if(!preparedArtifact&&!alreadyLive)issues.push("The hosted preview artifact is not available yet.");
  return {
    status:alreadyLive?"already_live":canApprove?"ready":"blocked",
    canApprove,
    alreadyLive:!!alreadyLive,
    checks,
    issues,
    approvalStillRequired:!alreadyLive,
    publicDeliveryVerified:false,
    note:"This checks the selected immutable hosted artifact before approval. The site must still be published and externally checked after Go Live."
  };
}
export {evaluateLaunchPreflight};
