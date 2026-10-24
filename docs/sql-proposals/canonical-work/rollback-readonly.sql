-- Fail-closed rollback: retain canonical data, private drafts, legacy guard and all fences.
BEGIN;
DO $$ DECLARE f record;BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN ('busy_work_create_quote_v1','busy_work_migrate_legacy_v1','busy_work_edit_quote_v1','busy_work_private_write_v1') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 END LOOP;
END $$;
COMMIT;
