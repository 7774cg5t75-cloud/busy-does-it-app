import {buildAutopilotDigest} from "./incidentReport.mjs";
import {buildFounderAlertInbox} from "./alertInbox.mjs";
import {buildFounderReliability} from "./reliability.mjs";

/**
 * V3.69 trusted server-side founder reporting helpers.
 * Never use this module to authenticate via the client's user_metadata.
 */
const safeNumber = n => Number.isSafeInteger(n) && n >= 0 ? n : null;
function isFounderUser(user) {
  return !!(
    user &&
    typeof user.id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(user.id) &&
    user.app_metadata?.busy_platform_role === "founder" &&
    user.aud === "authenticated"
  );
}
function aggregateUsageRows(rows, {exhaustive,field,maxRows=1000} = {}) {
  if (!exhaustive || !Array.isArray(rows) || rows.length > maxRows) return null;
  let sum=0;
  for(const row of rows){
    const n=safeNumber(row?.[field]);
    if(n===null)return null;
    sum+=n;
    if(!Number.isSafeInteger(sum))return null;
  }
  return sum;
}
function buildFounderReport({counts={},usage={},checkedAt="",verifiedRole=false,monitorRun=null,monitorIncidents=null,alertRows=null}={}) {
  // Caller MUST independently authenticate before executing the DB reads.
  if(!verifiedRole)return null;
  const count=k=>safeNumber(counts[k]);
  const notes=[];
  const metrics={
    businessWorkspaces:count("businessWorkspaces"),
    businessMemberships:count("businessMemberships"),
    activeWorkspaces7d:count("activeWorkspaces7d"),
    pendingWebsiteJobs:count("pendingWebsiteJobs"),
    failedWebsiteJobs:count("failedWebsiteJobs"),
    failedSocialPosts:count("failedSocialPosts"),
    failedBusinessApps:count("failedBusinessApps"),
  };
  const aiRequests30d=safeNumber(usage.aiRequests30d);
  const siteRequests30d=safeNumber(usage.siteRequests30d);
  if(Object.values(metrics).some(v=>v===null)) notes.push("Some source counts are unavailable; unknown values are not zero.");
  if(aiRequests30d===null||siteRequests30d===null) notes.push("Usage volume has incomplete source coverage.");
  const incidents=[
    {key:"website",title:"Website publishing jobs failed",count:metrics.failedWebsiteJobs,route:"websitePublishing",severity:"attention"},
    {key:"social",title:"Social posts with failures",count:metrics.failedSocialPosts,route:"socialMedia",severity:"attention"},
    {key:"apps",title:"Business Apps reporting failure",count:metrics.failedBusinessApps,route:"miniAppBuilder",severity:"attention"},
    {key:"queue",title:"Website jobs queued or retrying",count:metrics.pendingWebsiteJobs,route:"websitePublishing",severity:"watch"},
  ].map(item=>({...item,
    // Counts are totals across all tenants, never individual-customer detail.
    needsInspection:item.count===null ? null : item.count>0,
  }));
  const autopilot=buildAutopilotDigest({run:monitorRun,incidents:monitorIncidents,
    verifiedRole,nowISO:checkedAt});
  const alertInbox=buildFounderAlertInbox({rows:alertRows,verifiedRole});
  return {
    version:1,
    checkedAt:typeof checkedAt==="string"?checkedAt:"",
    scope:"platform_aggregate",
    privacy:"aggregate_only",
    status:"read_only",
    metrics,
    incidents,
    usage:{
      aiRequestEvents30d:aiRequests30d,
      websiteRequests30d:siteRequests30d,
      coverage:aiRequests30d!==null&&siteRequests30d!==null?"measured_volumes":"incomplete",
      note:"These are request/activity counts from the connected database, not model token costs or provider invoices.",
    },
    commercial:{
      targetSubscriptionGbpPerMonth:50,
      payingSubscribers:null,
      grossMrrGbp:null,
      netMrrGbp:null,
      infrastructureCostGbp:null,
      aiCostGbp:null,
      marginGbp:null,
      reason:"No verified billing ledger or provider invoice feed is connected. Workspace count is not subscriber count.",
    },
    automation:{
      enabled:true,
      alertDeliveryConfigured:false,
      note:"Server-side aggregate incident monitoring is scheduled every 15 minutes. Incident delivery to your phone/email, privileged repairs and billing automation are not yet enabled.",
    },
    autopilot,
    alertInbox,
    reliability:buildFounderReliability({autopilot,alertInbox}),
    notes,
  };
}
export {isFounderUser,aggregateUsageRows,buildFounderReport};
