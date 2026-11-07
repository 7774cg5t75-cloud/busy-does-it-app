import {wholeSiteDerivedSourcesCurrent,wholeSiteServices} from './websiteWholeSite.mjs';

const list=value=>Array.isArray(value)?value:[];
const text=value=>typeof value==='string'?value.trim():'';
const safeOutput=value=>typeof value==='string'&&/^(?:index\.html|(?:[a-z0-9-]+\/)+index\.html)$/.test(value);
const safePath=value=>typeof value==='string'&&/^\/(?:[a-z0-9-]+\/)*[a-z0-9-]+$/.test(value);
const foreign=(value,businessId)=>[value?.businessId,value?.business_id].some(id=>id&&id!==businessId);
const signed=value=>{
 if(typeof value!=='string'||value.length>4096||/[\s\"'<>\u0000-\u001f\u007f]/.test(value))return null;
 try{const url=new URL(value),keys=[...url.searchParams.keys()];return url.protocol==='https:'&&!url.username&&!url.password&&!url.hash&&keys.length===1&&keys[0]==='token'&&url.searchParams.get('token')?url:null;}catch{return null;}
};

// A presentation of current original service records, not another copy/fact
// authority. A summary is an EXACT complete source paragraph, never generated
// marketing copy or an automatically removed qualifier within a paragraph.
/**
 * @param draft The current original website model.
 * @param section Its original approved services section.
 * @param {{pageId?: string, editablePreview?: boolean, pageHref?: (id: string) => string}} [options]
 */
export function purposeServiceProjection(draft,section,{pageId='home',editablePreview=false,pageHref}={}){
 if(draft?.sitePresentation!=='purposeful-v1'||editablePreview||!['home','services'].includes(pageId)||typeof pageHref!=='function')return null;
 const businessId=text(draft.businessId);
 // The original editor checks locks before adopting this reviewed flag. Later
 // locking a chosen presentation must not itself change what the owner sees.
 if(!businessId||foreign(draft,businessId)||!wholeSiteDerivedSourcesCurrent(draft))return null;
 const canonical=list(draft.sections).filter(row=>row?.id==='services'&&row.type==='services'&&row.enabled!==false);
 // Only the section actually owned by this model can be shortened. A copied
 // or foreign section argument cannot use current routes to gain provenance.
 if(canonical.length!==1||canonical[0]!==section||section.appearance?.serviceLayout==='index'||foreign(section,businessId))return null;
 const currentPages=list(draft.pages).filter(page=>page?.id===pageId&&page.enabled!==false);
 if(currentPages.length!==1||foreign(currentPages[0],businessId)||currentPages[0].outputPath!==(pageId==='home'?'index.html':'services/index.html'))return null;
 let currentSigned;try{currentSigned=signed(pageHref(pageId));}catch{return null;}
 const signedBase=currentSigned?.pathname.endsWith('/'+currentPages[0].outputPath)?currentSigned.pathname.slice(0,-currentPages[0].outputPath.length):null;
 const prefix='../'.repeat(currentPages[0].outputPath.split('/').length-1),services=wholeSiteServices(draft);
 const detailHrefs=Object.create(null),summaries=[],linkedItemIds=[],hiddenPhotoIds=[];
 const items=list(section.items).map(item=>{
  const service=services.find(row=>row===item);
  if(!service||foreign(item,businessId)||['href','url','cta','ctaHref','link','destination'].some(field=>Object.hasOwn(item,field)))return item;
  const owned=list(draft.customPages).filter(page=>page?.sourceServiceId===item.id&&page.enabled!==false);
  if(owned.length!==1||foreign(owned[0],businessId)||list(draft.customPages).filter(p=>p?.id===owned[0].id).length!==1||!/^[-a-z0-9]{2,68}$/.test(owned[0].slug||''))return item;
  const page=list(draft.pages).filter(row=>row?.id===owned[0].id&&row.enabled!==false);
  if(page.length!==1||foreign(page[0],businessId)||page[0].sourceServiceId!==item.id||page[0].title!==owned[0].title||!safeOutput(page[0].outputPath)||!safePath(page[0].path)||page[0].path!=='/pages/'+owned[0].slug||page[0].outputPath!=='pages/'+owned[0].slug+'/index.html')return item;
  const sectionIds=list(owned[0].sectionIds);
  if(!sectionIds.length||new Set(sectionIds).size!==sectionIds.length||JSON.stringify(page[0].sectionIds)!==JSON.stringify(sectionIds)||sectionIds.some(id=>list(draft.sections).filter(s=>s?.id===id&&s.enabled!==false&&!foreign(s,businessId)&&['text','photo-feature'].includes(s.type)&&text(s.body)).length!==1))return item;
  const detailBody=sectionIds.map(id=>text(draft.sections.find(s=>s.id===id).body)).join('\n\n');
  // Owner edits to a detail page remain valid, but it must still contain the
  // complete original service words before Home may abbreviate them.
  if(detailBody!==text(service.body))return item;
  // The original page model must agree with its source-owned custom page.
  const snapshot=page[0].sourceServiceSnapshot;
  if(!snapshot||snapshot.title!==text(service.title)||snapshot.body!==text(service.body)||owned[0].sourceServiceSnapshot?.title!==snapshot.title||owned[0].sourceServiceSnapshot?.body!==snapshot.body)return item;
  let href;try{href=pageHref(page[0].id);}catch{return item;}
  const targetSigned=signed(href),signedCurrentTarget=!!(currentSigned&&signedBase&&targetSigned&&targetSigned.origin===currentSigned.origin&&targetSigned.pathname===signedBase+page[0].outputPath);
  if(typeof href!=='string'||![prefix+page[0].outputPath,page[0].path,page[0].path+'/'].includes(href)&&!signedCurrentTarget)return item;
  detailHrefs[item.id]=href;linkedItemIds.push(item.id);
  if(pageId==='home'&&item.photoBinding)hiddenPhotoIds.push(item.id);
  const paragraphs=text(item.body).split(/\n\s*\n/).filter(Boolean),summary=paragraphs[0]?.trim();
  // One-paragraph services stay exact and complete. Long introductory prose
  // also stays complete rather than being cut at an arbitrary character count.
  if(paragraphs.length<2||!summary||summary.length>420)return item;
  summaries.push({serviceId:item.id,pageId:page[0].id,sourceBody:text(item.body),summary,policy:'exact-first-paragraph',requiresOwnerReview:true});
  return {...item,body:summary};
 });
 if(!linkedItemIds.length)return null;
 return {section:{...section,items},detailHrefs,linkedItemIds,hiddenPhotoIds,reviewedHeadingHrefs:Object.values(detailHrefs).filter(href=>!!signed(href)),
  hidePhotos:pageId==='home'&&list(section.items).every(item=>!item?.photoBinding||hiddenPhotoIds.includes(item.id)),
  summaries,overview:true};
}

export const websiteServiceOverviewCss=`
.purposeful-service-overview .service-detail-link{display:inline-flex;align-items:center;gap:.45em;min-height:44px;max-width:100%;min-width:0;color:inherit;text-decoration:underline;text-decoration-thickness:1px;text-decoration-color:var(--line);text-underline-offset:.2em;overflow-wrap:anywhere}
.purposeful-service-overview .service-detail-link:hover{text-decoration-color:currentColor}
.purposeful-service-overview .service-detail-link:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.purposeful-service-overview .service-detail-arrow{font:inherit;font-size:1rem;flex:none;text-decoration:none}
main .purposeful-service-overview .crafted-service{padding-block:clamp(24px,3.5vw,42px)}
main .purposeful-service-overview .crafted-service-description{max-width:52ch}
@media(max-width:700px){main .purposeful-service-overview .crafted-service{padding-block:24px}.purposeful-service-overview .service-detail-link{line-height:1.2}}
`;
