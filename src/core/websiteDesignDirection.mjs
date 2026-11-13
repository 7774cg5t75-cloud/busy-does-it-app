import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
// One source-bound reader per calculation, with a bounded operation cache.
// No module-global cache, persisted data or authority crosses projects/tenants.
export function createWebsiteDirectionReader(draft,pageId){
 if(!draft?.id||!draft.pages?.some(p=>p.id===pageId))return ()=>null;
 const source=canonical({id:draft.id,generation:draft.generation,businessId:draft.businessId,pages:draft.pages,sections:draft.sections,theme:draft.theme,designPlan:draft.designPlan}),baseline=Object.fromEntries(['sections','theme','pages','designPlan'].map(key=>[key,JSON.stringify(canonical(draft[key]))])),cache=new Map();
 return operation=>{
  if(!operation)return null;
  const key=JSON.stringify(canonical(operation));if(cache.has(key))return cache.get(key);
  const result=applyWebsiteLayoutOperation(draft,operation);let direction=null;
  if(result.applied){const changes={};for(const field of Object.keys(baseline))if(baseline[field]!==JSON.stringify(canonical(result.draft[field])))changes[field]=result.draft[field];if(Object.keys(changes).length)direction=JSON.stringify(canonical({pageId,source,changes}));}
  if(cache.size>=16)cache.delete(cache.keys().next().value);cache.set(key,direction);return direction;
 };
}
export function websiteDesignDirection(draft,pageId,operation){return createWebsiteDirectionReader(draft,pageId)(operation);}
