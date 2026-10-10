-- V3.130 read-only security attestation.
-- Run exclusively against the independently created staging project.
-- This query reveals only safety flags/counts, never user emails or tokens.
with canary as (
  select c.oid,c.relrowsecurity,c.relforcerowsecurity
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='busy_staging_rls_canary'
    and c.relkind='r'
),policies as (
  select count(*)::integer as policy_count,
    count(*) filter(where cmd='SELECT' and 'authenticated'=any(roles)
      and qual like '%auth.uid()%' and qual like '%owner_id%')::integer
        as valid_read_policy_count,
    count(*) filter(where cmd<>'SELECT')::integer as write_policy_count
  from pg_policies where schemaname='public'
    and tablename='busy_staging_rls_canary'
)
select
  exists(select 1 from canary where relrowsecurity and relforcerowsecurity)
    as row_level_security_enforced,
  not has_table_privilege('anon','public.busy_staging_rls_canary','SELECT')
    as anonymous_select_denied,
  has_table_privilege('authenticated','public.busy_staging_rls_canary','SELECT')
    as authenticated_select_granted,
  not has_table_privilege('authenticated','public.busy_staging_rls_canary',
    'INSERT,UPDATE,DELETE') as authenticated_writes_denied,
  (select policy_count=1 and valid_read_policy_count=1
     and write_policy_count=0 from policies) as exact_owner_only_read_policy,
  not has_function_privilege('anon','public.rls_auto_enable()','EXECUTE')
    as anon_cannot_execute_rls_helper,
  not has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE')
    as authenticated_cannot_execute_rls_helper,
  exists(select 1 from pg_event_trigger
    where evtfoid='public.rls_auto_enable()'::regprocedure
      and evtenabled<>'D') as automatic_rls_trigger_preserved,
  (select count(*)::integer from auth.users) as real_auth_accounts_total,
  (select count(*)::integer from public.busy_staging_rls_canary)
    as fictional_owner_test_rows_total;
