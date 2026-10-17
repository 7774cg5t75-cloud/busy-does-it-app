-- CI compatibility fixture ONLY. The repository has no authoritative initial
-- business-core/internal-config migration. Do not deploy this as a baseline.
-- Existing ISOLATED_ONLY_business_core_v3180.sql is applied before this file.
create table public.busy_internal_config (key text primary key, value text not null);
alter table public.busy_internal_config enable row level security;
revoke all on public.busy_internal_config from public,anon,authenticated;
grant all on public.busy_internal_config to service_role;
