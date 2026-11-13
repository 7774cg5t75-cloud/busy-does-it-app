import {stableJson} from '../core/stableJson.mjs';
import {growthWebsiteEvidence} from './growthOpportunities.mjs';
const clean=v=>typeof v==='string'?v.trim():'';
// Read/review exact current entries. No SEO, conversion or public-site diagnosis.
export function reviewGrowthWebsiteServices(input){
 if(!input?.ownerId||!['owner','admin'].includes(input.role))return null;
 const source=growthWebsiteEvidence(input);if(source.state!=='supported'||source.section?.id!=='services'||source.section.type!=='services'||source.rows.length>30)return null;
 const originals=input.approvedProfile.services,rows=source.rows,stamp=stableJson([input.ownerId,input.businessId,input.role,input.website,input.approvedProfile]);
 if(rows.some(r=>typeof r.id!=='string'||!r.id||rows.filter(x=>x.id===r.id).length!==1||typeof r.body!=='string'))return null;
 return {stamp,websiteId:input.website.id,generation:input.website.generation,entries:rows.map(row=>{
  const matches=originals.filter(s=>clean(s?.name).toLocaleLowerCase('en')===clean(row.title||row.name).toLocaleLowerCase('en'));
  const current=source.profile.services.filter(s=>s.name.toLocaleLowerCase('en')===clean(row.title||row.name).toLocaleLowerCase('en'));
  const duplicate=rows.filter(s=>clean(s.title||s.name).toLocaleLowerCase('en')===clean(row.title||row.name).toLocaleLowerCase('en')).length!==1;
  const service=matches.length===1&&current.length===1&&(!current[0].id||originals.filter(s=>clean(s?.id)===current[0].id).length===1)?current[0]:null;
  const eligible=!duplicate&&service?.description&&clean(row.body)!==service.description;
  return {id:row.id,title:row.title||row.name,originalBody:row.body,proposedBody:eligible?service.description:null,state:duplicate?'ambiguous':!clean(row.body)?'missing_description':eligible?'approved_copy_differs':'no_supported_change',patch:eligible?{sectionId:'services',itemId:row.id,field:'body',value:service.description}:null};
 })};
}
