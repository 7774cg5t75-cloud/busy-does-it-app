-- V3.76. Privacy-preserving evidence history. NO hostnames, account IDs,
-- customer content, provider IDs, tokens or free-form JSON columns.
-- One automatically claimed, founder-triggered window per 30 minutes.
create table if not exists public.busy_platform_evidence_snapshots (
  window_start timestamptz primary key,
  status text not null default 'running'
    check (status in ('running','complete','partial')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  website_sampled smallint check (website_sampled between 0 and 4),
  website_responding smallint check (website_responding between 0 and 4),
  website_unreachable smallint check (website_unreachable between 0 and 4),
  website_mismatch smallint check (website_mismatch between 0 and 4),
  website_unverified smallint check (website_unverified between 0 and 4),
  social_sampled smallint check (social_sampled between 0 and 12),
  social_provider_accepted smallint check (social_provider_accepted between 0 and 36),
  social_failed smallint check (social_failed between 0 and 36),
  social_unverified smallint check (social_unverified between 0 and 36),
  app_sampled smallint check (app_sampled between 0 and 8),
  app_deployment_recorded smallint check (app_deployment_recorded between 0 and 8),
  app_version_mismatch smallint check (app_version_mismatch between 0 and 8),
  app_unverified smallint check (app_unverified between 0 and 8),
  constraint evidence_snapshot_complete_at
    check (status = 'running' or completed_at is not null),
  constraint evidence_website_totals
    check (website_sampled is null or
      (website_responding is not null and website_unreachable is not null and
       website_mismatch is not null and website_unverified is not null and
       website_responding+website_unreachable+website_mismatch+website_unverified = website_sampled)),
  constraint evidence_app_totals
    check (app_sampled is null or
      (app_deployment_recorded is not null and app_version_mismatch is not null and
       app_unverified is not null and
       app_deployment_recorded+app_version_mismatch+app_unverified = app_sampled)),
  constraint evidence_social_totals
    check (social_sampled is null or
      (social_provider_accepted is not null and social_failed is not null and social_unverified is not null and
       social_provider_accepted+social_failed+social_unverified <= 3*social_sampled))
);
alter table public.busy_platform_evidence_snapshots enable row level security;
revoke all on public.busy_platform_evidence_snapshots from public,anon,authenticated;
grant select,insert,update on public.busy_platform_evidence_snapshots to service_role;

-- A fixed no-argument database claim prevents simultaneous requests from
-- producing duplicate network probes or unbounded evidence rows.
-- It is callable ONLY with a server-held service key, after fresh Auth role verification.
create or replace function public.busy_claim_evidence_window()
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_slot timestamptz;
begin
  v_slot := pg_catalog.to_timestamp(
    pg_catalog.floor(pg_catalog.date_part('epoch', v_now) / 1800) * 1800);
  insert into public.busy_platform_evidence_snapshots(window_start,status)
  values(v_slot,'running') on conflict (window_start) do nothing;
  if found then
    delete from public.busy_platform_evidence_snapshots
      where window_start < v_now - interval '30 days';
    return v_slot;
  end if;
  return null;
end;
$$;
revoke all on function public.busy_claim_evidence_window() from public,anon,authenticated;
grant execute on function public.busy_claim_evidence_window() to service_role;
