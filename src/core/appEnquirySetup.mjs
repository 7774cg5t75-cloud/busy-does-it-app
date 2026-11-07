import {privateAppEditSource} from './privateAppEditSession.mjs';
import {appRuntimeScreenSchema} from './appRuntimeScreenSchema.mjs';
import {proposeAppModuleToggle} from './appDraftComposition.mjs';
export function appEnquirySetup({businessId,app,catalog}={}){
 const source=privateAppEditSource({businessId,app});if(!source||!appRuntimeScreenSchema(app.draft_config,catalog).ok)return null;
 const steps=[];
 for(const key of ['services','enquiry']){
  const rows=app.draft_config.modules.filter(m=>m.key===key),providers=catalog.filter(m=>m.module_key===key&&m.status==='available');
  if(rows.length!==1||providers.length!==1||!Number.isSafeInteger(providers[0].module_version)||providers[0].module_version<1||key==='enquiry'&&providers[0].capabilities?.customer_action!==true)return null;
  const enabled=rows[0].enabled===true,plan=enabled?null:proposeAppModuleToggle(app.draft_config,{moduleKey:key,enabled:true});
  steps.push({key,enabled,version:providers[0].module_version,plan:plan?.ok?plan:null});
 }
 return {source,steps,ready:steps.every(x=>x.enabled)};
}
