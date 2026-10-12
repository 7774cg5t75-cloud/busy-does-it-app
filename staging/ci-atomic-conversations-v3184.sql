\set ON_ERROR_STOP on
-- Real disposable PostgreSQL transaction test, no hosted Supabase changes.
\ir ci-durable-work-v3181.sql
\ir ../supabase/migrations/20261007125000_v3_41_mini_app_request_messaging.sql
\ir ../supabase/migrations/20261012200000_v3_184_atomic_customer_conversation.sql

do $$
declare response jsonb; r uuid:='66666666-6666-4666-8666-666666666666';
 owner_id uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 customer_id uuid:='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
 tenant uuid:='11111111-1111-4111-8111-111111111111';
 rejected boolean;
begin
 if has_function_privilege('authenticated',
  'public.busy_send_mini_app_message_v3184(uuid,uuid,uuid,text,text,text)','EXECUTE') or
  not has_function_privilege('service_role',
  'public.busy_send_mini_app_message_v3184(uuid,uuid,uuid,text,text,text)','EXECUTE')
 then raise exception 'Chat RPC permissions allow client bypass'; end if;
 rejected:=false;
 begin
  perform public.busy_send_mini_app_message_v3184(
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',tenant,r,
   'business','Impersonated owner','retry-wrong-owner');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Cross-business owner impersonated';end if;
 rejected:=false;
 begin
  perform public.busy_send_mini_app_message_v3184(
   owner_id,'22222222-2222-4222-8222-222222222222',r,
   'business','Wrong business','retry-wrong-scope');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Cross-business request accessed';end if;
 rejected:=false;
 begin
  perform public.busy_send_mini_app_message_v3184(
   owner_id,tenant,r,'customer','Wrong customer','retry-customer-owner');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Owner impersonated request customer';end if;

 response:=public.busy_send_mini_app_message_v3184(
   owner_id,tenant,r,'business','Hello, we can do Tuesday.','retry-owner-one');
 if response->>'changed'<>'true' or response->>'databaseMessageSaved'<>'true'
 or response->>'providerDeliveryVerified'<>'false' then
   raise exception 'Owner message had invalid durable receipt';end if;
 if (select customer_unread_count from public.busy_mini_app_requests
  where id=r)<>1 then raise exception 'Owner unread not incremented';end if;
 response:=public.busy_send_mini_app_message_v3184(
   owner_id,tenant,r,'business','Hello, we can do Tuesday.','retry-owner-one');
 if response->>'changed'<>'false' or
  (select count(*) from public.busy_mini_app_request_messages
    where request_id=r)<>1 then raise exception 'Retry duplicated owner message';end if;
 rejected:=false;
 begin
  perform public.busy_send_mini_app_message_v3184(
   owner_id,tenant,r,'business','Different body','retry-owner-one');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Conflicting body replay accepted';end if;
 response:=public.busy_send_mini_app_message_v3184(
   customer_id,tenant,r,'customer','Tuesday is good.','retry-consumer-one');
 if response->>'changed'<>'true' or
  (select business_unread_count from public.busy_mini_app_requests where id=r)<>2 then
  raise exception 'Customer reply or business unread failed';end if;
 rejected:=false;
 begin
  perform public.busy_send_mini_app_message_v3184(
   customer_id,tenant,r,'customer','Again',null);
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Missing idempotency key accepted';end if;
end $$;

-- Prove event insert failure rolls message INSERT and unread/status back.
insert into public.busy_mini_app_requests
 (id,business_id,mini_app_id,consumer_user_id,module_key,request_type,status)
values
 ('77777777-7777-4777-8777-777777777777',
 '11111111-1111-4111-8111-111111111111',
 '33333333-3333-4333-8333-333333333333',
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'enquiry','enquiry','received');
create function public.ci_fail_chat_event_v3184() returns trigger
language plpgsql as $$
begin
 if new.request_id='77777777-7777-4777-8777-777777777777'
  and new.event_type='reviewing' then
  raise exception 'CI injected owner reviewing event insert failure';
 end if;
 return new;
end $$;
create trigger ci_fail_chat_event_v3184 before insert
 on public.busy_mini_app_request_events
 for each row execute function public.ci_fail_chat_event_v3184();
do $$
declare failed boolean:=false;
begin
 begin
 perform public.busy_send_mini_app_message_v3184(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '11111111-1111-4111-8111-111111111111',
  '77777777-7777-4777-8777-777777777777',
  'business','Can you confirm the details?','ci-event-failure');
 exception when others then failed:=true;end;
 if not failed then raise exception 'Injected event failure not triggered';end if;
 if (select status from public.busy_mini_app_requests
  where id='77777777-7777-4777-8777-777777777777')<>'received'
 or (select customer_unread_count from public.busy_mini_app_requests
  where id='77777777-7777-4777-8777-777777777777')<>0
 or (select count(*) from public.busy_mini_app_request_messages
  where request_id='77777777-7777-4777-8777-777777777777')<>0 then
  raise exception 'PARTIAL COMMIT: chat sent without corresponding audit and status';
 end if;
end $$;
drop trigger ci_fail_chat_event_v3184 on public.busy_mini_app_request_events;
drop function public.ci_fail_chat_event_v3184();
select 'V3.184 DISPOSABLE ATOMIC CONVERSATION PASS' as ci_result;
