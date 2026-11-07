-- READ ONLY: only AI Lab sbvkrvksnruiclcvclbd, after independent control-plane identity verification.
-- Metadata/counts only. No password, token, credential, profile body or customer records.
BEGIN READ ONLY;
WITH expected(signature,body_sha) AS (VALUES
 ('public.busy_connected_builder_read_v1(uuid)','538e9d3f088f54f8385ca1c13f34fe75d61eb3c5e54d4ca51ae6f8092285881d'),
 ('public.busy_connected_profile_write_v1(uuid,bigint,jsonb,jsonb,boolean)','33b6b3320a73a59d3ca8747f2d6cd7e2eecfe51b1ac039a2e17191787bccf7a4'),
 ('busy_snapshot_private.website_commit_original(uuid,uuid,bigint,jsonb,jsonb,bigint)','6fcc34afbf762a18279d7582a02550071724ae085bb60d7b77fadcdc9c9d7cc8'),
 ('public.busy_connected_website_transition_v1(uuid,uuid,bigint,jsonb,jsonb,bigint,text)','7c4d0ebade250c5f9cb049898675a9e256fdce695405a42f8266fe026c88530c'),
 ('public.busy_connected_website_history_v1(uuid,bigint,text,text)','ad737c9f8b4c81e65661be067b57df84144ec9ebbaae7de233f2e47029f5981a')
)
SELECT jsonb_build_object(
 'observedAt',now(),'transactionReadOnly',current_setting('transaction_read_only'),'postgresVersion',current_setting('server_version'),
 'publicTableCount',(SELECT count(*) FROM pg_tables WHERE schemaname='public'),
 'privateAiTableCount',(SELECT count(*) FROM pg_tables WHERE schemaname='busy_ai_private'),
 'authUserCount',(SELECT count(*) FROM auth.users),'businessCount',(SELECT count(*) FROM public.busy_businesses),
 'ownerMembershipCount',(SELECT count(*) FROM public.busy_business_memberships WHERE role='owner'),
 'otherMembershipCount',(SELECT count(*) FROM public.busy_business_memberships WHERE role<>'owner'),
 'snapshotCount',(SELECT count(*) FROM public.busy_business_snapshots),'profileCount',(SELECT count(*) FROM public.busy_public_business_profiles),
 'policy',(SELECT jsonb_build_object('enabled',enabled,'monthlyHardLimit',monthly_hard_limit) FROM busy_ai_private.policy),
 'aiCounts',jsonb_build_object('accounts',(SELECT count(*) FROM busy_ai_private.accounts),'periods',(SELECT count(*) FROM busy_ai_private.periods),'tariffs',(SELECT count(*) FROM busy_ai_private.tariffs),'operations',(SELECT count(*) FROM busy_ai_private.operations),'events',(SELECT count(*) FROM busy_ai_private.events)),
 'originalFunctions',(SELECT jsonb_agg(jsonb_build_object('signature',e.signature,'exists',p.oid IS NOT NULL,'owner',pg_get_userbyid(p.proowner),'securityDefiner',p.prosecdef,'config',p.proconfig,'bodySha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),'bodyMatches',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')=e.body_sha,'acl',p.proacl::text,'anonExec',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticatedExec',has_function_privilege('authenticated',p.oid,'EXECUTE'),'serviceExec',has_function_privilege('service_role',p.oid,'EXECUTE')) ORDER BY e.signature) FROM expected e LEFT JOIN pg_proc p ON p.oid=to_regprocedure(e.signature)),
 'sourceProjection',(SELECT jsonb_build_object('signature',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'securityDefiner',p.prosecdef,'config',p.proconfig,'bodySha256',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex'),'bodyMatches',encode(sha256(convert_to(p.prosrc,'UTF8')),'hex')='8740beb8e8c8fa858735ab50a3ab6081c56cc8481a996899ecc2058fd11455b9','acl',p.proacl::text,'anonExec',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticatedExec',has_function_privilege('authenticated',p.oid,'EXECUTE'),'serviceExec',has_function_privilege('service_role',p.oid,'EXECUTE')) FROM pg_proc p WHERE p.oid=to_regprocedure('public.busy_connected_builder_source_state_v1(uuid)')),
 'nativeReceipts',(SELECT jsonb_agg(jsonb_build_object('version',version,'name',name,'statementCount',coalesce(cardinality(statements),0),'executionSha256',CASE WHEN cardinality(statements)=1 THEN encode(sha256(convert_to(statements[1],'UTF8')),'hex') ELSE NULL END) ORDER BY version) FROM supabase_migrations.schema_migrations WHERE name IN ('mission18_ai_lab_foundation','ai_lab_quiet_light_owner_setup_v1','ai_lab_b3_nonretry_source_contract_v1'))
) AS verification;
COMMIT;
