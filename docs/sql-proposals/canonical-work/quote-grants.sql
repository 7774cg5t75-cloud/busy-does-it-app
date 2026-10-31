-- V22.52 LOCAL grant/response CANDIDATE, not an activated disclosure policy.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'QUOTE GRANT REVIEW FUSE: separate hosted approval required'; END $$;
DO $$ BEGIN
 IF to_regclass('public.business_work_quote_access_preparations') IS NULL OR to_regclass('public.business_work_quote_grant_candidates') IS NOT NULL THEN RAISE EXCEPTION 'Exact recipient management baseline required';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='busy_work_private.source_context(uuid,text,text,bigint)'::regprocedure AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='400a98d2f695b5e61327349287356b4cf4ed67ee335ba971e3efa53bf7f13f31') THEN RAISE EXCEPTION 'Unreviewed installed quote authority' USING ERRCODE='55000';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.busy_work_quote_recipient_review_v1(uuid,text,uuid,uuid,uuid)'::regprocedure AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='b270d76b5594d2cb76f6a7a198dcc097f9b6e4f2dda63ba72e7fb0480aff3af2') THEN RAISE EXCEPTION 'Unreviewed installed quote authority' USING ERRCODE='55000';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.busy_work_consumer_quote_access_v1(uuid)'::regprocedure AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='8c4825fb06eb76dbb427eb14ce98e5cf9ccafd34b3b266a63a332dc94f968087') THEN RAISE EXCEPTION 'Unreviewed installed quote authority' USING ERRCODE='55000';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.busy_work_consumer_quote_response_v1(uuid,text,text)'::regprocedure AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='dcfa170a164c97f34750d7e451404e7fe19421770ddc4cbb86c7f2601cd19e4c') THEN RAISE EXCEPTION 'Unreviewed installed quote authority' USING ERRCODE='55000';END IF;
END $$;
CREATE FUNCTION busy_work_private.source_context_for_owner(b uuid,c text,e text,trusted_owner uuid,expected bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=trusted_owner;member_role text;s public.busy_business_snapshots%ROWTYPE;cust jsonb;item jsonb;projection jsonb;n integer;
BEGIN
 SELECT role INTO member_role FROM public.busy_business_memberships WHERE business_id=b AND user_id=actor FOR SHARE;
 IF actor IS NULL OR member_role IS DISTINCT FROM 'owner' OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor) THEN RAISE EXCEPTION 'Current original owner required' USING ERRCODE='42501';END IF;
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
CREATE OR REPLACE FUNCTION busy_work_private.source_context(b uuid,c text,e text,expected bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(b);
BEGIN RETURN busy_work_private.source_context_for_owner(b,c,e,actor,expected);END $$;
CREATE FUNCTION busy_work_private.recipient_source(b uuid,c text,req uuid,original_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$DECLARE r public.busy_mini_app_requests%ROWTYPE;l public.busy_mini_app_request_links%ROWTYPE;a public.busy_mini_apps%ROWTYPE;version public.busy_mini_app_versions%ROWTYPE;reason text:='missing_or_unsupported_request';identified boolean:=false;
BEGIN
 -- Shared original request/link/app locks stabilise this observation only; no future execution authority.
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE id=req AND business_id=b FOR SHARE;
 IF FOUND THEN
  SELECT * INTO l FROM public.busy_mini_app_request_links WHERE request_id=r.id AND business_id=b FOR SHARE;
  IF FOUND AND l.customer_record_id=c AND l.linked_by=original_owner AND r.status='reviewing' AND ((r.request_type='enquiry' AND r.module_key='enquiry' AND l.bridge_state='enquiry_linked') OR (r.request_type='booking_request' AND r.module_key='booking_request' AND l.bridge_state='booking_draft' AND l.action_record_id IS NOT NULL)) THEN
   SELECT * INTO a FROM public.busy_mini_apps WHERE id=r.mini_app_id AND business_id=b FOR SHARE;
   IF FOUND AND a.status IN ('live','update_pending') AND a.current_live_version_id IS NOT NULL AND a.current_live_version_id=r.version_id THEN
    SELECT * INTO version FROM public.busy_mini_app_versions WHERE id=r.version_id AND mini_app_id=a.id AND business_id=b AND state='live' FOR SHARE;
    IF FOUND AND r.consumer_user_id IS NOT NULL AND EXISTS(SELECT 1 FROM auth.users WHERE id=r.consumer_user_id) AND coalesce(to_jsonb(r)->>'request_origin','signed_in')='signed_in' THEN
     IF EXISTS(SELECT 1 FROM public.busy_mini_app_request_links x JOIN public.busy_mini_app_requests y ON y.id=x.request_id AND y.business_id=x.business_id WHERE x.business_id=b AND x.customer_record_id=c AND y.consumer_user_id IS DISTINCT FROM r.consumer_user_id) THEN reason:='ambiguous_consumer_associations';
     ELSE identified:=true;reason:='owner_linked_signed_in_request';END IF;
    ELSE reason:='unsupported_consumer_or_request_origin';END IF;
   ELSE reason:='app_or_reviewed_version_unavailable';END IF;
  ELSE reason:='missing_or_incompatible_owner_link';END IF;
 END IF;
 RETURN jsonb_build_object('recipientIdentified',identified,'provenance',reason,'recipient',CASE WHEN identified THEN jsonb_build_object('consumerId',r.consumer_user_id,'requestId',r.id,'requestRevision',r.updated_at,'linkId',l.id,'linkRevision',l.updated_at,'appId',a.id,'appVersionId',version.id,'actionId',l.action_record_id) ELSE NULL END);
END $$;
CREATE OR REPLACE FUNCTION public.busy_work_quote_recipient_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE q jsonb:=public.busy_work_quote_reference_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);
BEGIN
 IF q->>'termsChanged'='true' THEN RAISE EXCEPTION 'Current exact quote reference required' USING ERRCODE='40001';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'quoteRevision',q->'quoteRevision','termsHash',q->'termsHash','notOwnReceipt',true,'consumerAccessAuthorised',false,'quoteRequestAssociated',false,'customerResponseLinked',false,'executionAuthorised',false)||busy_work_private.recipient_source(p_business_id,p_customer_id,p_request_id,auth.uid());
