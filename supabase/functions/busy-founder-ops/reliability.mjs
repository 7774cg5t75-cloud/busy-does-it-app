/**
 * V3.72 safe founder operational summary derived from already-authorised
 * aggregate monitoring and alert reports. Never infers customer health,
 * payment collection, external push or automatic recovery.
 */
const HEADLINES=Object.freeze({
  unverified:"Founder monitoring cannot be verified",
  monitor_stale:"Background incident scan is stale",
  monitor_partial:"Some monitoring sources could not be checked",
  inbox_unavailable:"The founder alert inbox could not be checked",
  review_needed:"Recorded alerts need founder review",
  monitoring:"Monitoring checks are current"
});
function buildFounderReliability({autopilot=null,alertInbox=null}={}){
  const monitor=autopilot?.status;
  const inbox=alertInbox?.status;
  let status="unverified";
  if(monitor==="stale")status="monitor_stale";
  else if(monitor==="partial")status="monitor_partial";
  else if(monitor==="monitoring"&&inbox!=="available")status="inbox_unavailable";
  else if(monitor==="monitoring"&&inbox==="available"&&
    Number.isSafeInteger(alertInbox?.unread)&&alertInbox.unread>0)status="review_needed";
  else if(monitor==="monitoring"&&inbox==="available"&&alertInbox?.unread===0)status="monitoring";
  return {
    status,
    headline:HEADLINES[status],
    needsFounderReview:status!=="monitoring",
    monitoringIsVerified:monitor==="monitoring",
    alertInboxIsVerified:inbox==="available",
    externalAlertDelivery:false,
    automaticExternalRecovery:false,
    note:status==="monitoring"
      ?"No unacknowledged alerts were found in the available grouped categories. This is not proof of public uptime."
      :status==="review_needed"
        ?"An in-app alert requires review. Acknowledging it will not fix the underlying incident."
        :status==="monitor_stale"
          ?"The last database scan is older than the freshness threshold. Investigate the scheduler; do not assume healthy service."
          :status==="monitor_partial"
            ?"A monitoring source is unavailable. Unknown data must not be interpreted as zero incidents."
            :status==="inbox_unavailable"
              ?"The scan is current but the alert inbox is unavailable. Do not claim zero outstanding alerts."
              :"Monitoring evidence is incomplete. An unverified signal is not a healthy signal."
  };
}
export {buildFounderReliability};
