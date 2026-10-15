import {fillMissingBuilderDescriptions} from "./builderServiceDescriptions.mjs";
import {validPrivateBuilderPair,reviewedPairIsCurrent} from "./ownerBuilderDraftGuardV3195.mjs";
/**
 * V3.192 — owner-initiated, same-tenant copy of missing Business App services
 * into an existing PRIVATE website. No automatic/background synchronization.
 *
 * Never overwrite existing website service text, delete website items,
 * publish either builder, import pricing, create bookings or call an AI API.
 * Recompute the plan at approval time using fresh current revisions.
 */
const clean=v=>typeof v==="string"?v.trim():"";
const acceptable=(v,max,required=false)=>typeof v==="string"&&v.length<=max&&
 !/[<>\u0000-\u001f\u007f]/.test(v)&&(!required||!!v.trim());
const makeSlug=v=>v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,48);
function planCopyMissingAppServices(website,app,{businessId,fillDescriptions=false}={}){
 if(typeof fillDescriptions!=="boolean")return {ok:false,reason:"Choose whether to fill empty descriptions."};
 if(!validPrivateBuilderPair(website,app,businessId)||
  !app.draft_config.modules.some(m=>m?.key==="services"&&m.enabled===true))
  return {ok:false,reason:"Open a current website and Business App draft belonging to the same business."};
 const current=website.sections.filter(s=>s?.id==="services");
 if(current.length>1||current.length===1&&
   (current[0].type!=="services"||current[0].enabled===false))
  return {ok:false,reason:"Review the website Services section before copying content."};
 const incoming=app.draft_config.publicProfile?.services;
 if(!Array.isArray(incoming)||!incoming.length||incoming.length>30)
  return {ok:false,reason:"Add real services in the private Business App before copying."};
 const original=current[0]?.items||[];
 const repair=fillDescriptions?fillMissingBuilderDescriptions(original,incoming,{targetName:"title",targetBody:"body"}):{ok:true,next:original,filled:[]};
 if(!repair.ok)return repair;
 const existing=repair.next;
 if(!Array.isArray(existing)||existing.length>30||
    existing.some(s=>!s||typeof s.id!=="string"||!s.id||
      typeof s.title!=="string"))
  return {ok:false,reason:"The website's existing services need review."};
 const seenNames=new Set(),known=new Set(existing.map(x=>clean(x.title).toLocaleLowerCase("en")));
 const usedIds=new Set(existing.map(x=>x.id));
 const added=[],skipped=[];
 for(const service of incoming){
  if(!service||typeof service!=="object"||Array.isArray(service)||
    !acceptable(service.name,120,true)||!acceptable(service.description??"",600))
   return {ok:false,reason:"An App Builder service contains wording that needs review."};
  const name=clean(service.name),body=clean(service.description||"");
  const lower=name.toLocaleLowerCase("en");
  if(seenNames.has(lower))return {ok:false,reason:"The App Builder contains duplicate service names."};
  seenNames.add(lower);
  if(known.has(lower)){skipped.push(name);continue;}
  if(existing.length+added.length>=30)
   return {ok:false,reason:"The website allows at most 30 Services entries."};
  const stem="app-copy-"+makeSlug(name);
  if(stem==="app-copy-")return {ok:false,reason:"Choose a service name with letters or numbers."};
  let id=stem,i=2;while(usedIds.has(id)){id=stem+"-"+i++;if(i>35)
   return {ok:false,reason:"Too many matching service identifiers."};}
  usedIds.add(id);known.add(lower);
  added.push({id,title:name,body});
 }
 if(!added.length&&!repair.filled.length)return {ok:false,reason:"Your website already contains every named app service."};
 const servicesSection=current[0]?
  {...current[0],items:[...existing.map(x=>({...x})),...added],ownerEditedItems:true}:
  {id:"services",type:"services",title:"Our services",enabled:true,
   items:added,ownerEditedItems:true};
 const sections=current.length?
  website.sections.map(s=>s===current[0]?servicesSection:s):
  [...website.sections,servicesSection];
 return {ok:true,kind:"private_cross_builder_service_copy_v3192",
  sourceAppId:app.id,sourceAppRevision:app.draft_revision,
  targetWebsiteId:website.id,targetWebsiteGeneration:website.generation,
  businessId,fillDescriptions,filledDescriptions:repair.filled,added:added.map(x=>({title:x.title,body:x.body})),
  skippedExisting:skipped,nextDraft:{...website,sections},
  filledCount:repair.filled.length,addedCount:added.length,preservesExistingWebsiteCopy:true,
  privateOnly:true,requiresOwnerApproval:true,autoPublishes:false,
  changesBooking:false,addsNoProviders:true};
}
function confirmCopyMissingAppServices(website,app,{businessId,evidence}={}){
 if(!reviewedPairIsCurrent(website,app,businessId,evidence,{
    appId:"sourceAppId",appRevision:"sourceAppRevision",
    websiteId:"targetWebsiteId",websiteRevision:"targetWebsiteGeneration"
  }))
  return {ok:false,reason:"The app, website or business selection has changed. Review the services again."};
 const current=planCopyMissingAppServices(website,app,{businessId,fillDescriptions:evidence?.fillDescriptions===true});
 if(!current.ok)return current;
 // Source text may change without revision in a buggy client. Still refuse an
 // approval that no longer matches the actual preview the owner accepted.
 if(JSON.stringify(current.added)!==JSON.stringify(evidence.added)||JSON.stringify(current.filledDescriptions)!==JSON.stringify(evidence.filledDescriptions||[]))
  return {ok:false,reason:"Service wording changed. Review it again before copying."};
 return current;
}
export {planCopyMissingAppServices,confirmCopyMissingAppServices};
