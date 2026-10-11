-- V3.166 — strictly private owner feedback on bounded app design choices.
-- Not AI retraining or cross-tenant analytics. Deployed only after migration.
create table if not exists public.busy_app_design_feedback (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 app_id uuid not null,
 owner_user_id uuid not null,
 draft_revision bigint not null check (draft_revision > 0),
 feedback_context text not null
  check (feedback_context in ('preview','saved_revision')),
 verdict text not null
  check (verdict in ('better','worse','not_quite_right')),
 field text not null
  check (field in ('headerStyle','layoutDensity','navigationStyle',
                   'imageScale','galleryLayout','imageCorners')),
 value text not null check (length(value) between 2 and 40),
 evidence_source text not null
  check (evidence_source in ('measured','ai','responsive','manual')),
 baseline_warnings integer
  check (baseline_warnings is null or baseline_warnings between 0 and 64),
 proposed_warnings integer
  check (proposed_warnings is null or proposed_warnings between 0 and 64),
 request_key text not null check (length(request_key) between 8 and 160),
 created_at timestamptz not null default now(),
 unique (business_id,request_key)
);
create index if not exists busy_app_design_feedback_history_idx
 on public.busy_app_design_feedback(business_id,app_id,created_at desc,id desc);
alter table public.busy_app_design_feedback enable row level security;
revoke all on public.busy_app_design_feedback from public,anon,authenticated;
grant select,insert,delete on public.busy_app_design_feedback to service_role;
-- No public RLS policies. Edge checks business membership and app/revision.
