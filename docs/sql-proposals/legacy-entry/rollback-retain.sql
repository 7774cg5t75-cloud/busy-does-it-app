BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'LEGACY ENTRY ROLLBACK REVIEW FUSE: separate approval required'; END $$;
-- Never restore the mismatched-business writer. Retain all original counters.
REVOKE ALL ON FUNCTION public.busy_mini_app_record_entry(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
