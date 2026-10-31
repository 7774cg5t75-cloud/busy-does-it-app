-- REVIEW CANDIDATE ONLY. Not a migration. Never auto-apply to a linked project.
-- Based on owner handoff SHA256 557d9fd2bc4dcdcbac02e3ef675936e18c4e71341500c3bd7801277857461cac.
-- See README: targeted observations, not a complete original schema export.
-- No original function/policy is replaced here. All changes require separate review.
BEGIN;
CREATE SCHEMA busy_snapshot_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA busy_snapshot_private FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION busy_snapshot_private.lock_writer(p_business_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid := auth.uid(); member_role text;
BEGIN
 IF actor IS NULL OR p_business_id IS NULL THEN RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501'; END IF;
 -- A concurrent UPDATE/DELETE of this membership must serialize with this lock.
 -- Do not use JWT user_metadata, a client role, version flag or read-then-write Edge check.
 SELECT m.role INTO member_role FROM public.busy_business_memberships AS m
 WHERE m.business_id=p_business_id AND m.user_id=actor FOR UPDATE;
 IF member_role IS NULL OR member_role NOT IN ('owner','admin') THEN
  RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501';
 END IF;
 RETURN actor;
END $$;
ALTER FUNCTION busy_snapshot_private.lock_writer(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION busy_snapshot_private.lock_writer(uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.busy_snapshot_private_mutation_v1(
 p_business_id uuid, p_expected_revision bigint, p_expected_schema integer,
 p_operation text, p_target_id text, p_expected_record jsonb,
 p_new_text text DEFAULT NULL, p_expected_source jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE;
 rows jsonb; target jsonb; saved jsonb; updated jsonb; result_target jsonb;
 idx integer; total integer; enquiry jsonb; source jsonb; customer_source jsonb;
BEGIN
 actor := busy_snapshot_private.lock_writer(p_business_id);
 IF p_expected_revision IS NULL OR p_expected_revision<1 OR p_expected_schema IS DISTINCT FROM 1
 OR p_target_id IS NULL OR length(p_target_id) NOT BETWEEN 1 AND 240
 OR p_operation IS NULL OR p_operation NOT IN ('private_reply_edit_text','private_reply_remove','newsletter_remove')
 OR p_expected_record IS NULL OR jsonb_typeof(p_expected_record)<>'object' THEN
  RAISE EXCEPTION 'Unsupported mutation' USING ERRCODE='22023';
 END IF;
 -- Lock order is membership, then the original snapshot. No new snapshot ledger.
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Snapshot missing' USING ERRCODE='P0002'; END IF;
 IF snap.revision IS DISTINCT FROM p_expected_revision OR snap.schema_version IS DISTINCT FROM p_expected_schema THEN
  RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';
 END IF;
 IF jsonb_typeof(snap.payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Malformed snapshot' USING ERRCODE='22023'; END IF;
 IF p_operation IN ('private_reply_edit_text','private_reply_remove') THEN
  rows := snap.payload->'customers';
 ELSE rows := snap.payload->'socialDrafts'; END IF;
 IF jsonb_typeof(rows) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Malformed collection' USING ERRCODE='22023'; END IF;
 SELECT count(*),min((a.ordinality-1)::integer) INTO total,idx
 FROM jsonb_array_elements(rows) WITH ORDINALITY AS a(value,ordinality) WHERE a.value->>'id'=p_target_id;
 IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous target' USING ERRCODE='22023'; END IF;
 target := rows->idx;
 IF jsonb_typeof(target->'id') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Malformed target identity' USING ERRCODE='22023'; END IF;
 IF (target ? 'businessId' AND target->>'businessId' IS DISTINCT FROM p_business_id::text)
 OR (target ? 'business_id' AND target->>'business_id' IS DISTINCT FROM p_business_id::text) THEN
  RAISE EXCEPTION 'Target scope mismatch' USING ERRCODE='42501';
 END IF;
 IF p_operation IN ('private_reply_edit_text','private_reply_remove') THEN
  saved := target->'privateEnquiryReply';
  IF saved IS DISTINCT FROM p_expected_record OR saved->'version' IS DISTINCT FROM '2'::jsonb
  OR saved->'privateOnly' IS DISTINCT FROM 'true'::jsonb OR jsonb_typeof(saved->'text') IS DISTINCT FROM 'string' OR saved->>'ownerId' IS DISTINCT FROM actor::text
  OR saved->>'businessId' IS DISTINCT FROM p_business_id::text OR saved->>'customerId' IS DISTINCT FROM p_target_id THEN
   RAISE EXCEPTION 'Saved reply mismatch' USING ERRCODE='40001';
  END IF;
  IF p_operation='private_reply_remove' THEN
   IF p_new_text IS NOT NULL OR p_expected_source IS NOT NULL THEN RAISE EXCEPTION 'Removal takes no replacement' USING ERRCODE='22023'; END IF;
   result_target := NULL; updated := jsonb_set(snap.payload,ARRAY['customers',idx::text],target-'privateEnquiryReply',false);
  ELSE
   IF p_new_text IS NULL OR length(btrim(p_new_text))=0 OR octet_length(p_new_text)>10000
   OR target->>'contactOk'='false' OR saved->'provenance' IS NOT NULL AND saved->'provenance'<>'null'::jsonb THEN
    RAISE EXCEPTION 'Reply needs specialist source review' USING ERRCODE='22023';
   END IF;
   -- Existing original reply sourceStamp contains [customer projection, filed enquiry].
   -- Parsing invalid JSON fails closed. Never execute customer wording.
   source := (saved->>'sourceStamp')::jsonb;
   IF jsonb_typeof(source) IS DISTINCT FROM 'array' OR jsonb_array_length(source)<>2
   OR p_expected_source IS NULL OR source IS DISTINCT FROM p_expected_source
   OR saved->'reference'->'version' IS DISTINCT FROM '1'::jsonb
   OR jsonb_typeof(saved->'reference'->'snapshotRevision') IS DISTINCT FROM 'number'
   OR (saved->'reference'->>'snapshotRevision')::bigint NOT BETWEEN 1 AND snap.revision
   OR saved->'reference'->>'businessId' IS DISTINCT FROM p_business_id::text
   OR saved->'reference'->>'customerId' IS DISTINCT FROM p_target_id
   OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Source mismatch' USING ERRCODE='40001';
   END IF;
   SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') AS a(value)
    WHERE a.value->>'id'=saved->'reference'->>'inboxId';
   IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous enquiry' USING ERRCODE='40001'; END IF;
   SELECT a.value INTO enquiry FROM jsonb_array_elements(snap.payload->'inboxItems') AS a(value)
    WHERE a.value->>'id'=saved->'reference'->>'inboxId';
   SELECT coalesce(jsonb_object_agg(a.key,a.value),'{}'::jsonb) INTO customer_source FROM jsonb_each(target) AS a
    WHERE a.key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
   IF source->0 IS DISTINCT FROM customer_source OR source->1 IS DISTINCT FROM enquiry
   OR enquiry->>'status' IS DISTINCT FROM 'Filed' OR enquiry->>'filedCustomerId' IS DISTINCT FROM p_target_id
   OR enquiry->>'reviewedAt' IS DISTINCT FROM saved->'reference'->>'reviewedAt'
   OR coalesce(enquiry->>'queuedAt','') IS DISTINCT FROM coalesce(saved->'reference'->>'queuedAt','')
   OR (enquiry ? 'businessId' AND enquiry->>'businessId' IS DISTINCT FROM p_business_id::text)
   OR (enquiry ? 'business_id' AND enquiry->>'business_id' IS DISTINCT FROM p_business_id::text)
   OR coalesce(enquiry->>'rawText','') LIKE '%Listing reference:%' THEN
    RAISE EXCEPTION 'Source needs specialist review' USING ERRCODE='40001';
   END IF;
   -- Only the known private text leaf changes; future/unknown fields remain server-side.
   result_target := jsonb_set(saved,'{text}',to_jsonb(p_new_text),false);
   updated := jsonb_set(snap.payload,ARRAY['customers',idx::text,'privateEnquiryReply'],result_target,false);
  END IF;
 ELSE
  IF target IS DISTINCT FROM p_expected_record OR target->>'status' IS DISTINCT FROM 'Draft'
  OR coalesce(target->>'publishedAt','')<>'' OR target->'contentEvidence'->>'channel' IS DISTINCT FROM 'newsletter'
  OR target->'contentEvidence'->>'businessId' IS DISTINCT FROM p_business_id::text
  OR (target ? 'ownerId' AND target->>'ownerId' IS DISTINCT FROM actor::text)
  OR (target ? 'owner_id' AND target->>'owner_id' IS DISTINCT FROM actor::text)
  OR p_new_text IS NOT NULL OR p_expected_source IS NOT NULL THEN
   RAISE EXCEPTION 'Newsletter removal mismatch' USING ERRCODE='40001';
  END IF;
  result_target := NULL; updated := jsonb_set(snap.payload,'{socialDrafts}',rows-idx,false);
 END IF;
 UPDATE public.busy_business_snapshots SET payload=updated,revision=snap.revision+1,updated_at=transaction_timestamp()
 WHERE business_id=p_business_id AND revision=p_expected_revision AND schema_version=p_expected_schema;
 IF NOT FOUND THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation',p_operation,'targetId',p_target_id,
  'previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',snap.schema_version,'target',result_target);
END $$;
ALTER FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) TO authenticated;
COMMIT;
