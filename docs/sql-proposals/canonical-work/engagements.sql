-- REVIEW CANDIDATE, not a deployable migration. Original provisioning unchanged.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'CANONICAL WORK REVIEW FUSE: separate hosted approval required'; END $$;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace AND left(proname,10)='busy_work_') THEN RAISE EXCEPTION 'Canonical RPC namespace already in use';END IF;END $$;
-- New canonical authority; NOT another customer DB or a replacement booking ledger.
CREATE SCHEMA busy_work_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA busy_work_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE public.business_work_engagements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES public.busy_businesses(id) ON DELETE RESTRICT,
 customer_id text NOT NULL CHECK(length(customer_id) BETWEEN 1 AND 240),
 enquiry_id text NOT NULL CHECK(length(enquiry_id) BETWEEN 1 AND 240),
 created_by uuid NOT NULL, modified_by uuid NOT NULL,
 kind text NOT NULL CHECK(kind='quote'), status text NOT NULL CHECK(status='Prepared'),
 schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 source_snapshot_revision bigint NOT NULL CHECK(source_snapshot_revision>0),
 customer_hash text NOT NULL CHECK(customer_hash ~ '^[0-9a-f]{64}$'), source_hash text NOT NULL CHECK(source_hash ~ '^[0-9a-f]{64}$'),
 source_evidence jsonb NOT NULL CHECK(jsonb_typeof(source_evidence)='object' AND octet_length(source_evidence::text)<=262144),
 work_data jsonb NOT NULL CHECK(jsonb_typeof(work_data) IS NOT DISTINCT FROM 'object' AND work_data->>'type' IS NOT DISTINCT FROM 'quote' AND jsonb_typeof(work_data->'details') IS NOT DISTINCT FROM 'object' AND octet_length(work_data::text)<=262144),
 creation_operation_id text NOT NULL CHECK(creation_operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),
 legacy_record_hash text,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(business_id,customer_id,id),UNIQUE(business_id,customer_id,enquiry_id),UNIQUE(business_id,created_by,creation_operation_id)
);
CREATE INDEX business_work_customer_page ON public.business_work_engagements(business_id,customer_id,created_by,id);
CREATE INDEX business_work_owner_page ON public.business_work_engagements(business_id,created_by,id);
CREATE TABLE public.business_work_private_drafts(
 business_id uuid NOT NULL,customer_id text NOT NULL,engagement_id uuid NOT NULL,owner_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('reply','followup')),revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 engagement_revision bigint NOT NULL,source_hash text NOT NULL,
 text text NOT NULL CHECK(octet_length(text) BETWEEN 1 AND 10000 AND btrim(text)<>''),
 extensions jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(extensions)='object'),
 operation_id text NOT NULL,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(business_id,customer_id,engagement_id,owner_id,kind),
 FOREIGN KEY(business_id,customer_id,engagement_id) REFERENCES public.business_work_engagements(business_id,customer_id,id) ON DELETE RESTRICT
);
ALTER TABLE public.business_work_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_work_private_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_work_engagements,public.business_work_private_drafts FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION busy_work_private.authorize(b uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid();r text;
BEGIN
 IF actor IS NULL OR b IS NULL THEN RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501';END IF;
 -- SHARE permits independent engagements while UPDATE/DELETE revocation serializes.
 SELECT role INTO r FROM public.busy_business_memberships WHERE business_id=b AND user_id=actor FOR SHARE;
 IF r IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 RETURN actor;
END $$;
CREATE FUNCTION busy_work_private.hash(v jsonb) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$SELECT encode(sha256(convert_to(v::text,'UTF8')),'hex')$$;
CREATE FUNCTION busy_work_private.source_context(b uuid,c text,e text,expected bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
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
 IF jsonb_typeof(cust->'id') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'id') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'filedCustomerId') IS DISTINCT FROM 'string' OR jsonb_typeof(cust->'name') IS DISTINCT FROM 'string' OR jsonb_typeof(cust->'service') IS DISTINCT FROM 'string' OR cust ? 'version' OR item ? 'version' OR cust->>'contactOk'='false' OR item->>'status' IS DISTINCT FROM 'Filed' OR item->>'filedCustomerId' IS DISTINCT FROM c OR jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR octet_length(item->>'rawText')>10000 OR item->>'rawText' LIKE '%Listing reference:%' OR coalesce(item->>'reviewedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN RAISE EXCEPTION 'Unsupported Filed source' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO projection FROM jsonb_each(cust) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 RETURN jsonb_build_object('actor',actor,'revision',s.revision,'customer',projection,'enquiry',item,'customerHash',busy_work_private.hash(projection),'sourceHash',busy_work_private.hash(item),'legacy',s.payload->'replyActions'->c);
END $$;
CREATE FUNCTION busy_work_private.project(r public.business_work_engagements) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('businessId',r.business_id,'customerId',r.customer_id,'engagementId',r.id,'enquiryId',r.enquiry_id,'ownerId',r.created_by,'revision',r.revision,'schemaVersion',r.schema_version,'type',r.kind,'status',r.status,'sourceHash',r.source_hash,'customerHash',r.customer_hash,'recordHash',busy_work_private.hash(r.work_data),'createdAt',r.created_at,'updatedAt',r.updated_at,
 'record',jsonb_build_object('type',r.kind,'done',r.work_data->'done','details',jsonb_build_object('quoteStatus',r.status,'quoteAmount',r.work_data->'details'->'quoteAmount','message',r.work_data->'details'->'message','plannedSentDate',r.work_data->'details'->'plannedSentDate')),'readOnlyObservation',true,'notOwnReceipt',true)
$$;
CREATE FUNCTION busy_work_private.target(b uuid,c text,id uuid,expected bigint DEFAULT NULL) RETURNS public.business_work_engagements LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(b);r public.business_work_engagements%ROWTYPE;ctx jsonb;
BEGIN
 -- Snapshot source lock precedes engagement locks everywhere; no reversed lock order.
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND business_work_engagements.id=target.id;
 IF NOT FOUND OR r.created_by<>actor THEN RAISE EXCEPTION 'Engagement unavailable' USING ERRCODE='42501';END IF;
 ctx:=busy_work_private.source_context(b,c,r.enquiry_id);
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND business_work_engagements.id=target.id FOR UPDATE;
 IF r.created_by<>actor OR expected IS NOT NULL AND r.revision IS DISTINCT FROM expected OR r.source_hash IS DISTINCT FROM ctx->>'sourceHash' OR r.customer_hash IS DISTINCT FROM ctx->>'customerHash' THEN RAISE EXCEPTION 'Engagement/source conflict' USING ERRCODE='40001';END IF;
 RETURN r;
END $$;
CREATE FUNCTION busy_work_private.valid_quote(amount text,words text,day text,op text) RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF amount IS NULL OR amount !~ '^[0-9]+(\.[0-9]{1,2})?$' OR length(amount)>18 OR words IS NULL OR btrim(words)='' OR octet_length(words)>10000 OR day IS NULL OR day !~ '^\d{4}-\d{2}-\d{2}$' OR op IS NULL OR op !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid reviewed quote' USING ERRCODE='22023';END IF;
 BEGIN IF to_char(day::date,'YYYY-MM-DD')<>day THEN RAISE EXCEPTION 'Invalid day' USING ERRCODE='22023';END IF;EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN RAISE EXCEPTION 'Invalid day' USING ERRCODE='22023';END;
END $$;
CREATE FUNCTION public.busy_work_source_review_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);a jsonb:=x->'legacy';
BEGIN
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'ownerId',x->'actor','snapshotRevision',x->'revision','schemaVersion',1,'sourceHash',x->'sourceHash','customerHash',x->'customerHash','customer',jsonb_build_object('id',p_customer_id,'name',x->'customer'->'name','service',x->'customer'->'service'),'enquiry',jsonb_build_object('id',p_enquiry_id,'rawText',x->'enquiry'->'rawText','reviewedAt',x->'enquiry'->'reviewedAt'),'hasLegacyWork',coalesce(a->'details'->'enquiryReference'->>'inboxId'=p_enquiry_id,false),'readOnlyObservation',true,'notOwnReceipt',true);
END $$;
CREATE FUNCTION public.busy_work_create_quote_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint,p_customer_hash text,p_source_hash text,p_amount text,p_text text,p_date text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);r public.business_work_engagements%ROWTYPE;
BEGIN
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 PERFORM busy_work_private.valid_quote(p_amount,p_text,p_date,p_operation_id);
 IF x->>'customerHash' IS DISTINCT FROM p_customer_hash OR x->>'sourceHash' IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001';END IF;
 -- The exact original legacy source must be migrated explicitly, never duplicated.
 IF x->'legacy'->'details'->'enquiryReference'->>'inboxId'=p_enquiry_id THEN RAISE EXCEPTION 'Review legacy migration' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_engagements(business_id,customer_id,enquiry_id,created_by,modified_by,kind,status,source_snapshot_revision,customer_hash,source_hash,source_evidence,work_data,creation_operation_id)
 VALUES(p_business_id,p_customer_id,p_enquiry_id,(x->>'actor')::uuid,(x->>'actor')::uuid,'quote','Prepared',(x->>'revision')::bigint,p_customer_hash,p_source_hash,jsonb_build_object('customer',x->'customer','enquiry',x->'enquiry'),jsonb_build_object('type','quote','task','Prepare a private quote','origin','manual','done',true,'details',jsonb_build_object('quoteStatus','Prepared','quoteAmount',p_amount,'message',p_text,'plannedSentDate',p_date)),p_operation_id) RETURNING * INTO r;
 RETURN jsonb_build_object('operation','engagement_create_quote','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'engagementId',r.id,'actorId',r.created_by,'previousRevision',0,'revision',1,'schemaVersion',1,'sourceHash',r.source_hash,'recordHash',busy_work_private.hash(r.work_data));
END $$;
CREATE FUNCTION public.busy_work_migrate_legacy_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint,p_legacy_hash text,p_source_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);a jsonb:=x->'legacy';e jsonb:=x->'enquiry';ref jsonb;r public.business_work_engagements%ROWTYPE;
BEGIN
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' OR a IS NULL OR busy_work_private.hash(a) IS DISTINCT FROM p_legacy_hash OR x->>'sourceHash' IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Legacy review changed' USING ERRCODE='40001';END IF;
 ref:=a->'details'->'enquiryReference';
 IF a ? 'version' OR a->>'type' IS DISTINCT FROM 'quote' OR a->>'origin' IS DISTINCT FROM 'manual' OR a->'details'->>'sourceMiniAppRequestId' IS NOT NULL OR a->'details'->>'quoteStatus' IS DISTINCT FROM 'Prepared' OR jsonb_typeof(a->'done') IS DISTINCT FROM 'boolean' OR ref->>'version' IS DISTINCT FROM '1' OR ref->>'businessId' IS DISTINCT FROM p_business_id::text OR ref->>'customerId' IS DISTINCT FROM p_customer_id OR ref->>'inboxId' IS DISTINCT FROM p_enquiry_id OR ref->>'reviewedAt' IS DISTINCT FROM e->>'reviewedAt' OR coalesce(ref->>'queuedAt','')<>coalesce(e->>'queuedAt','') OR coalesce((ref->>'snapshotRevision')::bigint,0) NOT BETWEEN 1 AND (x->>'revision')::bigint THEN RAISE EXCEPTION 'Unsupported legacy source' USING ERRCODE='22023';END IF;
 PERFORM busy_work_private.valid_quote(a->'details'->>'quoteAmount',a->'details'->>'message',a->'details'->>'plannedSentDate',p_operation_id);
 INSERT INTO public.business_work_engagements(business_id,customer_id,enquiry_id,created_by,modified_by,kind,status,source_snapshot_revision,customer_hash,source_hash,source_evidence,work_data,creation_operation_id,legacy_record_hash)
 VALUES(p_business_id,p_customer_id,p_enquiry_id,(x->>'actor')::uuid,(x->>'actor')::uuid,'quote','Prepared',(x->>'revision')::bigint,x->>'customerHash',p_source_hash,jsonb_build_object('customer',x->'customer','enquiry',e),a,p_operation_id,p_legacy_hash) RETURNING * INTO r;
 RETURN jsonb_build_object('operation','engagement_migrate_legacy','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'engagementId',r.id,'actorId',r.created_by,'previousRevision',0,'revision',1,'schemaVersion',1,'sourceHash',r.source_hash,'recordHash',busy_work_private.hash(r.work_data));
END $$;
CREATE FUNCTION public.busy_work_list_v1(p_business_id uuid,p_customer_id text,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(p_business_id);items jsonb;more boolean;cursor uuid;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_customer_id IS NULL THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('engagementId',id,'enquiryId',enquiry_id,'type',kind,'status',status,'revision',revision) ORDER BY id),'[]') INTO items FROM (SELECT * FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND created_by=actor AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT p_limit) a;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'engagementId')::uuid;END IF;
 SELECT EXISTS(SELECT 1 FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND created_by=actor AND id>cursor) INTO more;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'ownerId',actor,'items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'readOnlyObservation',true,'notOwnReceipt',true);
