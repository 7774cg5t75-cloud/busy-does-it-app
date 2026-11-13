-- REVIEW CANDIDATE ONLY. Original row; no new store. Apply only in approved rehearsal.
BEGIN;
CREATE FUNCTION busy_snapshot_private.owner_reply_context(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; customer jsonb; saved jsonb; enquiry jsonb; source jsonb; projection jsonb; total integer; eligible boolean:=false;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 -- Admin is NOT implicitly entitled to owner-private information.
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 IF p_customer_id IS NULL OR p_enquiry_id IS NULL OR length(p_customer_id) NOT BETWEEN 1 AND 240 OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Invalid identity' USING ERRCODE='22023'; END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.revision IS DISTINCT FROM p_revision OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(snap.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Unsupported source' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'customers') a WHERE a->>'id'=p_customer_id;
 IF total<>1 THEN RAISE EXCEPTION 'Ambiguous customer' USING ERRCODE='22023'; END IF;
 SELECT a INTO customer FROM jsonb_array_elements(snap.payload->'customers') a WHERE a->>'id'=p_customer_id;
 saved:=customer->'privateEnquiryReply';
 IF saved->>'ownerId' IS DISTINCT FROM actor::text OR saved->>'businessId' IS DISTINCT FROM p_business_id::text OR saved->>'customerId' IS DISTINCT FROM p_customer_id OR saved->'version' IS DISTINCT FROM '2'::jsonb OR saved->'privateOnly' IS DISTINCT FROM 'true'::jsonb OR jsonb_typeof(saved->'text') IS DISTINCT FROM 'string' OR saved->'reference'->>'inboxId' IS DISTINCT FROM p_enquiry_id
 OR (customer ? 'businessId' AND customer->>'businessId' IS DISTINCT FROM p_business_id::text) OR (customer ? 'business_id' AND customer->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Private owner or source mismatch' USING ERRCODE='42501'; END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') a WHERE a->>'id'=p_enquiry_id;
 IF total<>1 THEN RAISE EXCEPTION 'Ambiguous enquiry' USING ERRCODE='22023'; END IF;
 SELECT a INTO enquiry FROM jsonb_array_elements(snap.payload->'inboxItems') a WHERE a->>'id'=p_enquiry_id;
 IF enquiry->>'status' IS DISTINCT FROM 'Filed' OR enquiry->>'filedCustomerId' IS DISTINCT FROM p_customer_id OR (enquiry ? 'businessId' AND enquiry->>'businessId' IS DISTINCT FROM p_business_id::text) OR (enquiry ? 'business_id' AND enquiry->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Enquiry scope mismatch' USING ERRCODE='42501'; END IF;
 BEGIN source:=(saved->>'sourceStamp')::jsonb; EXCEPTION WHEN invalid_text_representation THEN source:=NULL; END;
 SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) INTO projection FROM jsonb_each(customer) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 eligible:=coalesce(source=jsonb_build_array(projection,enquiry) AND customer->>'contactOk' IS DISTINCT FROM 'false' AND (saved->'provenance' IS NULL OR saved->'provenance'='null'::jsonb) AND coalesce(enquiry->>'rawText','') NOT LIKE '%Listing reference:%',false);
 BEGIN
  eligible:=eligible AND saved->'reference'->'version'='1'::jsonb AND saved->'reference'->>'businessId'=p_business_id::text AND saved->'reference'->>'customerId'=p_customer_id AND (saved->'reference'->>'snapshotRevision')::bigint BETWEEN 1 AND snap.revision AND enquiry->>'reviewedAt'=saved->'reference'->>'reviewedAt' AND coalesce(enquiry->>'queuedAt','')=coalesce(saved->'reference'->>'queuedAt','');
 EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN eligible:=false; END;
 eligible:=coalesce(eligible,false);
 -- Internal only. Callers cannot EXECUTE this helper or access its schema.
 RETURN jsonb_build_object('saved',saved,'source',source,'eligible',eligible,'revision',snap.revision,'actor',actor,'customer',customer,'enquiry',enquiry);
END $$;
ALTER FUNCTION busy_snapshot_private.owner_reply_context(uuid,text,text,bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION busy_snapshot_private.owner_reply_context(uuid,text,text,bigint) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.busy_shared_business_read_v1(p_business_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); member_role text; business_name text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT role INTO member_role FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor FOR SHARE;
 IF member_role IS NULL OR member_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501'; END IF;
 SELECT name INTO business_name FROM public.busy_businesses WHERE id=p_business_id FOR SHARE;
 -- Explicit relational allowlist. No snapshot payload, customer/contact/private data.
 RETURN jsonb_build_object('businessId',p_business_id,'businessName',business_name,'memberRole',member_role);
END $$;
ALTER FUNCTION public.busy_shared_business_read_v1(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_shared_business_read_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_shared_business_read_v1(uuid) TO authenticated;

CREATE FUNCTION public.busy_owner_reply_review_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;
BEGIN
 c:=busy_snapshot_private.owner_reply_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_revision);
 -- Unknown extensions and serialized sourceStamp are NEVER returned by this API.
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'customerId',p_customer_id,'enquiryId',p_enquiry_id,'revision',p_expected_revision,'schemaVersion',1,'recordHash',encode(sha256(convert_to((c->'saved')::text,'UTF8')),'hex'),'sourceHash',encode(sha256(convert_to((c->'source')::text,'UTF8')),'hex'),'eligible',c->'eligible','reply',jsonb_build_object('text',c->'saved'->'text'),'customer',jsonb_build_object('id',p_customer_id,'name',CASE WHEN jsonb_typeof(c->'customer'->'name')='string' THEN c->'customer'->'name' ELSE '""'::jsonb END),'enquiry',jsonb_build_object('id',p_enquiry_id,'rawText',CASE WHEN jsonb_typeof(c->'enquiry'->'rawText')='string' THEN c->'enquiry'->'rawText' ELSE '""'::jsonb END));
END $$;
ALTER FUNCTION public.busy_owner_reply_review_v1(uuid,text,text,bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_reply_review_v1(uuid,text,text,bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_reply_review_v1(uuid,text,text,bigint) TO authenticated;

CREATE FUNCTION public.busy_owner_reply_text_v2(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_revision bigint,p_record_hash text,p_source_hash text,p_new_text text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb; receipt jsonb;
BEGIN
 c:=busy_snapshot_private.owner_reply_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_revision);
 IF c->'eligible' IS DISTINCT FROM 'true'::jsonb OR p_record_hash IS DISTINCT FROM encode(sha256(convert_to((c->'saved')::text,'UTF8')),'hex') OR p_source_hash IS DISTINCT FROM encode(sha256(convert_to((c->'source')::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Private source changed' USING ERRCODE='40001'; END IF;
 -- Reuse original finite source validation/mutation. Full records stay on server.
 receipt:=public.busy_snapshot_private_mutation_v1(p_business_id,p_expected_revision,1,'private_reply_edit_text',p_customer_id,c->'saved',p_new_text,c->'source');
 RETURN (receipt-'target')||jsonb_build_object('enquiryId',p_enquiry_id,'target',jsonb_build_object('text',receipt->'target'->'text'),'recordHash',encode(sha256(convert_to((receipt->'target')::text,'UTF8')),'hex'));
END $$;
ALTER FUNCTION public.busy_owner_reply_text_v2(uuid,text,text,bigint,text,text,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_reply_text_v2(uuid,text,text,bigint,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_reply_text_v2(uuid,text,text,bigint,text,text,text) TO authenticated;
COMMIT;
