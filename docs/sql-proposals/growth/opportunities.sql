-- Purpose-specific local review candidate. NOT a hosted migration or disclosure policy.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'GROWTH OPPORTUNITY REVIEW FUSE: separate hosted approval required'; END $$;
-- Never adopt a table/function/schema pre-created by an untrusted role.
DO $$ DECLARE n record;BEGIN
 FOR n IN SELECT nspowner owner,obj_description(oid,'pg_namespace') marker FROM pg_namespace WHERE nspname='busy_growth_private' LOOP
  IF n.owner<>'postgres'::regrole OR n.marker IS DISTINCT FROM 'busy_growth_owner_opportunity_v1' THEN RAISE EXCEPTION 'Unreviewed Growth schema' USING ERRCODE='42501';END IF;
 END LOOP;
 FOR n IN SELECT c.relowner owner,obj_description(c.oid,'pg_class') marker FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='public' AND c.relname IN ('busy_growth_opportunities','busy_growth_opportunity_versions') LOOP
  IF n.owner<>'postgres'::regrole OR n.marker IS DISTINCT FROM 'busy_growth_owner_opportunity_v1' THEN RAISE EXCEPTION 'Unreviewed Growth relation' USING ERRCODE='42501';END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE (ns.nspname='busy_growth_private' OR ns.nspname='public' AND p.proname LIKE 'busy_growth_opportunity_%') AND p.proowner<>'postgres'::regrole) THEN RAISE EXCEPTION 'Untrusted Growth function owner' USING ERRCODE='42501';END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS busy_growth_private AUTHORIZATION postgres;
