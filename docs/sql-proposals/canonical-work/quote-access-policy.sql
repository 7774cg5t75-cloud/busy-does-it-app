-- V22.53 approved policy; all disclosure/activation remains operationally disabled.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'QUOTE ACCESS POLICY REVIEW FUSE: separate hosted approval required';END $$;
DO $$ BEGIN
 IF to_regclass('public.business_work_quote_grant_candidates') IS NULL OR to_regclass('public.business_work_quote_presentations') IS NOT NULL THEN RAISE EXCEPTION 'Exact quote grant baseline required';END IF;
 IF encode(sha256(convert_to((SELECT prosrc FROM pg_proc WHERE oid='busy_work_private.grant_validate(uuid)'::regprocedure),'UTF8')),'hex')<>'d6c7243d13c2197924f3e0626f0753cfc120d4677c69128f1b6e779d42a520cd' THEN RAISE EXCEPTION 'Unreviewed source authority';END IF;
END $$;
-- Same original source/lock authority, without conflating old private expiry and customer duration.
CREATE FUNCTION busy_work_private.presentation_source(gid uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
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
 IF EXISTS(SELECT 1 FROM public.business_work_quote_grant_revocations WHERE grant_id=g.id) OR g.generation<>(SELECT max(generation) FROM public.business_work_quote_grant_candidates WHERE preparation_id=p.id) THEN RAISE EXCEPTION 'Grant revoked expired or superseded' USING ERRCODE='40001';END IF;
 v:=busy_work_private.recipient_source(g.business_id,g.customer_id,g.request_id,g.created_by);
 IF v->>'recipientIdentified' IS DISTINCT FROM 'true' OR busy_work_private.hash(v)<>g.recipient_hash OR v->'recipient'->>'consumerId'<>g.consumer_id::text OR v->'recipient'->>'appId'<>g.app_id::text THEN RAISE EXCEPTION 'Recipient/request evidence changed' USING ERRCODE='40001';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE id=g.app_id AND business_id=g.business_id;
 IF g.projection->>'businessAppSlug' IS DISTINCT FROM a.public_slug OR g.projection->>'businessDisplayName' IS DISTINCT FROM a.display_name THEN RAISE EXCEPTION 'Business-facing identity changed' USING ERRCODE='40001';END IF;
 RETURN jsonb_build_object('grantId',g.id,'grantRevision',1,'generation',g.generation,'quoteReference',g.reference_id,'quoteRevision',g.quote_revision,'termsHash',g.terms_hash,'consumerId',g.consumer_id,'appId',g.app_id,'requestId',g.request_id,'projection',g.projection,'expiresAt',g.expires_at,'mode',g.mode,'consumerAccessAuthorised',false,'executionAuthorised',false,'notOwnReceipt',true);
END $$;
CREATE TABLE public.business_work_quote_presentations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),grant_candidate_id uuid NOT NULL REFERENCES public.business_work_quote_grant_candidates(id) ON DELETE RESTRICT,
 created_by uuid NOT NULL,business_id uuid NOT NULL,customer_id text NOT NULL,engagement_id uuid NOT NULL,reference_id uuid NOT NULL,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision=1),duration_days integer NOT NULL CHECK(duration_days IN (7,14,30)),calendar_zone text NOT NULL,
 valid_until timestamptz NOT NULL,projection jsonb NOT NULL,projection_hash text NOT NULL,source_review_hash text NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),
 mode text NOT NULL DEFAULT 'prepared_disabled' CHECK(mode='prepared_disabled'),UNIQUE(grant_candidate_id),UNIQUE(business_id,created_by,operation_id)
);
CREATE INDEX busy_quote_presentation_page ON public.business_work_quote_presentations(business_id,created_by,engagement_id,id);
CREATE TABLE public.business_work_quote_presentation_revocations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),presentation_id uuid NOT NULL UNIQUE REFERENCES public.business_work_quote_presentations(id) ON DELETE RESTRICT,
 created_by uuid NOT NULL,revision bigint NOT NULL DEFAULT 2 CHECK(revision=2),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id text NOT NULL UNIQUE
);
-- Local validation records are not external activation or customer availability.
CREATE TABLE busy_work_private.quote_access_validation(
 presentation_id uuid PRIMARY KEY REFERENCES public.business_work_quote_presentations(id) ON DELETE RESTRICT,
 activated_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,mode text NOT NULL CHECK(mode='local_validation_only')
);
CREATE TABLE busy_work_private.quote_viewing_validation_sessions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),presentation_id uuid NOT NULL REFERENCES public.business_work_quote_presentations(id),consumer_id uuid NOT NULL,
 revision bigint NOT NULL DEFAULT 1,last_activity_at timestamptz NOT NULL DEFAULT clock_timestamp(),mode text NOT NULL CHECK(mode='local_validation_only')
);
CREATE TABLE busy_work_private.quote_decision_validation(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),presentation_id uuid NOT NULL REFERENCES public.business_work_quote_presentations(id),consumer_id uuid NOT NULL,
 revision bigint NOT NULL,action text NOT NULL CHECK(action IN ('request_to_proceed','decline','question')),
 question text NOT NULL CHECK(octet_length(question)<=10000),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),operation_id text NOT NULL,
 UNIQUE(presentation_id,revision),UNIQUE(presentation_id,consumer_id,operation_id),
 CHECK((action='question' AND btrim(question)<>'') OR (action<>'question' AND question=''))
);
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['public.business_work_quote_presentations','public.business_work_quote_presentation_revocations','busy_work_private.quote_access_validation','busy_work_private.quote_viewing_validation_sessions','busy_work_private.quote_decision_validation'] LOOP
 EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON %s FROM PUBLIC,anon,authenticated,service_role',t);
 END LOOP;
 CREATE TRIGGER immutable_presentation BEFORE UPDATE ON public.business_work_quote_presentations FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_quote_binding();
 CREATE TRIGGER immutable_presentation_revocation BEFORE UPDATE ON public.business_work_quote_presentation_revocations FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_quote_binding();
