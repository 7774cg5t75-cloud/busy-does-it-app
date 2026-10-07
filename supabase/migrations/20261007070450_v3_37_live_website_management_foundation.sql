alter table public.busy_websites
  add column if not exists health_status text not null default 'not_checked',
  add column if not exists last_health_check_at timestamptz,
  add column if not exists last_healthy_at timestamptz,
  add column if not exists last_observed_deployment_id uuid,
  add column if not exists analytics_provider text not null default 'cdn_rollup',
  add column if not exists analytics_status text not null default 'foundation';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'busy_websites_health_status_check') then
    alter table public.busy_websites
      add constraint busy_websites_health_status_check
      check (health_status in ('not_checked','healthy','degraded','down'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'busy_websites_analytics_status_check') then
    alter table public.busy_websites
      add constraint busy_websites_analytics_status_check
      check (analytics_status in ('foundation','collecting','active','paused','error'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'busy_websites_observed_deployment_fkey') then
    alter table public.busy_websites
      add constraint busy_websites_observed_deployment_fkey
      foreign key (last_observed_deployment_id)
      references public.busy_website_deployments(id)
      on delete set null;
  end if;
end
$$;

alter table public.busy_website_deployments
  add column if not exists change_label text not null default 'Website update',
  add column if not exists change_summary jsonb not null default '{"items":[],"counts":{}}'::jsonb,
  add column if not exists page_count integer not null default 1;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'busy_website_deployments_page_count_check') then
    alter table public.busy_website_deployments
      add constraint busy_website_deployments_page_count_check
      check (page_count between 1 and 100);
  end if;
end
$$;

alter table public.busy_website_domains
  add column if not exists routing_status text not null default 'not_configured',
  add column if not exists provider_hostname_id text,
  add column if not exists routing_target text,
  add column if not exists required_records jsonb not null default '[]'::jsonb,
  add column if not exists provider_status jsonb not null default '{}'::jsonb,
  add column if not exists last_checked_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'busy_website_domains_routing_status_check') then
    alter table public.busy_website_domains
      add constraint busy_website_domains_routing_status_check
      check (routing_status in ('not_configured','pending','validating','active','error','disabled'));
  end if;
end
$$;

create table if not exists public.busy_public_business_profiles (
  business_id uuid primary key references public.busy_businesses(id) on delete cascade,
  source_website_id uuid references public.busy_websites(id) on delete set null,
  source_deployment_id uuid references public.busy_website_deployments(id) on delete set null,
  public_slug text not null,
  display_name text not null default '',
  status text not null default 'draft'
    check (status in ('draft','preview_ready','live','disabled')),
  revision bigint not null default 1 check (revision >= 1),
  profile jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (public_slug)
);

create table if not exists public.busy_website_health_checks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  website_id uuid not null references public.busy_websites(id) on delete cascade,
  deployment_id uuid references public.busy_website_deployments(id) on delete set null,
  domain_id uuid references public.busy_website_domains(id) on delete cascade,
  target_type text not null check (target_type in ('live_alias','custom_domain')),
  checked_url text not null,
  status text not null check (status in ('healthy','degraded','down')),
  http_status integer,
  response_ms integer not null default 0 check (response_ms >= 0),
  expected_deployment_id uuid references public.busy_website_deployments(id) on delete set null,
  observed_deployment_id uuid references public.busy_website_deployments(id) on delete set null,
  last_error text,
  checked_at timestamptz not null default now()
);

create table if not exists public.busy_website_analytics_daily (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  website_id uuid not null references public.busy_websites(id) on delete cascade,
  metric_date date not null,
  page_path text not null default '/',
  source text not null default 'cdn_rollup',
  page_views bigint not null default 0 check (page_views >= 0),
  unique_visitors bigint not null default 0 check (unique_visitors >= 0),
  enquiries bigint not null default 0 check (enquiries >= 0),
  updated_at timestamptz not null default now(),
  unique (website_id, metric_date, page_path, source)
);

create index if not exists busy_websites_health_due_idx
  on public.busy_websites (last_health_check_at asc nulls first)
  where current_live_deployment_id is not null;
create index if not exists busy_websites_observed_deployment_idx
  on public.busy_websites (last_observed_deployment_id);
create index if not exists busy_public_business_profiles_source_website_idx
  on public.busy_public_business_profiles (source_website_id);
create index if not exists busy_public_business_profiles_source_deployment_idx
  on public.busy_public_business_profiles (source_deployment_id);
