-- V3.43 Direct Customer Entry: share links, QR/deep-link attribution and scalable entry summaries.

create table if not exists public.busy_mini_app_entry_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  consumer_user_id uuid references auth.users(id) on delete set null,
  source text not null default 'unknown'
    check (source in ('qr','share','deep_link','marketplace','my_apps','notification','owner_test','unknown')),
  stage text not null default 'app_open'
    check (stage in ('landing','app_open')),
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists busy_mini_app_entry_events_business_created_idx
  on public.busy_mini_app_entry_events (business_id, created_at desc);

create index if not exists busy_mini_app_entry_events_app_created_idx
  on public.busy_mini_app_entry_events (mini_app_id, created_at desc);

create index if not exists busy_mini_app_entry_events_consumer_created_idx
  on public.busy_mini_app_entry_events (consumer_user_id, created_at desc)
  where consumer_user_id is not null;

alter table public.busy_mini_app_entry_events enable row level security;
revoke all on public.busy_mini_app_entry_events from anon, authenticated;
grant select, insert, update, delete on public.busy_mini_app_entry_events to service_role;

create or replace function public.busy_mini_app_entry_summary(
  p_business_id uuid,
  p_mini_app_id uuid,
  p_since timestamptz
)
returns table (
  source text,
  stage text,
  event_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    e.source,
    e.stage,
    count(*)::bigint as event_count
  from public.busy_mini_app_entry_events e
  where e.business_id = p_business_id
    and e.mini_app_id = p_mini_app_id
    and e.created_at >= p_since
  group by e.source, e.stage
  order by e.stage, e.source;
$$;

revoke all on function public.busy_mini_app_entry_summary(uuid, uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.busy_mini_app_entry_summary(uuid, uuid, timestamptz)
  to service_role;

comment on table public.busy_mini_app_entry_events is
  'Server-recorded V3.43 entry attribution for live Mini Apps. Search listing, direct links and QR/share landings remain separate concepts.';
