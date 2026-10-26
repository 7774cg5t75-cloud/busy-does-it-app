-- LOCAL REVIEW CANDIDATE ONLY. Subordinate original Creator editing state, never publication.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'CREATOR PRIVATE DRAFT REVIEW FUSE: separate hosted approval required'; END $$;
-- Reapplication is allowed only for the marked postgres-owned proposal, never hostile objects.
DO $$ DECLARE obj record;BEGIN
 FOR obj IN SELECT nspowner AS owner,obj_description(oid,'pg_namespace') marker FROM pg_namespace WHERE nspname='busy_creator_private' LOOP
 IF obj.owner<>'postgres'::regrole OR obj.marker IS DISTINCT FROM 'creator_private_v1' THEN RAISE EXCEPTION 'Untrusted Creator schema' USING ERRCODE='42501';END IF;END LOOP;
 FOR obj IN SELECT c.relowner AS owner,obj_description(c.oid,'pg_class') marker FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('busy_creator_draft_heads','busy_creator_draft_versions') LOOP
 IF obj.owner<>'postgres'::regrole OR obj.marker IS DISTINCT FROM 'creator_private_v1' THEN RAISE EXCEPTION 'Untrusted Creator table' USING ERRCODE='42501';END IF;END LOOP;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='busy_creator_private' OR n.nspname='public' AND p.proname LIKE 'busy_creator_draft_%') AND p.proowner<>'postgres'::regrole) THEN RAISE EXCEPTION 'Untrusted Creator function' USING ERRCODE='42501';END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS busy_creator_private AUTHORIZATION postgres;
COMMENT ON SCHEMA busy_creator_private IS 'creator_private_v1';
REVOKE ALL ON SCHEMA busy_creator_private FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE IF NOT EXISTS public.busy_creator_draft_heads(
 business_id uuid NOT NULL REFERENCES public.busy_businesses(id) ON DELETE RESTRICT,
 owner_id uuid NOT NULL,draft_id text NOT NULL CHECK(draft_id ~ '^[A-Za-z0-9_-]{1,120}$'),revision bigint NOT NULL CHECK(revision>0),
 PRIMARY KEY(business_id,owner_id,draft_id)
);
CREATE TABLE IF NOT EXISTS public.busy_creator_draft_versions(
 business_id uuid NOT NULL,owner_id uuid NOT NULL,draft_id text NOT NULL,revision bigint NOT NULL CHECK(revision>0),
 content jsonb NOT NULL,opportunity_id uuid,opportunity_revision bigint,source_hash text,
 operation_id uuid NOT NULL DEFAULT gen_random_uuid(),request_key text NOT NULL CHECK(request_key ~ '^[A-Za-z0-9_-]{8,120}$'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(business_id,owner_id,draft_id,revision),UNIQUE(business_id,owner_id,request_key),UNIQUE(operation_id),
 FOREIGN KEY(business_id,owner_id,draft_id) REFERENCES public.busy_creator_draft_heads(business_id,owner_id,draft_id) ON DELETE RESTRICT,
 FOREIGN KEY(opportunity_id,business_id,owner_id) REFERENCES public.busy_growth_opportunities(id,business_id,owner_id) ON DELETE RESTRICT
);
COMMENT ON TABLE public.busy_creator_draft_heads IS 'creator_private_v1';
COMMENT ON TABLE public.busy_creator_draft_versions IS 'creator_private_v1';
CREATE INDEX IF NOT EXISTS busy_creator_opportunity_page ON public.busy_creator_draft_versions(business_id,owner_id,opportunity_id,draft_id,revision);
ALTER TABLE public.busy_creator_draft_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.busy_creator_draft_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.busy_creator_draft_heads,public.busy_creator_draft_versions FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION busy_creator_private.valid_content(v jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE k text;x jsonb;
BEGIN
 IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v) key) IS DISTINCT FROM ARRAY['brandFingerprint','brief','channels','format','media','ownerFacts','preparedCopy','schemaVersion','text','treatment'] OR v->'schemaVersion' IS DISTINCT FROM '1'::jsonb OR coalesce(v->>'format' NOT IN ('social','poster','advert','newsletter'),true) OR coalesce(v->>'treatment' NOT IN ('standard','welcoming','concise','detailed','brand'),true) THEN RETURN false;END IF;
 FOREACH k IN ARRAY ARRAY['text','brief','brandFingerprint','ownerFacts','preparedCopy'] LOOP
  IF jsonb_typeof(v->k)<>'string' OR length(v->>k)>(CASE k WHEN 'text' THEN 15000 WHEN 'brief' THEN 3000 WHEN 'ownerFacts' THEN 3000 WHEN 'preparedCopy' THEN 15000 ELSE 240 END) OR (v->>k) ~ '[<>]' THEN RETURN false;END IF;
 END LOOP;
 IF btrim(v->>'text')='' OR jsonb_typeof(v->'channels')<>'array' OR jsonb_array_length(v->'channels')>3 OR v->'media'<>'[]'::jsonb THEN RETURN false;END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v->'channels') a WHERE a NOT IN ('"Facebook"'::jsonb,'"Instagram"'::jsonb,'"Google Business"'::jsonb)) OR (SELECT count(*) FROM jsonb_array_elements(v->'channels'))<>(SELECT count(DISTINCT a) FROM jsonb_array_elements(v->'channels') a) THEN RETURN false;END IF;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION busy_creator_private.source_state(b uuid,a uuid,o uuid,r bigint,h text,writing boolean) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE head public.busy_growth_opportunities%ROWTYPE;v public.busy_growth_opportunity_versions%ROWTYPE;old public.busy_growth_opportunity_versions%ROWTYPE;
