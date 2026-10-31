import {publicNavigationLabels} from './appNavigationLabels.mjs';
/**
 * V3.153 finite shared runtime-schema for Business Apps, without generated
 * executable code. The Marketplace uses controlled modules today; a future
 * standalone native shell can consume the same approved app configuration.
 *
 * Never claim a booking is confirmed, enable a payment module, invent content
 * or expose owner/customer data through an unbounded component schema.
 */
import {orderedAppModules} from "./appSectionOrder.mjs";
const SUPPORTED=Object.freeze({
 business_profile:{component:"BusinessIdentity",publicRead:true},
 services:{component:"ServiceList",publicRead:true},
 gallery:{component:"ApprovedGallery",publicRead:true},
 contact:{component:"PublicContact",publicRead:true},
 enquiry:{component:"CustomerEnquiryRequest",requiresOwnerReply:true},
 booking_request:{component:"CustomerBookingRequest",requiresBusinessConfirmation:true},
 offers:{component:"ApprovedOffers",requiresApprovedTerms:true},
 loyalty:{component:"OwnerApprovedLoyalty",requiresServerVerification:true}
});
function appRuntimeScreenSchema(config={},catalog=[]){
 if(!config||typeof config!=="object"||!Array.isArray(config.modules)||!Array.isArray(catalog))
  return {ok:false,reason:"Use a real supported Business App configuration."};
 const available=new Map(catalog.filter(row=>row?.status==="available"&&
   typeof row.module_key==="string").map(row=>[row.module_key,row]));
 const screens=[],seen=new Set();
 for(const m of orderedAppModules(config)){
  if(m?.enabled!==true)continue;
  if(typeof m.key!=="string"||!SUPPORTED[m.key]||
     !available.has(m.key)||seen.has(m.key))
   return {ok:false,reason:"An unsupported, duplicate, or unavailable app module was enabled."};
  if(m.key==="offers"&&!(Array.isArray(config.offers)&&
    config.offers.some(o=>o?.approved===true)))
   return {ok:false,reason:"Offers require explicitly approved owner terms."};
  const capability=SUPPORTED[m.key];
  const provider=available.get(m.key);
  if(m.key==="booking_request"&&
     provider.capabilities?.confirmation_required_by_business!==true)
   return {ok:false,reason:"The booking module must preserve business confirmation."};
  if(m.key==="enquiry"&&provider.capabilities?.customer_action!==true)
   return {ok:false,reason:"The enquiry module needs a verified request backend."};
  seen.add(m.key);
  screens.push({key:m.key,component:capability.component,
   title:publicNavigationLabels(config)[m.key]||String(provider.title||m.key).slice(0,85),
   publicRead:capability.publicRead===true,
   customerRequest:["enquiry","booking_request"].includes(m.key),
   requiresBusinessConfirmation:capability.requiresBusinessConfirmation===true,
   confirmationAutomatic:false,chargesCustomer:false});
 }
 if(!screens.some(s=>s.key==="business_profile"))
  return {ok:false,reason:"An approved public business profile is required."};
 const navigation=screens.map(s=>({id:s.key,label:s.title,screen:s.component}));
 return {ok:true,version:1,navigation,screens,
  allowedTargets:["busy_marketplace","future_native_shell"],
  noArbitraryCode:true,confirmationNeverAutomatic:true,
  paymentCollectionNotEnabled:true,ownerReviewRequired:true};
}
export {SUPPORTED,appRuntimeScreenSchema};
