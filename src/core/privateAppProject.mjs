import {appCompositionContext} from './appGoalComposition.mjs';
import {validateBuilderProposal} from './governedBuilderProposal.mjs';
import {stableJson} from './stableJson.mjs';
const fail=reason=>({ok:false,reason,mayRetry:false});
// Private descriptive requirements, NEVER a public config or executable plan.
export function preparePrivateAppProject({ownerId,businessId,app,catalog,proposal}){
 const context=appCompositionContext({ownerId,businessId,app,catalog}),checked=validateBuilderProposal(proposal,context);
 if(!checked.ok)return fail(checked.reason);
 if(stableJson(app.private_project_spec??null)===stableJson(checked.proposal))return fail('That idea is already saved.');
 return {ok:true,proposal:checked.proposal,appId:app.id,sourceRevision:app.draft_revision,businessId,ownerId,requiresReview:true,mayExecute:false};
}
export function reopenPrivateAppProject({ownerId,businessId,app,catalog}){
 const saved=app?.private_project_spec;
 if(!saved)return fail('There is no saved private idea yet.');
 const scope=saved.scope,context=appCompositionContext({ownerId,businessId,app,catalog});
 if(!context.ok||scope?.ownerId!==ownerId||scope.businessId!==businessId||scope.projectId!==app.id||scope.surface!=='app'||!Number.isSafeInteger(scope.sourceRevision)||scope.sourceRevision>=app.draft_revision)return fail('The saved idea does not match this account and app.');
 // Explicitly re-review the retained description against today's catalogue.
 // This does not replace its saved origin, grant features or write anything.
 const proposal={...saved,scope:{...context.scope}},checked=validateBuilderProposal(proposal,context);
 return checked.ok?{ok:true,proposal:checked.proposal,originRevision:scope.sourceRevision,currentRevision:app.draft_revision,mayExecute:false,requiresReview:true}:fail('Your saved idea is retained, but some features need a fresh review.');
}
export async function savePrivateAppProject({ownerId,businessId,app,catalog,proposal,operation='save',isCurrent,write,readStatus}){
 if(typeof isCurrent!=='function'||!isCurrent())return fail('Open the current account first.');
 const plan=operation==='save'?preparePrivateAppProject({ownerId,businessId,app,catalog,proposal}):operation==='undo'&&Array.isArray(app?.private_project_history)&&app.private_project_history.length?{ok:true,proposal:app.private_project_history.at(-1)}:fail('No earlier private idea is available.');
 if(!plan.ok)return plan;const expected=app.draft_revision+1,target=plan.proposal??null;
 const matches=a=>a?.id===app.id&&a.business_id===businessId&&a.draft_revision===expected&&stableJson(a.private_project_spec??null)===stableJson(target)&&stableJson(a.draft_config)===stableJson(app.draft_config);
 try{
  const receipt=await write({appId:app.id,expectedRevision:app.draft_revision,ownerApproved:true,operation,proposal:operation==='save'?plan.proposal:null});
  if(!isCurrent())return fail('The account changed. Reopen the original private app.');
  const status=await readStatus();if(!isCurrent())return fail('The account changed during readback.');
  if(receipt?.ok!==true||receipt.privateOnly!==true||!matches(receipt.app)||!matches(status?.app))throw Error('Independent specification readback unavailable');
  return {ok:true,status,privateOnly:true,mayExecute:false};
 }catch{
  if(!isCurrent())return fail('The account changed. Your idea is kept locally.');
  try{const status=await readStatus();if(isCurrent())return {...fail('The save was not confirmed. Inspect the current private app before another deliberate review; nothing will retry automatically.'),uncertain:true,status,matchingObserved:matches(status?.app),notOwnReceipt:true};}catch{}
  return {...fail('Save confirmation is unavailable. Your idea is kept; reopen the original app before another save.'),uncertain:true};
 }
}
