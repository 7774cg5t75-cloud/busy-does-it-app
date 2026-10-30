import {stableJson} from '../core/stableJson.mjs';
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
// Finite client orchestration over original authorities. No account cache, retry
// queue, new draft store or inferred own-write receipt after an uncertain result.
export function createConnectedBuilderSession({request,onInvalidated=()=>{}}){
 let epoch=0,scope=null,pending=false,unknown=false;
 const clear=()=>{epoch++;scope=null;pending=false;unknown=false;onInvalidated();};
 const check=(packet,business)=>{if(!uuid.test(packet?.actorId||'')||packet.businessId!==business||!Number.isSafeInteger(packet.revision)||packet.revision<1)throw Error('Unverified business response');return packet;};
 async function open(businessId){
  clear();const captured=epoch;
  if(!uuid.test(businessId||''))throw Error('Choose a verified business');
  const packet=check(await request('builder_read',{businessId}),businessId);
  if(epoch!==captured)throw Error('Workspace changed');
  scope={businessId,ownerId:packet.actorId};return packet;
 }
 async function read(){
  if(!scope)throw Error('Open a verified business');const captured=epoch,s=scope;
  const packet=check(await request('builder_read',{businessId:s.businessId}),s.businessId);
  if(captured!==epoch||packet.actorId!==s.ownerId)throw Error('Workspace changed');return packet;
 }
 async function website({basis,action,patch,sourceRevision,ownerApproved=false}){
  if(!scope||pending||unknown||!ownerApproved||!['create','edit_text','edit_design','edit_page'].includes(action)||basis?.actorId!==scope.ownerId||basis.businessId!==scope.businessId)throw Error('Review this business and draft before saving');
  const captured=epoch,s=scope;pending=true;
  const current=()=>captured===epoch&&scope===s;
  try{
   const result=await request('website_'+action,{businessId:s.businessId,expectedRevision:basis.revision,expectedDraft:basis.websiteDraft||null,sourceRevision,patch,ownerApproved:true});
   if(!current())throw Error('Workspace changed');
   if(!result?.ok||result.actorId!==s.ownerId||result.businessId!==s.businessId||result.previousRevision!==basis.revision||result.revision!==basis.revision+1||result.privateOnly!==true||!(/^[a-f0-9]{64}$/.test(result.recordHash||'')))throw Error('Save receipt unavailable');
   const observed=await read();
   if(observed.revision!==result.revision||observed.websiteDraft?.id!==result.draftId||observed.websiteDraft?.generation!==result.generation||observed.websiteDraftHash!==result.recordHash)throw Error('Saved target changed before readback');
   return {ok:true,receipt:result,observed,independentlyOpened:true};
  }catch(error){
   if(!current())return {ok:false,stale:true};
   unknown=true;
   let observed=null;try{observed=await read();}catch{}
   return {ok:false,unknown:true,mayReplay:false,observed,reason:'Save not confirmed. Inspect the account version before another deliberate review.'};
  }finally{if(current())pending=false;}
 }
 async function profile({basis,profile,ownerApproved=false}){
  if(!scope||pending||unknown||!ownerApproved||basis?.actorId!==scope.ownerId||basis.businessId!==scope.businessId)throw Error('Review this business before saving facts');
  const captured=epoch,s=scope;pending=true;const current=()=>captured===epoch&&scope===s;
  try{const receipt=await request('profile_write',{businessId:s.businessId,p_expected_revision:basis.profileRevision||0,p_expected_profile:basis.profile||null,p_profile:profile,p_owner_approved:true});
   if(!current()||receipt.actorId!==s.ownerId||receipt.businessId!==s.businessId||receipt.profileRevision!==(basis.profileRevision||0)+1||receipt.privateOnly!==true||receipt.publicationChanged!==false||!(/^[a-f0-9]{64}$/.test(receipt.recordHash||'')))throw Error('Business facts receipt unavailable');
   const observed=await read();if(observed.profileRevision!==receipt.profileRevision||observed.profileHash!==receipt.recordHash||stableJson(observed.profile)!==stableJson(receipt.profile))throw Error('Business facts changed before readback');return {ok:true,receipt,observed};
  }catch{if(!current())return {ok:false,stale:true};unknown=true;let observed=null;try{observed=await read();}catch{}return {ok:false,unknown:true,mayReplay:false,observed};}finally{if(current())pending=false;}
 }
 async function reconcile(){const observed=await read();unknown=false;return {observed,notOwnReceipt:true,requiresNewReview:true};}
 return {open,read,website,profile,reconcile,clear,get scope(){return scope&&{...scope};},get uncertain(){return unknown;}};
}
