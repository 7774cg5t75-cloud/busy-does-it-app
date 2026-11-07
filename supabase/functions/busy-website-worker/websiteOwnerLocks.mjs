// One invariant for the existing structured, voice, page and layout editors.
// Locks protect approved sections and their placement, not authentication.
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function websiteOwnerLocks(draft){
 const locks=draft?.theme?.lockedSections;
 if(locks===undefined)return {ok:true,locks:[]};
 if(!Array.isArray(locks)||locks.length>100||new Set(locks).size!==locks.length||
  locks.some(id=>typeof id!=='string'||!id||id.length>128))
  return {ok:false,locks:[],reason:'Review the website section locks before editing.'};
 return {ok:true,locks};
}
function websiteLayoutLockReason(draft,operation={}){
 const parsed=websiteOwnerLocks(draft);if(!parsed.ok)return parsed.reason;
 if(parsed.locks.includes('all')||parsed.locks.length&&
  (operation.action==='style'||operation.action==='brand-colour'||parsed.locks.includes(operation.sectionId)))
  return 'Unlock the affected website section before editing it.';
 return '';
}
const visibleOrder=draft=>[...new Set([...(Array.isArray(draft?.theme?.sectionOrder)&&draft.theme.sectionOrder.length?draft.theme.sectionOrder:Array.isArray(draft?.designPlan?.sectionOrder)?draft.designPlan.sectionOrder:[]),
 ...(draft?.sections||[]).filter(s=>s.enabled!==false).map(s=>s.id)])].filter(id=>(draft?.sections||[]).some(s=>s.id===id&&s.enabled!==false));
function protectWebsiteOwnerLocks(before,result){
 if(!result?.applied)return result;
 const parsed=websiteOwnerLocks(before),after=result.draft;
 const fail=reason=>({applied:false,draft:before,reason});
 if(!parsed.ok)return fail(parsed.reason);
 if(!parsed.locks.length)return result;
 if(!after||!same(before.theme?.lockedSections,after.theme?.lockedSections))return fail('Section locks cannot be changed by a content edit.');
 if(parsed.locks.includes('all'))return fail('Unlock the website before editing it.');
 const themeWithoutOrder=d=>{const {sectionOrder,...theme}=d.theme||{};return theme;};
 if(!same(themeWithoutOrder(before),themeWithoutOrder(after)))return fail('A global design change affects locked sections. Review their locks first.');
 const first=visibleOrder(before),next=visibleOrder(after);
 for(const id of parsed.locks){
  const prior=(before.sections||[]).filter(s=>s.id===id),revised=(after.sections||[]).filter(s=>s.id===id);
  if(!same(prior,revised)||first.indexOf(id)!==next.indexOf(id))return fail('This edit changes or moves an owner-locked section.');
  for(const field of ['pages','customPages']){
   const related=d=>(d[field]||[]).filter(p=>p.sectionIds?.includes(id));
   if(!same(related(before),related(after)))return fail('This page change affects an owner-locked section.');
  }
 }
 return result;
}
export {websiteOwnerLocks,websiteLayoutLockReason,protectWebsiteOwnerLocks};
