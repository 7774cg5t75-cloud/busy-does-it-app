-- V3.223: read-only metadata for an independently identified
-- Busy Does It Staging project. Does not verify project ref by itself.
-- NEVER run as installation SQL. No private rows, tokens or user data.
-- Empty results before the business baseline exists are expected.
--
-- Exact current columns, nullability and default expressions for the
-- two candidate staging-only business core tables.
select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns
where table_schema='public'
 and table_name in ('busy_businesses','busy_business_memberships')
order by table_name,ordinal_position;

-- Current owner membership and business RLS indicators, including FORCE.
-- These flags are NOT a substitute for actual two-tenant JWT security tests.
select c.relname as table_name,c.relrowsecurity as rls_enabled,
 c.relforcerowsecurity as rls_forced
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
  and c.relname in ('busy_businesses','busy_business_memberships')
order by c.relname;

-- List policy metadata, not any personal/business rows.
select tablename,policyname,permissive,roles,cmd
from pg_catalog.pg_policies
where schemaname='public'
 and tablename in ('busy_businesses','busy_business_memberships')
order by tablename,policyname;

-- Bound function signatures and SECURITY DEFINER indicators only.
-- Inspect and separately test their EXECUTE privileges before deployment.
select p.proname as function_name,p.prosecdef as security_definer,
 pg_catalog.pg_get_function_identity_arguments(p.oid) as argument_types
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname like 'busy_%'
order by p.proname;

-- Staging canary and migration-history metadata, not customer data.
select c.relname as table_name
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
  and c.relname like 'busy_%'
order by c.relname;

select version,name
from supabase_migrations.schema_migrations
order by version;

-- DO NOT assume matching names/columns means production schema parity:
-- V3.25 production bridge is an historical SOURCE REFERENCE only.
-- Compare authentic schemas via an approved schema-only process and never
-- copy production customers, account tokens or provider credentials.
