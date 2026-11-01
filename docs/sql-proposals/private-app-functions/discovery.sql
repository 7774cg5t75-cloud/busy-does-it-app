-- REVIEW ONLY. Original App/publication authority; no hosted installation.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'FORM DISCOVERY REVIEW FUSE: separate hosted approval required';END $$;
ALTER TABLE public.busy_mini_app_guest_challenges ADD COLUMN form_receipt_window timestamptz,ADD COLUMN form_receipt_reads integer NOT NULL DEFAULT 0 CHECK(form_receipt_reads BETWEEN 0 AND 20);
CREATE OR REPLACE FUNCTION busy_app_function_private.publication_permission(d busy_app_function_private.disclosures) RETURNS busy_app_function_private.publication_approvals LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p busy_app_function_private.publication_approvals%ROWTYPE;latest uuid;stamp timestamptz;n integer;
BEGIN
 IF (SELECT publications_closed FROM busy_app_function_private.settings WHERE settings.id FOR SHARE) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Form publication is closed';END IF;
 SELECT pa.disclosure_id,pa.approved_at INTO latest,stamp FROM busy_app_function_private.publication_approvals pa JOIN busy_app_function_private.disclosures x ON x.id=pa.disclosure_id WHERE pa.app_id=d.app_id AND pa.business_id=d.business_id AND pa.owner_id=d.owner_id AND pa.app_version_id=d.published_version_id AND x.basis->>'screenId'=d.basis->>'screenId' ORDER BY pa.approved_at DESC LIMIT 1;
 SELECT count(*) INTO n FROM busy_app_function_private.publication_approvals pa JOIN busy_app_function_private.disclosures x ON x.id=pa.disclosure_id WHERE pa.app_id=d.app_id AND pa.app_version_id=d.published_version_id AND x.basis->>'screenId'=d.basis->>'screenId' AND pa.approved_at=stamp;
 IF latest IS DISTINCT FROM d.id OR n<>1 THEN RAISE EXCEPTION 'Public entry changed or is ambiguous';END IF;
 SELECT * INTO p FROM busy_app_function_private.publication_approvals WHERE disclosure_id=d.id AND app_id=d.app_id AND business_id=d.business_id AND owner_id=d.owner_id AND app_version_id=d.published_version_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Separate exact publication approval required';END IF;RETURN p;
