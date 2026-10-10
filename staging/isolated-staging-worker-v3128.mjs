/**
 * V3.128 deployable (not deployed) isolated staging hostname marker.
 * No project secrets or customer content. This intentionally does NOT proxy
 * Supabase, support website publishing, or serve a live application.
 * A passing health response only proves that the marker was routed.
 */
const REF=/^[a-z]{20}$/;
const SHA=/^[0-9a-f]{40}$/i;
const HEADERS={"Content-Type":"application/json; charset=utf-8",
 "Cache-Control":"private, no-store, max-age=0",
 "X-Robots-Tag":"noindex, nofollow, noarchive",
 "X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"};
function healthBoundary(env={},url){
 const stage=env.BUSY_STAGING_SUPABASE_REF||"",
 prod=env.BUSY_PRODUCTION_SUPABASE_REF||"",
 another=env.BUSY_OTHER_PROTECTED_SUPABASE_REF||"",
 expectedHost=env.BUSY_STAGING_EXPECTED_HOST||"",
 sha=env.BUSY_STAGING_SOURCE_SHA||"";
 return REF.test(stage)&&REF.test(prod)&&REF.test(another)&&
  new Set([stage,prod,another]).size===3&&
  SHA.test(sha)&&
  typeof expectedHost==="string"&&
  /^[a-z0-9][a-z0-9.-]{3,125}$/.test(expectedHost)&&
  !["busydoesit.co.uk","sites.busydoesit.co.uk"].includes(expectedHost)&&
  url.protocol==="https:"&&url.hostname===expectedHost&&
  !url.username&&!url.password&&!url.port;
}
export default {
 async fetch(request,env){
  const fail=(code)=>new Response(JSON.stringify({status:"unavailable"}),
   {status:code,headers:HEADERS});
  if(request.method!=="GET"&&request.method!=="HEAD")return fail(405);
  let url;
  try{url=new URL(request.url);}catch{return fail(400);}
  if(!healthBoundary(env,url))return fail(503);
  if(url.pathname!=="/__busy_staging/health"||url.search||url.hash)
   return fail(404);
  const body=JSON.stringify({status:"marker-ready",environment:"isolated-staging",
   sourceCommit:env.BUSY_STAGING_SOURCE_SHA,
   cloudAuthenticationVerified:false,
   websitePublishingReady:false,customerPilotReady:false});
  return new Response(request.method==="HEAD"?null:body,
    {status:200,headers:HEADERS});
 }
};
export {healthBoundary};
