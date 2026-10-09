/**
 * V3.76 bounded private history. Only explicitly enumerated aggregate counters
 * may be persisted; there are NO customer identifiers or free-form source data.
 */
const numeric=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max?n:null;
const date=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
const nullCounters={website_sampled:null,website_responding:null,website_unreachable:null,
  website_mismatch:null,website_unverified:null,social_sampled:null,social_provider_accepted:null,
  social_failed:null,social_unverified:null,app_sampled:null,app_deployment_recorded:null,
  app_version_mismatch:null,app_unverified:null};
function snapshotPayload(digest){
  const website=digest?.website, social=digest?.social, apps=digest?.apps;
  const w=website?.outcomes,sc=social?.channels,a=apps?.outcomes;
  const counters={
    ...nullCounters,
    website_sampled:numeric(website?.sampled,4),
    website_responding:numeric(w?.deployment_responding,4),
    website_unreachable:numeric(w?.unreachable,4),
    website_mismatch:numeric(w?.mismatch,4),
    website_unverified:numeric(w?.unverified,4),
    social_sampled:numeric(social?.sampledPosts,12),
    social_provider_accepted:numeric(sc?.providerAccepted,36),
    social_failed:numeric(sc?.failed,36),
    social_unverified:numeric(sc?.unverified,36),
    app_sampled:numeric(apps?.sampled,8),
    app_deployment_recorded:numeric(a?.deployment_recorded,8),
    app_version_mismatch:numeric(a?.version_mismatch,8),
    app_unverified:numeric(
      a&&Number.isSafeInteger(a.not_deployed)&&Number.isSafeInteger(a.not_verified)&&
      Number.isSafeInteger(a.unverified)
        ?a.not_deployed+a.not_verified+a.unverified:null,8),
  };
  if(counters.website_sampled!==null&&
    (counters.website_responding===null||counters.website_unreachable===null||
     counters.website_mismatch===null||counters.website_unverified===null||
     counters.website_responding+counters.website_unreachable+
       counters.website_mismatch+counters.website_unverified!==counters.website_sampled))
    Object.keys(counters).filter(k=>k.startsWith("website_")).forEach(k=>counters[k]=null);
  if(counters.app_sampled!==null&&
    (counters.app_deployment_recorded===null||counters.app_version_mismatch===null||
     counters.app_unverified===null||counters.app_deployment_recorded+
       counters.app_version_mismatch+counters.app_unverified!==counters.app_sampled))
    Object.keys(counters).filter(k=>k.startsWith("app_")).forEach(k=>counters[k]=null);
  if(counters.social_sampled!==null&&
    (counters.social_provider_accepted===null||counters.social_failed===null||
     counters.social_unverified===null||counters.social_provider_accepted+
       counters.social_failed+counters.social_unverified>3*counters.social_sampled))
    Object.keys(counters).filter(k=>k.startsWith("social_")).forEach(k=>counters[k]=null);
  const full=["website_sampled","social_sampled","app_sampled"]
    .every(k=>counters[k]!==null);
  return {status:full?"complete":"partial",
    completed_at:date(digest?.checkedAt)||new Date().toISOString(),...counters};
}
function boundedSnapshot(r){
  if(!r||!["complete","partial"].includes(r.status))return null;
  const when=date(r.window_start);
  if(!when)return null;
  return {at:when,status:r.status,
    website:{sampled:numeric(r.website_sampled,4),
      responding:numeric(r.website_responding,4),
      unhealthy: r.website_unreachable===null||r.website_mismatch===null?null:
        numeric(r.website_unreachable+r.website_mismatch,4)},
    social:{sampled:numeric(r.social_sampled,12),
      accepted:numeric(r.social_provider_accepted,36),
      issues:r.social_failed===null||r.social_unverified===null?null:
        numeric(r.social_failed+r.social_unverified,36)},
    apps:{sampled:numeric(r.app_sampled,8),
      recorded:numeric(r.app_deployment_recorded,8),
      issues:r.app_version_mismatch===null||r.app_unverified===null?null:
        numeric(r.app_version_mismatch+r.app_unverified,8)}
  };
}
function buildEvidenceHistory({rows=null,nowISO=""}={}){
  if(!Array.isArray(rows))return {status:"unavailable",retainedDays:30,
    snapshots7d:null,latestAt:null,trend:"unverified",diagnoses:[],
    unattendedExternalChecksEnabled:false};
  const now=Date.parse(nowISO);
  if(!Number.isFinite(now))return {status:"unavailable",retainedDays:30,
    snapshots7d:null,latestAt:null,trend:"unverified",diagnoses:[],
    unattendedExternalChecksEnabled:false};
  const recent=rows.slice(0,336).map(boundedSnapshot).filter(Boolean)
    .filter(r=>Date.parse(r.at)<=now&&Date.parse(r.at)>=now-7*86400000)
    .sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
  const latest=recent[0]||null;
  const w=latest?.website;
  const diagnoses=[];
  if(w?.sampled>=2&&w.unhealthy!==null&&w.unhealthy>=2&&
     w.unhealthy*2>=w.sampled)
    diagnoses.push({kind:"possible_shared_website_symptom",level:"review",
      note:"Several sampled websites showed unreachable or mismatched deployments in the same check. Inspect shared infrastructure; a common provider fault is NOT confirmed."});
  const last24=recent.filter(r=>Date.parse(r.at)>=now-86400000);
  const prev24=recent.filter(r=>Date.parse(r.at)>=now-2*86400000&&
    Date.parse(r.at)<now-86400000);
  const issueTotals=items=>items.reduce((sum,r)=>sum+
    (r.website.unhealthy??0)+(r.social.issues??0)+(r.apps.issues??0),0);
  // Trend is an observational snapshot comparison, NOT a distinct-incident
  // count. It requires at least two completed samples in each time window.
  const hasAnySample=items=>items.some(r=>
    (r.website.sampled??0)+(r.social.sampled??0)+(r.apps.sampled??0)>0);
  const enough=last24.length>=2&&prev24.length>=2&&
    hasAnySample(last24)&&hasAnySample(prev24);
  const rate=items=>issueTotals(items)/items.length;
  const trend=!enough?"insufficient_history":rate(last24)>rate(prev24)?
    "more_issue_observations_per_check":rate(last24)<rate(prev24)?
      "fewer_issue_observations_per_check":"unchanged_issue_observations_per_check";
  if(recent.filter(r=>r.website.unhealthy!==null&&r.website.unhealthy>0).length>=3)
    diagnoses.push({kind:"repeated_website_observations",level:"watch",
      note:"Website errors recurred in multiple samples. They may involve the same underlying deployment; distinct incidents cannot be inferred."});
  if(recent.filter(r=>r.social.issues!==null&&r.social.issues>0).length>=3)
    diagnoses.push({kind:"repeated_social_receipt_issues",level:"watch",
      note:"Stored provider receipt anomalies appeared in multiple samples, possibly for the same posts. Public visibility has NOT been checked."});
  return {status:"available",retainedDays:30,snapshots7d:recent.length,
    latestAt:latest?.at||null,trend,
    sampledIssueObservations7d:issueTotals(recent),
    diagnoses:diagnoses.slice(0,3),unattendedExternalChecksEnabled:false,
    budget:{minimumMinutesBetweenChecks:30,maxWebsiteHeadRequestsPerCheck:4,
      maxSocialRecordsPerCheck:12,maxBusinessAppsPerCheck:8,
      maxChecksPerDay:48,automaticScheduleEnabled:false},
    note:"Seven-day aggregate sample history, retained for up to 30 days by daily pruning. Trend compares average issue observations per check, not distinct incidents or a complete customer census. No provider invoice cost is inferred."};
}
export {snapshotPayload,buildEvidenceHistory};
