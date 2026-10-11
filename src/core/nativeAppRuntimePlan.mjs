/**
 * V3.155 optional, separately approved native runtime connection.
 * Producing a private prototype never enables public actions. Only an exact
 * published immutable version and independently approved origin can form a
 * runtime descriptor. The public guest service checks live version AGAIN.
 */
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function publicNativeRuntimePlan({app,version,origin,ownerApproved=false}={}){
 const empty={enabled:false,endpoint:"",slug:"",expectedAppId:"",
  expectedVersionId:"",canCollectPayments:false,ownerApproved:false};
 if(ownerApproved!==true||app?.status!=="live"||
    !UUID.test(app?.id||"")||!UUID.test(version?.id||"")||
    app.current_live_version_id!==version.id||
    version.state!=="live"||version.mini_app_id!==app.id||
    typeof app.public_slug!=="string"||
    !/^[a-z0-9][a-z0-9-]{1,98}$/.test(app.public_slug))
  return {ok:false,reason:"An explicitly approved LIVE immutable app version is required.",
    runtime:empty};
 let url;
 try{url=new URL(origin);}catch{return {ok:false,reason:"Choose an authenticated, registered BUSY service origin.",runtime:empty};}
 // The origin is selected by the server-side trusted deployment environment,
 // never accepted as an arbitrary user-supplied destination.
 if(url.protocol!=="https:"||url.username||url.password||
    url.pathname!=="/"||url.search||url.hash||
    !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)||
    !/^[a-z0-9-]+\.supabase\.co$/.test(url.host))
  return {ok:false,reason:"The public BUSY service origin must be HTTPS and unmodified.",runtime:empty};
 return {ok:true,runtime:{
  enabled:true,endpoint:url.origin+"/functions/v1/busy-mini-app-guest",
  publicWebEndpoint:url.origin+"/functions/v1/busy-mini-app-link",
  slug:app.public_slug,expectedAppId:app.id,expectedVersionId:version.id,
  canCollectPayments:false,ownerApproved:true,liveOnly:true,
  nativeRequestsRequireGuestChallenge:true}};
}
export {publicNativeRuntimePlan};
