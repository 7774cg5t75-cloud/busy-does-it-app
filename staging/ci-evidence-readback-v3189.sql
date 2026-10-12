\set ON_ERROR_STOP on
-- Disposable PostgreSQL 17 only: no hosted Supabase, JWT or real customers.
\ir ci-tenant-role-revocation-v3188.sql
do $$
declare
 b uuid:='11111111-1111-4111-8111-111111111111';
 other_b uuid:='22222222-2222-4222-8222-222222222222';
 owner_a uuid:='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 owner_b uuid:='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 request_a uuid:='55555555-5555-4555-8555-555555555555';
 before_messages integer; before_outbox integer; before_unread integer;
 rejected boolean;
begin
 select count(*) into before_messages from public.busy_mini_app_request_messages
  where request_id=request_a;
 select count(*) into before_outbox from public.busy_mini_app_message_delivery_outbox
  where request_id=request_a;
 select customer_unread_count into before_unread from public.busy_mini_app_requests
  where id=request_a;
 -- A replay key cannot be reused to save different customer-facing text.
 rejected:=false;
 begin
  perform public.busy_send_mini_app_message_v3185(owner_a,b,request_a,
   'business','Changed text must NOT overwrite saved message','v3188-restored-owner');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Different message text reused the same key';end if;
 -- Switching the business on an otherwise valid request must be denied.
 rejected:=false;
 begin
  perform public.busy_send_mini_app_message_v3185(owner_b,other_b,request_a,
   'business','Wrong tenant must NOT reply','v3189-other-business');
 exception when others then rejected:=true;end;
 if not rejected then raise exception 'Other business replied to tenant A';end if;
 if (select count(*) from public.busy_mini_app_request_messages
      where request_id=request_a)<>before_messages
  or (select count(*) from public.busy_mini_app_message_delivery_outbox
      where request_id=request_a)<>before_outbox
  or (select customer_unread_count from public.busy_mini_app_requests
      where id=request_a)<>before_unread
 then raise exception 'Rejected replay or foreign tenant wrote partial state';end if;
end $$;
select 'V3.189 CROSS-TENANT AND REPLAY CONTRACT PASS; JWT STILL UNTESTED' as result;
