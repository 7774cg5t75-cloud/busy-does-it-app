-- V3.115: isolated user-directed website design feedback foundation.
-- No screenshots, private business content, IP, contact data or public feed.
create table if not exists public.busy_website_design_feedback (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 created_by uuid not null,
 request_key text not null check(length(request_key) between 20 and 128),
 design_family text not null check(design_family in
  ('conversion','minimal','editorial','organic','artisan','boutique','showcase','portfolio')),
 preference text not null check(preference in ('liked','rejected')),
 draft_version text not null check(length(draft_version) between 1 and 128),
 aggregate_consent boolean not null default false check(aggregate_consent=false),
 created_at timestamptz not null default now(),
 unique (business_id,request_key)
);
create index if not exists busy_design_feedback_scope_recent
 on public.busy_website_design_feedback(business_id,created_at desc);
alter table public.busy_website_design_feedback enable row level security;
revoke all on public.busy_website_design_feedback from public,anon,authenticated;
grant select,insert,delete on public.busy_website_design_feedback to service_role;
-- Server route requires fresh owner/admin membership; no direct client SQL.
-- Cross-business aggregation/training has no route and is NOT authorized.
