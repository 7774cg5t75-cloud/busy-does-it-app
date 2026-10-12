\set ON_ERROR_STOP on
-- Disposable postgres ONLY; fake auth identities never leave CI.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create schema auth;
create table auth.users(id uuid primary key);
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc');

\ir ISOLATED_ONLY_business_core_v3180.sql
\ir ../supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql
\ir ../supabase/migrations/20261007101513_v3_40_mini_app_customer_journey_bridge.sql
\ir ../supabase/migrations/20261007133000_v3_42_mini_app_notifications.sql
\ir ../supabase/migrations/20261012183000_v3_180_atomic_business_app_handoff.sql

insert into public.busy_businesses(id,name,created_by) values
 ('11111111-1111-4111-8111-111111111111','Fictional Owner A',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('22222222-2222-4222-8222-222222222222','Fictional Owner B',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.busy_business_memberships(business_id,user_id,role) values
 ('11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner'),
 ('22222222-2222-4222-8222-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','owner');

insert into public.busy_mini_apps(id,business_id,public_slug,display_name)
values ('33333333-3333-4333-8333-333333333333',
 '11111111-1111-4111-8111-111111111111','fictional-a','Fictional App');
insert into public.busy_mini_app_requests(
 id,business_id,mini_app_id,consumer_user_id,module_key,request_type,status
) values
 ('44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  '33333333-3333-4333-8333-333333333333',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc','booking_request','booking_request','received'),
 ('55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  '33333333-3333-4333-8333-333333333333',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc','booking_request','booking_request','received');

do $$
declare r jsonb; count_events integer; did_fail boolean;
begin
 if has_function_privilege('authenticated',
   'public.busy_mark_mini_app_request_link_v3180(uuid,uuid,uuid,text,text,text,boolean,jsonb)',
   'EXECUTE') then
   raise exception 'Authenticated role can directly call privileged handoff RPC';
 end if;
 if not has_function_privilege('service_role',
   'public.busy_mark_mini_app_request_link_v3180(uuid,uuid,uuid,text,text,text,boolean,jsonb)',
   'EXECUTE') then
   raise exception 'Service role cannot execute owner handoff';
 end if;
 if has_table_privilege('anon','public.busy_business_memberships','SELECT')
 or has_table_privilege('authenticated','public.busy_mini_app_requests','SELECT') then
   raise exception 'Direct client grants are not isolated';
 end if;

 -- Tenant B must never be able to change tenant A even if they know the UUID.
 did_fail:=false;
 begin
 perform public.busy_mark_mini_app_request_link_v3180(
 '11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
 'customer-1','booking-1','booking_draft',false,'{}');
 exception when others then did_fail:=true;
 end;
 if not did_fail then raise exception 'Cross-tenant write was accepted'; end if;

 r:=public.busy_mark_mini_app_request_link_v3180(
 '11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'customer-1','booking-1','booking_draft',false,'{}');
 if r->>'changed'<>'true' or r->>'nextStatus'<>'reviewing' then
   raise exception 'Booking draft was not created';
 end if;

 -- Booked request cannot be marked accepted with an invalid calendar date.
 did_fail:=false;
 begin
 perform public.busy_mark_mini_app_request_link_v3180(
 '11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'customer-1','booking-1','booking_confirmed',true,
 '{"bookingDate":"2026-02-31","bookingTime":"15:00"}');
 exception when others then did_fail:=true;
 end;
 if not did_fail then raise exception 'Invalid booking date accepted'; end if;

 r:=public.busy_mark_mini_app_request_link_v3180(
 '11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'customer-1','booking-1','booking_confirmed',true,
 '{"bookingDate":"2026-11-12","bookingTime":"15:00"}');
 if r->>'changed'<>'true' or r->>'nextStatus'<>'accepted'
 or (r->>'independentDiaryDeliveryVerified')::boolean then
   raise exception 'Booking confirmation result was invalid';
 end if;
 if (select status from public.busy_mini_app_requests
   where id='44444444-4444-4444-8444-444444444444')<>'accepted'
 or (select customer_unread_count from public.busy_mini_app_requests
   where id='44444444-4444-4444-8444-444444444444')<>1
 or (select bridge_state from public.busy_mini_app_request_links
   where request_id='44444444-4444-4444-8444-444444444444')<>'booking_confirmed' then
   raise exception 'Atomic accepted/link/unread result inconsistent';
 end if;
 select count(*) into count_events from public.busy_mini_app_request_events
 where request_id='44444444-4444-4444-8444-444444444444';
 if count_events<>2 then raise exception 'Unexpected booking events'; end if;
 r:=public.busy_mark_mini_app_request_link_v3180(
 '11111111-1111-4111-8111-111111111111',
 '44444444-4444-4444-8444-444444444444',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'customer-1','booking-1','booking_confirmed',true,
 '{"bookingDate":"2026-11-12","bookingTime":"15:00"}');
 if r->>'changed'<>'false' then raise exception 'Idempotent replay failed'; end if;
 if (select count(*) from public.busy_mini_app_request_events
   where request_id='44444444-4444-4444-8444-444444444444')<>2
 or (select customer_unread_count from public.busy_mini_app_requests
   where id='44444444-4444-4444-8444-444444444444')<>1 then
   raise exception 'Replay caused side effects';
 end if;
end $$;

-- Force a failure during the second write of a draft -> confirmation.
-- Since the RPC is one transaction, neither its link change nor status nor
-- unread can remain committed after an exception from the event insert.
create function public.ci_handoff_failure_v3180() returns trigger
language plpgsql as $$
begin
 if new.request_id='55555555-5555-4555-8555-555555555555'
    and new.event_type='booking_confirmed' then
   raise exception 'CI deliberate request event insert failure';
 end if;
 return new;
end $$;
create trigger ci_handoff_failure_v3180 before insert
on public.busy_mini_app_request_events
for each row execute function public.ci_handoff_failure_v3180();

do $$
declare did_fail boolean:=false;
begin
 perform public.busy_mark_mini_app_request_link_v3180(
 '11111111-1111-4111-8111-111111111111',
 '55555555-5555-4555-8555-555555555555',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'customer-2','booking-2','booking_draft',false,'{}');
 begin
 perform public.busy_mark_mini_app_request_link_v3180(
 '11111111-1111-4111-8111-111111111111',
 '55555555-5555-4555-8555-555555555555',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'customer-2','booking-2','booking_confirmed',true,
 '{"bookingDate":"2026-11-14","bookingTime":"10:00"}');
 exception when others then did_fail:=true;
 end;
 if not did_fail then raise exception 'Fault injection failed'; end if;
 if (select status from public.busy_mini_app_requests
   where id='55555555-5555-4555-8555-555555555555')<>'reviewing'
 or (select bridge_state from public.busy_mini_app_request_links
   where request_id='55555555-5555-4555-8555-555555555555')<>'booking_draft'
 or (select customer_unread_count from public.busy_mini_app_requests
   where id='55555555-5555-4555-8555-555555555555')<>0
 or (select count(*) from public.busy_mini_app_request_events
   where request_id='55555555-5555-4555-8555-555555555555')<>1 then
   raise exception 'PARTIAL COMMIT: failed request handoff left inconsistent state';
 end if;
end $$;

drop trigger ci_handoff_failure_v3180 on public.busy_mini_app_request_events;
drop function public.ci_handoff_failure_v3180();

select 'V3.180 DISPOSABLE POSTGRES ATOMIC HANDOFF PASS' as ci_result;
