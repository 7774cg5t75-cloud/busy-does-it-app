-- V3.127 disposable CI PostgreSQL only, never a Supabase migration.
-- The CI service has an ephemeral DB on 127.0.0.1. JWT claim emulation
-- tests SQL RLS policies; it does not verify genuine Supabase tokens.
\set ON_ERROR_STOP on
create role authenticated nologin;
create role anon nologin;
create schema auth;
create table auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid
 language sql stable as $$
   select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid
 $$;
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
grant usage on schema public to authenticated, anon;
insert into auth.users (id) values
 ('91edb6db-3a02-4de4-9ba8-5c93b4e790a1'),
 ('d8836a0e-fbb0-4cb9-a613-509af50eb114');
-- Reuse the EXACT previously committed staging policy rather than a
-- newly invented approximation.
\ir ISOLATED_ONLY_canary_setup.sql
insert into public.busy_staging_rls_canary (id,owner_id,marker) values
 ('20f9279e-0dcf-4b1b-aad0-4952c4aab332',
  '91edb6db-3a02-4de4-9ba8-5c93b4e790a1','fictional_A'),
 ('0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf',
  'd8836a0e-fbb0-4cb9-a613-509af50eb114','fictional_B');
-- Separate disposable owner-write table, not a live application migration.
create table public.busy_ci_owner_write (
 id uuid primary key,
 owner_id uuid not null references auth.users(id),
 note text not null
);
alter table public.busy_ci_owner_write enable row level security;
alter table public.busy_ci_owner_write force row level security;
revoke all on public.busy_ci_owner_write from public, anon, authenticated;
grant select,insert,update,delete on public.busy_ci_owner_write to authenticated;
create policy ci_owner_read on public.busy_ci_owner_write
 for select to authenticated using ((select auth.uid()) = owner_id);
create policy ci_owner_insert on public.busy_ci_owner_write
 for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy ci_owner_update on public.busy_ci_owner_write
 for update to authenticated using ((select auth.uid()) = owner_id)
 with check ((select auth.uid()) = owner_id);
create policy ci_owner_delete on public.busy_ci_owner_write
 for delete to authenticated using ((select auth.uid()) = owner_id);
insert into public.busy_ci_owner_write (id,owner_id,note) values
 ('20f9279e-0dcf-4b1b-aad0-4952c4aab332',
  '91edb6db-3a02-4de4-9ba8-5c93b4e790a1','private_a'),
 ('0aa3150d-8e85-4ca3-bda2-f8f3dd6c9bcf',
  'd8836a0e-fbb0-4cb9-a613-509af50eb114','private_b');
