-- V3.52: website scale, tenant isolation, worker leases and bounded operations.

alter table public.busy_website_publish_jobs
  add column if not exists processing_token uuid,
  add column if not exists lease_expires_at timestamptz;

alter table public.busy_websites
  add column if not exists next_health_check_at timestamptz;

alter table public.busy_website_domains
  add column if not exists provider_next_retry_at timestamptz,
  add column if not exists provider_attempt_count integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_domains_provider_attempt_count_check'
  ) then
    alter table public.busy_website_domains
      add constraint busy_website_domains_provider_attempt_count_check
      check (provider_attempt_count >= 0 and provider_attempt_count <= 1000);
  end if;
end
$$;

-- One website operation at a time. This is stronger than the older
-- deployment/action guard and prevents prepare/publish/rollback races.
create unique index if not exists busy_website_publish_jobs_one_active_website_idx
  on public.busy_website_publish_jobs (website_id)
  where status in ('queued','processing','retry_wait');

create index if not exists busy_website_publish_jobs_lease_idx
  on public.busy_website_publish_jobs (lease_expires_at)
  where status = 'processing';

create index if not exists busy_websites_next_health_due_idx
  on public.busy_websites (next_health_check_at asc nulls first)
  where current_live_deployment_id is not null;

create index if not exists busy_website_domains_provider_due_idx
  on public.busy_website_domains (provider_next_retry_at asc nulls first)
  where status in ('verified','active')
    and routing_provider in ('unassigned','cloudflare_saas');

-- Composite uniqueness allows the service-role backend to enforce tenant
-- identity at the database boundary, not merely in application code.
create unique index if not exists busy_websites_id_business_unique_idx
  on public.busy_websites (id, business_id);
create unique index if not exists busy_website_deployments_id_site_business_unique_idx
  on public.busy_website_deployments (id, website_id, business_id);
create unique index if not exists busy_website_domains_id_site_business_unique_idx
  on public.busy_website_domains (id, website_id, business_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_deployments_tenant_site_fkey'
  ) then
    alter table public.busy_website_deployments
      add constraint busy_website_deployments_tenant_site_fkey
      foreign key (website_id, business_id)
      references public.busy_websites(id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_domains_tenant_site_fkey'
  ) then
    alter table public.busy_website_domains
      add constraint busy_website_domains_tenant_site_fkey
      foreign key (website_id, business_id)
      references public.busy_websites(id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_publish_jobs_tenant_site_fkey'
  ) then
    alter table public.busy_website_publish_jobs
      add constraint busy_website_publish_jobs_tenant_site_fkey
      foreign key (website_id, business_id)
      references public.busy_websites(id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_publish_jobs_tenant_deployment_fkey'
  ) then
    alter table public.busy_website_publish_jobs
      add constraint busy_website_publish_jobs_tenant_deployment_fkey
      foreign key (deployment_id, website_id, business_id)
      references public.busy_website_deployments(id, website_id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_health_checks_tenant_site_fkey'
  ) then
    alter table public.busy_website_health_checks
      add constraint busy_website_health_checks_tenant_site_fkey
      foreign key (website_id, business_id)
      references public.busy_websites(id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_health_checks_tenant_domain_fkey'
  ) then
    alter table public.busy_website_health_checks
      add constraint busy_website_health_checks_tenant_domain_fkey
      foreign key (domain_id, website_id, business_id)
      references public.busy_website_domains(id, website_id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_usage_daily_tenant_site_fkey'
  ) then
    alter table public.busy_website_usage_daily
      add constraint busy_website_usage_daily_tenant_site_fkey
      foreign key (website_id, business_id)
      references public.busy_websites(id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_website_enquiry_attributions_tenant_site_fkey'
  ) then
    alter table public.busy_website_enquiry_attributions
      add constraint busy_website_enquiry_attributions_tenant_site_fkey
      foreign key (website_id, business_id)
      references public.busy_websites(id, business_id)
      on delete cascade;
  end if;
end
$$;

-- PGMQ visibility exceeds the worker lease. A crashed worker cannot cause a
-- second worker to process the same job while the first lease is still valid.
create or replace function public.busy_read_website_publish_jobs(p_limit integer default 5)
returns table(msg_id bigint, read_ct bigint, enqueued_at timestamptz, vt timestamptz, message jsonb)
language sql
security definer
set search_path = ''
as $$
  select q.msg_id, q.read_ct, q.enqueued_at, q.vt, q.message
  from pgmq.read(
    queue_name => 'busy_website_publish',
    vt => 360,
    qty => least(greatest(coalesce(p_limit, 5), 1), 20)
  ) q;
$$;

