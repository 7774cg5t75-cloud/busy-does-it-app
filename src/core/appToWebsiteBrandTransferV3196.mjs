/**
 * V3.196: PRIVATE Business App -> Website design adaptation, preserving the
 * existing website's content. Finite operations, exact reviewed evidence,
 * no background sync, auto publishing, paid provider calls or live writes.
 */
import {publicCollection,mergeMissingPublicCollection} from './appPublicCollections.mjs';
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
import {editWebsiteDraftField} from './websiteStructuredEditing.mjs';
import {validPrivateBuilderPair,reviewedPairIsCurrent}
 from "./ownerBuilderDraftGuardV3195.mjs";
import {safeHex,PALETTES,nativePalette} from "./nativePalette.mjs";
import {appVisualPresentation} from "./appVisualPresentationV3194.mjs";
import {planCopyMissingAppServices} from "./ownerBuilderServiceBridgeV3192.mjs";
import {applyWebsiteLayoutOperation}
 from "../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs";

const A2W_TYPE=Object.freeze({
 balanced:"confident",editorial:"editorial",impact:"confident",
 friendly:"friendly"
});
const A2W_LAYOUT=Object.freeze({cards:"cards",rows:"rows",spotlight:"outlines"});
function planAppToWebsiteDesign({website,app,businessId,mode="adapt",
 includeServices=false,includeDesign=true,includePublicInformation=false}={}){
 if(!["match","adapt","new"].includes(mode)||typeof includeServices!=="boolean"||typeof includeDesign!=="boolean"||typeof includePublicInformation!=="boolean")
  return {ok:false,reason:"Choose a supported branding approach."};
 if(!validPrivateBuilderPair(website,app,businessId)||
   (website.business_id&&website.business_id!==businessId)||
   (website.businessId&&website.businessId!==businessId))
  return {ok:false,reason:"Open current private drafts from the same business."};
 if(includePublicInformation&&!websiteDraftHasScope(website,businessId))return {ok:false,reason:'Confirm the website business before reusing public information.'};
 const base={ok:true,kind:"private_app_to_website_design_v3196",mode,businessId,
  sourceAppId:app.id,sourceAppRevision:app.draft_revision,
  targetWebsiteId:website.id,targetWebsiteGeneration:website.generation,
  privateOnly:true,neverPublishes:true,requiresOwnerApproval:mode!=="new",
  changesBookings:false,changesPayments:false,customerRecordsCopied:false};
 if(mode==="new")return {...base,operations:[],addedServices:[],
  startFresh:true,reason:"Keep your website design independent."};
 const presentation=app.draft_config?.presentation||{};
 const palette=presentation.brandPalette;
 const colour=palette==="custom"?safeHex(presentation.brandAccent):
  PALETTES[palette]?nativePalette(palette).accent:null;
 const look=appVisualPresentation(presentation);
 const type=A2W_TYPE[look.typeStyle];
 const layout=A2W_LAYOUT[look.serviceStyle];
 const operations=[],reasons=[],skipped=[];
 if(includeDesign&&colour&&(website.theme?.primary||"").toUpperCase()!==colour){
  operations.push({action:"brand-colour",value:colour});
  reasons.push("Coordinate approved app brand colour with readable website controls.");
 }else skipped.push("No different supported app brand colour to copy.");
 const compatible=mode==="match"?type:
  look.typeStyle==="impact"?"refined":type;
 if(includeDesign&&compatible&&website.theme?.typography!==compatible){
  operations.push({action:"style",field:"typography",value:compatible});
  reasons.push("Adapt native headline personality to web typography.");
 }
 if(includeDesign&&layout&&website.theme?.cardLayout!==layout){
  operations.push({action:"style",field:"cardLayout",value:layout});
  reasons.push("Reflect app service presentation with a supported responsive website layout.");
 }
 let servicePlan=null;
 if(includeServices){
  const candidate=planCopyMissingAppServices(website,app,{businessId});
  if(candidate.ok)servicePlan=candidate;
  else skipped.push(candidate.reason||"No additional service text available.");
 }

 let preview=website;
 for(const op of operations){
  const result=applyWebsiteLayoutOperation(preview,op);
  if(!result.applied)return {ok:false,reason:result.reason||"Website appearance needs review."};
  preview=result.draft;
 }
 if(servicePlan){
  const section=servicePlan.nextDraft.sections.find(x=>x.id==="services");
  preview={...preview,sections:preview.sections.some(x=>x.id==="services")?
   preview.sections.map(x=>x.id==="services"?section:x):
   [...preview.sections,section]};
  reasons.push("Add "+servicePlan.addedCount+" missing service(s); preserve original website wording.");
 }
 let informationCount=0;
 if(includePublicInformation){
  for(const [field,type,a,b] of [['faqs','faq','question','answer'],['testimonials','testimonials','attribution','text']]){
   const sections=preview.sections.filter(s=>s?.id===type||s?.type===type);
   const section=sections[0];
   if(sections.length&&(field!=='faqs'||sections.length!==1||section.id!==type||section.type!==type||section.enabled===false||!Array.isArray(section.items))){skipped.push('Kept the existing website '+type+' section.');continue;}
   let value=publicCollection(field,app.draft_config.publicProfile?.[field]||[]);
   if(section){const existing=section.items.map(row=>({...(row.id?{id:row.id}:{}),[a]:row.title,[b]:row.body}));const merged=mergeMissingPublicCollection(field,existing,value);if(!merged.ok){skipped.push(merged.reason);continue;}if(merged.conflicts.length)skipped.push('Kept '+merged.conflicts.length+' conflicting website answers for owner review.');value=merged.added;}
   for(let i=0;i<value.length;i++){
    const row=value[i],result=editWebsiteDraftField(preview,{action:section||i?'add-item':'create-collection',sectionId:type,title:row[a],body:row[b]});
    if(!result.applied)return {ok:false,reason:result.reason};
    preview=result.draft;informationCount++;
   }
  }
  if(informationCount)reasons.push('Reuse '+informationCount+' public app entries in missing website sections, preserving existing website collections.');
 }
 if(!operations.length&&!servicePlan&&!informationCount)return {ok:false,reason:'No missing content or supported design change is available.'};
 const changes=[
  ...operations.map(op=>op.action==="brand-colour"?
   "Brand colour → "+op.value:
   "Website "+op.field+" → "+op.value),
  ...(servicePlan?["Add "+servicePlan.addedCount+" missing services"]:[]),
  ...(informationCount?["Add "+informationCount+" public information entries to missing sections"]:[])
 ];
 const evidence={operations:operations.map(x=>({...x})),
  copiedServices:servicePlan?servicePlan.added.map(x=>({...x})):[],
  copiedInformation:informationCount?preview.sections.filter(s=>['faq','testimonials'].includes(s.type)&&JSON.stringify(s)!==JSON.stringify(website.sections.find(old=>old.id===s.id))):[]};
 return {...base,operations:evidence.operations,
  addedServices:evidence.copiedServices,
  serviceCopyCount:servicePlan?.addedCount||0,includeServices,includeDesign,includePublicInformation,informationCount,
  changes:changes,explanations:reasons,skipped,
  proposedDraft:preview,exactReview:JSON.stringify(evidence),
  draftPreviewOnly:true};
}
function confirmAppToWebsiteDesign({website,app,businessId,evidence}={}){
 if(!reviewedPairIsCurrent(website,app,businessId,evidence,{
   appId:"sourceAppId",appRevision:"sourceAppRevision",
   websiteId:"targetWebsiteId",websiteRevision:"targetWebsiteGeneration"
 }))
  return {ok:false,reason:"An app, website or business selection has changed. Review it again."};
 const now=planAppToWebsiteDesign({website,app,businessId,
  mode:evidence?.mode,includeServices:evidence?.includeServices,includeDesign:evidence?.includeDesign!==false,includePublicInformation:evidence?.includePublicInformation===true});
 if(!now.ok||now.exactReview!==evidence.exactReview||
    JSON.stringify(now.operations)!==JSON.stringify(evidence.operations)||
    JSON.stringify(now.addedServices)!==JSON.stringify(evidence.addedServices))
  return {ok:false,reason:"The current website would receive different changes. Review again."};
 return now;
}
export {A2W_TYPE,A2W_LAYOUT,planAppToWebsiteDesign,confirmAppToWebsiteDesign};
