/**
 * V3.199: prepare and revalidate a private Brand DNA caption handoff.
 * Owner controls any replacement of edited text and still has to save/review
 * the existing social draft (with supported media) before any public action.
 */
import {buildContentBrandSnapshot} from "./businessBrandDnaV3195.mjs";
import {prepareBrandedCopyPreview} from "./brandedContentDraftV3198.mjs";
const currentSource=(a,b)=>a&&b&&
 a.websiteId===b.websiteId&&a.websiteGeneration===b.websiteGeneration&&
 a.appId===b.appId&&a.appDraftRevision===b.appDraftRevision&&a.approvedProfileSource===b.approvedProfileSource;
function prepareSocialBrandHandoff({website,app,businessId,serviceName="",approvedProfile}={}){
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile});
 if(!snapshot.ok)return {ok:false,reason:snapshot.reason};
 const matching=serviceName?(snapshot.source.approvedProfileSource?approvedProfile.services:app?.draft_config?.publicProfile?.services||[]).filter(row=>typeof row?.name==='string'&&row.name.trim().toLocaleLowerCase('en')===serviceName.toLocaleLowerCase('en')):[];
 if(serviceName&&matching.length!==1)return {ok:false,reason:"Review the service identity before preparing its post. Duplicate service names cannot be guessed."};
 const copy=prepareBrandedCopyPreview(snapshot,{channel:"social",serviceName});
 if(!copy.ok)return copy;
 return {...copy,serviceId:matching[0]?.id||null,kind:"private_social_brand_handoff_v3199",
  notAutomaticallySaved:true,noMediaAttached:true,
  ownerMustReviewBeforeDraftSave:true};
}
function confirmSocialBrandHandoff({website,app,businessId,evidence,approvedProfile}={}){
 if(!evidence||evidence.ok!==true||
    evidence.kind!=="private_social_brand_handoff_v3199"||
    evidence.businessId!==businessId)
  return {ok:false,reason:"Prepare a current private branded caption first."};
 const fresh=prepareSocialBrandHandoff({website,app,businessId,approvedProfile,serviceName:evidence.serviceName||""});
 if(!fresh.ok||!currentSource(fresh.source,evidence.source)||
    fresh.copy!==evidence.copy||fresh.brandColour!==evidence.brandColour||fresh.serviceId!==evidence.serviceId)
  return {ok:false,reason:"Business branding changed. Prepare a new caption before using it."};
 return fresh;
}
export {prepareSocialBrandHandoff,confirmSocialBrandHandoff};

// Closed local extension of the original Operator route, never a provider action.
function resolveSocialServiceIntent(text,{website,app,businessId,approvedProfile}={}){
 const request=String(text||'').trim();
 if(request.length>500||! /\b(make|create|write|draft|prepare)\b/i.test(request)||! /\b(post|caption)\b/i.test(request))return {handled:false};
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile});
 const names=snapshot.ok?snapshot.services.map(service=>service.name):[];
 const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const matches=names.filter(name=>new RegExp('(?:^|[^\\p{L}\\p{N}])'+escaped(name)+'(?:$|[^\\p{L}\\p{N}])','iu').test(request));
 return {handled:true,serviceName:matches.length===1?matches[0]:'',needsSelection:matches.length!==1,
  platform:/\bfacebook\b/i.test(request)?'Facebook':/\binstagram\b/i.test(request)?'Instagram':'',
  reason:!snapshot.ok?snapshot.reason:matches.length===1?'Review the current service wording in Content Creator.':'Choose the intended current service in Content Creator. “New” does not establish a launch date.'};
}
export {resolveSocialServiceIntent};
