// Exact original specialist RPCs only; no arbitrary function/path selection.
export const connectedContentRoutes=Object.freeze({
 website_history:['busy_connected_website_history_v1',['businessId','p_expected_revision','p_expected_hash','p_direction']],
 initialize:['busy_connected_initialize_v1',['businessId']],
 profile_write:['busy_connected_profile_write_v1',['businessId','p_expected_revision','p_expected_profile','p_profile','p_owner_approved']],
 ...Object.fromEntries(Object.entries({
  creator_read:['p_draft_id','p_revision'],creator_list:['p_opportunity_id','p_after','p_limit'],
  creator_write:['p_draft_id','p_expected_revision','p_content','p_opportunity_id','p_opportunity_revision','p_source_hash','p_request_key'],creator_operation:['p_request_key'],
  growth_read:['p_opportunity_id','p_revision'],growth_list:['p_after','p_limit'],
  growth_write:['p_opportunity_id','p_expected_revision','p_source_hash','p_action','p_record','p_feedback','p_reason','p_operation_id'],growth_operation:['p_operation_id']
 }).map(([name,keys])=>{const [domain,action]=name.split('_');return [name,['busy_'+(domain==='creator'?'creator_draft':'growth_opportunity')+'_'+action+'_v1',['businessId',...keys]]];}))
});
