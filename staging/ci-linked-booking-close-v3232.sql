\set ON_ERROR_STOP on
-- V3.232: PostgreSQL 17 ephemeral transaction. Includes original V3.180
-- request/link/event contract AND V3.181 durable Work ledger, then rolls
-- everything back. Fake auth.users rows != genuine hosted JWT/RLS proof.
begin;
\ir ci-durable-work-v3181.sql
\ir ../supabase/migrations/20261014225500_v3_232_scoped_booking_close_revision.sql

do $$
declare
 b uuid:='11111111-1111-4111-8111-111111111111';
 o uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 app uuid:='33333333-3333-4333-8333-333333333333';
 other_owner uuid:='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 draft uuid:='77777777-7777-4777-8777-777777777777';
 booked uuid:='88888888-8888-4888-8888-888888888888';
 fail_id uuid:='99999999-9999-4999-8999-999999999999';
 stamp timestamptz;
 result jsonb;
 events_before integer;
 did_fail boolean;
 begin
 if has_function_privilege('anon',
  'public.busy_close_linked_booking_current_v3232(uuid,uuid,uuid,text,text,text,timestamptz)','execute') or
  has_function_privilege('authenticated',
  'public.busy_close_linked_booking_current_v3232(uuid,uuid,uuid,text,text,text,timestamptz)','execute')
 or not has_function_privilege('service_role',
  'public.busy_close_linked_booking_current_v3232(uuid,uuid,uuid,text,text,text,timestamptz)','execute')
 then raise exception 'Client could directly invoke privileged closure';end if;

 insert into public.busy_mini_app_requests(
 id,business_id,mini_app_id,consumer_user_id,module_key,request_type,status)
 select req,b,app,'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'booking_request','booking_request','received'
 from unnest(array[draft,booked,fail_id]) req;

 perform public.busy_mark_mini_app_request_link_v3181(
 b,draft,o,'customer-7','booking-7','booking_draft',false,'{}');
 select updated_at into stamp from public.busy_mini_app_requests where id=draft;
 -- A different business owner and a stale timestamp must not write.
 did_fail:=false;
 begin
 perform public.busy_close_linked_booking_current_v3232(
 b,draft,other_owner,'customer-7','booking-7','reviewing',stamp);
 exception when others then did_fail:=true;end;
 if not did_fail then raise exception 'Cross-tenant actor closed draft';end if;
 did_fail:=false;
 begin
 perform public.busy_close_linked_booking_current_v3232(
 b,draft,o,'customer-7','booking-7','reviewing',
 stamp-interval '1 second');
 exception when others then did_fail:=true;end;
 if not did_fail then raise exception 'Stale draft close accepted';end if;
 select count(*) into events_before
 from public.busy_mini_app_request_events where request_id=draft;
 result:=public.busy_close_linked_booking_current_v3232(
 b,draft,o,'customer-7','booking-7','reviewing',stamp);
 if result->>'atomicBookingCloseVerified'<>'true' or
    result->>'nextStatus'<>'closed' or
    result->>'workLedgerState'<>'not_applicable' or
    (select status from public.busy_mini_app_requests where id=draft)<>'closed'
 then raise exception 'Valid current draft did not close atomically';end if;
 if (select count(*) from public.busy_mini_app_request_events
     where request_id=draft)<>events_before+1
 then raise exception 'Draft closure emitted unexpected lifecycle events';end if;
 did_fail:=false;
 begin
 perform public.busy_close_linked_booking_current_v3232(
 b,draft,o,'customer-7','booking-7','reviewing',stamp);
 exception when others then did_fail:=true;end;
 if not did_fail then raise exception 'Old click closed draft twice';end if;

 perform public.busy_mark_mini_app_request_link_v3181(
 b,booked,o,'customer-8','booking-8','booking_draft',false,'{}');
 perform public.busy_mark_mini_app_request_link_v3181(
 b,booked,o,'customer-8','booking-8','booking_confirmed',true,
 '{"bookingDate":"2026-11-17","bookingTime":"12:15","timeZone":"Europe/London"}');
 select updated_at into stamp from public.busy_mini_app_requests where id=booked;
 result:=public.busy_close_linked_booking_current_v3232(
 b,booked,o,'customer-8','booking-8','accepted',stamp);
 if result->>'workLedgerState'<>'cancelled' or
  (select state from public.busy_mini_app_work_bookings
   where request_id=booked)<>'cancelled' or
  (select bridge_state from public.busy_mini_app_request_links
   where request_id=booked)<>'closed' or
  (select status from public.busy_mini_app_requests
   where id=booked)<>'closed' then
 raise exception 'Confirmed booking closure was not atomic across Work ledger';end if;
 did_fail:=false;
 begin
 perform public.busy_close_linked_booking_current_v3232(
 b,booked,o,'customer-8','booking-8','accepted',stamp);
 exception when others then did_fail:=true;end;
 if not did_fail then raise exception 'Old confirmation revision replayed';end if;

 -- Force a Work UPDATE failure AFTER the inner request/link/event writes.
 perform public.busy_mark_mini_app_request_link_v3181(
 b,fail_id,o,'customer-9','booking-9','booking_draft',false,'{}');
 perform public.busy_mark_mini_app_request_link_v3181(
 b,fail_id,o,'customer-9','booking-9','booking_confirmed',true,
 '{"bookingDate":"2026-11-20","bookingTime":"14:00"}');
 select updated_at into stamp from public.busy_mini_app_requests where id=fail_id;
 select count(*) into events_before from public.busy_mini_app_request_events
 where request_id=fail_id;
 -- Failure is injected by a trigger created below in this transaction.
 perform pg_catalog.set_config('bdi.ci_fail_booking_id',fail_id::text,true);
end $$;

create function public.ci_v3232_fail_work_cancel() returns trigger
language plpgsql as $$
begin
 if new.request_id::text =
    pg_catalog.current_setting('bdi.ci_fail_booking_id',true)
    and new.state='cancelled' then
  raise exception 'CI injected durable Work cancellation failure';
 end if;
 return new;
end $$;
create trigger ci_v3232_fail_work_cancel before update
on public.busy_mini_app_work_bookings for each row
execute function public.ci_v3232_fail_work_cancel();

do $$
declare
 b uuid:='11111111-1111-4111-8111-111111111111';
 o uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 r uuid:='99999999-9999-4999-8999-999999999999';
 stamp timestamptz;
 before_events integer;
 did_fail boolean:=false;
begin
 select updated_at into stamp from public.busy_mini_app_requests where id=r;
 select count(*) into before_events from public.busy_mini_app_request_events
  where request_id=r;
 begin
  perform public.busy_close_linked_booking_current_v3232(
   b,r,o,'customer-9','booking-9','accepted',stamp);
 exception when others then did_fail:=true;end;
 if not did_fail then raise exception 'Work cancellation failure did not fire';end if;
 if (select status from public.busy_mini_app_requests where id=r)<>'accepted' or
    (select bridge_state from public.busy_mini_app_request_links
     where request_id=r)<>'booking_confirmed' or
    (select state from public.busy_mini_app_work_bookings
     where request_id=r)<>'confirmed' or
    (select count(*) from public.busy_mini_app_request_events
     where request_id=r)<>before_events
 then raise exception 'PARTIAL COMMIT after durable Work cancellation failure';end if;
end $$;
select 'V3.232_ATOMIC_OWNER_BOOKING_CLOSE_AND_FAULT_ROLLBACK_PASS' as verdict;
rollback;
select 'V3.232_DISPOSABLE_DURABLE_WORK_ROLLBACK_PASS' as verdict;
