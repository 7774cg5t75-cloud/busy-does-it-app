-- REVIEW ONLY. Separate future SQL/bootstrap approval required; never auto-apply.
-- Narrows only the original six-argument private Website Studio edit wrapper.
-- Original source: connected-builders/website-history.sql SHA256
-- 5d4edd3c1eca101b631cfec2a8644955b921f89828949582f819e20f8d987aa1.
-- No AI Lab artifact, tables, history format, publication or budget authority changes.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'MISSION16 WEBSITE PROFILE CAS REVIEW FUSE: separate exact SQL and compatible server bootstrap approval required'; END $$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
DO $$
DECLARE p pg_proc%ROWTYPE; service_oid oid;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Original reviewed installer required'; END IF;
 SELECT * INTO p FROM pg_proc WHERE oid=to_regprocedure('public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint)');
 SELECT oid INTO service_oid FROM pg_roles WHERE rolname='service_role';
 IF NOT FOUND OR service_oid IS NULL OR p.oid IS NULL OR pg_get_userbyid(p.proowner)<>'postgres'
 OR p.prolang IS DISTINCT FROM (SELECT oid FROM pg_language WHERE lanname='sql')
 OR p.prosecdef IS DISTINCT FROM true OR p.prokind<>'f' OR p.prorettype<>'jsonb'::regtype
 OR p.proisstrict OR p.provolatile<>'v' OR p.proparallel<>'u'
 OR cardinality(p.proconfig) IS DISTINCT FROM 1
 OR regexp_replace(p.proconfig[1],'[[:space:]]','','g') IS DISTINCT FROM 'search_path=pg_catalog,pg_temp'
 OR encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') IS DISTINCT FROM '38e71cc584ec8f71277ad800dacfcf23e40588f7ad965d9b09a67b59887583f3'
 OR NOT has_function_privilege('service_role',p.oid,'EXECUTE')
 OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE')
 OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
           WHERE a.grantee NOT IN (p.proowner,service_oid) OR (a.grantee=service_oid AND (a.privilege_type<>'EXECUTE' OR a.is_grantable)))
 OR to_regprocedure('public.busy_connected_website_transition_v1(uuid,uuid,bigint,jsonb,jsonb,bigint,text)') IS NULL
 THEN RAISE EXCEPTION 'Original Website Studio wrapper or service-only permissions differ; review required'; END IF;
 -- Temporary transaction-local evidence only, not another application store.
 PERFORM set_config('busy.mission16_original_wrapper_owner',p.proowner::text,true);
 PERFORM set_config('busy.mission16_original_wrapper_acl',p.proacl::text,true);
END $$;
CREATE OR REPLACE FUNCTION public.busy_connected_website_commit_v1(p_business_id uuid,p_actor_id uuid,p_expected_revision bigint,p_expected_draft jsonb,p_candidate jsonb,p_profile_revision bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF p_candidate->>'siteComposition'='connected-pages-v1' OR p_expected_draft->>'siteComposition'='connected-pages-v1' THEN
  -- Same original owner-membership lock as profile_write/website_transition.
  -- It serializes profile edits and membership revocation before the profile read.
  PERFORM 1 FROM public.busy_business_memberships
   WHERE business_id=p_business_id AND user_id=p_actor_id AND role='owner' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.busy_public_business_profiles
   WHERE business_id=p_business_id AND revision=p_profile_revision AND status<>'disabled' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001'; END IF;
 END IF;
 -- Original finite writer retains exact website CAS, history, receipts and limits.
 -- Legacy drafts take the original wrapper path without a new profile condition.
 RETURN public.busy_connected_website_transition_v1(p_business_id,p_actor_id,p_expected_revision,p_expected_draft,p_candidate,p_profile_revision,'edit');
END $$;
DO $$
DECLARE p pg_proc%ROWTYPE;
BEGIN
 SELECT * INTO p FROM pg_proc WHERE oid='public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint)'::regprocedure;
 IF p.proowner::text IS DISTINCT FROM current_setting('busy.mission16_original_wrapper_owner')
 OR p.proacl::text IS DISTINCT FROM current_setting('busy.mission16_original_wrapper_acl')
 OR p.prosecdef IS DISTINCT FROM true OR p.prolang IS DISTINCT FROM (SELECT oid FROM pg_language WHERE lanname='plpgsql')
 OR cardinality(p.proconfig) IS DISTINCT FROM 1
 OR regexp_replace(p.proconfig[1],'[[:space:]]','','g') IS DISTINCT FROM 'search_path=pg_catalog,pg_temp'
 THEN RAISE EXCEPTION 'Original wrapper ownership/ACL/security preservation failed'; END IF;
END $$;
COMMIT;
