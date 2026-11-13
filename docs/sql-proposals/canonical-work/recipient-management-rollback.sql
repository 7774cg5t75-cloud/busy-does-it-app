-- Retaining rollback: no rows/functions/source provenance are deleted or reinstated.
BEGIN;
DO $$ DECLARE f record;r record;BEGIN
 FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('busy_work_quote_binding_decide_v1','busy_work_quote_presentation_prepare_v1','busy_work_quote_presentation_withdraw_v1') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.signature);
 FOR r IN SELECT rolname FROM pg_roles WHERE NOT rolsuper LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f.signature,r.rolname);END LOOP;END LOOP;
END $$;
COMMIT;
