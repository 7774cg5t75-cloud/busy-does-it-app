// Original server planners supply one finite private App draft patch. SQL owns
// live membership + App/profile locks and CAS in one transaction; never publish.
export async function commitPrivateDraft(client,{businessId,actorId,app,patch,profileRevision}){
 if(!actorId||!Number.isSafeInteger(profileRevision)||profileRevision<1)throw Error('Current owner and business facts required');
 const result=await client.rpc('busy_connected_private_app_commit_v1',{p_business_id:businessId,p_actor_id:actorId,p_app_id:app.id,p_expected_revision:Number(app.draft_revision),p_profile_revision:profileRevision,p_patch:patch});
 if(result.error)throw result.error;
 if(result.data?.business_id!==businessId||result.data?.id!==app.id||result.data?.draft_revision!==Number(app.draft_revision)+1)throw Error('Exact private App commit unavailable');
 return {data:result.data,error:null};
}