END $$;
CREATE TABLE public.business_work_quote_grant_candidates(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL,customer_id text NOT NULL,engagement_id uuid NOT NULL,reference_id uuid NOT NULL,created_by uuid NOT NULL,
 preparation_id uuid NOT NULL REFERENCES public.business_work_quote_access_preparations(id) ON DELETE RESTRICT,
 binding_id uuid NOT NULL REFERENCES public.business_work_quote_recipient_bindings(id) ON DELETE RESTRICT,binding_revision bigint NOT NULL,
 generation bigint NOT NULL CHECK(generation>0),revision bigint NOT NULL DEFAULT 1 CHECK(revision=1),quote_revision bigint NOT NULL,terms_hash text NOT NULL,record_hash text NOT NULL,source_hash text NOT NULL,customer_hash text NOT NULL,source_snapshot_revision bigint NOT NULL,
 consumer_id uuid NOT NULL,request_id uuid NOT NULL,app_id uuid NOT NULL,recipient_evidence jsonb NOT NULL,recipient_hash text NOT NULL,
 projection jsonb NOT NULL,review_hash text NOT NULL,mode text NOT NULL DEFAULT 'candidate_disabled' CHECK(mode='candidate_disabled'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),expires_at timestamptz NOT NULL,operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),
 UNIQUE(preparation_id,generation),UNIQUE(business_id,created_by,operation_id),CHECK(expires_at>recorded_at)
);
CREATE INDEX busy_quote_grant_page ON public.business_work_quote_grant_candidates(business_id,customer_id,engagement_id,reference_id,created_by,id);
CREATE TABLE public.business_work_quote_grant_revocations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),grant_id uuid NOT NULL UNIQUE REFERENCES public.business_work_quote_grant_candidates(id) ON DELETE RESTRICT,
 business_id uuid NOT NULL,created_by uuid NOT NULL,revision bigint NOT NULL DEFAULT 2 CHECK(revision=2),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),UNIQUE(business_id,created_by,operation_id)
);
CREATE TABLE public.business_work_quote_response_candidates(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),grant_id uuid NOT NULL REFERENCES public.business_work_quote_grant_candidates(id) ON DELETE RESTRICT,
 actor_id uuid NOT NULL,revision bigint NOT NULL CHECK(revision>0),action text NOT NULL CHECK(action IN ('accept','decline','question')),
 question text NOT NULL CHECK(octet_length(question)<=10000),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),
 mode text NOT NULL DEFAULT 'candidate_disabled' CHECK(mode='candidate_disabled'),UNIQUE(grant_id,revision),UNIQUE(grant_id,actor_id,operation_id),
 CHECK((action='question' AND btrim(question)<>'') OR (action<>'question' AND question=''))
);
DO $$ DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['business_work_quote_grant_candidates','business_work_quote_grant_revocations','business_work_quote_response_candidates'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated,service_role',t);
 EXECUTE format('CREATE TRIGGER immutable_quote_candidate BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_quote_binding()',t);
 END LOOP;END $$;
CREATE FUNCTION busy_work_private.grant_owner(b uuid,c text,e uuid,r uuid,g uuid) RETURNS public.business_work_quote_grant_candidates LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(b);x public.business_work_quote_grant_candidates%ROWTYPE;
BEGIN
 SELECT * INTO x FROM public.business_work_quote_grant_candidates WHERE id=g AND business_id=b AND customer_id=c AND engagement_id=e AND reference_id=r AND created_by=actor;
 IF NOT FOUND THEN RAISE EXCEPTION 'Grant unavailable' USING ERRCODE='42501';END IF;
 PERFORM busy_work_private.managed_binding(b,c,e,r);RETURN x;
END $$;
-- Shared source-bound validator. No public EXECUTE and no owner identity impersonation.
-- Caller must separately authorise the actual owner or exact consumer BEFORE using it.
CREATE FUNCTION busy_work_private.grant_validate(gid uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE;e public.business_work_engagements%ROWTYPE;q public.business_work_quote_references%ROWTYPE;b public.business_work_quote_recipient_bindings%ROWTYPE;d public.business_work_quote_binding_decisions%ROWTYPE;p public.business_work_quote_access_preparations%ROWTYPE;a public.busy_mini_apps%ROWTYPE;s jsonb;v jsonb;req uuid;rev bigint;
BEGIN
 SELECT * INTO g FROM public.business_work_quote_grant_candidates WHERE id=gid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Grant unavailable' USING ERRCODE='42501';END IF;
 s:=busy_work_private.source_context_for_owner(g.business_id,g.customer_id,(SELECT enquiry_id FROM public.business_work_engagements WHERE id=g.engagement_id AND business_id=g.business_id),g.created_by);
 SELECT * INTO e FROM public.business_work_engagements WHERE id=g.engagement_id AND business_id=g.business_id AND customer_id=g.customer_id AND created_by=g.created_by FOR UPDATE;
 IF NOT FOUND OR e.status<>'Prepared' OR e.revision<>g.quote_revision OR busy_work_private.hash(e.work_data)<>g.record_hash OR e.source_hash IS DISTINCT FROM s->>'sourceHash' OR e.customer_hash IS DISTINCT FROM s->>'customerHash' OR e.source_hash<>g.source_hash OR e.customer_hash<>g.customer_hash THEN RAISE EXCEPTION 'Current quote/source conflict' USING ERRCODE='40001';END IF;
 SELECT * INTO q FROM public.business_work_quote_references WHERE id=g.reference_id AND business_id=g.business_id AND customer_id=g.customer_id AND engagement_id=e.id AND created_by=g.created_by;
 IF NOT FOUND OR q.quote_revision<>g.quote_revision OR q.terms_hash<>g.terms_hash OR busy_work_private.hash(busy_work_private.quote_terms(e))<>q.terms_hash THEN RAISE EXCEPTION 'Exact terms conflict' USING ERRCODE='40001';END IF;
 SELECT * INTO b FROM public.business_work_quote_recipient_bindings WHERE id=g.binding_id AND business_id=g.business_id AND reference_id=q.id AND created_by=g.created_by FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Binding unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO d FROM public.business_work_quote_binding_decisions WHERE binding_id=b.id ORDER BY revision DESC LIMIT 1;
 rev:=coalesce(d.revision,1);req:=CASE WHEN d.action='replace' THEN (d.recipient_review->'recipient'->>'requestId')::uuid ELSE b.request_id END;
 IF d.action='revoke' OR rev<>g.binding_revision OR req<>g.request_id THEN RAISE EXCEPTION 'Binding revoked or replaced' USING ERRCODE='40001';END IF;
 SELECT * INTO p FROM public.business_work_quote_access_preparations WHERE id=g.preparation_id AND binding_id=b.id AND created_by=g.created_by FOR SHARE;
 IF NOT FOUND OR p.binding_revision<>rev OR p.terms_hash<>g.terms_hash OR EXISTS(SELECT 1 FROM public.business_work_quote_access_withdrawals WHERE preparation_id=p.id) THEN RAISE EXCEPTION 'Preparation withdrawn or stale' USING ERRCODE='40001';END IF;
 SELECT * INTO g FROM public.business_work_quote_grant_candidates WHERE id=gid FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.business_work_quote_grant_revocations WHERE grant_id=g.id) OR g.expires_at<=clock_timestamp() OR p.expires_at<=clock_timestamp() OR g.generation<>(SELECT max(generation) FROM public.business_work_quote_grant_candidates WHERE preparation_id=p.id) THEN RAISE EXCEPTION 'Grant revoked expired or superseded' USING ERRCODE='40001';END IF;
 v:=busy_work_private.recipient_source(g.business_id,g.customer_id,g.request_id,g.created_by);
 IF v->>'recipientIdentified' IS DISTINCT FROM 'true' OR busy_work_private.hash(v)<>g.recipient_hash OR v->'recipient'->>'consumerId'<>g.consumer_id::text OR v->'recipient'->>'appId'<>g.app_id::text THEN RAISE EXCEPTION 'Recipient/request evidence changed' USING ERRCODE='40001';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE id=g.app_id AND business_id=g.business_id;
 IF g.projection->>'businessAppSlug' IS DISTINCT FROM a.public_slug OR g.projection->>'businessDisplayName' IS DISTINCT FROM a.display_name THEN RAISE EXCEPTION 'Business-facing identity changed' USING ERRCODE='40001';END IF;
 RETURN jsonb_build_object('grantId',g.id,'grantRevision',1,'generation',g.generation,'quoteReference',g.reference_id,'quoteRevision',g.quote_revision,'termsHash',g.terms_hash,'consumerId',g.consumer_id,'appId',g.app_id,'requestId',g.request_id,'projection',g.projection,'expiresAt',g.expires_at,'mode',g.mode,'consumerAccessAuthorised',false,'executionAuthorised',false,'notOwnReceipt',true);
END $$;
CREATE FUNCTION public.busy_work_quote_grant_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_preparation_id uuid,p_expected_binding_revision bigint,p_expected_generation bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=public.busy_work_quote_presentation_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);p public.business_work_quote_access_preparations%ROWTYPE;head public.business_work_quote_grant_candidates%ROWTYPE;s jsonb;v jsonb;projection jsonb;a public.busy_mini_apps%ROWTYPE;r jsonb;
BEGIN
 IF NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_quote_grant_create_v1(uuid,text,uuid,uuid,uuid,bigint,bigint,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Grant candidates unavailable' USING ERRCODE='42501';END IF;
 IF x->>'preparationState'<>'prepared_disabled' OR x->'preparation'->>'preparationId' IS DISTINCT FROM p_preparation_id::text OR (x->>'revision')::bigint IS DISTINCT FROM p_expected_binding_revision THEN RAISE EXCEPTION 'Current exact private preparation required' USING ERRCODE='40001';END IF;
 SELECT * INTO p FROM public.business_work_quote_access_preparations WHERE id=p_preparation_id FOR UPDATE;
 SELECT * INTO head FROM public.business_work_quote_grant_candidates WHERE preparation_id=p.id ORDER BY generation DESC LIMIT 1;
 IF p_expected_generation IS NOT NULL AND coalesce(head.generation,0)<>p_expected_generation OR head.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.business_work_quote_grant_revocations WHERE grant_id=head.id) THEN RAISE EXCEPTION 'Grant generation conflict; inspect or revoke existing candidate' USING ERRCODE='40001';END IF;
 s:=busy_work_private.source_context(p_business_id,p_customer_id,(SELECT enquiry_id FROM public.business_work_engagements WHERE id=p_engagement_id));
 v:=public.busy_work_quote_binding_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);r:=busy_work_private.recipient_source(p_business_id,p_customer_id,(v->'recipient'->>'requestId')::uuid,auth.uid());
 SELECT * INTO a FROM public.busy_mini_apps WHERE id=(r->'recipient'->>'appId')::uuid AND business_id=p_business_id;
 projection:=jsonb_build_object('quoteReference',p_reference_id,'quoteRevision',x->'quoteRevision','termsHash',x->'termsHash','businessAppSlug',a.public_slug,'businessDisplayName',a.display_name,'amount',x->'projection'->'amount','wording',x->'projection'->'wording','status','Prepared','appointmentConfirmed',false);
 x:=jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'preparationId',p.id,'bindingId',p.binding_id,'bindingRevision',p.binding_revision,'generation',coalesce(head.generation,0),'revision',coalesce(head.generation,0),'quoteRevision',p.quote_revision,'termsHash',p.terms_hash,'sourceHash',s->'sourceHash','customerHash',s->'customerHash','sourceSnapshotRevision',s->'revision','recordHash',(SELECT busy_work_private.hash(work_data) FROM public.business_work_engagements WHERE id=p_engagement_id),'recipientEvidence',r,'projection',projection,'expiresAt',p.expires_at,'currentGrantReview',true,'mode','candidate_disabled','consumerAccessAuthorised',false,'executionAuthorised',false,'notOwnReceipt',true);
 RETURN x||jsonb_build_object('reviewHash',busy_work_private.hash(x));
