\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 ONLY: reuses the V3.180 real SQL/rollback harness.
\ir ci-atomic-handoff-v3180.sql
\ir ../supabase/migrations/20261012193000_v3_181_durable_work_booking_ledger.sql

do $$
declare r jsonb;
begin
 if has_table_privilege('anon','public.busy_mini_app_work_bookings','select')
   or has_table_privilege('authenticated','public.busy_mini_app_work_bookings','select')
   or has_function_privilege('authenticated',
     'public.busy_mark_mini_app_request_link_v3181(uuid,uuid,uuid,text,text,text,boolean,jsonb)','execute') then
   raise exception 'Ledger is exposed directly to an untrusted client';
 end if;
 -- Historical V3.180 confirmed request is upgraded deterministically
 -- only when its signed-in owner explicitly revisits the current handoff.
 r:=public.busy_mark_mini_app_request_link_v3181(
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'customer-1','booking-1','booking_confirmed',true,
  '{"bookingDate":"2026-11-12","bookingTime":"15:00"}'
 );
 if r->>'changed'<>'false' or r->>'workLedgerState'<>'confirmed'
    or r->>'workLedgerDurable'<>'true'
    or r->>'externalCalendarDelivered'<>'false'
    or (select count(*) from public.busy_mini_app_work_bookings
      where request_id='44444444-4444-4444-8444-444444444444')<>1 then
  raise exception 'Durable ledger not created on exact V3.180 replay';
 end if;
 r:=public.busy_mark_mini_app_request_link_v3181(
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'customer-1','booking-1','booking_confirmed',true,
  '{"bookingDate":"2026-11-12","bookingTime":"15:00"}'
 );
 if r->>'changed'<>'false' or
   (select count(*) from public.busy_mini_app_work_bookings
    where request_id='44444444-4444-4444-8444-444444444444')<>1 then
   raise exception 'Repeat confirmation duplicated Work calendar entry';
 end if;
 r:=public.busy_mark_mini_app_request_link_v3181(
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'customer-1','booking-1','closed',false,'{}'
 );
 if r->>'workLedgerState'<>'cancelled' or
   (select state from public.busy_mini_app_work_bookings
    where request_id='44444444-4444-4444-8444-444444444444')<>'cancelled' or
   (select status from public.busy_mini_app_requests
    where id='44444444-4444-4444-8444-444444444444')<>'closed' then
   raise exception 'Cancellation failed to update the request and the ledger';
 end if;
 r:=public.busy_mark_mini_app_request_link_v3181(
  '11111111-1111-4111-8111-111111111111',
  '44444444-4444-4444-8444-444444444444',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'customer-1','booking-1','closed',false,'{}'
 );
 if r->>'changed'<>'false' or
    (select count(*) from public.busy_mini_app_request_events
      where request_id='44444444-4444-4444-8444-444444444444')<>3 then
  raise exception 'Repeat cancellation wrote an extra event';
 end if;
end $$;

-- Test rollback *after* the V3.180 request/link/event/unread writes.
insert into public.busy_mini_app_requests
 (id,business_id,mini_app_id,consumer_user_id,module_key,request_type,status)
 values ('66666666-6666-4666-8666-666666666666',
 '11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333',
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'booking_request','booking_request','received');
select public.busy_mark_mini_app_request_link_v3181(
 '11111111-1111-4111-8111-111111111111',
 '66666666-6666-4666-8666-666666666666',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'customer-6','booking-6','booking_draft',false,'{}');
create function public.ci_fail_durable_work_v3181() returns trigger
language plpgsql as $$
begin
 if new.request_id='66666666-6666-4666-8666-666666666666' then
   raise exception 'CI injected ledger insert failure';
 end if;
 return new;
end $$;
create trigger ci_fail_durable_work_v3181 before insert
on public.busy_mini_app_work_bookings
for each row execute function public.ci_fail_durable_work_v3181();
do $$
declare did_fail boolean:=false;
begin
 begin
  perform public.busy_mark_mini_app_request_link_v3181(
    '11111111-1111-4111-8111-111111111111',
    '66666666-6666-4666-8666-666666666666',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'customer-6','booking-6','booking_confirmed',true,
    '{"bookingDate":"2026-11-21","bookingTime":"09:30"}');
 exception when others then did_fail:=true;
 end;
 if not did_fail then raise exception 'Ledger failure injection did not fire'; end if;
 if (select status from public.busy_mini_app_requests
  where id='66666666-6666-4666-8666-666666666666')<>'reviewing'
 or (select customer_unread_count from public.busy_mini_app_requests
  where id='66666666-6666-4666-8666-666666666666')<>0
 or (select bridge_state from public.busy_mini_app_request_links
  where request_id='66666666-6666-4666-8666-666666666666')<>'booking_draft'
 or (select count(*) from public.busy_mini_app_request_events
  where request_id='66666666-6666-4666-8666-666666666666')<>1
 or (select count(*) from public.busy_mini_app_work_bookings
  where request_id='66666666-6666-4666-8666-666666666666')<>0 then
  raise exception 'PARTIAL COMMIT: failed ledger left inconsistent Work state';
 end if;
end $$;
drop trigger ci_fail_durable_work_v3181 on public.busy_mini_app_work_bookings;
drop function public.ci_fail_durable_work_v3181();

do $$
declare rejected boolean:=false;
begin
 begin
 perform public.busy_mark_mini_app_request_link_v3181(
   '11111111-1111-4111-8111-111111111111',
   '66666666-6666-4666-8666-666666666666',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'customer-6','booking-6','booking_confirmed',true,
   '{"bookingDate":"2026-11-21","bookingTime":"09:30"}');
 exception when others then rejected:=true;
 end;
 if not rejected then raise exception 'Cross-tenant actor accepted for ledger';end if;
end $$;
select 'V3.181 DISPOSABLE DURABLE WORK LEDGER PASS' as ci_result;
