-- Review-only retaining lockdown: preserve plans, history and all original Work.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'WORK PREPARATION ROLLBACK REVIEW FUSE: separate hosted approval required'; END $$;
UPDATE busy_work_private.preparation_settings SET closed=true WHERE id;
REVOKE EXECUTE ON FUNCTION public.busy_work_preparation_write_v1(uuid,text,uuid,uuid,bigint,bigint,bigint,jsonb,text,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
