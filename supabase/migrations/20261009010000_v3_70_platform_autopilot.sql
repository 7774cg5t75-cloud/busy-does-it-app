-- V3.70 — BUSY platform-wide aggregate incident monitor.
-- Server-side schedule only; NO customer messages, publishing retries or repairs.
-- The founder dashboard reads rows through a separate Auth-verified Edge Function.
create schema if not exists busy_platform_internal;
revoke all on schema busy_platform_internal from public, anon, authenticated;

create table if not exists public.busy_platform_incidents (
  incident_key text primary key
    check (incident_key in ('website_failed','website_stalled','social_failed','app_failed')),
  severity text not null check (severity in ('watch','attention')),
  title text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  affected_count bigint not null default 0 check (affected_count >= 0),
  first_detected_at timestamptz not null default now(),
  last_observed_at timestamptz not null default now(),
  resolved_at timestamptz,
  clear_checks integer not null default 0 check (clear_checks >= 0),
  observation_count bigint not null default 1 check (observation_count >= 1),
  transition_count integer not null default 1 check (transition_count >= 1)
);

create table if not exists public.busy_platform_monitor_runs (
  id bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  status text not null check (status in ('complete','partial')),
  counts jsonb not null default '{}'::jsonb,
  coverage jsonb not null default '{}'::jsonb
);
create index if not exists busy_platform_incidents_recent_idx
  on public.busy_platform_incidents (last_observed_at desc);
create index if not exists busy_platform_monitor_runs_recent_idx
  on public.busy_platform_monitor_runs (checked_at desc);

alter table public.busy_platform_incidents enable row level security;
alter table public.busy_platform_monitor_runs enable row level security;
-- No direct access for normal user JWTs. Only the service-key authenticated
-- Edge Function can return bounded aggregate-only data.
revoke all on public.busy_platform_incidents from public, anon, authenticated;
revoke all on public.busy_platform_monitor_runs from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated
  -- New sequence privileges can still only be used via explicitly granted tables.
;
grant select on public.busy_platform_incidents to service_role;
grant select on public.busy_platform_monitor_runs to service_role;

create or replace function busy_platform_internal.record_signal(
  p_key text, p_count bigint, p_now timestamptz
) returns void language plpgsql security definer set search_path = '' as $$
declare v_title text; v_severity text;
begin
  if p_key not in ('website_failed','website_stalled','social_failed','app_failed')
    or p_count is null or p_count < 0 then
      raise exception 'Unsupported incident signal';
  end if;
  v_title := case p_key
    when 'website_failed' then 'Failed website publishing jobs'
    when 'website_stalled' then 'Stalled website processing leases'
    when 'social_failed' then 'Social posts with recorded failures'
    when 'app_failed' then 'Business Apps with recorded failures'
  end;
  v_severity := case when p_key = 'website_stalled' then 'attention'
    else 'watch' end;
  if p_count > 0 then
    insert into public.busy_platform_incidents
      (incident_key,severity,title,affected_count,first_detected_at,
       last_observed_at,status,clear_checks,observation_count,transition_count)
    values (p_key,v_severity,v_title,p_count,p_now,p_now,'open',0,1,1)
    on conflict (incident_key) do update
      set status='open',
        affected_count=excluded.affected_count,
        last_observed_at=excluded.last_observed_at,
        resolved_at=null,
        clear_checks=0,
        observation_count=public.busy_platform_incidents.observation_count+1,
        transition_count=public.busy_platform_incidents.transition_count+
          case when public.busy_platform_incidents.status='resolved' then 1 else 0 end,
        first_detected_at=case
          when public.busy_platform_incidents.status='resolved' then excluded.first_detected_at
          else public.busy_platform_incidents.first_detected_at end;
  else
    update public.busy_platform_incidents
      set clear_checks=clear_checks+1,
          observation_count=observation_count+1,
          last_observed_at=p_now,
          status=case when clear_checks>=1 then 'resolved' else 'open' end,
          resolved_at=case when clear_checks>=1 then p_now else null end,
          affected_count=0,
          transition_count=transition_count+case when clear_checks=1 then 1 else 0 end
    where incident_key=p_key and status='open';
  end if;
end;
$$;
revoke all on function busy_platform_internal.record_signal(text,bigint,timestamptz)
  from public,anon,authenticated;

create or replace function busy_platform_internal.run_monitor()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := now();
  v_counts jsonb := '{}'::jsonb;
  v_coverage jsonb := '{}'::jsonb;
  v_value bigint;
  v_key text;
  v_outcome text := 'complete';
begin
  -- Protect against overlapping scheduled or manual runs.
  if not pg_catalog.pg_try_advisory_xact_lock(67370,1) then
    return pg_catalog.jsonb_build_object('status','already_running');
  end if;
  foreach v_key in array array['website_failed','website_stalled','social_failed','app_failed']
  loop
    begin
      case v_key
        when 'website_failed' then
          select count(*) into v_value
            from public.busy_website_publish_jobs where status='failed';
        when 'website_stalled' then
          select count(*) into v_value
            from public.busy_website_publish_jobs
            where status='processing'
              and lease_expires_at is not null
              and lease_expires_at < v_now - interval '5 minutes';
        when 'social_failed' then
          select count(*) into v_value
            from public.busy_social_posts where status in ('Failed','Partial failure');
        when 'app_failed' then
          select count(*) into v_value
            from public.busy_mini_apps where status='failed';
      end case;
      perform busy_platform_internal.record_signal(v_key,v_value,v_now);
      v_counts := v_counts || pg_catalog.jsonb_build_object(v_key,v_value);
      v_coverage := v_coverage || pg_catalog.jsonb_build_object(v_key,'checked');
    exception when others then
      -- An unknown/unavailable source must NEVER resolve an open incident.
      -- Do not persist raw database errors, private IDs or customer details.
      v_outcome := 'partial';
      v_coverage := v_coverage || pg_catalog.jsonb_build_object(v_key,'unavailable');
    end;
  end loop;

  insert into public.busy_platform_monitor_runs(checked_at,status,counts,coverage)
    values(v_now,v_outcome,v_counts,v_coverage);
  -- Bounded retention: up to 30 days of checks, 90 days of closed incidents.
  -- No historic customer content is stored at any time.
  delete from public.busy_platform_monitor_runs
    where checked_at < v_now - interval '30 days';
  delete from public.busy_platform_incidents
    where status='resolved' and resolved_at < v_now - interval '90 days';
  return pg_catalog.jsonb_build_object('status',v_outcome,
    'checked_at',v_now,'coverage',v_coverage);
end;
$$;
revoke all on function busy_platform_internal.run_monitor()
  from public,anon,authenticated;
-- Scheduling stays entirely in Postgres: no public webhook, cron token or
-- stored application secret needed. A 15-minute lightweight read-only scan.
select cron.schedule('busy-v370-platform-incidents','*/15 * * * *',
  'select busy_platform_internal.run_monitor()');
