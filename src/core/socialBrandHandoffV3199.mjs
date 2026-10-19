/**
 * V3.199: prepare and revalidate a private Brand DNA caption handoff.
 * Owner controls any replacement of edited text and still has to save/review
 * the existing social draft (with supported media) before any public action.
 */
import {buildBusinessBrandDnaSnapshot} from "./businessBrandDnaV3195.mjs";
import {prepareBrandedCopyPreview} from "./brandedContentDraftV3198.mjs";
const currentSource=(a,b)=>a&&b&&
 a.websiteId===b.websiteId&&a.websiteGeneration===b.websiteGeneration&&
 a.appId===b.appId&&a.appDraftRevision===b.appDraftRevision;
function prepareSocialBrandHandoff({website,app,businessId,serviceName=""}={}){
 const snapshot=buildBusinessBrandDnaSnapshot({website,app,businessId});
 if(!snapshot.ok)return {ok:false,reason:snapshot.reason};
 const copy=prepareBrandedCopyPreview(snapshot,{channel:"social",serviceName});
 if(!copy.ok)return copy;
 return {...copy,kind:"private_social_brand_handoff_v3199",
  notAutomaticallySaved:true,noMediaAttached:true,
  ownerMustReviewBeforeDraftSave:true};
}
function confirmSocialBrandHandoff({website,app,businessId,evidence}={}){
 if(!evidence||evidence.ok!==true||
    evidence.kind!=="private_social_brand_handoff_v3199"||
    evidence.businessId!==businessId)
  return {ok:false,reason:"Prepare a current private branded caption first."};
 const fresh=prepareSocialBrandHandoff({website,app,businessId,serviceName:evidence.serviceName||""});
 if(!fresh.ok||!currentSource(fresh.source,evidence.source)||
    fresh.copy!==evidence.copy||fresh.brandColour!==evidence.brandColour)
  return {ok:false,reason:"Business branding changed. Prepare a new caption before using it."};
 return fresh;
}
export {prepareSocialBrandHandoff,confirmSocialBrandHandoff};
