import {protectWebsiteOwnerLocks} from "../../supabase/functions/busy-website-worker/websiteOwnerLocks.mjs";
/**
 * V3.149 — bounded, owner-created PRIVATE recovery point.
 * In-memory only. It cannot revert live deployments, select other tenants'
 * websites, or publish. Owner approval remains required after restoration.
 */
function makeWebsiteRecoveryPoint(draft,now,scope={}){
 if(!draft?.id||!Number.isSafeInteger(draft.generation)||!Array.isArray(draft.sections)||
   typeof now!=="string"||!/^\d{4}-\d\d-\d\dT/.test(now))
  return {ok:false,reason:"A current website draft is needed before saving a recovery point."};
 return {ok:true,draftId:draft.id,generation:draft.generation,createdAt:now.slice(0,30),
  snapshot:JSON.parse(JSON.stringify(draft)),ownerId:scope.ownerId||"",businessId:scope.businessId||"",privateOnly:true};
}
function restoreWebsiteRecoveryPoint(current,point,rebuild,scope={}){
 if((scope.ownerId!==undefined&&point?.ownerId!==scope.ownerId)||
    (scope.businessId!==undefined&&point?.businessId!==scope.businessId)||
    [current,point?.snapshot].some(d=>d&&scope.businessId&&
     (d.businessId&&d.businessId!==scope.businessId||d.business_id&&d.business_id!==scope.businessId)))
  return {applied:false,reason:"This recovery point belongs to another owner or business."};
 if(!current?.id||!point?.ok||point.privateOnly!==true||
   point.draftId!==current.id||point.snapshot?.id!==current.id||
   typeof rebuild!=="function"||!Number.isSafeInteger(current.generation))
  return {applied:false,reason:"This recovery point does not belong to your current website."};
 try{
  const reconstructed=rebuild({...point.snapshot,generation:current.generation,
   // Publishing status belongs to the live account, never to this snapshot.
   publicStatus:current.publicStatus});
  if(!reconstructed?.id||reconstructed.id!==current.id||
     reconstructed.generation<=current.generation)
   return {applied:false,reason:"This recovery point could not be restored safely."};
  return protectWebsiteOwnerLocks(current,{applied:true,draft:reconstructed,
   reason:"Restored your saved design to a NEW private draft. The live website was not changed."});
 }catch{return {applied:false,reason:"That recovery point is unavailable. The website is unchanged."};}
}
export {makeWebsiteRecoveryPoint,restoreWebsiteRecoveryPoint};
