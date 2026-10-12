-- V3.181 — durable BUSY Work booking source for Business App requests.
-- Isolated staging first. Never apply to production without separate approval.
-- The same PostgreSQL transaction covers request, link, event, unread and ledger.
-- Neither this record nor a local booking implies Google Calendar delivery.

create table if not exists public.busy_mini_app_work_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  request_id uuid not null unique references public.busy_mini_app_requests(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  customer_record_id text not null,
  action_record_id text not null,
  calendar_date date not null,
  calendar_time time without time zone not null,
  calendar_timezone text not null default 'Europe/London',
  state text not null check (state in ('confirmed','cancelled')),
  source text not null default 'business_app_request_v3181'
    check (source='business_app_request_v3181'),
  confirmed_by uuid not null references auth.users(id),
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint busy_work_booking_customer_len check
    (length(customer_record_id) between 1 and 160),
  constraint busy_work_booking_action_len check
    (length(action_record_id) between 1 and 160),
  constraint busy_work_booking_cancelled_consistency check
    ((state='confirmed' and cancelled_at is null) or
     (state='cancelled' and cancelled_at is not null))
);
create index if not exists busy_mini_app_work_bookings_calendar_idx
  on public.busy_mini_app_work_bookings
  (business_id,state,calendar_date,calendar_time);
create index if not exists busy_mini_app_work_bookings_app_idx
  on public.busy_mini_app_work_bookings
  (business_id,mini_app_id,updated_at desc);
alter table public.busy_mini_app_work_bookings enable row level security;
alter table public.busy_mini_app_work_bookings force row level security;
revoke all on public.busy_mini_app_work_bookings from public,anon,authenticated;
grant select,insert,update,delete on public.busy_mini_app_work_bookings to service_role;

create or replace function public.busy_mark_mini_app_request_link_v3181(
 p_business_id uuid, p_request_id uuid, p_actor_user_id uuid,
 p_customer_record_id text, p_action_record_id text,
 p_bridge_state text, p_owner_approved boolean default false,
 p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
 v_out jsonb;
 v_link public.busy_mini_app_request_links%rowtype;
 v_request public.busy_mini_app_requests%rowtype;
 v_work public.busy_mini_app_work_bookings%rowtype;
 v_day date;
 v_at time without time zone;
begin
 -- V3.180 locks the request, checks role, serializes competing writers and
 -- writes the request/link/event/unread atomically. A later failure in THIS
 -- wrapper rolls ALL those writes back in the same database transaction.
 v_out:=public.busy_mark_mini_app_request_link_v3180(
   p_business_id,p_request_id,p_actor_user_id,p_customer_record_id,
   p_action_record_id,p_bridge_state,p_owner_approved,p_metadata
 );
 select * into v_request from public.busy_mini_app_requests
  where business_id=p_business_id and id=p_request_id;
 if not found then raise exception 'Handoff request unavailable'; end if;
 select * into v_link from public.busy_mini_app_request_links
  where business_id=p_business_id and request_id=p_request_id;
 if not found then raise exception 'Handoff link unavailable'; end if;

 if v_request.request_type='booking_request' and p_bridge_state='booking_confirmed' then
   -- The earlier owner-approved V3.180 validation guards date/time.
   v_day:=(p_metadata->>'bookingDate')::date;
   v_at:=(p_metadata->>'bookingTime')::time;
   if v_request.status<>'accepted' or v_link.bridge_state<>'booking_confirmed'
      or p_owner_approved is distinct from true then
     raise exception 'Only approved accepted booking requests can enter BUSY Work';
   end if;
   insert into public.busy_mini_app_work_bookings (
     business_id,request_id,mini_app_id,customer_record_id,action_record_id,
     calendar_date,calendar_time,state,confirmed_by
   ) values (
     p_business_id,p_request_id,v_request.mini_app_id,p_customer_record_id,
     p_action_record_id,v_day,v_at,'confirmed',p_actor_user_id
   )
   on conflict (request_id) do nothing;
   select * into v_work from public.busy_mini_app_work_bookings
     where request_id=p_request_id and business_id=p_business_id for update;
   if not found or v_work.state<>'confirmed' or
      v_work.mini_app_id<>v_request.mini_app_id or
      v_work.customer_record_id<>p_customer_record_id or
      v_work.action_record_id<>p_action_record_id or
      v_work.calendar_date<>v_day or v_work.calendar_time<>v_at then
     raise exception 'Conflicting BUSY Work confirmation; no overwrite permitted';
   end if;
 elsif v_request.request_type='booking_request' and p_bridge_state='closed' then
   -- A cancellation is durable, including when local customer cloud saving fails.
   update public.busy_mini_app_work_bookings
      set state='cancelled',cancelled_at=now(),updated_at=now()
    where request_id=p_request_id and business_id=p_business_id
      and state='confirmed'
   returning * into v_work;
   if not found then
     select * into v_work from public.busy_mini_app_work_bookings
       where request_id=p_request_id and business_id=p_business_id;
   end if;
 end if;
 return v_out || jsonb_build_object(
    'workLedgerState',case when v_work.id is null then 'not_applicable'
      else v_work.state end,
    'workLedgerId',v_work.id,
    'workLedgerDurable',v_work.id is not null,
    'externalCalendarDelivered',false,
    'ownerLocalCloudSnapshotVerified',false,
    'ledgerSource','business_app_request_v3181'
 );
end;
$$;
revoke all on function public.busy_mark_mini_app_request_link_v3181(
 uuid,uuid,uuid,text,text,text,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.busy_mark_mini_app_request_link_v3181(
 uuid,uuid,uuid,text,text,text,boolean,jsonb) to service_role;
comment on function public.busy_mark_mini_app_request_link_v3181(
 uuid,uuid,uuid,text,text,text,boolean,jsonb) is
 'V3.181 atomic BUSY Work ledger + request/link/event/unread, not external calendar delivery.';
