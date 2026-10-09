-- V3.82: continuous founder-only internal application-usage telemetry.
-- These counts are from BUSY'S OWN tables and are NOT supplier billing totals.
create table if not exists public.busy_founder_auto_telemetry (
  metric_key text not null check (metric_key in (
    'ai_requests_30d','website_requests_30d','websites_prepared_total',
    'websites_live_records_total','workspaces_total','incident_scans_24h')),
  observed_hour timestamptz not null,
  observed_at timestamptz not null default now(),
  value bigint not null check (value between 0 and 1000000000000),
  source text not null default 'busy_internal_database'
    check (source='busy_internal_database'),
  primary key (metric_key,observed_hour)
);
alter table public.busy_founder_auto_telemetry enable row level security;
revoke all on public.busy_founder_auto_telemetry from public,anon,authenticated;
grant select,insert,update,delete on public.busy_founder_auto_telemetry to service_role;

-- Only database scheduler and trusted service role may execute. Security
-- INVOKER: never let an ordinary authenticated user aggregate other tenants.
create or replace function busy_platform_internal.capture_founder_telemetry()
returns integer language plpgsql security invoker set search_path='' as $$
declare sample_hour timestamptz:=date_trunc('hour',clock_timestamp());
declare inserted integer:=0;
begin
  insert into public.busy_founder_auto_telemetry(metric_key,observed_hour,observed_at,value)
  select v.metric_key,sample_hour,clock_timestamp(),v.value from (
    select 'ai_requests_30d'::text metric_key,
      coalesce(sum(request_count),0)::bigint value
      from public.busy_conversation_ai_usage_daily
      where usage_day >= current_date - 29
    union all
    select 'website_requests_30d',
      coalesce(sum(requests),0)::bigint
      from public.busy_website_usage_daily
      where usage_date >= current_date - 29
    union all
    select 'websites_prepared_total',count(*)::bigint
      from public.busy_website_deployments
      where prepared_at is not null
    union all
    select 'websites_live_records_total',count(*)::bigint
      from public.busy_websites
      where current_live_deployment_id is not null
    union all
    select 'workspaces_total',count(*)::bigint
      from public.busy_businesses
    union all
    select 'incident_scans_24h',count(*)::bigint
      from public.busy_platform_monitor_runs
      where checked_at >= now() - interval '24 hours'
  ) v
  on conflict(metric_key,observed_hour) do update
  set value=excluded.value,observed_at=excluded.observed_at;
  get diagnostics inserted=row_count;
  return inserted;
end;
$$;
revoke all on function busy_platform_internal.capture_founder_telemetry() from public,anon,authenticated;
grant execute on function busy_platform_internal.capture_founder_telemetry() to service_role;

-- One scoped sample every hour, not one Edge invocation per minute.
select cron.schedule('busy-v382-founder-telemetry-hourly','37 * * * *',
  $$select busy_platform_internal.capture_founder_telemetry()$$);
select cron.schedule('busy-v382-founder-telemetry-retention','47 3 * * *',
  $$delete from public.busy_founder_auto_telemetry
    where observed_hour < now()-interval '90 days'$$);
-- Initial sample, so there are real private readings before the first cron.
select busy_platform_internal.capture_founder_telemetry();
