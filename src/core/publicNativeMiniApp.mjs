import {publicServiceDetails} from './publicServiceDetails.mjs';
import {publicCollection} from './appPublicCollections.mjs';
/**
 * V3.155 public native Business App projection.
 *
 * This projection happens ONLY after a service-role lookup proved the app
 * is LIVE and the requested immutable live version matches. NEVER return
 * raw preview config, owner auth, customer records, app secrets, draft plans,
 * contact notes, provider tokens or internal tenant state to a native client.
 */
const str=(v,max=200)=>typeof v==="string"?v.trim().slice(0,max):"";
const safeUrl=v=>typeof v==="string"&&v.length<=1800&&/^https:\/\//i.test(v)?v:"";
const validSlug=s=>typeof s==="string"&&/^[a-z0-9][a-z0-9-]{1,98}$/.test(s);
const PUBLIC_MODULES=new Set(["business_profile","services","gallery","contact","enquiry","booking_request"]);
function publicNativeMiniAppProjection(app,version,{expectedAppId,expectedVersionId}={}){
 if(!app||!version||!["live","update_pending"].includes(app.status)||app.status==="update_pending"&&version.state!=="live"||
  app.id!==expectedAppId||version.id!==expectedVersionId||
  app.current_live_version_id!==version.id||!validSlug(app.public_slug)||
  !version.config||typeof version.config!=="object")
  return {ok:false,reason:"This app version is not publicly available."};
 const config=version.config,profile=config.publicProfile||{};
 const moduleKeys=(Array.isArray(config.modules)?config.modules:[])
  .filter(m=>m?.enabled===true&&PUBLIC_MODULES.has(m.key))
  .map(m=>m.key);
 if(!moduleKeys.includes("business_profile"))
  return {ok:false,reason:"The business profile is not public."};
 const has=key=>moduleKeys.includes(key);
 const services=has("services")&&Array.isArray(profile.services)?
  profile.services.slice(0,40).map(s=>({
    name:str(s?.name,120),description:str(s?.description,600),...publicServiceDetails(s)
  })).filter(s=>s.name):[];
 const gallery=has("gallery")&&Array.isArray(profile.assets?.gallery)?
  profile.assets.gallery.filter(x=>x?.approved===true||x?.marketingOk===true)
   .map(x=>({uri:safeUrl(x?.uri)})).filter(x=>x.uri).slice(0,15):[];
 const contact=has("contact")?{
  phone:str(profile.contact?.phone,80),email:str(profile.contact?.email,180),
  openingHours:str(profile.contact?.openingHours,260)
 }:null;
 const result={ok:true,kind:"public_native_app_v1",
  appId:app.id,versionId:version.id,slug:app.public_slug,
  title:str(config.display?.name||profile.businessName||app.display_name,120),
  tagline:str(config.display?.tagline||profile.tagline,260),
  about:str(profile.about||profile.description,1200),
  faqs:publicCollection('faqs',profile.faqs||[]),testimonials:publicCollection('testimonials',profile.testimonials||[]),
  services,gallery,contact,moduleKeys,
  heroUrl:safeUrl(profile.assets?.hero?.uri),
  supportsEnquiry:has("enquiry"),supportsBookingRequest:has("booking_request"),
  bookingsAlwaysRequireBusinessConfirmation:true,
  chargesEnabled:false,doesNotConfirmAppointments:true};
 return result;
}
export {PUBLIC_MODULES,validSlug,publicNativeMiniAppProjection};
