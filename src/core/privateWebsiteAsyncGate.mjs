// Ephemeral scope and duplicate protection over existing website requests.
// No request queue, retry, provider adapter or new persistence.
function createPrivateWebsiteAsyncGate(){
 let principal='',epoch=0;const active=new Map();
 const identity=c=>JSON.stringify([c?.ownerId||'',c?.businessId||'']);
 function setContext(context){
  const next=identity(context);if(next!==principal){principal=next;epoch++;active.clear();}
 }
 const sameSource=(a,b)=>identity(a)===identity(b)&&a?.draft===b?.draft&&a?.deploymentId===b?.deploymentId&&a?.draftChangedSinceHosted===b?.draftChangedSinceHosted;
 function begin(lane,reviewed,context=reviewed){
  setContext(context);
  if(!sameSource(reviewed,context))return null;
  if(!['visual','media','language','voice','export','status','hosting','preview','request','snapshot'].includes(lane)||!context?.ownerId||!context.businessId||active.has(lane))return null;
  const draft=context.draft;
  if(draft&&(draft.businessId&&draft.businessId!==context.businessId||draft.business_id&&draft.business_id!==context.businessId))return null;
  const token={lane,epoch,principal,context:{...context}};active.set(lane,token);return token;
 }
 function sourceCurrent(token,context){
  setContext(context);
  return !!token&&token.epoch===epoch&&token.principal===identity(context)&&
   token.context.draft===context.draft&&token.context.deploymentId===context.deploymentId&&
   token.context.draftChangedSinceHosted===context.draftChangedSinceHosted;
 }
 const owns=token=>!!token&&active.get(token.lane)===token;
 const current=(token,context)=>sourceCurrent(token,context)&&owns(token);
 function finish(token){if(!token||active.get(token.lane)!==token)return false;active.delete(token.lane);return true;}
 return {setContext,begin,current,sourceCurrent,owns,finish};
}
export {createPrivateWebsiteAsyncGate};
