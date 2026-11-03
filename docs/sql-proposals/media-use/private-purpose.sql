-- Separately reviewed LOCAL proposal; no hosted installation is authorised.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'MEDIA PURPOSE REVIEW FUSE: separate hosted approval required'; END $$;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='busy_website_original_media' AND c.relkind='r' AND c.relowner='postgres'::regrole) THEN RAISE EXCEPTION 'Original registry prerequisite unavailable';END IF;
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='busy_website_original_media' AND column_name IN ('private_use_revision','private_use_decisions','private_use_history')) THEN RAISE EXCEPTION 'Purpose extension already present; never overwrite history';END IF;
 IF to_regprocedure('public.busy_original_media_purpose_v1(text,uuid,uuid,uuid,text,bigint,jsonb,uuid)') IS NOT NULL THEN RAISE EXCEPTION 'Purpose authority already exists';END IF;
END $$;
ALTER TABLE public.busy_website_original_media
 ADD COLUMN private_use_revision bigint NOT NULL DEFAULT 0 CHECK(private_use_revision>=0),
 ADD COLUMN private_use_decisions jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(private_use_decisions)='object' AND octet_length(private_use_decisions::text)<=1024),
 ADD COLUMN private_use_history jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(private_use_history)='array' AND jsonb_array_length(private_use_history)<=512);
CREATE FUNCTION public.busy_original_media_purpose_v1(p_action text,p_business_id uuid,p_actor_id uuid,p_asset_id uuid,p_sha256 text,p_expected_revision bigint DEFAULT NULL,p_decisions jsonb DEFAULT NULL,p_operation_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.busy_website_original_media%rowtype; role_name text; row jsonb; k text; decision text;
BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' OR current_setting('app.busy_private_media_purpose',true) IS DISTINCT FROM 'reviewed-local-only' THEN RAISE EXCEPTION 'Private media purpose authority disabled' USING ERRCODE='42501';END IF;
 IF p_action IS NULL OR p_action NOT IN ('inspect','save') OR p_actor_id IS NULL OR p_sha256 IS NULL OR p_sha256!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid purpose request';END IF;
 SELECT role INTO role_name FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id FOR SHARE;
 IF role_name IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.busy_website_original_media WHERE id=p_asset_id AND business_id=p_business_id AND uploaded_by=p_actor_id AND sha256=p_sha256 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Exact owned original unavailable' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM storage.buckets WHERE id='busy-website-originals' AND public=false FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Private original bucket unavailable' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM storage.objects WHERE bucket_id='busy-website-originals' AND name=a.storage_path FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Original object unavailable' USING ERRCODE='42501';END IF;
 IF p_action='save' THEN
  IF p_operation_id IS NULL OR p_expected_revision IS NULL OR jsonb_typeof(p_decisions) IS DISTINCT FROM 'object' OR octet_length(p_decisions::text)>1024 OR (SELECT count(*) FROM jsonb_object_keys(p_decisions))>5 THEN RAISE EXCEPTION 'Bounded reviewed decisions required';END IF;
  FOR k,decision IN SELECT key,value FROM jsonb_each_text(p_decisions) LOOP
   IF k NOT IN ('website_hero','website_gallery','app_presentation','creator_draft','marketing_material') OR jsonb_typeof(p_decisions->k)<>'string' OR decision NOT IN ('approved','withdrawn') THEN RAISE EXCEPTION 'Unsupported purpose';END IF;
  END LOOP;
  FOR row IN SELECT value FROM jsonb_array_elements(a.private_use_history) LOOP
   IF row->>'operationId'=p_operation_id::text THEN
    IF row->'decisions' IS DISTINCT FROM p_decisions OR (row->>'expectedRevision')::bigint<>p_expected_revision THEN RAISE EXCEPTION 'Operation identity collision';END IF;
    RETURN jsonb_build_object('businessId',p_business_id,'ownerId',p_actor_id,'assetId',a.id,'sha256',a.sha256,'revision',a.private_use_revision,'decisions',a.private_use_decisions,'operationId',p_operation_id,'operationRevision',row->'revision','duplicate',true,'publicUseAuthorised',false,'rightsIndependentlyVerified',false);
   END IF;
  END LOOP;
  IF a.private_use_revision<>p_expected_revision OR jsonb_array_length(a.private_use_history)>=512 THEN RAISE EXCEPTION 'Stale review or history exhausted';END IF;
  a.private_use_revision:=a.private_use_revision+1;a.private_use_decisions:=p_decisions;
  a.private_use_history:=a.private_use_history||jsonb_build_array(jsonb_build_object('operationId',p_operation_id,'expectedRevision',p_expected_revision,'revision',a.private_use_revision,'decisions',p_decisions,'recordedAt',clock_timestamp()));
  UPDATE public.busy_website_original_media SET private_use_revision=a.private_use_revision,private_use_decisions=a.private_use_decisions,private_use_history=a.private_use_history WHERE id=a.id;
 END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',p_actor_id,'assetId',a.id,'sha256',a.sha256,'revision',a.private_use_revision,'decisions',a.private_use_decisions,'notOwnReceipt',p_action='inspect','operationId',CASE WHEN p_action='save' THEN p_operation_id ELSE NULL END,'publicUseAuthorised',false,'rightsIndependentlyVerified',false,'inspectedOperation',(SELECT value FROM jsonb_array_elements(a.private_use_history) WHERE value->>'operationId'=p_operation_id::text));
END $$;
REVOKE ALL ON FUNCTION public.busy_original_media_purpose_v1(text,uuid,uuid,uuid,text,bigint,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.busy_original_media_purpose_v1(text,uuid,uuid,uuid,text,bigint,jsonb,uuid) TO service_role;
COMMENT ON FUNCTION public.busy_original_media_purpose_v1(text,uuid,uuid,uuid,text,bigint,jsonb,uuid) IS 'private_media_purpose_v1; not publication or independent copyright authority';
REVOKE INSERT,UPDATE,DELETE ON public.busy_website_original_media FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE c record;BEGIN FOR c IN SELECT attname FROM pg_attribute WHERE attrelid='public.busy_website_original_media'::regclass AND attnum>0 AND NOT attisdropped LOOP EXECUTE format('REVOKE INSERT (%I),UPDATE (%I) ON public.busy_website_original_media FROM PUBLIC,anon,authenticated,service_role',c.attname,c.attname);END LOOP;END $$;
COMMIT;
