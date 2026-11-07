-- REVIEW ONLY: private description on ORIGINAL App row, not another builder/store.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'PRIVATE APP PROJECT REVIEW FUSE: separate exact staging approval required'; END $$;
ALTER TABLE public.busy_mini_apps ADD COLUMN private_project_spec jsonb;
ALTER TABLE public.busy_mini_apps ADD COLUMN private_project_history jsonb NOT NULL DEFAULT '[]';
ALTER TABLE public.busy_mini_apps ADD CONSTRAINT busy_private_project_bounds CHECK((private_project_spec IS NULL OR (jsonb_typeof(private_project_spec)='object' AND octet_length(private_project_spec::text)<=16000)) AND jsonb_typeof(private_project_history)='array' AND jsonb_array_length(private_project_history)<=8 AND octet_length(private_project_history::text)<=130000);
COMMENT ON COLUMN public.busy_mini_apps.private_project_spec IS 'Owner-private descriptive requirements; never copy into version config, public app or provider payload.';
CREATE FUNCTION public.busy_connected_app_spec_commit_v1(p_business_id uuid,p_actor_id uuid,p_app_id uuid,p_expected_revision bigint,p_profile_revision bigint,p_operation text,p_spec jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a public.busy_mini_apps%ROWTYPE;p public.busy_public_business_profiles%ROWTYPE;h jsonb;next jsonb;s jsonb;item jsonb;ids text[];
BEGIN
 IF p_actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id AND role='owner' FOR SHARE) THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO p FROM public.busy_public_business_profiles WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR p.revision IS DISTINCT FROM p_profile_revision THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE business_id=p_business_id AND id=p_app_id AND created_by=p_actor_id FOR UPDATE;
 IF NOT FOUND OR p_expected_revision IS NULL OR a.draft_revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Private app revision changed' USING ERRCODE='40001';END IF;
 h:=a.private_project_history;
 IF p_operation='save' THEN
  IF jsonb_typeof(p_spec) IS DISTINCT FROM 'object' OR octet_length(p_spec::text)>16000 OR p_spec-ARRAY['version','scope','kind','explanation','objectives','app']<>'{}' OR (SELECT count(*) FROM jsonb_object_keys(p_spec))<>6 OR coalesce(p_spec->>'version','') NOT IN ('busy.builder-proposal.v1','busy.app-specification.v2') OR p_spec->>'kind' IS DISTINCT FROM 'app-requirements' OR p_spec->'objectives' IS DISTINCT FROM '[]'::jsonb OR jsonb_typeof(p_spec->'explanation') IS DISTINCT FROM 'string' OR length(p_spec->>'explanation') NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Bounded descriptive proposal required' USING ERRCODE='22023';END IF;
  s:=p_spec->'scope';
  IF s IS DISTINCT FROM jsonb_build_object('ownerId',p_actor_id,'businessId',p_business_id,'projectId',p_app_id,'sourceRevision',p_expected_revision,'profileRevision',p_expected_revision,'surface','app','pageId',NULL) THEN RAISE EXCEPTION 'Exact proposal source required' USING ERRCODE='40001';END IF;
  next:=p_spec->'app';
  IF jsonb_typeof(next) IS DISTINCT FROM 'object' OR next-ARRAY['purpose','users','screens','entities','workflows','deviceCapabilities','privacy','visual','acceptance','unsupported']<>'{}' OR (SELECT count(*) FROM jsonb_object_keys(next))<>10 OR jsonb_typeof(next->'purpose') IS DISTINCT FROM 'string' OR length(btrim(next->>'purpose')) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Known descriptive requirements only' USING ERRCODE='22023';END IF;
  FOREACH s IN ARRAY ARRAY[next->'users',next->'screens',next->'entities',next->'workflows',next->'deviceCapabilities',next->'privacy',next->'visual',next->'acceptance',next->'unsupported'] LOOP IF jsonb_typeof(s) IS DISTINCT FROM 'array' OR jsonb_array_length(s)>12 THEN RAISE EXCEPTION 'Bounded requirements lists required' USING ERRCODE='22023';END IF;END LOOP;
  IF jsonb_array_length(next->'screens')<1 OR jsonb_array_length(next->'entities')<1 THEN RAISE EXCEPTION 'Describe screens and information' USING ERRCODE='22023';END IF;
  ids:=ARRAY(SELECT x->>'id' FROM jsonb_array_elements(next->'screens')x);
  IF (SELECT count(*)<>count(DISTINCT x) FROM unnest(ids)x) THEN RAISE EXCEPTION 'Unique screen identities required' USING ERRCODE='22023';END IF;
  FOR item IN SELECT x FROM jsonb_array_elements(next->'screens')x LOOP
   IF item-ARRAY['id','title','module','next']<>'{}' OR (SELECT count(*) FROM jsonb_object_keys(item))<>4 OR coalesce(item->>'id','')!~'^[A-Za-z0-9_-]{1,100}$' OR jsonb_typeof(item->'title') IS DISTINCT FROM 'string' OR length(btrim(item->>'title')) NOT BETWEEN 1 AND 240 OR jsonb_typeof(item->'next') IS DISTINCT FROM 'array' OR jsonb_array_length(item->'next')>12 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(item->'next')n WHERE NOT(n=ANY(ids))) OR (item->'module'='null' AND p_spec->>'version'<>'busy.app-specification.v2') OR (item->'module'<>'null' AND NOT EXISTS(SELECT 1 FROM public.busy_mini_app_module_catalog c WHERE c.module_key=item->>'module' AND c.status='available')) THEN RAISE EXCEPTION 'Known screen/navigation descriptions required' USING ERRCODE='22023';END IF;
  END LOOP;
  IF a.private_project_spec IS NOT DISTINCT FROM p_spec THEN RAISE EXCEPTION 'Idea already saved' USING ERRCODE='40001';END IF;
  h:=h||jsonb_build_array(a.private_project_spec);SELECT coalesce(jsonb_agg(value ORDER BY ordinality),'[]') INTO h FROM jsonb_array_elements(h) WITH ORDINALITY WHERE ordinality>greatest(jsonb_array_length(h)-8,0);next:=p_spec;
 ELSIF p_operation='undo' AND p_spec IS NULL AND jsonb_array_length(h)>0 THEN next:=h->(jsonb_array_length(h)-1);h:=h-(jsonb_array_length(h)-1);IF next='null'::jsonb THEN next:=NULL;END IF;
 ELSE RAISE EXCEPTION 'Finite save or retaining Undo required' USING ERRCODE='22023';END IF;
 UPDATE public.busy_mini_apps SET private_project_spec=next,private_project_history=h,draft_revision=a.draft_revision+1,updated_at=clock_timestamp() WHERE id=a.id RETURNING * INTO a;
 RETURN to_jsonb(a);
END $$;
ALTER FUNCTION public.busy_connected_app_spec_commit_v1(uuid,uuid,uuid,bigint,bigint,text,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_connected_app_spec_commit_v1(uuid,uuid,uuid,bigint,bigint,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_app_spec_commit_v1(uuid,uuid,uuid,bigint,bigint,text,jsonb) TO service_role;
REVOKE SELECT(private_project_spec,private_project_history),INSERT(private_project_spec,private_project_history),UPDATE(private_project_spec,private_project_history),REFERENCES(private_project_spec,private_project_history) ON public.busy_mini_apps FROM PUBLIC,anon,authenticated;
COMMIT;
