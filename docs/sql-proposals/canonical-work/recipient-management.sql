-- V22.52 LOCAL CANDIDATE: additive upgrade from exact recipient-binding foundation.
-- No consumer disclosure/response policy or hosted activation is granted.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'RECIPIENT MANAGEMENT REVIEW FUSE: separate hosted approval required'; END $$;
DO $$ BEGIN
 IF to_regclass('public.business_work_quote_recipient_bindings') IS NULL OR to_regprocedure('public.busy_work_quote_binding_read_v1(uuid,text,uuid,uuid)') IS NULL OR to_regclass('public.business_work_quote_binding_decisions') IS NOT NULL THEN RAISE EXCEPTION 'Exact previous foundation required; upgrade already installed or missing';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.busy_work_quote_binding_read_v1(uuid,text,uuid,uuid)'::regprocedure AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='a303f9c1ba8f1ed93ea426596c23fe32ac069acc428e8cc8c016e1d3a0490c6a') THEN RAISE EXCEPTION 'Unsupported installed authority; exact reviewed upgrade baseline required' USING ERRCODE='55000';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.busy_work_quote_recipient_review_v1(uuid,text,uuid,uuid,uuid)'::regprocedure AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='b270d76b5594d2cb76f6a7a198dcc097f9b6e4f2dda63ba72e7fb0480aff3af2') THEN RAISE EXCEPTION 'Unsupported installed authority; exact reviewed upgrade baseline required' USING ERRCODE='55000';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.busy_work_quote_reference_read_v1(uuid,text,uuid,uuid)'::regprocedure AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='7c6efa971214537d1108f37562d40926306c7edbaec317fbc473b6d9a94c698f') THEN RAISE EXCEPTION 'Unsupported installed authority; exact reviewed upgrade baseline required' USING ERRCODE='55000';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='busy_work_private.authorize(uuid)'::regprocedure AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='5f70812ced4bcf486ccd42fe87b1ab14db12fd1b681c9fa5049cf69799b6ddf5') THEN RAISE EXCEPTION 'Unsupported installed authority; exact reviewed upgrade baseline required' USING ERRCODE='55000';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.busy_work_consumer_quote_access_v1(uuid)'::regprocedure AND NOT prosecdef AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='8c4825fb06eb76dbb427eb14ce98e5cf9ccafd34b3b266a63a332dc94f968087') THEN RAISE EXCEPTION 'Closed consumer boundary required' USING ERRCODE='55000';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.busy_work_consumer_quote_response_v1(uuid,text,text)'::regprocedure AND NOT prosecdef AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='dcfa170a164c97f34750d7e451404e7fe19421770ddc4cbb86c7f2601cd19e4c') THEN RAISE EXCEPTION 'Closed consumer boundary required' USING ERRCODE='55000';END IF;
