-- V3.130 STAGING-ONLY. NOT a production migration; do not run automatically.
-- Required first: in the NEW isolated Supabase staging project only, create
-- TWO REAL fictional Supabase Auth users in Authentication > Users > Add user:
-- bdi-stage-owner-a@example.invalid and bdi-stage-owner-b@example.invalid
-- Use distinct unique strong passwords stored in a password manager.
-- Confirm BOTH fictitious users in the Auth dashboard.
-- This SQL NEVER creates/modifies auth.users, passwords, roles or JWTs.
--
-- When explicitly authorised AFTER accounts exist, run this SQL in
-- project pnjdlogwegnqbsfpcofw ONLY, and verify its output independently.
-- All preview data/IDs are FICTIONAL. No customers or provider connections.
begin;
do $staging$
declare
  a uuid;
  b uuid;
  owner_count integer;
begin
  select count(*), (array_agg(id))[1] into owner_count,a
    from auth.users where email = 'bdi-stage-owner-a@example.invalid';
  if owner_count <> 1 or a is null then
    raise exception 'Expected precisely one fictional staging owner A Auth user';
  end if;
  select count(*), (array_agg(id))[1] into owner_count,b
    from auth.users where email = 'bdi-stage-owner-b@example.invalid';
  if owner_count <> 1 or b is null or a=b then
    raise exception 'Expected distinct fictional staging owner B Auth user';
  end if;
  -- If the supposedly immutable row ID exists under another user, abort.
  if exists(
    select 1 from public.busy_staging_rls_canary
    where (id='20f9279e-0dcf-4b1b-aad0-4952c4aab332'::uuid and owner_id<>a)
       or (id='0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf'::uuid and owner_id<>b)
  ) then
    raise exception 'Existing staging row owner mismatch: refusing to overwrite';
  end if;
  insert into public.busy_staging_rls_canary(id,owner_id,marker)
  values
    ('20f9279e-0dcf-4b1b-aad0-4952c4aab332'::uuid,a,'fictional-gardening-owner-a'),
    ('0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf'::uuid,b,'fictional-catering-owner-b')
  on conflict (id) do nothing;
  if (select count(*) from public.busy_staging_rls_canary
      where (id='20f9279e-0dcf-4b1b-aad0-4952c4aab332'::uuid and owner_id=a)
         or (id='0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf'::uuid and owner_id=b))<>2 then
    raise exception 'Two independent fictional staging owner rows are required';
  end if;
end $staging$;
commit;
-- This setup is NOT an Auth sign-in test and is NOT proof of RLS over HTTP.
-- Real login JWTs must come from Supabase Auth, not SQL-generated claims.
