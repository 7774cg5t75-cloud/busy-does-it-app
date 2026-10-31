-- Original Business App quotation context. No public consumer route/EXECUTE.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'BUSINESS APP QUOTE REVIEW FUSE: separate hosted approval required';END $$;
DO $$ BEGIN
 IF to_regclass('public.business_work_quote_presentations') IS NULL OR encode(sha256(convert_to((SELECT prosrc FROM pg_proc WHERE oid='public.busy_work_quote_access_decisions_v1(uuid,text,uuid,uuid,uuid,bigint,integer)'::regprocedure),'UTF8')),'hex')<>'b108f67e69364dc259f5b168c97c30aea0583aaeef386139123c39e3ec3d56a7' THEN RAISE EXCEPTION 'Exact V22.53 policy baseline required';END IF;
END $$;
CREATE FUNCTION busy_work_private.quote_request_validation(pid uuid,app uuid,req uuid,view_session uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p public.business_work_quote_presentations%ROWTYPE;g public.business_work_quote_grant_candidates%ROWTYPE;v jsonb;head bigint;
BEGIN
 SELECT * INTO p FROM public.business_work_quote_presentations WHERE id=pid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Quotation unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO g FROM public.business_work_quote_grant_candidates WHERE id=p.grant_candidate_id;
 IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM g.consumer_id OR app IS DISTINCT FROM g.app_id OR req IS DISTINCT FROM g.request_id THEN RAISE EXCEPTION 'Exact original authenticated request required' USING ERRCODE='42501';END IF;
 -- Reuses original request/link/app and current source locks. Never calls submitRequest or sends a message.
 v:=busy_work_private.quote_session_validation(pid,view_session);
 SELECT coalesce(max(revision),0) INTO head FROM busy_work_private.quote_decision_validation WHERE presentation_id=p.id;
 RETURN v||jsonb_build_object('appId',g.app_id,'requestId',g.request_id,'quoteVersion',g.quote_revision,'actorId',auth.uid(),'responseRevision',head,'observedAt',clock_timestamp(),'notOwnReceipt',true,'requiresHostedSessionProof',true,'consumerAccessAuthorised',false);
END $$;
CREATE FUNCTION busy_work_private.quote_request_decision_validation(pid uuid,app uuid,req uuid,view_session uuid,action text,question text,expected bigint,operation text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v jsonb;r jsonb;
BEGIN
 IF view_session IS NULL THEN RAISE EXCEPTION 'Current viewing eligibility required' USING ERRCODE='40001';END IF;
 v:=busy_work_private.quote_request_validation(pid,app,req,view_session);
 r:=busy_work_private.quote_decision_validation(pid,view_session,action,question,expected,operation);
 RETURN r||jsonb_build_object('appId',v->'appId','requestId',v->'requestId','quoteVersion',v->'quoteVersion','mode','local_validation_only','consumerAccessAuthorised',false,'requiresHostedSessionProof',true);
END $$;
CREATE OR REPLACE FUNCTION public.busy_work_quote_access_decisions_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_grant_id uuid,p_after bigint DEFAULT 0,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE g public.business_work_quote_grant_candidates%ROWTYPE:=busy_work_private.grant_owner(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_grant_id);p public.business_work_quote_presentations%ROWTYPE;items jsonb;cursor bigint;more boolean;current_source boolean:=true;
BEGIN
 IF p_after IS NULL OR p_after<0 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT * INTO p FROM public.business_work_quote_presentations WHERE grant_candidate_id=g.id AND created_by=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Presentation unavailable' USING ERRCODE='42501';END IF;
 BEGIN PERFORM busy_work_private.presentation_eligibility(p.id);EXCEPTION WHEN SQLSTATE '40001' OR SQLSTATE '42501' OR SQLSTATE '22023' THEN current_source:=false;END;
 SELECT coalesce(jsonb_agg(jsonb_build_object('responseId',id,'actorId',consumer_id,'revision',revision,'action',action,'question',question,'recordedAt',recorded_at) ORDER BY revision),'[]') INTO items FROM (SELECT * FROM busy_work_private.quote_decision_validation WHERE presentation_id=p.id AND revision>p_after ORDER BY revision LIMIT p_limit) x;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'revision')::bigint;END IF;
 SELECT EXISTS(SELECT 1 FROM busy_work_private.quote_decision_validation WHERE presentation_id=p.id AND revision>cursor) INTO more;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'grantId',g.id,'ownerId',auth.uid(),'presentationId',p.id,'projectionHash',p.projection_hash,'items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'quoteVersion',g.quote_revision,'quoteIdentifier',p.projection->'quoteIdentifier','appId',g.app_id,'requestId',g.request_id,'linkId',g.recipient_evidence->'recipient'->'linkId','consumerId',g.consumer_id,'sourceCurrent',current_source,'evidenceStatus',CASE WHEN current_source THEN 'local_validation_current' ELSE 'local_validation_stale' END,'provenance','owner_linked_signed_in_request','mode','local_validation_only','notOwnReceipt',true,'bindingAgreementRecorded',false,'executionAuthorised',false);
END $$;
DO $$ DECLARE f record;r record;BEGIN
 FOR f IN SELECT oid::regprocedure sig,pronamespace FROM pg_proc WHERE (pronamespace='busy_work_private'::regnamespace AND proname IN ('quote_request_validation','quote_request_decision_validation')) OR (pronamespace='public'::regnamespace AND proname='busy_work_quote_access_decisions_v1') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.sig);FOR r IN SELECT rolname FROM pg_roles WHERE NOT rolsuper LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f.sig,r.rolname);END LOOP;
 IF f.pronamespace='public'::regnamespace THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig);END IF;END LOOP;
END $$;
COMMIT;