END $$;
CREATE FUNCTION busy_work_private.quote_calendar_expiry(started timestamptz,days integer,deadline timestamptz,zone text) RETURNS timestamptz LANGUAGE plpgsql STABLE SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF started IS NULL OR deadline IS NULL OR days IS NULL OR days NOT IN (7,14,30) OR zone IS NULL OR NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=zone) THEN RAISE EXCEPTION 'Unsupported grant duration or zone' USING ERRCODE='22023';END IF;
 RETURN least(((started AT TIME ZONE zone)+make_interval(days=>days)) AT TIME ZONE zone,deadline);
END $$;
CREATE FUNCTION busy_work_private.quote_presentation_projection(gid uuid,fields jsonb,deadline timestamptz) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE;s jsonb;v jsonb;key text;item jsonb;sum_total numeric:=0;vat numeric:=0;cust jsonb;
BEGIN
 s:=busy_work_private.presentation_source(gid);SELECT * INTO g FROM public.business_work_quote_grant_candidates WHERE id=gid;
 IF deadline IS NULL OR deadline<=clock_timestamp() OR jsonb_typeof(fields) IS DISTINCT FROM 'object' OR octet_length(fields::text)>40000 THEN RAISE EXCEPTION 'Current offer validity and finite fields required' USING ERRCODE='22023';END IF;
 FOR key IN SELECT jsonb_object_keys(fields) LOOP
 IF key NOT IN ('quoteIdentifier','businessLegalName','businessAddress','businessEmail','businessPhone','businessRegistration','paymentTerms','depositTerms','exclusions','assumptions','limitations','guarantees','warranties','terms','cancellationInformation','statutoryRights','proposedTiming','itemisedPrices') THEN RAISE EXCEPTION 'Unsupported disclosure field' USING ERRCODE='22023';END IF;
 IF key<>'itemisedPrices' AND (jsonb_typeof(fields->key)<>'string' OR length(fields->>key) NOT BETWEEN 1 AND 6000 OR fields->>key !~ '[^[:space:]]') THEN RAISE EXCEPTION 'Invalid disclosure text' USING ERRCODE='22023';END IF;
 END LOOP;
 IF NOT(fields ? 'quoteIdentifier') OR length(fields->>'quoteIdentifier')>120 THEN RAISE EXCEPTION 'Reviewed quote identifier required' USING ERRCODE='22023';END IF;
 IF fields ? 'itemisedPrices' THEN
 IF jsonb_typeof(fields->'itemisedPrices')<>'array' OR jsonb_array_length(fields->'itemisedPrices') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid itemisation' USING ERRCODE='22023';END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(fields->'itemisedPrices') LOOP
 IF jsonb_typeof(item)<>'object' OR (SELECT array_agg(k ORDER BY k) FROM jsonb_object_keys(item) k) IS DISTINCT FROM ARRAY['description','lineTotal','quantity','unitPrice','vatAmount'] OR jsonb_typeof(item->'description')<>'string' OR length(item->>'description') NOT BETWEEN 1 AND 2000 OR NOT(item->>'quantity' ~ '^[0-9]+([.][0-9]{1,3})?$') OR NOT(item->>'unitPrice' ~ '^[0-9]+([.][0-9]{1,2})?$') OR NOT(item->>'vatAmount' ~ '^[0-9]+([.][0-9]{1,2})?$') OR NOT(item->>'lineTotal' ~ '^[0-9]+([.][0-9]{1,2})?$') THEN RAISE EXCEPTION 'Invalid finite price item' USING ERRCODE='22023';END IF;
 IF (item->>'quantity')::numeric<=0 OR round((item->>'quantity')::numeric*(item->>'unitPrice')::numeric,2)+(item->>'vatAmount')::numeric<>(item->>'lineTotal')::numeric THEN RAISE EXCEPTION 'Item total mismatch' USING ERRCODE='22023';END IF;
 sum_total:=sum_total+(item->>'lineTotal')::numeric;vat:=vat+(item->>'vatAmount')::numeric;
 END LOOP;
 IF sum_total<>(g.projection->>'amount')::numeric THEN RAISE EXCEPTION 'Itemisation differs from exact quote total' USING ERRCODE='22023';END IF;
 END IF;
 cust:=busy_work_private.source_context_for_owner(g.business_id,g.customer_id,(SELECT enquiry_id FROM public.business_work_engagements WHERE id=g.engagement_id),g.created_by)->'customer';
 -- Only this exact whitelist is stored for owner approval; no source hashes/internal IDs/extensions.
 v:=fields||jsonb_build_object('businessName',g.projection->'businessDisplayName','customerName',cust->'name','quoteVersion',g.quote_revision,'scope',g.projection->'wording','total',g.projection->'amount','currency','GBP','validUntil',deadline,'offerType','provisional','proposedTimingConfirmed',false);
 IF fields ? 'itemisedPrices' THEN v:=v||jsonb_build_object('vatTotal',vat::text);END IF;
 RETURN jsonb_strip_nulls(v);
