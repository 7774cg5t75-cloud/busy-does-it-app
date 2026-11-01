-- Review only: after artifacts.sql/forms.sql, isolated staging. No hosted approval.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE SCREEN REVIEW FUSE: separate staging approval required';END $$;
SET LOCAL lock_timeout='5s';
ALTER TABLE busy_app_function_private.settings ADD COLUMN screens_closed boolean NOT NULL DEFAULT false;
CREATE TABLE busy_app_function_private.screen_heads(app_id uuid PRIMARY KEY REFERENCES public.busy_mini_apps(id),business_id uuid NOT NULL REFERENCES public.busy_businesses(id),owner_id uuid NOT NULL REFERENCES auth.users(id),revision integer NOT NULL CHECK(revision BETWEEN 1 AND 32));
CREATE TABLE busy_app_function_private.screen_versions(app_id uuid NOT NULL REFERENCES busy_app_function_private.screen_heads(app_id),revision integer NOT NULL CHECK(revision BETWEEN 1 AND 32),business_id uuid NOT NULL,owner_id uuid NOT NULL,source_app_revision bigint NOT NULL CHECK(source_app_revision>0),bindings jsonb NOT NULL CHECK(jsonb_typeof(bindings)='array' AND jsonb_array_length(bindings)<=3),canonical_text text NOT NULL CHECK(canonical_text=bindings::text AND octet_length(canonical_text)<=4096),digest text NOT NULL CHECK(digest=encode(sha256(convert_to(canonical_text,'UTF8')),'hex')),approved_by uuid NOT NULL CHECK(approved_by=owner_id),approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),request_key uuid NOT NULL,PRIMARY KEY(app_id,revision),UNIQUE(app_id,request_key));
ALTER TABLE busy_app_function_private.screen_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_app_function_private.screen_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON busy_app_function_private.screen_heads,busy_app_function_private.screen_versions FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER screen_immutable BEFORE UPDATE OR DELETE ON busy_app_function_private.screen_versions FOR EACH ROW EXECUTE FUNCTION busy_app_function_private.immutable();
CREATE FUNCTION public.busy_private_screen_v1(p_business_id uuid,p_actor_id uuid,p_app_id uuid,p_action text,p_expected_revision integer,p_expected_app bigint,p_request_key uuid,p_bindings jsonb,p_revision integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.busy_mini_apps%ROWTYPE;h busy_app_function_private.screen_heads%ROWTYPE;v busy_app_function_private.screen_versions%ROWTYPE;f busy_app_function_private.heads%ROWTYPE;artifact busy_app_function_private.versions%ROWTYPE;b jsonb;seen text[]:='{}';eligible boolean:=true;closed boolean;screen text;canonical text;
BEGIN
 IF p_actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id AND role='owner' FOR SHARE) THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE id=p_app_id AND business_id=p_business_id AND created_by=p_actor_id FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Current original owned App required' USING ERRCODE='42501';END IF;
 SELECT execution_closed OR screens_closed INTO closed FROM busy_app_function_private.settings WHERE id;IF closed IS NULL THEN RAISE EXCEPTION 'Private settings unavailable';END IF;
 SELECT * INTO h FROM busy_app_function_private.screen_heads WHERE app_id=a.id FOR UPDATE;
 IF FOUND AND (h.business_id<>p_business_id OR h.owner_id<>p_actor_id) THEN RAISE EXCEPTION 'Foreign placement owner' USING ERRCODE='42501';END IF;
 IF p_action='save' THEN
  IF closed THEN RAISE EXCEPTION 'Private screens locked' USING ERRCODE='42501';END IF;
  IF p_expected_app IS DISTINCT FROM a.draft_revision OR p_expected_revision IS DISTINCT FROM coalesce(h.revision,0) OR coalesce(h.revision,0)>=32 OR p_request_key IS NULL THEN RAISE EXCEPTION 'Stale placement approval or history limit' USING ERRCODE='40001';END IF;
  IF jsonb_typeof(p_bindings) IS DISTINCT FROM 'array' OR jsonb_array_length(p_bindings)>3 OR octet_length(p_bindings::text)>4096 THEN RAISE EXCEPTION 'Bounded private screen bindings required';END IF;
  FOR b IN SELECT value FROM jsonb_array_elements(p_bindings) LOOP
   IF jsonb_typeof(b) IS DISTINCT FROM 'object' OR NOT(b ?& ARRAY['screenId','functionId','version','hash','stateRevision']) OR b-ARRAY['screenId','functionId','version','hash','stateRevision']<>'{}' OR jsonb_typeof(b->'screenId') IS DISTINCT FROM 'string' OR coalesce(b->>'screenId','') NOT IN ('business_profile','services','contact') OR (b->>'screenId')=ANY(seen) OR jsonb_typeof(b->'functionId') IS DISTINCT FROM 'string' OR jsonb_typeof(b->'hash') IS DISTINCT FROM 'string' OR jsonb_typeof(b->'version') IS DISTINCT FROM 'number' OR jsonb_typeof(b->'stateRevision') IS DISTINCT FROM 'number' OR (b->>'version')::numeric<>trunc((b->>'version')::numeric) OR (b->>'stateRevision')::numeric<>trunc((b->>'stateRevision')::numeric) OR coalesce(b->>'hash','')!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Exact typed private binding required';END IF;
   screen:=b->>'screenId';seen:=array_append(seen,screen);
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'=screen AND m->'enabled'='true') THEN RAISE EXCEPTION 'Screen unavailable in this App';END IF;
   SELECT * INTO f FROM busy_app_function_private.heads WHERE function_id=(b->>'functionId')::uuid AND business_id=p_business_id AND app_id=a.id AND owner_id=p_actor_id FOR SHARE;
   IF NOT FOUND OR f.disabled OR f.current_version<>(b->>'version')::int OR f.revision<>(b->>'stateRevision')::bigint THEN RAISE EXCEPTION 'Artifact changed or unavailable' USING ERRCODE='40001';END IF;
   SELECT * INTO artifact FROM busy_app_function_private.versions WHERE function_id=f.function_id AND version=f.current_version;
   IF NOT FOUND OR artifact.spec_hash IS DISTINCT FROM b->>'hash' OR artifact.spec_hash<>encode(sha256(convert_to(artifact.canonical_text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Artifact integrity mismatch';END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM busy_app_function_private.screen_versions WHERE app_id=a.id AND request_key=p_request_key) THEN RAISE EXCEPTION 'Request already recorded; inspect rather than replay' USING ERRCODE='40001';END IF;
  IF h.app_id IS NULL THEN INSERT INTO busy_app_function_private.screen_heads VALUES(a.id,p_business_id,p_actor_id,1) RETURNING * INTO h;ELSE UPDATE busy_app_function_private.screen_heads SET revision=revision+1 WHERE app_id=a.id RETURNING * INTO h;END IF;
  canonical:=p_bindings::text;
  INSERT INTO busy_app_function_private.screen_versions(app_id,revision,business_id,owner_id,source_app_revision,bindings,canonical_text,digest,approved_by,request_key) VALUES(a.id,h.revision,p_business_id,p_actor_id,a.draft_revision,p_bindings,canonical,encode(sha256(convert_to(canonical,'UTF8')),'hex'),p_actor_id,p_request_key) RETURNING * INTO v;
 ELSIF p_action='read' THEN
  IF h.app_id IS NULL THEN RETURN jsonb_build_object('record',NULL,'currentRevision',0,'appRevision',a.draft_revision,'businessId',p_business_id,'ownerId',p_actor_id,'appId',a.id,'status',CASE WHEN closed THEN 'locked' ELSE 'empty' END,'privateOnly',true);END IF;
  SELECT * INTO v FROM busy_app_function_private.screen_versions WHERE app_id=a.id AND revision=coalesce(p_revision,h.revision);IF NOT FOUND THEN RAISE EXCEPTION 'Exact private placement revision unavailable';END IF;
 ELSE RAISE EXCEPTION 'Unsupported private placement operation';END IF;
 FOR b IN SELECT value FROM jsonb_array_elements(v.bindings) LOOP
  SELECT * INTO f FROM busy_app_function_private.heads WHERE function_id=(b->>'functionId')::uuid AND business_id=p_business_id AND app_id=a.id AND owner_id=p_actor_id FOR SHARE;
  IF NOT FOUND OR f.disabled OR f.current_version<>(b->>'version')::int OR f.revision<>(b->>'stateRevision')::bigint THEN eligible:=false;END IF;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'=b->>'screenId' AND m->'enabled'='true') THEN eligible:=false;END IF;
 END LOOP;
 IF v.digest<>encode(sha256(convert_to(v.bindings::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Private placement integrity mismatch';END IF;
 RETURN jsonb_build_object('record',to_jsonb(v),'currentRevision',h.revision,'appRevision',a.draft_revision,'businessId',p_business_id,'ownerId',p_actor_id,'appId',a.id,'status',CASE WHEN closed THEN 'locked' WHEN v.revision<>h.revision THEN 'historical' WHEN v.source_app_revision<>a.draft_revision THEN 'needs_review' WHEN NOT eligible THEN 'unavailable' ELSE 'accepted_private' END,'privateOnly',true);
END $$;
ALTER FUNCTION public.busy_private_screen_v1(uuid,uuid,uuid,text,integer,bigint,uuid,jsonb,integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_private_screen_v1(uuid,uuid,uuid,text,integer,bigint,uuid,jsonb,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_private_screen_v1(uuid,uuid,uuid,text,integer,bigint,uuid,jsonb,integer) TO service_role;
COMMIT;
