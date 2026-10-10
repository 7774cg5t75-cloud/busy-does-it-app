/**
 * V3.121: explain safe next steps using read-only recovery evidence.
 * Never schedules a retry, changes DNS, rolls back or assumes deployment
 * health from a stored record. Buttons remain gated by server permission.
 */
function websiteRecoveryCoach(view={}){
 const recovery=view.recoveryState||{};
 const active=view.activeJob||null;
 const jobStatus=typeof active?.status==="string"?active.status:"";
 const busy=["queued","processing","retry_wait","running"].includes(jobStatus);
 const healthy=recovery.healthy===true&&view.healthStatus==="healthy";
 const ownerDns=recovery.ownerActionRequired===true;
 const auto=recovery.automatic===true;
 const retryAllowed=view.canRetrySafeRecovery===true&&!busy&&!ownerDns&&!auto&&
   !healthy&&typeof view.liveDeployment?.id==="string";
 const fallback=typeof recovery.lastKnownGoodDeployment?.id==="string"?
   recovery.lastKnownGoodDeployment.id:null;
 let status="verify",headline="Check website status",
   message="Refresh the website status before deciding whether any action is needed.";
 if(busy){
  status="in-progress";headline="BUSY is still working on the website";
  message="Wait for the current job and refresh its status. Do not start another publish or recovery attempt.";
 }else if(healthy){
  status="healthy";headline="Website hosting checks are healthy";
  message="BUSY has recorded healthy hosting checks. Public delivery still needs exact deployment verification.";
 }else if(ownerDns){
  status="owner-dns";headline="Your domain provider needs one check";
  message="Follow the domain's specific DNS instructions. Avoid replacing email records or purchasing a new domain.";
 }else if(auto){
  status="automatic";headline="BUSY has a bounded recovery check planned";
  message="Check the next scheduled retry and refresh before taking further action. No additional publish approval is implied.";
 }else if(retryAllowed){
  status="manual-recovery";headline="A safe recovery action is available";
  message="Review the failure and the last known good version before selecting a bounded recovery attempt.";
 }else if(view.liveDeployment?.id){
  status="unverified";headline="The live website needs verification";
  message="Refresh the website health and delivery checks. A publication record does not mean the domain is reachable.";
 }
 return {status,headline,message,action:retryAllowed?"retry":"refresh",
  retryAvailable:retryAllowed,ownerDnsActionRequired:ownerDns,
  originalDeploymentRetained:!!fallback,retainedDeploymentId:fallback,
  nextScheduledRetry:auto&&recovery.nextRetryAt||null,
  automaticActionStarted:false,
  safeToRepublishAutomatically:false,canTransferDomain:false,
  canChangeDns:false,canRollbackWithoutOwner:false,
  verifiedPublicDelivery:false};
}
export {websiteRecoveryCoach};
