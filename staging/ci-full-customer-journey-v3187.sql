\set ON_ERROR_STOP on
-- V3.187 complete fictional customer path, disposable PostgreSQL 17 ONLY.
-- Does not provide signed JWT/RLS API proof; requires isolated staging later.
\ir ci-message-delivery-outbox-v3185.sql
do $$
declare
 tenant uuid:='11111111-1111-4111-8111-111111111111';
 other uuid:='22222222-2222-4222-8222-222222222222';
 app uuid:='33333333-3333-4333-8333-333333333333';
 booking uuid:='99999999-9999-4999-8999-999999999999';
 owner_id uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 customer_id uuid:='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 receipt jsonb; earlier integer; rejected boolean;
begin
 insert into public.busy_mini_app_requests(
  id,business_id,mini_app_id,consumer_user_id,module_key,request_type,status
 ) values (booking,tenant,app,customer_id,'booking_request','booking_request','received');
 receipt:=public.busy_send_mini_app_message_v3185(
  owner_id,tenant,booking,'business','Your request is being reviewed.',
  'v3187-owner-message');
 if receipt->>'changed'<>'true' or receipt->>'deliveryIntentDurable'<>'true'
  or (select status from public.busy_mini_app_requests where id=booking)<>'reviewing'
 then raise exception 'Owner reply did not save request review and outbox';end if;
 receipt:=public.busy_send_mini_app_message_v3185(
  customer_id,tenant,booking,'customer','Friday afternoon please.',
  'v3187-customer-message');
 if receipt->>'changed'<>'true' or
  (select count(*) from public.busy_mini_app_message_delivery_outbox where request_id=booking)<>2
 then raise exception 'Customer reply or owner outbox missing';end if;
 select count(*) into earlier from public.busy_mini_app_request_messages where request_id=booking;
 receipt:=public.busy_send_mini_app_message_v3185(
  owner_id,tenant,booking,'business','Your request is being reviewed.',
  'v3187-owner-message');
 if receipt->>'changed'<>'false' or
  (select count(*) from public.busy_mini_app_request_messages where request_id=booking)<>earlier
 then raise exception 'Ambiguous retry inserted a duplicate';end if;
 receipt:=public.busy_mark_mini_app_request_link_v3181(
  tenant,booking,owner_id,'customer-999','booking-999','booking_draft',false,'{}');
 if receipt->>'changed'<>'true' then raise exception 'Booking draft not saved';end if;
 receipt:=public.busy_mark_mini_app_request_link_v3181(
  tenant,booking,owner_id,'customer-999','booking-999','booking_confirmed',true,
  '{"bookingDate":"2026-11-13","bookingTime":"15:00","timeZone":"Europe/London"}');
 if receipt->>'workLedgerState'<>'confirmed' or
  (select status from public.busy_mini_app_requests where id=booking)<>'accepted' or
  (select count(*) from public.busy_mini_app_work_bookings
     where business_id=tenant and request_id=booking and state='confirmed')<>1
 then raise exception 'Customer request and Work confirmation diverged';end if;
 receipt:=public.busy_mark_mini_app_request_link_v3181(
  tenant,booking,owner_id,'customer-999','booking-999','booking_confirmed',true,
  '{"bookingDate":"2026-11-13","bookingTime":"15:00","timeZone":"Europe/London"}');
 if receipt->>'changed'<>'false' or
  (select count(*) from public.busy_mini_app_work_bookings where request_id=booking)<>1
 then raise exception 'Confirmation retry duplicated the Work booking';end if;
 rejected:=false;
 begin
  perform public.busy_mark_mini_app_request_link_v3181(
   other,booking,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'customer-999','booking-999','closed',false,'{}');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Other business closed this booking';end if;
 receipt:=public.busy_mark_mini_app_request_link_v3181(
  tenant,booking,owner_id,'customer-999','booking-999','closed',false,'{}');
 if receipt->>'workLedgerState'<>'cancelled' or
  (select status from public.busy_mini_app_requests where id=booking)<>'closed'
 then raise exception 'Cancellation did not update request and Work together';end if;
 rejected:=false;
 begin
  perform public.busy_send_mini_app_message_v3185(
   customer_id,tenant,booking,'customer','Can I rebook?','v3187-closed-message');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Closed request accepted a message';end if;
 if (select count(*) from public.busy_mini_app_request_messages where request_id=booking)<>2
  or (select count(*) from public.busy_mini_app_work_bookings
       where request_id=booking and state='cancelled')<>1
 then raise exception 'Final saved journey evidence inconsistent';end if;
end $$;
select 'V3.187 FULL FICTIONAL DATABASE JOURNEY PASS; JWT AND DEVICE UNVERIFIED' as result;