END $$;
CREATE FUNCTION public.busy_work_quote_access_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid,p_duration_days integer,p_calendar_zone text,p_valid_until timestamptz,p_fields jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE:=busy_work_private.grant_owner(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id);s jsonb;v jsonb;
BEGIN
 IF NOT has_function_privilege('authenticated','public.busy_work_quote_access_prepare_v1(uuid,text,uuid,uuid,uuid,integer,text,timestamp with time zone,jsonb,text,text)','EXECUTE') THEN RAISE EXCEPTION 'Preparation disabled' USING ERRCODE='42501';END IF;
 s:=busy_work_private.presentation_source(g.id);PERFORM busy_work_private.quote_calendar_expiry(clock_timestamp(),p_duration_days,p_valid_until,p_calendar_zone);
 IF EXISTS(SELECT 1 FROM public.business_work_quote_presentations WHERE grant_candidate_id=g.id) THEN RAISE EXCEPTION 'Presentation already recorded' USING ERRCODE='40001';END IF;
 v:=jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'grantId',g.id,'ownerId',auth.uid(),'revision',0,'quoteRevision',g.quote_revision,'sourceHash',g.source_hash,'termsHash',g.terms_hash,'bindingId',g.binding_id,'bindingRevision',g.binding_revision,'durationDays',p_duration_days,'calendarZone',p_calendar_zone,'validUntil',p_valid_until,'fields',p_fields,'projection',busy_work_private.quote_presentation_projection(g.id,p_fields,p_valid_until),'recipient',g.recipient_evidence->'recipient','currentAccessReview',true,'activatedAt',NULL,'expiresAt',NULL,'mode','prepared_disabled','consumerAccessAuthorised',false,'bindingAcceptanceAuthorised',false,'executionAuthorised',false,'notOwnReceipt',true);
 RETURN v||jsonb_build_object('reviewHash',busy_work_private.hash(v));
