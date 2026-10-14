-- CI ONLY: appended to the REAL v3.225 guest RPC fixture AFTER the two
-- synthetic requests are inserted, BEFORE its final rollback.
-- The v3.226 outbox migration is applied BEFORE that fixture in the same
-- disposable PostgreSQL 16 transaction. Never execute against Supabase.
do $$
declare
  v_a uuid;
  v_b uuid;
begin
  select id into v_a from public.busy_mini_app_requests
    where guest_challenge_id='10101010-1010-4010-8010-101010101010';
  select id into v_b from public.busy_mini_app_requests
    where guest_challenge_id='20202020-2020-4020-8020-202020202020';
  if v_a is null or v_b is null or v_a=v_b then
    raise exception 'Missing synthetic source requests';
  end if;
  if (select count(*) from public.busy_mini_app_guest_notification_intents)<>2 then
    raise exception 'Atomic notification intent count != two distinct requests';
  end if;
  if (select count(*) from public.busy_mini_app_guest_notification_intents
      where request_id=v_a
        and business_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        and mini_app_id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and event_kind='guest_received' and state='pending'
        and attempt_count=0 and provider_accepted_at is null)<>1 then
    raise exception 'Business A notification intent not bound to its source';
  end if;
  if (select count(*) from public.busy_mini_app_guest_notification_intents
      where request_id=v_b
        and business_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
        and mini_app_id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'
        and state='pending')<>1 then
    raise exception 'Business B notification intent not bound to its source';
  end if;
  if has_table_privilege('anon',
      'public.busy_mini_app_guest_notification_intents','select')
    or has_table_privilege('authenticated',
      'public.busy_mini_app_guest_notification_intents','update')
    or not has_table_privilege('service_role',
      'public.busy_mini_app_guest_notification_intents','select') then
    raise exception 'Notification intent client privileges leaked';
  end if;
  if not exists(select 1 from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname='busy_mini_app_guest_notification_intents'
        and c.relrowsecurity=true and c.relforcerowsecurity=true) then
    raise exception 'Outbox FORCE RLS must be on';
  end if;
  if has_function_privilege('anon',
      'public.busy_enqueue_guest_notification_v3226()', 'execute')
    or has_function_privilege('authenticated',
      'public.busy_enqueue_guest_notification_v3226()', 'execute') then
    raise exception 'Notification trigger function is callable by clients';
  end if;
end $$;
