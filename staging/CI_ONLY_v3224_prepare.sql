-- CI-ONLY: disposable PostgreSQL container, entire run in ONE transaction.
-- No actual Supabase project, no customer records or production credentials.
\set ON_ERROR_STOP on
begin;
create schema auth;
create table auth.users(id uuid primary key);
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