END $$;
CREATE FUNCTION public.busy_work_quote_access_prepare_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid,p_duration_days integer,p_calendar_zone text,p_valid_until timestamptz,p_fields jsonb,p_review_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v jsonb;r public.business_work_quote_presentations%ROWTYPE;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023';END IF;
 v:=public.busy_work_quote_access_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id,p_duration_days,p_calendar_zone,p_valid_until,p_fields);
 IF p_review_hash IS DISTINCT FROM v->>'reviewHash' THEN RAISE EXCEPTION 'Review changed' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_quote_presentations(grant_candidate_id,created_by,business_id,customer_id,engagement_id,reference_id,duration_days,calendar_zone,valid_until,projection,projection_hash,source_review_hash,operation_id) VALUES(p_grant_id,auth.uid(),p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_duration_days,p_calendar_zone,p_valid_until,v->'projection',busy_work_private.hash(v->'projection'),p_review_hash,p_operation_id) RETURNING * INTO r;
 RETURN (v-'notOwnReceipt'-'fields'-'projection'-'recipient')||jsonb_build_object('presentationId',r.id,'revision',1,'previousRevision',0,'operation','quote_access_preparation','operationId',p_operation_id,'actorId',auth.uid(),'schemaVersion',1,'ownOperationReceipt',true,'projectionHash',r.projection_hash,'recordedAt',r.recorded_at);
END $$;
CREATE FUNCTION busy_work_private.presentation_eligibility(pid uuid) RETURNS public.business_work_quote_presentations LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p public.business_work_quote_presentations%ROWTYPE;
BEGIN
 SELECT * INTO p FROM public.business_work_quote_presentations WHERE id=pid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Presentation unavailable' USING ERRCODE='42501';END IF;
 PERFORM busy_work_private.presentation_source(p.grant_candidate_id);
 SELECT * INTO p FROM public.business_work_quote_presentations WHERE id=pid FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.business_work_quote_presentation_revocations WHERE presentation_id=pid) OR p.valid_until<=clock_timestamp() THEN RAISE EXCEPTION 'Presentation revoked or expired' USING ERRCODE='40001';END IF;
 RETURN p;
END $$;
CREATE FUNCTION public.busy_work_quote_access_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE:=busy_work_private.grant_owner(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id);p public.business_work_quote_presentations%ROWTYPE;state text:='absent';
BEGIN
 SELECT * INTO p FROM public.business_work_quote_presentations WHERE grant_candidate_id=g.id;
 IF FOUND THEN BEGIN PERFORM busy_work_private.presentation_eligibility(p.id);state:='prepared_disabled';EXCEPTION WHEN SQLSTATE '40001' OR SQLSTATE '42501' OR SQLSTATE '22023' THEN state:='unavailable';END;IF EXISTS(SELECT 1 FROM public.business_work_quote_presentation_revocations WHERE presentation_id=p.id) THEN state:='revoked';END IF;END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'grantId',g.id,'ownerId',auth.uid(),'presentationId',p.id,'revision',CASE WHEN state='absent' THEN 0 WHEN state='revoked' THEN 2 ELSE 1 END,'state',state,'durationDays',p.duration_days,'calendarZone',p.calendar_zone,'validUntil',p.valid_until,'projection',CASE WHEN state='prepared_disabled' THEN p.projection ELSE NULL END,'projectionHash',p.projection_hash,'activatedAt',NULL,'expiresAt',NULL,'mode','prepared_disabled','consumerAccessAuthorised',false,'bindingAcceptanceAuthorised',false,'executionAuthorised',false,'notOwnReceipt',true);
