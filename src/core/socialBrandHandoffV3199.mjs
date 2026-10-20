/**
 * V3.199: prepare and revalidate a private Brand DNA caption handoff.
 * Owner controls any replacement of edited text and still has to save/review
 * the existing social draft (with supported media) before any public action.
 */
import {buildContentBrandSnapshot} from "./businessBrandDnaV3195.mjs";
import {prepareBrandedCopyPreview} from "./brandedContentDraftV3198.mjs";
import {prepareBusinessContentEnquiry,contentEventSchedule} from "./businessContentRecords.mjs";
const currentSource=(a,b)=>a&&b&&
 a.websiteId===b.websiteId&&a.websiteGeneration===b.websiteGeneration&&
 a.appId===b.appId&&a.appDraftRevision===b.appDraftRevision&&a.approvedProfileSource===b.approvedProfileSource;
function prepareSocialBrandHandoff({website,app,businessId,serviceName="",approvedProfile,sourceMode="",purpose="service"}={}){
 if(!["service","business-introduction"].includes(purpose)||purpose==="business-introduction"&&serviceName)return {ok:false,reason:"Choose a supported content purpose."};
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile,sourceMode});
 if(!snapshot.ok)return {ok:false,reason:snapshot.reason};
 const matching=serviceName?(snapshot.source.approvedProfileSource?approvedProfile.services:app?.draft_config?.publicProfile?.services||[]).filter(row=>typeof row?.name==='string'&&row.name.trim().toLocaleLowerCase('en')===serviceName.toLocaleLowerCase('en')):[];
 if(serviceName&&matching.length!==1)return {ok:false,reason:"Review the service identity before preparing its post. Duplicate service names cannot be guessed."};
 const copy=prepareBrandedCopyPreview(snapshot,{channel:"social",serviceName});
 if(!copy.ok)return copy;
 return {...copy,purpose,sourceMode:snapshot.source.approvedProfileSource?"approved-profile":"builders",serviceId:matching[0]?.id||null,kind:"private_social_brand_handoff_v3199",
  notAutomaticallySaved:true,noMediaAttached:true,
  ownerMustReviewBeforeDraftSave:true};
}
// Reads only the original approved projection. Private catalogue drafts never enter copy.
function prepareSocialRecordHandoff({website,app,businessId,approvedProfile,sourceMode="",feed,selection,now=Date.now()}={}){
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile,sourceMode});
 if(!snapshot.ok)return snapshot;
 const interest=prepareBusinessContentEnquiry(feed,businessId,selection,{now});
 if(!interest.ok)return interest;
 const row=feed.records.find(record=>record.id===selection.recordId),data=row.data;
 const option=selection.variantId?data.variants?.find(item=>item.id===selection.variantId):null;
 const copy=[snapshot.identity.name,data.name,option?.label,data.description,row.kind==='event'?contentEventSchedule(data,'en-GB'):'',row.kind==='event'?data.location:'','Ask '+snapshot.identity.name+' for more information.'].filter(Boolean).join('\n\n');
 return {ok:true,kind:'private_social_brand_handoff_v3199',purpose:row.kind,businessId,copy,source:{...snapshot.source},sourceMode:snapshot.source.approvedProfileSource?'approved-profile':'builders',selection:{...interest.selection},recordStamp:JSON.stringify(row),brandColour:snapshot.design?.primaryColour||null,serviceId:null,serviceName:'',privateOnly:true,requiresOwnerApproval:true,noMediaAttached:true,notAutomaticallySaved:true,ownerMustReviewBeforeDraftSave:true,providerCallsMade:false};
}
function confirmSocialBrandHandoff({website,app,businessId,evidence,approvedProfile,feed}={}){
 if(!evidence||evidence.ok!==true||
    evidence.kind!=="private_social_brand_handoff_v3199"||
    evidence.businessId!==businessId)
  return {ok:false,reason:"Prepare a current private branded caption first."};
 if(['product','event'].includes(evidence.purpose)){
  const fresh=prepareSocialRecordHandoff({website,app,businessId,approvedProfile,feed,sourceMode:evidence.sourceMode,selection:evidence.selection});
  return fresh.ok&&currentSource(fresh.source,evidence.source)&&fresh.recordStamp===evidence.recordStamp&&fresh.copy===evidence.copy?fresh:{ok:false,reason:'This approved item changed. Reload its current information before preparing content.'};
 }
 const fresh=prepareSocialBrandHandoff({website,app,businessId,approvedProfile,sourceMode:evidence.sourceMode,purpose:evidence.purpose||"service",serviceName:evidence.serviceName||""});
 if(!fresh.ok||!currentSource(fresh.source,evidence.source)||
    fresh.copy!==evidence.copy||fresh.brandColour!==evidence.brandColour||fresh.serviceId!==evidence.serviceId)
  return {ok:false,reason:"Business branding changed. Prepare a new caption before using it."};
 return fresh;
}
export {prepareSocialBrandHandoff,confirmSocialBrandHandoff,prepareSocialRecordHandoff};

// Closed local extension of the original Operator route, never a provider action.
function resolveSocialServiceIntent(text,{website,app,businessId,approvedProfile}={}){
 const request=String(text||'').trim();
 if(request.length>500||! /\b(make|create|write|draft|prepare)\b/i.test(request)||! /\b(post|caption)\b/i.test(request))return {handled:false};
 const recordKind=/\bevents?\b/i.test(request)?'event':/\bproducts?|collection\b/i.test(request)?'product':'';
 const introduction=/\b(introduc(?:e|ing|tion)|what we do|about (?:my|our|the) business)\b/i.test(request);
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile});
 const names=snapshot.ok?snapshot.services.map(service=>service.name):[];
 const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const matches=names.filter(name=>new RegExp('(?:^|[^\\p{L}\\p{N}])'+escaped(name)+'(?:$|[^\\p{L}\\p{N}])','iu').test(request));
 return {handled:true,purpose:recordKind|| (introduction?'business-introduction':'service'),serviceName:!introduction&&matches.length===1?matches[0]:'',needsSelection:!!recordKind||!introduction&&matches.length!==1,
  platform:/\bfacebook\b/i.test(request)?'Facebook':/\binstagram\b/i.test(request)?'Instagram':'',
  reason:!snapshot.ok?snapshot.reason:introduction?'Review an introduction based on current approved business facts in Content Creator.':matches.length===1?'Review the current service wording in Content Creator.':'Choose the intended current service in Content Creator. “New” does not establish a launch date.'};
}
export {resolveSocialServiceIntent};
