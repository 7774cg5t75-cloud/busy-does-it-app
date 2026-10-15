import {deriveSector,photographicCount} from './websiteDesignPlanner.mjs';
import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
import {ownerDesignPreference} from './websiteMeasuredDesignCoach.mjs';
// Finite alternatives for the EXISTING measured candidate lifecycle. Industry
// is a hypothesis; current-render checks and the owner's choice stay decisive.
function coordinatedWebsiteAlternatives(draft,pageId,report){
 if(!draft?.id||!draft.pages?.some(p=>p.id===pageId&&p.enabled!==false)||!report?.counts||!Array.isArray(report.issues))return [];
 const sector=deriveSector(draft.businessType||''),photos=photographicCount(draft.sections),theme=draft.theme||{};
 const directions=[{id:'coordinated-reading',label:'Clear information, calm rhythm',
  explanation:'Compare readable service rows, restrained headings and consistent spacing. '+
   (['professional','learning','wellness'].includes(sector)?'This suits information-led decisions.':'Useful when customers need to understand the details first.'),
  settings:{typography:'refined',cardLayout:'rows',spacing:'comfortable'},tradeoff:'Less image-led; visitors may scroll through more service details.'}];
 if(photos>0)directions.push({id:'coordinated-visual',label:'Visual story with breathing room',
  explanation:'Use your existing approved photos with editorial headings, separated cards and generous spacing. No images or colours are replaced.',
  settings:{typography:'editorial',cardLayout:'cards',spacing:'generous'},tradeoff:'Uses more vertical space on phones; inspect tablet and desktop rhythm too.'});
 return directions.filter(d=>ownerDesignPreference(draft,d.id,pageId)!=='disliked').map(d=>{
  const operations=Object.entries(d.settings).filter(([field,value])=>theme[field]!==value).map(([field,value])=>({action:'style',field,value}));
  const operation={action:'style-group',operations};
  return {...d,operation,source:'current-draft-and-business-type-hypothesis',notGuaranteed:true,
   industry:sector,measuredImprovementProven:false,available:operations.length>0&&applyWebsiteLayoutOperation(draft,operation).applied};
 }).filter(d=>d.available).slice(0,2);
}
export {coordinatedWebsiteAlternatives};
