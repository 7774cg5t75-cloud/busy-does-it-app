import {privateFunctionService} from './privateFunctionService.mjs';
import {validatePrivateBindings} from '../../../src/core/privateScreenBindings.mjs';
export async function privateScreenService({client,businessId,actorId,app,body,enabled,functionsEnabled,formsEnabled,projectUrl}){
 if(enabled!=='true'||functionsEnabled!=='true'||projectUrl!=='https://pnjdlogwegnqbsfpcofw.supabase.co')throw Error('Private screen placement is not activated.');
 if(!actorId||app?.business_id!==businessId||app.created_by!==actorId||body.appId!==app.id||Object.keys(body).some(k=>!['action','connectedStaging','expectedProfileRevision','businessId','appId','operation','expectedRevision','expectedAppRevision','revision','requestKey','bindings','ownerApproved'].includes(k))||!['save','read'].includes(body.operation))throw Error('Open the exact current owned App.');
 if(body.operation==='save'){
  if(body.ownerApproved!==true||body.expectedAppRevision!==app.draft_revision||!validatePrivateBindings(body.bindings).ok)throw Error('Review the exact supported private placements.');
  for(const b of body.bindings){const r=await privateFunctionService({client,businessId,actorId,app,body:{appId:app.id,operation:'read',functionId:b.functionId,version:b.version},enabled:functionsEnabled,formsEnabled,projectUrl});if(r.status!=='accepted_private'||r.artifact.function_id!==b.functionId||r.artifact.version!==b.version||r.artifact.spec_hash!==b.hash||r.stateRevision!==b.stateRevision)throw Error('The chosen private artifact changed.');}
 }
 const r=await client.rpc('busy_private_screen_v1',{p_business_id:businessId,p_actor_id:actorId,p_app_id:app.id,p_action:body.operation,p_expected_revision:body.expectedRevision??null,p_expected_app:body.expectedAppRevision??null,p_request_key:body.requestKey||null,p_bindings:body.bindings??null,p_revision:body.revision??null});if(r.error)throw r.error;return {ok:true,...r.data};
}
