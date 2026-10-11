/**
 * V3.155 native public Business App client: only a matched, LIVE owner-approved
 * version can be displayed or receive a guest request. Never store any
 * service-role credential, developer key, customer data or owner token here.
 */
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const slugOk=s=>typeof s==="string"&&/^[a-z0-9][a-z0-9-]{1,98}$/.test(s);
function verifiedPublicRuntime(runtime){
 if(!runtime||runtime.enabled!==true||runtime.ownerApproved!==true||
  runtime.liveOnly!==true||runtime.canCollectPayments!==false||
  !slugOk(runtime.slug)||!UUID.test(runtime.expectedAppId||"")||
  !UUID.test(runtime.expectedVersionId||""))
  return false;
 try{
  const api=new URL(runtime.endpoint),link=new URL(runtime.publicWebEndpoint);
  return api.protocol==="https:"&&link.protocol==="https:"&&
   api.origin===link.origin&&/^[a-z0-9-]+\.supabase\.co$/.test(api.hostname)&&
   !api.username&&!api.password&&!api.search&&!api.hash&&
   api.pathname==="/functions/v1/busy-mini-app-guest"&&
   link.pathname==="/functions/v1/busy-mini-app-link"&&
   !link.search&&!link.hash;
 }catch{return false;}
}
function validPublicRead(payload,runtime){
 if(!verifiedPublicRuntime(runtime)||payload?.ok!==true||
  payload.kind!=="public_native_app_v1"||
  payload.appId!==runtime.expectedAppId||
  payload.versionId!==runtime.expectedVersionId||
  payload.slug!==runtime.slug||
  !Array.isArray(payload.moduleKeys)||!payload.moduleKeys.includes("business_profile")||
  payload.chargesEnabled!==false||payload.doesNotConfirmAppointments!==true)
  return false;
 return true;
}
async function publicNativeApp(runtime,fetcher=fetch){
 if(!verifiedPublicRuntime(runtime))return {ok:false,reason:"This standalone app is not connected to a verified live Business App."};
 try{
  const response=await fetcher(runtime.endpoint,{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({action:"public_app",slug:runtime.slug,
    expectedAppId:runtime.expectedAppId,expectedVersionId:runtime.expectedVersionId})
  });
  const data=await response.json();
  if(!response.ok||!validPublicRead(data,runtime))
   throw Error("The approved public Business App version is not available.");
  return {ok:true,app:data};
 }catch{
  return {ok:false,reason:"The verified public app could not be loaded. Please try again later."};
 }
}
function secureGuestRequestLink(runtime,type){
 if(!verifiedPublicRuntime(runtime)||!["enquiry","booking_request"].includes(type))
  return {ok:false,reason:"That public app request is not available."};
 const url=new URL(runtime.publicWebEndpoint);
 url.searchParams.set("slug",runtime.slug);
 url.searchParams.set("source","web");
 url.searchParams.set("intent",type);
 return {ok:true,url:url.toString(),note:"The public BUSY guest request service verifies the request. A booking request is not a confirmed appointment."};
}
export {verifiedPublicRuntime,validPublicRead,publicNativeApp,secureGuestRequestLink};
