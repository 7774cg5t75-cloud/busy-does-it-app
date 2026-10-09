/**
 * V3.75 external evidence: read-only, founder-only aggregate diagnostics.
 * Never accept arbitrary URLs, follow redirects or reveal customer identifiers.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HOST=/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.busydoesit\.co\.uk$/;
const CHANNELS=["Facebook","Instagram","Google Business"];
const safeInt=value=>Number.isSafeInteger(value)&&value>=0?value:null;
function managedHostname(host) {
  return typeof host==="string"&&host.length<=90&&HOST.test(host)?host:null;
}
async function probeManagedWebsite(site,{fetchImpl=fetch,timeoutMs=4000}={}){
  const hostname=managedHostname(site?.default_hostname);
  const id=typeof site?.id==="string"&&UUID.test(site.id)?site.id:null;
  const deployment=typeof site?.current_live_deployment_id==="string"&&
    UUID.test(site.current_live_deployment_id)?site.current_live_deployment_id:null;
  if(!hostname||!id||!deployment)return "unverified";
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<500||timeoutMs>5000)return "unverified";
  let response;
  try{
    response=await fetchImpl("https://"+hostname+"/",{
      method:"HEAD",redirect:"manual",
      headers:{"Accept":"text/html","User-Agent":"BUSY-Reality-Check/3.75"},
      signal:AbortSignal.timeout(timeoutMs)
    });
  }catch{return "unreachable";}
  if(response?.status===404||response?.status===502||response?.status===503)return "unreachable";
  if(response?.status!==200)return "unverified";
  if(response.headers?.get("x-busy-deployment")!==deployment||
     response.headers?.get("x-busy-website")!==id)return "mismatch";
  const type=response.headers?.get("content-type")||"";
  if(!/^text\/html(?:;|$)/i.test(type))return "mismatch";
  return "deployment_responding";
}
function hasProviderReceipt(channel,receipt){
  if(!receipt||typeof receipt!=="object"||Array.isArray(receipt)||receipt.error)return false;
  if(channel==="Facebook"||channel==="Instagram") {
    const value=receipt.id;
    return typeof value==="string"&&/^[a-zA-Z0-9_:-]{2,160}$/.test(value);
  }
  return channel==="Google Business"&&typeof receipt.name==="string"&&
    /^accounts\/[^/]{1,96}\/locations\/[^/]{1,96}\/localPosts\/[^/]{1,160}$/.test(receipt.name);
}
function socialEvidence(post){
  const channels=Array.isArray(post?.channels)?
    [...new Set(post.channels.filter(x=>CHANNELS.includes(x)))]:[];
  if(!channels.length)return {accepted:0,unverified:1,failed:0};
  let accepted=0,unverified=0,failed=0;
  for(const channel of channels){
    const receipt=post?.provider_results?.[channel];
    if(hasProviderReceipt(channel,receipt))accepted++;
    else if(receipt?.error||post?.status==="Failed")failed++;
    else unverified++;
  }
  return {accepted,unverified,failed};
}
function appEvidence(app){
  const live=typeof app?.current_live_version_id==="string"&&
    UUID.test(app.current_live_version_id)?app.current_live_version_id:null;
  const external=typeof app?.public_web_version_id==="string"&&
    UUID.test(app.public_web_version_id)?app.public_web_version_id:null;
  if(!live)return "not_deployed";
  if(!external||app?.public_web_status!=="published")return "not_verified";
  return live===external?"deployment_recorded":"version_mismatch";
}
function countStates(values,states){
  const result=Object.fromEntries(states.map(k=>[k,0]));
  for(const value of values)result[states.includes(value)?value:"unverified"]++;
  return result;
}
function buildExternalRealityDigest({websiteChecks=null,socialRows=null,appRows=null,checkedAt=""}={}){
  const website=Array.isArray(websiteChecks)?{
    status:websiteChecks.length?"sample_checked":"no_live_sites_sampled",
    sampled:websiteChecks.length,
    outcomes:countStates(websiteChecks,["deployment_responding","unreachable","mismatch","unverified"]),
    note:"Only a bounded sample of BUSY-owned default hosts is checked by HTTPS HEAD. Matching deployment headers show a reachable endpoint, not visually correct pages or all custom domains."
  }:{status:"unavailable",sampled:null,outcomes:null};
  const social=Array.isArray(socialRows)?(()=>{
    const totals={providerAccepted:0,failed:0,unverified:0};
    for(const post of socialRows){
      const check=socialEvidence(post);
      totals.providerAccepted+=check.accepted;
      totals.failed+=check.failed;
      totals.unverified+=check.unverified;
    }
    return {status:socialRows.length?"receipt_sample_checked":"no_published_posts_sampled",
      sampledPosts:socialRows.length,channels:totals,
      note:"Provider IDs are submission receipts, NOT independent public visibility checks. No post content, IDs or provider responses are returned."};
  })():{status:"unavailable",sampledPosts:null,channels:null};
  const apps=Array.isArray(appRows)?{
    status:appRows.length?"deployment_sample_checked":"no_live_apps_sampled",
    sampled:appRows.length,
    outcomes:countStates(appRows.map(appEvidence),["deployment_recorded","version_mismatch","not_deployed","not_verified","unverified"]),
    note:"Matching internal and public deployment versions is a recorded provider handoff, NOT independent App Store or customer-site reachability proof."
  }:{status:"unavailable",sampled:null,outcomes:null};
  return {scope:"founder_aggregate_sample",mode:"on_demand_read_only",
    checkedAt:typeof checkedAt==="string"&&Number.isFinite(Date.parse(checkedAt))?
      new Date(checkedAt).toISOString():null,
    sampledOnly:true,automaticRetryAllowed:false,website,social,apps};
}
export {managedHostname,probeManagedWebsite,hasProviderReceipt,socialEvidence,appEvidence,buildExternalRealityDigest};
