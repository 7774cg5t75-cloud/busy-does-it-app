-- REVIEW ONLY: no ingress/writer added. Extends original authenticated read/review functions.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE FORM ENQUIRY REVIEW FUSE: separate staging approval required';END $$;
SET LOCAL lock_timeout='5s';
ALTER TABLE busy_app_function_private.settings ADD COLUMN form_enquiries_closed boolean NOT NULL DEFAULT false;
CREATE FUNCTION busy_app_function_private.enquiry_form(b uuid,actor uuid,app uuid,d jsonb,require_current boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.busy_mini_apps%ROWTYPE;v busy_app_function_private.versions%ROWTYPE;h busy_app_function_private.heads%ROWTYPE;p busy_app_function_private.screen_versions%ROWTYPE;head busy_app_function_private.screen_heads%ROWTYPE;binding jsonb;f jsonb;r jsonb;closed boolean;current_ok boolean;vals jsonb;active_fields jsonb:='[]';
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=b AND user_id=actor AND role='owner' FOR SHARE) THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE id=app AND business_id=b AND created_by=actor FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Exact original owned App required' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(d) IS DISTINCT FROM 'object' OR NOT(d ?& ARRAY['version','appRevision','placementRevision','placementHash','screenId','functionId','artifactVersion','artifactHash','artifactStateRevision','answers']) OR d-ARRAY['version','appRevision','placementRevision','placementHash','screenId','functionId','artifactVersion','artifactHash','artifactStateRevision','answers']<>'{}' OR d->'version'<>'1' OR octet_length(d::text)>6000 OR jsonb_typeof(d->'answers') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Typed bounded form context required' USING ERRCODE='22023';END IF;
 FOR f IN SELECT value FROM jsonb_array_elements('["appRevision","placementRevision","artifactVersion","artifactStateRevision"]'::jsonb) LOOP IF jsonb_typeof(d->(f#>>'{}')) IS DISTINCT FROM 'number' OR coalesce(d->>(f#>>'{}'),'')!~'^[1-9][0-9]{0,9}$' THEN RAISE EXCEPTION 'Exact numeric source revisions required';END IF;END LOOP;
 SELECT * INTO head FROM busy_app_function_private.screen_heads WHERE app_id=app AND business_id=b AND owner_id=actor FOR SHARE;
 SELECT * INTO p FROM busy_app_function_private.screen_versions WHERE app_id=app AND business_id=b AND owner_id=actor AND revision=(d->>'placementRevision')::int;
 IF NOT FOUND OR p.source_app_revision::text IS DISTINCT FROM d->>'appRevision' OR p.digest IS DISTINCT FROM d->>'placementHash' OR p.digest<>encode(sha256(convert_to(p.canonical_text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Exact immutable placement required' USING ERRCODE='40001';END IF;
 SELECT x INTO binding FROM jsonb_array_elements(p.bindings)x WHERE x->>'screenId'=d->>'screenId';
 IF binding IS NULL OR binding->>'functionId' IS DISTINCT FROM d->>'functionId' OR binding->'version' IS DISTINCT FROM d->'artifactVersion' OR binding->>'hash' IS DISTINCT FROM d->>'artifactHash' OR binding->'stateRevision' IS DISTINCT FROM d->'artifactStateRevision' THEN RAISE EXCEPTION 'Form not bound to exact screen' USING ERRCODE='42501';END IF;
 SELECT * INTO h FROM busy_app_function_private.heads WHERE function_id=(d->>'functionId')::uuid AND app_id=app AND business_id=b AND owner_id=actor FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Foreign artifact' USING ERRCODE='42501';END IF;
 SELECT * INTO v FROM busy_app_function_private.versions WHERE function_id=h.function_id AND version=(d->>'artifactVersion')::int;
 IF NOT FOUND OR v.spec_hash IS DISTINCT FROM d->>'artifactHash' OR v.spec_hash<>encode(sha256(convert_to(v.canonical_text,'UTF8')),'hex') OR v.spec->>'kind'<>'private-form' OR busy_app_function_private.validate_form(v.spec) IS NOT TRUE THEN RAISE EXCEPTION 'Exact reviewed form required' USING ERRCODE='22023';END IF;
 vals:=d->'answers';
 FOR f IN SELECT value FROM jsonb_array_elements(v.spec->'fields') LOOP
  IF f ? 'when' AND vals->(f->'when'->>'field') IS DISTINCT FROM f->'when'->'equals' THEN IF vals ? (f->>'id') THEN RAISE EXCEPTION 'Inactive answers cannot be accepted' USING ERRCODE='22023';END IF;CONTINUE;END IF;
  active_fields:=active_fields||jsonb_build_array(f);
 END LOOP;
 r:=busy_app_function_private.form_result(v.spec,vals);IF r->'valid' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Invalid customer form answers' USING ERRCODE='22023';END IF;
 SELECT execution_closed OR screens_closed OR form_enquiries_closed INTO closed FROM busy_app_function_private.settings WHERE id;
 current_ok:=coalesce(NOT closed AND NOT h.disabled AND h.current_version=v.version AND h.revision=(d->>'artifactStateRevision')::bigint AND head.revision=p.revision AND a.draft_revision=p.source_app_revision AND EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'=d->>'screenId' AND m->'enabled'='true') AND EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'='enquiry' AND m->'enabled'='true'),false);
 IF require_current AND NOT current_ok THEN RAISE EXCEPTION 'Form or placement changed or disabled' USING ERRCODE='40001';END IF;
 RETURN jsonb_build_object('version',1,'authority','busy_private_form_enquiry_v1','businessId',b,'ownerId',actor,'appId',app,'definition',d-'answers','title',v.spec->'title','fields',active_fields,'answers',vals,'outputs',r->'outputs','sourceCurrent',current_ok,'privateOnly',true,'submissionVerified',false);
END $$;
CREATE FUNCTION busy_snapshot_private.form_enquiry_context(b uuid,rid uuid,expected_hash text,require_current boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_snapshot_private.lock_writer(b);r public.busy_mini_app_requests%ROWTYPE;hash text;context jsonb;a public.busy_mini_apps%ROWTYPE;refs text[];n int;service_name text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=b AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE business_id=b AND id=rid FOR SHARE;
 IF NOT FOUND OR r.request_type<>'enquiry' OR r.module_key<>'enquiry' THEN RAISE EXCEPTION 'Exact original enquiry required' USING ERRCODE='42501';END IF;
 hash:=encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex');IF expected_hash IS NOT NULL AND expected_hash IS DISTINCT FROM hash THEN RAISE EXCEPTION 'Original request changed' USING ERRCODE='40001';END IF;
 IF NOT(r.payload ? 'privateForm') THEN RETURN NULL;END IF;
 IF require_current AND position('Service reference:' IN coalesce(r.payload->>'message',''))>0 THEN
  -- The reference is only a selector. Current original App records establish the facts.
  SELECT count(*) INTO n FROM regexp_matches(r.payload->>'message','^Service reference: ([A-Za-z0-9_-]{1,80}) / app draft revision ([1-9][0-9]{0,9})\.$','gn');
  SELECT x INTO refs FROM regexp_matches(r.payload->>'message','^Service reference: ([A-Za-z0-9_-]{1,80}) / app draft revision ([1-9][0-9]{0,9})\.$','n')x;
  IF n<>1 OR (length(r.payload->>'message')-length(replace(r.payload->>'message','Service reference:','')))<>length('Service reference:') OR position('Listing reference:' IN r.payload->>'message')>0 THEN RAISE EXCEPTION 'Exact unambiguous service selector required' USING ERRCODE='22023';END IF;
  SELECT * INTO a FROM public.busy_mini_apps WHERE id=r.mini_app_id AND business_id=b AND created_by=actor FOR SHARE;
  IF NOT FOUND OR a.draft_revision::text IS DISTINCT FROM refs[2] OR jsonb_typeof(a.draft_config#>'{publicProfile,services}') IS DISTINCT FROM 'array' OR jsonb_array_length(a.draft_config#>'{publicProfile,services}')>40 OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'='services' AND m->'enabled'='true') THEN RAISE EXCEPTION 'Current original service source required' USING ERRCODE='40001';END IF;
  SELECT count(*),min(x->>'name') INTO n,service_name FROM jsonb_array_elements(a.draft_config#>'{publicProfile,services}')x WHERE x->>'id'=refs[1] AND jsonb_typeof(x->'name')='string';
  IF n<>1 OR service_name IS DISTINCT FROM r.service_name OR service_name IS DISTINCT FROM r.payload->>'service' THEN RAISE EXCEPTION 'Exact original service identity required' USING ERRCODE='42501';END IF;
 END IF;
 context:=busy_app_function_private.enquiry_form(b,actor,r.mini_app_id,r.payload->'privateForm',require_current);
 RETURN context||jsonb_build_object('requestId',rid,'requestHash',hash);
END $$;
-- Historical projections derive labels from the exact immutable accepted version,
-- never from today's form or free-text prefixes. Original hashes/guards are retained.
CREATE FUNCTION busy_snapshot_private.stamp_form_enquiry(b uuid,eid text,f jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE snap public.busy_business_snapshots%ROWTYPE;e jsonb;p jsonb;
BEGIN
 IF f IS NULL THEN RETURN;END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=b FOR UPDATE;SELECT x INTO e FROM jsonb_array_elements(snap.payload->'inboxItems')x WHERE x->>'id'=eid;
 IF e->>'status' IS DISTINCT FROM 'Filed' OR e->>'registeredBy' IS DISTINCT FROM auth.uid()::text OR e#>>'{miniAppOrigin,requestId}' IS DISTINCT FROM f->>'requestId' OR e#>>'{miniAppOrigin,requestHash}' IS DISTINCT FROM f->>'requestHash' THEN RAISE EXCEPTION 'Exact filed form source required';END IF;
 p:=jsonb_build_object('version',1,'authority','busy_private_form_filing_v1','enquiryId',eid,'customerId',e->'filedCustomerId','messageHash',encode(sha256(convert_to(e->>'rawText','UTF8')),'hex'),'context',f);p:=p||jsonb_build_object('integrity',encode(sha256(convert_to(p::text,'UTF8')),'hex'));
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{inboxItems}',(SELECT jsonb_agg(CASE WHEN x->>'id'=eid THEN x||jsonb_build_object('formProvenance',p) ELSE x END ORDER BY n) FROM jsonb_array_elements(payload->'inboxItems') WITH ORDINALITY z(x,n))) WHERE business_id=b;
END $$;
CREATE FUNCTION busy_snapshot_private.filed_form_context(b uuid,e jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_snapshot_private.lock_writer(b);p jsonb:=e->'formProvenance';c jsonb:=p->'context';fresh jsonb;
BEGIN
 IF p IS NULL THEN RETURN NULL;END IF;
 IF p->'version' IS DISTINCT FROM '1' OR p->>'authority' IS DISTINCT FROM 'busy_private_form_filing_v1' OR p-ARRAY['version','authority','enquiryId','customerId','messageHash','context','integrity']<>'{}' OR p->>'integrity' IS DISTINCT FROM encode(sha256(convert_to((p-'integrity')::text,'UTF8')),'hex') OR p->>'enquiryId' IS DISTINCT FROM e->>'id' OR p->>'customerId' IS DISTINCT FROM e->>'filedCustomerId' OR p->>'messageHash' IS DISTINCT FROM encode(sha256(convert_to(e->>'rawText','UTF8')),'hex') OR c->>'ownerId' IS DISTINCT FROM actor::text OR c->>'businessId' IS DISTINCT FROM b::text OR c->>'requestId' IS DISTINCT FROM e#>>'{miniAppOrigin,requestId}' OR c->>'requestHash' IS DISTINCT FROM e#>>'{miniAppOrigin,requestHash}' OR c->>'appId' IS DISTINCT FROM e#>>'{miniAppOrigin,appId}' THEN RAISE EXCEPTION 'Unsupported filed form provenance' USING ERRCODE='42501';END IF;
 fresh:=busy_app_function_private.enquiry_form(b,actor,(c->>'appId')::uuid,(c->'definition')||jsonb_build_object('answers',c->'answers'),false)||jsonb_build_object('requestId',c->'requestId','requestHash',c->'requestHash');
 IF fresh-'sourceCurrent' IS DISTINCT FROM c-'sourceCurrent' THEN RAISE EXCEPTION 'Historical form evidence changed' USING ERRCODE='22023';END IF;RETURN fresh;
END $$;
ALTER FUNCTION busy_snapshot_private.file_app_enquiry_v2(uuid,bigint,jsonb) RENAME TO form_base_repeated_file;
CREATE FUNCTION busy_snapshot_private.file_app_enquiry_v2(p_business_id uuid,p_expected_revision bigint,p_capture jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_snapshot_private.lock_writer(p_business_id);snap public.busy_business_snapshots%ROWTYPE;e jsonb;f jsonb;r jsonb;
BEGIN
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;SELECT x INTO e FROM jsonb_array_elements(snap.payload->'inboxItems')x WHERE x->>'id'=p_capture->>'enquiryId';
 IF e#>>'{miniAppOrigin,requestId}' IS NOT NULL THEN f:=busy_snapshot_private.form_enquiry_context(p_business_id,(e#>>'{miniAppOrigin,requestId}')::uuid,e#>>'{miniAppOrigin,requestHash}',true);END IF;
 r:=busy_snapshot_private.form_base_repeated_file(p_business_id,p_expected_revision,p_capture);PERFORM busy_snapshot_private.stamp_form_enquiry(p_business_id,p_capture->>'enquiryId',f);RETURN r;
END $$;
REVOKE ALL ON FUNCTION busy_snapshot_private.stamp_form_enquiry(uuid,text,jsonb),busy_snapshot_private.filed_form_context(uuid,jsonb),busy_snapshot_private.form_base_repeated_file(uuid,bigint,jsonb),busy_snapshot_private.file_app_enquiry_v2(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid) RENAME TO form_base_app_review;
ALTER FUNCTION public.form_base_app_review(uuid,uuid) SET SCHEMA busy_snapshot_private;
CREATE FUNCTION public.busy_connected_app_enquiry_review_v1(p_business_id uuid,p_request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r jsonb:=busy_snapshot_private.form_base_app_review(p_business_id,p_request_id);f jsonb;
BEGIN f:=busy_snapshot_private.form_enquiry_context(p_business_id,p_request_id,r->>'requestHash',true);RETURN r||CASE WHEN f IS NULL THEN '{}' ELSE jsonb_build_object('formContext',f) END;END $$;
-- The original first-capture RPC is another legitimate filing caller. It must
-- enforce the same form source guard, not bypass it through the legacy path.
ALTER FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) RENAME TO form_base_first_enquiry;
ALTER FUNCTION public.form_base_first_enquiry(uuid,bigint,jsonb) SET SCHEMA busy_snapshot_private;
CREATE FUNCTION public.busy_owner_first_enquiry_v1(p_business_id uuid,p_expected_revision bigint,p_capture jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_snapshot_private.lock_writer(p_business_id);snap public.busy_business_snapshots%ROWTYPE;e jsonb;f jsonb;r jsonb;
BEGIN
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 SELECT x INTO e FROM jsonb_array_elements(snap.payload->'inboxItems')x WHERE x->>'id'=p_capture->>'enquiryId';
 IF e#>>'{miniAppOrigin,requestId}' IS NOT NULL THEN f:=busy_snapshot_private.form_enquiry_context(p_business_id,(e#>>'{miniAppOrigin,requestId}')::uuid,e#>>'{miniAppOrigin,requestHash}',true);END IF;
 r:=busy_snapshot_private.form_base_first_enquiry(p_business_id,p_expected_revision,p_capture);PERFORM busy_snapshot_private.stamp_form_enquiry(p_business_id,p_capture->>'enquiryId',f);RETURN r;
END $$;
REVOKE ALL ON FUNCTION busy_snapshot_private.form_base_first_enquiry(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) TO authenticated;
ALTER FUNCTION public.busy_owner_first_reply_review_v1(uuid,bigint,text,text) RENAME TO form_base_filed_review;
ALTER FUNCTION public.form_base_filed_review(uuid,bigint,text,text) SET SCHEMA busy_snapshot_private;
CREATE FUNCTION public.busy_owner_first_reply_review_v1(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r jsonb:=busy_snapshot_private.form_base_filed_review(p_business_id,p_expected_revision,p_customer_id,p_enquiry_id);e jsonb:=r->'enquiry';original jsonb;f jsonb;
BEGIN SELECT x INTO original FROM public.busy_business_snapshots snap CROSS JOIN LATERAL jsonb_array_elements(snap.payload->'inboxItems')x WHERE snap.business_id=p_business_id AND x->>'id'=p_enquiry_id;f:=busy_snapshot_private.filed_form_context(p_business_id,original);RETURN CASE WHEN f IS NULL THEN r ELSE jsonb_set(r,'{enquiry}',e||jsonb_build_object('formContext',f)) END;END $$;
ALTER FUNCTION public.busy_work_source_review_v1(uuid,text,text,bigint) RENAME TO form_base_work_review;
ALTER FUNCTION public.form_base_work_review(uuid,text,text,bigint) SET SCHEMA busy_work_private;
CREATE FUNCTION public.busy_work_source_review_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r jsonb:=busy_work_private.form_base_work_review(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);snap public.busy_business_snapshots%ROWTYPE;e jsonb;f jsonb;
BEGIN
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id;SELECT x INTO e FROM jsonb_array_elements(snap.payload->'inboxItems')x WHERE x->>'id'=p_enquiry_id;
 f:=busy_snapshot_private.filed_form_context(p_business_id,e);
 RETURN CASE WHEN f IS NULL THEN r ELSE jsonb_set(r,'{enquiry}',r->'enquiry'||jsonb_build_object('miniAppOrigin',e->'miniAppOrigin','formContext',f)) END;
END $$;
REVOKE ALL ON FUNCTION busy_app_function_private.enquiry_form(uuid,uuid,uuid,jsonb,boolean),busy_snapshot_private.form_enquiry_context(uuid,uuid,text,boolean),busy_snapshot_private.form_base_app_review(uuid,uuid),busy_snapshot_private.form_base_filed_review(uuid,bigint,text,text),busy_work_private.form_base_work_review(uuid,text,text,bigint) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid),public.busy_owner_first_reply_review_v1(uuid,bigint,text,text),public.busy_work_source_review_v1(uuid,text,text,bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid),public.busy_owner_first_reply_review_v1(uuid,bigint,text,text),public.busy_work_source_review_v1(uuid,text,text,bigint) TO authenticated;
ALTER FUNCTION busy_app_function_private.enquiry_form(uuid,uuid,uuid,jsonb,boolean) OWNER TO postgres;
ALTER FUNCTION busy_snapshot_private.form_enquiry_context(uuid,uuid,text,boolean) OWNER TO postgres;
ALTER FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid) OWNER TO postgres;
ALTER FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) OWNER TO postgres;
ALTER FUNCTION public.busy_owner_first_reply_review_v1(uuid,bigint,text,text) OWNER TO postgres;
ALTER FUNCTION public.busy_work_source_review_v1(uuid,text,text,bigint) OWNER TO postgres;
ALTER FUNCTION busy_snapshot_private.stamp_form_enquiry(uuid,text,jsonb) OWNER TO postgres;
ALTER FUNCTION busy_snapshot_private.filed_form_context(uuid,jsonb) OWNER TO postgres;
ALTER FUNCTION busy_snapshot_private.file_app_enquiry_v2(uuid,bigint,jsonb) OWNER TO postgres;
COMMIT;
