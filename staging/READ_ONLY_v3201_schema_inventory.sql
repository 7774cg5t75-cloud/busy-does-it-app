-- V3.201 — READ ONLY. Run ONLY after independently confirming the
-- current Supabase project is the isolated Busy Does It STAGING project:
-- pnjdlogwegnqbsfpcofw
-- This SQL does not check project URL, perform authentication, inspect
-- customer rows, confer installation permission or verify customer journeys.
-- Obtain migration names separately with Supabase's list_migrations.
with tables_seen as (
 select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb) v
 from pg_catalog.pg_class c
 join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in ('r','p')
), extensions_seen as (
 select coalesce(jsonb_agg(extname order by extname),'[]'::jsonb) v
 from pg_catalog.pg_extension
 where extname in ('pgcrypto','pgmq','pg_cron','pg_net')
), functions_seen as (
 select coalesce(jsonb_agg(p.proname order by p.proname),'[]'::jsonb) v
 from pg_catalog.pg_proc p
 join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public'
   and p.proname in ('busy_create_first_mini_app_draft_v3199',
      'busy_mark_mini_app_request_link_v3180')
), unique_seen as (
 select coalesce(jsonb_agg(k.conname order by k.conname),'[]'::jsonb) v
 from pg_catalog.pg_constraint k
 join pg_catalog.pg_namespace n on n.oid=k.connamespace
 where n.nspname='public' and k.contype='u'
   and k.conname='busy_mini_apps_business_id_app_key_key'
), rls_seen as (
 select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,
   'enabled',c.relrowsecurity) order by c.relname),'[]'::jsonb) v
 from pg_catalog.pg_class c
 join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relname in
   ('busy_mini_apps','busy_mini_app_requests','busy_business_memberships')
)
select 'v3201_schema_inventory_read_only' as inventory_kind,
 t.v as public_tables,e.v as extensions,f.v as functions,
 u.v as unique_constraints,r.v as rls_configuration
from tables_seen t cross join extensions_seen e
 cross join functions_seen f cross join unique_seen u
 cross join rls_seen r;
