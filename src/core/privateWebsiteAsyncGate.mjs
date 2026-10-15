// Ephemeral scope and duplicate protection over existing website requests.
// No request queue, retry, provider adapter or new persistence.
import {websiteDraftHasScope} from './websiteDraftScope.mjs';
function createPrivateWebsiteAsyncGate(){
 let principal='',epoch=0;const active=new Map();
 const identity=c=>JSON.stringify([c?.ownerId||'',c?.businessId||'']);
 function setContext(context){
  const next=identity(context);if(next!==principal){principal=next;epoch++;active.clear();}
 }
 const sameSource=(a,b,deploymentBound)=>identity(a)===identity(b)&&a?.draft===b?.draft&&(!deploymentBound||a?.deploymentId===b?.deploymentId&&a?.draftChangedSinceHosted===b?.draftChangedSinceHosted);
 function begin(lane,reviewed,context=reviewed,{deploymentBound=['visual','preview','hosting'].includes(lane)}={}){
  setContext(context);
  if(!sameSource(reviewed,context,deploymentBound))return null;
  if(!['visual','media','language','voice','export','status','hosting','preview','request','snapshot'].includes(lane)||!context?.ownerId||!context.businessId||active.has(lane))return null;
  const draft=context.draft;
  if(draft&&(draft.businessId&&draft.businessId!==context.businessId||draft.business_id&&draft.business_id!==context.businessId))return null;
  if(draft&&!['status','snapshot','request'].includes(lane)&&!websiteDraftHasScope(draft,context.businessId))return null;
  const token={lane,epoch,principal,deploymentBound,context:{...context}};active.set(lane,token);return token;
 }
 function sourceCurrent(token,context){
  setContext(context);
  return !!token&&token.epoch===epoch&&token.principal===identity(context)&&
   sameSource(token.context,context,token.deploymentBound);
 }
 const owns=token=>!!token&&active.get(token.lane)===token;
 const current=(token,context)=>sourceCurrent(token,context)&&owns(token);
 function finish(token){if(!token||active.get(token.lane)!==token)return false;active.delete(token.lane);return true;}
 return {setContext,begin,current,sourceCurrent,owns,finish};
}
export {createPrivateWebsiteAsyncGate};