END $$;
-- Retained history is not current source/mutation authority. No reassociation.
CREATE FUNCTION public.busy_work_history_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(p_business_id);r public.business_work_engagements%ROWTYPE;x jsonb;state text:='current';
BEGIN
 -- Current source checks lock membership/snapshot before the retained row.
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND id=p_engagement_id;
 IF NOT FOUND OR r.created_by<>actor THEN RAISE EXCEPTION 'Engagement unavailable' USING ERRCODE='42501';END IF;
 BEGIN
  x:=busy_work_private.source_context(p_business_id,p_customer_id,r.enquiry_id);
  IF x->>'sourceHash' IS DISTINCT FROM r.source_hash OR x->>'customerHash' IS DISTINCT FROM r.customer_hash THEN state:='changed';END IF;
 EXCEPTION WHEN SQLSTATE '42501' THEN state:='restricted'; WHEN SQLSTATE '22023' THEN state:='unsupported'; WHEN SQLSTATE '40001' THEN state:='unavailable';
 END;
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND id=p_engagement_id FOR SHARE;
 IF NOT FOUND OR r.created_by<>actor THEN RAISE EXCEPTION 'Engagement unavailable' USING ERRCODE='42501';END IF;
 RETURN busy_work_private.project(r)||jsonb_build_object('historicalOnly',true,'sourceState',state,'mutationAuthorised',false,
  'originalSource',jsonb_build_object('enquiryId',r.enquiry_id,'snapshotRevision',r.source_snapshot_revision,'sourceHash',r.source_hash,'reviewedAt',r.source_evidence->'enquiry'->'reviewedAt'));
