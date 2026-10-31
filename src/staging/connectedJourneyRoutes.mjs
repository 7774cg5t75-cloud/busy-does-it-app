// Exact original private RPC contracts. No caller-selected function/path writer.
export const connectedJourneyRoutes=Object.freeze({
 journey_list:['busy_connected_journeys_v1',['businessId','after','expectedRevision']],
 app_enquiry_import:['busy_connected_app_enquiry_import_v2',['businessId','requestId','requestHash','expectedRevision']],
 app_enquiry_file:['busy_connected_app_enquiry_file_v2',['businessId','expectedRevision','capture','identityDecision']],
 ...Object.fromEntries(Object.entries({
 source_review:['p_customer_id','p_enquiry_id','p_expected_snapshot_revision'],
 list:['p_customer_id','p_after','p_limit'],read:['p_customer_id','p_engagement_id'],
 history:['p_customer_id','p_engagement_id'],discover:['p_after','p_limit'],compare:['p_customer_id','p_engagement_id'],
 edit_context:['p_customer_id','p_engagement_id','p_expected_revision'],
 create_quote:['p_customer_id','p_enquiry_id','p_expected_snapshot_revision','p_customer_hash','p_source_hash','p_amount','p_text','p_date','p_operation_id'],
 edit_quote:['p_customer_id','p_engagement_id','p_expected_revision','p_source_hash','p_amount','p_text','p_date','p_operation_id'],
 private_read:['p_customer_id','p_engagement_id','p_kind'],
 private_write:['p_customer_id','p_engagement_id','p_engagement_revision','p_expected_draft_revision','p_source_hash','p_kind','p_text','p_operation_id']
 }).map(([name,keys])=>['work_'+name,['busy_work_'+name+'_v1',['businessId',...keys]]]))
});
