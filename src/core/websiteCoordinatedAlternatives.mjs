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
 const directions=[{id:'coordinated-reading',label:'Clear information, calm rhythm',
  explanation:'Put existing services near the start where supported; compare readable rows, restrained headings and consistent spacing. '+
   (['professional','learning','wellness'].includes(sector)?'This suits information-led decisions.':'Useful when customers need to understand the details first.'),
  settings:{typography:'refined',cardLayout:'rows',spacing:'comfortable'},tradeoff:'Less image-led; visitors may scroll through more service details.'}];
 if(photos>0)directions.push({id:'coordinated-visual',label:'Visual story with breathing room',
  explanation:'Lead with the existing gallery where it is already on this page, then use editorial headings, separated cards and generous spacing. No images or colours are replaced.',
  settings:{typography:'editorial',cardLayout:'cards',spacing:'generous'},tradeoff:'Uses more vertical space on phones; inspect tablet and desktop rhythm too.'});
 directions.sort((a,b)=>{
  const liked=d=>ownerDesignPreference(draft,d.id,pageId)==='liked'?4:0;
  const relevant=d=>d.id==='coordinated-reading'&&issueIds.some(id=>['overflow','headings','readability'].includes(id))?2:
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
  const target=d.id==='coordinated-visual'?'gallery':'services';
  const page=draft.pages.find(p=>p.id===pageId);
  if(draft.businessId&&before[0]==='hero'&&before.includes(target)&&page.sectionIds?.includes(target)){
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
