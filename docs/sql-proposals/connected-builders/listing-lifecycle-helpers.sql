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
 RETURN coalesce(jsonb_typeof(p)='object' AND p-ARRAY['version','authority','businessId','ownerId','appId','requestId','requestHash','messageHash','selection','facts','verifiedAt','integrity']='{}' AND (SELECT count(*) FROM jsonb_object_keys(p))=12 AND p->'version'='1' AND p->>'authority'='busy_listing_filing_v1' AND p->>'businessId'=b::text AND p->>'ownerId'=auth.uid()::text AND p->>'ownerId'=e->>'registeredBy' AND p->>'requestId'=e#>>'{miniAppOrigin,requestId}' AND p->>'appId'=e#>>'{miniAppOrigin,appId}' AND p->>'requestHash'=e#>>'{miniAppOrigin,requestHash}' AND p->>'requestHash'~'^[a-f0-9]{64}$' AND p->>'messageHash'=encode(sha256(convert_to(e->>'rawText','UTF8')),'hex') AND jsonb_typeof(p->'facts'->'name')='string' AND jsonb_typeof(s)='object' AND s-ARRAY['version','kind','recordId','revision','variantId']='{}' AND (SELECT count(*) FROM jsonb_object_keys(s))=5 AND s->'version'='1' AND s->>'kind' IN ('product','event') AND s->>'recordId'~'^[A-Za-z0-9_-]{12,80}$' AND s->>'revision'~'^[1-9][0-9]{0,9}$' AND jsonb_typeof(p->'facts')='object' AND octet_length(p::text)<=10000 AND p->>'verifiedAt'~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' AND p->>'integrity'=encode(sha256(convert_to((p-'integrity')::text,'UTF8')),'hex'),false);
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