END $$;
CREATE FUNCTION public.busy_work_quote_access_revoke_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid,p_presentation_id uuid,p_expected_revision bigint,p_projection_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE:=busy_work_private.grant_owner(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id);p public.business_work_quote_presentations%ROWTYPE;r public.business_work_quote_presentation_revocations%ROWTYPE;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023';END IF;
 SELECT * INTO p FROM public.business_work_quote_presentations WHERE id=p_presentation_id AND grant_candidate_id=g.id FOR UPDATE;
 IF NOT FOUND OR p_expected_revision IS DISTINCT FROM 1 OR p.projection_hash IS DISTINCT FROM p_projection_hash OR EXISTS(SELECT 1 FROM public.business_work_quote_presentation_revocations WHERE presentation_id=p.id) THEN RAISE EXCEPTION 'Presentation revision conflict' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_quote_presentation_revocations(presentation_id,created_by,operation_id) VALUES(p.id,auth.uid(),p_operation_id) RETURNING * INTO r;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'grantId',g.id,'ownerId',auth.uid(),'actorId',auth.uid(),'presentationId',p.id,'projectionHash',p.projection_hash,'revocationId',r.id,'revision',2,'previousRevision',1,'operation','quote_access_revocation','operationId',p_operation_id,'schemaVersion',1,'ownOperationReceipt',true,'recordedAt',r.recorded_at,'mode','prepared_disabled','consumerAccessAuthorised',false,'executionAuthorised',false);
END $$;
CREATE FUNCTION public.busy_work_quote_access_decisions_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid,p_after bigint DEFAULT 0,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE:=busy_work_private.grant_owner(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id);p public.business_work_quote_presentations%ROWTYPE;items jsonb;cursor bigint;more boolean;
BEGIN
 IF p_after IS NULL OR p_after<0 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT * INTO p FROM public.business_work_quote_presentations WHERE grant_candidate_id=g.id AND created_by=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Presentation unavailable' USING ERRCODE='42501';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('responseId',id,'actorId',consumer_id,'revision',revision,'action',action,'question',question,'recordedAt',recorded_at) ORDER BY revision),'[]') INTO items FROM (SELECT * FROM busy_work_private.quote_decision_validation WHERE presentation_id=p.id AND revision>p_after ORDER BY revision LIMIT p_limit) x;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'revision')::bigint;END IF;
 SELECT EXISTS(SELECT 1 FROM busy_work_private.quote_decision_validation WHERE presentation_id=p.id AND revision>cursor) INTO more;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'grantId',g.id,'ownerId',auth.uid(),'presentationId',p.id,'projectionHash',p.projection_hash,'items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'mode','local_validation_only','notOwnReceipt',true,'bindingAgreementRecorded',false,'executionAuthorised',false);
