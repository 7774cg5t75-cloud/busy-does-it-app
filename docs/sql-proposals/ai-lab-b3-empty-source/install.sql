-- REVIEW ONLY: Busy Does It AI Lab sbvkrvksnruiclcvclbd / wrjfgasxtlznzfzmfrif / eu-west-1 / Free / PostgreSQL17.
-- Original installed foundation bytes remain unchanged. This is a separately approved additive compatibility migration.
-- Managed migration runner owns the complete transaction and native history. Do not embed BEGIN/COMMIT or split statements.
-- Control-plane target identity must be independently verified; current_database() is not a project-identity check.
DO $$ BEGIN RAISE EXCEPTION 'AI LAB B3 SOURCE CONTRACT REVIEW FUSE: separate exact migration approval required'; END $$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
DO $preflight$
DECLARE item record; p pg_catalog.pg_proc%ROWTYPE; old_body text; new_body text; ddl text;
BEGIN
 IF current_user<>'postgres' OR current_setting('server_version_num')::int NOT BETWEEN 170000 AND 179999 THEN RAISE EXCEPTION 'Reviewed postgres installer and PostgreSQL17 required'; END IF;
 IF to_regclass('supabase_migrations.schema_migrations') IS NULL
 OR NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261106221950' AND name='mission18_ai_lab_foundation')
 OR NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261107000304' AND name='ai_lab_quiet_light_owner_setup_v1') THEN RAISE EXCEPTION 'Reviewed foundation and fictional-owner native receipts required'; END IF;
 IF (SELECT count(*) FROM pg_tables WHERE schemaname='public')<>28 OR (SELECT count(*) FROM pg_tables WHERE schemaname='busy_ai_private')<>6 THEN RAISE EXCEPTION 'Canonical foundation table set changed'; END IF;
 IF (SELECT count(*) FROM auth.users)<>1 OR (SELECT count(*) FROM public.busy_businesses)<>1 OR (SELECT count(*) FROM public.busy_business_memberships)<>1
 OR EXISTS(SELECT 1 FROM public.busy_business_snapshots) OR EXISTS(SELECT 1 FROM public.busy_public_business_profiles) THEN RAISE EXCEPTION 'Reviewed single-owner empty source state required'; END IF;
 IF (SELECT count(*) FROM busy_ai_private.policy)<>1 OR EXISTS(SELECT 1 FROM busy_ai_private.policy WHERE enabled OR monthly_hard_limit<>0)
 OR EXISTS(SELECT 1 FROM busy_ai_private.accounts) OR EXISTS(SELECT 1 FROM busy_ai_private.periods) OR EXISTS(SELECT 1 FROM busy_ai_private.tariffs)
 OR EXISTS(SELECT 1 FROM busy_ai_private.operations) OR EXISTS(SELECT 1 FROM busy_ai_private.events) THEN RAISE EXCEPTION 'AI policy must remain disabled/zero and ledger empty'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc q JOIN pg_namespace n ON n.oid=q.pronamespace WHERE n.nspname='public' AND q.proname='busy_connected_builder_source_state_v1') THEN RAISE EXCEPTION 'Source contract already exists or partial installation requires review'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc q WHERE q.oid=to_regprocedure('busy_snapshot_private.lock_writer(uuid)') AND q.proowner='postgres'::regrole AND q.prosecdef AND NOT has_function_privilege('anon',q.oid,'EXECUTE') AND NOT has_function_privilege('authenticated',q.oid,'EXECUTE') AND NOT has_function_privilege('service_role',q.oid,'EXECUTE')) THEN RAISE EXCEPTION 'Original private owner authority changed'; END IF;
 -- Guard exact original bodies before replacing only the deliberately raised error codes.
 FOR item IN SELECT * FROM (VALUES
 ('public.busy_connected_builder_read_v1(uuid)','982d44f7c0b010f5630d6401fd5e2cc75fe9309ecc78ee838632fb920868e01b','538e9d3f088f54f8385ca1c13f34fe75d61eb3c5e54d4ca51ae6f8092285881d',1,'P0002'),
 ('public.busy_connected_profile_write_v1(uuid,bigint,jsonb,jsonb,boolean)','9277f526b0831b4a1e18d5a5c97316c9178504007df59eda26bb992efee9be7e','33b6b3320a73a59d3ca8747f2d6cd7e2eecfe51b1ac039a2e17191787bccf7a4',2,'PT409'),
 ('busy_snapshot_private.website_commit_original(uuid,uuid,bigint,jsonb,jsonb,bigint)','997063595e72c09a7d931d03123eee84283b4a154ff239852e9ffc21059f8a46','6fcc34afbf762a18279d7582a02550071724ae085bb60d7b77fadcdc9c9d7cc8',2,'PT409'),
 ('public.busy_connected_website_transition_v1(uuid,uuid,bigint,jsonb,jsonb,bigint,text)','51ee8001e59d10104e0baef91c052d744d3d50fc74cd57ef868119992d9b34a7','7c4d0ebade250c5f9cb049898675a9e256fdce695405a42f8266fe026c88530c',3,'PT409'),
 ('public.busy_connected_website_history_v1(uuid,bigint,text,text)','12fb5a25d40ee5493b0fa25175b3c2688c24f745e85d98f0d5065dee200a2127','ad737c9f8b4c81e65661be067b57df84144ec9ebbaae7de233f2e47029f5981a',1,'PT409')
 ) AS expected(signature,old_sha,new_sha,branch_count,error_code) LOOP
  SELECT * INTO p FROM pg_proc WHERE oid=to_regprocedure(item.signature);
  IF NOT FOUND OR p.proowner<>'postgres'::regrole OR NOT p.prosecdef OR p.prolang<>(SELECT oid FROM pg_language WHERE lanname='plpgsql')
   OR p.prorettype<>'jsonb'::regtype OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, pg_temp']
   OR encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') IS DISTINCT FROM item.old_sha THEN RAISE EXCEPTION 'Original source function definition drift: %',item.signature; END IF;
  IF has_function_privilege('anon',p.oid,'EXECUTE') OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') THEN RAISE EXCEPTION 'Original function public exposure drift: %',item.signature; END IF;
  IF item.signature LIKE 'busy_snapshot_private.%' THEN
   IF has_function_privilege('authenticated',p.oid,'EXECUTE') OR has_function_privilege('service_role',p.oid,'EXECUTE') THEN RAISE EXCEPTION 'Private original writer exposure changed'; END IF;
  ELSIF item.signature LIKE 'public.busy_connected_website_transition_v1(%' THEN
   IF has_function_privilege('authenticated',p.oid,'EXECUTE') OR NOT has_function_privilege('service_role',p.oid,'EXECUTE') THEN RAISE EXCEPTION 'Original service-only transition authority changed'; END IF;
  ELSE
   IF NOT has_function_privilege('authenticated',p.oid,'EXECUTE') OR has_function_privilege('service_role',p.oid,'EXECUTE') THEN RAISE EXCEPTION 'Original authenticated reader/profile/history authority changed'; END IF;
  END IF;
  old_body:=p.prosrc;
  IF (length(old_body)-length(replace(old_body,'ERRCODE=''40001''','')))/length('ERRCODE=''40001''')<>item.branch_count THEN RAISE EXCEPTION 'Original conflict branch count changed'; END IF;
  new_body:=replace(old_body,'ERRCODE=''40001''','ERRCODE='''||item.error_code||'''');
  IF encode(sha256(convert_to(new_body,'UTF8')),'hex') IS DISTINCT FROM item.new_sha THEN RAISE EXCEPTION 'Reviewed replacement body mismatch'; END IF;
  ddl:=pg_get_functiondef(p.oid);
  IF position(old_body IN ddl)=0 THEN RAISE EXCEPTION 'Original definition extraction unavailable'; END IF;
  -- CREATE OR REPLACE retains the original signature, owner and ACL.
  EXECUTE replace(ddl,old_body,new_body);
  IF (SELECT encode(sha256(convert_to(prosrc,'UTF8')),'hex') FROM pg_proc WHERE oid=p.oid) IS DISTINCT FROM item.new_sha THEN RAISE EXCEPTION 'Independent replacement readback failed'; END IF;
 END LOOP;
END $preflight$;

CREATE FUNCTION public.busy_connected_builder_source_state_v1(p_business_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp SET lock_timeout='2s' AS $source_state$
DECLARE actor uuid; has_snapshot boolean; has_profile boolean;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 -- One statement observes both original authorities under the same MVCC snapshot.
 -- Disabled profiles still make this an existing source; no owner content is discarded.
 SELECT EXISTS(SELECT 1 FROM public.busy_business_snapshots WHERE business_id=p_business_id),
        EXISTS(SELECT 1 FROM public.busy_public_business_profiles WHERE business_id=p_business_id)
 INTO has_snapshot,has_profile;
 RETURN jsonb_build_object('version','busy.connected-builder-source-state.v1','actorId',actor,'businessId',p_business_id,
  'snapshotExists',has_snapshot,'profileExists',has_profile,'empty',NOT has_snapshot AND NOT has_profile);
EXCEPTION WHEN serialization_failure OR deadlock_detected THEN
 -- An actual retryable engine failure is fatal here, never evidence of absence.
 -- PT503 ends PostgREST's transaction retry path without leaking SQLERRM or records.
 RAISE EXCEPTION 'Source state transaction unavailable' USING ERRCODE='PT503';
END $source_state$;
ALTER FUNCTION public.busy_connected_builder_source_state_v1(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.busy_connected_builder_source_state_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.busy_connected_builder_source_state_v1(uuid) TO authenticated;
COMMENT ON FUNCTION public.busy_connected_builder_source_state_v1(uuid) IS 'Original-authority source-presence projection v1; current native owner only; no business-content or mutation authority.';
DO $verify$
DECLARE p pg_proc%ROWTYPE;
BEGIN
 SELECT * INTO p FROM pg_proc WHERE oid=to_regprocedure('public.busy_connected_builder_source_state_v1(uuid)');
 IF NOT FOUND OR p.proowner<>'postgres'::regrole OR NOT p.prosecdef OR p.prorettype<>'jsonb'::regtype
 OR p.proconfig IS DISTINCT FROM ARRAY['search_path=pg_catalog, pg_temp','lock_timeout=2s']
 OR encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') IS DISTINCT FROM '8740beb8e8c8fa858735ab50a3ab6081c56cc8481a996899ecc2058fd11455b9'
 OR NOT has_function_privilege('authenticated',p.oid,'EXECUTE') OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('service_role',p.oid,'EXECUTE')
 OR EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') THEN RAISE EXCEPTION 'Source projection independent verification failed'; END IF;
END $verify$;
NOTIFY pgrst,'reload schema';
