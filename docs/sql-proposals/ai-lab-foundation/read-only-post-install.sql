-- READ ONLY post-installation verification, NOT to be run against an uninstalled schema.
-- Use only after separately approved install on sbvkrvksnruiclcvclbd.
-- Return catalogues and counts, never private record contents or provider credentials.
BEGIN READ ONLY;
SELECT jsonb_build_object(
 'observedAt',now(),'transactionReadOnly',current_setting('transaction_read_only'),
 'publicTableSetMatches',(SELECT array_agg(tablename::text ORDER BY tablename)=ARRAY['business_work_agreement_decisions','business_work_agreement_evidence','business_work_engagements','business_work_private_drafts','business_work_quote_recipient_bindings','business_work_quote_references','busy_business_content','busy_business_memberships','busy_business_snapshots','busy_businesses','busy_creator_draft_heads','busy_creator_draft_versions','busy_growth_opportunities','busy_growth_opportunity_versions','busy_mini_app_entry_daily','busy_mini_app_entry_events','busy_mini_app_message_delivery_outbox','busy_mini_app_module_catalog','busy_mini_app_request_links','busy_mini_app_request_messages','busy_mini_app_requests','busy_mini_app_versions','busy_mini_app_work_bookings','busy_mini_apps','busy_public_business_profiles','busy_push_deliveries','busy_website_deployments','busy_websites'] FROM pg_tables WHERE schemaname='public'),
 'publicTables',(SELECT jsonb_agg(jsonb_build_object('name',c.relname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'forceRls',c.relforcerowsecurity) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'),
 'privateTables',(SELECT jsonb_agg(jsonb_build_object('name',c.relname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'forceRls',c.relforcerowsecurity) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='busy_ai_private' AND c.relkind='r'),
 'publicFunctionGrants',(SELECT jsonb_agg(jsonb_build_object('name',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,'anon',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated',has_function_privilege('authenticated',p.oid,'EXECUTE'),'service',has_function_privilege('service_role',p.oid,'EXECUTE')) ORDER BY p.proname) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'busy\_%' ESCAPE '\'),
 'apiPrivateSchemaAccess',(SELECT jsonb_agg(jsonb_build_object('role',r,'access',has_schema_privilege(r,'busy_ai_private','USAGE,CREATE'))) FROM unnest(ARRAY['anon','authenticated','service_role'])r),
 'apiPrivateTableAccess',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN unnest(ARRAY['anon','authenticated','service_role'])r WHERE n.nspname='busy_ai_private' AND c.relkind='r' AND (has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') OR has_any_column_privilege(r,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))),
 'policyEnabled',(SELECT enabled FROM busy_ai_private.policy),
 'policyMonthlyLimit',(SELECT monthly_hard_limit FROM busy_ai_private.policy),
 'accounts',(SELECT count(*) FROM busy_ai_private.accounts),
 'periods',(SELECT count(*) FROM busy_ai_private.periods),
 'tariffs',(SELECT count(*) FROM busy_ai_private.tariffs),
 'operations',(SELECT count(*) FROM busy_ai_private.operations),
 'events',(SELECT count(*) FROM busy_ai_private.events),
 'authHasRows',EXISTS(SELECT 1 FROM auth.users),
 'nativeHook',(SELECT jsonb_build_object('owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text,'definitionSha256',encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex')) FROM pg_proc p WHERE p.oid=to_regprocedure('public.rls_auto_enable()')),
 'ensureRls',(SELECT jsonb_build_object('enabled',evtenabled::text,'owner',pg_get_userbyid(evtowner),'function',evtfoid::regprocedure::text,'tags',evttags) FROM pg_event_trigger WHERE evtname='ensure_rls'),
 'postgresDefaults',(SELECT jsonb_agg(jsonb_build_object('schema',CASE WHEN d.defaclnamespace=0 THEN 'GLOBAL' ELSE n.nspname END,'kind',d.defaclobjtype::text,'acl',d.defaclacl::text) ORDER BY d.defaclnamespace,d.defaclobjtype) FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE d.defaclrole='postgres'::regrole AND (d.defaclnamespace=0 OR n.nspname='public'))
) AS verification;
COMMIT;