BEGIN
 IF o IS NULL THEN IF r IS NOT NULL OR h IS NOT NULL THEN RAISE EXCEPTION 'Unsupported source' USING ERRCODE='22023';END IF;RETURN 'not_linked';END IF;
 SELECT * INTO head FROM public.busy_growth_opportunities WHERE id=o AND business_id=b AND owner_id=a FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO v FROM public.busy_growth_opportunity_versions WHERE opportunity_id=o AND revision=head.revision;
 SELECT * INTO old FROM public.busy_growth_opportunity_versions WHERE opportunity_id=o AND revision=r;
 IF NOT FOUND OR old.source_hash IS DISTINCT FROM h OR v.permission IS DISTINCT FROM 'permitted' THEN RAISE EXCEPTION 'Source restricted' USING ERRCODE='42501';END IF;
 IF writing AND (head.revision<>r OR v.state IS DISTINCT FROM 'active' OR v.reviewed_source_hash IS DISTINCT FROM h) THEN RAISE EXCEPTION 'Source review changed' USING ERRCODE='40001';END IF;
 RETURN CASE WHEN v.state='retired' THEN 'retired' WHEN head.revision<>r THEN 'historical' ELSE 'current' END;
END $$;
CREATE OR REPLACE FUNCTION busy_creator_private.project(v public.busy_creator_draft_versions) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE state text;origin jsonb:=NULL;g public.busy_growth_opportunity_versions%ROWTYPE;
BEGIN
 state:=busy_creator_private.source_state(v.business_id,v.owner_id,v.opportunity_id,v.opportunity_revision,v.source_hash,false);
 IF v.opportunity_id IS NOT NULL THEN SELECT * INTO g FROM public.busy_growth_opportunity_versions WHERE opportunity_id=v.opportunity_id AND revision=v.opportunity_revision;
 origin:=jsonb_build_object('version',1,'type','owner_reported_opportunity','ownerId',v.owner_id,'businessId',v.business_id,'opportunityId',v.opportunity_id,'revision',v.opportunity_revision,'sourceHash',v.source_hash,'sourceAccount',g.source_account,'provenance','owner_reported','referenceOnly',true);END IF;
 RETURN jsonb_build_object('businessId',v.business_id,'ownerId',v.owner_id,'draftId',v.draft_id,'revision',v.revision,'content',v.content,'opportunityReference',origin,'sourceState',state,'recordedAt',v.recorded_at,'status','Draft','notOwnReceipt',true);
