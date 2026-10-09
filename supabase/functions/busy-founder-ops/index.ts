import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {isFounderUser,aggregateUsageRows,buildFounderReport} from "./report.mjs";
import {VALID_KEYS} from "./alertInbox.mjs";
import {probeManagedWebsite,buildExternalRealityDigest} from "./externalReality.mjs";
import {snapshotPayload} from "./evidenceHistory.mjs";

/**
 * V3.69 founder-only READ endpoint.
 * Every request is freshly checked against the Auth server's app_metadata.
 * NO client request parameter can grant privilege or choose another identity.
 * The service key remains on this server; only aggregate counters are returned.
 */
const ROOT=Deno.env.get("SUPABASE_URL")||"";
function injectedKey(name:string){
  try{
    const parsed=JSON.parse(Deno.env.get(name)||"{}");
    return typeof parsed?.default==="string"?parsed.default:"";
  }catch{return "";}
}
const PUBLIC_KEY=injectedKey("SUPABASE_PUBLISHABLE_KEYS")||Deno.env.get("SUPABASE_ANON_KEY")||"";
const SECRET_KEY=injectedKey("SUPABASE_SECRET_KEYS")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const headers={"Content-Type":"application/json","Cache-Control":"no-store",
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info"};
const send=(status:number,body:unknown)=>
  new Response(JSON.stringify(body),{status,headers});
function serviceHeaders(){
  return {"apikey":SECRET_KEY,...(!SECRET_KEY.startsWith("sb_secret_")
    ? {"Authorization":"Bearer "+SECRET_KEY}:{})};
}
async function authenticatedUser(req:Request){
  const bearer=req.headers.get("Authorization")||"";
  if(!PUBLIC_KEY||!/^Bearer [^ ]{16,}$/i.test(bearer))return null;
  const reply=await fetch(ROOT+"/auth/v1/user",{
    headers:{"apikey":PUBLIC_KEY,"Authorization":bearer},signal:AbortSignal.timeout(8500)});
  if(!reply.ok)return null;
  const user=await reply.json().catch(()=>null);
  return isFounderUser(user)?user:null;
}
function recentDate(days:number){
  const day=new Date(Date.now()-days*86400000);
  return day.toISOString().slice(0,10);
}
async function queryCount(table:string,column:string,filters:Record<string,string>={}){
  if(!SECRET_KEY)throw Error("service not configured");
  const query=new URLSearchParams({select:column,...filters});
  const result=await fetch(ROOT+"/rest/v1/"+table+"?"+query,{
    method:"HEAD",
    headers:{...serviceHeaders(),"Prefer":"count=exact"},
    signal:AbortSignal.timeout(8500),
  });
  if(!result.ok)throw Error("count unavailable");
  const range=result.headers.get("Content-Range")||"";
  const match=range.match(/\/(\d+)$/);
  if(!match)return null;
  const n=Number(match[1]);
  return Number.isSafeInteger(n)?n:null;
}
async function queryUsageSum(table:string,field:string,dateColumn:string){
  if(!SECRET_KEY)throw Error("service not configured");
  const q=new URLSearchParams({select:field,[dateColumn]:"gte."+recentDate(30),limit:"1001"});
  const result=await fetch(ROOT+"/rest/v1/"+table+"?"+q,{
    headers:{...serviceHeaders(),"Prefer":"count=exact"},
    signal:AbortSignal.timeout(8500),
  });
  if(!result.ok)return null;
  const range=result.headers.get("Content-Range")||"";
  const totalMatch=range.match(/\/(\d+)$/);
  if(!totalMatch||Number(totalMatch[1])>1000)return null;
  const data=await result.json().catch(()=>null);
  return aggregateUsageRows(data,{exhaustive:true,field,maxRows:1000});
}
async function safely<T>(query:()=>Promise<T>):Promise<T|null>{
  try{return await query();}catch{return null;}
}
async function aggregates(){
  const entries=await Promise.all([
    safely(()=>queryCount("busy_businesses","id")),
    safely(()=>queryCount("busy_business_memberships","business_id")),
    safely(()=>queryCount("busy_business_snapshots","business_id",{"updated_at":"gte."+new Date(Date.now()-7*86400000).toISOString()})),
    safely(()=>queryCount("busy_website_publish_jobs","id",{"status":"in.(queued,processing,retry_wait)"})),
    safely(()=>queryCount("busy_website_publish_jobs","id",{"status":"eq.failed"})),
    safely(()=>queryCount("busy_social_posts","id",{"status":"eq.Failed"})),
    safely(()=>queryCount("busy_social_posts","id",{"status":"eq.Partial failure"})),
    safely(()=>queryCount("busy_mini_apps","id",{"status":"eq.failed"})),
    safely(()=>queryUsageSum("busy_conversation_ai_usage_daily","request_count","usage_day")),
    safely(()=>queryUsageSum("busy_website_usage_daily","requests","usage_date")),
  ]);
  const [businessWorkspaces,businessMemberships,activeWorkspaces7d,
    pendingWebsiteJobs,failedWebsiteJobs,socialFailed,socialPartial,failedBusinessApps,
    aiRequests30d,siteRequests30d]=entries;
  const sumSocial=socialFailed===null||socialPartial===null?null:socialFailed+socialPartial;
  return {
    counts:{businessWorkspaces,businessMemberships,activeWorkspaces7d,
      pendingWebsiteJobs,failedWebsiteJobs,failedSocialPosts:sumSocial,failedBusinessApps},
    usage:{aiRequests30d,siteRequests30d},
  };
}
/**
 * Platform data is server-only and returned AFTER a fresh Supabase Auth founder
 * role check. Never accept a user-provided business ID or arbitrary SQL filter.
 */
async function privilegedRows(table:string,select:string,order:string,limit:number,filters:Record<string,string>={}){
  if(!SECRET_KEY)throw Error("platform reporting key not configured");
  const query=new URLSearchParams({select,order,limit:String(limit),...filters});
  const reply=await fetch(ROOT+"/rest/v1/"+table+"?"+query,{
    headers:serviceHeaders(),signal:AbortSignal.timeout(8500)});
  if(!reply.ok)throw Error("platform incident reporting source unavailable");
  const data=await reply.json().catch(()=>null);
  if(!Array.isArray(data))throw Error("invalid incident reporting source");
  return data;
}
async function incidentData(){
  const [runs,incidents,alerts,reviews]=await Promise.all([
    safely(()=>privilegedRows("busy_platform_monitor_runs",
      "checked_at,status,coverage","checked_at.desc",1)),
    safely(()=>privilegedRows("busy_platform_incidents",
      "incident_key,status,severity,affected_count,first_detected_at,last_observed_at,resolved_at,transition_count",
      "last_observed_at.desc",12)),
    safely(()=>privilegedRows("busy_platform_alert_inbox",
      "incident_key,priority,status,affected_count,source_transition_count,opened_at,last_seen_at,resolved_at,acknowledged_at",
      "last_seen_at.desc",12)),
    safely(()=>privilegedRows("busy_platform_recovery_reviews",
      "incident_key,source_transition_count,assessment,monitoring_verified,affected_count,clear_checks,last_assessed_at,assessment_runs",
      "last_assessed_at.desc",12)),
  ]);
  return {
    monitorRun:Array.isArray(runs)?(runs[0]||null):null,
    monitorIncidents:Array.isArray(incidents)?incidents:null,
    alertRows:Array.isArray(alerts)?alerts:null,
    recoveryRows:Array.isArray(reviews)?reviews:null,
  };
}


/** Only a verified founder may reach this fixed, bounded set of read-only
 * evidence checks. All URLs are generated from trusted, allowlisted BUSY
 * hostnames in the database; never accept caller-supplied targets. */
async function externalReality(){
  const [sites,posts,apps]=await Promise.all([
    safely(()=>privilegedRows("busy_websites",
      "id,default_hostname,current_live_deployment_id","updated_at.desc",4,
      {"current_live_deployment_id":"not.is.null"})),
    safely(()=>privilegedRows("busy_social_posts",
      "status,channels,provider_results","updated_at.desc",12,
      {"status":"in.(Published,Partial failure,Failed)"})),
    safely(()=>privilegedRows("busy_mini_apps",
      "status,current_live_version_id,public_web_status,public_web_version_id",
      "updated_at.desc",8,{"current_live_version_id":"not.is.null"})),
  ]);
  const websiteChecks=Array.isArray(sites)?
    await Promise.all(sites.map(site=>probeManagedWebsite(site))):null;
  return buildExternalRealityDigest({
    websiteChecks,socialRows:posts,appRows:apps,
    checkedAt:new Date().toISOString()
  });
}


async function claimEvidenceWindow(){
  // No client value decides the slot. The DB atomically grants only one
  // 30-minute window, regardless of repeated API calls.
  const reply=await fetch(ROOT+"/rest/v1/rpc/busy_claim_evidence_window",{
    method:"POST",headers:{...serviceHeaders(),"Content-Type":"application/json"},
    body:"{}",signal:AbortSignal.timeout(8500)});
  if(!reply.ok)throw Error("evidence_claim_unavailable");
  const slot=await reply.json().catch(()=>undefined);
  if(slot===null)return null;
  if(typeof slot!=="string"||!Number.isFinite(Date.parse(slot)))
    throw Error("evidence_claim_invalid");
  return new Date(slot).toISOString();
}
async function evidenceRows(){
  return await privilegedRows("busy_platform_evidence_snapshots",
    "window_start,status,website_sampled,website_responding,website_unreachable,website_mismatch,website_unverified,social_sampled,social_provider_accepted,social_failed,social_unverified,app_sampled,app_deployment_recorded,app_version_mismatch,app_unverified",
    "window_start.desc",336,{"status":"in.(complete,partial)",
      "window_start":"gte."+new Date(Date.now()-7*86400000).toISOString()});
}
async function storeEvidenceWindow(slot:string,digest:unknown){
  const payload=snapshotPayload(digest);
  const q=new URLSearchParams({
    window_start:"eq."+slot,status:"eq.running",
    select:"window_start,status"});
  const reply=await fetch(ROOT+"/rest/v1/busy_platform_evidence_snapshots?"+q,{
    method:"PATCH",
    headers:{...serviceHeaders(),"Content-Type":"application/json",
      "Prefer":"return=representation"},
    body:JSON.stringify(payload),
    signal:AbortSignal.timeout(8500)});
  if(!reply.ok)return false;
  const rows=await reply.json().catch(()=>null);
  return Array.isArray(rows)&&rows.length===1&&rows[0]?.status===payload.status;
}

async function acknowledgeAlert(key:string,transition:number){
  // Optimistic lock: never acknowledge a newer recurrence by accident.
  const q=new URLSearchParams({select:"incident_key,source_transition_count,acknowledged_at",
    incident_key:"eq."+key,source_transition_count:"eq."+transition,
    status:"eq.open",acknowledged_at:"is.null"});
  const reply=await fetch(ROOT+"/rest/v1/busy_platform_alert_inbox?"+q,{
    method:"PATCH",headers:{...serviceHeaders(),"Content-Type":"application/json",
      "Prefer":"return=representation"},
    body:JSON.stringify({acknowledged_at:new Date().toISOString()}),
    signal:AbortSignal.timeout(8500)
  });
  if(!reply.ok)throw Error("alert inbox unavailable");
  const rows=await reply.json().catch(()=>null);
  return Array.isArray(rows)&&rows.length===1&&rows[0]?.incident_key===key&&
    rows[0]?.source_transition_count===transition;
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
  if(req.method!=="POST")return send(405,{error:"method_not_allowed"});
  // No invocation without a verified server-side founder grant.
  let founder;
  try{founder=await authenticatedUser(req);}catch{return send(401,{error:"not_authorized"});}
  if(!founder)return send(403,{error:"founder_access_not_enabled"});
  let payload:unknown;
  try{
    if(Number(req.headers.get("content-length")||0)>2048)return send(413,{error:"request_too_large"});
    payload=await req.json();
  }catch{return send(400,{error:"invalid_request"});}

  if(!payload||typeof payload!=="object"||Array.isArray(payload))
    return send(400,{error:"unsupported_action"});
  const action=(payload as {action?:unknown}).action;
  if(action==="acknowledge"){
    const item=payload as {key?:string,transition?:number};
    if(Object.keys(payload).sort().join(",")!=="action,key,transition"||
       typeof item.key!=="string"||!VALID_KEYS.has(item.key)||
       typeof item.transition!=="number"||!Number.isSafeInteger(item.transition)||
       item.transition<1)
      return send(400,{error:"invalid_alert"});
    if(!ROOT||!SECRET_KEY)return send(503,{error:"platform_reporting_unavailable"});
    try{
      const ok=await acknowledgeAlert(item.key,item.transition);
      return ok?send(200,{status:"acknowledged"}):
        send(409,{error:"alert_changed_or_already_acknowledged"});
    }catch{return send(503,{error:"platform_reporting_unavailable"});}
  }
  if(action==="verify_external"&&Object.keys(payload).length===1){
    if(!ROOT||!SECRET_KEY)return send(503,{error:"platform_reporting_unavailable"});
    try{
      const slot=await claimEvidenceWindow();
      if(!slot)return send(429,{error:"evidence_rate_limited",
        note:"An external evidence check has already been claimed in this 30-minute window. The founder history remains available."});
      const result=await externalReality();
      const historyPersisted=await storeEvidenceWindow(slot,result);
      return send(200,{...result,historyPersisted});
    }catch{return send(503,{error:"external_evidence_unavailable"});}
  }
  if(action!=="summary"||Object.keys(payload).some(k=>k!=="action"))
    return send(400,{error:"unsupported_action"});
  if(!ROOT||!SECRET_KEY)return send(503,{error:"platform_reporting_unavailable"});
  try{
    const [{counts,usage},{monitorRun,monitorIncidents,alertRows,recoveryRows},founderDeviceCount,history]=await Promise.all([
      aggregates(),incidentData(),
      safely(()=>queryCount("busy_push_devices","id",{"user_id":"eq."+founder.id,"active":"eq.true"})),
      safely(()=>evidenceRows())
    ]);
    return send(200,buildFounderReport({counts,usage,monitorRun,monitorIncidents,alertRows,recoveryRows,evidenceRows:history,founderDeviceCount,
      checkedAt:new Date().toISOString(),verifiedRole:true}));
  }catch{return send(503,{error:"platform_reporting_unavailable"});}
});
