-- REVIEW ONLY. Narrow staging slice; no acceptance/disclosure/lifecycle rollout.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE WORK PERMISSIONS REVIEW FUSE: separate staging approval required'; END $$;
DO $$ DECLARE f record;BEGIN
 FOR f IN SELECT oid::regprocedure AS signature,proname FROM pg_proc WHERE pronamespace='public'::regnamespace AND left(proname,10)='busy_work_' LOOP
  EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
  IF f.proname=ANY(ARRAY['busy_work_source_review_v1','busy_work_create_quote_v1','busy_work_list_v1','busy_work_discover_v1','busy_work_compare_v1','busy_work_edit_context_v1','busy_work_history_v1','busy_work_read_v1','busy_work_edit_quote_v1','busy_work_private_read_v1','busy_work_private_write_v1']) THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
 END LOOP;
END $$;
COMMIT;