END $$;
CREATE TABLE public.business_work_quote_binding_decisions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),binding_id uuid NOT NULL REFERENCES public.business_work_quote_recipient_bindings(id) ON DELETE RESTRICT,
 business_id uuid NOT NULL,created_by uuid NOT NULL,revision bigint NOT NULL CHECK(revision>=2),
 action text NOT NULL CHECK(action IN ('revoke','replace')),recipient_review jsonb,review_hash text NOT NULL,
 operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK((action='revoke' AND recipient_review IS NULL) OR (action='replace' AND jsonb_typeof(recipient_review)='object')),
 UNIQUE(binding_id,revision),UNIQUE(business_id,created_by,operation_id)
);
CREATE TABLE public.business_work_quote_access_preparations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),binding_id uuid NOT NULL REFERENCES public.business_work_quote_recipient_bindings(id) ON DELETE RESTRICT,
 business_id uuid NOT NULL,created_by uuid NOT NULL,binding_revision bigint NOT NULL,quote_revision bigint NOT NULL,terms_hash text NOT NULL,review_hash text NOT NULL,
 prepared_projection jsonb NOT NULL,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),expires_at timestamptz NOT NULL,
 operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),
 UNIQUE(binding_id,binding_revision),UNIQUE(business_id,created_by,operation_id),CHECK(expires_at>recorded_at)
);
CREATE TABLE public.business_work_quote_access_withdrawals(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),preparation_id uuid NOT NULL UNIQUE REFERENCES public.business_work_quote_access_preparations(id) ON DELETE RESTRICT,
 business_id uuid NOT NULL,created_by uuid NOT NULL,operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(business_id,created_by,operation_id)
);
DO $$ DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['business_work_quote_binding_decisions','business_work_quote_access_preparations','business_work_quote_access_withdrawals'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated,service_role',t);
 EXECUTE format('CREATE TRIGGER immutable_preparation BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_quote_binding()',t);
 END LOOP;END $$;
-- Lock order remains membership -> snapshot -> engagement -> binding. Readers serialize
-- only one binding, never a customer's entire history. No source authority is reconstructed.
CREATE FUNCTION busy_work_private.managed_binding(b uuid,c text,e uuid,r uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(b);er public.business_work_engagements%ROWTYPE;h jsonb;x public.business_work_quote_recipient_bindings%ROWTYPE;d public.business_work_quote_binding_decisions%ROWTYPE;v jsonb;
BEGIN
 SELECT * INTO er FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND id=e;
 IF NOT FOUND OR er.created_by<>actor THEN RAISE EXCEPTION 'Binding owner unavailable' USING ERRCODE='42501';END IF;
 PERFORM busy_work_private.source_context(b,c,er.enquiry_id);
 SELECT * INTO er FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND id=e FOR UPDATE;
 IF NOT FOUND OR er.created_by<>actor THEN RAISE EXCEPTION 'Binding owner changed' USING ERRCODE='42501';END IF;
 h:=public.busy_work_history_v1(b,c,e);
 IF h->>'sourceState' NOT IN ('current','changed') THEN RAISE EXCEPTION 'Current source privacy/availability required' USING ERRCODE='42501';END IF;
 SELECT * INTO x FROM public.business_work_quote_recipient_bindings WHERE business_id=b AND customer_id=c AND engagement_id=e AND reference_id=r AND created_by=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Private binding unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO d FROM public.business_work_quote_binding_decisions WHERE binding_id=x.id ORDER BY revision DESC LIMIT 1;
 v:=jsonb_build_object('businessId',b,'customerId',c,'engagementId',e,'referenceId',r,'ownerId',auth.uid(),'bindingId',x.id,'revision',coalesce(d.revision,1),'quoteRevision',x.quote_revision,'termsHash',x.terms_hash,'sourceHash',x.source_hash,'sourceState',h->>'sourceState','engagementRevision',h->'revision','state',CASE WHEN d.action='revoke' THEN 'revoked' ELSE 'active' END,'recordedAt',coalesce(d.recorded_at,x.recorded_at),'reviewHash',coalesce(d.review_hash,x.review_hash),'notOwnReceipt',true,'consumerAccessAuthorised',false,'executionAuthorised',false);
 IF d.action='replace' THEN RETURN v||jsonb_build_object('requestId',d.recipient_review->'recipient'->'requestId','recipientReviewHash',busy_work_private.hash(d.recipient_review));END IF;
 RETURN v||jsonb_build_object('requestId',x.request_id,'recipientReviewHash',x.review_hash);
END $$;
CREATE OR REPLACE FUNCTION public.busy_work_quote_binding_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb;v jsonb;h jsonb;eligibility text;recipient jsonb;
BEGIN
 PERFORM busy_work_private.authorize(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.business_work_quote_references WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND id=p_reference_id AND created_by=auth.uid()) THEN RAISE EXCEPTION 'Reference unavailable' USING ERRCODE='42501';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.business_work_quote_recipient_bindings WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND reference_id=p_reference_id AND created_by=auth.uid()) THEN
 PERFORM public.busy_work_quote_reference_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'binding',NULL,'eligibility','absent','recipient',NULL,'notOwnReceipt',true,'consumerAccessAuthorised',false,'quoteRequestAssociated',false,'executionAuthorised',false);END IF;
 x:=busy_work_private.managed_binding(p_business_id,p_customer_id,p_engagement_id,p_reference_id);
 IF x->>'state'='revoked' THEN eligibility:='revoked';
 ELSIF (x->>'engagementRevision')::bigint<>(x->>'quoteRevision')::bigint THEN eligibility:='stale_quote_version';
 ELSIF x->>'sourceState'<>'current' THEN eligibility:='changed_source_evidence';
 ELSE
 v:=public.busy_work_quote_recipient_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,(x->>'requestId')::uuid);
 IF v->>'recipientIdentified' IS DISTINCT FROM 'true' THEN eligibility:='unavailable_recipient';
 ELSIF busy_work_private.hash(v) IS DISTINCT FROM x->>'recipientReviewHash' THEN eligibility:='changed_source_evidence';
 ELSE eligibility:='current';recipient:=v->'recipient';END IF;END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'binding',jsonb_build_object('bindingId',x->'bindingId','revision',x->'revision','quoteRevision',x->'quoteRevision','termsHash',x->'termsHash','reviewHash',x->'reviewHash','recordedAt',x->'recordedAt','state',x->'state','provenance','owner_linked_signed_in_request'),'eligibility',eligibility,'recipient',recipient,'notOwnReceipt',true,'consumerAccessAuthorised',false,'quoteRequestAssociated',false,'executionAuthorised',false);
