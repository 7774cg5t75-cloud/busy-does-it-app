alter table public.busy_websites
  add column if not exists delivery_provider text not null default 'unconfigured',
  add column if not exists delivery_status text not null default 'not_configured',
  add column if not exists default_hostname text,
  add column if not exists default_url text,
  add column if not exists provider_last_sync_at timestamptz,
  add column if not exists analytics_last_sync_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'busy_websites_delivery_status_check') then
    alter table public.busy_websites
      add constraint busy_websites_delivery_status_check
      check (delivery_status in ('not_configured','reserved','provisioning','active','degraded','error','disabled'));
  end if;
end
$$;

alter table public.busy_website_domains
  add column if not exists provider_created_at timestamptz,
  add column if not exists last_analytics_at timestamptz;

alter table public.busy_website_analytics_daily
  add column if not exists requests bigint not null default 0,
  add column if not exists visits bigint not null default 0,
  add column if not exists edge_bytes bigint not null default 0,
  add column if not exists sample_interval numeric,
  add column if not exists provider_meta jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'busy_website_analytics_daily_requests_check') then
    alter table public.busy_website_analytics_daily
      add constraint busy_website_analytics_daily_requests_check check (requests >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'busy_website_analytics_daily_visits_check') then
    alter table public.busy_website_analytics_daily
      add constraint busy_website_analytics_daily_visits_check check (visits >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'busy_website_analytics_daily_edge_bytes_check') then
    alter table public.busy_website_analytics_daily
      add constraint busy_website_analytics_daily_edge_bytes_check check (edge_bytes >= 0);
  end if;
end
$$;

create table if not exists public.busy_website_usage_daily (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  website_id uuid not null references public.busy_websites(id) on delete cascade,
  usage_date date not null,
  deployments_created integer not null default 0 check (deployments_created >= 0),
  versions_published integer not null default 0 check (versions_published >= 0),
  artifact_bytes bigint not null default 0 check (artifact_bytes >= 0),
  requests bigint not null default 0 check (requests >= 0),
  visits bigint not null default 0 check (visits >= 0),
  edge_bytes bigint not null default 0 check (edge_bytes >= 0),
  health_checks integer not null default 0 check (health_checks >= 0),
  active_custom_domains integer not null default 0 check (active_custom_domains >= 0),
  source text not null default 'busy_rollup',
  updated_at timestamptz not null default now(),
  unique (website_id, usage_date, source)
);

create table if not exists public.busy_website_signal_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.busy_businesses(id) on delete cascade,
  website_id uuid references public.busy_websites(id) on delete cascade,
  provider text not null,
  signal_type text not null check (signal_type in ('domain_sync','analytics_sync','usage_rollup')),
  status text not null check (status in ('started','succeeded','skipped','failed')),
  rows_written integer not null default 0 check (rows_written >= 0),
  detail jsonb not null default '{}'::jsonb,
  last_error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.busy_website_enquiry_attributions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  website_id uuid not null references public.busy_websites(id) on delete cascade,
  domain_id uuid references public.busy_website_domains(id) on delete set null,
  occurred_at timestamptz not null default now(),
  page_path text not null default '/',
  source text not null default 'website',
  referrer_host text,
  campaign_source text,
  campaign_medium text,
  campaign_name text,
  external_event_id text,
  metadata jsonb not null default '{}'::jsonb,
  unique (website_id, external_event_id)
);

create index if not exists busy_websites_delivery_status_idx
  on public.busy_websites (delivery_status, provider_last_sync_at);
create unique index if not exists busy_websites_default_hostname_unique_idx
  on public.busy_websites (lower(default_hostname))
  where default_hostname is not null;

create index if not exists busy_website_domains_provider_sync_idx
  on public.busy_website_domains (routing_provider, routing_status, last_checked_at);
create index if not exists busy_website_domains_analytics_sync_idx
  on public.busy_website_domains (last_analytics_at asc nulls first)
  where routing_status = 'active' and ssl_status = 'active';

create index if not exists busy_website_usage_daily_business_date_idx
  on public.busy_website_usage_daily (business_id, usage_date desc);
create index if not exists busy_website_usage_daily_website_date_idx
  on public.busy_website_usage_daily (website_id, usage_date desc);
create index if not exists busy_website_signal_runs_business_started_idx
  on public.busy_website_signal_runs (business_id, started_at desc);
create index if not exists busy_website_signal_runs_website_started_idx
  on public.busy_website_signal_runs (website_id, started_at desc);
create index if not exists busy_website_signal_runs_status_started_idx
  on public.busy_website_signal_runs (status, started_at desc);
create index if not exists busy_website_enquiry_attributions_business_at_idx
  on public.busy_website_enquiry_attributions (business_id, occurred_at desc);
create index if not exists busy_website_enquiry_attributions_website_at_idx
  on public.busy_website_enquiry_attributions (website_id, occurred_at desc);
