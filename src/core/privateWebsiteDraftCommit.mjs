import {protectWebsiteOwnerLocks} from '../../supabase/functions/busy-website-worker/websiteOwnerLocks.mjs';
// Final synchronous boundary for original private website editors/handoffs.
// No persistence or independent history; the controller owns its existing state.
function checkPrivateWebsiteDraftCommit({current,candidate,live,scopeCurrent=false,businessId=''}={}){
 const fail=reason=>({applied:false,draft:current,reason});
 if(!scopeCurrent||!current||current!==live||candidate?.id!==current.id||
  !Array.isArray(candidate?.sections)||!Number.isSafeInteger(candidate.generation)||
  candidate.generation<=current.generation)
  return fail('The private website changed. Review its latest version before keeping this edit.');
 if([current,candidate].some(d=>businessId&&
  (d.businessId&&d.businessId!==businessId||d.business_id&&d.business_id!==businessId)))
  return fail('This edit does not belong to the current business.');
 if(candidate.publicStatus!==current.publicStatus)return fail('A private edit cannot change public website status.');
 return protectWebsiteOwnerLocks(current,{applied:true,draft:candidate});
}
export {checkPrivateWebsiteDraftCommit};