END $$;
-- Fresh owner entry without assuming a customer exists on this device.
CREATE FUNCTION public.busy_work_discover_v1(p_business_id uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(p_business_id);items jsonb;cursor uuid;more boolean;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('engagementId',id,'customerId',customer_id,'enquiryId',enquiry_id,'type',kind,'status',status,'revision',revision) ORDER BY id),'[]') INTO items FROM (SELECT * FROM public.business_work_engagements WHERE business_id=p_business_id AND created_by=actor AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT p_limit) a;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'engagementId')::uuid;END IF;
 SELECT EXISTS(SELECT 1 FROM public.business_work_engagements WHERE business_id=p_business_id AND created_by=actor AND id>cursor) INTO more;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'readOnlyObservation',true,'notOwnReceipt',true);
END $$;
CREATE FUNCTION public.busy_work_compare_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE h jsonb:=public.busy_work_history_v1(p_business_id,p_customer_id,p_engagement_id);r public.business_work_engagements%ROWTYPE;x jsonb;original jsonb;current_source jsonb;state text:=h->>'sourceState';
BEGIN
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND id=p_engagement_id FOR SHARE;
 IF NOT FOUND OR r.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Engagement unavailable' USING ERRCODE='42501';END IF;
 original:=jsonb_build_object('customerName',CASE WHEN octet_length(r.source_evidence->'customer'->>'name')<=2000 THEN r.source_evidence->'customer'->'name' ELSE NULL END,'service',CASE WHEN octet_length(r.source_evidence->'customer'->>'service')<=2000 THEN r.source_evidence->'customer'->'service' ELSE NULL END,'enquiryText',r.source_evidence->'enquiry'->'rawText','reviewedAt',r.source_evidence->'enquiry'->'reviewedAt');
 IF state IN ('current','changed') THEN
  x:=busy_work_private.source_context(p_business_id,p_customer_id,r.enquiry_id);
  IF octet_length(x->'customer'->>'name')>2000 OR octet_length(x->'customer'->>'service')>2000 THEN state:='unsupported';
  ELSE current_source:=jsonb_build_object('customerName',x->'customer'->'name','service',x->'customer'->'service','enquiryText',x->'enquiry'->'rawText','reviewedAt',x->'enquiry'->'reviewedAt');END IF;
 END IF;
 RETURN h||jsonb_build_object('sourceState',state,'originalContext',original,'currentContext',current_source,'comparisonOnly',true,'currentSnapshotRevision',CASE WHEN current_source IS NOT NULL THEN x->'revision' ELSE NULL END,'customerEvidenceChanged',CASE WHEN current_source IS NOT NULL THEN r.customer_hash IS DISTINCT FROM x->>'customerHash' ELSE NULL END,'enquiryEvidenceChanged',CASE WHEN current_source IS NOT NULL THEN r.source_hash IS DISTINCT FROM x->>'sourceHash' ELSE NULL END);
