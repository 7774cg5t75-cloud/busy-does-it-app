/**
 * V3.198: real, deterministic, private brand-aware COPY previews for three
 * channels. This is deliberately not an AI-provider call, image generation,
 * ad campaign, social posting or approval to use third-party media.
 * All included facts originate in the current owner-readable Brand DNA.
 */
import {planBrandDnaContentBrief} from "./businessBrandDnaV3195.mjs";
const SUPPORTED=Object.freeze(["social","poster","advert"]);
const WORDING_TREATMENTS=Object.freeze(["standard","welcoming","concise","detailed","brand"]);
function resolveWordingTreatment(treatment,voice){
 if(!WORDING_TREATMENTS.includes(treatment))return null;
 return treatment==='brand'?(['warm','playful'].includes(voice)?'welcoming':voice==='direct'?'concise':voice?'detailed':'standard'):treatment;
}
const short=(v,max)=>typeof v==="string"&&v.length<=max&&
 !/[<>\u0000-\u001f\u007f]/.test(v)?v.trim():"";
function prepareBrandedCopyPreview(snapshot,{channel="social",serviceName="",treatment="standard"}={}){
 if(!WORDING_TREATMENTS.includes(treatment))return {ok:false,reason:"Choose a supported wording treatment."};
 if(!SUPPORTED.includes(channel))
  return {ok:false,reason:"Choose social post, poster or advert for a text draft."};
 const brief=planBrandDnaContentBrief(snapshot,{channel,
  goal:"Prepare factual brand-matched copy for an owner-reviewed draft"});
 if(!brief.ok)return brief;
 if(snapshot.conflicts.length)
  return {ok:false,reason:"Resolve the website and app brand differences before preparing shared branded copy.",
   conflicts:[...snapshot.conflicts],requiresOwnerReview:true};
 const name=short(brief.businessName,140);
 const tagline=short(brief.tagline,220);
 const about=short(brief.about,900);
 const selected=serviceName?brief.services.find(service=>service.name===serviceName):null;
 if(serviceName&&!selected)return {ok:false,reason:"Choose a current approved service before preparing its post."};
 const names=(selected?[selected]:brief.services.slice(0,3)).map(s=>short(s.name,120)).filter(Boolean);
 if(!name)return {ok:false,reason:"Add an owner-approved business name."};
 if(!tagline&&!about&&!names.length)
  return {ok:false,reason:"Add a brand description or approved services before preparing meaningful copy."};
 const serviceCopy=selected?[name,short(selected.name,120),short(selected.description,500),'Ask '+name+' for more information.'].filter(Boolean).join('\n\n'):null;
 let copy=(channel==='social'?serviceCopy:null)|| (channel==="social"?
  [name,tagline,about,names.length?"Services: "+names.join(" • "):"",
   "Find out more about "+name+"."].filter(Boolean).join("\n\n"):
  channel==="poster"?
  [name.toUpperCase(),tagline,about,names.length?"Services: "+names.join(" • "):"",
   "Ask us for more information."].filter(Boolean).join("\n\n"):
  [name,tagline,about,names.length?"Explore: "+names.join(" • "):"",
   "Learn more about "+name+"."].filter(Boolean).join("\n\n"));
 const appliedTreatment=resolveWordingTreatment(treatment,brief.voice);
 let includedServiceCount=names.length;
 if(appliedTreatment!=='standard'){
  const description=selected?short(selected.description,500):about;
  const details=selected?[]:brief.services.map(service=>[short(service.name,120),short(service.description,500)].filter(Boolean).join(' — '));
  const subject=selected?short(selected.name,120):name;
  if(appliedTreatment==='welcoming')copy=[selected?'Get to know '+subject+' at '+name+'.':'Meet '+name+'.',selected?'':tagline,description,!selected&&names.length?'Explore our services: '+names.join(' • '):'', 'Have a question? Ask '+name+' for more information.'].filter(Boolean).join('\n\n');
  if(appliedTreatment==='concise')copy=[selected?name+' · '+subject:name,selected?'':tagline,description,!selected&&names.length?names.join(' • '):''].filter(Boolean).join('\n');
  if(appliedTreatment==='detailed'){
   copy=[name,selected?'About '+subject:tagline,description,!selected&&details.length?'What we offer\n'+details.join('\n\n'):'','Ask '+name+' about '+(selected?subject:'the services that interest you')+'.'].filter(Boolean).join('\n\n');
   if(!selected)includedServiceCount=details.length;
  }
 }
 // Format is text composition only; facts remain the same approved projection.
 if(channel!=='social'){
  const subject=selected?short(selected.name,120):name;
  const description=selected?short(selected.description,500):about;
  const serviceLines=!selected&&names.length?names.join(channel==='poster'?'\n':' • '):'';
  const opening=appliedTreatment==='welcoming'?'Get to know '+subject+'.':appliedTreatment==='detailed'?'About '+subject:'';
  const details=appliedTreatment==='detailed'&&!selected?brief.services.map(service=>[short(service.name,120),short(service.description,500)].filter(Boolean).join(' — ')).join('\n\n'):serviceLines;
  copy=channel==='poster'?[subject.toUpperCase(),selected?name:tagline,opening,description,details,'Ask '+name+' for more information.'].filter(Boolean).join(appliedTreatment==='concise'?'\n':'\n\n'):
   [selected?subject+' · '+name:name,selected?'':tagline,opening,description,details,'Learn more about '+subject+' — contact '+name+'.'].filter(Boolean).join(appliedTreatment==='concise'?'\n':'\n\n');
 }
 return {ok:true,kind:"private_branded_copy_v3198",businessId:brief.businessId,
  source:{...brief.source},channel,copy,serviceName:selected?.name||"",
  brandColour:brief.brandColour,ownerChosenTone:brief.voice,
  treatment,appliedTreatment,includedServiceCount,usedOwnerProvidedFactsOnly:true,
  requiresOwnerApproval:true,privateOnly:true,neverPublishes:true,
  advertisingCampaignNotCreated:true,providerCallsMade:false,
  noAutomaticMediaReuse:true,noPricesOrReviewsInvented:true,
  needsHumanCopyAndComplianceReview:true};
}
export {SUPPORTED,WORDING_TREATMENTS,resolveWordingTreatment,prepareBrandedCopyPreview};
