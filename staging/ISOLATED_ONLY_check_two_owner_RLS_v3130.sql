-- V3.130 staging-only owner-isolation regression.
-- This is a PostgreSQL role/JWT-claim simulation, NOT genuine signed JWT Auth.
-- All statements execute in a transaction and roll back session settings.
-- Project scope: pnjdlogwegnqbsfpcofw only.
begin;
do $guard$
declare
  owner_a uuid;
  owner_b uuid;
  visible_a integer;
  visible_b integer;
begin
  select owner_id into strict owner_a
  from public.busy_staging_rls_canary
  where id='20f9279e-0dcf-4b1b-aad0-4952c4aab332';
  select owner_id into strict owner_b
  from public.busy_staging_rls_canary
  where id='0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf';
  if owner_a = owner_b then
    raise exception 'Staging test owners are not distinct';
  end if;
  perform set_config('request.jwt.claim.sub',owner_a::text,true);
  execute 'set local role authenticated';
  select count(*) into visible_a from public.busy_staging_rls_canary;
  if visible_a <> 1 then
    raise exception 'Owner A RLS visibility is not exactly one record';
  end if;
  perform set_config('request.jwt.claim.sub',owner_b::text,true);
  select count(*) into visible_b from public.busy_staging_rls_canary;
  if visible_b <> 1 then
    raise exception 'Owner B RLS visibility is not exactly one record';
  end if;
  execute 'reset role';
end $guard$;
rollback;
-- Passing this SQL validates database policy execution only.
-- Genuine Supabase /auth/v1/token and /auth/v1/user identity still needs
-- verification from the staging client, using real private credentials
-- entered by the human tester into the app (never shared with ChatGPT).
