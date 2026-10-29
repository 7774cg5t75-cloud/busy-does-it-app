-- REVIEW ONLY: service-only original private App write, not a generic writer.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'APP TRANSACTION REVIEW FUSE: separate staging approval required'; END $$;
CREATE FUNCTION public.busy_connected_private_app_commit_v1(p_business_id uuid,p_actor_id uuid,p_app_id uuid,p_expected_revision bigint,p_profile_revision bigint,p_patch jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE role_name text;a public.busy_mini_apps%ROWTYPE;p public.busy_public_business_profiles%ROWTYPE;
BEGIN
 IF p_actor_id IS NULL OR p_business_id IS NULL THEN RAISE EXCEPTION 'Verified owner required' USING ERRCODE='42501';END IF;
 SELECT role INTO role_name FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id FOR SHARE;
 IF role_name IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO p FROM public.busy_public_business_profiles WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR p.revision IS DISTINCT FROM p_profile_revision THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE business_id=p_business_id AND id=p_app_id FOR UPDATE;
 IF NOT FOUND OR p_expected_revision IS NULL OR a.draft_revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'App revision changed' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' OR p_patch-ARRAY['draft_config','draft_revision','status','updated_at','display_name','category','tagline','draft_profile_revision','last_error']<>'{}' OR jsonb_typeof(p_patch->'draft_config') IS DISTINCT FROM 'object' OR octet_length(p_patch::text)>200000 OR (p_patch->>'draft_revision')::bigint IS DISTINCT FROM a.draft_revision+1 OR p_patch->>'status' IS DISTINCT FROM (CASE WHEN a.current_live_version_id IS NULL THEN 'draft' ELSE 'update_pending' END) OR p_patch ? 'last_error' AND p_patch->'last_error'<>'null' THEN RAISE EXCEPTION 'Finite private draft patch required' USING ERRCODE='22023';END IF;
 IF jsonb_typeof(p_patch#>'{draft_config,modules}') IS DISTINCT FROM 'array' OR jsonb_array_length(p_patch#>'{draft_config,modules}')>40 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_patch#>'{draft_config,modules}')m WHERE m->>'enabled'='true' AND NOT EXISTS(SELECT 1 FROM public.busy_mini_app_module_catalog c WHERE c.module_key=m->>'key' AND c.status='available')) THEN RAISE EXCEPTION 'Unavailable App capability' USING ERRCODE='22023';END IF;
 IF p_patch ? 'draft_profile_revision' AND (p_patch->>'draft_profile_revision')::bigint IS DISTINCT FROM p.revision THEN RAISE EXCEPTION 'Profile revision mismatch' USING ERRCODE='40001';END IF;
 UPDATE public.busy_mini_apps SET draft_config=p_patch->'draft_config',draft_revision=a.draft_revision+1,status=p_patch->>'status',updated_at=clock_timestamp(),display_name=CASE WHEN p_patch?'display_name' THEN p_patch->>'display_name' ELSE a.display_name END,category=CASE WHEN p_patch?'category' THEN p_patch->>'category' ELSE a.category END,tagline=CASE WHEN p_patch?'tagline' THEN p_patch->>'tagline' ELSE a.tagline END,draft_profile_revision=CASE WHEN p_patch?'draft_profile_revision' THEN p.revision ELSE a.draft_profile_revision END WHERE id=a.id RETURNING * INTO a;
 RETURN to_jsonb(a);
END $$;
ALTER FUNCTION public.busy_connected_private_app_commit_v1(uuid,uuid,uuid,bigint,bigint,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_connected_private_app_commit_v1(uuid,uuid,uuid,bigint,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_private_app_commit_v1(uuid,uuid,uuid,bigint,bigint,jsonb) TO service_role;
CREATE FUNCTION public.busy_connected_first_app_v1(p_business_id uuid,p_actor_user_id uuid,p_public_slug text,p_display_name text,p_category text,p_tagline text,p_profile_revision bigint,p_draft_config jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE member_role text;r bigint;
BEGIN
 SELECT role INTO member_role FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_user_id FOR SHARE;
 IF member_role IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT revision INTO r FROM public.busy_public_business_profiles WHERE business_id=p_business_id FOR SHARE;
 IF r IS NULL OR r IS DISTINCT FROM p_profile_revision THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_draft_config->'modules')m WHERE m->>'enabled'='true' AND NOT EXISTS(SELECT 1 FROM public.busy_mini_app_module_catalog c WHERE c.module_key=m->>'key' AND c.status='available')) THEN RAISE EXCEPTION 'Unavailable App capability' USING ERRCODE='22023';END IF;
 RETURN public.busy_create_first_mini_app_draft_v3199(p_business_id,p_actor_user_id,p_public_slug,p_display_name,p_category,p_tagline,p_profile_revision,p_draft_config);
END $$;
ALTER FUNCTION public.busy_connected_first_app_v1(uuid,uuid,text,text,text,text,bigint,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_connected_first_app_v1(uuid,uuid,text,text,text,text,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_first_app_v1(uuid,uuid,text,text,text,text,bigint,jsonb) TO service_role;
COMMIT;