create or replace function public.busy_claim_website_publish_job(
  p_job_id uuid,
  p_processing_token uuid,
  p_lease_seconds integer default 300
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer := 0;
begin
  if p_processing_token is null then
    return false;
  end if;

  update public.busy_website_publish_jobs
     set status = 'processing',
         processing_token = p_processing_token,
         lease_expires_at = now() + make_interval(
           secs => least(greatest(coalesce(p_lease_seconds, 300), 60), 600)
         ),
         started_at = coalesce(started_at, now()),
         updated_at = now()
   where id = p_job_id
     and (
       status in ('queued','retry_wait')
       or (
         status = 'processing'
         and (
           lease_expires_at is null
           or lease_expires_at <= now()
         )
       )
     );

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

create or replace function public.busy_recover_stale_website_publish_jobs()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer := 0;
begin
  update public.busy_website_publish_jobs
     set status = 'retry_wait',
         processing_token = null,
         lease_expires_at = null,
         last_error = coalesce(
           last_error,
           'BUSY worker lease expired; safe retry queued.'
         ),
         updated_at = now()
   where status = 'processing'
     and (
       lease_expires_at <= now()
       or (
         lease_expires_at is null
         and started_at is not null
         and started_at <= now() - interval '6 minutes'
       )
     );

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

create or replace function public.busy_website_operational_metrics()
returns table(
  queue_length bigint,
  oldest_queue_age_sec integer,
  active_jobs bigint,
  processing_jobs bigint,
  retry_jobs bigint,
  failed_jobs_24h bigint,
  stale_leases bigint,
  live_websites bigint,
  due_health_checks bigint,
  due_provider_domains bigint,
  failed_signals_24h bigint,
  sampled_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  with q as (
    select * from pgmq.metrics('busy_website_publish') limit 1
  )
  select
    coalesce((select queue_length from q), 0)::bigint,
    coalesce((select oldest_msg_age_sec from q), 0)::integer,
    (select count(*) from public.busy_website_publish_jobs
      where status in ('queued','processing','retry_wait'))::bigint,
    (select count(*) from public.busy_website_publish_jobs
      where status = 'processing')::bigint,
    (select count(*) from public.busy_website_publish_jobs
      where status = 'retry_wait')::bigint,
    (select count(*) from public.busy_website_publish_jobs
      where status = 'failed'
        and completed_at >= now() - interval '24 hours')::bigint,
    (select count(*) from public.busy_website_publish_jobs
      where status = 'processing'
        and lease_expires_at is not null
        and lease_expires_at <= now())::bigint,
    (select count(*) from public.busy_websites
      where current_live_deployment_id is not null)::bigint,
    (select count(*) from public.busy_websites
      where current_live_deployment_id is not null
        and (next_health_check_at is null or next_health_check_at <= now()))::bigint,
    (select count(*) from public.busy_website_domains
      where status in ('verified','active')
        and routing_provider in ('unassigned','cloudflare_saas')
        and (provider_next_retry_at is null or provider_next_retry_at <= now()))::bigint,
    (select count(*) from public.busy_website_signal_runs
      where status = 'failed'
        and started_at >= now() - interval '24 hours')::bigint,
    now();
$$;

create or replace function public.busy_prune_website_operational_history()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_jobs integer := 0;
  v_signals integer := 0;
begin
  delete from public.busy_website_publish_jobs
   where status in ('succeeded','failed')
     and completed_at < now() - interval '180 days';
  get diagnostics v_jobs = row_count;

  delete from public.busy_website_signal_runs
   where completed_at is not null
     and completed_at < now() - interval '180 days';
  get diagnostics v_signals = row_count;

  return jsonb_build_object(
    'publishJobsDeleted', v_jobs,
    'signalRunsDeleted', v_signals
  );
end;
$$;

revoke all on function public.busy_claim_website_publish_job(uuid, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.busy_recover_stale_website_publish_jobs()
  from public, anon, authenticated;
revoke all on function public.busy_website_operational_metrics()
  from public, anon, authenticated;
revoke all on function public.busy_prune_website_operational_history()
  from public, anon, authenticated;

grant execute on function public.busy_claim_website_publish_job(uuid, uuid, integer)
  to service_role;
grant execute on function public.busy_recover_stale_website_publish_jobs()
  to service_role;
grant execute on function public.busy_website_operational_metrics()
  to service_role;
grant execute on function public.busy_prune_website_operational_history()
  to service_role;

-- Spread health work continuously rather than producing a five-minute burst.
create or replace function public.busy_wake_website_health()
returns bigint language plpgsql security definer set search_path = ''
as $$
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
    body := jsonb_build_object('limit', 20),
    timeout_milliseconds := 30000
  ) into v_request_id;

  return v_request_id;
end;
$$;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'busy-website-health-five-minute'
  limit 1;
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  select jobid into v_job_id
  from cron.job
  where jobname = 'busy-website-health-minute'
  limit 1;
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  select jobid into v_job_id
  from cron.job
  where jobname = 'busy-website-ops-prune-daily'
  limit 1;
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end
$$;

select cron.schedule(
  'busy-website-health-minute',
  '* * * * *',
  'select public.busy_wake_website_health();'
);

select cron.schedule(
  'busy-website-ops-prune-daily',
  '47 2 * * *',
  'select public.busy_prune_website_operational_history();'
);

comment on function public.busy_claim_website_publish_job(uuid, uuid, integer) is
  'V3.52 atomic worker lease preventing concurrent processing of one website publish job.';
comment on function public.busy_website_operational_metrics() is
  'V3.52 internal website platform pressure/health snapshot for production operations.';
