-- Retaining read-only candidate. No table/object deletion or legacy writer.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'ORIGINAL UPLOAD ROLLBACK REVIEW FUSE: hosted approval required'; END $$;
ALTER FUNCTION public.busy_original_upload_operation_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid) RENAME TO busy_original_upload_retained_impl_v1;
REVOKE ALL ON FUNCTION public.busy_original_upload_retained_impl_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.busy_original_upload_operation_v1(p_action text,p_business_id uuid,p_actor_id uuid,p_request_key text DEFAULT NULL,p_selection_id text DEFAULT NULL,p_sha256 text DEFAULT NULL,p_byte_length integer DEFAULT NULL,p_content_type text DEFAULT NULL,p_verified_path text DEFAULT NULL,p_after uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ BEGIN
 IF p_action IS NULL OR p_action NOT IN('inspect','list') THEN RAISE EXCEPTION 'Upload operation writes stopped' USING ERRCODE='42501';END IF;
 RETURN public.busy_original_upload_retained_impl_v1(p_action,p_business_id,p_actor_id,p_request_key,p_selection_id,p_sha256,p_byte_length,p_content_type,p_verified_path,p_after)||jsonb_build_object('readOnly',true);
END $$;
REVOKE ALL ON FUNCTION public.busy_original_upload_operation_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.busy_original_upload_operation_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid) TO service_role;
COMMIT;