END $$;
CREATE OR REPLACE FUNCTION public.busy_creator_draft_read_v1(p_business_id uuid,p_draft_id text,p_revision bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);head public.busy_creator_draft_heads%ROWTYPE;v public.busy_creator_draft_versions%ROWTYPE;
BEGIN
 SELECT * INTO head FROM public.busy_creator_draft_heads WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Draft unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO v FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id AND revision=coalesce(p_revision,head.revision);
 IF NOT FOUND THEN RAISE EXCEPTION 'Version unavailable' USING ERRCODE='22023';END IF;
 -- Same lock order as writes: live owner, source, then the Creator head.
 PERFORM busy_creator_private.source_state(v.business_id,v.owner_id,v.opportunity_id,v.opportunity_revision,v.source_hash,false);
 SELECT * INTO head FROM public.busy_creator_draft_heads WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Draft unavailable' USING ERRCODE='42501';END IF;
 IF p_revision IS NULL AND head.revision<>v.revision THEN SELECT * INTO v FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id AND revision=head.revision;END IF;
 RETURN busy_creator_private.project(v)||jsonb_build_object('currentRevision',head.revision,'historical',v.revision<>head.revision);
END $$;
CREATE OR REPLACE FUNCTION public.busy_creator_draft_write_v1(p_business_id uuid,p_draft_id text,p_expected_revision bigint,p_content jsonb,p_opportunity_id uuid,p_opportunity_revision bigint,p_source_hash text,p_request_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);head public.busy_creator_draft_heads%ROWTYPE;old public.busy_creator_draft_versions%ROWTYPE;v public.busy_creator_draft_versions%ROWTYPE;collision boolean;
BEGIN
 IF p_draft_id IS NULL OR p_draft_id!~'^[A-Za-z0-9_-]{1,120}$' OR p_expected_revision IS NULL OR p_expected_revision<0 OR p_request_key IS NULL OR p_request_key!~'^[A-Za-z0-9_-]{8,120}$' OR NOT coalesce(busy_creator_private.valid_content(p_content),false) THEN RAISE EXCEPTION 'Unsupported private content' USING ERRCODE='22023';END IF;
 -- Do not adopt or reset historical/public queue rows. No publication writer is called.
 IF to_regclass('public.busy_social_posts') IS NOT NULL THEN EXECUTE 'SELECT EXISTS(SELECT 1 FROM public.busy_social_posts WHERE client_draft_id=$1)' INTO collision USING p_draft_id;IF collision THEN RAISE EXCEPTION 'Original queue record requires separate review' USING ERRCODE='42501';END IF;END IF;
 -- Source lock precedes private head lock; Growth changes cannot race a save.
 PERFORM busy_creator_private.source_state(p_business_id,a,p_opportunity_id,p_opportunity_revision,p_source_hash,true);
 IF EXISTS(SELECT 1 FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND request_key=p_request_key) THEN RAISE EXCEPTION 'Request already recorded' USING ERRCODE='40001';END IF;
 IF p_expected_revision=0 THEN INSERT INTO public.busy_creator_draft_heads VALUES(p_business_id,a,p_draft_id,1);END IF;
 SELECT * INTO head FROM public.busy_creator_draft_heads WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id FOR UPDATE;
 IF NOT FOUND OR p_expected_revision>0 AND head.revision<>p_expected_revision THEN RAISE EXCEPTION 'Draft revision changed' USING ERRCODE='40001';END IF;
 IF p_expected_revision>0 THEN
  SELECT * INTO old FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id AND revision=head.revision;
  IF ROW(old.opportunity_id,old.opportunity_revision,old.source_hash) IS DISTINCT FROM ROW(p_opportunity_id,p_opportunity_revision,p_source_hash) THEN RAISE EXCEPTION 'Original source cannot be rebound' USING ERRCODE='22023';END IF;
 END IF;
 INSERT INTO public.busy_creator_draft_versions(business_id,owner_id,draft_id,revision,content,opportunity_id,opportunity_revision,source_hash,request_key) VALUES(p_business_id,a,p_draft_id,p_expected_revision+1,p_content,p_opportunity_id,p_opportunity_revision,p_source_hash,p_request_key) RETURNING * INTO v;
 UPDATE public.busy_creator_draft_heads SET revision=v.revision WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id;
 RETURN busy_creator_private.project(v)||jsonb_build_object('notOwnReceipt',false,'ownOperationReceipt',true,'operationId',v.operation_id,'requestKey',v.request_key,'previousRevision',p_expected_revision,'executionAuthorised',false);