END $$;
CREATE FUNCTION public.busy_work_quote_grant_create_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_preparation_id uuid,p_expected_binding_revision bigint,p_expected_generation bigint,p_review_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb;g public.business_work_quote_grant_candidates%ROWTYPE;r jsonb;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023';END IF;
 IF p_expected_generation IS NULL THEN RAISE EXCEPTION 'Expected grant generation required' USING ERRCODE='22023';END IF;
 x:=public.busy_work_quote_grant_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_preparation_id,p_expected_binding_revision,p_expected_generation);
 IF p_review_hash IS NULL OR x->>'reviewHash' IS DISTINCT FROM p_review_hash THEN RAISE EXCEPTION 'Grant review conflict' USING ERRCODE='40001';END IF;
 r:=x->'recipientEvidence'->'recipient';
 INSERT INTO public.business_work_quote_grant_candidates(business_id,customer_id,engagement_id,reference_id,created_by,preparation_id,binding_id,binding_revision,generation,quote_revision,terms_hash,record_hash,source_hash,customer_hash,source_snapshot_revision,consumer_id,request_id,app_id,recipient_evidence,recipient_hash,projection,review_hash,expires_at,operation_id)
 VALUES(p_business_id,p_customer_id,p_engagement_id,p_reference_id,auth.uid(),p_preparation_id,(x->>'bindingId')::uuid,p_expected_binding_revision,p_expected_generation+1,(x->>'quoteRevision')::bigint,x->>'termsHash',x->>'recordHash',x->>'sourceHash',x->>'customerHash',(x->>'sourceSnapshotRevision')::bigint,(r->>'consumerId')::uuid,(r->>'requestId')::uuid,(r->>'appId')::uuid,x->'recipientEvidence',busy_work_private.hash(x->'recipientEvidence'),x->'projection',p_review_hash,(x->>'expiresAt')::timestamptz,p_operation_id) RETURNING * INTO g;
 RETURN jsonb_build_object('operation','quote_grant_candidate_create','operationId',p_operation_id,'ownOperationReceipt',true,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'actorId',auth.uid(),'grantId',g.id,'preparationId',g.preparation_id,'bindingId',g.binding_id,'bindingRevision',g.binding_revision,'previousGeneration',p_expected_generation,'generation',g.generation,'previousRevision',0,'revision',1,'quoteRevision',g.quote_revision,'termsHash',g.terms_hash,'reviewHash',g.review_hash,'sourceHash',g.source_hash,'schemaVersion',1,'recordedAt',g.recorded_at,'expiresAt',g.expires_at,'mode',g.mode,'consumerAccessAuthorised',false,'executionAuthorised',false);
