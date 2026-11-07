-- REVIEW ONLY. Separately approved retaining rollback; never drops owner data.
-- Unset BUSY_CONNECTED_BUILDERS_ENABLED first. Original staging gateways then
-- deny every unsupported action even if a caller omits connectedStaging.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'JOURNEY ROLLBACK REVIEW FUSE: exact target approval required'; END $$;
REVOKE ALL ON FUNCTION public.busy_connected_app_enquiry_import_v1(uuid,uuid,text,bigint),public.busy_connected_app_enquiry_file_v1(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) FROM PUBLIC,anon,authenticated,service_role;
-- Keep exact owner-scoped readers, original requests, pending/filed sources,
-- customer history, private app/website drafts and all unrelated records.
COMMIT;
