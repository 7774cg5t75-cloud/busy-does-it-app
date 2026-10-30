DO $$ BEGIN RAISE EXCEPTION 'AI BUDGET ROLLBACK REVIEW FUSE: explicit approval required'; END $$;
BEGIN;
UPDATE busy_ai_private.policy SET enabled=false WHERE singleton;
REVOKE ALL ON FUNCTION public.busy_ai_reserve_v1(uuid,uuid,uuid,text,text,jsonb,text,uuid),public.busy_ai_dispatch_v1(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
-- Keep source reader and finite settlement available to the trusted reconciler.
-- Preserve all outstanding liabilities, pricing, audit events and original data.
COMMIT;