END $$;
CREATE FUNCTION public.busy_work_quote_grant_list_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.managed_binding(p_business_id,p_customer_id,p_engagement_id,p_reference_id);items jsonb;cursor uuid;more boolean;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('grantId',id,'generation',generation,'bindingRevision',binding_revision,'recordedAt',recorded_at,'expiresAt',expires_at) ORDER BY id),'[]') INTO items FROM (SELECT * FROM public.business_work_quote_grant_candidates WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND reference_id=p_reference_id AND created_by=auth.uid() AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT p_limit) a;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'grantId')::uuid;END IF;
 SELECT EXISTS(SELECT 1 FROM public.business_work_quote_grant_candidates WHERE business_id=p_business_id AND reference_id=p_reference_id AND created_by=auth.uid() AND id>cursor) INTO more;
 RETURN x||jsonb_build_object('items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END);
END $$;
CREATE FUNCTION public.busy_work_quote_grant_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE:=busy_work_private.grant_owner(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id);v jsonb;state text;rev bigint:=1;
BEGIN
 IF EXISTS(SELECT 1 FROM public.business_work_quote_grant_revocations WHERE grant_id=g.id) THEN state:='revoked';rev:=2;
 ELSIF g.expires_at<=clock_timestamp() THEN state:='expired';
 ELSE BEGIN v:=busy_work_private.grant_validate(g.id);state:='eligible_candidate_disabled';EXCEPTION WHEN SQLSTATE '40001' OR SQLSTATE '42501' OR SQLSTATE '22023' THEN state:='unavailable';END;END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'grantId',g.id,'revision',rev,'generation',g.generation,'bindingId',g.binding_id,'bindingRevision',g.binding_revision,'preparationId',g.preparation_id,'quoteRevision',g.quote_revision,'termsHash',g.terms_hash,'sourceHash',g.source_hash,'recordedAt',g.recorded_at,'expiresAt',g.expires_at,'state',state,'projection',v->'projection','recipient',CASE WHEN v IS NULL THEN NULL ELSE g.recipient_evidence->'recipient' END,'mode',g.mode,'consumerAccessAuthorised',false,'executionAuthorised',false,'notOwnReceipt',true);
