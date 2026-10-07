-- V3.43 scalability hardening: replace per-open rows with bounded daily counters.

drop function if exists public.busy_mini_app_entry_summary(uuid, uuid, timestamptz);
drop table if exists public.busy_mini_app_entry_events;

create table if not exists public.busy_mini_app_entry_daily (
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  event_date date not null default current_date,
  source text not null
    check (source in ('qr','share','deep_link','marketplace','my_apps','notification','owner_test','unknown')),
  stage text not null
    check (stage in ('landing','app_open')),
  event_count bigint not null default 0 check (event_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (mini_app_id, event_date, source, stage)
);

create index if not exists busy_mini_app_entry_daily_business_date_idx
  on public.busy_mini_app_entry_daily (business_id, event_date desc);

alter table public.busy_mini_app_entry_daily enable row level security;
revoke all on public.busy_mini_app_entry_daily from anon, authenticated;
grant select, insert, update, delete on public.busy_mini_app_entry_daily to service_role;

create policy busy_mini_app_entry_daily_no_direct_client_access
  on public.busy_mini_app_entry_daily
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.busy_mini_app_record_entry(
  p_business_id uuid,
  p_mini_app_id uuid,
  p_source text,
  p_stage text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source not in ('qr','share','deep_link','marketplace','my_apps','notification','owner_test','unknown') then
    raise exception 'Unsupported Mini App entry source';
  end if;
  if p_stage not in ('landing','app_open') then
    raise exception 'Unsupported Mini App entry stage';
  end if;

  insert into public.busy_mini_app_entry_daily (
    business_id,
    mini_app_id,
    event_date,
    source,
    stage,
    event_count,
    updated_at
  )
  values (
    p_business_id,
    p_mini_app_id,
    current_date,
    p_source,
    p_stage,
    1,
    now()
  )
  on conflict (mini_app_id, event_date, source, stage)
  do update
    set event_count = public.busy_mini_app_entry_daily.event_count + 1,
        updated_at = now();
end;
$$;

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
    sum(e.event_count)::bigint as event_count
  from public.busy_mini_app_entry_daily e
  where e.business_id = p_business_id
    and e.mini_app_id = p_mini_app_id
    and e.event_date >= (p_since at time zone 'UTC')::date
  group by e.source, e.stage
  order by e.stage, e.source;
$$;

revoke all on function public.busy_mini_app_record_entry(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.busy_mini_app_record_entry(uuid, uuid, text, text)
  to service_role;

revoke all on function public.busy_mini_app_entry_summary(uuid, uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.busy_mini_app_entry_summary(uuid, uuid, timestamptz)
  to service_role;

comment on table public.busy_mini_app_entry_daily is
  'Bounded daily Mini App entry counters. V3.43 does not persist per-visitor QR/share browsing records.';
