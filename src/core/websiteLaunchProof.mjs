/** V3.80 read-only delivery proof. It does not publish, configure DNS, charge, or
 * grant approvals. Never equate a queued publish job or CDN storage URL to a
 * proven HTTPS customer-facing site.
 */
const HOST=/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.busydoesit\.co\.uk$/;
function exactBusyHost(url){
  if(typeof url!=="string"||url.length>240)return "";
  try{
    const parsed=new URL(url);
    return parsed.protocol==="https:"&&!parsed.username&&!parsed.password&&
      !parsed.port&&HOST.test(parsed.hostname)?parsed.hostname:"";
  }catch{return "";}
}
function buildWebsiteLaunchProof(view={}){
  const website=view.website||null;
  const hosted=view.previewDeployment||null;
  const live=view.liveDeployment||null;
  const domain=view.providerState||{};
  const host=exactBusyHost(website?.default_url||"");
  const immutablePreview=!!hosted?.id&&hosted?.state==="preview_ready"&&
    !!hosted?.content_hash&&!!hosted?.preview_storage_path;
  const approved=!!live?.id&&!!live?.published_at&&!!live?.public_storage_path&&
    website?.current_live_deployment_id===live.id;
  const evidenceFresh=(()=>{
    const current=Date.parse(website?.last_health_check_at||"");
    return Number.isFinite(current)&&current<=Date.now()&&
      Date.now()-current<=48*3600000;
  })();
  const liveMatched=approved&&website?.health_status==="healthy"&&
    website?.last_observed_deployment_id===live.id&&
    website?.last_healthy_at===website?.last_health_check_at&&evidenceFresh;
  const domainMatched=!!host&&domain.activationReady===true&&
    website?.delivery_status==="active"&&
    view.defaultDomainHealth?.status==="healthy"&&
    view.defaultDomainHealth?.observed_deployment_id===live?.id;
  const checks=[
    {id:"editor",label:"Editable customer website draft",
      ready:!!view.websiteDraftPresent||!!view.draftChangedSinceHosted||
        !!hosted||!!live,detail:"Private draft or prior website version"},
    {id:"preview",label:"Immutable hosted version available",
      ready:immutablePreview||approved,
      detail:"The hosted file must be prepared, not merely a phone preview"},
    {id:"approval",label:"Owner-approved public version recorded",
      ready:approved,detail:"No public changes before explicit owner Go Live"},
    {id:"cloudflare",label:"BUSY default-domain infrastructure ready",
      ready:domain.activationReady===true,
      detail:"A configured provider is not proof that the site is reachable"},
    {id:"https",label:"Canonical BUSY HTTPS address allocated",
      ready:!!host,detail:"Only one-label subdomains of busydoesit.co.uk"},
    {id:"public",label:"Live deployment passed a matching health probe",
      ready:!!liveMatched,detail:"Fresh observed version matches approved live version"},
    {id:"domain",label:"Default domain has matching healthy public delivery",
      ready:!!domainMatched,detail:"Real public HTTPS domain check, not a storage URL"}
  ];
  return {
    checks,
    passed:checks.filter(c=>c.ready).length,
    total:checks.length,
    verified:approved&&liveMatched&&domainMatched,
    hasDraft:checks[0].ready,
    hostname:host||null,
    publicRootWebsiteVerified:false,
    founderMarketingSitePublished:false,
    publicPublishingTriggered:false,
    note:"Read-only evidence about this business website. This does not verify the separate BUSY headquarters at busydoesit.co.uk. Never treat an internal preview or a queued job as proof of public delivery."
  };
}
export {exactBusyHost,buildWebsiteLaunchProof};
