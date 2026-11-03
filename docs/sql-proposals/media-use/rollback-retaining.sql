-- Retaining rollback. Never delete original assets, approvals or history.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'MEDIA PURPOSE ROLLBACK FUSE: explicit separate review required'; END $$;
REVOKE ALL ON FUNCTION public.busy_original_media_purpose_v1(text,uuid,uuid,uuid,text,bigint,jsonb,uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
