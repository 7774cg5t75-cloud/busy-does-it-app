-- V3.203 READ-ONLY AFTER-PHASE attestation.
-- Target only independently checked isolated staging project:
-- pnjdlogwegnqbsfpcofw
-- This report NEVER grants permission to install or publish.
-- No business, customer or auth rows are returned.
with system_tables as (
 select c.relname,c.relrowsecurity,c.relforcerowsecurity
 from pg_catalog.pg_class c
 join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in ('r','p')
   and c.relname in (
    'busy_staging_rls_canary',
    'busy_businesses',
    'busy_business_memberships',
    'busy_public_business_profiles',
    'busy_mini_apps',
    'busy_mini_app_versions',
    'busy_mini_app_requests',
    'busy_mini_app_request_links',
    'busy_mini_app_request_events',
    'busy_mini_app_work_bookings',
    'busy_mini_app_request_messages',
    'busy_mini_app_message_delivery_outbox',
    'busy_staging_qa_runs'
   )
), functions_seen as (
 select p.proname,pg_catalog.pg_get_function_identity_arguments(p.oid) signature,
  p.prosecdef as security_definer,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
  has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
 from pg_catalog.pg_proc p
 join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public'
   and p.proname in (
    'busy_create_first_mini_app_draft_v3199',
    'busy_mark_mini_app_request_link_v3180',
    'busy_send_mini_app_message_v3185'
   )
), constraints_seen as (
 select k.conname,k.contype
 from pg_catalog.pg_constraint k
 join pg_catalog.pg_namespace n on n.oid=k.connamespace
 where n.nspname='public' and
  k.conname='busy_mini_apps_business_id_app_key_key'
)
select
 'v3203_staging_phase_read_only' as kind,
 (select coalesce(jsonb_agg(jsonb_build_object(
  'table',relname,'rlsEnabled',relrowsecurity,
  'rlsForced',relforcerowsecurity,
  'anonSelect',has_table_privilege('anon','public.'||relname,'SELECT'),
  'authenticatedSelect',has_table_privilege('authenticated','public.'||relname,'SELECT'))
 order by relname),'[]'::jsonb) from system_tables) as table_flags,
 (select coalesce(jsonb_agg(jsonb_build_object(
  'function',proname,'signature',signature,'securityDefiner',security_definer,
  'anonExecute',anon_execute,'authenticatedExecute',authenticated_execute,
  'serviceExecute',service_execute)
 order by proname),'[]'::jsonb) from functions_seen) as function_flags,
 (select count(*) from constraints_seen
  where contype='u') as unique_first_app_business_key_count,
 (select count(*) from public.busy_staging_rls_canary) as preserved_canary_row_count,
 (select count(*) from pg_catalog.pg_policies
  where schemaname='public' and tablename='busy_staging_rls_canary')
  as canary_policy_count,
 (select coalesce(jsonb_agg(e.extname order by e.extname),'[]'::jsonb)
  from pg_catalog.pg_extension e
  where e.extname in ('pgcrypto','pgmq','pg_cron','pg_net'))
  as relevant_extensions;
