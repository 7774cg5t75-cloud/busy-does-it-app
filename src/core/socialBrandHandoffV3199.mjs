/**
 * V3.199: prepare and revalidate a private Brand DNA caption handoff.
 * Owner controls any replacement of edited text and still has to save/review
 * the existing social draft (with supported media) before any public action.
 */
import {buildContentBrandSnapshot} from "./businessBrandDnaV3195.mjs";
import {prepareBrandedCopyPreview,resolveWordingTreatment} from "./brandedContentDraftV3198.mjs";
import {prepareBusinessContentEnquiry,contentEventSchedule} from "./businessContentRecords.mjs";
const currentSource=(a,b)=>a&&b&&
 a.websiteId===b.websiteId&&a.websiteGeneration===b.websiteGeneration&&
 a.appId===b.appId&&a.appDraftRevision===b.appDraftRevision&&a.approvedProfileSource===b.approvedProfileSource;
function prepareSocialBrandHandoff({website,app,businessId,serviceName="",approvedProfile,sourceMode="",purpose="service",treatment="standard"}={}){
 if(!["service","business-introduction"].includes(purpose)||purpose==="business-introduction"&&serviceName)return {ok:false,reason:"Choose a supported content purpose."};
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile,sourceMode});
 if(!snapshot.ok)return {ok:false,reason:snapshot.reason};
 const matching=serviceName?(snapshot.source.approvedProfileSource?approvedProfile.services:app?.draft_config?.publicProfile?.services||[]).filter(row=>typeof row?.name==='string'&&row.name.trim().toLocaleLowerCase('en')===serviceName.toLocaleLowerCase('en')):[];
 if(serviceName&&matching.length!==1)return {ok:false,reason:"Review the service identity before preparing its post. Duplicate service names cannot be guessed."};
 const copy=prepareBrandedCopyPreview(snapshot,{channel:"social",serviceName,treatment});
 if(!copy.ok)return copy;
 return {...copy,purpose,sourceMode:snapshot.source.approvedProfileSource?"approved-profile":"builders",serviceId:matching[0]?.id||null,kind:"private_social_brand_handoff_v3199",
  notAutomaticallySaved:true,noMediaAttached:true,
  ownerMustReviewBeforeDraftSave:true};
}
// Reads only the original approved projection. Private catalogue drafts never enter copy.
function prepareSocialRecordHandoff({website,app,businessId,approvedProfile,sourceMode="",feed,selection,treatment="standard",now=Date.now()}={}){
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile,sourceMode});
 if(!snapshot.ok)return snapshot;
 if(snapshot.conflicts?.length)return {ok:false,reason:'Choose a consistent current business source before preparing item content.'};
 const interest=prepareBusinessContentEnquiry(feed,businessId,selection,{now});
 if(!interest.ok)return interest;
 const row=feed.records.find(record=>record.id===selection.recordId),data=row.data;
 const option=selection.variantId?data.variants?.find(item=>item.id===selection.variantId):null;
 const appliedTreatment=resolveWordingTreatment(treatment,snapshot.voice?.ownerChosenTone);
 if(!appliedTreatment)return {ok:false,reason:'Choose a supported wording treatment.'};
 const name=snapshot.identity.name,schedule=row.kind==='event'?contentEventSchedule(data,'en-GB'):'',location=row.kind==='event'?data.location:'',link=row.kind==='event'?data.onlineUrl:'';
 let copy=[name,data.name,option?.label,data.description,schedule,location,link,'Ask '+name+' for more information.'].filter(Boolean).join('\n\n');
 if(appliedTreatment==='welcoming')copy=['Find out about '+data.name+' with '+name+'.',option?.label,data.description,schedule,location,link,'Have a question? Ask '+name+' for the details.'].filter(Boolean).join('\n\n');
 if(appliedTreatment==='concise')copy=[name+' · '+data.name,option?.label,data.description,schedule,location,link].filter(Boolean).join('\n');
 if(appliedTreatment==='detailed')copy=[name,'About '+data.name,option?'Selected option: '+option.label:'',data.description,data.category?'Category: '+data.category:'',schedule?'When: '+schedule:'',location?'Where: '+location:'',link?'Event information: '+link:'','For further information, contact '+name+'.'].filter(Boolean).join('\n\n');

 return {ok:true,kind:'private_social_brand_handoff_v3199',purpose:row.kind,treatment,appliedTreatment,ownerChosenTone:snapshot.voice?.ownerChosenTone||null,businessId,copy,source:{...snapshot.source},sourceMode:snapshot.source.approvedProfileSource?'approved-profile':'builders',selection:{...interest.selection},recordStamp:JSON.stringify(row),brandColour:snapshot.design?.primaryColour||null,serviceId:null,serviceName:'',privateOnly:true,requiresOwnerApproval:true,noMediaAttached:true,notAutomaticallySaved:true,ownerMustReviewBeforeDraftSave:true,providerCallsMade:false};
}
function prepareOwnerAnnouncementHandoff({website,app,businessId,approvedProfile,sourceMode='',ownerFacts='',treatment='standard'}={}){
 if(!businessId||typeof ownerFacts!=='string'||!ownerFacts.trim()||ownerFacts.length>3000||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(ownerFacts))return {ok:false,reason:'Add the exact announcement or offer details. Busy will not invent missing terms, dates or prices.'};
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile,sourceMode});
 const appliedTreatment=resolveWordingTreatment(treatment,snapshot.voice?.ownerChosenTone);
 if(!appliedTreatment)return {ok:false,reason:'Choose a supported announcement treatment.'};
 const facts=ownerFacts.trim(),copy=appliedTreatment==='welcoming'?'Hello everyone,\n\n'+facts:appliedTreatment==='detailed'?'Business update\n\n'+facts+'\n\nPlease contact us if you have questions.':facts;
 // Owner-supplied words remain useful without a complete business profile.
 return {ok:true,kind:'private_social_brand_handoff_v3199',purpose:'owner-announcement',treatment,appliedTreatment,businessId,source:snapshot.ok?{...snapshot.source}:{businessId,ownerSuppliedOnly:true},sourceMode:snapshot.source?.approvedProfileSource?'approved-profile':sourceMode,ownerFacts,copy,serviceName:'',serviceId:null,privateOnly:true,requiresOwnerApproval:true,ownerSuppliedNotIndependentlyVerified:true,noMediaAttached:true,providerCallsMade:false};
}
function confirmSocialBrandHandoff({website,app,businessId,evidence,approvedProfile,feed}={}){
 if(!evidence||evidence.ok!==true||
    evidence.kind!=="private_social_brand_handoff_v3199"||
    evidence.businessId!==businessId)
  return {ok:false,reason:"Prepare a current private branded caption first."};
 if(evidence.purpose==='owner-announcement'){
  const fresh=prepareOwnerAnnouncementHandoff({website,app,businessId,approvedProfile,sourceMode:evidence.sourceMode,ownerFacts:evidence.ownerFacts,treatment:evidence.treatment||"standard"});
  return fresh.ok&&JSON.stringify(fresh.source)===JSON.stringify(evidence.source)&&fresh.copy===evidence.copy?fresh:{ok:false,reason:'Review this owner-supplied announcement again.'};
 }
 if(['product','event'].includes(evidence.purpose)){
  const fresh=prepareSocialRecordHandoff({website,app,businessId,approvedProfile,feed,sourceMode:evidence.sourceMode,selection:evidence.selection,treatment:evidence.treatment||"standard"});
  return fresh.ok&&currentSource(fresh.source,evidence.source)&&fresh.recordStamp===evidence.recordStamp&&fresh.copy===evidence.copy?fresh:{ok:false,reason:'This approved item changed. Reload its current information before preparing content.'};
 }
 const fresh=prepareSocialBrandHandoff({website,app,businessId,approvedProfile,sourceMode:evidence.sourceMode,purpose:evidence.purpose||"service",treatment:evidence.treatment||"standard",serviceName:evidence.serviceName||""});
 if(!fresh.ok||!currentSource(fresh.source,evidence.source)||
    fresh.copy!==evidence.copy||fresh.brandColour!==evidence.brandColour||fresh.serviceId!==evidence.serviceId)
  return {ok:false,reason:"Business branding changed. Prepare a new caption before using it."};
 return fresh;
}
export {prepareSocialBrandHandoff,confirmSocialBrandHandoff,prepareSocialRecordHandoff,prepareOwnerAnnouncementHandoff};

