import {validateCalculation,calculatePrivateRules} from '../../../src/core/privateCalculation.mjs';
import {stableJson} from '../../../src/core/stableJson.mjs';
export async function privateFunctionService({client,businessId,actorId,app,body,enabled,projectUrl}){
 if(enabled!=='true'||projectUrl!=='https://pnjdlogwegnqbsfpcofw.supabase.co')throw Error('Private function authority is not activated.');
 if(!actorId||app?.business_id!==businessId||app.created_by!==actorId||Object.keys(body).some(k=>!['action','connectedStaging','expectedProfileRevision','businessId','appId','operation','functionId','version','expectedState','expectedRevision','requestKey','spec','ownerApproved'].includes(k))||body.appId!==app.id||!['save','read','list','disable'].includes(body.operation))throw Error('Open the exact current owned App.');
 if(['save','disable'].includes(body.operation)&&(body.ownerApproved!==true||body.expectedRevision!==app.draft_revision))throw Error('Review the exact current App revision.');
 if(body.operation==='save'){
  const checked=validateCalculation(body.spec);if(!checked.ok)throw Error(checked.reason);
  if(stableJson(checked.spec.scope)!==stableJson({ownerId:actorId,businessId,projectId:app.id,sourceRevision:app.draft_revision}))throw Error('Foreign or stale calculation.');
  for(const example of checked.spec.cases){const result=calculatePrivateRules(checked.spec,example.inputs);if(!result.ok||stableJson(result.outputs)!==stableJson(example.expected))throw Error('Example result mismatch.');}
 }
 const r=await client.rpc('busy_private_function_v1',{p_business_id:businessId,p_actor_id:actorId,p_app_id:app.id,p_action:body.operation,p_function_id:body.functionId||null,p_version:body.version??null,p_expected_state:body.expectedState??null,p_expected_app:body.expectedRevision??null,p_request_key:body.requestKey||null,p_spec:body.operation==='save'?body.spec:null});if(r.error)throw r.error;
 if(r.data?.artifact){const a=r.data.artifact,checked=validateCalculation(a.spec);if(!checked.ok||a.business_id!==businessId||a.app_id!==app.id||a.owner_id!==actorId||a.approved_by!==actorId||(typeof a.canonical_text!=='string'||a.canonical_text.length>24000?null:stableJson(JSON.parse(a.canonical_text)))!==stableJson(a.spec))throw Error('Artifact integrity/scope mismatch.');const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(a.canonical_text)))).map(v=>v.toString(16).padStart(2,'0')).join('');if(hash!==a.spec_hash)throw Error('Artifact hash mismatch.');}
 return {ok:true,...r.data,privateOnly:true};
}