END $$;
CREATE FUNCTION public.busy_work_quote_grant_revoke_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid,p_expected_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=public.busy_work_quote_grant_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id);
BEGIN
 IF NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_quote_grant_revoke_v1(uuid,text,uuid,uuid,uuid,bigint,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Revocation disabled' USING ERRCODE='42501';END IF;
 IF p_expected_revision IS DISTINCT FROM 1 OR x->>'revision'<>'1' THEN RAISE EXCEPTION 'Grant revision conflict' USING ERRCODE='40001';END IF;
 RETURN x||jsonb_build_object('currentGrantRevocationReview',true,'reviewHash',busy_work_private.hash(x));
END $$;
CREATE FUNCTION public.busy_work_quote_grant_revoke_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid,p_expected_revision bigint,p_review_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb;w public.business_work_quote_grant_revocations%ROWTYPE;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023';END IF;
 x:=public.busy_work_quote_grant_revoke_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id,p_expected_revision);
 IF p_review_hash IS NULL OR x->>'reviewHash' IS DISTINCT FROM p_review_hash THEN RAISE EXCEPTION 'Revocation review conflict' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_quote_grant_revocations(grant_id,business_id,created_by,operation_id) VALUES(p_grant_id,p_business_id,auth.uid(),p_operation_id) RETURNING * INTO w;
 RETURN (x-'notOwnReceipt'-'projection'-'recipient')||jsonb_build_object('operation','quote_grant_candidate_revoke','operationId',p_operation_id,'ownOperationReceipt',true,'actorId',auth.uid(),'schemaVersion',1,'previousRevision',1,'revision',2,'revocationId',w.id,'recordedAt',w.recorded_at,'state','revoked');