// Closed local extension of the original Operator route, never a provider action.
function resolveSocialServiceIntent(text,{website,app,businessId,approvedProfile}={}){
 const request=String(text||'').trim();
 if(!request||request.length>500||/\b(?:do not|don['’]t|never)\s+(?:make|create|write|prepare|advertise|promote|tell)\b/i.test(request))return {handled:false};
 // Advice is not authority to create content; external/public actions stay with original approval routes.
 if(/^(?:how|why|should|what (?:can|should))\b/i.test(request)||/\b(publish|schedule|send|spend|buy|boost)\b/i.test(request))return {handled:false};
 const introduction=/\b(introduc(?:e|ing|tion)|what we do|about (?:my|our|the) business)\b/i.test(request);
 const action=/\b(help|tell|introduce|make|create|write|draft|prepare|advertise|promote|announce)\b/i.test(request);
 const content=/\b(post|caption|facebook|instagram|announcement)\b/i.test(request)||/\b(?:tell (?:our |my |the )?(?:customers|people) about|advertise|promote|write something|prepare something)\b/i.test(request);
 if(!action||!introduction&&!content)return {handled:false};
 const styleRequest=request.includes(':')?request.slice(0,request.indexOf(':')):request;
 const styles=[['welcoming','friendly|welcoming|warm'],['concise','short|concise'],['detailed','informative|detailed|explanatory']].filter(([,words])=>new RegExp('\\b(?:write|make|create|draft|prepare)\\s+(?:(?:me|us)\\s+)?(?:a |an )?(?:'+words+')\\s+(?:(?:facebook|instagram|social)\\s+)?(?:post|caption|introduction|announcement|message|wording|copy)\\b|\\b(?:in|with|using)\\s+(?:a |an )?(?:'+words+')\\s+(?:tone|style)\\b','i').test(styleRequest)).map(([style])=>style);
 if(/\b(?:using|with|in) (?:my|our|the) (?:approved )?brand (?:voice|tone)\b/i.test(styleRequest))styles.push('brand');
 const treatment=styles.length===1?styles[0]:'standard',needsTreatmentSelection=styles.length>1;
 const ownerAnnouncement=/\b(announcement|announce|opening hours|closing|close early|thank[- ]you|thank (?:our|my|the) customers|attending|(?:special|our|my|an|the) offer)\b/i.test(request);
 const recordKind=/\bevents?\b/i.test(request)?'event':/\b(products?|collection)\b/i.test(request)?'product':'';
 const snapshot=buildContentBrandSnapshot({website,app,businessId,approvedProfile});
 const names=snapshot.ok?snapshot.services.map(service=>service.name):[];
 const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const matches=names.filter(name=>new RegExp('(?:^|[^\\p{L}\\p{N}])'+escaped(name)+'(?:$|[^\\p{L}\\p{N}])','iu').test(request));
 const purpose=introduction?'business-introduction':ownerAnnouncement&&(!recordKind||request.includes(':'))?'owner-announcement':matches.length===1?'service':recordKind||'service';
 const ownerFacts=purpose==='owner-announcement'&&request.includes(':')?request.slice(request.indexOf(':')+1).trim():'';
 const serviceName=purpose==='service'&&matches.length===1?matches[0]:'';
 return {handled:true,ownerFacts,purpose,serviceName,treatment,needsTreatmentSelection,needsSelection:['product','event'].includes(purpose)||purpose==='service'&&!serviceName,
  platform:/\bfacebook\b/i.test(request)?'Facebook':/\binstagram\b/i.test(request)?'Instagram':'',
  reason:!snapshot.ok?snapshot.reason:purpose==='business-introduction'?'Review an introduction based on current approved business facts in Content Creator.':purpose==='owner-announcement'?'Supply and review your exact announcement details. Missing dates, hours and offer terms are not invented.':['product','event'].includes(purpose)?'Choose the intended current approved '+purpose+' in Content Creator. New does not establish launch, availability or attendance.':serviceName?'Review the current service wording in Content Creator.':'Choose the intended current service in Content Creator. New does not establish a launch date.'};
}

export {resolveSocialServiceIntent};