COMMENT ON SCHEMA busy_growth_private IS 'busy_growth_owner_opportunity_v1';
REVOKE ALL ON SCHEMA busy_growth_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE IF NOT EXISTS public.busy_growth_opportunities(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES public.busy_businesses(id) ON DELETE RESTRICT,
 owner_id uuid NOT NULL,revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 UNIQUE(id,business_id,owner_id)
);
CREATE TABLE IF NOT EXISTS public.busy_growth_opportunity_versions(
 opportunity_id uuid NOT NULL,business_id uuid NOT NULL,owner_id uuid NOT NULL,revision bigint NOT NULL CHECK(revision>0),
 action text NOT NULL CHECK(action IN ('create','edit','retire','reopen','reinspect','feedback')),
 state text NOT NULL CHECK(state IN ('active','retired')),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 100 AND btrim(title)<>''),
 description text NOT NULL CHECK(length(description) BETWEEN 1 AND 600 AND btrim(description)<>''),
 source_account text NOT NULL CHECK(length(source_account) BETWEEN 1 AND 300 AND btrim(source_account)<>''),
 service_id text NOT NULL CHECK(length(service_id) BETWEEN 1 AND 128),
 permission text NOT NULL CHECK(permission IN ('permitted','unknown','restricted')),
 provenance text NOT NULL DEFAULT 'owner_reported' CHECK(provenance='owner_reported'),
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),reviewed_source_hash text,
 feedback text NOT NULL DEFAULT 'clear' CHECK(feedback IN ('clear','useful','irrelevant','later')),
 feedback_reason text NOT NULL DEFAULT '' CHECK(length(feedback_reason)<=300),
 operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(opportunity_id,revision),UNIQUE(business_id,owner_id,operation_id),
 FOREIGN KEY(opportunity_id,business_id,owner_id) REFERENCES public.busy_growth_opportunities(id,business_id,owner_id) ON DELETE RESTRICT
);
COMMENT ON TABLE public.busy_growth_opportunities IS 'busy_growth_owner_opportunity_v1';
COMMENT ON TABLE public.busy_growth_opportunity_versions IS 'busy_growth_owner_opportunity_v1';
CREATE INDEX IF NOT EXISTS busy_growth_owner_page ON public.busy_growth_opportunities(business_id,owner_id,id);
ALTER TABLE public.busy_growth_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.busy_growth_opportunity_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.busy_growth_opportunities,public.busy_growth_opportunity_versions FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION busy_growth_private.authorize(b uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=auth.uid();r text;creator uuid;
BEGIN
 IF a IS NULL OR b IS NULL THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT role INTO r FROM public.busy_business_memberships WHERE business_id=b AND user_id=a FOR SHARE;
 SELECT created_by INTO creator FROM public.busy_businesses WHERE id=b FOR SHARE;
 IF r IS DISTINCT FROM 'owner' OR creator IS DISTINCT FROM a THEN RAISE EXCEPTION 'Original current owner required' USING ERRCODE='42501';END IF;RETURN a;
END $$;
CREATE OR REPLACE FUNCTION busy_growth_private.projection(v public.busy_growth_opportunity_versions) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('opportunityId',v.opportunity_id,'businessId',v.business_id,'ownerId',v.owner_id,'revision',v.revision,'state',v.state,'action',v.action,'record',jsonb_build_object('title',v.title,'description',v.description,'source',v.source_account,'serviceId',v.service_id,'permission',v.permission),'provenance',v.provenance,'sourceHash',v.source_hash,'reviewedSourceHash',v.reviewed_source_hash,'feedback',v.feedback,'feedbackReason',v.feedback_reason,'recordedAt',v.recorded_at,'contactPermission','not_established','outcomes','not_established','notOwnReceipt',true)
$$;
CREATE OR REPLACE FUNCTION public.busy_growth_opportunity_read_v1(p_business_id uuid,p_opportunity_id uuid,p_revision bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);h public.busy_growth_opportunities%ROWTYPE;v public.busy_growth_opportunity_versions%ROWTYPE;
BEGIN
 SELECT * INTO h FROM public.busy_growth_opportunities WHERE id=p_opportunity_id AND business_id=p_business_id AND owner_id=a FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Opportunity unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO v FROM public.busy_growth_opportunity_versions WHERE opportunity_id=h.id AND revision=coalesce(p_revision,h.revision);
 IF NOT FOUND THEN RAISE EXCEPTION 'Version unavailable' USING ERRCODE='22023';END IF;
 RETURN busy_growth_private.projection(v)||jsonb_build_object('currentRevision',h.revision,'historical',v.revision<>h.revision);
END $$;
CREATE OR REPLACE FUNCTION public.busy_growth_opportunity_list_v1(p_business_id uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);items jsonb;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Bounded page required' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(x.item ORDER BY x.id),'[]') INTO items FROM (SELECT h.id,jsonb_build_object('opportunityId',h.id,'revision',h.revision,'title',v.title,'state',v.state,'permission',v.permission,'feedback',v.feedback) item FROM public.busy_growth_opportunities h JOIN public.busy_growth_opportunity_versions v ON v.opportunity_id=h.id AND v.revision=h.revision WHERE h.business_id=p_business_id AND h.owner_id=a AND (p_after IS NULL OR h.id>p_after) ORDER BY h.id LIMIT p_limit) x;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'items',items,'nextAfter',CASE WHEN jsonb_array_length(items)=p_limit THEN items->-1->>'opportunityId' ELSE NULL END,'notOwnReceipt',true);
END $$;
CREATE OR REPLACE FUNCTION public.busy_growth_opportunity_write_v1(p_business_id uuid,p_opportunity_id uuid,p_expected_revision bigint,p_source_hash text,p_action text,p_record jsonb,p_feedback text,p_reason text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);h public.busy_growth_opportunities%ROWTYPE;v public.busy_growth_opportunity_versions%ROWTYPE;next_hash text;body jsonb;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' OR p_expected_revision IS NULL OR p_expected_revision<0 OR p_action IS NULL OR p_action NOT IN ('create','edit','retire','reopen','reinspect','feedback') THEN RAISE EXCEPTION 'Finite action and operation required' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM public.busy_growth_opportunity_versions WHERE business_id=p_business_id AND owner_id=a AND operation_id=p_operation_id) THEN RAISE EXCEPTION 'Already attempted: inspect independently, never replay' USING ERRCODE='40001';END IF;
 IF p_action='create' THEN
  IF p_opportunity_id IS NOT NULL OR p_expected_revision<>0 OR p_source_hash IS NOT NULL THEN RAISE EXCEPTION 'New server identity required' USING ERRCODE='22023';END IF;
  INSERT INTO public.busy_growth_opportunities(business_id,owner_id)VALUES(p_business_id,a)RETURNING * INTO h;
  v.state:='active';v.feedback:='clear';v.feedback_reason:='';
 ELSE
  SELECT * INTO h FROM public.busy_growth_opportunities WHERE id=p_opportunity_id AND business_id=p_business_id AND owner_id=a FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Opportunity unavailable' USING ERRCODE='42501';END IF;
  SELECT * INTO v FROM public.busy_growth_opportunity_versions WHERE opportunity_id=h.id AND revision=h.revision;
  IF h.revision<>p_expected_revision OR v.source_hash IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Revision/source conflict' USING ERRCODE='40001';END IF;
  IF v.state='retired' AND p_action<>'reopen' OR v.state='active' AND p_action='reopen' THEN RAISE EXCEPTION 'Invalid lifecycle decision' USING ERRCODE='40001';END IF;
  h.revision:=h.revision+1;
 END IF;
 IF p_action IN ('create','edit') THEN
  IF jsonb_typeof(p_record) IS DISTINCT FROM 'object' OR p_record-ARRAY['title','description','source','serviceId','permission']<>'{}' OR (SELECT count(*)FROM jsonb_object_keys(p_record))<>5 OR EXISTS(SELECT 1 FROM jsonb_each(p_record)WHERE jsonb_typeof(value)<>'string') OR length(p_record->>'title') NOT BETWEEN 1 AND 100 OR length(p_record->>'description') NOT BETWEEN 1 AND 600 OR length(p_record->>'source') NOT BETWEEN 1 AND 300 OR length(p_record->>'serviceId') NOT BETWEEN 1 AND 128 OR p_record->>'permission' NOT IN ('permitted','unknown','restricted') OR p_record::text ~ '[<>]' THEN RAISE EXCEPTION 'Finite owner report required' USING ERRCODE='22023';END IF;
  v.title:=p_record->>'title';v.description:=p_record->>'description';v.source_account:=p_record->>'source';v.service_id:=p_record->>'serviceId';v.permission:=p_record->>'permission';
  v.reviewed_source_hash:=NULL;v.feedback:='clear';v.feedback_reason:='';
 ELSIF p_record IS NOT NULL THEN RAISE EXCEPTION 'Unrelated report modification denied' USING ERRCODE='22023';END IF;
 body:=jsonb_build_object('title',v.title,'description',v.description,'source',v.source_account,'serviceId',v.service_id,'permission',v.permission);
 next_hash:=encode(sha256(convert_to(body::text,'UTF8')),'hex');
 IF p_action='reinspect' THEN v.reviewed_source_hash:=next_hash;END IF;
 IF p_action='retire' THEN v.state:='retired';v.reviewed_source_hash:=NULL;END IF;
 IF p_action='reopen' THEN v.state:='active';v.reviewed_source_hash:=NULL;END IF;
 IF p_action='feedback' THEN
  IF p_feedback IS NULL OR p_feedback NOT IN ('clear','useful','irrelevant','later') OR p_reason IS NULL OR length(p_reason)>300 OR v.reviewed_source_hash IS DISTINCT FROM next_hash THEN RAISE EXCEPTION 'Review exact source before feedback' USING ERRCODE='40001';END IF;
  v.feedback:=p_feedback;v.feedback_reason:=CASE WHEN p_feedback='clear' THEN '' ELSE p_reason END;
 ELSIF p_feedback IS NOT NULL OR p_reason IS NOT NULL THEN RAISE EXCEPTION 'Unrelated preference denied' USING ERRCODE='22023';END IF;
 INSERT INTO public.busy_growth_opportunity_versions(opportunity_id,business_id,owner_id,revision,action,state,title,description,source_account,service_id,permission,source_hash,reviewed_source_hash,feedback,feedback_reason,operation_id)VALUES(h.id,p_business_id,a,h.revision,p_action,v.state,v.title,v.description,v.source_account,v.service_id,v.permission,next_hash,v.reviewed_source_hash,v.feedback,v.feedback_reason,p_operation_id)RETURNING * INTO v;
 UPDATE public.busy_growth_opportunities SET revision=h.revision WHERE id=h.id;
 RETURN busy_growth_private.projection(v)||jsonb_build_object('notOwnReceipt',false,'ownOperationReceipt',true,'operationId',p_operation_id,'previousRevision',p_expected_revision,'executionAuthorised',false);
END $$;
-- Independent exact operation observation for uncertain outcomes; never an own-write receipt.
CREATE OR REPLACE FUNCTION public.busy_growth_opportunity_operation_v1(p_business_id uuid,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);v public.busy_growth_opportunity_versions%ROWTYPE;n bigint;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Exact operation required' USING ERRCODE='22023';END IF;
 SELECT * INTO v FROM public.busy_growth_opportunity_versions WHERE business_id=p_business_id AND owner_id=a AND operation_id=p_operation_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'found',false,'notOwnReceipt',true);END IF;
 SELECT revision INTO n FROM public.busy_growth_opportunities WHERE id=v.opportunity_id;
 RETURN busy_growth_private.projection(v)||jsonb_build_object('found',true,'operationObserved',true,'operationId',p_operation_id,'currentRevision',n,'historical',v.revision<>n);
END $$;
REVOKE ALL ON FUNCTION public.busy_growth_opportunity_operation_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_growth_opportunity_operation_v1(uuid,text) TO authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA busy_growth_private FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_growth_opportunity_read_v1(uuid,uuid,bigint),public.busy_growth_opportunity_list_v1(uuid,uuid,integer),public.busy_growth_opportunity_write_v1(uuid,uuid,bigint,text,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_growth_opportunity_read_v1(uuid,uuid,bigint),public.busy_growth_opportunity_list_v1(uuid,uuid,integer),public.busy_growth_opportunity_write_v1(uuid,uuid,bigint,text,text,jsonb,text,text,text) TO authenticated;
COMMIT;