END $$;
-- Private validation seam. No production role can execute it. No public activation switch.
CREATE FUNCTION busy_work_private.grant_candidate_access(gid uuid,app uuid,req uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE;v jsonb;actor uuid:=auth.uid();
BEGIN
 SELECT * INTO g FROM public.business_work_quote_grant_candidates WHERE id=gid;
 IF actor IS NULL OR NOT FOUND OR g.consumer_id<>actor OR g.app_id IS DISTINCT FROM app OR g.request_id IS DISTINCT FROM req OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor) THEN RAISE EXCEPTION 'Recipient access denied' USING ERRCODE='42501';END IF;
 v:=busy_work_private.grant_validate(gid);
 RETURN v||jsonb_build_object('candidateActorId',actor,'validationOnly',true,'notOwnReceipt',true,'consumerAccessAuthorised',false,'executionAuthorised',false);
END $$;
CREATE FUNCTION busy_work_private.grant_response_candidate(gid uuid,app uuid,req uuid,action text,question text,expected bigint,operation text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v jsonb:=busy_work_private.grant_candidate_access(gid,app,req);head bigint;r public.business_work_quote_response_candidates%ROWTYPE;
BEGIN
 IF NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_quote_grant_create_v1(uuid,text,uuid,uuid,uuid,bigint,bigint,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Response candidates disabled by retaining rollback' USING ERRCODE='42501';END IF;
 IF action IS NULL OR action NOT IN ('accept','decline','question') OR question IS NULL OR octet_length(question)>10000 OR (action='question' AND btrim(question)='') OR (action<>'question' AND question<>'') OR operation IS NULL OR operation !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid typed response candidate' USING ERRCODE='22023';END IF;
 SELECT coalesce(max(revision),0) INTO head FROM public.business_work_quote_response_candidates WHERE grant_id=gid;
 IF expected IS NULL OR expected<>head THEN RAISE EXCEPTION 'Response revision conflict' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_quote_response_candidates(grant_id,actor_id,revision,action,question,operation_id) VALUES(gid,auth.uid(),head+1,action,question,operation) RETURNING * INTO r;
 RETURN (v-'projection'-'notOwnReceipt')||jsonb_build_object('operation','quote_response_candidate','operationId',operation,'ownOperationReceipt',true,'responseId',r.id,'actorId',auth.uid(),'previousRevision',head,'revision',r.revision,'action',r.action,'recordedAt',r.recorded_at,'schemaVersion',1,'legalAcceptanceEstablished',false,'consumerAccessAuthorised',false,'executionAuthorised',false);
END $$;
CREATE FUNCTION public.busy_work_quote_response_candidates_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid,p_after bigint DEFAULT 0,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE:=busy_work_private.grant_owner(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id);items jsonb;cursor bigint;more boolean;
BEGIN
 IF p_after IS NULL OR p_after<0 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('responseId',id,'actorId',actor_id,'revision',revision,'action',action,'question',question,'recordedAt',recorded_at,'mode',mode) ORDER BY revision),'[]') INTO items FROM (SELECT * FROM public.business_work_quote_response_candidates WHERE grant_id=g.id AND revision>p_after ORDER BY revision LIMIT p_limit) a;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'revision')::bigint;END IF;
 SELECT EXISTS(SELECT 1 FROM public.business_work_quote_response_candidates WHERE grant_id=g.id AND revision>cursor) INTO more;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'grantId',g.id,'items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'mode','candidate_disabled','notOwnReceipt',true,'legalAcceptanceEstablished',false,'executionAuthorised',false);
END $$;
DO $$ DECLARE f record;r record;t text;role_name text;BEGIN
 FOR f IN SELECT oid::regprocedure AS sig,proname,pronamespace FROM pg_proc WHERE pronamespace='busy_work_private'::regnamespace OR pronamespace='public'::regnamespace AND proname IN ('busy_work_quote_grant_review_v1','busy_work_quote_grant_create_v1','busy_work_quote_grant_list_v1','busy_work_quote_grant_read_v1','busy_work_quote_grant_revoke_review_v1','busy_work_quote_grant_revoke_v1','busy_work_quote_response_candidates_v1') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.sig);FOR r IN SELECT rolname FROM pg_roles WHERE NOT rolsuper LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f.sig,r.rolname);END LOOP;
 IF f.pronamespace='public'::regnamespace THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig);END IF;END LOOP;
 FOREACH t IN ARRAY ARRAY['business_work_quote_grant_candidates','business_work_quote_grant_revocations','business_work_quote_response_candidates'] LOOP FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
 IF has_table_privilege(role_name,'public.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN RAISE EXCEPTION 'Effective quote grant table access detected' USING ERRCODE='42501';END IF;
 END LOOP;END LOOP;
END $$;
COMMIT;
