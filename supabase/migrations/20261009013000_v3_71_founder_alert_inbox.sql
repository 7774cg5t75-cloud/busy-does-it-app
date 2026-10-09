-- V3.71: Founder-only in-app incident inbox. No push/email or customer mutation.
-- Alert state follows verified incident lifecycle; acknowledging NEVER resolves it.
create table if not exists public.busy_platform_alert_inbox (
  incident_key text primary key references public.busy_platform_incidents(incident_key) on delete cascade,
  source_transition_count integer not null check(source_transition_count >= 1),
  priority text not null check(priority in ('watch','attention')),
  status text not null check(status in ('open','resolved')),
  affected_count bigint not null default 0 check(affected_count >= 0),
  opened_at timestamptz not null,
  last_seen_at timestamptz not null,
  resolved_at timestamptz,
  acknowledged_at timestamptz
);
alter table public.busy_platform_alert_inbox enable row level security;
revoke all on public.busy_platform_alert_inbox from public,anon,authenticated;
grant select,update on public.busy_platform_alert_inbox to service_role;

create or replace function busy_platform_internal.sync_alert_inbox(p_now timestamptz)
returns void language sql security definer set search_path = '' as $$
  insert into public.busy_platform_alert_inbox
    (incident_key,source_transition_count,priority,status,affected_count,
     opened_at,last_seen_at,resolved_at,acknowledged_at)
  select incident_key,transition_count,severity,status,affected_count,
    first_detected_at,last_observed_at,resolved_at,null::timestamptz
  from public.busy_platform_incidents
  on conflict (incident_key) do update set
    source_transition_count=excluded.source_transition_count,
    priority=excluded.priority,
    status=excluded.status,
    affected_count=excluded.affected_count,
    opened_at=excluded.opened_at,
    last_seen_at=excluded.last_seen_at,
    resolved_at=excluded.resolved_at,
    acknowledged_at=case
      when public.busy_platform_alert_inbox.source_transition_count <>
        excluded.source_transition_count then null
      else public.busy_platform_alert_inbox.acknowledged_at end;
$$;
revoke all on function busy_platform_internal.sync_alert_inbox(timestamptz)
  from public,anon,authenticated;

-- The scheduled V3.70 monitor now synchronises alerts in the same transaction.
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

  perform busy_platform_internal.sync_alert_inbox(v_now);

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

-- Backfill existing incident state without adding, resolving or acknowledging incidents.
select busy_platform_internal.sync_alert_inbox(now());
