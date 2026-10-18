import {deriveSector,photographicCount} from './websiteDesignPlanner.mjs';
import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
import {ownerDesignPreference} from './websiteMeasuredDesignCoach.mjs';
// Finite alternatives for the EXISTING measured candidate lifecycle. Industry
// is a hypothesis; current-render checks and the owner's choice stay decisive.
function coordinatedWebsiteAlternatives(draft,pageId,report){
 if(!draft?.id||!draft.pages?.some(p=>p.id===pageId&&p.enabled!==false)||!report?.counts||!Array.isArray(report.issues)||!Number.isFinite(report.counts.viewport)||report.counts.viewport<250||report.counts.viewport>3000)return [];
 const issueIds=report.issues.map(x=>x?.id);
 // Restyling cannot repair missing originals, factual descriptions or links.
 if(issueIds.length&&issueIds.every(id=>['photos','descriptions','links'].includes(id)))return [];
 const sector=deriveSector(draft.businessType||''),photos=photographicCount(draft.sections),theme=draft.theme||{};
 const heroPhoto=photographicCount((draft.sections||[]).filter(section=>section.id==='hero'))>0;
 const directions=[{id:'coordinated-reading',label:'Clear information, calm rhythm',
  explanation:'Put existing services near the start where supported; compare readable rows, restrained headings and consistent spacing. '+
   (['professional','learning','wellness'].includes(sector)?'This suits information-led decisions.':'Useful when customers need to understand the details first.'),
  settings:{typography:'refined',cardLayout:'rows',heroLayout:heroPhoto?'image-right':'type-left'},tradeoff:'Less image-led; visitors may scroll through more service details.'}];
 directions.push({id:'coordinated-visual',label:heroPhoto?'Image-led introduction':'Editorial introduction',
  explanation:'Compare an editorial hero, separated cards and the existing gallery where it is on this page. Without an approved hero image, use a typographic statement. Images, colours and owner spacing choices are preserved.',
  settings:{typography:'editorial',cardLayout:'cards',heroLayout:heroPhoto?'image-feature':'type-poster'},tradeoff:'Uses more vertical space on phones; inspect tablet and desktop rhythm too.'});
 const serviceSection=draft.sections?.find(s=>s.id==='services'&&s.enabled!==false&&draft.pages.find(p=>p.id===pageId)?.sectionIds?.includes(s.id));
 const serviceCount=Array.isArray(serviceSection?.items)?serviceSection.items.filter(item=>String(item.title||'').trim()).length:0;
 if(serviceCount>=4)directions.unshift({id:'coordinated-service-guide',label:'Service guide with clear detail rows',explanation:'Your current page contains '+serviceCount+' named services. Compare compact typography and title/detail rows so visitors can scan names before reading the detail. Existing words, colours and images stay unchanged.',settings:{typography:'compact',cardLayout:'rows',heroLayout:heroPhoto?'image-frame':'type-left'},tradeoff:'Prioritises information density over large decorative cards; phones retain stacked service text.'});
 const gallery=draft.sections?.find(s=>s.id==='gallery'&&s.enabled!==false&&draft.pages.find(p=>p.id===pageId)?.sectionIds?.includes(s.id));
 const galleryPhotos=photographicCount(gallery?[gallery]:[]);
 if(galleryPhotos>=3&&serviceCount<4&&!['compact','large'].includes(gallery.appearance?.gallerySize)&&!['compact','large'].includes(gallery.appearance?.desktopGallerySize))directions.unshift({id:'coordinated-gallery-story',label:'Image-led story with a featured photograph',explanation:'Your current page has '+galleryPhotos+' approved gallery photographs. Compare a gallery-first story with one larger existing photograph on wide screens; phones keep the original flowing gallery. Existing captions, assets and colours stay unchanged.',settings:{typography:'editorial',cardLayout:'outlines',heroLayout:heroPhoto?'image-feature':'type-poster'},tradeoff:'Visitors meet the imagery before longer service detail. No photo is invented, replaced or assigned to a service.'});
 directions.sort((a,b)=>{
  const liked=d=>ownerDesignPreference(draft,d.id,pageId)==='liked'?4:0;
  const relevant=d=>['coordinated-service-guide','coordinated-gallery-story'].includes(d.id)?3:d.id==='coordinated-reading'&&issueIds.some(id=>['overflow','headings','readability'].includes(id))?2:
   d.id==='coordinated-visual'&&photos>0&&['creative','hospitality','events','retail'].includes(sector)?1:0;
  return liked(b)+relevant(b)-liked(a)-relevant(a);
 });
 return directions.filter(d=>ownerDesignPreference(draft,d.id,pageId)!=='disliked').map(d=>{
  const operations=Object.entries(d.settings).filter(([field,value])=>theme[field]!==value).map(([field,value])=>({action:'style',field,value}));
  // Reuse the exact reviewed-composition operation, not a new layout engine.
  // Distinguish information-first and image-first journeys structurally when
  // both sections are actually present on this page. Never invent imagery.
  const active=(draft.sections||[]).filter(s=>s.enabled!==false).map(s=>s.id);
  const before=[...new Set([...(draft.designPlan?.sectionOrder||[]).filter(id=>active.includes(id)),...active])];
  const target=['coordinated-visual','coordinated-gallery-story'].includes(d.id)?'gallery':'services';
  const page=draft.pages.find(p=>p.id===pageId);
  if(!theme.sectionOrder?.length&&draft.businessId&&before[0]==='hero'&&before.includes(target)&&page.sectionIds?.includes(target)){
   const proposed=['hero',target,...before.filter(id=>id!=='hero'&&id!==target)];
   if(JSON.stringify(before)!==JSON.stringify(proposed))operations.push({action:'apply-reviewed-composition',
    websiteId:draft.id,expectedGeneration:draft.generation,expectedBusinessId:draft.businessId,before,proposed});
  }
  const operation={action:'style-group',operations};
  return {...d,operation,source:'current-draft-and-business-type-hypothesis',notGuaranteed:true,
   industry:sector,measuredImprovementProven:false,decisionEvidence:{viewport:report.counts.viewport,issueIds,approvedPhotoCount:photos,ownerPreference:ownerDesignPreference(draft,d.id,pageId)||null},available:operations.length>0&&applyWebsiteLayoutOperation(draft,operation).applied};
 }).filter(d=>d.available).slice(0,2);
}
export {coordinatedWebsiteAlternatives};
