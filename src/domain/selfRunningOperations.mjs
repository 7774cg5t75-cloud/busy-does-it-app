/**
 * V3.68: owner/business-scoped operational exception digest.
 *
 * This is NOT a SaaS-wide platform admin or live billing dashboard.
 * Status snapshots are read-only and must not assert recovery or earnings.
 */
const finiteCount = v => Number.isFinite(Number(v)) && Number(v)>=0 ? Math.floor(Number(v)) : null;
const sources=Object.freeze({website:"Website hosting",business_app:"Business App",social:"Social publishing"});
const severityRank=Object.freeze({critical:0,attention:1,watch:2,info:3});
const clean=(v,n=220)=>typeof v==="string"?v.trim().slice(0,n):"";
function validTime(value){
  const millis=Date.parse(value||"");
  return Number.isFinite(millis)?millis:null;
}
function buildSelfRunningOperations({
  ownerId="",businessId="",continuity={},releaseCoreHealth={},
  activity={},websitePublishingStatus={},miniAppsStatus={},
  productionWatchStatus={},cloudConflict=null,nowISO="",
  consecutiveReadFailures={},
}={}){
  if(!ownerId||!businessId)return {
    state:"signed_out",exceptions:[],humanRequired:[],watch:[],metrics:{},costs:{state:"unmeasured"},
    headline:"Sign in to view this business's operations.",autoRecovered:null,
  };
  const exceptionMap=new Map();
  const put=(row)=>{
    if(!row?.id || !["critical","attention","watch","info"].includes(row.severity))return;
    const issue={id:row.id,severity:row.severity,source:row.source||"BUSY",
      title:clean(row.title,95),description:clean(row.description,360),
      action:row.action||"inspect",route:clean(row.route,80),requiresHuman:!!row.requiresHuman};
    const old=exceptionMap.get(issue.id);
    if(!old||severityRank[issue.severity]<severityRank[old.severity])exceptionMap.set(issue.id,issue);
  };
  for(const issue of Array.isArray(continuity.issues)?continuity.issues:[]){
    if(issue.optional)continue;
    const sev=issue.severity==="High"?"critical":"attention";
    put({id:"continuity:"+clean(issue.id,75),severity:sev,source:clean(issue.area,80),
      title:issue.title,description:issue.body,
      action:"inspect",route:issue.route||"operationalContinuity",requiresHuman:sev==="critical"});
  }
  if(cloudConflict && !exceptionMap.has("continuity:cloud-conflict"))
    put({id:"continuity:cloud-conflict",severity:"critical",source:"Cloud",
      title:"Cloud revision conflict requires review",
      description:"BUSY has paused conflicting writes. Review and choose the correct copy; automatic merging could lose customer data.",
      route:"businessData",requiresHuman:true});
  const coreHigh=finiteCount(releaseCoreHealth.highCount)||0;
  if(coreHigh && !exceptionMap.has("continuity:release-core-high"))
    put({id:"core:high",severity:"critical",source:"Core records",
      title:"Core record integrity needs review",
      description:coreHigh+" high-priority record issue(s) were detected. No automatic data repair is attempted.",
      route:"releaseCore",requiresHuman:true});
  const checked=activity.availability||{};
  for(const [source,label] of Object.entries(sources)){
    if(checked[source]==="checked")continue;
    const attempts=finiteCount(consecutiveReadFailures[source])||0;
    put({
      id:"status:"+source,
      severity:attempts>=2?"attention":"watch",
      source:label,
      title:attempts>=2?label+" status remains unavailable":label+" status not checked",
      description:attempts>=2
        ?"Two or more consecutive read-only status checks failed. Open the relevant service to troubleshoot; publishing state is unknown."
        :"Monitoring could not confirm the current state. This is not proof the service is down.",
      route:source==="website"?"websitePublishing":source==="business_app"?"miniAppBuilder":"socialMedia",
      action:"inspect",requiresHuman:false,
    });
  }
  const socialFailures=(Array.isArray(activity.channels)?activity.channels:[])
    .filter(x=>x.status==="failed");
  const unique=new Set();
  for(const row of socialFailures){
    const id="social:"+clean(row.postId,70)+":"+clean(row.channel,40);
    if(unique.has(id))continue;unique.add(id);
    put({id,severity:"attention",source:"Social publishing",
      title:"A social destination needs attention",
      description:clean(row.channel,45)+" failed for a post. Existing controls can retry only failed channels after confirming the original item. Do not repost successful channels.",
      route:"socialMedia",requiresHuman:false});
  }
  const failedJobs=Array.isArray(websitePublishingStatus?.jobs)?websitePublishingStatus.jobs.filter(job=>job?.status==="failed"):[];
  for(const job of failedJobs.slice(0,5)){
    if(!job.id)continue;
    put({id:"website-job:"+clean(String(job.id),70),severity:"attention",source:"Website hosting",
      title:"Website background job failed",
      description:"Open website publishing for the recorded failure and review existing safe recovery controls.",
      route:"websitePublishing",requiresHuman:false});
  }
  if(miniAppsStatus?.loaded && miniAppsStatus?.app?.status==="failed"){
    put({id:"apps:failed",severity:"attention",source:"Business App",
      title:"Customer Business App needs attention",
      description:"The app service reports a failed state. Open the builder to inspect the source record.",
      route:"miniAppBuilder"});
  }
  // An absent production watcher is a setup gap, not a customer-facing outage.
  const watcher=productionWatchStatus||{};
  const now=validTime(nowISO);
  const last=validTime(watcher.lastDeliveryAt);
  if(watcher.configured===true && last!==null && now!==null && now-last>36*60*60*1000){
    put({id:"watcher:stale",severity:"attention",source:"Production watcher",
      title:"Watcher deliveries may have stalled",
      description:"No recorded delivery within 36 hours. Check the watcher status and its schedule before assuming an outage.",
      route:"productionBridge"});
  }else if(watcher.configured!==true){
    put({id:"watcher:not-configured",severity:"info",source:"Production watcher",
      title:"Remote watcher not yet verified",
      description:"Automatic background delivery cannot be claimed until the server schedule is confirmed.",
      route:"productionBridge"});
  }
  const all=[...exceptionMap.values()].sort((a,b)=>
    severityRank[a.severity]-severityRank[b.severity]||a.id.localeCompare(b.id));
  const humanRequired=all.filter(x=>x.requiresHuman);
  const attention=all.filter(x=>x.severity==="attention"||x.severity==="critical");
  const watch=all.filter(x=>x.severity==="watch"||x.severity==="info");
  // These are genuine service usage counts, not currency expenditure estimates.
  const usage=websitePublishingStatus?.loaded?websitePublishingStatus?.usage:null;
  const usageFields=["deployments","publishedVersions","artifactBytes","requests","visits","edgeBytes","healthChecks","activeCustomDomains"];
  const observed={};
  if(usage && typeof usage==="object"){
    for(const key of usageFields){
      const value=finiteCount(usage[key]);
      if(value!==null)observed[key]=value;
    }
  }
  const costs={
    state:Object.keys(observed).length?"usage_only":"unmeasured",
    websiteUsage:observed,
    days:finiteCount(usage?.days),
    currencyCost:null,
    aiCost:null,
    storageCost:null,
    subscriptionRevenue:null,
    margin:null,
    note:"Website activity counters are provider-reported, not billed costs. AI spend, other hosting bills, subscriber numbers and £50 billing have not been integrated.",
  };
  return {
    state:"ready",exceptions:all,attention,humanRequired,watch,
    counts:{critical:all.filter(x=>x.severity==="critical").length,
      action:attention.length,human:humanRequired.length,monitor:watch.length},
    metrics:{
      monitored:Object.keys(checked).filter(k=>checked[k]==="checked").length,
      possible:3,recordedPublications:finiteCount(activity.verified)||0,
      recordedFailures:finiteCount(activity.failed)||0,
    },
    costs,autoRecovered:null,
    headline:humanRequired.length
      ? humanRequired.length+" item(s) need human review"
      : attention.length
      ? "A few systems need inspection"
      : watch.some(x=>x.severity==="watch")
      ? "Checks are incomplete; no verified outage"
      : "No verified high-priority exceptions in the checked sources",
    truth:"Read-only per-business evidence. No cross-tenant subscriber counts, billing totals, public uptime guarantee or automatic repairs were measured.",
  };
}
/**
 * Safe self-service route guidance; no write or retry execution.
 */
function nextRecoveryStep(exception){
  if(!exception)return {kind:"none",label:"Nothing requires recovery",requiresApproval:false};
  if(exception.id==="continuity:cloud-conflict")return {
    kind:"human_review",label:"Compare cloud copies before continuing",route:"businessData",requiresApproval:true};
  if(exception.id.startsWith("social:"))return {
    kind:"owner_review",label:"Inspect the original post and retry only failed channels",route:"socialMedia",requiresApproval:true};
  if(exception.id.startsWith("status:"))return {
    kind:"safe_read",label:"Retry the read-only status check",route:exception.route,requiresApproval:false};
  return {kind:"inspect",label:"Inspect the underlying service",route:exception.route,requiresApproval:false};
}
export {buildSelfRunningOperations,nextRecoveryStep};
