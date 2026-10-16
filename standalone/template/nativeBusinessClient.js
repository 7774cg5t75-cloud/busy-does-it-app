import {validContentLayout,validPublicBusinessContent} from './businessContentRecords.mjs';
import {validServiceDetails} from './publicServiceDetails.mjs';
import {validPublicCollection} from './appPublicCollections.mjs';
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
const safePublicText=(v,max)=>typeof v==="string"&&v.length<=max&&
 !/[<>\u0000-\u001f\u007f]/.test(v);
function validNativeExtras(payload){
 if(!Array.isArray(payload?.offers)||payload.offers.length>12||
   payload.offers.some(o=>!o||!safePublicText(o.title,140)||!o.title.trim()||
    !safePublicText(o.body,700)||!safePublicText(o.terms,800)||
    !o.terms.trim()||!safePublicText(o.startDate,10)||
    !safePublicText(o.endDate,10)))return false;
 const l=payload.loyalty;
 if(l!==null&&(!l||typeof l!=="object"||Array.isArray(l)||
  !safePublicText(l.programName,120)||!l.programName.trim()||
  !safePublicText(l.reward,300)||!l.reward.trim()||
  !safePublicText(l.terms,700)||!l.terms.trim()||
  !Number.isSafeInteger(l.targetStamps)||l.targetStamps<1||l.targetStamps>1000||
  l.personalBalanceAvailable!==false||l.redemptionEnabled!==false))return false;
 if(payload.offers.length>0&&!payload.moduleKeys?.includes("offers")||
  l!==null&&!payload.moduleKeys?.includes("loyalty"))return false;
 return true;
}
function safeNativeImageUrl(value){
 if(typeof value!=="string"||value.length>1800||
   /[\s<>\u0000-\u001f\u007f]/.test(value))return false;
 try{
  const u=new URL(value);
  return u.protocol==="https:"&&!!u.hostname&&!u.username&&!u.password&&
   !u.hash&&!u.port;
 }catch{return false;}
}
function validPublicGallery(payload){
 if(!Array.isArray(payload?.gallery)||payload.gallery.length>15)return false;
 return payload.gallery.every(photo=>photo&&typeof photo==="object"&&
   typeof photo.uri==="string"&&photo.uri.length<=1800&&
   safeNativeImageUrl(photo.uri)&&
   safePublicText(photo.alt,160)&&safePublicText(photo.caption,240));
}
function validPublicRead(payload,runtime){
 if(!verifiedPublicRuntime(runtime)||payload?.ok!==true||
  payload.kind!=="public_native_app_v1"||
  payload.appId!==runtime.expectedAppId||
  payload.versionId!==runtime.expectedVersionId||
  payload.slug!==runtime.slug||
  !Array.isArray(payload.moduleKeys)||!payload.moduleKeys.includes("business_profile")||
  payload.chargesEnabled!==false||payload.doesNotConfirmAppointments!==true||
  (payload.faqs!==undefined&&!validPublicCollection('faqs',payload.faqs))||
  (payload.testimonials!==undefined&&!validPublicCollection('testimonials',payload.testimonials))||
  (!Array.isArray(payload.services)||payload.services.length>40||payload.services.some(s=>!validServiceDetails(s)))||
  (payload.contentLayout!==undefined&&!validContentLayout(payload.contentLayout))||
  (payload.businessContent!==undefined&&payload.businessContent!==null&&!validPublicBusinessContent(payload.businessContent))||
  !validNativeExtras(payload)||!validPublicGallery(payload))
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
