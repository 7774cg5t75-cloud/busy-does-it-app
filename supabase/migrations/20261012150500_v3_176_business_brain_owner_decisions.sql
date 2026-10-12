-- V3.176: per-owner Business Brain action decisions. Migration only:
-- DO NOT apply to production until RLS and staging checks are reviewed.
-- Edge service_role is the sole data-access path after authenticated
-- busy-mini-apps membership and exact app/revision checks.
create table if not exists public.busy_brain_owner_decisions (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 app_id uuid not null,
 owner_user_id uuid not null,
 app_revision bigint not null check (app_revision > 0),
 website_revision bigint not null default 0 check (website_revision = 0),
 goal text not null check (goal in
  ('book','enquire','services','photos','offers','rewards')),
 surface text not null check (surface = 'app'),
 action_id text not null check (action_id in
  ('fix_approved_facts','verify_customer_path','review_navigation_layout',
   'clarify_service_descriptions','check_surface_consistency',
   'review_business_content','inspect_real_widths')),
 decision text not null check (decision in ('approved','rejected','postponed')),
 request_key text not null check (length(request_key) between 8 and 160),
 created_at timestamptz not null default now(),
 unique (business_id,owner_user_id,request_key)
);
create index if not exists busy_brain_decisions_owner_history
 on public.busy_brain_owner_decisions
 (business_id,owner_user_id,app_id,app_revision,created_at desc,id desc);
alter table public.busy_brain_owner_decisions enable row level security;
revoke all on public.busy_brain_owner_decisions
 from public,anon,authenticated;
grant select,insert,delete on public.busy_brain_owner_decisions
 to service_role;
-- Deliberately NO anon/authenticated policies. Only authenticated
-- busy-mini-apps Edge route can access via service_role after explicit
-- owner/admin membership and current private app revision verification.
-- There is no service-role key anywhere in the mobile client.
