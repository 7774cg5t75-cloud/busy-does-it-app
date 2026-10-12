\set ON_ERROR_STOP on
-- Uses an ephemeral PostgreSQL 17 service, never the hosted staging project.
\ir ci-atomic-conversations-v3184.sql
\ir ../supabase/migrations/20261012211000_v3_185_durable_message_delivery_intent.sql
do $$
declare
 r uuid:='66666666-6666-4666-8666-666666666666';
 tenant uuid:='11111111-1111-4111-8111-111111111111';
 owner_id uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 customer_id uuid:='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 result jsonb; outbox_id uuid; rejected boolean;
begin
 if has_function_privilege('authenticated',
  'public.busy_send_mini_app_message_v3185(uuid,uuid,uuid,text,text,text)','execute') or
  has_table_privilege('authenticated','public.busy_mini_app_message_delivery_outbox','select')
 then raise exception 'Direct client access allowed to message intent';end if;
 if has_function_privilege('service_role',
  'public.busy_send_mini_app_message_v3184(uuid,uuid,uuid,text,text,text)','execute')
 then raise exception 'Old message path can bypass new outbox';end if;
 result:=public.busy_send_mini_app_message_v3185(
  owner_id,tenant,r,'business','Hello, we can do Tuesday.','retry-owner-one');
 if result->>'changed'<>'false' or result->>'deliveryIntentDurable'<>'true' then
  raise exception 'Earlier message replay did not reconcile delivery intent';end if;
 outbox_id:=(result->>'outboxId')::uuid;
 if outbox_id is null or
  (select count(*) from public.busy_mini_app_message_delivery_outbox
    where request_id=r and recipient_role='customer')<>1 then
  raise exception 'One durable intent per existing message required';end if;
 result:=public.busy_send_mini_app_message_v3185(
  owner_id,tenant,r,'business','Hello, we can do Tuesday.','retry-owner-one');
 if (result->>'outboxId')::uuid<>outbox_id or
  (select count(*) from public.busy_mini_app_message_delivery_outbox
    where request_id=r and recipient_role='customer')<>1 then
  raise exception 'A replay duplicated the delivery intent';end if;

 result:=public.busy_record_mini_app_push_submission_v3185(
  tenant,outbox_id,3);
 if result->>'state'<>'submitted_unverified' or
   result->>'providerDeliveryVerified'<>'false' or
   (result->>'attemptCount')::int<>1 then
  raise exception 'Submission attempt was mistaken for delivery';end if;
 rejected:=false;
 begin
  perform public.busy_record_mini_app_push_submission_v3185(
   '22222222-2222-4222-8222-222222222222',outbox_id,99);
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Wrong business updated delivery intent';end if;
 rejected:=false;
 begin
  perform public.busy_record_mini_app_push_submission_v3185(tenant,outbox_id,-3);
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Negative submitted token count accepted';end if;

 result:=public.busy_send_mini_app_message_v3185(
  customer_id,tenant,r,'customer','Please also bring the blue item.','retry-customer-two');
 if result->>'changed'<>'true' or
  (select recipient_role from public.busy_mini_app_message_delivery_outbox
    where id=(result->>'outboxId')::uuid)<>'business' then
  raise exception 'Customer message did not create correct owner intent';end if;
end $$;

-- Inject a fault at the last outbox write to show that the earlier
-- message, history event, and unread update did NOT persist.
create function public.ci_fail_message_intent_v3185() returns trigger
language plpgsql as $$
begin
 if new.request_id='77777777-7777-4777-8777-777777777777' then
  raise exception 'CI injected notification intent failure';
 end if;
 return new;
end $$;
create trigger ci_fail_message_intent_v3185 before insert
 on public.busy_mini_app_message_delivery_outbox
 for each row execute function public.ci_fail_message_intent_v3185();
do $$
declare
 failed boolean:=false; r uuid:='77777777-7777-4777-8777-777777777777';
begin
 begin
  perform public.busy_send_mini_app_message_v3185(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    r,'business','We have your enquiry.','outbox-fault-one');
 exception when others then failed:=true;end;
 if not failed then raise exception 'Fault-injection failed to fire';end if;
 if (select count(*) from public.busy_mini_app_request_messages where request_id=r)<>0
  or (select count(*) from public.busy_mini_app_message_delivery_outbox where request_id=r)<>0
  or (select status from public.busy_mini_app_requests where id=r)<>'received'
  or (select customer_unread_count from public.busy_mini_app_requests where id=r)<>0
 then raise exception 'PARTIAL COMMIT: outbox failure left a message or unread';end if;
end $$;
drop trigger ci_fail_message_intent_v3185 on public.busy_mini_app_message_delivery_outbox;
drop function public.ci_fail_message_intent_v3185();
select 'V3.185 DURABLE MESSAGE AND DELIVERY INTENT POSTGRES PASS' as result;
