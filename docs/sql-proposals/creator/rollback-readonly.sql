BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'CREATOR ROLLBACK FUSE: separate hosted approval required'; END $$;
-- A denying body protects against inherited/default EXECUTE grants as well.
CREATE OR REPLACE FUNCTION public.busy_creator_draft_write_v1(p_business_id uuid,p_draft_id text,p_expected_revision bigint,p_content jsonb,p_opportunity_id uuid,p_opportunity_revision bigint,p_source_hash text,p_request_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ BEGIN RAISE EXCEPTION 'Private Creator saving paused; retained records are read-only' USING ERRCODE='42501';END $$;
ALTER FUNCTION public.busy_creator_draft_write_v1(uuid,text,bigint,jsonb,uuid,bigint,text,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_creator_draft_write_v1(uuid,text,bigint,jsonb,uuid,bigint,text,text) FROM PUBLIC,anon,authenticated,service_role;
-- Retain every head/version. Reads still require live owner and source permission.
COMMIT;
