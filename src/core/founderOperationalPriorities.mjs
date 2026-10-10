/**
 * V3.117 deterministic triage from verified founder-only aggregate metrics.
 * No service restarts, tenant details, external alerts or auto-remediation.
 */
const n=x=>Number.isSafeInteger(x)&&x>=0?x:null;
function founderOperationalPriorities(report,{nowISO=null}={}){
 if(report?.scope!=="platform_aggregate"||report?.privacy!=="aggregate_only"||
    report?.status!=="read_only")
  return {status:"unavailable",headline:"Operational evidence unavailable",
    items:[{key:"snapshot",title:"Founder aggregate status",count:null,
      next:"Refresh the verified founder dashboard before making decisions."}],
    highPriorityCount:null,automaticRepairs:false,externalAlertsSent:false};
 // On-demand reports can become stale even when their old counts are zero.
 // Only compare age when caller supplies a credible current timestamp.
 const now=typeof nowISO==="string"?Date.parse(nowISO):NaN;
 const observed=typeof report.checkedAt==="string"?Date.parse(report.checkedAt):NaN;
 const age=Number.isFinite(now)&&Number.isFinite(observed)?
   now-observed:NaN;
 const freshness=Number.isFinite(now) ?
   !Number.isFinite(age)||age<0?"unverified":
   age>24*60*60*1000?"stale":"recent":"not-evaluated";
 const observations=[
  ["website","Website publishing failures",n(report.metrics?.failedWebsiteJobs),
   "Review failed website jobs; no automatic replay or deployment."],
  ["social","Failed social posts",n(report.metrics?.failedSocialPosts),
   "Inspect provider-specific errors before retrying individual channels."],
  ["apps","Business App failures",n(report.metrics?.failedBusinessApps),
   "Inspect failing deployments; do not publish changes automatically."],
  ["queue","Queued or retrying website jobs",n(report.metrics?.pendingWebsiteJobs),
   "Review queue age and deployment health before taking action."]
 ];
 const items=observations.map(([key,title,count,next])=>({
  key,title,count,next,severity:count===null?"unverified":
    count>0?"attention":"none",automaticRepair:false
 }));
 // Missing observations outrank a nominal zero; known failures first.
 items.sort((a,b)=>{
  const priority=x=>x.count>0?0:x.count===null?1:2;
  return priority(a)-priority(b);
 });
 const urgent=items.filter(x=>x.severity==="attention").length;
 const unknown=items.filter(x=>x.severity==="unverified").length;
 const monitoring=report?.reliability?.monitoringIsVerified===true;
 if(freshness==="stale"||freshness==="unverified")
   items.unshift({key:"snapshot",title:"Founder report freshness",
     count:null,severity:"unverified",automaticRepair:false,
     next:"This saved snapshot is stale or has no trustworthy timestamp. Refresh it before using the counts to make decisions."});
 if(!monitoring)items.unshift({key:"monitor",title:"Monitoring evidence",
   count:null,severity:"unverified",automaticRepair:false,
   next:"Confirm scheduled monitoring and its latest successful scan. Do not assume healthy operation."});
 return {status:"available",items,highPriorityCount:urgent,
  unknownCount:unknown+(monitoring?0:1)+(freshness==="stale"||freshness==="unverified"?1:0),
  freshness,
  headline:urgent>0?"Problems recorded — review required":
    freshness==="stale"||freshness==="unverified"?"Founder snapshot needs refreshing":
    !monitoring||unknown>0?"Some operating signals need verification":
      "No recorded failures in the measured counters",
  automaticRepairs:false,externalAlertsSent:false,
  measuredAt:typeof report.checkedAt==="string"?report.checkedAt:null,
  note:"Snapshot counts may not cover every customer or provider and are not live alerts."};
}
export {founderOperationalPriorities};
