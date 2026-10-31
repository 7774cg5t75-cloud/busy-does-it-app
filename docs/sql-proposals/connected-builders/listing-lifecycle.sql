-- REVIEW ONLY. Versioned original listing filing, no consumer ingress or execution authority.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'LISTING LIFECYCLE REVIEW FUSE: separate exact staging approval required'; END $$;
CREATE FUNCTION busy_snapshot_private.listing_candidate(b uuid,rid uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_snapshot_private.lock_writer(b);r public.busy_mini_app_requests%ROWTYPE;a public.busy_mini_apps%ROWTYPE;c public.busy_business_content%ROWTYPE;s jsonb;v jsonb;facts jsonb;p jsonb;refs text[];n int;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=b AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE business_id=b AND id=rid FOR SHARE;
 IF NOT FOUND OR r.request_type<>'enquiry' OR r.module_key<>'enquiry' OR r.status NOT IN ('received','reviewing') THEN RAISE EXCEPTION 'Current original enquiry required' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE business_id=b AND id=r.mini_app_id AND created_by=actor FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'='enquiry' AND m->'enabled'='true') THEN RAISE EXCEPTION 'Original app owner required' USING ERRCODE='42501';END IF;
 s:=r.payload->'listingContext';
 IF jsonb_typeof(s) IS DISTINCT FROM 'object' OR s-ARRAY['version','kind','recordId','revision','variantId']<>'{}' OR (SELECT count(*) FROM jsonb_object_keys(s))<>5 OR s->'version'<>'1'::jsonb OR s->>'kind' NOT IN ('product','event') OR coalesce(s->>'recordId','')!~'^[A-Za-z0-9_-]{12,80}$' OR jsonb_typeof(s->'revision') IS DISTINCT FROM 'number' OR (s->>'revision')!~'^[1-9][0-9]{0,9}$' OR (s->'variantId'<>'null' AND (jsonb_typeof(s->'variantId')<>'string' OR s->>'variantId'!~'^[A-Za-z0-9_-]{12,80}$')) THEN RAISE EXCEPTION 'Typed listing context required' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM regexp_matches(r.payload->>'message','^Listing reference: ([A-Za-z0-9_-]+) / approved revision ([1-9][0-9]{0,9})(?: / option ([A-Za-z0-9_-]+))?\.$','gn');
 SELECT x INTO refs FROM regexp_matches(r.payload->>'message','^Listing reference: ([A-Za-z0-9_-]+) / approved revision ([1-9][0-9]{0,9})(?: / option ([A-Za-z0-9_-]+))?\.$','n')x;
 IF n<>1 OR (length(r.payload->>'message')-length(replace(r.payload->>'message','Listing reference:','')))<>length('Listing reference:') OR refs[1] IS DISTINCT FROM s->>'recordId' OR refs[2] IS DISTINCT FROM s->>'revision' OR refs[3] IS DISTINCT FROM s->>'variantId' THEN RAISE EXCEPTION 'Ambiguous or conflicting listing reference' USING ERRCODE='22023';END IF;
 SELECT * INTO c FROM public.busy_business_content WHERE business_id=b AND id=s->>'recordId' FOR SHARE;
 IF NOT FOUND OR c.kind IS DISTINCT FROM s->>'kind' OR c.published_revision IS DISTINCT FROM (s->>'revision')::bigint OR jsonb_typeof(c.published) IS DISTINCT FROM 'object' OR c.published->>'status' IS DISTINCT FROM (CASE c.kind WHEN 'product' THEN 'active' ELSE 'scheduled' END) OR jsonb_typeof(c.published->'name') IS DISTINCT FROM 'string' OR length(btrim(c.published->>'name')) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Approved listing changed or unavailable' USING ERRCODE='40001';END IF;
 IF c.kind='product' THEN
  IF NOT(c.published ? 'amountMinor') OR jsonb_typeof(c.published->'currency') IS DISTINCT FROM 'string' OR c.published->>'currency' NOT IN ('GBP','USD','EUR') OR (c.published->'amountMinor'<>'null' AND (c.published->>'amountMinor')!~'^[0-9]{1,12}$') THEN RAISE EXCEPTION 'Unsupported approved product facts' USING ERRCODE='22023';END IF;
  facts:=jsonb_build_object('name',c.published->'name','description',c.published->'description','amountMinor',c.published->'amountMinor','currency',c.published->'currency');
  IF s->>'variantId' IS NOT NULL THEN
   IF jsonb_typeof(c.published->'variants') IS DISTINCT FROM 'array' OR jsonb_array_length(c.published->'variants')>40 THEN RAISE EXCEPTION 'Approved option unavailable' USING ERRCODE='22023';END IF;
   SELECT count(*) INTO n FROM jsonb_array_elements(c.published->'variants')x WHERE x->>'id'=s->>'variantId';IF n<>1 THEN RAISE EXCEPTION 'Exact approved option required' USING ERRCODE='22023';END IF;
   SELECT x INTO v FROM jsonb_array_elements(c.published->'variants')x WHERE x->>'id'=s->>'variantId';
   IF jsonb_typeof(v->'label') IS DISTINCT FROM 'string' OR length(v->>'label') NOT BETWEEN 1 AND 120 OR (v->>'amountMinor')!~'^[0-9]{1,12}$' THEN RAISE EXCEPTION 'Invalid approved option' USING ERRCODE='22023';END IF;
   facts:=facts||jsonb_build_object('optionId',v->'id','optionLabel',v->'label','amountMinor',v->'amountMinor');
  END IF;
 ELSE
  IF s->>'variantId' IS NOT NULL OR coalesce(c.published->>'startsAt','')!~'^\d{4}-\d{2}-\d{2}T' OR jsonb_typeof(c.published->'timeZone') IS DISTINCT FROM 'string' OR jsonb_typeof(c.published->'location') IS DISTINCT FROM 'string' OR coalesce(c.published->>'endsAt','')!~'^\d{4}-\d{2}-\d{2}T' OR (c.published->>'endsAt')::timestamptz<=clock_timestamp() OR (c.published->>'startsAt')::timestamptz>=(c.published->>'endsAt')::timestamptz THEN RAISE EXCEPTION 'Event expired or invalid' USING ERRCODE='40001';END IF;
  facts:=jsonb_build_object('name',c.published->'name','description',c.published->'description','startsAt',c.published->'startsAt','endsAt',c.published->'endsAt','timeZone',c.published->'timeZone','location',c.published->'location');
 END IF;
 IF octet_length(facts::text)>7000 THEN RAISE EXCEPTION 'Listing facts exceed supported bound' USING ERRCODE='22023';END IF;
 p:=jsonb_build_object('version',1,'authority','busy_listing_filing_v1','businessId',b,'ownerId',actor,'appId',a.id,'requestId',r.id,'requestHash',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex'),'messageHash',encode(sha256(convert_to(r.payload->>'message','UTF8')),'hex'),'selection',s,'facts',facts,'verifiedAt',to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 RETURN p||jsonb_build_object('integrity',encode(sha256(convert_to(p::text,'UTF8')),'hex'));
END $$;
CREATE FUNCTION busy_snapshot_private.valid_listing(b uuid,e jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p jsonb:=e->'listingProvenance';s jsonb:=p->'selection';
BEGIN
 RETURN coalesce(jsonb_typeof(p)='object' AND p-ARRAY['version','authority','businessId','ownerId','appId','requestId','requestHash','messageHash','selection','facts','verifiedAt','integrity']='{}' AND (SELECT count(*) FROM jsonb_object_keys(p))=12 AND p->'version'='1' AND p->>'authority'='busy_listing_filing_v1' AND p->>'businessId'=b::text AND p->>'ownerId'=auth.uid()::text AND p->>'ownerId'=e->>'registeredBy' AND p->>'requestId'=e#>>'{miniAppOrigin,requestId}' AND p->>'appId'=e#>>'{miniAppOrigin,appId}' AND p->>'requestHash'=e#>>'{miniAppOrigin,requestHash}' AND e->>'id'='app_'||replace(p->>'requestId','-','_') AND e->>'filedCustomerId'='customer_'||replace(p->>'requestId','-','_') AND p->>'requestHash'~'^[a-f0-9]{64}$' AND p->>'messageHash'=encode(sha256(convert_to(e->>'rawText','UTF8')),'hex') AND jsonb_typeof(p->'facts'->'name')='string' AND jsonb_typeof(s)='object' AND s-ARRAY['version','kind','recordId','revision','variantId']='{}' AND (SELECT count(*) FROM jsonb_object_keys(s))=5 AND s->'version'='1' AND s->>'kind' IN ('product','event') AND s->>'recordId'~'^[A-Za-z0-9_-]{12,80}$' AND s->>'revision'~'^[1-9][0-9]{0,9}$' AND jsonb_typeof(p->'facts')='object' AND octet_length(p::text)<=10000 AND p->>'verifiedAt'~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' AND p->>'integrity'=encode(sha256(convert_to((p-'integrity')::text,'UTF8')),'hex'),false);
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
CREATE FUNCTION busy_snapshot_private.listing_state(b uuid,e jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p jsonb:=e->'listingProvenance';now_source jsonb;
BEGIN
 IF NOT busy_snapshot_private.valid_listing(b,e) THEN RAISE EXCEPTION 'Unsupported listing provenance' USING ERRCODE='22023';END IF;
 BEGIN
  now_source:=busy_snapshot_private.listing_candidate(b,(p->>'requestId')::uuid);
  IF now_source->'selection'=p->'selection' AND now_source->'facts'=p->'facts' AND now_source->>'requestHash'=p->>'requestHash' AND now_source->>'appId'=p->>'appId' THEN RETURN jsonb_build_object('current',true,'state','current','factsAtFiling',p->'facts');END IF;
 EXCEPTION WHEN OTHERS THEN NULL;END;
 RETURN jsonb_build_object('current',false,'state','changed_or_unavailable','factsAtFiling',p->'facts');
END $$;
REVOKE ALL ON FUNCTION busy_snapshot_private.listing_candidate(uuid,uuid),busy_snapshot_private.valid_listing(uuid,jsonb),busy_snapshot_private.listing_state(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
-- Original function replacements follow. Historical source guards remain intact elsewhere.



CREATE OR REPLACE FUNCTION busy_snapshot_private.initial_reply_context(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text)
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
 IF (e ? 'registeredBy' AND e->>'registeredBy' IS DISTINCT FROM actor::text) OR c ? 'privateEnquiryReply' OR c ? 'version' OR e ? 'version' OR c->>'contactOk'='false' OR e->>'status' IS DISTINCT FROM 'Filed' OR e->>'filedCustomerId' IS DISTINCT FROM p_customer_id OR e->>'filedStage' IS DISTINCT FROM 'Enquiry' OR jsonb_typeof(e->'rawText') IS DISTINCT FROM 'string' OR ((e->>'rawText' LIKE '%Listing reference:%' OR e ? 'listingProvenance') AND NOT busy_snapshot_private.valid_listing(p_business_id,e)) OR coalesce(e->>'reviewedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN RAISE EXCEPTION 'Unsupported first reply source/target' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO source FROM jsonb_each(c) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 RETURN jsonb_build_object('customer',c,'enquiry',e,'source',jsonb_build_array(source,e));
END $$;

CREATE OR REPLACE FUNCTION busy_snapshot_private.file_app_enquiry_v2(p_business_id uuid,p_expected_revision bigint,p_capture jsonb)
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
 -- New finite repeated filing; original first-only entry remains unchanged.
 IF jsonb_typeof(coalesce(snap.payload->'customers','[]')) IS DISTINCT FROM 'array' OR jsonb_typeof(coalesce(snap.payload->'intakeLog','[]')) IS DISTINCT FROM 'array' OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR jsonb_array_length(coalesce(snap.payload->'customers','[]'))>=1000 OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'Unsupported collections' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(snap.payload->'customers','[]')) x WHERE x->>'id'=cid) OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(snap.payload->'intakeLog','[]')) x WHERE x->>'id'=p_capture->>'intakeId') OR snap.payload->'replyActions' ? cid THEN RAISE EXCEPTION 'Existing identity requires review' USING ERRCODE='40001';END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous source' USING ERRCODE='22023'; END IF;
 SELECT x INTO item FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR item ? 'version' OR item->>'status' IS DISTINCT FROM 'Pending' OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM p_business_id::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Source identity mismatch' USING ERRCODE='42501'; END IF;
 IF p_capture->>'sourceHash' IS DISTINCT FROM encode(sha256(convert_to(item::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR btrim(item->>'rawText')='' OR jsonb_typeof(item->'source') IS DISTINCT FROM 'string' OR length(item->>'source') NOT BETWEEN 1 AND 240 OR (item ? 'screenshots' AND item->'screenshots'<>'[]'::jsonb) OR (item ? 'aiAnalysis' AND item->'aiAnalysis'<>'null'::jsonb) OR coalesce(item->>'visionPending','false')<>'false' OR (item->'parsed' ? 'stage' AND item->'parsed'->>'stage'<>'Enquiry') THEN RAISE EXCEPTION 'Unsupported source/media/stage' USING ERRCODE='22023'; END IF;
 IF item->>'rawText' LIKE '%Listing reference:%' THEN item:=item||jsonb_build_object('listingProvenance',busy_snapshot_private.listing_candidate(p_business_id,(item#>>'{miniAppOrigin,requestId}')::uuid));END IF;
 source_name:=item->>'source';
 source_record:=jsonb_build_object('id',p_capture->>'sourceRecordId','source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'rawText',item->>'rawText','screenshots','[]'::jsonb,'screenshotOrderConfidence','Not checked','screenshotOrderReason','','aiAnalysisMode','','aiAnalysisSummary','','aiFieldConfidence','{}'::jsonb);
 activity:=jsonb_build_object('id',p_capture->>'activityId','kind','intake','date',event_date,'createdAt',imported_iso,'title','Enquiry captured from '||source_name,'note',coalesce(nullif(btrim(p_capture->>'note'),''),item->>'rawText'),'value','');
 -- Original contactOk default is a local contact preference, NEVER consent or
 -- provider/send authority. No consent, booking, quote, payment or reply is created.
 customer:=jsonb_build_object('id',cid,'name',btrim(p_capture->>'name'),'phone',btrim(p_capture->>'phone'),'email',btrim(p_capture->>'email'),'address',btrim(p_capture->>'address'),'service',btrim(p_capture->>'service'),'lastServiceDate','','lastJobValue',0,'contactOk',true,'createdAt',event_iso,'source',source_name,'history','[]'::jsonb,'activity',jsonb_build_array(activity),'sourceRecords',jsonb_build_array(source_record),'lifecycleStatus','Enquiry','currentEnquiryAt',event_iso,'nextEnquiryCheckDate',event_date+7,'enquiryFollowUpSentAt',NULL,'enquiryFollowUpStatus',NULL,'enquiryFollowUpOutcome','','enquiryFollowUpOutcomeRecordedAt',NULL,'nextRepeatDueDate','','lastActivityAt',imported_iso,'lastActivityKind','intake');
 intake:=jsonb_build_object('id',p_capture->>'intakeId','customerId',cid,'customerName',btrim(p_capture->>'name'),'source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'matchedExisting',false,'matchReason','','confidence',p_capture->>'confidence','screenshotCount',0,'screenshotOrderConfidence','Not checked');
 filed:=item||jsonb_build_object('status','Filed','reviewedAt',imported_iso,'filedCustomerId',cid,'filedStage','Enquiry','matchedExisting',false);
 SELECT jsonb_agg(CASE WHEN value->>'id'=eid THEN filed ELSE value END ORDER BY ordinality) INTO items FROM jsonb_array_elements(snap.payload->'inboxItems') WITH ORDINALITY;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(jsonb_set(jsonb_set(snap.payload,'{customers}',coalesce(snap.payload->'customers','[]')||jsonb_build_array(customer)),'{intakeLog}',coalesce(snap.payload->'intakeLog','[]')||jsonb_build_array(intake)),'{inboxItems}',items),revision=snap.revision+1,updated_at=imported_at WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation','reviewed_app_enquiry_filing','customerId',cid,'enquiryId',eid,'sourceRecordId',p_capture->>'sourceRecordId','intakeId',p_capture->>'intakeId','activityId',p_capture->>'activityId','previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',1,'filedStage','Enquiry');
END $$;


CREATE OR REPLACE FUNCTION public.busy_owner_first_reply_review_v1(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;customer jsonb;enquiry jsonb;
BEGIN
 c:=busy_snapshot_private.initial_reply_context(p_business_id,p_expected_revision,p_customer_id,p_enquiry_id);
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO customer FROM jsonb_each(c->'customer') WHERE key IN ('id','name','service','phone','email','address','contactOk');
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO enquiry FROM jsonb_each(c->'enquiry') WHERE key IN ('id','status','filedCustomerId','filedStage','reviewedAt','queuedAt','rawText','miniAppOrigin','listingProvenance');
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'revision',p_expected_revision,'schemaVersion',1,'customerHash',encode(sha256(convert_to((c->'customer')::text,'UTF8')),'hex'),'sourceHash',encode(sha256(convert_to((c->'enquiry')::text,'UTF8')),'hex'),'customer',customer,'enquiry',enquiry)||CASE WHEN enquiry ? 'listingProvenance' THEN jsonb_build_object('listingStatus',busy_snapshot_private.listing_state(p_business_id,c->'enquiry')) ELSE '{}' END;
END $$;

CREATE OR REPLACE FUNCTION busy_work_private.source_context(b uuid,c text,e text,expected bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(b);s public.busy_business_snapshots%ROWTYPE;cust jsonb;item jsonb;projection jsonb;n integer;
BEGIN
 IF c IS NULL OR e IS NULL OR length(c) NOT BETWEEN 1 AND 240 OR length(e) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Invalid identity' USING ERRCODE='22023';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=b FOR SHARE;
 IF NOT FOUND OR s.schema_version IS DISTINCT FROM 1 OR expected IS NOT NULL AND expected IS DISTINCT FROM s.revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(s.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(s.payload->'inboxItems') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Unsupported source collections' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(s.payload->'customers') a WHERE a->>'id'=c;
 IF n<>1 THEN RAISE EXCEPTION 'Missing or ambiguous customer' USING ERRCODE='22023';END IF;
 SELECT a INTO cust FROM jsonb_array_elements(s.payload->'customers') a WHERE a->>'id'=c;
 SELECT count(*) INTO n FROM jsonb_array_elements(s.payload->'inboxItems') a WHERE a->>'id'=e;
 IF n<>1 THEN RAISE EXCEPTION 'Missing or ambiguous enquiry' USING ERRCODE='22023';END IF;
 SELECT a INTO item FROM jsonb_array_elements(s.payload->'inboxItems') a WHERE a->>'id'=e;
 IF (cust ? 'businessId' AND cust->>'businessId' IS DISTINCT FROM b::text) OR (cust ? 'business_id' AND cust->>'business_id' IS DISTINCT FROM b::text) OR (cust ? 'ownerId' AND cust->>'ownerId' IS DISTINCT FROM actor::text) OR (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM b::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM b::text) THEN RAISE EXCEPTION 'Source scope mismatch' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(cust->'id') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'id') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'filedCustomerId') IS DISTINCT FROM 'string' OR jsonb_typeof(cust->'name') IS DISTINCT FROM 'string' OR jsonb_typeof(cust->'service') IS DISTINCT FROM 'string' OR cust ? 'version' OR item ? 'version' OR cust->>'contactOk'='false' OR item->>'status' IS DISTINCT FROM 'Filed' OR item->>'filedCustomerId' IS DISTINCT FROM c OR jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR octet_length(item->>'rawText')>10000 OR ((item->>'rawText' LIKE '%Listing reference:%' OR item ? 'listingProvenance') AND NOT busy_snapshot_private.valid_listing(b,item)) OR coalesce(item->>'reviewedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN RAISE EXCEPTION 'Unsupported Filed source' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO projection FROM jsonb_each(cust) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 RETURN jsonb_build_object('actor',actor,'revision',s.revision,'customer',projection,'enquiry',item,'customerHash',busy_work_private.hash(projection),'sourceHash',busy_work_private.hash(item),'legacy',s.payload->'replyActions'->c);
END $$;

CREATE OR REPLACE FUNCTION public.busy_work_source_review_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);a jsonb:=x->'legacy';
BEGIN
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'ownerId',x->'actor','snapshotRevision',x->'revision','schemaVersion',1,'sourceHash',x->'sourceHash','customerHash',x->'customerHash','customer',jsonb_build_object('id',p_customer_id,'name',x->'customer'->'name','service',x->'customer'->'service'),'enquiry',jsonb_build_object('id',p_enquiry_id,'rawText',x->'enquiry'->'rawText','reviewedAt',x->'enquiry'->'reviewedAt')||CASE WHEN x->'enquiry' ? 'listingProvenance' THEN jsonb_build_object('miniAppOrigin',x->'enquiry'->'miniAppOrigin','listingProvenance',x->'enquiry'->'listingProvenance') ELSE '{}' END,'hasLegacyWork',coalesce(a->'details'->'enquiryReference'->>'inboxId'=p_enquiry_id,false),'readOnlyObservation',true,'notOwnReceipt',true)||CASE WHEN x->'enquiry' ? 'listingProvenance' THEN jsonb_build_object('listingStatus',busy_snapshot_private.listing_state(p_business_id,x->'enquiry')) ELSE '{}' END;
END $$;

CREATE OR REPLACE FUNCTION public.busy_work_create_quote_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint,p_customer_hash text,p_source_hash text,p_amount text,p_text text,p_date text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);r public.business_work_engagements%ROWTYPE;
BEGIN
 IF x->'enquiry' ? 'listingProvenance' AND (busy_snapshot_private.listing_state(p_business_id,x->'enquiry')->>'current')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'Listing changed; review original source' USING ERRCODE='40001';END IF;
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 PERFORM busy_work_private.valid_quote(p_amount,p_text,p_date,p_operation_id);
 IF x->>'customerHash' IS DISTINCT FROM p_customer_hash OR x->>'sourceHash' IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001';END IF;
 -- The exact original legacy source must be migrated explicitly, never duplicated.
 IF x->'legacy'->'details'->'enquiryReference'->>'inboxId'=p_enquiry_id THEN RAISE EXCEPTION 'Review legacy migration' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_engagements(business_id,customer_id,enquiry_id,created_by,modified_by,kind,status,source_snapshot_revision,customer_hash,source_hash,source_evidence,work_data,creation_operation_id)
 VALUES(p_business_id,p_customer_id,p_enquiry_id,(x->>'actor')::uuid,(x->>'actor')::uuid,'quote','Prepared',(x->>'revision')::bigint,p_customer_hash,p_source_hash,jsonb_build_object('customer',x->'customer','enquiry',x->'enquiry'),jsonb_build_object('type','quote','task','Prepare a private quote','origin','manual','done',true,'details',jsonb_build_object('quoteStatus','Prepared','quoteAmount',p_amount,'message',p_text,'plannedSentDate',p_date)),p_operation_id) RETURNING * INTO r;
 RETURN jsonb_build_object('operation','engagement_create_quote','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'engagementId',r.id,'actorId',r.created_by,'previousRevision',0,'revision',1,'schemaVersion',1,'sourceHash',r.source_hash,'recordHash',busy_work_private.hash(r.work_data));
END $$;

CREATE OR REPLACE FUNCTION public.busy_connected_app_enquiry_review_v1(p_business_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;r public.busy_mini_app_requests%ROWTYPE;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE business_id=p_business_id AND id=p_request_id FOR SHARE;
 IF NOT FOUND OR r.request_type<>'enquiry' OR r.module_key<>'enquiry' OR r.status NOT IN ('received','reviewing') OR NOT EXISTS(SELECT 1 FROM public.busy_mini_apps WHERE id=r.mini_app_id AND business_id=p_business_id) THEN RAISE EXCEPTION 'Current business enquiry required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(r.payload->'message') IS DISTINCT FROM 'string' OR btrim(r.payload->>'message')='' OR octet_length(r.payload->>'message')>5000 THEN RAISE EXCEPTION 'Supported text enquiry required' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'requestId',r.id,'appId',r.mini_app_id,
 'requestHash',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex'),'message',r.payload->>'message',
 'name',coalesce(r.contact_name,''),'email',coalesce(r.contact_email,''),'phone',coalesce(r.contact_phone,''),'service',coalesce(r.service_name,''),
 'identityAssurance',coalesce(r.identity_assurance,'unverified'),'noCustomerIdentityInference',true)||CASE WHEN r.payload->>'message' LIKE '%Listing reference:%' AND r.payload ? 'listingContext' THEN jsonb_build_object('listingProvenance',busy_snapshot_private.listing_candidate(p_business_id,p_request_id)) ELSE '{}' END;
END $$;
COMMIT;