END $$;
-- Private local-validation machinery only. No application EXECUTE, no public activation route.
CREATE FUNCTION busy_work_private.quote_activation_validation(pid uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p public.business_work_quote_presentations%ROWTYPE:=busy_work_private.presentation_eligibility(pid);a busy_work_private.quote_access_validation%ROWTYPE;
BEGIN
 IF auth.uid() IS DISTINCT FROM p.created_by THEN RAISE EXCEPTION 'Original owner required' USING ERRCODE='42501';END IF;
 a.activated_at:=clock_timestamp();a.expires_at:=busy_work_private.quote_calendar_expiry(a.activated_at,p.duration_days,p.valid_until,p.calendar_zone);
 INSERT INTO busy_work_private.quote_access_validation VALUES(pid,a.activated_at,a.expires_at,'local_validation_only');
 RETURN jsonb_build_object('presentationId',pid,'activatedAt',a.activated_at,'expiresAt',a.expires_at,'mode','local_validation_only','consumerAccessAuthorised',false);
END $$;
CREATE FUNCTION busy_work_private.quote_session_validation(pid uuid,session_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p public.business_work_quote_presentations%ROWTYPE:=busy_work_private.presentation_eligibility(pid);g public.business_work_quote_grant_candidates%ROWTYPE;a busy_work_private.quote_access_validation%ROWTYPE;s busy_work_private.quote_viewing_validation_sessions%ROWTYPE;
BEGIN
 IF NOT has_function_privilege('authenticated','public.busy_work_quote_access_prepare_v1(uuid,text,uuid,uuid,uuid,integer,text,timestamp with time zone,jsonb,text,text)','EXECUTE') THEN RAISE EXCEPTION 'Read-only rollback' USING ERRCODE='42501';END IF;
 SELECT * INTO g FROM public.business_work_quote_grant_candidates WHERE id=p.grant_candidate_id;
 IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM g.consumer_id OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid()) THEN RAISE EXCEPTION 'Exact authenticated recipient required' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM busy_work_private.quote_access_validation WHERE presentation_id=pid;
 IF NOT FOUND OR a.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'No current validation activation' USING ERRCODE='40001';END IF;
 IF session_id IS NULL THEN
 INSERT INTO busy_work_private.quote_viewing_validation_sessions(presentation_id,consumer_id,mode) VALUES(pid,auth.uid(),'local_validation_only') RETURNING * INTO s;
 ELSE
 SELECT * INTO s FROM busy_work_private.quote_viewing_validation_sessions WHERE id=session_id AND presentation_id=pid AND consumer_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR s.last_activity_at+interval '15 minutes'<=clock_timestamp() THEN RAISE EXCEPTION 'Viewing eligibility expired; renewed authentication required' USING ERRCODE='40001';END IF;
 UPDATE busy_work_private.quote_viewing_validation_sessions SET last_activity_at=clock_timestamp(),revision=revision+1 WHERE id=s.id RETURNING * INTO s;
 END IF;
 RETURN jsonb_build_object('presentationId',pid,'sessionId',s.id,'sessionRevision',s.revision,'lastActivityAt',s.last_activity_at,'idleExpiresAt',s.last_activity_at+interval '15 minutes','projection',p.projection,'mode','local_validation_only','requiresHostedSessionProof',true,'consumerAccessAuthorised',false,'executionAuthorised',false,'notOwnReceipt',true);
END $$;
CREATE FUNCTION busy_work_private.quote_decision_validation(pid uuid,session_id uuid,action text,question text,expected bigint,operation text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v jsonb;head bigint;r busy_work_private.quote_decision_validation%ROWTYPE;
BEGIN
 IF action='accept_and_agree_to_pay' OR action='accept' THEN RAISE EXCEPTION 'Firm offer/legal/release authority unavailable' USING ERRCODE='42501';END IF;
 IF session_id IS NULL OR action IS NULL OR action NOT IN ('request_to_proceed','decline','question') OR question IS NULL OR octet_length(question)>10000 OR (action='question' AND question !~ '[^[:space:]]') OR (action<>'question' AND question<>'') OR operation IS NULL OR operation !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Unsupported decision' USING ERRCODE='22023';END IF;
 v:=busy_work_private.quote_session_validation(pid,session_id);
 SELECT coalesce(max(revision),0) INTO head FROM busy_work_private.quote_decision_validation WHERE presentation_id=pid;
 IF expected IS NULL OR head<>expected THEN RAISE EXCEPTION 'Decision revision conflict' USING ERRCODE='40001';END IF;
 INSERT INTO busy_work_private.quote_decision_validation(presentation_id,consumer_id,revision,action,question,operation_id) VALUES(pid,auth.uid(),head+1,action,question,operation) RETURNING * INTO r;
 RETURN jsonb_build_object('presentationId',pid,'sessionId',session_id,'responseId',r.id,'actorId',auth.uid(),'revision',r.revision,'previousRevision',head,'action',action,'question',r.question,'recordedAt',r.recorded_at,'operationId',operation,'ownOperationReceipt',true,'bindingAgreementRecorded',false,'bookingConfirmed',false,'executionAuthorised',false,'mode','local_validation_only');
END $$;
DO $$ DECLARE f record;r record;t text;role_name text;BEGIN
 FOR f IN SELECT oid::regprocedure sig,pronamespace FROM pg_proc WHERE pronamespace='busy_work_private'::regnamespace OR pronamespace='public'::regnamespace AND proname IN ('busy_work_quote_access_review_v1','busy_work_quote_access_prepare_v1','busy_work_quote_access_read_v1','busy_work_quote_access_revoke_v1','busy_work_quote_access_decisions_v1') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.sig);FOR r IN SELECT rolname FROM pg_roles WHERE NOT rolsuper LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f.sig,r.rolname);END LOOP;IF f.pronamespace='public'::regnamespace THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig);END IF;END LOOP;
 FOREACH t IN ARRAY ARRAY['public.business_work_quote_presentations','public.business_work_quote_presentation_revocations','busy_work_private.quote_access_validation','busy_work_private.quote_viewing_validation_sessions','busy_work_private.quote_decision_validation'] LOOP FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
 IF has_table_privilege(role_name,t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN RAISE EXCEPTION 'Effective quote policy raw access detected' USING ERRCODE='42501';END IF;END LOOP;END LOOP;
END $$;
COMMIT;
