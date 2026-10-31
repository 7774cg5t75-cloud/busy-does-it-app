BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PROVIDER ROLLBACK REVIEW FUSE: separate approval required'; END $$;
-- Retain original records/columns and exact read-only status authority. No token return API.
REVOKE ALL ON FUNCTION public.busy_provider_begin_v1(uuid,uuid,text,text,bigint,text),public.busy_provider_claim_v1(uuid,uuid,text,text,text,uuid),public.busy_provider_complete_v1(uuid,uuid,text,text,uuid,text,text,text,timestamptz,text),public.busy_provider_disconnect_v1(uuid,uuid,text,uuid,bigint,text) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
