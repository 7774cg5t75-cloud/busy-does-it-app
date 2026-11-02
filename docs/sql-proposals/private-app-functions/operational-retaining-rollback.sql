BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'OPERATIONAL RETAINING ROLLBACK FUSE: separate hosted approval required'; END $$;
UPDATE busy_app_function_private.operational_settings SET closed=true WHERE id;
REVOKE ALL ON FUNCTION public.busy_private_operational_v1(uuid,uuid,uuid,text,bigint,integer,uuid,jsonb,jsonb),public.busy_work_preparation_candidates_v1(uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
-- Retain all reviewed placements, request identities, Work plans and immutable history.
COMMIT;
