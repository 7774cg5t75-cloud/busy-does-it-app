/**
 * Founder-only, read-only rehearsal guidance from a trusted platform aggregate
 * and the local deny-by-default pilot gate. Never claim CI constitutes a live
 * pilot or that unknown monitoring is healthy. No external side effects.
 */
function founderRehearsalGuidance({priorities=null,pilot=null,release=null}={}){
 const available=priorities?.status==="available"&&Array.isArray(priorities.items);
 const stale=!available||priorities?.freshness!=="recent";
 const issueCount=available&&Number.isSafeInteger(priorities.highPriorityCount)
   ? priorities.highPriorityCount:null;
 const ready=pilot?.status==="ready-for-manual-sandbox-rehearsal"&&
  pilot.canRunAutomatically===false&&pilot.canUseProduction===false&&
  pilot.canSpendMoney===false;
 let stage="verify-report",next="Refresh the private founder report first.";
 if(!stale&&issueCount>0){
  stage="review-incidents";next="Review recorded failures before testing anything new.";
 }else if(!stale&&issueCount===0&&!ready){
  stage="prepare-sandbox";next=pilot?.next||
   "Complete the local fictional-data pilot safety checks.";
 }else if(!stale&&issueCount===0&&ready){
  stage="manual-rehearsal";next="Review the scoped sandbox rehearsal plan before authorising any action.";
 }
 return {stage,next,verifiedIncidentCount:issueCount,
  monitoringFresh:!stale,
  realCustomerPilotStarted:false,
  signedBuildReleased:false,
  cloudMigrationApplied:false,
  commercialProviderConnected:false,
  customerNotificationSent:false,
  liveDeployAllowed:false,
  autonomousRepairAllowed:false,
  publicReleaseReady:false,
  note:"This is read-only guidance; CI browser tests are not a real customer pilot."};
}
export {founderRehearsalGuidance};
