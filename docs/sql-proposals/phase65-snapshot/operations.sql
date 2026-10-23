-- Non-deployed review candidate. Existing original row and trusted lock boundary.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PHASE65 REVIEW FUSE: source, filing and reply cutover require separate staging approval'; END $$;
CREATE FUNCTION public.busy_owner_pending_review_v1(p_business_id uuid,p_expected_revision bigint,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;item jsonb;n int;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 OR snap.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR p_enquiry_id IS NULL OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'Unsupported source' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF n<>1 THEN RAISE EXCEPTION 'Ambiguous source' USING ERRCODE='22023';END IF;
 SELECT x INTO item FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF item ? 'version' OR item->>'status' IS DISTINCT FROM 'Pending' OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM p_business_id::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Wrong source' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR octet_length(item->>'rawText')>10000 OR length(item->>'source')>240 OR btrim(item->>'rawText')='' OR jsonb_typeof(item->'source') IS DISTINCT FROM 'string' OR (item ? 'screenshots' AND item->'screenshots'<>'[]') OR (item ? 'aiAnalysis' AND item->'aiAnalysis'<>'null') OR coalesce(item->>'visionPending','false')<>'false' OR (item->'parsed' ? 'stage' AND item->'parsed'->>'stage'<>'Enquiry') THEN RAISE EXCEPTION 'Unsupported source' USING ERRCODE='22023';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'revision',snap.revision,'schemaVersion',1,'sourceHash',encode(sha256(convert_to(item::text,'UTF8')),'hex'),'pending',jsonb_build_object('id',p_enquiry_id,'rawText',item->'rawText','source',item->'source'));
END $$;
ALTER FUNCTION public.busy_owner_pending_review_v1(uuid,bigint,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_pending_review_v1(uuid,bigint,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_pending_review_v1(uuid,bigint,text) TO authenticated;

CREATE FUNCTION public.busy_owner_manual_source_v1(p_business_id uuid,p_expected_revision bigint,p_enquiry_id text,p_raw_text text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;item jsonb;ts timestamptz:=clock_timestamp();
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 IF p_enquiry_id IS NULL OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 OR p_enquiry_id !~ '^[A-Za-z0-9_-]+$' OR p_raw_text IS NULL OR btrim(p_raw_text)='' OR octet_length(p_raw_text)>10000 THEN RAISE EXCEPTION 'Invalid manual source' USING ERRCODE='22023';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 OR snap.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(snap.payload) IS DISTINCT FROM 'object' OR (snap.payload ? 'customers' AND snap.payload->'customers'<>'[]') OR (snap.payload ? 'intakeLog' AND snap.payload->'intakeLog'<>'[]') OR (snap.payload ? 'inboxItems' AND snap.payload->'inboxItems'<>'[]') THEN RAISE EXCEPTION 'Only an empty initial intake is supported' USING ERRCODE='22023';END IF;
 item:=jsonb_build_object('id',p_enquiry_id,'status','Pending','source','Owner-supplied manual capture','rawText',p_raw_text,'queuedAt',to_char(ts AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'sourceOrigin','owner-manual','registeredBy',actor);
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(snap.payload,'{inboxItems}',jsonb_build_array(item)),revision=snap.revision+1,updated_at=ts WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation','manual_source_registration','enquiryId',p_enquiry_id,'previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',1);
END $$;
ALTER FUNCTION public.busy_owner_manual_source_v1(uuid,bigint,text,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_manual_source_v1(uuid,bigint,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_manual_source_v1(uuid,bigint,text,text) TO authenticated;

CREATE FUNCTION busy_snapshot_private.initial_reply_context(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;c jsonb;e jsonb;source jsonb;n int;k text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 OR snap.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF p_customer_id IS NULL OR p_enquiry_id IS NULL OR length(p_customer_id) NOT BETWEEN 1 AND 240 OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 OR jsonb_typeof(snap.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR jsonb_array_length(snap.payload->'customers')>1000 OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'Unsupported collections' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'customers') x WHERE x->>'id'=p_customer_id;
 IF n<>1 THEN RAISE EXCEPTION 'Ambiguous customer' USING ERRCODE='22023';END IF;
 SELECT x INTO c FROM jsonb_array_elements(snap.payload->'customers') x WHERE x->>'id'=p_customer_id;
 SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF n<>1 THEN RAISE EXCEPTION 'Ambiguous enquiry' USING ERRCODE='22023';END IF;
 SELECT x INTO e FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF (c ? 'businessId' AND c->>'businessId' IS DISTINCT FROM p_business_id::text) OR (c ? 'business_id' AND c->>'business_id' IS DISTINCT FROM p_business_id::text) OR (e ? 'businessId' AND e->>'businessId' IS DISTINCT FROM p_business_id::text) OR (e ? 'business_id' AND e->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Wrong source scope' USING ERRCODE='42501';END IF;
 FOREACH k IN ARRAY ARRAY['id','name','service','phone','email','address'] LOOP IF c ? k AND (jsonb_typeof(c->k) IS DISTINCT FROM 'string' OR octet_length(c->>k)>10000) THEN RAISE EXCEPTION 'Unsupported customer field' USING ERRCODE='22023';END IF;END LOOP;
 FOREACH k IN ARRAY ARRAY['id','status','filedCustomerId','filedStage','reviewedAt','queuedAt','rawText'] LOOP IF e ? k AND (jsonb_typeof(e->k) IS DISTINCT FROM 'string' OR octet_length(e->>k)>10000) THEN RAISE EXCEPTION 'Unsupported enquiry field' USING ERRCODE='22023';END IF;END LOOP;
 IF c ? 'contactOk' AND jsonb_typeof(c->'contactOk') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Unsupported contact preference' USING ERRCODE='22023';END IF;
 IF c ? 'privateEnquiryReply' OR c ? 'version' OR e ? 'version' OR c->>'contactOk'='false' OR e->>'status' IS DISTINCT FROM 'Filed' OR e->>'filedCustomerId' IS DISTINCT FROM p_customer_id OR e->>'filedStage' IS DISTINCT FROM 'Enquiry' OR jsonb_typeof(e->'rawText') IS DISTINCT FROM 'string' OR e->>'rawText' LIKE '%Listing reference:%' OR coalesce(e->>'reviewedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN RAISE EXCEPTION 'Unsupported first reply source/target' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO source FROM jsonb_each(c) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 RETURN jsonb_build_object('customer',c,'enquiry',e,'source',jsonb_build_array(source,e));
END $$;
ALTER FUNCTION busy_snapshot_private.initial_reply_context(uuid,bigint,text,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION busy_snapshot_private.initial_reply_context(uuid,bigint,text,text) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.busy_owner_first_reply_review_v1(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;customer jsonb;enquiry jsonb;
BEGIN
 c:=busy_snapshot_private.initial_reply_context(p_business_id,p_expected_revision,p_customer_id,p_enquiry_id);
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO customer FROM jsonb_each(c->'customer') WHERE key IN ('id','name','service','phone','email','address','contactOk');
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO enquiry FROM jsonb_each(c->'enquiry') WHERE key IN ('id','status','filedCustomerId','filedStage','reviewedAt','queuedAt','rawText');
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'revision',p_expected_revision,'schemaVersion',1,'customerHash',encode(sha256(convert_to((c->'customer')::text,'UTF8')),'hex'),'sourceHash',encode(sha256(convert_to((c->'enquiry')::text,'UTF8')),'hex'),'customer',customer,'enquiry',enquiry);
END $$;
ALTER FUNCTION public.busy_owner_first_reply_review_v1(uuid,bigint,text,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_first_reply_review_v1(uuid,bigint,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_first_reply_review_v1(uuid,bigint,text,text) TO authenticated;

CREATE FUNCTION public.busy_owner_reply_create_v1(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text,p_customer_hash text,p_source_hash text,p_text text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;record jsonb;reference jsonb;rows jsonb;
BEGIN
 c:=busy_snapshot_private.initial_reply_context(p_business_id,p_expected_revision,p_customer_id,p_enquiry_id);
 IF p_text IS NULL OR btrim(p_text)='' OR octet_length(p_text)>10000 OR p_customer_hash IS DISTINCT FROM encode(sha256(convert_to((c->'customer')::text,'UTF8')),'hex') OR p_source_hash IS DISTINCT FROM encode(sha256(convert_to((c->'enquiry')::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'First reply source changed or invalid wording' USING ERRCODE='40001';END IF;
 reference:=jsonb_build_object('version',1,'businessId',p_business_id,'customerId',p_customer_id,'inboxId',p_enquiry_id,'reviewedAt',c->'enquiry'->'reviewedAt','queuedAt',CASE WHEN jsonb_typeof(c->'enquiry'->'queuedAt')='string' THEN c->'enquiry'->'queuedAt' ELSE 'null'::jsonb END,'snapshotRevision',p_expected_revision);
 record:=jsonb_build_object('version',2,'ownerId',auth.uid(),'businessId',p_business_id,'customerId',p_customer_id,'reference',reference,'sourceStamp',(c->'source')::text,'text',p_text,'purpose','acknowledge','privateOnly',true);
 SELECT jsonb_agg(CASE WHEN value->>'id'=p_customer_id THEN jsonb_set(value,'{privateEnquiryReply}',record) ELSE value END ORDER BY ordinality) INTO rows FROM public.busy_business_snapshots s,LATERAL jsonb_array_elements(s.payload->'customers') WITH ORDINALITY WHERE s.business_id=p_business_id;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{customers}',rows),revision=revision+1,updated_at=clock_timestamp() WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',auth.uid(),'operation','private_reply_create','customerId',p_customer_id,'targetId',p_customer_id,'enquiryId',p_enquiry_id,'previousRevision',p_expected_revision,'revision',p_expected_revision+1,'schemaVersion',1,'target',jsonb_build_object('text',p_text),'recordHash',encode(sha256(convert_to(record::text,'UTF8')),'hex'),'sourceHash',encode(sha256(convert_to((c->'source')::text,'UTF8')),'hex'));
END $$;
ALTER FUNCTION public.busy_owner_reply_create_v1(uuid,bigint,text,text,text,text,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_reply_create_v1(uuid,bigint,text,text,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_reply_create_v1(uuid,bigint,text,text,text,text,text) TO authenticated;
COMMIT;
