-- V3.220 READ ONLY: run ONLY against independently verified isolated
-- Busy Does It Staging Supabase project (expected ref pnjdlogwegnqbsfpcofw).
-- No customer payloads, user emails, secrets, row data, provider calls or DDL.
-- Results establish metadata only, not RLS/JWT or migration-readiness proof.
-- Project ref is NOT authenticated by SQL: check the connected project first.
select 'v3220_public_business_tables' as inventory,
       coalesce(jsonb_agg(c.relname order by c.relname),'[]'::jsonb) as items
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
  and c.relname like 'busy_%';

select c.relname as table_name,c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced,
       count(p.policyname)::integer as defined_policies
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
left join pg_catalog.pg_policies p
  on p.schemaname='public' and p.tablename=c.relname
where n.nspname='public' and c.relkind in ('r','p')
  and c.relname like 'busy_%'
group by c.relname,c.relrowsecurity,c.relforcerowsecurity
order by c.relname;

select e.extname as installed_extension,e.extversion as installed_version
from pg_catalog.pg_extension e
where e.extname in ('pgcrypto','pgmq','pg_cron','pg_net')
order by e.extname;

select a.name as available_extension,
       a.installed_version,a.default_version
from pg_catalog.pg_available_extensions a
where a.name in ('pgcrypto','pgmq','pg_cron','pg_net')
order by a.name;

select p.proname as function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'busy_mini_app_create_guest_request',
    'busy_mark_mini_app_request_link_v3180',
    'busy_create_first_mini_app_draft_v3199'
  )
order by p.proname;

-- Compare migration versions against the recorded canary-only versions.
-- This SELECT reads migration metadata, not customer information.
select version, name from supabase_migrations.schema_migrations
order by version;

-- Do NOT interpret this list as proof of policies that genuinely restrict
-- a tenant: two authenticated test accounts and real JWTs are still needed.
