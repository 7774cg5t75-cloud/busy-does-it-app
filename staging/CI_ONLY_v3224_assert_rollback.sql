-- CI-only assertions execute in the same transaction after the V3.180
-- staging-only business baseline. Rollback MUST remove all created objects.
\set ON_ERROR_STOP on
do $$
begin
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='busy_businesses'
    and c.relrowsecurity=true and c.relforcerowsecurity=true) then
  raise exception 'Business table FORCE RLS missing';
 end if;
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname='busy_business_memberships'
    and c.relrowsecurity=true and c.relforcerowsecurity=true) then
  raise exception 'Membership table FORCE RLS missing';
 end if;
 if has_table_privilege('anon','public.busy_businesses','select') or
    has_table_privilege('authenticated','public.busy_businesses','insert') or
    has_table_privilege('authenticated','public.busy_business_memberships','select') or
    has_table_privilege('anon','public.busy_business_memberships','update') then
  raise exception 'Direct client privilege leaked';
 end if;
 if not has_table_privilege('service_role','public.busy_businesses','insert') or
    not has_table_privilege('service_role','public.busy_business_memberships','select') then
  raise exception 'Server-only privileges missing';
 end if;
end $$;

-- Exercise real FK constraints and role allowlist with independent fictional
-- owners; no genuine JWT tests are possible in this disposable mock.
insert into public.busy_businesses(id,name,created_by) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Synthetic Business A',
  '11111111-1111-4111-8111-111111111111'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Synthetic Business B',
  '22222222-2222-4222-8222-222222222222');
insert into public.busy_business_memberships(business_id,user_id,role) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','owner'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','owner');
do $$
begin
 if (select count(*) from public.busy_businesses)<>2 or
    (select count(*) from public.busy_business_memberships)<>2 then
  raise exception 'Synthetic baseline rows not recorded';
 end if;
end $$;

rollback;
select case when to_regclass('public.busy_businesses') is null
 and to_regclass('public.busy_business_memberships') is null
 and to_regclass('auth.users') is null
 and not exists (select 1 from pg_roles where rolname in
  ('service_role','anon','authenticated'))
 then 'V3.224_EPHEMERAL_BASELINE_ROLLBACK_PASS'
 else 'V3.224_EPHEMERAL_ROLLBACK_FAILED' end as disposable_rollback_result;
