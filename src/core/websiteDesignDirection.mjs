import {applyWebsiteLayoutOperation} from '../../supabase/functions/busy-website-worker/websiteLayoutEditing.mjs';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
// Identity of an effective finite edit, not its marketing name. Feedback itself
// is excluded; new content, generation, theme or page scope requires fresh review.
export function websiteDesignDirection(draft,pageId,operation){
 if(!draft?.id||!draft.pages?.some(p=>p.id===pageId)||!operation)return null;
 const result=applyWebsiteLayoutOperation(draft,operation);
 if(!result.applied)return null;
 const source={id:draft.id,generation:draft.generation,businessId:draft.businessId,pages:draft.pages,sections:draft.sections,theme:draft.theme,designPlan:draft.designPlan};
 const changes={};for(const key of ['sections','theme','pages','designPlan'])if(JSON.stringify(canonical(draft[key]))!==JSON.stringify(canonical(result.draft[key])))changes[key]=result.draft[key];
 if(!Object.keys(changes).length)return null;
 return JSON.stringify(canonical({pageId,source,changes}));
}
