-- Retain original sources, canonical Work and scoped reads. No drops or erasure.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'DURABLE ROLLBACK REVIEW FUSE: separate staging approval required'; END $$;
REVOKE EXECUTE ON FUNCTION public.busy_connected_app_enquiry_import_v2(uuid,uuid,text,bigint),public.busy_connected_app_enquiry_file_v2(uuid,bigint,jsonb,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.busy_connected_private_app_commit_v1(uuid,uuid,uuid,bigint,bigint,jsonb) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.busy_connected_first_app_v1(uuid,uuid,text,text,text,text,bigint,jsonb) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.busy_work_create_quote_v1(uuid,text,text,bigint,text,text,text,text,text,text),public.busy_work_edit_quote_v1(uuid,text,uuid,bigint,text,text,text,text,text),public.busy_work_private_write_v1(uuid,text,uuid,bigint,bigint,text,text,text,text) FROM authenticated;
COMMIT;
-- Also leave BUSY_CONNECTED_BUILDERS_ENABLED unset/false. Existing original
-- canonical rollback can close additional separately reviewed lifecycle writers.
