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
  if(!scope||pending||unknown||!ownerApproved||!['create','edit_text'].includes(action)||basis?.actorId!==scope.ownerId||basis.businessId!==scope.businessId)throw Error('Review this business and draft before saving');
  const captured=epoch,s=scope;pending=true;
  const current=()=>captured===epoch&&scope===s;
  try{
   const result=await request('website_'+action,{businessId:s.businessId,expectedRevision:basis.revision,expectedDraft:basis.websiteDraft||null,sourceRevision,patch,ownerApproved:true});
   if(!current())throw Error('Workspace changed');
   if(!result?.ok||result.actorId!==s.ownerId||result.businessId!==s.businessId||result.previousRevision!==basis.revision||result.revision!==basis.revision+1||result.privateOnly!==true)throw Error('Save receipt unavailable');
   const observed=await read();
   if(observed.revision!==result.revision||observed.websiteDraft?.id!==result.draftId||observed.websiteDraft?.generation!==result.generation)throw Error('Saved target changed before readback');
   return {ok:true,receipt:result,observed,independentlyOpened:true};
  }catch(error){
   if(!current())return {ok:false,stale:true};
   unknown=true;
   let observed=null;try{observed=await read();}catch{}
   return {ok:false,unknown:true,mayReplay:false,observed,reason:'Save not confirmed. Inspect the account version before another deliberate review.'};
  }finally{if(current())pending=false;}
 }
 async function reconcile(){const observed=await read();unknown=false;return {observed,notOwnReceipt:true,requiresNewReview:true};}
 return {open,read,website,reconcile,clear,get scope(){return scope&&{...scope};},get uncertain(){return unknown;}};
}
