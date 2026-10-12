-- V3.185: durable intent for push submission; NOT a delivered notification.
-- The intent is written in the SAME transaction as the V3.184 message.
-- No automatic retry worker: avoid unreviewed repeated sends while Expo
-- delivery receipts and background retry policy remain unverified.
create table if not exists public.busy_mini_app_message_delivery_outbox(
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.busy_businesses(id) on delete cascade,
 mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
 request_id uuid not null references public.busy_mini_app_requests(id) on delete cascade,
 message_id uuid not null unique references public.busy_mini_app_request_messages(id) on delete cascade,
 recipient_role text not null check(recipient_role in('business','customer')),
 state text not null default 'pending'
  check(state in('pending','submitted_unverified','no_submission_evidence')),
 attempt_count integer not null default 0 check(attempt_count between 0 and 100),
 submitted_token_count integer not null default 0 check(submitted_token_count between 0 and 100),
 provider_delivery_verified boolean not null default false
  check(provider_delivery_verified=false),
 last_attempt_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists busy_mini_app_delivery_outbox_owner_review_v3185
 on public.busy_mini_app_message_delivery_outbox
 (business_id,mini_app_id,state,created_at desc);
alter table public.busy_mini_app_message_delivery_outbox enable row level security;
alter table public.busy_mini_app_message_delivery_outbox force row level security;
revoke all on public.busy_mini_app_message_delivery_outbox from public,anon,authenticated;
grant select,insert,update,delete on public.busy_mini_app_message_delivery_outbox to service_role;

create or replace function public.busy_send_mini_app_message_v3185(
 p_actor_user_id uuid,p_business_id uuid,p_request_id uuid,
 p_sender_role text,p_body text,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_saved jsonb;
 v_out public.busy_mini_app_message_delivery_outbox%rowtype;
 v_message_id uuid;
 v_mini_app_id uuid;
begin
 -- Includes locked request+membership, exact replay handling, message,
 -- unread and review-event writes. Everything here is one transaction.
 v_saved:=public.busy_send_mini_app_message_v3184(
  p_actor_user_id,p_business_id,p_request_id,
  p_sender_role,p_body,p_idempotency_key
 );
 v_message_id:=(v_saved->'message'->>'id')::uuid;
 v_mini_app_id:=(v_saved->'message'->>'mini_app_id')::uuid;
 if v_message_id is null or v_mini_app_id is null
  or (v_saved->'message'->>'business_id')::uuid<>p_business_id
  or (v_saved->'message'->>'request_id')::uuid<>p_request_id then
  raise exception 'Message receipt did not match scoped request';
 end if;
 insert into public.busy_mini_app_message_delivery_outbox
  (business_id,mini_app_id,request_id,message_id,recipient_role)
 values (p_business_id,v_mini_app_id,p_request_id,v_message_id,
  case when p_sender_role='business' then 'customer' else 'business' end)
 on conflict(message_id) do nothing;
 select * into v_out from public.busy_mini_app_message_delivery_outbox
  where business_id=p_business_id and request_id=p_request_id
   and message_id=v_message_id for update;
 if not found or v_out.mini_app_id<>v_mini_app_id or
  v_out.recipient_role<>(case when p_sender_role='business'
   then 'customer' else 'business' end) then
  raise exception 'Message delivery intent scope mismatch';
 end if;
 return v_saved || jsonb_build_object(
  'outboxId',v_out.id,'outboxState',v_out.state,
  'deliveryIntentDurable',true,'providerDeliveryVerified',false
 );
end;
$$;
revoke all on function public.busy_send_mini_app_message_v3185(
 uuid,uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.busy_send_mini_app_message_v3185(
 uuid,uuid,uuid,text,text,text) to service_role;
-- Direct service clients may only use the wrapper, never bypass the outbox.
revoke execute on function public.busy_send_mini_app_message_v3184(
 uuid,uuid,uuid,text,text,text) from service_role;

create or replace function public.busy_record_mini_app_push_submission_v3185(
 p_business_id uuid,p_outbox_id uuid,p_submitted_count integer
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.busy_mini_app_message_delivery_outbox%rowtype;
begin
 if p_business_id is null or p_outbox_id is null or p_submitted_count is null
 or p_submitted_count<0 or p_submitted_count>100 then
  raise exception 'Invalid push submission evidence'; end if;
 update public.busy_mini_app_message_delivery_outbox set
   state=case when p_submitted_count>0 then 'submitted_unverified'
     else 'no_submission_evidence' end,
   attempt_count=attempt_count+1,
   submitted_token_count=p_submitted_count,
   last_attempt_at=now(),updated_at=now()
 where id=p_outbox_id and business_id=p_business_id and attempt_count<100
 returning * into v;
 if not found then raise exception 'Push submission not available in this business';end if;
 return jsonb_build_object('state',v.state,'attemptCount',v.attempt_count,
  'submittedTokenCount',v.submitted_token_count,
  'providerDeliveryVerified',false,'customerReceiptVerified',false);
end;
$$;
revoke all on function public.busy_record_mini_app_push_submission_v3185(
 uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.busy_record_mini_app_push_submission_v3185(
 uuid,uuid,integer) to service_role;
