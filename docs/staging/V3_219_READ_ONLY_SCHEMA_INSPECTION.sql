-- V3.219 repeatable READ-ONLY staging catalog inspection.
-- Run only in explicitly identified Busy Does It Staging project.
-- This file contains SELECT statements only. Never paste production keys.
-- Results describe table names / column names, not tenant/customer records.
-- Review migration history and actual database permissions separately.
select tablename as table_name
from pg_catalog.pg_tables
where schemaname='public' and tablename like 'busy_%'
order by tablename;

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public' and table_name in (
  'busy_business_memberships','busy_mini_apps',
  'busy_mini_app_versions','busy_mini_app_requests',
  'busy_mini_app_guest_challenges'
)
order by table_name, ordinal_position;

select p.proname as function_name,
 pg_catalog.pg_get_function_identity_arguments(p.oid) as parameter_types
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('busy_mini_app_create_guest_request')
order by p.proname;

select tablename, rowsecurity as rls_enabled
from pg_catalog.pg_tables
where schemaname='public'
  and tablename in ('busy_business_memberships','busy_mini_apps',
    'busy_mini_app_versions','busy_mini_app_requests',
    'busy_mini_app_guest_challenges')
order by tablename;

select tablename, policyname, permissive, roles, cmd
from pg_catalog.pg_policies
where schemaname='public' and tablename in (
  'busy_business_memberships','busy_mini_apps',
  'busy_mini_app_versions','busy_mini_app_requests',
  'busy_mini_app_guest_challenges')
order by tablename, policyname;

-- NOTICE: Metadata checks alone do NOT verify RLS isolation, transaction
-- idempotency, function EXECUTE grants, backup restore or live delivery.