create index if not exists busy_public_business_profiles_updated_by_idx
  on public.busy_public_business_profiles (updated_by);
create index if not exists busy_website_health_checks_site_checked_idx
  on public.busy_website_health_checks (website_id, checked_at desc);
create index if not exists busy_website_health_checks_business_checked_idx
  on public.busy_website_health_checks (business_id, checked_at desc);
create index if not exists busy_website_health_checks_deployment_idx
  on public.busy_website_health_checks (deployment_id);
create index if not exists busy_website_health_checks_domain_idx
  on public.busy_website_health_checks (domain_id);
create index if not exists busy_website_health_checks_expected_idx
  on public.busy_website_health_checks (expected_deployment_id);
create index if not exists busy_website_health_checks_observed_idx
  on public.busy_website_health_checks (observed_deployment_id);
create index if not exists busy_website_analytics_daily_business_date_idx
  on public.busy_website_analytics_daily (business_id, metric_date desc);
create index if not exists busy_website_analytics_daily_site_date_idx
  on public.busy_website_analytics_daily (website_id, metric_date desc);

alter table public.busy_public_business_profiles enable row level security;
alter table public.busy_website_health_checks enable row level security;
alter table public.busy_website_analytics_daily enable row level security;

create policy members_read_public_business_profiles
on public.busy_public_business_profiles for select to authenticated
using ((select auth.uid()) is not null and exists (
  select 1 from public.busy_business_memberships m
  where m.business_id = busy_public_business_profiles.business_id
    and m.user_id = (select auth.uid())
));

create policy members_read_website_health_checks
on public.busy_website_health_checks for select to authenticated
using ((select auth.uid()) is not null and exists (
  select 1 from public.busy_business_memberships m
  where m.business_id = busy_website_health_checks.business_id
    and m.user_id = (select auth.uid())
));

create policy members_read_website_analytics_daily
on public.busy_website_analytics_daily for select to authenticated
using ((select auth.uid()) is not null and exists (
  select 1 from public.busy_business_memberships m
  where m.business_id = busy_website_analytics_daily.business_id
    and m.user_id = (select auth.uid())
));

revoke all on public.busy_public_business_profiles from anon, authenticated;
revoke all on public.busy_website_health_checks from anon, authenticated;
revoke all on public.busy_website_analytics_daily from anon, authenticated;
grant select on public.busy_public_business_profiles to authenticated;
grant select on public.busy_website_health_checks to authenticated;
grant select on public.busy_website_analytics_daily to authenticated;
grant select, insert, update, delete on public.busy_public_business_profiles to service_role;
grant select, insert, update, delete on public.busy_website_health_checks to service_role;
grant select, insert, update, delete on public.busy_website_analytics_daily to service_role;

create or replace function public.busy_guard_website_deployment_immutable()
returns trigger language plpgsql set search_path = 'public', 'pg_temp'
as $$
begin
  if new.business_id is distinct from old.business_id
     or new.website_id is distinct from old.website_id
     or new.version_no is distinct from old.version_no
     or new.source_generation is distinct from old.source_generation
     or new.content_hash is distinct from old.content_hash
     or new.source_draft is distinct from old.source_draft
     or new.change_label is distinct from old.change_label
     or new.change_summary is distinct from old.change_summary
     or new.page_count is distinct from old.page_count
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Website deployment source/version fields are immutable';
  end if;
  return new;
end;
$$;

create or replace function public.busy_prune_website_health_checks()
returns bigint language plpgsql security definer set search_path = ''
as $$
declare v_count bigint;
begin
  with deleted as (
    delete from public.busy_website_health_checks
    where checked_at < now() - interval '30 days'
    returning 1
  )
  select count(*) into v_count from deleted;
  return v_count;
end;
$$;

revoke all on function public.busy_prune_website_health_checks() from public, anon, authenticated;
grant execute on function public.busy_prune_website_health_checks() to service_role;

comment on table public.busy_public_business_profiles is
  'Server-owned approved public-business projection shared by website publishing and future BUSY Mini Apps. Not directly public through the Data API.';
comment on table public.busy_website_health_checks is
  'Bounded tenant-scoped website reachability/version health history. Scheduled server workers write; business members may read.';
comment on table public.busy_website_analytics_daily is
  'Aggregated website analytics only. Raw public page-view events should be collected/aggregated outside the operational database before rollup.';
