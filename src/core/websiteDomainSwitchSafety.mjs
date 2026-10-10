/**
 * Read-only customer domain switch safety: no DNS edits or purchases.
 * Existing BUSY address is retained until a separate approved decision.
 */
function websiteDomainSwitchSafety(view={}){
 const own=view?.domainState?.latest||null;
 const busy=view?.defaultAddressState?.address||null;
 const previous=typeof busy?.hostname==="string"?busy.hostname.trim():"";
 const next=typeof own?.hostname==="string"?own.hostname.trim():"";
 const fallbackReady=!!previous&&busy?.live===true;
 const targetReady=!!next&&view?.domainState?.journey?.complete===true&&
   view?.canOpenCustomDomain===true;
 const approvedSite=!!view?.liveDeployment?.id&&view?.liveDeployment?.id===
   view?.verifiedDeploymentId;
 const checks=[
  {id:"fallback",passed:fallbackReady,label:"Original BUSY address confirmed"},
  {id:"destination",passed:targetReady,label:"Customer domain verified"},
  {id:"public-deployment",passed:approvedSite,label:"Current live version matched to independent delivery proof"}
 ];
 return {readyToRecommend:checks.every(x=>x.passed),checks,
  willSwitchAutomatically:false,willBuyOrTransferDomain:false,
  originalAddress:previous||null,customerAddress:next||null,
  message:checks.every(x=>x.passed)?
   "Both addresses have recorded delivery evidence. Switching still needs your approval.":
   "Keep your BUSY address while your own domain is checked. No automatic switch, purchase or transfer will happen."};
}
export {websiteDomainSwitchSafety};
