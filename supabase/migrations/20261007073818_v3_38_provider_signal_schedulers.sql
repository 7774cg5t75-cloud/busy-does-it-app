insert into public.busy_internal_config(key, value)
values
  ('website_provider_token', encode(gen_random_bytes(32), 'hex')),
  ('website_signals_token', encode(gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

create or replace function public.busy_wake_website_provider()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_request_id bigint;
begin
  select value into v_token
  from public.busy_internal_config
  where key = 'website_provider_token';

  if nullif(v_token, '') is null then
    raise exception 'Website provider token is not configured';
  end if;

  select net.http_post(
    url := 'https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-provider',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-busy-provider-token', v_token
    ),
    body := jsonb_build_object('action', 'sync_domains', 'limit', 40),
    timeout_milliseconds := 30000
  ) into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.busy_wake_website_signals()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_request_id bigint;
begin
  select value into v_token
  from public.busy_internal_config
  where key = 'website_signals_token';

  if nullif(v_token, '') is null then
    raise exception 'Website signals token is not configured';
  end if;

  select net.http_post(
    url := 'https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-busy-signals-token', v_token
    ),
    body := jsonb_build_object('action', 'sync_analytics'),
    timeout_milliseconds := 30000
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.busy_wake_website_provider() from public, anon, authenticated;
revoke all on function public.busy_wake_website_signals() from public, anon, authenticated;
grant execute on function public.busy_wake_website_provider() to service_role;
grant execute on function public.busy_wake_website_signals() to service_role;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'busy-website-provider-five-minute' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;

  select jobid into v_job_id from cron.job where jobname = 'busy-website-signals-hourly' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;

  select jobid into v_job_id from cron.job where jobname = 'busy-website-usage-daily' limit 1;
  if v_job_id is not null then perform cron.unschedule(v_job_id); end if;
end
$$;

select cron.schedule(
  'busy-website-provider-five-minute',
  '*/5 * * * *',
  'select public.busy_wake_website_provider();'
);

select cron.schedule(
  'busy-website-signals-hourly',
  '12 * * * *',
  'select public.busy_wake_website_signals();'
);

select cron.schedule(
  'busy-website-usage-daily',
  '25 0 * * *',
  'select public.busy_refresh_website_usage_daily(current_date - 1);'
);
