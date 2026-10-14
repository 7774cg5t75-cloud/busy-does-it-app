-- Disposable PostgreSQL 16 ONLY, in the transaction opened by generated
-- test script. Real historical V3.39, V3.40, V3.41, V3.42 and V3.45 RPC
-- source is exercised. Never run this fixture against hosted Supabase.
\set ON_ERROR_STOP on

do $$
begin
 if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='busy_mini_app_create_guest_request'
    and p.prosecdef=true) then
  raise exception 'Real V3.45 guest RPC is missing SECURITY DEFINER';
 end if;
 if has_function_privilege('anon',
  'public.busy_mini_app_create_guest_request(uuid,text,text,text,text,jsonb,text,text,text,text,text)', 'execute')
 or has_function_privilege('authenticated',
  'public.busy_mini_app_create_guest_request(uuid,text,text,text,text,jsonb,text,text,text,text,text)', 'execute')
 or not has_function_privilege('service_role',
  'public.busy_mini_app_create_guest_request(uuid,text,text,text,text,jsonb,text,text,text,text,text)', 'execute')
 then
  raise exception 'Guest RPC execution privilege isolation failed';
 end if;
 if has_table_privilege('anon','public.busy_mini_app_requests','select') or
    has_table_privilege('authenticated','public.busy_mini_app_guest_challenges','insert') then
  raise exception 'Guest/private request table unexpectedly exposes direct client access';
 end if;
end $$;

insert into public.busy_businesses(id,name,created_by) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Synthetic Booking Business A',
  '11111111-1111-4111-8111-111111111111'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Synthetic Enquiry Business B',
  '22222222-2222-4222-8222-222222222222');
insert into public.busy_business_memberships(business_id,user_id,role) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','owner'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','owner');

insert into public.busy_mini_apps
 (id,business_id,public_slug,display_name,status,discoverable) values
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'synthetic-a','Example A','live',true),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'synthetic-b','Example B','live',true);
insert into public.busy_mini_app_versions
 (id,business_id,mini_app_id,version_no,config_hash,config,state) values
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',1,
  encode(digest('{}','sha256'),'hex'),'{}'::jsonb,'live'),
 ('ffffffff-ffff-4fff-8fff-ffffffffffff','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',1,
  encode(digest('{"services":[]}','sha256'),'hex'),'{"services":[]}'::jsonb,'live');
update public.busy_mini_apps set
 current_live_version_id=case
  when public_slug='synthetic-a' then 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid
  else 'ffffffff-ffff-4fff-8fff-ffffffffffff'::uuid end;

