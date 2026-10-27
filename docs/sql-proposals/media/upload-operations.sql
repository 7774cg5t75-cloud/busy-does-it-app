-- LOCAL CANDIDATE ONLY. Original private-media gateway subordinate operations.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'ORIGINAL UPLOAD OPERATION REVIEW FUSE: hosted approval required'; END $$;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='busy_original_upload_operations' AND (c.relowner<>'postgres'::regrole OR obj_description(c.oid,'pg_class') IS DISTINCT FROM 'original_upload_operations_v1')) THEN RAISE EXCEPTION 'Untrusted upload operation table' USING ERRCODE='42501';END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='busy_original_upload_operation_v1' AND p.proowner<>'postgres'::regrole) THEN RAISE EXCEPTION 'Untrusted upload function' USING ERRCODE='42501';END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.busy_original_upload_operations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES public.busy_businesses(id) ON DELETE RESTRICT,
 owner_id uuid NOT NULL,request_key text NOT NULL CHECK(request_key ~ '^[A-Za-z0-9_-]{8,120}$'),selection_id text NOT NULL CHECK(selection_id ~ '^[A-Za-z0-9_-]{1,120}$'),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),byte_length integer NOT NULL CHECK(byte_length BETWEEN 20 AND 9437184),content_type text NOT NULL CHECK(content_type IN('image/jpeg','image/png','image/webp')),
 planned_path text NOT NULL UNIQUE,state text NOT NULL DEFAULT 'pending' CHECK(state IN('pending','committed')),revision integer NOT NULL DEFAULT 1,
 asset_id uuid REFERENCES public.busy_website_original_media(id) ON DELETE RESTRICT,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),committed_at timestamptz,
 UNIQUE(business_id,owner_id,request_key),CHECK((state='pending' AND revision=1 AND asset_id IS NULL AND committed_at IS NULL)OR(state='committed' AND revision=2 AND asset_id IS NOT NULL AND committed_at IS NOT NULL))
);
COMMENT ON TABLE public.busy_original_upload_operations IS 'original_upload_operations_v1';
CREATE INDEX IF NOT EXISTS busy_original_upload_owner_page ON public.busy_original_upload_operations(business_id,owner_id,id);
ALTER TABLE public.busy_original_upload_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.busy_original_upload_operations FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.busy_original_upload_operation_v1(p_action text,p_business_id uuid,p_actor_id uuid,p_request_key text DEFAULT NULL,p_selection_id text DEFAULT NULL,p_sha256 text DEFAULT NULL,p_byte_length integer DEFAULT NULL,p_content_type text DEFAULT NULL,p_verified_path text DEFAULT NULL,p_after uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE creator uuid;member text;op public.busy_original_upload_operations%ROWTYPE;asset public.busy_website_original_media%ROWTYPE;fresh boolean:=false;own_receipt boolean:=false;path text;result jsonb;items jsonb;
BEGIN
 IF p_action IS NULL OR p_action NOT IN('begin','inspect','commit','list') OR p_business_id IS NULL OR p_actor_id IS NULL THEN RAISE EXCEPTION 'Invalid upload scope/action' USING ERRCODE='22023';END IF;
 SELECT created_by INTO creator FROM public.busy_businesses WHERE id=p_business_id FOR SHARE;
 SELECT role INTO member FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id FOR SHARE;
 IF creator IS DISTINCT FROM p_actor_id OR member IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Current original creator owner required' USING ERRCODE='42501';END IF;
 IF p_action='list' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('operationId',t.id,'requestKey',t.request_key,'selectionId',t.selection_id,'state',t.state,'revision',t.revision,'recordedAt',t.recorded_at)ORDER BY t.id),'[]') INTO items FROM(SELECT * FROM public.busy_original_upload_operations WHERE business_id=p_business_id AND owner_id=p_actor_id AND(p_after IS NULL OR id>p_after)ORDER BY id LIMIT 20)t;
  RETURN jsonb_build_object('businessId',p_business_id,'ownerId',p_actor_id,'items',items,'nextAfter',CASE WHEN jsonb_array_length(items)=20 THEN items->19->>'operationId' ELSE NULL END,'notOwnReceipt',true);
 END IF;
 IF p_request_key IS NULL OR p_request_key!~'^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Exact request key required' USING ERRCODE='22023';END IF;
 IF p_action='begin' THEN
  IF p_selection_id IS NULL OR p_selection_id!~'^[A-Za-z0-9_-]{1,120}$' OR p_sha256 IS NULL OR p_sha256!~'^[a-f0-9]{64}$' OR p_byte_length IS NULL OR p_byte_length NOT BETWEEN 20 AND 9437184 OR p_content_type IS NULL OR p_content_type NOT IN('image/jpeg','image/png','image/webp') THEN RAISE EXCEPTION 'Trusted verified byte metadata required' USING ERRCODE='22023';END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_business_id::text||'/'||p_actor_id::text,7115));
  IF NOT EXISTS(SELECT 1 FROM public.busy_original_upload_operations WHERE business_id=p_business_id AND owner_id=p_actor_id AND request_key=p_request_key) AND (SELECT count(*) FROM public.busy_original_upload_operations WHERE business_id=p_business_id AND owner_id=p_actor_id AND recorded_at>clock_timestamp()-interval '1 hour')>=60 THEN RAISE EXCEPTION 'Private original operation allowance reached' USING ERRCODE='53000';END IF;
  path:=p_business_id::text||'/'||p_actor_id::text||'/'||gen_random_uuid()::text||CASE p_content_type WHEN 'image/png' THEN '.png' WHEN 'image/webp' THEN '.webp' ELSE '.jpg' END;
  INSERT INTO public.busy_original_upload_operations(business_id,owner_id,request_key,selection_id,sha256,byte_length,content_type,planned_path)VALUES(p_business_id,p_actor_id,p_request_key,p_selection_id,p_sha256,p_byte_length,p_content_type,path)ON CONFLICT(business_id,owner_id,request_key)DO NOTHING RETURNING * INTO op;
  fresh:=FOUND;
 END IF;
 SELECT * INTO op FROM public.busy_original_upload_operations WHERE business_id=p_business_id AND owner_id=p_actor_id AND request_key=p_request_key FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('businessId',p_business_id,'ownerId',p_actor_id,'found',false,'notOwnReceipt',true);END IF;
 IF p_action='begin' AND(op.selection_id IS DISTINCT FROM p_selection_id OR op.sha256 IS DISTINCT FROM p_sha256 OR op.byte_length IS DISTINCT FROM p_byte_length OR op.content_type IS DISTINCT FROM p_content_type)THEN RAISE EXCEPTION 'Upload request identity collision' USING ERRCODE='40001';END IF;
 IF p_action='commit' AND op.state='pending' THEN
  IF p_verified_path IS NULL OR p_verified_path!~('^'||p_business_id::text||'/'||p_actor_id::text||'/[a-f0-9-]{36}\.(png|jpg|webp)$') OR NOT EXISTS(SELECT 1 FROM storage.objects o JOIN storage.buckets b ON b.id=o.bucket_id AND b.public=false WHERE o.bucket_id='busy-website-originals' AND o.name=p_verified_path) THEN RAISE EXCEPTION 'Verified original object required' USING ERRCODE='42501';END IF;
  -- Storage bytes are verified by the original trusted gateway immediately
  -- before this finite call. This transaction binds registry + operation only.
  INSERT INTO public.busy_website_original_media(business_id,uploaded_by,storage_path,content_type,byte_length,sha256)VALUES(p_business_id,p_actor_id,p_verified_path,op.content_type,op.byte_length,op.sha256)ON CONFLICT(business_id,uploaded_by,sha256)DO NOTHING;
  SELECT * INTO asset FROM public.busy_website_original_media WHERE business_id=p_business_id AND uploaded_by=p_actor_id AND sha256=op.sha256 FOR SHARE;
  IF asset.storage_path IS DISTINCT FROM p_verified_path OR asset.byte_length IS DISTINCT FROM op.byte_length OR asset.content_type IS DISTINCT FROM op.content_type THEN RAISE EXCEPTION 'Original asset changed; independently inspect operation' USING ERRCODE='40001';END IF;
  UPDATE public.busy_original_upload_operations SET state='committed',revision=2,asset_id=asset.id,committed_at=clock_timestamp()WHERE id=op.id RETURNING * INTO op;own_receipt:=true;
 END IF;
 SELECT * INTO asset FROM public.busy_website_original_media WHERE id=op.asset_id;
 result:=jsonb_build_object('businessId',p_business_id,'ownerId',p_actor_id,'found',true,'operationId',op.id,'requestKey',op.request_key,'selectionId',op.selection_id,'state',op.state,'revision',op.revision,'sha256',op.sha256,'bytes',op.byte_length,'contentType',op.content_type,'plannedPath',op.planned_path,'storagePath',asset.storage_path,'assetId',asset.id,'assetEligible',coalesce(asset.business_id=op.business_id AND asset.uploaded_by=op.owner_id AND asset.sha256=op.sha256 AND asset.byte_length=op.byte_length AND asset.content_type=op.content_type AND EXISTS(SELECT 1 FROM storage.objects o JOIN storage.buckets b ON b.id=o.bucket_id AND b.public=false WHERE o.bucket_id='busy-website-originals' AND o.name=asset.storage_path),false),'recordedAt',op.recorded_at,'committedAt',op.committed_at,'mayUpload',fresh,'ownOperationReceipt',own_receipt,'notOwnReceipt',NOT own_receipt);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.busy_original_upload_operation_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.busy_original_upload_operation_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid) TO service_role;
DO $$ BEGIN
 IF has_function_privilege('anon','public.busy_original_upload_operation_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid)','EXECUTE') OR has_function_privilege('authenticated','public.busy_original_upload_operation_v1(text,uuid,uuid,text,text,text,integer,text,text,uuid)','EXECUTE') OR has_table_privilege('authenticated','public.busy_original_upload_operations','SELECT,INSERT,UPDATE,DELETE') THEN RAISE EXCEPTION 'Unexpected effective upload privileges' USING ERRCODE='42501';END IF;
END $$;
COMMIT;