END $$;
CREATE FUNCTION public.busy_work_quote_binding_manage_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_action text,p_request_id uuid,p_expected_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb;v jsonb;
BEGIN
 IF NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_quote_binding_decide_v1(uuid,text,uuid,uuid,text,uuid,bigint,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Management unavailable' USING ERRCODE='42501';END IF;
 IF p_action='replace' THEN
 v:=public.busy_work_quote_recipient_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_request_id);
 IF v->>'recipientIdentified' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Replacement recipient unavailable' USING ERRCODE='42501';END IF;
 ELSIF p_action IS DISTINCT FROM 'revoke' OR p_request_id IS NOT NULL THEN RAISE EXCEPTION 'Unsupported action' USING ERRCODE='22023';END IF;
 x:=busy_work_private.managed_binding(p_business_id,p_customer_id,p_engagement_id,p_reference_id);
 IF p_expected_revision IS NULL OR (x->>'revision')::bigint<>p_expected_revision OR p_action='revoke' AND x->>'state'='revoked' THEN RAISE EXCEPTION 'Binding revision conflict' USING ERRCODE='40001';END IF;
 RETURN x||jsonb_build_object('action',p_action,'requestId',p_request_id,'proposedRecipient',v,'reviewHash',busy_work_private.hash(jsonb_build_object('current',x,'action',p_action,'proposal',v)),'currentBindingDecision',true);
END $$;
CREATE FUNCTION public.busy_work_quote_binding_decide_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_action text,p_request_id uuid,p_expected_revision bigint,p_review_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb;d public.business_work_quote_binding_decisions%ROWTYPE;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023';END IF;
 x:=public.busy_work_quote_binding_manage_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_action,p_request_id,p_expected_revision);
 IF x->>'reviewHash' IS DISTINCT FROM p_review_hash OR p_review_hash IS NULL THEN RAISE EXCEPTION 'Review conflict' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_quote_binding_decisions(binding_id,business_id,created_by,revision,action,recipient_review,review_hash,operation_id) VALUES((x->>'bindingId')::uuid,p_business_id,auth.uid(),p_expected_revision+1,p_action,NULLIF(x->'proposedRecipient','null'::jsonb),p_review_hash,p_operation_id) RETURNING * INTO d;
 RETURN (x-'proposedRecipient'-'currentBindingDecision'-'notOwnReceipt')||jsonb_build_object('ownOperationReceipt',true,'operation','quote_binding_decision','operationId',p_operation_id,'actorId',auth.uid(),'schemaVersion',1,'previousRevision',p_expected_revision,'revision',d.revision,'decisionId',d.id,'recordedAt',d.recorded_at,'state',CASE WHEN p_action='revoke' THEN 'revoked' ELSE 'active' END);