create index if not exists busy_website_enquiry_attributions_domain_idx
  on public.busy_website_enquiry_attributions (domain_id);

alter table public.busy_website_usage_daily enable row level security;
alter table public.busy_website_signal_runs enable row level security;
alter table public.busy_website_enquiry_attributions enable row level security;

create policy members_read_website_usage_daily
on public.busy_website_usage_daily for select to authenticated
using ((select auth.uid()) is not null and exists (
  select 1 from public.busy_business_memberships m
  where m.business_id = busy_website_usage_daily.business_id
    and m.user_id = (select auth.uid())
));

create policy members_read_website_signal_runs
on public.busy_website_signal_runs for select to authenticated
using ((select auth.uid()) is not null and busy_website_signal_runs.business_id is not null and exists (
  select 1 from public.busy_business_memberships m
  where m.business_id = busy_website_signal_runs.business_id
    and m.user_id = (select auth.uid())
));

create policy members_read_website_enquiry_attributions
on public.busy_website_enquiry_attributions for select to authenticated
using ((select auth.uid()) is not null and exists (
  select 1 from public.busy_business_memberships m
  where m.business_id = busy_website_enquiry_attributions.business_id
    and m.user_id = (select auth.uid())
));

revoke all on public.busy_website_usage_daily from anon, authenticated;
revoke all on public.busy_website_signal_runs from anon, authenticated;
revoke all on public.busy_website_enquiry_attributions from anon, authenticated;
grant select on public.busy_website_usage_daily to authenticated;
grant select on public.busy_website_signal_runs to authenticated;
grant select on public.busy_website_enquiry_attributions to authenticated;
grant select, insert, update, delete on public.busy_website_usage_daily to service_role;
grant select, insert, update, delete on public.busy_website_signal_runs to service_role;
grant select, insert, update, delete on public.busy_website_enquiry_attributions to service_role;

create or replace function public.busy_refresh_website_usage_daily(
  p_usage_date date default current_date
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer := 0;
begin
  insert into public.busy_website_usage_daily (
    business_id, website_id, usage_date, deployments_created,
    versions_published, artifact_bytes, requests, visits, edge_bytes,
    health_checks, active_custom_domains, source, updated_at
  )
  select
    w.business_id,
    w.id,
    p_usage_date,
    coalesce(d.deployments_created, 0)::integer,
    coalesce(d.versions_published, 0)::integer,
    coalesce(d.artifact_bytes, 0)::bigint,
    coalesce(a.requests, 0)::bigint,
    coalesce(a.visits, 0)::bigint,
    coalesce(a.edge_bytes, 0)::bigint,
    coalesce(h.health_checks, 0)::integer,
    coalesce(dom.active_custom_domains, 0)::integer,
    'busy_rollup',
    now()
  from public.busy_websites w
  left join lateral (
    select
      count(*) filter (where created_at::date = p_usage_date) as deployments_created,
      count(*) filter (where published_at::date = p_usage_date) as versions_published,
      coalesce(sum(artifact_bytes) filter (where created_at::date = p_usage_date), 0) as artifact_bytes
    from public.busy_website_deployments d0
    where d0.website_id = w.id
  ) d on true
  left join lateral (
    select
      coalesce(sum(requests), 0) as requests,
      coalesce(sum(visits), 0) as visits,
      coalesce(sum(edge_bytes), 0) as edge_bytes
    from public.busy_website_analytics_daily a0
    where a0.website_id = w.id and a0.metric_date = p_usage_date
  ) a on true
  left join lateral (
    select count(*) as health_checks
    from public.busy_website_health_checks h0
    where h0.website_id = w.id and h0.checked_at::date = p_usage_date
  ) h on true
  left join lateral (
    select count(*) as active_custom_domains
    from public.busy_website_domains dom0
    where dom0.website_id = w.id
      and dom0.routing_status = 'active'
      and dom0.ssl_status = 'active'
  ) dom on true
  on conflict (website_id, usage_date, source)
  do update set
    deployments_created = excluded.deployments_created,
    versions_published = excluded.versions_published,
    artifact_bytes = excluded.artifact_bytes,
    requests = excluded.requests,
    visits = excluded.visits,
    edge_bytes = excluded.edge_bytes,
    health_checks = excluded.health_checks,
    active_custom_domains = excluded.active_custom_domains,
    updated_at = now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.busy_refresh_website_usage_daily(date) from public, anon, authenticated;
grant execute on function public.busy_refresh_website_usage_daily(date) to service_role;

comment on table public.busy_website_usage_daily is
  'Tenant-scoped daily usage/cost-control rollup for BUSY website infrastructure.';
comment on table public.busy_website_signal_runs is
  'Audit trail for provider domain sync, analytics sync and website usage rollups.';
comment on table public.busy_website_enquiry_attributions is
  'Attribution records for genuine website enquiries once a public enquiry module/provider emits an event. No speculative enquiries are created.';
