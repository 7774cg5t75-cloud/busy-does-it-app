-- V3.184: one database transaction for real signed-in Business App conversations.
-- Stage in the approved isolated project before production; no provider delivery.
-- Uses service_role only, but independently verifies actor/business ownership.
create or replace function public.busy_send_mini_app_message_v3184(
 p_actor_user_id uuid,p_business_id uuid,p_request_id uuid,
 p_sender_role text,p_body text,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_req public.busy_mini_app_requests%rowtype;
 v_msg public.busy_mini_app_request_messages%rowtype;
 v_found boolean:=false;
 v_review boolean:=false;
begin
 if p_actor_user_id is null or p_business_id is null or p_request_id is null
  or p_sender_role not in ('business','customer')
  or p_body is null or length(btrim(p_body)) not between 1 and 3000
  or p_idempotency_key is null
  or length(p_idempotency_key) not between 8 and 180
  or p_idempotency_key !~ '^[A-Za-z0-9:_-]+$'
 then raise exception 'Valid signed-in actor, message and idempotency key required'; end if;

 -- Locks the request for this entire transaction; serializes concurrent
 -- replies, cancellations and status moves (the same lock as V3.180/181).
 select * into v_req from public.busy_mini_app_requests
  where id=p_request_id and business_id=p_business_id for update;
 if not found then raise exception 'Request unavailable for this business'; end if;
 -- Use optional-column-safe JSON inspection so the disposable early-schema
 -- fixture is testable; real guest requests still require signed-in identity.
 if coalesce(to_jsonb(v_req)->>'request_origin','')='guest_web'
  or v_req.consumer_user_id is null
 then raise exception 'Guest enquiries have no in-app chat recipient'; end if;
 if p_sender_role='business' then
  if not exists(select 1 from public.busy_business_memberships m
   where m.business_id=p_business_id and m.user_id=p_actor_user_id
    and m.role in ('owner','admin')) then
    raise exception 'An owner or admin membership is required';
  end if;
 elsif v_req.consumer_user_id is distinct from p_actor_user_id then
  raise exception 'Only the original request customer can reply';
 end if;

 -- A retry is read under the same row lock. Refuse reusing a key for different
 -- message content rather than silently changing the owner's words.
 select * into v_msg from public.busy_mini_app_request_messages
  where request_id=p_request_id and sender_user_id=p_actor_user_id
   and idempotency_key=p_idempotency_key;
 v_found:=found;
 if v_found then
  if v_msg.body is distinct from p_body or v_msg.sender_role<>p_sender_role then
   raise exception 'Conflicting message replay; refresh conversation'; end if;
  return jsonb_build_object('changed',false,'message',to_jsonb(v_msg),
   'databaseMessageSaved',true,'providerDeliveryVerified',false);
 end if;
 if v_req.status in ('closed','declined') then
  raise exception 'Closed requests cannot accept new messages'; end if;

 insert into public.busy_mini_app_request_messages
  (business_id,request_id,mini_app_id,sender_user_id,
   sender_role,body,idempotency_key)
 values (p_business_id,p_request_id,v_req.mini_app_id,p_actor_user_id,
   p_sender_role,p_body,p_idempotency_key) returning * into v_msg;
 v_review:=p_sender_role='business' and v_req.status='received';
 if v_review then
  insert into public.busy_mini_app_request_events
   (business_id,request_id,actor_user_id,event_type,detail)
  values(p_business_id,p_request_id,p_actor_user_id,'reviewing',
   jsonb_build_object('source','atomic_conversation_v3184'));
 end if;
 update public.busy_mini_app_requests set
  status=case when v_review then 'reviewing' else status end,
  updated_at=now(),
  customer_unread_count=coalesce(customer_unread_count,0)+
   case when p_sender_role='business' then 1 else 0 end,
  business_unread_count=coalesce(business_unread_count,0)+
   case when p_sender_role='customer' then 1 else 0 end
  where id=p_request_id and business_id=p_business_id;
 return jsonb_build_object('changed',true,'message',to_jsonb(v_msg),
  'databaseMessageSaved',true,'providerDeliveryVerified',false);
end;
$$;
revoke all on function public.busy_send_mini_app_message_v3184(
 uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.busy_send_mini_app_message_v3184(
 uuid,uuid,uuid,text,text,text) to service_role;
comment on function public.busy_send_mini_app_message_v3184(
 uuid,uuid,uuid,text,text,text) is
 'Atomic owner/customer message, review event and unread counter with tenant and idempotency checks. Not a delivery receipt.';
