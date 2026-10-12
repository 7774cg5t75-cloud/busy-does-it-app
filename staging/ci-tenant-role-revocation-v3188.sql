\set ON_ERROR_STOP on
-- Disposable PostgreSQL role/revocation rehearsal. DOES NOT simulate
-- Supabase Auth JWT validation or a real hosted edge function.
\ir ci-full-customer-journey-v3187.sql
do $$
declare owner_a uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 tenant_a uuid:='11111111-1111-4111-8111-111111111111';
 v_request uuid:='55555555-5555-4555-8555-555555555555';
 before_unread integer;
 blocked boolean:=false;
 saved jsonb;
begin
 if has_table_privilege('anon','public.busy_business_memberships','select') or
    has_table_privilege('authenticated','public.busy_business_memberships','select') or
    has_table_privilege('authenticated','public.busy_mini_app_request_messages','insert') or
    has_table_privilege('authenticated','public.busy_mini_app_message_delivery_outbox','select') then
   raise exception 'Authenticated or anonymous role can read/write private tenant tables';end if;
 if has_function_privilege('authenticated',
  'public.busy_send_mini_app_message_v3185(uuid,uuid,uuid,text,text,text)','execute') or
  has_function_privilege('authenticated',
  'public.busy_mark_mini_app_request_link_v3181(uuid,uuid,uuid,text,text,text,boolean,jsonb)','execute')
 then raise exception 'Untrusted role can directly execute elevated RPCs';end if;
 if (select not relrowsecurity or not relforcerowsecurity from pg_class
   where oid='public.busy_mini_app_message_delivery_outbox'::regclass) then
   raise exception 'Private message outbox is missing forced row security';end if;

 select customer_unread_count into before_unread
 from public.busy_mini_app_requests where id=v_request;

 -- Membership removal is the actual revocation mechanism.
 delete from public.busy_business_memberships
  where business_id=tenant_a and user_id=owner_a;
 begin
  perform public.busy_send_mini_app_message_v3185(
   owner_a,tenant_a,v_request,'business',
   'I should not be able to send this','v3188-denied-revoked');
 exception when others then blocked:=true;end;
 if not blocked then raise exception 'Revoked owner still sent a message';end if;
 if (select count(*) from public.busy_mini_app_request_messages
   where request_id=v_request and body='I should not be able to send this')<>0
 then raise exception 'Revoked message still committed';end if;
 if (select customer_unread_count from public.busy_mini_app_requests
   where id=v_request)<>before_unread
 then raise exception 'Revoked message modified unread';end if;

 insert into public.busy_business_memberships(business_id,user_id,role)
 values(tenant_a,owner_a,'owner');
 saved:=public.busy_send_mini_app_message_v3185(
   owner_a,tenant_a,v_request,'business',
   'I am authorized to reply again','v3188-restored-owner');
 if saved->>'changed'<>'true' or saved->>'deliveryIntentDurable'<>'true'
 then raise exception 'Restored owner could not send and save outbox';end if;
 if (select customer_unread_count from public.busy_mini_app_requests
    where id=v_request)<>before_unread+1
 then raise exception 'Restored owner unread update failed';end if;
end $$;
select 'V3.188 POSTGRES TENANT REVOCATION AND PRIVATE RPC CONTRACT PASS' as ci_result;
