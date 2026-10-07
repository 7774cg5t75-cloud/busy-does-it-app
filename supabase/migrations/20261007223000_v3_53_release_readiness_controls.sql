-- V3.53: release-readiness controls for burst handling and production simulation.

create table if not exists public.busy_website_worker_wake_state (
  singleton boolean primary key default true check (singleton),
  next_wake_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.busy_website_worker_wake_state enable row level security;

insert into public.busy_website_worker_wake_state(singleton, next_wake_at)
values (true, now())
on conflict (singleton) do nothing;

create or replace function public.busy_should_wake_website_worker(
  p_min_gap_seconds integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed boolean := false;
begin
  update public.busy_website_worker_wake_state
     set next_wake_at = now() + make_interval(
           secs => least(greatest(coalesce(p_min_gap_seconds, 5), 2), 30)
         ),
         updated_at = now()
   where singleton = true
     and next_wake_at <= now()
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

revoke all on table public.busy_website_worker_wake_state
  from public, anon, authenticated;
revoke all on function public.busy_should_wake_website_worker(integer)
  from public, anon, authenticated;
grant execute on function public.busy_should_wake_website_worker(integer)
  to service_role;

create or replace function public.busy_wake_website_worker_scaled()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_queue_length bigint := 0;
  v_fanout integer := 0;
  v_i integer := 0;
  v_request_id bigint;
  v_request_ids jsonb := '[]'::jsonb;
begin
  select value into v_token
  from public.busy_internal_config
  where key = 'website_worker_token';

  if nullif(v_token, '') is null then
    raise exception 'Website worker token is not configured';
  end if;

  select coalesce(queue_length, 0)
    into v_queue_length
  from pgmq.metrics('busy_website_publish')
  limit 1;

  v_fanout := case
    when v_queue_length <= 0 then 0
    when v_queue_length <= 12 then 1
    when v_queue_length <= 48 then 2
    when v_queue_length <= 200 then 4
    else 8
  end;

  for v_i in 1..v_fanout loop
    select net.http_post(
      url := 'https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-busy-worker-token', v_token
      ),
      body := jsonb_build_object('limit', 12),
      timeout_milliseconds := 30000
    ) into v_request_id;

    v_request_ids := v_request_ids || jsonb_build_array(v_request_id);
  end loop;

  return jsonb_build_object(
    'queueLength', v_queue_length,
    'fanout', v_fanout,
    'requestIds', v_request_ids,
    'sampledAt', now()
  );
end;
$$;

revoke all on function public.busy_wake_website_worker_scaled()
  from public, anon, authenticated;
grant execute on function public.busy_wake_website_worker_scaled()
  to service_role;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'busy-website-worker-minute'
  limit 1;
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end
$$;

select cron.schedule(
  'busy-website-worker-minute',
  '* * * * *',
  'select public.busy_wake_website_worker_scaled();'
);

create or replace function public.busy_wake_website_health()
returns bigint language plpgsql security definer set search_path = ''
as $
declare
  v_token text;
  v_request_id bigint;
begin
  select value into v_token
  from public.busy_internal_config
  where key = 'website_health_token';

  if nullif(v_token, '') is null then
    raise exception 'Website health token is not configured';
  end if;

  select net.http_post(
    url := 'https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-health',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-busy-health-token', v_token
    ),
    body := jsonb_build_object('limit', 40),
    timeout_milliseconds := 30000
  ) into v_request_id;

  return v_request_id;
end;
$;

revoke all on function public.busy_wake_website_health()
  from public, anon, authenticated;
grant execute on function public.busy_wake_website_health()
  to service_role;

create or replace function public.busy_website_release_readiness()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_metrics record;
  v_health_active boolean := false;
  v_worker_active boolean := false;
  v_provider_active boolean := false;
  v_prune_active boolean := false;
begin
  select * into v_metrics
  from public.busy_website_operational_metrics()
  limit 1;

  select coalesce(bool_or(active), false) into v_health_active
  from cron.job where jobname = 'busy-website-health-minute';

  select coalesce(bool_or(active), false) into v_worker_active
  from cron.job where jobname = 'busy-website-worker-minute';

  select coalesce(bool_or(active), false) into v_provider_active
  from cron.job where jobname = 'busy-website-provider-five-minute';

  select coalesce(bool_or(active), false) into v_prune_active
  from cron.job where jobname = 'busy-website-ops-prune-daily';

  return jsonb_build_object(
    'ready',
      v_health_active
      and v_worker_active
      and v_provider_active
      and v_prune_active
      and coalesce(v_metrics.stale_leases, 0) = 0,
    'architecture', jsonb_build_object(
      'adaptiveHealthScheduler', v_health_active,
      'scaledWorkerScheduler', v_worker_active,
      'providerReconciler', v_provider_active,
      'boundedOperationalRetention', v_prune_active,
      'atomicWorkerLease', true,
      'tenantFairQueue', true,
      'tenantIntegrityConstraints', true
    ),
    'livePressure', to_jsonb(v_metrics),
    'note',
      'This is a live operational gate, not a substitute for isolated synthetic load testing.'
  );
end;
$$;

revoke all on function public.busy_website_release_readiness()
  from public, anon, authenticated;
grant execute on function public.busy_website_release_readiness()
  to service_role;

comment on function public.busy_should_wake_website_worker(integer) is
  'V3.53 coalesces immediate worker wake requests so a publish burst cannot create one edge invocation per tap.';
comment on function public.busy_wake_website_worker_scaled() is
  'V3.53 backlog-sensitive worker fanout, capped at eight worker invocations per scheduler minute.';
comment on function public.busy_website_release_readiness() is
  'V3.53 service-role-only live release-readiness snapshot; synthetic load proof remains separate.';
