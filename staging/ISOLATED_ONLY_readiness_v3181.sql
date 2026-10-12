-- V3.181: read-only pre-install audit for the exact authorised ISOLATED staging project.
-- Run only after the project ID is independently confirmed outside SQL.
-- No customer rows, credentials, sensitive names, DDL or mutations.
select 'schema_preflight_v3181' as audit,
 jsonb_build_object(
  'base_business',to_regclass('public.busy_businesses') is not null,
  'memberships',to_regclass('public.busy_business_memberships') is not null,
  'mini_app_requests',to_regclass('public.busy_mini_app_requests') is not null,
  'request_links',to_regclass('public.busy_mini_app_request_links') is not null,
  'work_booking_ledger',to_regclass('public.busy_mini_app_work_bookings') is not null,
  'canary_preserved',to_regclass('public.busy_staging_rls_canary') is not null,
  'pgcrypto_installed',exists(select 1 from pg_extension where extname='pgcrypto'),
  'pgmq_installed',exists(select 1 from pg_extension where extname='pgmq'),
  'pg_cron_installed',exists(select 1 from pg_extension where extname='pg_cron'),
  'pg_net_installed',exists(select 1 from pg_extension where extname='pg_net'),
  'atomic_request_rpc',to_regprocedure(
    'public.busy_mark_mini_app_request_link_v3180(uuid,uuid,uuid,text,text,text,boolean,jsonb)'
  ) is not null,
  'atomic_work_rpc',to_regprocedure(
    'public.busy_mark_mini_app_request_link_v3181(uuid,uuid,uuid,text,text,text,boolean,jsonb)'
  ) is not null
 ) as checks;