END $$;
CREATE FUNCTION public.busy_work_quote_binding_history_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_before bigint DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.managed_binding(p_business_id,p_customer_id,p_engagement_id,p_reference_id);items jsonb;cursor bigint;more boolean;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_before IS NOT NULL AND p_before<1 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('decisionId',id,'revision',revision,'action',action,'recordedAt',recorded_at,'state',CASE WHEN revision<(x->>'revision')::bigint THEN 'superseded' WHEN action='revoke' THEN 'revoked' ELSE 'active' END) ORDER BY revision DESC),'[]') INTO items FROM (SELECT * FROM public.business_work_quote_binding_decisions WHERE binding_id=(x->>'bindingId')::uuid AND (p_before IS NULL OR revision<p_before) ORDER BY revision DESC LIMIT p_limit) a;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'revision')::bigint;END IF;
 SELECT EXISTS(SELECT 1 FROM public.business_work_quote_binding_decisions WHERE binding_id=(x->>'bindingId')::uuid AND revision<cursor) INTO more;
 RETURN x||jsonb_build_object('items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'originalBindingRetained',true);
END $$;
-- This is OWNER-PRIVATE preparation only. Whitelist the future recipient projection;
-- never copy unknown fields, source records, replies, followups or work_notes.
CREATE FUNCTION busy_work_private.quote_safe_projection(b uuid,c text,e uuid,r uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE q jsonb:=public.busy_work_quote_reference_read_v1(b,c,e,r);
BEGIN
 IF q->>'termsChanged'='true' THEN RAISE EXCEPTION 'Stale quote version' USING ERRCODE='40001';END IF;
 RETURN jsonb_build_object('engagementId',e,'referenceId',r,'quoteRevision',q->'quoteRevision','termsHash',q->'termsHash','amount',q->'terms'->'amount','plannedQuoteDate',q->'terms'->'plannedQuoteDate','wording',q->'terms'->'wording','status','Prepared','presented',false);
END $$;
CREATE FUNCTION public.busy_work_quote_presentation_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_expected_revision bigint,p_duration_minutes integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE q jsonb:=busy_work_private.quote_safe_projection(p_business_id,p_customer_id,p_engagement_id,p_reference_id);v jsonb;x jsonb;
BEGIN
 IF NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_quote_presentation_prepare_v1(uuid,text,uuid,uuid,bigint,integer,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Preparation disabled' USING ERRCODE='42501';END IF;
 IF p_duration_minutes IS NULL OR p_duration_minutes NOT IN (15,60) THEN RAISE EXCEPTION 'Unsupported expiry' USING ERRCODE='22023';END IF;
 v:=public.busy_work_quote_binding_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);
 IF v->>'eligibility'<>'current' OR (v->'binding'->>'revision')::bigint IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Current binding required' USING ERRCODE='40001';END IF;
 x:=jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'bindingId',v->'binding'->'bindingId','revision',p_expected_revision,'sourceHash',(SELECT source_hash FROM public.business_work_quote_recipient_bindings WHERE id=(v->'binding'->>'bindingId')::uuid),'bindingRevision',p_expected_revision,'projection',q,'recipient',v->'recipient','durationMinutes',p_duration_minutes,'consumerAccessAuthorised',false,'executionAuthorised',false,'notOwnReceipt',true,'currentPresentationReview',true);
 RETURN x||jsonb_build_object('reviewHash',busy_work_private.hash(x));
END $$;
CREATE FUNCTION public.busy_work_quote_presentation_prepare_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_expected_revision bigint,p_duration_minutes integer,p_review_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb;p public.business_work_quote_access_preparations%ROWTYPE;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE='22023';END IF;
 x:=public.busy_work_quote_presentation_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_expected_revision,p_duration_minutes);
 IF p_review_hash IS NULL OR x->>'reviewHash' IS DISTINCT FROM p_review_hash THEN RAISE EXCEPTION 'Preparation review conflict' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_quote_access_preparations(binding_id,business_id,created_by,binding_revision,quote_revision,terms_hash,review_hash,prepared_projection,expires_at,operation_id) VALUES((x->>'bindingId')::uuid,p_business_id,auth.uid(),p_expected_revision,(x->'projection'->>'quoteRevision')::bigint,x->'projection'->>'termsHash',p_review_hash,x->'projection',clock_timestamp()+make_interval(mins=>p_duration_minutes),p_operation_id) RETURNING * INTO p;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'actorId',auth.uid(),'ownOperationReceipt',true,'operation','quote_presentation_preparation','operationId',p_operation_id,'schemaVersion',1,'previousRevision',0,'revision',1,'preparationId',p.id,'bindingId',p.binding_id,'bindingRevision',p.binding_revision,'reviewHash',p.review_hash,'termsHash',p.terms_hash,'sourceHash',x->'sourceHash','recordedAt',p.recorded_at,'expiresAt',p.expires_at,'consumerAccessAuthorised',false,'executionAuthorised',false);