END $$;
-- Current finite editor eligibility; never a restored customer or historical capability.
CREATE FUNCTION public.busy_work_edit_context_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_expected_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE;ops text[]:=ARRAY['edit_quote'];snapshot_rev bigint;
BEGIN
 IF p_expected_revision IS NULL OR p_expected_revision<1 THEN RAISE EXCEPTION 'Expected engagement revision required' USING ERRCODE='22023';END IF;
 r:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);
 IF has_function_privilege('authenticated',to_regprocedure('public.busy_work_edit_quote_v1(uuid,text,uuid,bigint,text,text,text,text,text)'),'EXECUTE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'Quote editing unavailable' USING ERRCODE='42501';END IF;
 IF has_function_privilege('authenticated',to_regprocedure('public.busy_work_private_write_v1(uuid,text,uuid,bigint,bigint,text,text,text,text)'),'EXECUTE') THEN ops:=array_append(ops,'private_followup');END IF;
 SELECT revision INTO snapshot_rev FROM public.busy_business_snapshots WHERE business_id=p_business_id;
 RETURN busy_work_private.project(r)||jsonb_build_object('currentEditContext',true,'allowedOperations',to_jsonb(ops),'contextSnapshotRevision',snapshot_rev);
END $$;
CREATE FUNCTION public.busy_work_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id);
BEGIN RETURN busy_work_private.project(r);END $$;
CREATE FUNCTION public.busy_work_edit_quote_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_expected_revision bigint,p_source_hash text,p_amount text,p_text text,p_date text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);before bigint:=r.revision;
BEGIN
 PERFORM busy_work_private.valid_quote(p_amount,p_text,p_date,p_operation_id);
 IF r.status<>'Prepared' OR r.source_hash IS DISTINCT FROM p_source_hash OR p_expected_revision IS NULL THEN RAISE EXCEPTION 'Quote conflict' USING ERRCODE='40001';END IF;
 UPDATE public.business_work_engagements SET work_data=jsonb_set(jsonb_set(jsonb_set(r.work_data,'{details,quoteAmount}',to_jsonb(p_amount)),'{details,message}',to_jsonb(p_text)),'{details,plannedSentDate}',to_jsonb(p_date)),revision=r.revision+1,modified_by=auth.uid(),updated_at=clock_timestamp() WHERE id=r.id RETURNING * INTO r;
 RETURN jsonb_build_object('operation','engagement_edit_quote','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',r.id,'actorId',auth.uid(),'previousRevision',before,'revision',r.revision,'schemaVersion',1,'sourceHash',r.source_hash,'recordHash',busy_work_private.hash(r.work_data));
