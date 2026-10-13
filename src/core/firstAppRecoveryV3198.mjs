/**
 * V3.198 — authoritative, read-only first-app creation reconciliation.
 * A timed-out create response is NOT proof of failure. Inspect the trusted,
 * authenticated owner_status before offering another create action.
 * This never guesses that an existing app came from the requested website.
 */
const safeId = value => typeof value==="string" &&
 value.length>0 && value.length<=128 &&
 !/[<>\u0000-\u001f\u007f]/.test(value);
function reconcileFirstAppReadback({status,businessId}={}){
 if(!safeId(businessId)||status?.ok!==true||
    status?.businessId!==businessId)
  return {ok:false,reason:"Could not verify the current business app status."};
 if(status.app===null)
  return {ok:true,exists:false,mayCreate:true,authoritative:true};
 const app=status.app;
 if(!app||typeof app!=="object"||Array.isArray(app)||
    !safeId(app.id)||app.business_id!==businessId||
    !Number.isSafeInteger(app.draft_revision)||app.draft_revision<1)
  return {ok:false,reason:"The returned app identity or draft revision could not be verified."};
 return {ok:true,exists:true,mayCreate:false,authoritative:true,
  app,appId:app.id,revision:app.draft_revision,
  ownerReviewRequired:true,doesNotProveWebsiteTransfer:true,
  noAutomaticOverwrite:true,noAutomaticPublish:true};
}
export {reconcileFirstAppReadback};
