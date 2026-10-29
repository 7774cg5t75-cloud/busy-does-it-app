-- REVIEW ONLY. Exact staging target pnjdlogwegnqbsfpcofw; never auto-install.
-- Requires original business/membership/snapshot/profile contracts and Phase58 fence.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'CONNECTED BUILDERS REVIEW FUSE: explicit staging activation approval required'; END $$;

-- Read-only membership discovery: no caller-supplied actor or editable JWT metadata.
CREATE FUNCTION public.busy_connected_workspaces_v1() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('actorId',auth.uid(),'items',coalesce(jsonb_agg(jsonb_build_object(
 'businessId',b.id,'businessName',b.name,'role',m.role) ORDER BY b.id),'[]'::jsonb))
 FROM public.busy_business_memberships m JOIN public.busy_businesses b ON b.id=m.business_id
 WHERE auth.uid() IS NOT NULL AND m.user_id=auth.uid() AND m.role='owner'
$$;

CREATE FUNCTION public.busy_connected_builder_read_v1(p_business_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; profile public.busy_public_business_profiles%ROWTYPE;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR snap.schema_version<>1 OR snap.revision<1 THEN RAISE EXCEPTION 'Workspace unavailable' USING ERRCODE='40001'; END IF;
 SELECT * INTO profile FROM public.busy_public_business_profiles WHERE business_id=p_business_id AND status<>'disabled' FOR SHARE;
 -- Only original website and finite public business facts. Never CRM/snapshot restoration.
 RETURN jsonb_build_object('actorId',actor,'businessId',p_business_id,'revision',snap.revision,
 'websiteDraft',snap.payload->'websiteDraft','profileRevision',profile.revision,
 'profile',CASE WHEN profile.business_id IS NULL THEN NULL ELSE jsonb_build_object(
 'businessName',profile.profile->>'businessName','businessType',profile.profile->>'businessType',
 'serviceArea',profile.profile->>'serviceArea','description',profile.profile->>'description',
 'services',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','name',v->>'name','description',v->>'description','category',v->>'category')),'[]'::jsonb) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(profile.profile->'services')='array' THEN profile.profile->'services' ELSE '[]'::jsonb END) v),
 'contact',jsonb_build_object('phone',profile.profile#>>'{contact,phone}','email',profile.profile#>>'{contact,email}'),
 'brand',jsonb_build_object('primary',profile.profile#>>'{brand,primary}','secondary',profile.profile#>>'{brand,secondary}')) END);
END $$;

-- Original snapshot websiteDraft target only. Called by authenticated original
-- website gateway with its server-verified actor; never granted to mobile roles.
CREATE FUNCTION public.busy_connected_website_commit_v1(p_business_id uuid,p_actor_id uuid,
 p_expected_revision bigint,p_expected_draft jsonb,p_candidate jsonb,p_profile_revision bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE snap public.busy_business_snapshots%ROWTYPE; member_role text;
BEGIN
 IF p_actor_id IS NULL THEN RAISE EXCEPTION 'Identity required' USING ERRCODE='42501'; END IF;
 SELECT role INTO member_role FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id FOR UPDATE;
 IF member_role IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 IF p_expected_draft IS NULL THEN
  PERFORM 1 FROM public.busy_public_business_profiles WHERE business_id=p_business_id AND revision=p_profile_revision AND status<>'disabled' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001'; END IF;
 END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version<>1 OR snap.revision IS DISTINCT FROM p_expected_revision
 OR nullif(snap.payload->'websiteDraft','null'::jsonb) IS DISTINCT FROM p_expected_draft THEN RAISE EXCEPTION 'Website conflict' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(p_candidate) IS DISTINCT FROM 'object' OR octet_length(p_candidate::text)>250000
 OR p_candidate->>'businessId' IS DISTINCT FROM p_business_id::text
 OR p_candidate->>'status' IS DISTINCT FROM 'Draft' OR p_candidate->>'publicStatus' IS DISTINCT FROM 'Not published'
 OR jsonb_typeof(p_candidate->'sections') IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_candidate->'sections') NOT BETWEEN 1 AND 30
 OR coalesce(length(p_candidate->>'id'),0) NOT BETWEEN 1 AND 160
 OR p_candidate->'generation' IS DISTINCT FROM to_jsonb(coalesce((p_expected_draft->>'generation')::bigint,0)+1)
 OR (p_expected_draft IS NOT NULL AND p_candidate->'id' IS DISTINCT FROM p_expected_draft->'id') THEN
 RAISE EXCEPTION 'Unsupported private website' USING ERRCODE='22023'; END IF;
 -- jsonb_set preserves every unrelated original key, including unknown extensions.
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{websiteDraft}',p_candidate,true),revision=revision+1,updated_at=now() WHERE business_id=p_business_id;
 RETURN jsonb_build_object('ok',true,'businessId',p_business_id,'actorId',p_actor_id,'previousRevision',snap.revision,
 'revision',snap.revision+1,'draftId',p_candidate->>'id','generation',p_candidate->'generation','privateOnly',true);
END $$;

ALTER FUNCTION public.busy_connected_workspaces_v1() OWNER TO postgres;
ALTER FUNCTION public.busy_connected_builder_read_v1(uuid) OWNER TO postgres;
ALTER FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_connected_workspaces_v1() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_connected_builder_read_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_workspaces_v1(),public.busy_connected_builder_read_v1(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) TO service_role;
COMMIT;