END $$;
CREATE OR REPLACE FUNCTION public.busy_creator_draft_list_v1(p_business_id uuid,p_opportunity_id uuid DEFAULT NULL,p_after text DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);items jsonb;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_after IS NOT NULL AND p_after!~'^[A-Za-z0-9_-]{1,120}$' THEN RAISE EXCEPTION 'Bounded exact cursor required' USING ERRCODE='22023';END IF;
 -- Filter through current privacy before selecting the bounded page, so restricted rows do not truncate discovery.
 SELECT coalesce(jsonb_agg(x.item ORDER BY x.draft_id),'[]') INTO items FROM (
 SELECT h.draft_id,jsonb_build_object('draftId',h.draft_id,'revision',h.revision,'format',v.content->>'format','briefPreview',left(v.content->>'brief',120),'opportunityId',v.opportunity_id,'recordedAt',v.recorded_at) item
 FROM public.busy_creator_draft_heads h JOIN public.busy_creator_draft_versions v ON v.business_id=h.business_id AND v.owner_id=h.owner_id AND v.draft_id=h.draft_id AND v.revision=h.revision
 WHERE h.business_id=p_business_id AND h.owner_id=a AND (p_after IS NULL OR h.draft_id>p_after) AND (p_opportunity_id IS NULL OR v.opportunity_id=p_opportunity_id)
 AND (v.opportunity_id IS NULL OR EXISTS(SELECT 1 FROM public.busy_growth_opportunities gh JOIN public.busy_growth_opportunity_versions gv ON gv.opportunity_id=gh.id AND gv.revision=gh.revision WHERE gh.id=v.opportunity_id AND gh.business_id=p_business_id AND gh.owner_id=a AND gv.permission='permitted')) ORDER BY h.draft_id LIMIT p_limit) x;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'items',items,'nextAfter',CASE WHEN jsonb_array_length(items)=p_limit THEN items->-1->>'draftId' ELSE NULL END,'notOwnReceipt',true);
END $$;
CREATE OR REPLACE FUNCTION public.busy_creator_draft_operation_v1(p_business_id uuid,p_request_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);v public.busy_creator_draft_versions%ROWTYPE;
BEGIN
 SELECT * INTO v FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND request_key=p_request_key;
 IF NOT FOUND THEN RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'found',false,'notOwnReceipt',true);END IF;
 RETURN busy_creator_private.project(v)||jsonb_build_object('found',true,'requestKey',v.request_key,'operationId',v.operation_id,'operationObserved',true);
END $$;
DO $$ DECLARE f record;BEGIN
 FOR f IN SELECT p.oid::regprocedure signature,ns.nspname,p.proname FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE ns.nspname='busy_creator_private' OR ns.nspname='public' AND p.proname LIKE 'busy_creator_draft_%_v1' LOOP
 EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 IF f.nspname='public' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role') AND (has_schema_privilege(r.oid,'busy_creator_private','USAGE') OR has_table_privilege(r.oid,'public.busy_creator_draft_versions','SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege(r.oid,'public.busy_creator_draft_heads','SELECT,INSERT,UPDATE,DELETE'))) THEN RAISE EXCEPTION 'Effective Creator privilege leak' USING ERRCODE='42501';END IF;
END $$;
COMMIT;
