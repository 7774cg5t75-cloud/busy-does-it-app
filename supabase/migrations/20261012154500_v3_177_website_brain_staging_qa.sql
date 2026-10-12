-- V3.177: private website owner choices and isolated synthetic QA.
-- NEVER deploy this migration directly to production before review.
create table if not exists public.busy_website_brain_decisions (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 website_id uuid not null,
 deployment_id uuid not null,
 owner_user_id uuid not null,
 draft_id text not null check (length(draft_id) between 1 and 120),
 website_generation bigint not null check (website_generation > 0),
 goal text not null check (goal in ('book','enquire','services','photos','offers','rewards')),
 surface text not null check (surface = 'website'),
 action_id text not null check (action_id in (
  'fix_approved_facts','verify_customer_path','review_navigation_layout',
  'clarify_service_descriptions','check_surface_consistency',
  'review_business_content','inspect_real_widths')),
 decision text not null check (decision in ('approved','rejected','postponed')),
 request_key text not null check (length(request_key) between 8 and 160),
 created_at timestamptz not null default now(),
 unique (business_id,owner_user_id,request_key)
);
create index if not exists busy_website_brain_owner_recent
 on public.busy_website_brain_decisions
 (business_id,owner_user_id,deployment_id,created_at desc,id desc);
alter table public.busy_website_brain_decisions enable row level security;
revoke all on public.busy_website_brain_decisions from public,anon,authenticated;
grant select,insert,delete on public.busy_website_brain_decisions to service_role;
-- Do not add anon/authenticated policies. Website publisher Edge authenticates
-- and checks owner/admin membership, server-sourced deployment and revision.

-- Synthetic isolated-staging-only QA: no real customers or bookings.
-- Deploy table to an isolated staging database ONLY.
create table if not exists public.busy_staging_qa_runs (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 owner_user_id uuid not null,
 app_id uuid not null,
 draft_revision bigint not null check (draft_revision > 0),
 request_key text not null check (length(request_key) between 8 and 160),
 journey_kind text not null check (journey_kind in ('booking_request','enquiry')),
 channel text not null check (channel in ('busy_marketplace','standalone','guest_web')),
 synthetic_state text not null default 'recorded' check (synthetic_state = 'recorded'),
 created_at timestamptz not null default now(),
 unique (business_id,owner_user_id,request_key)
);
create index if not exists busy_staging_qa_owner_recent
 on public.busy_staging_qa_runs
 (business_id,owner_user_id,app_id,created_at desc,id desc);
alter table public.busy_staging_qa_runs enable row level security;
revoke all on public.busy_staging_qa_runs from public,anon,authenticated;
grant select,insert,delete on public.busy_staging_qa_runs to service_role;
-- No grants to native callers. All writes behind server-authorised staging guard.
