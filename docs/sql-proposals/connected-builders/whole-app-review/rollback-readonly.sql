-- RETAINING ROLLBACK REVIEW ONLY: leaves all rows and exact read/reconciliation authorities.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'WHOLE APP ROLLBACK REVIEW FUSE: separate exact rollback approval required'; END $$;
SET LOCAL lock_timeout='5s';
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature,p.proname,n.nspname,p.proname||'('||oidvectortypes(p.proargtypes)||')' AS exact FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='public' AND p.proname LIKE 'busy_%') OR n.nspname IN ('busy_snapshot_private','busy_work_private','busy_growth_private','busy_creator_private') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 IF f.nspname='public' AND f.exact IN ('busy_connected_workspaces_v1()','busy_connected_builder_read_v1(uuid)','busy_connected_app_enquiry_state_v1(uuid, uuid)','busy_connected_app_enquiry_review_v1(uuid, uuid)','busy_connected_journeys_v1(uuid, text, bigint)','busy_owner_pending_review_v1(uuid, bigint, text)','busy_owner_first_reply_review_v1(uuid, bigint, text, text)','busy_work_source_review_v1(uuid, text, text, bigint)','busy_work_list_v1(uuid, text, uuid, integer)','busy_work_discover_v1(uuid, uuid, integer)','busy_work_compare_v1(uuid, text, uuid)','busy_work_edit_context_v1(uuid, text, uuid, bigint)','busy_work_history_v1(uuid, text, uuid)','busy_work_read_v1(uuid, text, uuid)','busy_work_private_read_v1(uuid, text, uuid, text)','busy_creator_draft_read_v1(uuid, text, bigint)','busy_creator_draft_list_v1(uuid, uuid, text, integer)','busy_creator_draft_operation_v1(uuid, text)','busy_growth_opportunity_read_v1(uuid, uuid, bigint)','busy_growth_opportunity_list_v1(uuid, uuid, integer)','busy_growth_opportunity_operation_v1(uuid, text)') THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
 END LOOP;
END $$;
COMMIT;