END $$;
CREATE FUNCTION public.busy_form_guest_catalog_v1(app uuid,version uuid,screen text,interest jsonb,h text,f text,seed text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.busy_mini_apps%ROWTYPE;d busy_app_function_private.disclosures%ROWTYPE;p busy_app_function_private.publication_approvals%ROWTYPE;c public.busy_business_content%ROWTYPE;projection jsonb;entries jsonb:='[]';
BEGIN
 SELECT * INTO a FROM public.busy_mini_apps WHERE id=app;
 IF NOT FOUND OR a.current_live_version_id IS DISTINCT FROM version OR screen NOT IN ('business_profile','services','contact') OR screen IS NULL THEN RAISE EXCEPTION 'Exact public app section required';END IF;
 PERFORM busy_guest_admission_private.lock_source(a.business_id,a.id,version,'enquiry');
 IF (SELECT publications_closed OR disclosures_closed FROM busy_app_function_private.settings WHERE settings.id) IS DISTINCT FROM false THEN RAISE EXCEPTION 'Form discovery is closed';END IF;
 IF interest IS NOT NULL AND interest<>'null' THEN
  IF jsonb_typeof(interest) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Typed original interest required';END IF;
  IF interest->>'kind'='service' THEN
   IF interest-ARRAY['kind','serviceId']<>'{}' OR (SELECT count(*) FROM jsonb_array_elements(a.draft_config#>'{publicProfile,services}')x WHERE x->>'id'=interest->>'serviceId')<>1 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'='services' AND m->'enabled'='true') THEN RAISE EXCEPTION 'Current original service required';END IF;
  ELSIF interest->>'kind'='listing' THEN
   IF interest-ARRAY['kind','recordId','revision','variantId']<>'{}' OR jsonb_typeof(interest->'revision') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Exact listing selection required';END IF;
   SELECT * INTO c FROM public.busy_business_content WHERE business_id=a.business_id AND id=interest->>'recordId' FOR SHARE;
   IF NOT FOUND OR c.kind NOT IN ('product','event') OR to_jsonb(c.published_revision) IS DISTINCT FROM interest->'revision' OR c.published->>'status' IS DISTINCT FROM (CASE c.kind WHEN 'product' THEN 'active' ELSE 'scheduled' END) OR (c.kind='event' AND ((c.published->>'endsAt')::timestamptz<=clock_timestamp() OR interest->>'variantId' IS NOT NULL)) OR (interest->>'variantId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c.published->'variants')x WHERE x->>'id'=interest->>'variantId')) THEN RAISE EXCEPTION 'Current approved listing/option required';END IF;
  ELSE RAISE EXCEPTION 'Unsupported interest';END IF;
 END IF;
 -- Reuse the existing atomic read/admission quota; no token is disclosed for this unused challenge.
 PERFORM public.busy_mini_app_guest_challenge_v1(a.business_id,a.id,version,'enquiry',h,f,seed);
 SELECT x.* INTO d FROM busy_app_function_private.publication_approvals pa JOIN busy_app_function_private.disclosures x ON x.id=pa.disclosure_id WHERE pa.app_id=a.id AND pa.app_version_id=version AND x.basis->>'screenId'=screen ORDER BY pa.approved_at DESC LIMIT 1;
 IF FOUND THEN
  BEGIN
   p:=busy_app_function_private.publication_permission(d);projection:=public.busy_form_disclosure_read_v1(d.id);
   entries:=jsonb_build_array(jsonb_build_object('id',d.id,'appId',a.id,'appVersionId',version,'screenId',screen,'title',projection->'title','submissionPermitted',p.allow_submission AND d.allow_enquiries AND NOT (SELECT public_form_requests_closed FROM busy_app_function_private.settings WHERE settings.id),'interest',interest));
  EXCEPTION WHEN OTHERS THEN entries:='[]';END;
 END IF;
 RETURN jsonb_build_object('appId',a.id,'appVersionId',version,'screenId',screen,'entries',entries);
END $$;
-- Historical public-safe questions are returned only after the original exact receipt proof succeeds.
ALTER FUNCTION public.busy_form_guest_receipt_v1(uuid,text,text,integer,text) RENAME TO busy_form_guest_receipt_original_v1;
REVOKE ALL ON FUNCTION public.busy_form_guest_receipt_original_v1(uuid,text,text,integer,text) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.busy_form_guest_receipt_v1(challenge uuid,token text,fingerprint text,solution integer,key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r jsonb;p jsonb;c public.busy_mini_app_guest_challenges%ROWTYPE;
BEGIN
 r:=public.busy_form_guest_receipt_original_v1(challenge,token,fingerprint,solution,key);
 SELECT * INTO c FROM public.busy_mini_app_guest_challenges WHERE id=challenge FOR UPDATE;IF c.form_receipt_window IS NULL OR c.form_receipt_window<clock_timestamp()-interval '1 hour' THEN c.form_receipt_window:=clock_timestamp();c.form_receipt_reads:=0;END IF;IF c.form_receipt_reads>=20 THEN RAISE EXCEPTION 'Receipt inspection quota reached';END IF;UPDATE public.busy_mini_app_guest_challenges SET form_receipt_window=c.form_receipt_window,form_receipt_reads=c.form_receipt_reads+1 WHERE id=challenge;
 SELECT projection INTO p FROM busy_app_function_private.disclosures WHERE id=(r->>'formId')::uuid AND app_id=(r->>'appId')::uuid AND published_version_id=(r->>'appVersionId')::uuid;
 IF p IS NULL THEN RAISE EXCEPTION 'Exact historical questions unavailable';END IF;RETURN r||jsonb_build_object('projection',p);
END $$;
REVOKE ALL ON FUNCTION public.busy_form_guest_catalog_v1(uuid,uuid,text,jsonb,text,text,text),public.busy_form_guest_receipt_v1(uuid,text,text,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_form_guest_catalog_v1(uuid,uuid,text,jsonb,text,text,text),public.busy_form_guest_receipt_v1(uuid,text,text,integer,text) TO service_role;
ALTER FUNCTION public.busy_form_guest_catalog_v1(uuid,uuid,text,jsonb,text,text,text) OWNER TO postgres;
ALTER FUNCTION public.busy_form_guest_receipt_v1(uuid,text,text,integer,text) OWNER TO postgres;
COMMIT;
