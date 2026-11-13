BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE FORM ROLLBACK REVIEW FUSE: separate rollback approval required'; END $$;
UPDATE busy_app_function_private.settings SET execution_closed=true WHERE id;
CREATE OR REPLACE FUNCTION busy_app_function_private.lockdown() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$ BEGIN RAISE EXCEPTION 'Private function writes closed by retaining rollback' USING ERRCODE='42501';END $$;
REVOKE ALL ON FUNCTION busy_app_function_private.lockdown() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER form_retaining_lockdown BEFORE INSERT OR UPDATE OR DELETE ON busy_app_function_private.heads FOR EACH ROW EXECUTE FUNCTION busy_app_function_private.lockdown();
-- Rows, immutable versions, and the scoped service-only reader remain. Writes fail atomically.
COMMIT;
