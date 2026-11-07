-- REVIEW ONLY: bounded approved public facts and blank workspace bootstrap.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'BUSINESS CONTEXT REVIEW FUSE: separate staging approval required'; END $$;
CREATE FUNCTION public.busy_connected_initialize_v1(p_business_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_snapshot_private.lock_writer(p_business_id);
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=a AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 INSERT INTO public.busy_business_snapshots(business_id) VALUES(p_business_id) ON CONFLICT(business_id) DO NOTHING;
 RETURN public.busy_connected_builder_read_v1(p_business_id);
END $$;
CREATE FUNCTION public.busy_connected_profile_write_v1(p_business_id uuid,p_expected_revision bigint,p_expected_profile jsonb,p_profile jsonb,p_owner_approved boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_snapshot_private.lock_writer(p_business_id);p public.busy_public_business_profiles%ROWTYPE;k text;m jsonb;r bigint;stored jsonb;allowed text[]:=ARRAY['businessName','businessType','tagline','description','serviceArea','services','contact'];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=a AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 IF p_owner_approved IS DISTINCT FROM true OR p_expected_revision IS NULL OR p_expected_revision<0 OR jsonb_typeof(p_profile) IS DISTINCT FROM 'object' OR octet_length(p_profile::text)>100000 OR (p_profile-allowed) IS DISTINCT FROM (coalesce(p_expected_profile,'{}'::jsonb)-allowed) OR jsonb_typeof(p_profile->'businessName') IS DISTINCT FROM 'string' OR length(btrim(p_profile->>'businessName')) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Review supported business facts' USING ERRCODE='22023';END IF;
 FOREACH k IN ARRAY ARRAY['businessName','businessType','tagline','description','serviceArea'] LOOP
  IF p_profile?k AND (jsonb_typeof(p_profile->k) IS DISTINCT FROM 'string' OR length(p_profile->>k)>3000 OR (p_profile->>k)~'[<>]') THEN RAISE EXCEPTION 'Invalid business wording' USING ERRCODE='22023';END IF;
 END LOOP;
 IF p_profile?'services' AND p_profile->'services' IS DISTINCT FROM p_expected_profile->'services' THEN
  IF jsonb_typeof(p_profile->'services') IS DISTINCT FROM 'array' OR jsonb_array_length(p_profile->'services')>50 THEN RAISE EXCEPTION 'Bounded services required' USING ERRCODE='22023';END IF;
  FOR m IN SELECT value FROM jsonb_array_elements(p_profile->'services') LOOP
   IF jsonb_typeof(m) IS DISTINCT FROM 'object' OR (m-ARRAY['id','name','description']) IS DISTINCT FROM coalesce((SELECT x-ARRAY['id','name','description'] FROM jsonb_array_elements(coalesce(p_expected_profile->'services','[]'::jsonb))x WHERE x->>'id'=m->>'id'),'{}'::jsonb) OR jsonb_typeof(m->'id') IS DISTINCT FROM 'string' OR m->>'id'!~'^[A-Za-z0-9_-]{1,80}$' OR jsonb_typeof(m->'name') IS DISTINCT FROM 'string' OR length(btrim(m->>'name')) NOT BETWEEN 1 AND 160 OR jsonb_typeof(m->'description') IS DISTINCT FROM 'string' OR length(m->>'description')>3000 OR ((m->>'name')||(m->>'description'))~'[<>]' THEN RAISE EXCEPTION 'Invalid approved service' USING ERRCODE='22023';END IF;
  END LOOP;
  IF (SELECT count(*)<>count(DISTINCT x->>'id') FROM jsonb_array_elements(p_profile->'services')x) THEN RAISE EXCEPTION 'Distinct service identities required' USING ERRCODE='22023';END IF;
 END IF;
 IF p_profile?'contact' AND p_profile->'contact' IS DISTINCT FROM p_expected_profile->'contact' THEN
  IF jsonb_typeof(p_profile->'contact') IS DISTINCT FROM 'object' OR (p_profile->'contact')-ARRAY['phone','email','openingHours']<>'{}' THEN RAISE EXCEPTION 'Supported contact fields required' USING ERRCODE='22023';END IF;
  FOR k,m IN SELECT key,value FROM jsonb_each(p_profile->'contact') LOOP IF jsonb_typeof(m) IS DISTINCT FROM 'string' OR length(m#>>'{}')>500 OR (m#>>'{}')~'[<>]' THEN RAISE EXCEPTION 'Invalid contact wording' USING ERRCODE='22023';END IF;END LOOP;
 END IF;
 PERFORM 1 FROM public.busy_businesses WHERE id=p_business_id FOR UPDATE;
 SELECT * INTO p FROM public.busy_public_business_profiles WHERE business_id=p_business_id FOR UPDATE;
 IF FOUND THEN
  IF p.revision IS DISTINCT FROM p_expected_revision OR busy_snapshot_private.profile_facts(p.profile) IS DISTINCT FROM p_expected_profile OR p.status<>'draft' THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
  stored:=p.profile;
  FOREACH k IN ARRAY allowed LOOP
   IF p_profile?k THEN stored:=jsonb_set(stored,ARRAY[k],p_profile->k,true);ELSE stored:=stored-k;END IF;
  END LOOP;
  -- Preserve unexposed per-service and contact extensions; no authority to edit them.
  IF p_profile?'services' THEN stored:=jsonb_set(stored,'{services}',(SELECT coalesce(jsonb_agg(coalesce((SELECT old-ARRAY['id','name','description','category'] FROM jsonb_array_elements(coalesce(p.profile->'services','[]'::jsonb))old WHERE old->>'id'=v->>'id'),'{}'::jsonb)||v),'[]'::jsonb) FROM jsonb_array_elements(p_profile->'services')v));END IF;
  IF p_profile?'contact' THEN stored:=jsonb_set(stored,'{contact}',(coalesce(p.profile->'contact','{}'::jsonb)-ARRAY['phone','email','openingHours'])||(p_profile->'contact'));END IF;
  UPDATE public.busy_public_business_profiles SET profile=stored,display_name=p_profile->>'businessName',revision=revision+1,updated_by=a,updated_at=clock_timestamp() WHERE business_id=p_business_id RETURNING revision INTO r;
 ELSE
  IF p_expected_revision<>0 OR p_expected_profile IS NOT NULL THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
  INSERT INTO public.busy_public_business_profiles(business_id,public_slug,display_name,profile,updated_by)VALUES(p_business_id,'private-'||p_business_id::text,p_profile->>'businessName',p_profile,a) RETURNING revision INTO r;
 END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',a,'profileRevision',r,'profile',busy_snapshot_private.profile_facts(p_profile),'privateOnly',true,'publicationChanged',false,'recordHash',encode(sha256(convert_to(busy_snapshot_private.profile_facts(p_profile)::text,'UTF8')),'hex'));
END $$;
REVOKE ALL ON FUNCTION public.busy_connected_initialize_v1(uuid),public.busy_connected_profile_write_v1(uuid,bigint,jsonb,jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_initialize_v1(uuid),public.busy_connected_profile_write_v1(uuid,bigint,jsonb,jsonb,boolean) TO authenticated;
COMMIT;
