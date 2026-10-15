import {proposeAppModuleToggle} from './appDraftComposition.mjs';
import {proposeAppSectionMove} from './appSectionOrder.mjs';
import {previewPrivateAppAppearance} from './appAppearanceEditing.mjs';
import {privateAppEditSource} from './privateAppEditSession.mjs';
// Guard existing module/rebuild/plan writes using the original request transport.
// No retry, publication, provider call or inferred successful write.
async function executeAppDraftMutation({action,payload,scope,isCurrent,send}={}){
 if(!['build_draft','apply_app_plan','set_module','move_section','set_appearance'].includes(action)||!scope?.userId||
  !scope.businessId||typeof isCurrent!=='function'||!isCurrent())throw Error('Open the current signed-in business workspace.');
 const base=scope.app?privateAppEditSource({businessId:scope.businessId,app:scope.app}):null;
 if(scope.app&&!base||['set_module','move_section','set_appearance'].includes(action)&&!base)throw Error('Open the current private app before editing.');
 if(base&&(payload?.appId!==undefined&&payload.appId!==base.appId||
  payload?.expectedRevision!==undefined&&payload.expectedRevision!==base.revision))throw Error('The reviewed app changed. Prepare a fresh preview.');
 const plan=action==='set_module'?proposeAppModuleToggle(scope.app.draft_config,payload):
  action==='move_section'?proposeAppSectionMove(scope.app.draft_config,payload):
  action==='set_appearance'?previewPrivateAppAppearance(scope.app.draft_config,payload):null;
 if(plan&&!plan.ok)throw Error(plan.reason);
 const data=await send(action,{...payload,...base?{appId:base.appId,expectedRevision:base.revision}:{}},{isCurrent});
 if(!isCurrent())throw Error('The workspace changed. Refresh the original private app before another edit.');
 const app=data?.app,statusApp=data?.status?.app;
 const actual=privateAppEditSource({businessId:scope.businessId,app});
 const status=privateAppEditSource({businessId:scope.businessId,app:statusApp});
 if(data?.ok!==true||!actual||!status||JSON.stringify(actual)!==JSON.stringify(status)||
  base&&(actual.appId!==base.appId||actual.revision!==base.revision+1)||
  plan&&actual.configStamp!==privateAppEditSource({businessId:scope.businessId,app,config:plan.nextConfig})?.configStamp||!base&&actual.revision!==(action==='apply_app_plan'?2:1))
  throw Error('The private draft receipt could not be verified. Refresh before trying again; no request was replayed.');
 return data;
}
export {executeAppDraftMutation};
