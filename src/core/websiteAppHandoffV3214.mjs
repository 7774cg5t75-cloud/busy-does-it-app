import {websiteDraftHasScope} from './websiteDraftScope.mjs';
/**
 * V3.214 website -> published Business App customer-request HANDOFF.
 * Draft-only, owner-initiated: reuse the existing live mini-app link
 * endpoint rather than inventing a transactional website enquiry form.
 * All facts must originate in the currently owner-scoped Business App view.
 * The public Edge link re-verifies live version & module at click time.
 */
const KIND=["enquiry","booking_request"];
const SLUG=/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const no=(reason)=>({ok:false,reason,ownerApprovalRequired:true,
 publicEnquiryFormInstalled:false,customerRequestCreated:false,
 providerDeliveryVerified:false,published:false});
function canonicalAppLinkEndpoint(value){
 if(typeof value!=="string"||value.length>300)return "";
 try{
  const url=new URL(value);
  const host=url.hostname.toLowerCase();
  if(url.protocol!=="https:"||url.username||url.password||url.port||
     url.search||url.hash||url.pathname!=="/functions/v1/busy-mini-app-link"||
     !/^[a-z0-9-]{6,80}\.supabase\.co$/.test(host))
    return "";
  return url.origin+url.pathname;
 }catch{return "";}
}
function canonicalWebsiteHandoffUrl({
 endpoint="",slug="",kind="",appId="",liveVersionId=""
}={}){
 const base=canonicalAppLinkEndpoint(endpoint);
 if(!base||!SLUG.test(slug)||!KIND.includes(kind))return "";
 if((appId||liveVersionId)&&(!UUID.test(appId)||!UUID.test(liveVersionId)))
  return "";
 const legacy=base+"?slug="+encodeURIComponent(slug)+
  "&source=web&intent="+encodeURIComponent(kind);
 // New V3.215 links are pinned to the EXACT owner-reviewed published app,
 // not a reusable slug. Legacy URL construction remains for offline parsing
 // and recovery but new owner approval ALWAYS includes the immutable IDs.
 return appId&&liveVersionId?
  legacy+"&appId="+encodeURIComponent(appId)+
   "&versionId="+encodeURIComponent(liveVersionId):legacy;
}
function planWebsiteAppRequestHandoff({
 businessId="",website=null,app=null,liveVersion=null,
 catalog=[],endpoint="",kind="enquiry"
}={}){
 if(!KIND.includes(kind))return no("Choose a supported enquiry or booking request.");
 if(!UUID.test(businessId)||!website||typeof website.id!=="string"||
    !website.id||!Number.isSafeInteger(website.generation)||
    website.generation<1||!websiteDraftHasScope(website,businessId))
  return no("Open the current website draft in the correct business workspace.");
 if(!app||app.business_id!==businessId||!UUID.test(app.id)||
    !UUID.test(app.current_live_version_id)||
    !["live","update_pending"].includes(app.status)||
    !liveVersion||liveVersion.id!==app.current_live_version_id||
    liveVersion.mini_app_id!==app.id||
    !["live"].includes(liveVersion.state))
  return no("Publish a Business App version before adding a working customer-request handoff.");
 const key=kind;
 const liveConfig=liveVersion.config;
 if(!liveConfig||!Array.isArray(liveConfig.modules)||
    !liveConfig.modules.some(x=>x?.key===key&&x.enabled===true))
  return no("The currently published Business App does not enable this request action.");
 // Catalog is supplementary owner-scoped evidence: it cannot activate an
 // absent module, or override the immutable live version.
 if(!Array.isArray(catalog)||catalog.length>50||
    !catalog.some(x=>x?.module_key===key&&x.status==="available"&&
      (key!=="booking_request"||
       x.capabilities?.confirmation_required_by_business===true)&&
      (key!=="enquiry"||x.capabilities?.customer_action===true)))
  return no("The owner-scoped Business App feature list does not verify that request action.");
 if(kind==="booking_request"&&
    !Array.isArray(liveConfig.publicProfile?.services))
  return no("Published booking requests need actual owner-authored services.");
 if(kind==="booking_request"&&
    !liveConfig.publicProfile.services.some(x=>typeof x?.name==="string"&&!!x.name.trim()))
  return no("Add real services to the published Business App before linking bookings.");
 const contact=Array.isArray(website.sections)?
  website.sections.find(s=>s?.id==="contact"&&s.enabled!==false):null;
 if(!contact||contact.type!=="contact"||
    !(typeof contact.email==="string"&&contact.email.trim()||
      typeof contact.phone==="string"&&contact.phone.trim()))
  return no("Add real, visible owner-approved contact details to the website before adding a handoff.");
 const url=canonicalWebsiteHandoffUrl({
  endpoint,slug:app.public_slug,kind,
  appId:app.id,liveVersionId:liveVersion.id});
 if(!url)return no("A trusted public Business App HTTPS link is not configured.");
 return {ok:true,kind:"website_app_request_handoff_v3214",
  businessId,websiteId:website.id,websiteGeneration:website.generation,
  appId:app.id,appLiveVersionId:liveVersion.id,
  intent:kind,url,
  label:kind==="enquiry"?"Send an enquiry through BUSY":
   "Request a booking through BUSY",
  contactSectionId:"contact",reviewedOwnerApprovalRequired:true,
  currentAppLiveVersionVerifiedFromOwnerSnapshot:true,
  serverWillRecheckLiveVersionOnVisit:true,
  exactPublishedAppPinnedInLink:true,requiresReapprovalOnAppRepublish:true,
  publicEnquiryFormInstalled:false,bookingConfirmed:false,
  liveWebsiteUpdated:false,customerRequestCreated:false,
  chargedCustomer:false,providerDeliveryVerified:false,
  ownerApprovalRequired:true,published:false,
  explanation:"A website visitor can continue via the existing public Business App link. BUSY will check the latest live app and available action when they click. No website form, saved enquiry or confirmed booking exists until the visitor independently completes the public Business App flow."
 };
}
export {canonicalAppLinkEndpoint,canonicalWebsiteHandoffUrl,
 planWebsiteAppRequestHandoff};
