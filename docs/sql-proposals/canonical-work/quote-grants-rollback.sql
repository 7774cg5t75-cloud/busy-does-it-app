-- Retaining rollback: no row deletion and no restoration of older readers.
BEGIN;
DO $$ DECLARE f record;r record;BEGIN
 FOR f IN SELECT oid::regprocedure AS sig FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('busy_work_quote_grant_create_v1','busy_work_quote_grant_revoke_v1') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.sig);FOR r IN SELECT rolname FROM pg_roles WHERE NOT rolsuper LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f.sig,r.rolname);END LOOP;END LOOP;
END $$;
COMMIT;
