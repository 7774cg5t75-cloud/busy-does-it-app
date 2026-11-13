import {preparePrivateAppProject} from '../../../src/core/privateAppProject.mjs';
// Only the original authenticated staging gateway calls this finite service.
export async function savePrivateProject({client,businessId,actorId,app,catalog,body,profileRevision}){
 if(!actorId||!app||app.business_id!==businessId||body.ownerApproved!==true||body.appId!==app.id||body.expectedRevision!==app.draft_revision||!['save','undo'].includes(body.operation)||Object.keys(body).some(k=>!['action','connectedStaging','businessId','appId','expectedRevision','expectedProfileRevision','ownerApproved','operation','proposal'].includes(k)))throw Error('Review the current private app idea before saving.');
 const prepared=body.operation==='save'?preparePrivateAppProject({ownerId:actorId,businessId,app,catalog,proposal:body.proposal}):{ok:body.proposal===null,proposal:null};
 if(!prepared.ok)throw Error(prepared.reason||'Undo only the saved private idea.');
 const result=await client.rpc('busy_connected_app_spec_commit_v1',{p_business_id:businessId,p_actor_id:actorId,p_app_id:app.id,p_expected_revision:app.draft_revision,p_profile_revision:profileRevision,p_operation:body.operation,p_spec:prepared.proposal});
 if(result.error)throw result.error;
 if(result.data?.id!==app.id||result.data?.business_id!==businessId||result.data?.draft_revision!==app.draft_revision+1)throw Error('Private idea receipt unavailable.');
 return {app:result.data,privateOnly:true,mayExecute:false};
}
