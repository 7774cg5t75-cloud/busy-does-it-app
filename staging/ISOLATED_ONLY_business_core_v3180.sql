-- V3.180: isolated staging-only missing business core baseline.
-- NOT an authoritative production schema export. Do not run in production.
-- Apply after checking the exact project identity and approvals in the runbook.
-- Uses Supabase's existing auth.users and service_role (CI mocks these).
create extension if not exists pgcrypto;

create table if not exists public.busy_businesses (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(btrim(name)) between 1 and 160),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.busy_business_memberships (
 business_id uuid not null references public.busy_businesses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','admin','staff','viewer')),
 created_at timestamptz not null default now(),
 primary key(business_id,user_id)
);
create index if not exists busy_business_memberships_user_role_idx
 on public.busy_business_memberships(user_id,role,business_id);

alter table public.busy_businesses enable row level security;
alter table public.busy_businesses force row level security;
alter table public.busy_business_memberships enable row level security;
alter table public.busy_business_memberships force row level security;
revoke all on table public.busy_businesses from public,anon,authenticated;
revoke all on table public.busy_business_memberships from public,anon,authenticated;
grant select,insert,update,delete on table public.busy_businesses to service_role;
grant select,insert,update,delete on table public.busy_business_memberships to service_role;

comment on table public.busy_businesses is
 'V3.180 isolated staging compatibility baseline; do not interpret as a captured production schema.';
comment on table public.busy_business_memberships is
 'V3.180 isolated staging member contract. Membership removal revokes access; writes use authenticated Edge owner/admin checks.';
