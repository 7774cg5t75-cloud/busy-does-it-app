insert into public.busy_internal_config(key, value)
values ('website_worker_token', encode(gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

create or replace function public.busy_wake_website_worker()
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
  where key = 'website_worker_token';

  if nullif(v_token, '') is null then
    raise exception 'Website worker token is not configured';
  end if;

  select net.http_post(
    url := 'https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-busy-worker-token', v_token
    ),
    body := jsonb_build_object('limit', 10),
    timeout_milliseconds := 30000
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.busy_wake_website_worker() from public, anon, authenticated;
grant execute on function public.busy_wake_website_worker() to service_role;

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
  'select public.busy_wake_website_worker();'
);
