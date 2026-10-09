/** V3.79: fail-closed visitor enquiry intake decisions. */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HOST=/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.busydoesit\.co\.uk$/;
function expectedSiteOrigin(site){
  const hostname=site?.default_hostname;
  return typeof hostname==="string"&&hostname.length<96&&HOST.test(hostname)
    ?"https://"+hostname:null;
}
function formReadiness(site,{globalEnabled=false,hasSecret=false,nowISO=""}={}){
  const origin=expectedSiteOrigin(site);
  const checked=Date.parse(site?.last_health_check_at||"");
  const now=Date.parse(nowISO||new Date().toISOString());
  const fresh=Number.isFinite(checked)&&Number.isFinite(now)&&
    checked<=now&&now-checked<=48*3600000;
  const verifiedHealth=fresh&&site?.health_status==="healthy"&&
    site?.delivery_status==="active"&&
    site?.last_observed_deployment_id===site?.current_live_deployment_id&&
    site?.last_healthy_at===site?.last_health_check_at;
  const ready=globalEnabled===true&&hasSecret===true&&verifiedHealth&&
    site?.public_form_enabled===true&&
    typeof site?.id==="string"&&UUID.test(site.id)&&
    typeof site?.business_id==="string"&&UUID.test(site.business_id)&&
    typeof site?.current_live_deployment_id==="string"&&UUID.test(site.current_live_deployment_id)&&
    !!origin;
  return {ready,expectedOrigin:origin,requiresChallenge:true,
    requiresLiveWebsite:true,requiresFreshMatchingHealth:true,automaticMessages:false,
    status:ready?"configured":"disabled_or_unverified"};
}
function cleanPublicSubmission(body){
  if(!body||typeof body!=="object"||Array.isArray(body))return null;
  const fields=["siteId","idempotencyKey","name","contactMethod","contactValue",
    "service","notes","contactPermissionConfirmed","turnstileToken","trap"];
  if(Object.keys(body).some(k=>!fields.includes(k)))return null;
  if(typeof body.siteId!=="string"||!UUID.test(body.siteId))return null;
  if(typeof body.turnstileToken!=="string"||body.turnstileToken.length<10||
     body.turnstileToken.length>2048)return null;
  if(body.trap!==undefined&&body.trap!=="")return null;
  return body;
}
function verifiedChallenge(result,hostname){
  return result?.success===true&&result?.action==="busy_website_enquiry"&&
    result?.hostname===hostname;
}
export {expectedSiteOrigin,formReadiness,cleanPublicSubmission,verifiedChallenge};
