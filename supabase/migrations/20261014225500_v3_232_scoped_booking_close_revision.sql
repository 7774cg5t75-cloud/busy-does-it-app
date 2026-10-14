-- V3.232. SOURCE ONLY: atomically guard the existing durable BUSY Work
-- booking closure against a STALE owner screen. Not hosted, not scheduled.
-- Original V3.180 + V3.181 request/link/event/unread/Work transaction is
-- called exactly once under the SAME request-row lock / DB transaction.
-- This wrapper is *only* for closing a linked booking from the owner's
-- current request status; it is not an alternate booking confirmation API.
create function public.busy_close_linked_booking_current_v3232(
 p_business_id uuid, p_request_id uuid, p_actor_user_id uuid,
 p_customer_record_id text, p_action_record_id text,
 p_expected_status text, p_expected_updated_at timestamptz
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
 v_req public.busy_mini_app_requests%rowtype;
 v_result jsonb;
begin
 if p_business_id is null or p_request_id is null or
    p_actor_user_id is null or p_expected_updated_at is null or
    p_expected_status is null or
    p_expected_status not in ('reviewing','accepted') or
    p_customer_record_id is null or
    p_customer_record_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$' or
    (p_action_record_id is not null and
      p_action_record_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$')
 then raise exception 'The original booking action needs a valid saved revision';end if;
 -- Validate tenant/actor in this function as well as the inner
 -- V3.180 membership guard and authenticated Edge boundary.
 if not exists(
  select 1 from public.busy_business_memberships m
  where m.business_id=p_business_id and m.user_id=p_actor_user_id
    and m.role in ('owner','admin')
 ) then raise exception 'Current owner or admin membership required';end if;

 select * into v_req from public.busy_mini_app_requests
 where id=p_request_id and business_id=p_business_id
 for update;
 if not found or v_req.request_type<>'booking_request' or
    v_req.status is distinct from p_expected_status or
    v_req.updated_at is distinct from p_expected_updated_at
 then raise exception 'Booking request changed; refresh before closing';end if;

 -- NEVER write request/status first and diary second from application code.
 -- PostgreSQL rolls back every inner write if any ledger/event step fails.
 v_result:=public.busy_mark_mini_app_request_link_v3181(
  p_business_id,p_request_id,p_actor_user_id,
  p_customer_record_id,p_action_record_id,'closed',false,'{}'::jsonb
 );
 if v_result->>'nextStatus'<>'closed' or
    v_result->'link'->>'request_id'<>p_request_id::text or
    v_result->'link'->>'business_id'<>p_business_id::text or
    v_result->>'ledgerSource'<>'business_app_request_v3181'
 then raise exception 'Durable Work closure did not reconcile';end if;
 -- For an existing confirmed Work record, the inner V3.181 function
 -- guarantees a cancelled Work ledger in this same transaction.
 if v_result->>'workLedgerState'='confirmed'
 then raise exception 'A confirmed booking remained active after closure';end if;
 return v_result || jsonb_build_object(
  'freshOwnerRevisionVerified',true,
  'atomicBookingCloseVerified',true,
  'originalOwnerStatus',p_expected_status,
  'externalCalendarDelivered',false,
  'customerNotificationDelivered',false,
  'providerDeliveryVerified',false
 );
end;
$$;
revoke all on function public.busy_close_linked_booking_current_v3232(
 uuid,uuid,uuid,text,text,text,timestamptz)
 from public,anon,authenticated;
grant execute on function public.busy_close_linked_booking_current_v3232(
 uuid,uuid,uuid,text,text,text,timestamptz) to service_role;
comment on function public.busy_close_linked_booking_current_v3232(
 uuid,uuid,uuid,text,text,text,timestamptz) is
 'Owner-only CAS and atomic durable Work booking close; no external calendar or customer-delivery proof.';
