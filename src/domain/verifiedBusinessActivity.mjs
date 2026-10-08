/**
 * V3.67 — source-attributed, read-only business activity.
 * Provider responses are evidence of a recorded action, not an independent
 * third-party reachability check. Never infer association with a growth service.
 */
const trim=(v,n=200)=>typeof v==="string"?v.trim().slice(0,n):"";
const arr=v=>Array.isArray(v)?v:[];
const date=v=>{
  const s=trim(v,50);
  return s && Number.isFinite(Date.parse(s)) ? new Date(s).toISOString() : "";
};
const sources=["website","business_app","social"];
const label={website:"Website hosting",business_app:"Customer Business App",social:"Social media"};
const receiptFields=["id","post_id","media_id","provider_post_id","providerPostId","permalink","url","mediaId","postId","resource_id"];
const okReceipt=obj=>obj && typeof obj==="object" && !Array.isArray(obj) && !obj.error &&
  receiptFields.some(k=>trim(String(obj[k]||"")).length>0);
const trustedScope=(remote,businessId,source)=>{
  if(!remote||typeof remote!=="object")return false;
  // Service responses may omit ownership metadata, but authenticated Functions
  // still use the businessId in the body and check authorisation server-side.
  const advertised=[
    remote.owner?.businessId,remote.owner?.business_id,remote.businessId,
    source==="website"?remote.website?.business_id:null,
    source==="business_app"?remote.app?.business_id:null,
  ].filter(Boolean);
  return advertised.every(id=>id===businessId);
};
function buildVerifiedActivity({businessId="",userId="",results={},asOf=""}={}){
  if(!businessId||!userId)return {
    state:"signed_out",events:[],channels:[],availability:{},verified:0,failed:0,
    notice:"Sign in to view private business activity.",
  };
  const availability={};const events=[];const channels=[];
  const event=(source,record,kind,title,description,when,evidence="")=>{
    events.push({id:[source,record,kind,title].join(":"),source,
      kind,title:trim(title,110),description:trim(description,290),
      occurredAt:date(when),evidence:trim(evidence,160),scope:businessId,
      providerRecorded:kind==="provider_recorded",verifiedPublicReachability:false,
      associatedGrowthProject:false});
  };
  for(const source of sources){
    const entry=results[source];
    if(!entry?.ok || !trustedScope(entry.data,businessId,source)){
      availability[source]="unavailable";
      continue;
    }
    const data=entry.data;
    availability[source]="checked";
    if(source==="website"){
      const site=data.website||{};
      const rows=arr(data.deployments);
      const current=rows.find(x=>site.current_live_deployment_id &&
        x?.id===site.current_live_deployment_id);
      if(current?.state==="live" && date(current.published_at)){
        event(source,current.id,"provider_recorded","Hosted website deployment recorded live",
          "The authenticated hosting system reports this exact deployment as live. Public reachability was not independently tested.",
          current.published_at,"Deployment "+trim(String(current.id),60));
      }else if(site.current_live_deployment_id){
        event(source,site.current_live_deployment_id,"unverified","Website live deployment needs verification",
          "The hosting record refers to a live deployment but its matching live record and published date were not both confirmed.",
          site.updated_at||"", "Hosting status only");
      }
      for(const row of rows.slice(0,12)){
        if(!row?.id||row.id===current?.id)continue;
        if(row.state==="preview_ready")
          event(source,row.id,"prepared","Website preview prepared",
            "This is an unpublished preview.",row.created_at||row.updated_at);
      }
      for(const job of arr(data.jobs).slice(0,15)){
        if(job?.status==="failed" && job?.id)
          event(source,job.id,"failed","Website publishing job failed",
            "Open website publishing to inspect the failure. No automatic retry.",
            job.updated_at||job.created_at);
      }
    }else if(source==="business_app"){
      const app=data.app||{};
      const versions=arr(data.versions);
      const current=versions.find(v=>app.current_live_version_id && v?.id===app.current_live_version_id);
      if(current?.state==="live" && ["live","update_pending"].includes(app.status)){
        event(source,current.id,"provider_recorded","Customer Business App version recorded live",
          "BUSY Apps reports the linked version as live. Customer reachability and external app-store distribution were not independently checked.",
          current.published_at||current.updated_at||app.updated_at,"Version "+trim(String(current.id),60));
      }else if(app.current_live_version_id){
        event(source,app.current_live_version_id,"unverified","Business App release needs verification",
          "The app claims a live-version reference, but the matching release record did not confirm live state.",
          app.updated_at||"");
      }
      for(const version of versions.slice(0,12)){
        if(version?.id&&version.state==="preview_ready")
          event(source,version.id,"prepared","Customer Business App preview prepared",
            "Preview only; publishing still requires owner approval.",version.created_at||version.updated_at);
      }
      if(app?.status==="failed")
        event(source,String(app.id||"app"),"failed","Business App requires attention",
          "The Business App service recorded a failure.",app.updated_at||"");
    }else{
      for(const post of arr(data.queue).slice(0,25)){
        const postId=String(post?.id||post?.client_draft_id||"");
        if(!postId)continue;
        const selected=arr(post.channels).filter(x=>typeof x==="string").slice(0,5);
        const providerResults=post.provider_results||{};
        for(const channel of [...new Set(selected)]){
          const result=providerResults[channel];
          const title=channel.replace(/_/g," ");
          if(result?.error){
            channels.push({postId,channel,status:"failed",retryEligible:true});
            event(source,postId+":"+channel,"failed",title+" publishing failed",
              "This destination failed. Check the original post and retry only failed destinations using its existing approved controls.",
              post.updated_at||post.published_at);
          }else if(date(post.published_at) && okReceipt(result)){
            channels.push({postId,channel,status:"provider_recorded",retryEligible:false});
            event(source,postId+":"+channel,"provider_recorded",title+" published (provider receipt)",
              "The authenticated publishing queue includes a destination-specific provider identifier and published timestamp. Public reachability was not independently checked.",
              post.published_at,
              trim(String(result.id||result.post_id||result.media_id||result.provider_post_id||result.providerPostId||result.permalink||result.url||result.mediaId||result.postId||result.resource_id),160));
          }else{
            channels.push({postId,channel,status:"unverified",retryEligible:false});
            if(["Partial failure","Published","Failed"].includes(post.status))
              event(source,postId+":"+channel,"unverified",title+" result not yet verified",
                "The queue status alone is not sufficient evidence of successful publication.",
                post.updated_at||"");
          }
        }
        if(post.status==="Scheduled")
          event(source,postId,"scheduled","Social post scheduled",
            "Scheduled is not published.",post.scheduled_for||post.updated_at);
      }
    }
  }
  events.sort((a,b)=>(b.occurredAt||"").localeCompare(a.occurredAt||"")||a.id.localeCompare(b.id));
  const checked=sources.filter(s=>availability[s]==="checked").length;
  return {state:checked?(checked===3?"checked":"partial"):"unavailable",
    events:events.slice(0,60),channels,
    availability,checkedAt:date(asOf),verified:events.filter(x=>x.kind==="provider_recorded").length,
    failed:events.filter(x=>x.kind==="failed").length,
    notice:checked===3?
      "Provider-recorded outcomes only. No public URL or user reachability checks were performed.":
      "Some publishing systems could not be checked. Missing records are not proof of success or failure.",
    crossServiceAttribution:false,
  };
}
function resultBrief(activity){
  if(!activity||activity.state==="signed_out")return "Sign in to check business publishing activity.";
  if(activity.state==="unavailable")return "BUSY could not verify publishing activity for this business. No success should be assumed.";
  const available=Object.entries(activity.availability).filter(([,v])=>v==="checked").map(([k])=>label[k]);
  const unavailable=Object.entries(activity.availability).filter(([,v])=>v!=="checked").map(([k])=>label[k]);
  return [
    "Provider-recorded results for this business: "+activity.verified+" publication or live-version confirmation"+(activity.verified===1?"":"s")+
      ", "+activity.failed+" recorded failure"+(activity.failed===1?"":"s")+".",
    unavailable.length?"Could not check: "+unavailable.join(", ")+".":"All three reporting systems responded.",
    "These results are business-wide; they are not automatically linked to any particular growth project or service.",
    "BUSY has not independently checked public availability. No retries or publications were triggered.",
  ].join(" ");
}
export {buildVerifiedActivity,resultBrief};