insert into public.busy_mini_app_guest_challenges
 (id,business_id,mini_app_id,version_id,request_type,
 token_hash,fingerprint_hash,pow_seed,expires_at)
 values
 ('10101010-1010-4010-8010-101010101010','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'enquiry','challenge-token-a','synthetic-fingerprint-a','seed-a',now()+interval '20 minutes'),
 ('20202020-2020-4020-8020-202020202020','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd','ffffffff-ffff-4fff-8fff-ffffffffffff',
  'booking_request','challenge-token-b','synthetic-fingerprint-b','seed-b',now()+interval '20 minutes'),
 ('30303030-3030-4030-8030-303030303030','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'enquiry','challenge-token-expired','synthetic-fingerprint-expired','seed-c',now()-interval '1 minute');

do $$
declare
 v_a uuid;
 v_a_again uuid;
 v_a_changed uuid;
 v_b uuid;
 v_expected jsonb:='{"name":"Synthetic Guest","email":"synthetic@example.test","phone":"","service":"","message":"Example enquiry"}'::jsonb;
begin
 -- A valid request is atomically created once with one corresponding event.
 v_a:=public.busy_mini_app_create_guest_request(
 '10101010-1010-4010-8010-101010101010',
 'synthetic-fingerprint-a','contact-a','guest-access-a','idempotent-a',
 v_expected,'Synthetic Guest','synthetic@example.test',null,null,null);
 if v_a is null or
  (select count(*) from public.busy_mini_app_requests
   where guest_challenge_id='10101010-1010-4010-8010-101010101010')<>1 or
  (select count(*) from public.busy_mini_app_request_events where request_id=v_a)<>1
 then raise exception 'Guest request did not save atomically with one event'; end if;
 -- The same consumed challenge returns the SAME original ID without
 -- creating a second business inbox item, event, booking or notification.
 v_a_again:=public.busy_mini_app_create_guest_request(
 '10101010-1010-4010-8010-101010101010',
 'synthetic-fingerprint-a','contact-a','guest-access-a','idempotent-a',
 v_expected,'Synthetic Guest','synthetic@example.test',null,null,null);
 if v_a_again is distinct from v_a then
  raise exception 'Guest challenge replay was not idempotent'; end if;
 -- Critical original RPC behavior: a consumed challenge will also return
 -- the first ID even when passed a CHANGED payload. The V3.224 edge-side
 -- stored-payload proof MUST reject calling this a new saved request.
 v_a_changed:=public.busy_mini_app_create_guest_request(
 '10101010-1010-4010-8010-101010101010',
 'synthetic-fingerprint-a','contact-a','guest-access-a','changed-key',
 '{"name":"Different"}'::jsonb,'Different','other@example.test',null,null,null);
 if v_a_changed is distinct from v_a or
  (select payload from public.busy_mini_app_requests where id=v_a) is distinct from v_expected
 then raise exception 'Consumed challenge replay changed committed data'; end if;

 -- Second distinct business has a distinct app/request, no mixed tenancy.
 v_b:=public.busy_mini_app_create_guest_request(
 '20202020-2020-4020-8020-202020202020',
 'synthetic-fingerprint-b','contact-b','guest-access-b','idempotent-b',
 '{"name":"Another","email":"","phone":"","service":"Tour","preferredDate":"2026-11-01","note":""}'::jsonb,
 'Another',null,null,'Tour','2026-11-01');
 if v_b=v_a or
  (select business_id from public.busy_mini_app_requests where id=v_b)
   <> 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid
 then raise exception 'Customer request was not correctly scoped to business B'; end if;
 if (select count(*) from public.busy_mini_app_requests)<>2 or
  (select count(*) from public.busy_mini_app_request_events)<>2 then
  raise exception 'Duplicate rows or events appeared across distinct businesses'; end if;
 if (select state from public.busy_mini_app_guest_challenges
  where id='10101010-1010-4010-8010-101010101010')<>'consumed' then
  raise exception 'Original challenge was not consumed'; end if;
 if (select request_origin from public.busy_mini_app_requests where id=v_a)<>'guest_web'
 or (select identity_assurance from public.busy_mini_app_requests where id=v_b)
     <>'guest_browser_challenge' then
  raise exception 'Request origin/assurance was not persisted'; end if;

 -- Real Postgres constraints reject late, invalid fingerprint and changes
 -- in exact app version, and must leave original request/event count intact.
 begin
  perform public.busy_mini_app_create_guest_request(
   '30303030-3030-4030-8030-303030303030',
   'synthetic-fingerprint-expired',null,'new-access',null,
   '{}'::jsonb,'Nope',null,null,null,null);
  raise exception 'Expired challenge unexpectedly accepted';
 exception when others then
  if sqlerrm = 'Expired challenge unexpectedly accepted' then raise; end if;
 end;
 if (select count(*) from public.busy_mini_app_requests)<>2 then
  raise exception 'Failed challenge introduced a request'; end if;
end $$;

-- Test transaction-only rollback: no provider calls, cron job, real auth
-- session, production rows or hosted Supabase records were created.
rollback;
do $$
begin
 if to_regclass('public.busy_mini_app_requests') is not null or
    to_regclass('public.busy_mini_app_guest_challenges') is not null or
    to_regclass('public.busy_businesses') is not null or
    to_regclass('auth.users') is not null then
  raise exception 'Disposable guest RPC transaction was not rolled back';
 end if;
end $$;
select 'V3.225_EPHEMERAL_GUEST_RPC_ROLLBACK_PASS' as disposable_guest_rpc_result;
