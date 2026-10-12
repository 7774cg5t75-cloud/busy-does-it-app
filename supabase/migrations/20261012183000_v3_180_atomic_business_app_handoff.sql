-- V3.180: one atomic Postgres transaction for a Business App request handoff.
-- Deploy ONLY after isolated staging baseline + prior app migrations are reviewed.
-- Membership must also be checked at the authenticated Edge request boundary.
-- A server-side diary marker is NOT independent proof of Google/Apple delivery.
create or replace function public.busy_mark_mini_app_request_link_v3180(
 p_business_id uuid, p_request_id uuid, p_actor_user_id uuid,
 p_customer_record_id text, p_action_record_id text,
 p_bridge_state text, p_owner_approved boolean default false,
 p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
 v_request public.busy_mini_app_requests%rowtype;
 v_prior public.busy_mini_app_request_links%rowtype;
 v_link public.busy_mini_app_request_links%rowtype;
 v_has_prior boolean := false;
 v_status text;
 v_event text;
 v_day text;
 v_hour text;
 v_date date;
 v_unchanged boolean := false;
begin
 if p_business_id is null or p_request_id is null or p_actor_user_id is null
    or not exists (
       select 1 from public.busy_business_memberships m
       where m.business_id=p_business_id and m.user_id=p_actor_user_id
         and m.role in ('owner','admin')
    ) then
   raise exception 'Owner or admin membership required for this business request';
 end if;
 if p_customer_record_id is null or
    p_customer_record_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$'
    or p_action_record_id is not null and
      (p_action_record_id !~ '^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$')
    or p_bridge_state not in ('linked','enquiry_linked','booking_draft','booking_confirmed','closed')
    or p_metadata is null or jsonb_typeof(p_metadata)<>'object'
    or pg_column_size(p_metadata)>4096 then
   raise exception 'Invalid scoped request handoff';
 end if;

 -- The request row is the serialisation lock for all competing handoffs of
 -- the same request. Every write below succeeds together, or none persists.
 select * into v_request from public.busy_mini_app_requests
 where id=p_request_id and business_id=p_business_id for update;
 if not found then raise exception 'Business request missing or not accessible'; end if;
 if v_request.request_type not in ('booking_request','enquiry') then
   raise exception 'Unsupported request kind'; end if;

 select * into v_prior from public.busy_mini_app_request_links
 where request_id=p_request_id and business_id=p_business_id for update;
 v_has_prior:=found;

 if (v_request.request_type='booking_request' and p_bridge_state='enquiry_linked')
    or (v_request.request_type='enquiry' and p_bridge_state in ('booking_draft','booking_confirmed')) then
   raise exception 'Enquiry and booking handoffs cannot be mixed';
 end if;
 if p_bridge_state in ('booking_draft','booking_confirmed')
    and p_action_record_id is null then
   raise exception 'A booking action record is required';
 end if;
 if v_has_prior then
   if v_prior.customer_record_id<>p_customer_record_id
      or (v_prior.action_record_id is not null and
          v_prior.action_record_id is distinct from p_action_record_id) then
     raise exception 'A linked customer or action cannot be replaced';
   end if;
   if (v_prior.bridge_state='closed' and p_bridge_state<>'closed')
      or (v_prior.bridge_state='booking_confirmed' and p_bridge_state not in ('booking_confirmed','closed'))
      or (v_prior.bridge_state='booking_draft' and p_bridge_state in ('linked','enquiry_linked'))
      or (v_prior.bridge_state='enquiry_linked' and p_bridge_state='linked') then
     raise exception 'Request handoff cannot be downgraded or reopened';
   end if;
 end if;

 v_status:=case when p_bridge_state='booking_confirmed' then 'accepted'
                when p_bridge_state='closed' then 'closed' else 'reviewing' end;
 if v_request.status='closed' then
   if not v_has_prior or v_prior.bridge_state<>'closed' or p_bridge_state<>'closed' then
     raise exception 'Closed request cannot be changed';
   end if;
 elsif v_request.status='declined' then
   raise exception 'Declined request cannot be changed';
 elsif v_request.status='accepted' and v_status not in ('accepted','closed') then
   raise exception 'Accepted request cannot go back to review';
 end if;

 if p_bridge_state='booking_confirmed' then
   v_day:=p_metadata->>'bookingDate';
   v_hour:=p_metadata->>'bookingTime';
   if p_owner_approved is distinct from true or not v_has_prior or
      v_prior.bridge_state not in ('booking_draft','booking_confirmed') or
      v_day is null or v_day !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' or
      v_hour is null or v_hour !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
     raise exception 'Owner-approved draft and valid booking date/time required';
   end if;
   v_date:=make_date(substring(v_day,1,4)::int,
                     substring(v_day,6,2)::int,substring(v_day,9,2)::int);
   if to_char(v_date,'YYYY-MM-DD')<>v_day then
     raise exception 'Invalid booking date'; end if;
 end if;

 if v_has_prior and v_prior.bridge_state=p_bridge_state and
    v_prior.customer_record_id=p_customer_record_id and
    v_prior.action_record_id is not distinct from p_action_record_id and
    v_prior.metadata=p_metadata and v_request.status=v_status then
   v_unchanged:=true;
 end if;
 if v_unchanged then
   return jsonb_build_object('changed',false,'link',to_jsonb(v_prior),
     'previousStatus',v_request.status,'nextStatus',v_request.status,
     'notificationPending',false,
     'independentDiaryDeliveryVerified',false);
 end if;
 if v_has_prior and v_prior.bridge_state=p_bridge_state and
    v_prior.metadata is distinct from p_metadata then
   raise exception 'Conflicting replay: refresh the existing handoff';
 end if;
 if v_request.status='closed' then
   raise exception 'Closed request cannot be changed'; end if;

 if v_has_prior then
   update public.busy_mini_app_request_links set
     action_record_id=p_action_record_id,
     bridge_state=p_bridge_state,metadata=p_metadata,
     linked_by=p_actor_user_id,updated_at=now()
    where id=v_prior.id and business_id=p_business_id
    returning * into v_link;
 else
   insert into public.busy_mini_app_request_links
     (business_id,request_id,customer_record_id,action_record_id,
      bridge_state,linked_by,metadata)
   values (p_business_id,p_request_id,p_customer_record_id,p_action_record_id,
     p_bridge_state,p_actor_user_id,p_metadata)
   returning * into v_link;
 end if;

 v_event:=case when p_bridge_state='booking_draft' then 'booking_draft'
               when p_bridge_state='booking_confirmed' then 'booking_confirmed'
               when p_bridge_state='closed' then 'closed'
               else 'linked_customer' end;
 insert into public.busy_mini_app_request_events
   (business_id,request_id,actor_user_id,event_type,detail)
 values (p_business_id,p_request_id,p_actor_user_id,v_event,
   jsonb_build_object('source','atomic_request_handoff_v3180',
     'bridgeState',p_bridge_state));

 -- Explicitly update unread inside the same commit as the status, not later.
 update public.busy_mini_app_requests
 set status=v_status,updated_at=now(),
     customer_unread_count=coalesce(customer_unread_count,0)+
       case when v_request.consumer_user_id is not null
          and v_request.status is distinct from v_status
          and v_status in ('accepted','closed') then 1 else 0 end
 where id=p_request_id and business_id=p_business_id;

 return jsonb_build_object('changed',true,'link',to_jsonb(v_link),
   'previousStatus',v_request.status,'nextStatus',v_status,
   'notificationPending',v_request.consumer_user_id is not null
     and v_request.status is distinct from v_status
     and v_status in ('accepted','closed'),
   'independentDiaryDeliveryVerified',false);
end
$$;

revoke all on function public.busy_mark_mini_app_request_link_v3180(
 uuid,uuid,uuid,text,text,text,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.busy_mark_mini_app_request_link_v3180(
 uuid,uuid,uuid,text,text,text,boolean,jsonb) to service_role;
comment on function public.busy_mark_mini_app_request_link_v3180(
 uuid,uuid,uuid,text,text,text,boolean,jsonb) is
 'Atomic owner-scoped request/link/event/unread update, no external delivery or independent diary proof.';