END $$;
CREATE FUNCTION public.busy_work_quote_presentation_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.managed_binding(p_business_id,p_customer_id,p_engagement_id,p_reference_id);p public.business_work_quote_access_preparations%ROWTYPE;w public.business_work_quote_access_withdrawals%ROWTYPE;v jsonb;state text;projection jsonb;
BEGIN
 SELECT * INTO p FROM public.business_work_quote_access_preparations WHERE binding_id=(x->>'bindingId')::uuid ORDER BY binding_revision DESC LIMIT 1;
 IF NOT FOUND THEN state:='absent';
 ELSE
 SELECT * INTO w FROM public.business_work_quote_access_withdrawals WHERE preparation_id=p.id;
 IF w.id IS NOT NULL THEN state:='withdrawn';ELSIF x->>'state'='revoked' THEN state:='revoked';ELSIF p.binding_revision<>(x->>'revision')::bigint THEN state:='superseded';ELSIF p.expires_at<=clock_timestamp() THEN state:='expired';
 ELSE v:=public.busy_work_quote_binding_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);IF v->>'eligibility'='current' THEN state:='prepared_disabled';projection:=p.prepared_projection;ELSE state:='unavailable';END IF;END IF;END IF;
 RETURN x||jsonb_build_object('preparation',CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object('preparationId',p.id,'bindingRevision',p.binding_revision,'revision',CASE WHEN w.id IS NULL THEN 1 ELSE 2 END,'recordedAt',p.recorded_at,'expiresAt',p.expires_at,'termsHash',p.terms_hash) END,'preparationState',state,'projection',projection,'consumerAccessAuthorised',false,'executionAuthorised',false);
END $$;
CREATE FUNCTION public.busy_work_quote_presentation_withdraw_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_preparation_id uuid,p_expected_revision bigint,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.managed_binding(p_business_id,p_customer_id,p_engagement_id,p_reference_id);p public.business_work_quote_access_preparations%ROWTYPE;w public.business_work_quote_access_withdrawals%ROWTYPE;
BEGIN
 IF p_expected_revision IS DISTINCT FROM 1 OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Unsupported withdrawal' USING ERRCODE='40001';END IF;
 SELECT * INTO p FROM public.business_work_quote_access_preparations WHERE id=p_preparation_id AND binding_id=(x->>'bindingId')::uuid AND created_by=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Preparation unavailable' USING ERRCODE='42501';END IF;
 INSERT INTO public.business_work_quote_access_withdrawals(preparation_id,business_id,created_by,operation_id) VALUES(p.id,p_business_id,auth.uid(),p_operation_id) RETURNING * INTO w;
 RETURN (x-'notOwnReceipt')||jsonb_build_object('ownOperationReceipt',true,'operation','quote_presentation_withdrawal','operationId',p_operation_id,'actorId',auth.uid(),'schemaVersion',1,'previousRevision',1,'revision',2,'preparationId',p.id,'withdrawalId',w.id,'recordedAt',w.recorded_at,'consumerAccessAuthorised',false,'executionAuthorised',false);
END $$;
DO $$ DECLARE f record;BEGIN
 FOR f IN SELECT oid::regprocedure AS signature,proname FROM pg_proc WHERE pronamespace='busy_work_private'::regnamespace OR pronamespace='public'::regnamespace AND proname IN ('busy_work_quote_binding_manage_review_v1','busy_work_quote_binding_decide_v1','busy_work_quote_binding_history_v1','busy_work_quote_presentation_review_v1','busy_work_quote_presentation_prepare_v1','busy_work_quote_presentation_read_v1','busy_work_quote_presentation_withdraw_v1') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 IF f.proname LIKE 'busy_work_quote_%' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;END LOOP;
END $$;
-- Inherited/default function grants must be denied too, including operator-created roles.
DO $$ DECLARE f record;r record;BEGIN
 FOR f IN SELECT oid::regprocedure AS signature,proname FROM pg_proc WHERE pronamespace='busy_work_private'::regnamespace OR pronamespace='public'::regnamespace AND proname IN ('busy_work_quote_binding_manage_review_v1','busy_work_quote_binding_decide_v1','busy_work_quote_binding_history_v1','busy_work_quote_presentation_review_v1','busy_work_quote_presentation_prepare_v1','busy_work_quote_presentation_read_v1','busy_work_quote_presentation_withdraw_v1') LOOP
 FOR r IN SELECT rolname FROM pg_roles WHERE rolname<>'authenticated' AND NOT rolsuper LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f.signature,r.rolname);END LOOP;END LOOP;END $$;
-- Default/inherited grants can defeat explicit direct-role revocation. Abort atomically.
DO $$ DECLARE t text;r text;BEGIN
 FOREACH t IN ARRAY ARRAY['business_work_quote_binding_decisions','business_work_quote_access_preparations','business_work_quote_access_withdrawals'] LOOP
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
 IF has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN RAISE EXCEPTION 'Effective private table access detected: % / %',r,t USING ERRCODE='42501';END IF;
 END LOOP;END LOOP;
END $$;
COMMIT;
