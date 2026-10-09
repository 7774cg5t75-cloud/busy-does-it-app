-- V3.74: an append-by-transition, aggregate-only recovery assessment ledger.
-- Automatic actions are limited to the PRE-EXISTING read-only DB monitoring scan.
-- A resolved incident means its internal signal cleared twice, NOT proof a
-- remote website/post/application was repaired or delivered.
create table if not exists public.busy_platform_recovery_reviews (
  incident_key text not null references public.busy_platform_incidents(incident_key) on delete cascade,
  source_transition_count integer not null check (source_transition_count >= 1),
  assessment text not null check (assessment in
    ('requires_review','confirming_clear','signal_cleared','unverified')),
  monitoring_verified boolean not null default false,
  affected_count bigint not null default 0 check (affected_count >= 0),
  clear_checks integer not null default 0 check (clear_checks >= 0),
  first_assessed_at timestamptz not null,
  last_assessed_at timestamptz not null,
  assessment_runs bigint not null default 1 check (assessment_runs >= 1),
  automatic_external_mutation_allowed boolean not null default false
    check (automatic_external_mutation_allowed = false),
  primary key (incident_key,source_transition_count)
);
create index if not exists busy_platform_recovery_reviews_latest_idx
 on public.busy_platform_recovery_reviews(last_assessed_at desc);

alter table public.busy_platform_recovery_reviews enable row level security;
revoke all on public.busy_platform_recovery_reviews from public, anon, authenticated;
grant select on public.busy_platform_recovery_reviews to service_role;

-- AFTER the existing run_monitor transaction synchronises the alert inbox,
-- record one sanitized decision for each active or historical grouped signal.
-- The trigger performs NO network access, no publishing, no user-content reads,
-- no queue mutations, and no automatic privileged recovery.
create or replace function busy_platform_internal.record_recovery_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.busy_platform_recovery_reviews (
    incident_key, source_transition_count, assessment,
    monitoring_verified, affected_count, clear_checks,
    first_assessed_at, last_assessed_at, assessment_runs,
    automatic_external_mutation_allowed
  )
  select a.incident_key, a.source_transition_count,
    case
      when new.status <> 'complete' or new.coverage ->> a.incident_key <> 'checked'
        then 'unverified'
      when a.status = 'resolved' and a.affected_count = 0 and i.clear_checks >= 2
        then 'signal_cleared'
      when a.status = 'open' and a.affected_count = 0 and i.clear_checks = 1
        then 'confirming_clear'
      when a.status = 'open' and a.affected_count > 0
        then 'requires_review'
      else 'unverified'
    end,
    (new.status = 'complete' and new.coverage ->> a.incident_key = 'checked'),
    a.affected_count, i.clear_checks,
    new.checked_at, new.checked_at, 1, false
  from public.busy_platform_alert_inbox a
  join public.busy_platform_incidents i on i.incident_key = a.incident_key
  where a.incident_key in
    ('website_failed','website_stalled','social_failed','app_failed')
  on conflict (incident_key,source_transition_count) do update set
    assessment = excluded.assessment,
    monitoring_verified = excluded.monitoring_verified,
    affected_count = excluded.affected_count,
    clear_checks = excluded.clear_checks,
    last_assessed_at = excluded.last_assessed_at,
    assessment_runs = least(public.busy_platform_recovery_reviews.assessment_runs + 1, 1000000000),
    automatic_external_mutation_allowed = false;

  -- Resolved incident history is already limited to 90 days by the existing
  -- monitor. Additional bounded cleanup avoids retaining orphaned history.
  delete from public.busy_platform_recovery_reviews r
    where r.last_assessed_at < new.checked_at - interval '90 days'
      and exists (
        select 1 from public.busy_platform_incidents i
        where i.incident_key = r.incident_key and i.status = 'resolved'
      );
  return new;
end;
$$;
revoke all on function busy_platform_internal.record_recovery_review()
  from public, anon, authenticated;

drop trigger if exists busy_platform_recovery_review_after_scan
  on public.busy_platform_monitor_runs;
create trigger busy_platform_recovery_review_after_scan
after insert on public.busy_platform_monitor_runs
for each row execute function busy_platform_internal.record_recovery_review();