END $$;
CREATE FUNCTION public.busy_work_private_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_kind text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id);d public.business_work_private_drafts%ROWTYPE;
BEGIN
 IF p_kind IS NULL OR p_kind NOT IN ('reply','followup') THEN RAISE EXCEPTION 'Unsupported draft' USING ERRCODE='22023';END IF;
 SELECT * INTO d FROM public.business_work_private_drafts WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND owner_id=auth.uid() AND kind=p_kind;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'ownerId',auth.uid(),'kind',p_kind,'revision',coalesce(d.revision,0),'text',d.text,'engagementRevision',d.engagement_revision,'needsReview',d.engagement_revision IS DISTINCT FROM r.revision,'readOnlyObservation',true,'notOwnReceipt',true);
END $$;
CREATE FUNCTION public.busy_work_private_write_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_engagement_revision bigint,p_expected_draft_revision bigint,p_source_hash text,p_kind text,p_text text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_engagement_revision);d public.business_work_private_drafts%ROWTYPE;next_rev bigint;
BEGIN
 IF p_kind IS NULL OR p_kind NOT IN ('reply','followup') OR p_text IS NULL OR btrim(p_text)='' OR octet_length(p_text)>10000 OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' OR p_expected_draft_revision IS NULL OR p_expected_draft_revision<0 THEN RAISE EXCEPTION 'Invalid private wording' USING ERRCODE='22023';END IF;
 IF p_engagement_revision IS NULL OR r.source_hash IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Private source changed' USING ERRCODE='40001';END IF;
 SELECT * INTO d FROM public.business_work_private_drafts WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND owner_id=auth.uid() AND kind=p_kind FOR UPDATE;
 IF coalesce(d.revision,0)<>p_expected_draft_revision THEN RAISE EXCEPTION 'Private revision conflict' USING ERRCODE='40001';END IF;
 next_rev:=p_expected_draft_revision+1;
 IF p_expected_draft_revision=0 THEN INSERT INTO public.business_work_private_drafts(business_id,customer_id,engagement_id,owner_id,kind,engagement_revision,source_hash,text,operation_id) VALUES(p_business_id,p_customer_id,p_engagement_id,auth.uid(),p_kind,r.revision,r.source_hash,p_text,p_operation_id);
 ELSE UPDATE public.business_work_private_drafts SET text=p_text,engagement_revision=r.revision,source_hash=p_source_hash,revision=next_rev,operation_id=p_operation_id,updated_at=clock_timestamp() WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND owner_id=auth.uid() AND kind=p_kind;END IF;
 RETURN jsonb_build_object('operation','engagement_private_wording','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'actorId',auth.uid(),'kind',p_kind,'previousRevision',p_expected_draft_revision,'revision',next_rev,'engagementRevision',r.revision,'schemaVersion',1,'textHash',busy_work_private.hash(to_jsonb(p_text)));
END $$;
CREATE FUNCTION busy_work_private.protect_identity() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF ROW(NEW.id,NEW.business_id,NEW.customer_id,NEW.enquiry_id,NEW.created_by,NEW.creation_operation_id,NEW.created_at,NEW.legacy_record_hash,NEW.source_hash,NEW.customer_hash,NEW.source_evidence,NEW.kind,NEW.status,NEW.schema_version) IS DISTINCT FROM ROW(OLD.id,OLD.business_id,OLD.customer_id,OLD.enquiry_id,OLD.created_by,OLD.creation_operation_id,OLD.created_at,OLD.legacy_record_hash,OLD.source_hash,OLD.customer_hash,OLD.source_evidence,OLD.kind,OLD.status,OLD.schema_version) THEN RAISE EXCEPTION 'Immutable engagement/source identity' USING ERRCODE='42501';END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER busy_canonical_identity BEFORE UPDATE ON public.business_work_engagements FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_identity();
-- Migrated legacy Work becomes read-only: no writable second authority.
CREATE FUNCTION busy_work_private.protect_legacy() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r record;
BEGIN
 FOR r IN SELECT customer_id FROM public.business_work_engagements WHERE business_id=OLD.business_id AND legacy_record_hash IS NOT NULL LOOP
  IF TG_OP='DELETE' OR OLD.payload->'replyActions'->r.customer_id IS DISTINCT FROM NEW.payload->'replyActions'->r.customer_id THEN RAISE EXCEPTION 'Canonical legacy Work is read-only' USING ERRCODE='42501';END IF;
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
CREATE TRIGGER busy_canonical_legacy_readonly BEFORE UPDATE OR DELETE ON public.busy_business_snapshots FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_legacy();
DO $$ DECLARE f record;r text;t regclass;
BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature,p.proname FROM pg_proc p WHERE p.pronamespace='busy_work_private'::regnamespace OR p.pronamespace='public'::regnamespace AND p.proname IN ('busy_work_source_review_v1','busy_work_create_quote_v1','busy_work_migrate_legacy_v1','busy_work_list_v1','busy_work_discover_v1','busy_work_compare_v1','busy_work_edit_context_v1','busy_work_history_v1','busy_work_read_v1','busy_work_edit_quote_v1','busy_work_private_read_v1','busy_work_private_write_v1') LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
  IF f.proname LIKE 'busy_work_%' AND f.proname<>'busy_work_migrate_legacy_v1' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
 END LOOP;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  FOREACH t IN ARRAY ARRAY['public.business_work_engagements'::regclass,'public.business_work_private_drafts'::regclass] LOOP
   IF has_any_column_privilege(r,t,'SELECT,INSERT,UPDATE,REFERENCES') OR has_table_privilege(r,t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') THEN RAISE EXCEPTION 'Effective raw privilege remains for % on %',r,t;END IF;
  END LOOP;
  IF has_any_column_privilege(r,'public.busy_business_snapshots','UPDATE') OR has_table_privilege(r,'public.busy_business_snapshots','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') THEN RAISE EXCEPTION 'Snapshot fence missing';END IF;
  IF EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.busy_business_snapshots'::regclass AND attnum>0 AND NOT attisdropped AND attname<>'business_id' AND has_column_privilege(r,'public.busy_business_snapshots',attname,'SELECT,INSERT')) THEN RAISE EXCEPTION 'Broad snapshot column access remains';END IF;
  IF has_schema_privilege(r,'busy_work_private','USAGE') THEN RAISE EXCEPTION 'Private helper schema exposed';END IF;
  FOR f IN SELECT p.oid,p.proname,p.pronamespace FROM pg_proc p WHERE p.pronamespace='busy_work_private'::regnamespace OR p.pronamespace='public'::regnamespace AND left(p.proname,10)='busy_work_' LOOP
   IF (f.pronamespace='busy_work_private'::regnamespace OR f.proname='busy_work_migrate_legacy_v1' OR r<>'authenticated') AND has_function_privilege(r,f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Unexpected inherited RPC execution' USING ERRCODE='42501';END IF;
  END LOOP;
 END LOOP;
END $$;
COMMIT;
