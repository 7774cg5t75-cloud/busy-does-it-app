// Only call with the business ID from an authenticated snapshot response or
// an owner-created draft. Never assign a new business to a cached foreign draft.
function bindWebsiteDraftScope(draft,businessId){
 if(!draft||!businessId)return draft;
 if([draft.businessId,draft.business_id].some(id=>id&&id!==businessId))throw Error('This website draft belongs to another business.');
 return {...draft,businessId};
}
function websiteDraftHasScope(draft,businessId){
 return !!businessId&&!!draft&&(draft.businessId===businessId||draft.business_id===businessId)&&
  ![draft.businessId,draft.business_id].some(id=>id&&id!==businessId);
}
export {bindWebsiteDraftScope,websiteDraftHasScope};
