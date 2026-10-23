-- REVIEW CANDIDATE ONLY. Original saveQuickCapture Enquiry subset.
-- Not a Supabase migration, not active in either hosted project.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PHASE64 REVIEW FUSE: first filing requires client/source review and separate staging approval'; END $$;
CREATE FUNCTION public.busy_owner_first_enquiry_v1(p_business_id uuid,p_expected_revision bigint,p_capture jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; item jsonb; customer jsonb; source_record jsonb; activity jsonb; intake jsonb; filed jsonb; items jsonb; k text; total integer; event_date date; event_time time; event_at timestamptz; imported_at timestamptz:=clock_timestamp(); cid text; eid text; source_name text; imported_iso text; event_iso text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_capture) IS DISTINCT FROM 'object' OR p_capture-ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId','sourceHash','name','phone','email','address','service','eventDate','eventTime','note','confidence']<>'{}'::jsonb THEN RAISE EXCEPTION 'Unsupported capture' USING ERRCODE='22023'; END IF;
 FOREACH k IN ARRAY ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId','sourceHash','name','phone','email','address','service','eventDate','eventTime','note','confidence'] LOOP
  IF jsonb_typeof(p_capture->k) IS DISTINCT FROM 'string' OR octet_length(p_capture->>k)>10000 THEN RAISE EXCEPTION 'Unsupported capture field' USING ERRCODE='22023'; END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId'] LOOP
  IF length(p_capture->>k) NOT BETWEEN 1 AND 240 OR p_capture->>k !~ '^[A-Za-z0-9_-]+$' THEN RAISE EXCEPTION 'Invalid stable identity' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF btrim(p_capture->>'name')='' OR btrim(p_capture->>'service')='' OR (btrim(p_capture->>'phone')='' AND btrim(p_capture->>'email')='') OR p_capture->>'confidence' NOT IN ('Low','Medium','High') OR p_capture->>'eventDate' !~ '^\d{4}-\d{2}-\d{2}$' OR p_capture->>'eventTime' !~ '^\d{2}:\d{2}$' THEN RAISE EXCEPTION 'Required reviewed fields missing' USING ERRCODE='22023'; END IF;
 BEGIN event_date:=(p_capture->>'eventDate')::date;event_time:=(p_capture->>'eventTime')::time;
 EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RAISE EXCEPTION 'Invalid owner-recorded date' USING ERRCODE='22023'; END;
 -- Explicit UTC recording only; not proof of a customer event or appointment.
 event_at:=(event_date+event_time) AT TIME ZONE 'UTC';
 imported_iso:=to_char(imported_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');event_iso:=to_char(event_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');cid:=p_capture->>'customerId';eid:=p_capture->>'enquiryId';
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.revision IS DISTINCT FROM p_expected_revision OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 -- This is FIRST filing, not matching/forced-new or deleted-record recovery.
 IF (snap.payload ? 'customers' AND snap.payload->'customers'<>'[]'::jsonb) OR (snap.payload ? 'intakeLog' AND snap.payload->'intakeLog'<>'[]'::jsonb) OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'First filing requires empty customer/intake history and an original Inbox source' USING ERRCODE='22023'; END IF;
 IF snap.payload->'replyActions' ? cid THEN RAISE EXCEPTION 'Existing Work identity requires reconciliation' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'status'='Filed') THEN RAISE EXCEPTION 'Prior filing requires reconciliation' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous source' USING ERRCODE='22023'; END IF;
 SELECT x INTO item FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR item ? 'version' OR item->>'status' IS DISTINCT FROM 'Pending' OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM p_business_id::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Source identity mismatch' USING ERRCODE='42501'; END IF;
 IF p_capture->>'sourceHash' IS DISTINCT FROM encode(sha256(convert_to(item::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR btrim(item->>'rawText')='' OR jsonb_typeof(item->'source') IS DISTINCT FROM 'string' OR length(item->>'source') NOT BETWEEN 1 AND 240 OR (item ? 'screenshots' AND item->'screenshots'<>'[]'::jsonb) OR (item ? 'aiAnalysis' AND item->'aiAnalysis'<>'null'::jsonb) OR coalesce(item->>'visionPending','false')<>'false' OR (item->'parsed' ? 'stage' AND item->'parsed'->>'stage'<>'Enquiry') THEN RAISE EXCEPTION 'Unsupported source/media/stage' USING ERRCODE='22023'; END IF;
 source_name:=item->>'source';
 source_record:=jsonb_build_object('id',p_capture->>'sourceRecordId','source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'rawText',item->>'rawText','screenshots','[]'::jsonb,'screenshotOrderConfidence','Not checked','screenshotOrderReason','','aiAnalysisMode','','aiAnalysisSummary','','aiFieldConfidence','{}'::jsonb);
 activity:=jsonb_build_object('id',p_capture->>'activityId','kind','intake','date',event_date,'createdAt',imported_iso,'title','Enquiry captured from '||source_name,'note',coalesce(nullif(btrim(p_capture->>'note'),''),item->>'rawText'),'value','');
 -- Original contactOk default is a local contact preference, NEVER consent or
 -- provider/send authority. No consent, booking, quote, payment or reply is created.
 customer:=jsonb_build_object('id',cid,'name',btrim(p_capture->>'name'),'phone',btrim(p_capture->>'phone'),'email',btrim(p_capture->>'email'),'address',btrim(p_capture->>'address'),'service',btrim(p_capture->>'service'),'lastServiceDate','','lastJobValue',0,'contactOk',true,'createdAt',event_iso,'source',source_name,'history','[]'::jsonb,'activity',jsonb_build_array(activity),'sourceRecords',jsonb_build_array(source_record),'lifecycleStatus','Enquiry','currentEnquiryAt',event_iso,'nextEnquiryCheckDate',event_date+7,'enquiryFollowUpSentAt',NULL,'enquiryFollowUpStatus',NULL,'enquiryFollowUpOutcome','','enquiryFollowUpOutcomeRecordedAt',NULL,'nextRepeatDueDate','','lastActivityAt',imported_iso,'lastActivityKind','intake');
 intake:=jsonb_build_object('id',p_capture->>'intakeId','customerId',cid,'customerName',btrim(p_capture->>'name'),'source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'matchedExisting',false,'matchReason','','confidence',p_capture->>'confidence','screenshotCount',0,'screenshotOrderConfidence','Not checked');
 filed:=item||jsonb_build_object('status','Filed','reviewedAt',imported_iso,'filedCustomerId',cid,'filedStage','Enquiry','matchedExisting',false);
 SELECT jsonb_agg(CASE WHEN value->>'id'=eid THEN filed ELSE value END ORDER BY ordinality) INTO items FROM jsonb_array_elements(snap.payload->'inboxItems') WITH ORDINALITY;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(jsonb_set(jsonb_set(snap.payload,'{customers}',jsonb_build_array(customer)),'{intakeLog}',jsonb_build_array(intake)),'{inboxItems}',items),revision=snap.revision+1,updated_at=imported_at WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation','first_enquiry_filing','customerId',cid,'enquiryId',eid,'sourceRecordId',p_capture->>'sourceRecordId','intakeId',p_capture->>'intakeId','activityId',p_capture->>'activityId','previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',1,'filedStage','Enquiry');
END $$;
ALTER FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) TO authenticated;
COMMIT;
