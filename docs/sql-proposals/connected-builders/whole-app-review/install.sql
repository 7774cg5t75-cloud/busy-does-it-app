-- GENERATED REVIEW ONLY: pnjdlogwegnqbsfpcofw fresh compatibility foundation; NOT production DDL capture.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'WHOLE APP STAGING REVIEW FUSE: separate exact installation approval required'; END $$;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='120s';
DO $$ BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Reviewed postgres installer required';END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname IN ('busy_snapshot_private','busy_work_private','busy_creator_private','busy_growth_private')) THEN RAISE EXCEPTION 'Fresh reviewed staging only: existing private schema requires independent upgrade review';END IF;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname<>'busy_staging_rls_canary' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e') AND c.relkind IN ('v','m','f','S')) THEN RAISE EXCEPTION 'Fresh reviewed staging only: unexpected exposed relation requires review';END IF;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e') AND NOT (p.proname='rls_auto_enable' AND p.pronargs=0 AND p.prorettype='event_trigger'::regtype AND p.proowner='postgres'::regrole AND p.proconfig=ARRAY['search_path=pg_catalog'] AND NOT has_function_privilege('anon',p.oid,'EXECUTE') AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE') AND NOT has_function_privilege('service_role',p.oid,'EXECUTE'))) THEN RAISE EXCEPTION 'Fresh reviewed staging only: unexpected public routine requires review';END IF;
END $$;
REVOKE CREATE ON SCHEMA public FROM PUBLIC,anon,authenticated,service_role;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename<>'busy_staging_rls_canary') THEN RAISE EXCEPTION 'Fresh reviewed staging only: preserve existing operational records';END IF;IF to_regclass('auth.users') IS NULL OR to_regprocedure('auth.uid()') IS NULL THEN RAISE EXCEPTION 'Genuine Auth foundation required';END IF;END $$;
-- Source staging/ISOLATED_ONLY_business_core_v3180.sql SHA256 af81c5b8d1a0a68a061c48e221ebcb1e74c0360d512eb33f40639a54ef54f83a
-- V3.180: isolated staging-only missing business core baseline.
-- NOT an authoritative production schema export. Do not run in production.
-- Apply after checking the exact project identity and approvals in the runbook.
-- Uses Supabase's existing auth.users and service_role (CI mocks these).
create extension if not exists pgcrypto;


create table if not exists public.busy_businesses (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(btrim(name)) between 1 and 160),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);


create table if not exists public.busy_business_memberships (
 business_id uuid not null references public.busy_businesses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','admin','staff','viewer')),
 created_at timestamptz not null default now(),
 primary key(business_id,user_id)
);

create index if not exists busy_business_memberships_user_role_idx
 on public.busy_business_memberships(user_id,role,business_id);


alter table public.busy_businesses enable row level security;

alter table public.busy_businesses force row level security;

alter table public.busy_business_memberships enable row level security;

alter table public.busy_business_memberships force row level security;

revoke all on table public.busy_businesses from public,anon,authenticated;

revoke all on table public.busy_business_memberships from public,anon,authenticated;

grant select,insert,update,delete on table public.busy_businesses to service_role;

grant select,insert,update,delete on table public.busy_business_memberships to service_role;


comment on table public.busy_businesses is
 'V3.180 isolated staging compatibility baseline; do not interpret as a captured production schema.';

comment on table public.busy_business_memberships is
 'V3.180 isolated staging member contract. Membership removal revokes access; writes use authenticated Edge owner/admin checks.';
-- Source docs/sql-proposals/connected-builders/staging-foundation.sql SHA256 2e4fc89dbcf8d0af57478b840157ee3df587e9cf599b4bdc031194f1edee3783

CREATE TABLE public.busy_business_snapshots(
 business_id uuid PRIMARY KEY REFERENCES public.busy_businesses(id) ON DELETE CASCADE,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(payload)='object'),
 schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>=1),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.busy_business_snapshots IS 'connected_staging_compatibility_v1: original canonical finite-writer contract; not production DDL capture';

ALTER TABLE public.busy_business_snapshots ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.busy_business_snapshots FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role;
-- Source docs/sql-proposals/connected-builders/owner-status.sql SHA256 3aeac2d8f6deabdbd8a6e3f2b1a3e0af12e8ce046e9836bf7bf713a06fca8676

-- Original 20261007082234_v3_39_busy_apps_marketplace_foundation.sql


create table if not exists public.busy_mini_apps (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  app_key text not null default 'main',
  public_slug text not null unique,
  display_name text not null default '',
  category text not null default '',
  tagline text not null default '',
  status text not null default 'draft'
    check (status in ('draft','preview_ready','live','update_pending','disabled','failed')),
  discoverable boolean not null default false,
  draft_revision bigint not null default 1 check (draft_revision >= 1),
  draft_profile_revision bigint not null default 0 check (draft_profile_revision >= 0),
  draft_config jsonb not null default '{}'::jsonb,
  next_version bigint not null default 1 check (next_version >= 1),
  current_preview_version_id uuid,
  current_live_version_id uuid,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('simple',
      coalesce(display_name, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(tagline, '')
    )
  ) stored,
  unique (business_id, app_key)
);

-- Original 20261007082234_v3_39_busy_apps_marketplace_foundation.sql
create table if not exists public.busy_mini_app_module_catalog (
  module_key text primary key,
  title text not null,
  description text not null default '',
  status text not null default 'available'
    check (status in ('available','planned','disabled')),
  module_version integer not null default 1 check (module_version >= 1),
  capabilities jsonb not null default '{}'::jsonb,
  default_enabled boolean not null default false,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now()
);

-- Original 20261006165702_v3_36_multitenant_website_publishing_foundation.sql


create table if not exists public.busy_websites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  site_key text not null default 'main',
  public_slug text not null,
  status text not null default 'draft'
    check (status in ('draft','queued','preview_ready','live','update_pending','failed','disabled')),
  hosting_provider text not null default 'supabase_storage_cdn',
  next_version bigint not null default 1 check (next_version >= 1),
  current_preview_deployment_id uuid,
  current_live_deployment_id uuid,
  live_url text,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, site_key),
  unique (public_slug),
  check (public_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$')
);

-- Original 20261006165702_v3_36_multitenant_website_publishing_foundation.sql


create table if not exists public.busy_website_deployments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  website_id uuid not null references public.busy_websites(id) on delete cascade,
  version_no bigint not null check (version_no >= 1),
  source_generation integer not null default 1 check (source_generation >= 1),
  content_hash text not null,
  state text not null default 'queued'
    check (state in ('queued','preparing','preview_ready','publishing','live','superseded','failed')),
  source_draft jsonb not null default '{}'::jsonb,
  manifest jsonb not null default '{}'::jsonb,
  preview_storage_path text,
  public_storage_path text,
  public_url text,
  artifact_bytes bigint not null default 0 check (artifact_bytes >= 0),
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  prepared_at timestamptz,
  published_at timestamptz,
  unique (website_id, version_no),
  unique (website_id, content_hash)
);

-- Original 20261007070450_v3_37_live_website_management_foundation.sql


create table if not exists public.busy_public_business_profiles (
  business_id uuid primary key references public.busy_businesses(id) on delete cascade,
  source_website_id uuid references public.busy_websites(id) on delete set null,
  source_deployment_id uuid references public.busy_website_deployments(id) on delete set null,
  public_slug text not null,
  display_name text not null default '',
  status text not null default 'draft'
    check (status in ('draft','preview_ready','live','disabled')),
  revision bigint not null default 1 check (revision >= 1),
  profile jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (public_slug)
);

-- Original 20261007082234_v3_39_busy_apps_marketplace_foundation.sql


create table if not exists public.busy_mini_app_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  version_no bigint not null,
  source_profile_revision bigint not null default 0 check (source_profile_revision >= 0),
  source_draft_revision bigint not null default 1 check (source_draft_revision >= 1),
  config jsonb not null default '{}'::jsonb,
  state text not null default 'preview_ready'
    check (state in ('preview_ready','live','superseded','failed')),
  change_label text not null default 'Mini App update',
  change_summary jsonb not null default '{"items":[],"counts":{}}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  prepared_at timestamptz not null default now(),
  published_at timestamptz,
  unique (mini_app_id, version_no)
);

-- Original 20261007082234_v3_39_busy_apps_marketplace_foundation.sql


create table if not exists public.busy_mini_app_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  version_id uuid references public.busy_mini_app_versions(id) on delete set null,
  consumer_user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null references public.busy_mini_app_module_catalog(module_key),
  request_type text not null check (request_type in ('booking_request','enquiry')),
  status text not null default 'received'
    check (status in ('received','reviewing','accepted','declined','closed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Original 20261007101513_v3_40_mini_app_customer_journey_bridge.sql


create table if not exists public.busy_mini_app_request_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  request_id uuid not null unique references public.busy_mini_app_requests(id) on delete cascade,
  customer_record_id text not null,
  action_record_id text,
  bridge_state text not null default 'linked'
    check (bridge_state in ('linked','enquiry_linked','booking_draft','booking_confirmed','closed')),
  linked_by uuid references auth.users(id) on delete set null,
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- Original 20261007143000_v3_43_mini_app_direct_entry.sql
-- V3.43 Direct Customer Entry: share links, QR/deep-link attribution and scalable entry summaries.

create table if not exists public.busy_mini_app_entry_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  consumer_user_id uuid references auth.users(id) on delete set null,
  source text not null default 'unknown'
    check (source in ('qr','share','deep_link','marketplace','my_apps','notification','owner_test','unknown')),
  stage text not null default 'app_open'
    check (stage in ('landing','app_open')),
  user_agent text,
  created_at timestamptz not null default now()
);

-- Original 20261007143200_v3_43_mini_app_entry_daily_rollup.sql


create table if not exists public.busy_mini_app_entry_daily (
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  event_date date not null default current_date,
  source text not null
    check (source in ('qr','share','deep_link','marketplace','my_apps','notification','owner_test','unknown')),
  stage text not null
    check (stage in ('landing','app_open')),
  event_count bigint not null default 0 check (event_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (mini_app_id, event_date, source, stage)
);

-- Original 20261012193000_v3_181_durable_work_booking_ledger.sql
-- V3.181 — durable BUSY Work booking source for Business App requests.
-- Isolated staging first. Never apply to production without separate approval.
-- The same PostgreSQL transaction covers request, link, event, unread and ledger.
-- Neither this record nor a local booking implies Google Calendar delivery.

create table if not exists public.busy_mini_app_work_bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  request_id uuid not null unique references public.busy_mini_app_requests(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  customer_record_id text not null,
  action_record_id text not null,
  calendar_date date not null,
  calendar_time time without time zone not null,
  calendar_timezone text not null default 'Europe/London',
  state text not null check (state in ('confirmed','cancelled')),
  source text not null default 'business_app_request_v3181'
    check (source='business_app_request_v3181'),
  confirmed_by uuid not null references auth.users(id),
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint busy_work_booking_customer_len check
    (length(customer_record_id) between 1 and 160),
  constraint busy_work_booking_action_len check
    (length(action_record_id) between 1 and 160),
  constraint busy_work_booking_cancelled_consistency check
    ((state='confirmed' and cancelled_at is null) or
     (state='cancelled' and cancelled_at is not null))
);

-- Original 20261007125000_v3_41_mini_app_request_messaging.sql
create table if not exists public.busy_mini_app_request_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  request_id uuid not null references public.busy_mini_app_requests(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('business','customer')),
  body text not null check (char_length(body) between 1 and 3000),
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (request_id, sender_user_id, idempotency_key)
);

-- Original 20261012211000_v3_185_durable_message_delivery_intent.sql
-- V3.185: durable intent for push submission; NOT a delivered notification.
-- The intent is written in the SAME transaction as the V3.184 message.
-- No automatic retry worker: avoid unreviewed repeated sends while Expo
-- delivery receipts and background retry policy remain unverified.
create table if not exists public.busy_mini_app_message_delivery_outbox(
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.busy_businesses(id) on delete cascade,
 mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
 request_id uuid not null references public.busy_mini_app_requests(id) on delete cascade,
 message_id uuid not null unique references public.busy_mini_app_request_messages(id) on delete cascade,
 recipient_role text not null check(recipient_role in('business','customer')),
 state text not null default 'pending'
  check(state in('pending','submitted_unverified','no_submission_evidence')),
 attempt_count integer not null default 0 check(attempt_count between 0 and 100),
 submitted_token_count integer not null default 0 check(submitted_token_count between 0 and 100),
 provider_delivery_verified boolean not null default false
  check(provider_delivery_verified=false),
 last_attempt_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- Original ../schema/v3_25_production_bridge.sql


create table if not exists public.busy_push_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  notification_key text not null,
  notification_kind text not null,
  route_data jsonb not null default '{}'::jsonb,
  provider_receipts jsonb not null default '[]'::jsonb,
  sent_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, business_id, notification_key)
);

-- Original ../schema/business_content_records.sql
-- PREPARED ONLY. Generate a migration with the Supabase CLI and rehearse in
-- isolated staging before rollout. No live installation is authorised here.
create table public.busy_business_content (
 business_id uuid not null references public.busy_businesses(id) on delete cascade,
 id text not null check (id ~ '^[a-zA-Z0-9_-]{12,80}$'),
 kind text not null check (kind in ('product','event')),
 revision bigint not null check (revision between 1 and 9007199254740991),
 draft jsonb not null check (jsonb_typeof(draft)='object' and octet_length(draft::text)<=16000),
 published jsonb check (published is null or jsonb_typeof(published)='object' and octet_length(published::text)<=16000),
 published_revision bigint,
 history jsonb not null default '[]'::jsonb check (jsonb_typeof(history)='array' and jsonb_array_length(history)<=8 and octet_length(history::text)<=128000),
 can_undo boolean generated always as (jsonb_array_length(history)>0) stored,
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now(),
 primary key(business_id,id),
 check ((published is null and published_revision is null) or (published is not null and published_revision is not null and published_revision between 1 and revision))
);

-- Original 20261007070450_v3_37_live_website_management_foundation.sql
alter table public.busy_websites
  add column if not exists health_status text not null default 'not_checked',
  add column if not exists last_health_check_at timestamptz,
  add column if not exists last_healthy_at timestamptz,
  add column if not exists last_observed_deployment_id uuid,
  add column if not exists analytics_provider text not null default 'cdn_rollup',
  add column if not exists analytics_status text not null default 'foundation';

-- Original 20261007070450_v3_37_live_website_management_foundation.sql


alter table public.busy_website_deployments
  add column if not exists change_label text not null default 'Website update',
  add column if not exists change_summary jsonb not null default '{"items":[],"counts":{}}'::jsonb,
  add column if not exists page_count integer not null default 1;

-- Original 20261007073500_v3_38_delivery_signals_usage_foundation.sql
alter table public.busy_websites
  add column if not exists delivery_provider text not null default 'unconfigured',
  add column if not exists delivery_status text not null default 'not_configured',
  add column if not exists default_hostname text,
  add column if not exists default_url text,
  add column if not exists provider_last_sync_at timestamptz,
  add column if not exists analytics_last_sync_at timestamptz;

-- Original 20261007082328_v3_39_mini_app_version_hashing.sql
alter table public.busy_mini_app_versions add column if not exists config_hash text;

-- Original 20261007082355_v3_39_mini_app_request_idempotency.sql
alter table public.busy_mini_app_requests
  add column if not exists idempotency_key text;

-- Original 20261007101513_v3_40_mini_app_customer_journey_bridge.sql
alter table public.busy_mini_app_requests
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists service_name text,
  add column if not exists preferred_date_text text;

-- Original 20261007133000_v3_42_mini_app_notifications.sql
-- V3.42 Mini App notifications, unread state and bounded conversation loading.

alter table public.busy_mini_app_requests
  add column if not exists business_unread_count integer not null default 0,
  add column if not exists customer_unread_count integer not null default 0,
  add column if not exists last_business_read_at timestamptz,
  add column if not exists last_customer_read_at timestamptz;

-- Original 20261007154000_v3_44_public_mini_app_web.sql
-- V3.44 Public Mini App Web Experience: immutable web artifacts, live alias state and funnel counters.

alter table public.busy_mini_apps
  add column if not exists public_web_url text,
  add column if not exists public_web_version_id uuid,
  add column if not exists public_web_status text not null default 'not_ready',
  add column if not exists public_web_updated_at timestamptz,
  add column if not exists public_web_last_error text;

-- Original 20261007154000_v3_44_public_mini_app_web.sql


alter table public.busy_mini_app_versions
  add column if not exists public_web_storage_path text,
  add column if not exists public_web_artifact_bytes bigint not null default 0,
  add column if not exists public_web_published_at timestamptz;

-- Original 20261007161000_v3_45_guest_mini_app_requests.sql
-- V3.45 Guest Mini App requests: browser challenge, bounded rate limits and guest request receipts.

alter table public.busy_mini_app_requests
  alter column consumer_user_id drop not null,
  add column if not exists request_origin text not null default 'signed_in',
  add column if not exists identity_assurance text not null default 'signed_in_account',
  add column if not exists guest_challenge_id uuid,
  add column if not exists guest_access_hash text,
  add column if not exists guest_proof_verified_at timestamptz;

-- Original 20261007161200_v3_45_guest_web_capability.sql
-- V3.45 capability marker: do not imply older V3.44 static artifacts already contain guest forms.

alter table public.busy_mini_apps
  add column if not exists public_web_schema_version smallint not null default 1;

-- Original 20261007220000_v3_52_website_scale_hardening.sql


alter table public.busy_websites
  add column if not exists next_health_check_at timestamptz;

-- Original 20261009110000_v3_79_public_form_gates.sql

alter table public.busy_websites
  add column if not exists public_form_enabled boolean not null default false;

-- Original 20261007082234_v3_39_busy_apps_marketplace_foundation.sql


insert into public.busy_mini_app_module_catalog
(module_key,title,description,status,module_version,capabilities,default_enabled,sort_order)
values
  ('business_profile','Business profile','Public business identity, service area and approved contact details.','available',1,'{"public_read":true,"source":"public_business_profile"}',true,10),
  ('services','Services','Browse the business services from the shared approved public profile.','available',1,'{"public_read":true,"source":"public_business_profile.services"}',true,20),
  ('gallery','Gallery','Approved public business imagery only.','available',1,'{"public_read":true,"source":"public_business_profile.assets.gallery"}',true,30),
  ('contact','Contact','Approved phone/email/contact information from the public profile.','available',1,'{"public_read":true,"source":"public_business_profile.contact"}',true,40),
  ('enquiry','Enquiry','Submit a structured enquiry through BUSY.','available',1,'{"customer_action":true,"request_type":"enquiry"}',true,50),
  ('booking_request','Booking request','Request a service/date through BUSY without silently creating a confirmed booking.','available',1,'{"customer_action":true,"request_type":"booking_request","confirmation_required_by_business":true}',true,60),
  ('offers','Offers','Display approved offers when the business explicitly creates them.','available',1,'{"public_read":true,"requires_approved_offer_data":true}',false,70),
  ('loyalty','Loyalty','Future reusable loyalty module.','planned',1,'{"future":true}',false,80),
  ('payments','Payments','Future payment module; no payment collection is implemented in V3.39.','planned',1,'{"future":true}',false,90)
on conflict (module_key)
do update set
  title=excluded.title,
  description=excluded.description,
  status=excluded.status,
  module_version=excluded.module_version,
  capabilities=excluded.capabilities,
  default_enabled=excluded.default_enabled,
  sort_order=excluded.sort_order,
  updated_at=now();

-- Original 20261007143200_v3_43_mini_app_entry_daily_rollup.sql


create or replace function public.busy_mini_app_entry_summary(
  p_business_id uuid,
  p_mini_app_id uuid,
  p_since timestamptz
)
returns table (
  source text,
  stage text,
  event_count bigint
)
language sql
security definer
set search_path=pg_catalog,pg_temp
as $$
  select
    e.source,
    e.stage,
    sum(e.event_count)::bigint as event_count
  from public.busy_mini_app_entry_daily e
  where e.business_id = p_business_id
    and e.mini_app_id = p_mini_app_id
    and e.event_date >= (p_since at time zone 'UTC')::date
  group by e.source, e.stage
  order by e.stage, e.source;
$$;

ALTER TABLE public.busy_mini_apps ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_apps FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_apps TO service_role;

ALTER TABLE public.busy_mini_app_module_catalog ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_module_catalog FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_module_catalog TO service_role;

ALTER TABLE public.busy_websites ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_websites FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_websites TO service_role;

ALTER TABLE public.busy_website_deployments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_website_deployments FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_website_deployments TO service_role;

ALTER TABLE public.busy_public_business_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_public_business_profiles FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_public_business_profiles TO service_role;

ALTER TABLE public.busy_mini_app_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_versions FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_versions TO service_role;

ALTER TABLE public.busy_mini_app_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_requests FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_requests TO service_role;

ALTER TABLE public.busy_mini_app_request_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_request_links FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_request_links TO service_role;

ALTER TABLE public.busy_mini_app_entry_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_entry_events FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_entry_events TO service_role;

ALTER TABLE public.busy_mini_app_entry_daily ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_entry_daily FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_entry_daily TO service_role;

ALTER TABLE public.busy_mini_app_work_bookings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_work_bookings FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_work_bookings TO service_role;

ALTER TABLE public.busy_mini_app_request_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_request_messages FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_request_messages TO service_role;

ALTER TABLE public.busy_mini_app_message_delivery_outbox ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_mini_app_message_delivery_outbox FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_mini_app_message_delivery_outbox TO service_role;

ALTER TABLE public.busy_push_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_push_deliveries FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_push_deliveries TO service_role;

ALTER TABLE public.busy_business_content ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_business_content FROM PUBLIC,anon,authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON public.busy_business_content TO service_role;

REVOKE ALL ON FUNCTION public.busy_mini_app_entry_summary(uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;

GRANT EXECUTE ON FUNCTION public.busy_mini_app_entry_summary(uuid,uuid,timestamptz) TO service_role;
-- Source docs/sql-proposals/phase58-snapshot/writer.sql SHA256 cf0bf33a24b4acf066e743d9eff8011ef2ba0fda2a0163a9fa36d81254a98548

CREATE SCHEMA busy_snapshot_private AUTHORIZATION postgres;

REVOKE ALL ON SCHEMA busy_snapshot_private FROM PUBLIC, anon, authenticated, service_role;


CREATE FUNCTION busy_snapshot_private.lock_writer(p_business_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid := auth.uid(); member_role text;
BEGIN
 IF actor IS NULL OR p_business_id IS NULL THEN RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501'; END IF;
 -- A concurrent UPDATE/DELETE of this membership must serialize with this lock.
 -- Do not use JWT user_metadata, a client role, version flag or read-then-write Edge check.
 SELECT m.role INTO member_role FROM public.busy_business_memberships AS m
 WHERE m.business_id=p_business_id AND m.user_id=actor FOR UPDATE;
 IF member_role IS NULL OR member_role NOT IN ('owner','admin') THEN
  RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501';
 END IF;
 RETURN actor;
END $$;

ALTER FUNCTION busy_snapshot_private.lock_writer(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION busy_snapshot_private.lock_writer(uuid) FROM PUBLIC,anon,authenticated,service_role;


CREATE FUNCTION public.busy_snapshot_private_mutation_v1(
 p_business_id uuid, p_expected_revision bigint, p_expected_schema integer,
 p_operation text, p_target_id text, p_expected_record jsonb,
 p_new_text text DEFAULT NULL, p_expected_source jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE;
 rows jsonb; target jsonb; saved jsonb; updated jsonb; result_target jsonb;
 idx integer; total integer; enquiry jsonb; source jsonb; customer_source jsonb;
BEGIN
 actor := busy_snapshot_private.lock_writer(p_business_id);
 IF p_expected_revision IS NULL OR p_expected_revision<1 OR p_expected_schema IS DISTINCT FROM 1
 OR p_target_id IS NULL OR length(p_target_id) NOT BETWEEN 1 AND 240
 OR p_operation IS NULL OR p_operation NOT IN ('private_reply_edit_text','private_reply_remove','newsletter_remove')
 OR p_expected_record IS NULL OR jsonb_typeof(p_expected_record)<>'object' THEN
  RAISE EXCEPTION 'Unsupported mutation' USING ERRCODE='22023';
 END IF;
 -- Lock order is membership, then the original snapshot. No new snapshot ledger.
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Snapshot missing' USING ERRCODE='P0002'; END IF;
 IF snap.revision IS DISTINCT FROM p_expected_revision OR snap.schema_version IS DISTINCT FROM p_expected_schema THEN
  RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';
 END IF;
 IF jsonb_typeof(snap.payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Malformed snapshot' USING ERRCODE='22023'; END IF;
 IF p_operation IN ('private_reply_edit_text','private_reply_remove') THEN
  rows := snap.payload->'customers';
 ELSE rows := snap.payload->'socialDrafts'; END IF;
 IF jsonb_typeof(rows) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Malformed collection' USING ERRCODE='22023'; END IF;
 SELECT count(*),min((a.ordinality-1)::integer) INTO total,idx
 FROM jsonb_array_elements(rows) WITH ORDINALITY AS a(value,ordinality) WHERE a.value->>'id'=p_target_id;
 IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous target' USING ERRCODE='22023'; END IF;
 target := rows->idx;
 IF jsonb_typeof(target->'id') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'Malformed target identity' USING ERRCODE='22023'; END IF;
 IF (target ? 'businessId' AND target->>'businessId' IS DISTINCT FROM p_business_id::text)
 OR (target ? 'business_id' AND target->>'business_id' IS DISTINCT FROM p_business_id::text) THEN
  RAISE EXCEPTION 'Target scope mismatch' USING ERRCODE='42501';
 END IF;
 IF p_operation IN ('private_reply_edit_text','private_reply_remove') THEN
  saved := target->'privateEnquiryReply';
  IF saved IS DISTINCT FROM p_expected_record OR saved->'version' IS DISTINCT FROM '2'::jsonb
  OR saved->'privateOnly' IS DISTINCT FROM 'true'::jsonb OR jsonb_typeof(saved->'text') IS DISTINCT FROM 'string' OR saved->>'ownerId' IS DISTINCT FROM actor::text
  OR saved->>'businessId' IS DISTINCT FROM p_business_id::text OR saved->>'customerId' IS DISTINCT FROM p_target_id THEN
   RAISE EXCEPTION 'Saved reply mismatch' USING ERRCODE='40001';
  END IF;
  IF p_operation='private_reply_remove' THEN
   IF p_new_text IS NOT NULL OR p_expected_source IS NOT NULL THEN RAISE EXCEPTION 'Removal takes no replacement' USING ERRCODE='22023'; END IF;
   result_target := NULL; updated := jsonb_set(snap.payload,ARRAY['customers',idx::text],target-'privateEnquiryReply',false);
  ELSE
   IF p_new_text IS NULL OR length(btrim(p_new_text))=0 OR octet_length(p_new_text)>10000
   OR target->>'contactOk'='false' OR saved->'provenance' IS NOT NULL AND saved->'provenance'<>'null'::jsonb THEN
    RAISE EXCEPTION 'Reply needs specialist source review' USING ERRCODE='22023';
   END IF;
   -- Existing original reply sourceStamp contains [customer projection, filed enquiry].
   -- Parsing invalid JSON fails closed. Never execute customer wording.
   source := (saved->>'sourceStamp')::jsonb;
   IF jsonb_typeof(source) IS DISTINCT FROM 'array' OR jsonb_array_length(source)<>2
   OR p_expected_source IS NULL OR source IS DISTINCT FROM p_expected_source
   OR saved->'reference'->'version' IS DISTINCT FROM '1'::jsonb
   OR jsonb_typeof(saved->'reference'->'snapshotRevision') IS DISTINCT FROM 'number'
   OR (saved->'reference'->>'snapshotRevision')::bigint NOT BETWEEN 1 AND snap.revision
   OR saved->'reference'->>'businessId' IS DISTINCT FROM p_business_id::text
   OR saved->'reference'->>'customerId' IS DISTINCT FROM p_target_id
   OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Source mismatch' USING ERRCODE='40001';
   END IF;
   SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') AS a(value)
    WHERE a.value->>'id'=saved->'reference'->>'inboxId';
   IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous enquiry' USING ERRCODE='40001'; END IF;
   SELECT a.value INTO enquiry FROM jsonb_array_elements(snap.payload->'inboxItems') AS a(value)
    WHERE a.value->>'id'=saved->'reference'->>'inboxId';
   SELECT coalesce(jsonb_object_agg(a.key,a.value),'{}'::jsonb) INTO customer_source FROM jsonb_each(target) AS a
    WHERE a.key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
   IF source->0 IS DISTINCT FROM customer_source OR source->1 IS DISTINCT FROM enquiry
   OR enquiry->>'status' IS DISTINCT FROM 'Filed' OR enquiry->>'filedCustomerId' IS DISTINCT FROM p_target_id
   OR enquiry->>'reviewedAt' IS DISTINCT FROM saved->'reference'->>'reviewedAt'
   OR coalesce(enquiry->>'queuedAt','') IS DISTINCT FROM coalesce(saved->'reference'->>'queuedAt','')
   OR (enquiry ? 'businessId' AND enquiry->>'businessId' IS DISTINCT FROM p_business_id::text)
   OR (enquiry ? 'business_id' AND enquiry->>'business_id' IS DISTINCT FROM p_business_id::text)
   OR coalesce(enquiry->>'rawText','') LIKE '%Listing reference:%' THEN
    RAISE EXCEPTION 'Source needs specialist review' USING ERRCODE='40001';
   END IF;
   -- Only the known private text leaf changes; future/unknown fields remain server-side.
   result_target := jsonb_set(saved,'{text}',to_jsonb(p_new_text),false);
   updated := jsonb_set(snap.payload,ARRAY['customers',idx::text,'privateEnquiryReply'],result_target,false);
  END IF;
 ELSE
  IF target IS DISTINCT FROM p_expected_record OR target->>'status' IS DISTINCT FROM 'Draft'
  OR coalesce(target->>'publishedAt','')<>'' OR target->'contentEvidence'->>'channel' IS DISTINCT FROM 'newsletter'
  OR target->'contentEvidence'->>'businessId' IS DISTINCT FROM p_business_id::text
  OR (target ? 'ownerId' AND target->>'ownerId' IS DISTINCT FROM actor::text)
  OR (target ? 'owner_id' AND target->>'owner_id' IS DISTINCT FROM actor::text)
  OR p_new_text IS NOT NULL OR p_expected_source IS NOT NULL THEN
   RAISE EXCEPTION 'Newsletter removal mismatch' USING ERRCODE='40001';
  END IF;
  result_target := NULL; updated := jsonb_set(snap.payload,'{socialDrafts}',rows-idx,false);
 END IF;
 UPDATE public.busy_business_snapshots SET payload=updated,revision=snap.revision+1,updated_at=transaction_timestamp()
 WHERE business_id=p_business_id AND revision=p_expected_revision AND schema_version=p_expected_schema;
 IF NOT FOUND THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation',p_operation,'targetId',p_target_id,
  'previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',snap.schema_version,'target',result_target);
END $$;

ALTER FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) TO authenticated;
-- Source docs/sql-proposals/phase58-snapshot/fence.sql SHA256 e093bc939d8ac4ba104eb8d17f80d0acbae0acdb2d67dddaa76259c87148e118

-- Stage/review copy only: remove the fuse in a separately approved disposable rehearsal.
-- Retain it in this public proposal, which is not in supabase/migrations.

-- Direct legacy full-row upsert/PATCH/delete/TRUNCATE must stop, including service writers.
REVOKE ALL ON TABLE public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role;

DO $$ DECLARE col record; BEGIN
 FOR col IN SELECT a.attname FROM pg_catalog.pg_attribute a
 WHERE a.attrelid='public.busy_business_snapshots'::regclass AND a.attnum>0 AND NOT a.attisdropped LOOP
  EXECUTE format('REVOKE INSERT (%I), UPDATE (%I), REFERENCES (%I) ON public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role',col.attname,col.attname,col.attname);
 END LOOP;
END $$;

GRANT SELECT ON TABLE public.busy_business_snapshots TO authenticated,service_role;

-- Only a blank default row may be inserted by the original invoker provisioning.
-- Phase59 private exact-function addendum verifies INSERT(business_id) only.
-- Preserve invoker/RLS/trigger semantics; no full-row INSERT compatibility escape.
GRANT INSERT (business_id) ON TABLE public.busy_business_snapshots TO authenticated;


CREATE FUNCTION busy_snapshot_private.guard_initial_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 PERFORM busy_snapshot_private.lock_writer(NEW.business_id);
 IF NEW.payload IS DISTINCT FROM '{}'::jsonb OR NEW.schema_version IS DISTINCT FROM 1 OR NEW.revision IS DISTINCT FROM 1 THEN
  RAISE EXCEPTION 'Only blank snapshot initialization is supported' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $$;

ALTER FUNCTION busy_snapshot_private.guard_initial_snapshot() OWNER TO postgres;

REVOKE ALL ON FUNCTION busy_snapshot_private.guard_initial_snapshot() FROM PUBLIC,anon,authenticated,service_role;

CREATE TRIGGER busy_snapshot_initial_insert_guard BEFORE INSERT ON public.busy_business_snapshots
 FOR EACH ROW EXECUTE FUNCTION busy_snapshot_private.guard_initial_snapshot();


-- ACL revocation must be effective, not merely visible in an explicit ACL list.
-- Abort if PUBLIC/another inherited role still grants dangerous table/column powers.
DO $$ DECLARE r text; col record; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_table_privilege(r,'public.busy_business_snapshots','UPDATE')
  OR has_table_privilege(r,'public.busy_business_snapshots','DELETE')
  OR has_table_privilege(r,'public.busy_business_snapshots','TRUNCATE')
  OR has_table_privilege(r,'public.busy_business_snapshots','TRIGGER')
  OR has_table_privilege(r,'public.busy_business_snapshots','INSERT')
  OR has_any_column_privilege(r,'public.busy_business_snapshots','UPDATE') THEN
   RAISE EXCEPTION 'Inherited legacy write authority remains for %',r USING ERRCODE='42501';
  END IF;
  IF r='authenticated' THEN
   FOR col IN SELECT a.attname FROM pg_catalog.pg_attribute a WHERE a.attrelid='public.busy_business_snapshots'::regclass AND a.attnum>0 AND NOT a.attisdropped AND a.attname<>'business_id' LOOP
    IF has_column_privilege(r,'public.busy_business_snapshots',col.attname,'INSERT') THEN RAISE EXCEPTION 'Inherited non-bootstrap column insert remains' USING ERRCODE='42501'; END IF;
   END LOOP;
  END IF;
  IF r<>'authenticated' AND has_any_column_privilege(r,'public.busy_business_snapshots','INSERT') THEN
   RAISE EXCEPTION 'Unreviewed insert privilege remains' USING ERRCODE='42501';
  END IF;
 END LOOP;
END $$;
-- Source docs/sql-proposals/phase60-snapshot/privacy-fence.sql SHA256 3a2751ad5dd3a8bf25d5a5fa62222c052ff55ab40043a905c8d2e89344e5d816

-- A view owner can bypass base-table RLS/ACL for its callers. Require explicit review.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_rewrite r ON d.objid=r.oid AND d.classid='pg_rewrite'::regclass JOIN pg_catalog.pg_class v ON v.oid=r.ev_class WHERE d.refobjid='public.busy_business_snapshots'::regclass AND v.relkind IN ('v','m')) THEN
  RAISE EXCEPTION 'Unreviewed snapshot view dependency' USING ERRCODE='42501';
 END IF;
END $$;

-- PL/pgSQL/dynamic/service readers are NOT completely discoverable this way.
-- Their authenticated inventory remains a mandatory activation prerequisite.
REVOKE SELECT ON TABLE public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role;

DO $$ DECLARE col record; BEGIN
 FOR col IN SELECT attname FROM pg_attribute WHERE attrelid='public.busy_business_snapshots'::regclass AND attnum>0 AND NOT attisdropped LOOP
  EXECUTE format('REVOKE SELECT (%I) ON public.busy_business_snapshots FROM PUBLIC,anon,authenticated,service_role',col.attname);
 END LOOP;
END $$;

-- Identifier-only visibility for the original invoker ON CONFLICT bootstrap.
-- Existing membership RLS still applies; no payload/revision/schema column read.
GRANT SELECT (business_id) ON public.busy_business_snapshots TO authenticated;

-- The earlier RPC returns unknown nested fields; it becomes INTERNAL-only.
REVOKE EXECUTE ON FUNCTION public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;

DO $$ DECLARE role_name text; col record; BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_function_privilege(role_name,'public.busy_snapshot_private_mutation_v1(uuid,bigint,integer,text,text,jsonb,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Legacy RPC privilege remains' USING ERRCODE='42501'; END IF;
  FOR col IN SELECT attname FROM pg_attribute WHERE attrelid='public.busy_business_snapshots'::regclass AND attnum>0 AND NOT attisdropped AND attname<>'business_id' LOOP
   IF has_column_privilege(role_name,'public.busy_business_snapshots',col.attname,'SELECT') THEN RAISE EXCEPTION 'Raw snapshot read privilege remains' USING ERRCODE='42501'; END IF;
  END LOOP;
 END LOOP;
END $$;
-- Source docs/sql-proposals/phase60-snapshot/readers.sql SHA256 092b909c7e66d88556cf8570efaaba2ccc013046ab56a6c3c6f3a43973592de2

CREATE FUNCTION busy_snapshot_private.owner_reply_context(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; customer jsonb; saved jsonb; enquiry jsonb; source jsonb; projection jsonb; total integer; eligible boolean:=false;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 -- Admin is NOT implicitly entitled to owner-private information.
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 IF p_customer_id IS NULL OR p_enquiry_id IS NULL OR length(p_customer_id) NOT BETWEEN 1 AND 240 OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Invalid identity' USING ERRCODE='22023'; END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.revision IS DISTINCT FROM p_revision OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(snap.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Unsupported source' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'customers') a WHERE a->>'id'=p_customer_id;
 IF total<>1 THEN RAISE EXCEPTION 'Ambiguous customer' USING ERRCODE='22023'; END IF;
 SELECT a INTO customer FROM jsonb_array_elements(snap.payload->'customers') a WHERE a->>'id'=p_customer_id;
 saved:=customer->'privateEnquiryReply';
 IF saved->>'ownerId' IS DISTINCT FROM actor::text OR saved->>'businessId' IS DISTINCT FROM p_business_id::text OR saved->>'customerId' IS DISTINCT FROM p_customer_id OR saved->'version' IS DISTINCT FROM '2'::jsonb OR saved->'privateOnly' IS DISTINCT FROM 'true'::jsonb OR jsonb_typeof(saved->'text') IS DISTINCT FROM 'string' OR saved->'reference'->>'inboxId' IS DISTINCT FROM p_enquiry_id
 OR (customer ? 'businessId' AND customer->>'businessId' IS DISTINCT FROM p_business_id::text) OR (customer ? 'business_id' AND customer->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Private owner or source mismatch' USING ERRCODE='42501'; END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') a WHERE a->>'id'=p_enquiry_id;
 IF total<>1 THEN RAISE EXCEPTION 'Ambiguous enquiry' USING ERRCODE='22023'; END IF;
 SELECT a INTO enquiry FROM jsonb_array_elements(snap.payload->'inboxItems') a WHERE a->>'id'=p_enquiry_id;
 IF enquiry->>'status' IS DISTINCT FROM 'Filed' OR enquiry->>'filedCustomerId' IS DISTINCT FROM p_customer_id OR (enquiry ? 'businessId' AND enquiry->>'businessId' IS DISTINCT FROM p_business_id::text) OR (enquiry ? 'business_id' AND enquiry->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Enquiry scope mismatch' USING ERRCODE='42501'; END IF;
 BEGIN source:=(saved->>'sourceStamp')::jsonb; EXCEPTION WHEN invalid_text_representation THEN source:=NULL; END;
 SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) INTO projection FROM jsonb_each(customer) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 eligible:=coalesce(source=jsonb_build_array(projection,enquiry) AND customer->>'contactOk' IS DISTINCT FROM 'false' AND (saved->'provenance' IS NULL OR saved->'provenance'='null'::jsonb) AND coalesce(enquiry->>'rawText','') NOT LIKE '%Listing reference:%',false);
 BEGIN
  eligible:=eligible AND saved->'reference'->'version'='1'::jsonb AND saved->'reference'->>'businessId'=p_business_id::text AND saved->'reference'->>'customerId'=p_customer_id AND (saved->'reference'->>'snapshotRevision')::bigint BETWEEN 1 AND snap.revision AND enquiry->>'reviewedAt'=saved->'reference'->>'reviewedAt' AND coalesce(enquiry->>'queuedAt','')=coalesce(saved->'reference'->>'queuedAt','');
 EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN eligible:=false; END;
 eligible:=coalesce(eligible,false);
 -- Internal only. Callers cannot EXECUTE this helper or access its schema.
 RETURN jsonb_build_object('saved',saved,'source',source,'eligible',eligible,'revision',snap.revision,'actor',actor,'customer',customer,'enquiry',enquiry);
END $$;

ALTER FUNCTION busy_snapshot_private.owner_reply_context(uuid,text,text,bigint) OWNER TO postgres;

REVOKE ALL ON FUNCTION busy_snapshot_private.owner_reply_context(uuid,text,text,bigint) FROM PUBLIC,anon,authenticated,service_role;


CREATE FUNCTION public.busy_shared_business_read_v1(p_business_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid(); member_role text; business_name text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT role INTO member_role FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor FOR SHARE;
 IF member_role IS NULL OR member_role NOT IN ('owner','admin','member') THEN RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501'; END IF;
 SELECT name INTO business_name FROM public.busy_businesses WHERE id=p_business_id FOR SHARE;
 -- Explicit relational allowlist. No snapshot payload, customer/contact/private data.
 RETURN jsonb_build_object('businessId',p_business_id,'businessName',business_name,'memberRole',member_role);
END $$;

ALTER FUNCTION public.busy_shared_business_read_v1(uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_shared_business_read_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_shared_business_read_v1(uuid) TO authenticated;


CREATE FUNCTION public.busy_owner_reply_review_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;
BEGIN
 c:=busy_snapshot_private.owner_reply_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_revision);
 -- Unknown extensions and serialized sourceStamp are NEVER returned by this API.
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'customerId',p_customer_id,'enquiryId',p_enquiry_id,'revision',p_expected_revision,'schemaVersion',1,'recordHash',encode(sha256(convert_to((c->'saved')::text,'UTF8')),'hex'),'sourceHash',encode(sha256(convert_to((c->'source')::text,'UTF8')),'hex'),'eligible',c->'eligible','reply',jsonb_build_object('text',c->'saved'->'text'),'customer',jsonb_build_object('id',p_customer_id,'name',CASE WHEN jsonb_typeof(c->'customer'->'name')='string' THEN c->'customer'->'name' ELSE '""'::jsonb END),'enquiry',jsonb_build_object('id',p_enquiry_id,'rawText',CASE WHEN jsonb_typeof(c->'enquiry'->'rawText')='string' THEN c->'enquiry'->'rawText' ELSE '""'::jsonb END));
END $$;

ALTER FUNCTION public.busy_owner_reply_review_v1(uuid,text,text,bigint) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_owner_reply_review_v1(uuid,text,text,bigint) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_owner_reply_review_v1(uuid,text,text,bigint) TO authenticated;


CREATE FUNCTION public.busy_owner_reply_text_v2(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_revision bigint,p_record_hash text,p_source_hash text,p_new_text text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb; receipt jsonb;
BEGIN
 c:=busy_snapshot_private.owner_reply_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_revision);
 IF c->'eligible' IS DISTINCT FROM 'true'::jsonb OR p_record_hash IS DISTINCT FROM encode(sha256(convert_to((c->'saved')::text,'UTF8')),'hex') OR p_source_hash IS DISTINCT FROM encode(sha256(convert_to((c->'source')::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Private source changed' USING ERRCODE='40001'; END IF;
 -- Reuse original finite source validation/mutation. Full records stay on server.
 receipt:=public.busy_snapshot_private_mutation_v1(p_business_id,p_expected_revision,1,'private_reply_edit_text',p_customer_id,c->'saved',p_new_text,c->'source');
 RETURN (receipt-'target')||jsonb_build_object('enquiryId',p_enquiry_id,'target',jsonb_build_object('text',receipt->'target'->'text'),'recordHash',encode(sha256(convert_to((receipt->'target')::text,'UTF8')),'hex'));
END $$;

ALTER FUNCTION public.busy_owner_reply_text_v2(uuid,text,text,bigint,text,text,text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_owner_reply_text_v2(uuid,text,text,bigint,text,text,text) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_owner_reply_text_v2(uuid,text,text,bigint,text,text,text) TO authenticated;
-- Source docs/sql-proposals/connected-builders/contracts.sql SHA256 137379b0bd3dd514270982c041fa408958842f1ceca92ececa0e98bb51fcf544


-- Read-only membership discovery: no caller-supplied actor or editable JWT metadata.
CREATE FUNCTION public.busy_connected_workspaces_v1() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('actorId',auth.uid(),'items',coalesce(jsonb_agg(jsonb_build_object(
 'businessId',b.id,'businessName',b.name,'role',m.role) ORDER BY b.id),'[]'::jsonb))
 FROM public.busy_business_memberships m JOIN public.busy_businesses b ON b.id=m.business_id
 WHERE auth.uid() IS NOT NULL AND m.user_id=auth.uid() AND m.role='owner'
$$;


-- A single finite approved-facts projection serves readback, CAS and receipts.
CREATE FUNCTION busy_snapshot_private.profile_facts(p jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_strip_nulls(jsonb_build_object(
 'businessName',p->'businessName','businessType',p->'businessType','tagline',p->'tagline',
 'serviceArea',p->'serviceArea','description',p->'description',
 'services',coalesce((SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',v->'id','name',v->'name','description',v->'description','category',v->'category'))) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p->'services')='array' THEN p->'services' ELSE '[]'::jsonb END)v),'[]'::jsonb),
 'contact',nullif(jsonb_strip_nulls(jsonb_build_object('phone',p#>'{contact,phone}','email',p#>'{contact,email}','openingHours',p#>'{contact,openingHours}')),'{}'::jsonb),
 'brand',nullif(jsonb_strip_nulls(jsonb_build_object('primary',p#>'{brand,primary}','secondary',p#>'{brand,secondary}')),'{}'::jsonb)))
$$;

REVOKE ALL ON FUNCTION busy_snapshot_private.profile_facts(jsonb) FROM PUBLIC,anon,authenticated,service_role;


CREATE FUNCTION public.busy_connected_builder_read_v1(p_business_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; profile public.busy_public_business_profiles%ROWTYPE;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR snap.schema_version<>1 OR snap.revision<1 THEN RAISE EXCEPTION 'Workspace unavailable' USING ERRCODE='40001'; END IF;
 SELECT * INTO profile FROM public.busy_public_business_profiles WHERE business_id=p_business_id AND status<>'disabled' FOR SHARE;
 -- Only original website and finite public business facts. Never CRM/snapshot restoration.
 RETURN jsonb_build_object('actorId',actor,'businessId',p_business_id,'revision',snap.revision,
 'websiteUndoCount',coalesce(jsonb_array_length(snap.payload#>'{websiteHistory,undo}'),0),'websiteRedoCount',coalesce(jsonb_array_length(snap.payload#>'{websiteHistory,redo}'),0),'websiteHistoryHash',CASE WHEN snap.payload?'websiteHistory' THEN encode(sha256(convert_to((snap.payload->'websiteHistory')::text,'UTF8')),'hex') ELSE NULL END,'websiteDraft',snap.payload->'websiteDraft','websiteDraftHash',CASE WHEN snap.payload->'websiteDraft' IS NOT NULL AND snap.payload->'websiteDraft'<>'null' THEN encode(sha256(convert_to((snap.payload->'websiteDraft')::text,'UTF8')),'hex') ELSE NULL END,'profileRevision',profile.revision,'profileHash',CASE WHEN profile.profile IS NOT NULL THEN encode(sha256(convert_to(busy_snapshot_private.profile_facts(profile.profile)::text,'UTF8')),'hex') ELSE NULL END,
 'profile',CASE WHEN profile.business_id IS NULL THEN NULL ELSE busy_snapshot_private.profile_facts(profile.profile) END);
END $$;


-- Original snapshot websiteDraft target only. Called by authenticated original
-- website gateway with its server-verified actor; never granted to mobile roles.
CREATE FUNCTION public.busy_connected_website_commit_v1(p_business_id uuid,p_actor_id uuid,
 p_expected_revision bigint,p_expected_draft jsonb,p_candidate jsonb,p_profile_revision bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE snap public.busy_business_snapshots%ROWTYPE; member_role text;
BEGIN
 IF p_actor_id IS NULL THEN RAISE EXCEPTION 'Identity required' USING ERRCODE='42501'; END IF;
 SELECT role INTO member_role FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id FOR UPDATE;
 IF member_role IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 IF p_expected_draft IS NULL THEN
  PERFORM 1 FROM public.busy_public_business_profiles WHERE business_id=p_business_id AND revision=p_profile_revision AND status<>'disabled' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001'; END IF;
 END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version<>1 OR snap.revision IS DISTINCT FROM p_expected_revision
 OR nullif(snap.payload->'websiteDraft','null'::jsonb) IS DISTINCT FROM p_expected_draft THEN RAISE EXCEPTION 'Website conflict' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(p_candidate) IS DISTINCT FROM 'object' OR octet_length(p_candidate::text)>250000
 OR p_candidate->>'businessId' IS DISTINCT FROM p_business_id::text
 OR p_candidate->>'status' IS DISTINCT FROM 'Draft' OR p_candidate->>'publicStatus' IS DISTINCT FROM 'Not published'
 OR jsonb_typeof(p_candidate->'sections') IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_candidate->'sections') NOT BETWEEN 1 AND 30
 OR coalesce(length(p_candidate->>'id'),0) NOT BETWEEN 1 AND 160
 OR p_candidate->'generation' IS DISTINCT FROM to_jsonb(coalesce((p_expected_draft->>'generation')::bigint,0)+1)
 OR (p_expected_draft IS NOT NULL AND p_candidate->'id' IS DISTINCT FROM p_expected_draft->'id') THEN
 RAISE EXCEPTION 'Unsupported private website' USING ERRCODE='22023'; END IF;
 -- jsonb_set preserves every unrelated original key, including unknown extensions.
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{websiteDraft}',p_candidate,true),revision=revision+1,updated_at=now() WHERE business_id=p_business_id;
 RETURN jsonb_build_object('ok',true,'businessId',p_business_id,'actorId',p_actor_id,'previousRevision',snap.revision,
 'revision',snap.revision+1,'draftId',p_candidate->>'id','generation',p_candidate->'generation','recordHash',encode(sha256(convert_to(p_candidate::text,'UTF8')),'hex'),'privateOnly',true);
END $$;


ALTER FUNCTION public.busy_connected_workspaces_v1() OWNER TO postgres;

ALTER FUNCTION public.busy_connected_builder_read_v1(uuid) OWNER TO postgres;

ALTER FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_connected_workspaces_v1() FROM PUBLIC,anon,authenticated,service_role;

REVOKE ALL ON FUNCTION public.busy_connected_builder_read_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;

REVOKE ALL ON FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_connected_workspaces_v1(),public.busy_connected_builder_read_v1(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) TO service_role;
-- Source supabase/migrations/20261013081000_v3199_atomic_first_private_app.sql SHA256 eb2011c7f90c67f95e13b56f129310f20f175a8776dd22b29066dfb8babc1877
-- V3.199: FIRST private app creation, serialized and completed in one DB transaction.
-- Do NOT apply to production without migration audit, staging auth and race tests.
-- This complements the existing UNIQUE (business_id,app_key) from V3.39.
-- Only the authenticated service-role Edge endpoint may call this function.
create or replace function public.busy_create_first_mini_app_draft_v3199(
  p_business_id uuid,
  p_actor_user_id uuid,
  p_public_slug text,
  p_display_name text,
  p_category text,
  p_tagline text,
  p_profile_revision bigint,
  p_draft_config jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_app public.busy_mini_apps%rowtype;
begin
  if p_business_id is null or p_actor_user_id is null
    or not exists (
      select 1 from public.busy_business_memberships m
      where m.business_id=p_business_id and m.user_id=p_actor_user_id
        and m.role in ('owner','admin')
    ) then
    raise exception 'Owner/admin membership required for the private app';
  end if;
  if p_public_slug is null or
       p_public_slug !~ '^[a-z0-9][a-z0-9-]{0,79}$'
    or p_display_name is null or length(btrim(p_display_name))=0
    or length(p_display_name)>240
    or p_category is null or length(p_category)>240
    or p_tagline is null or length(p_tagline)>400
    or p_profile_revision is null or p_profile_revision<0
    or p_draft_config is null or jsonb_typeof(p_draft_config)<>'object'
    or jsonb_typeof(p_draft_config->'modules')<>'array'
    or jsonb_typeof(p_draft_config->'navigation')<>'array'
    or p_draft_config->>'surface' is distinct from 'busy_mini_app'
    or p_draft_config#>>'{display,name}' is distinct from p_display_name
    or pg_column_size(p_draft_config)>131072 then
    raise exception 'Invalid reviewed first-app draft';
  end if;

  -- Serialize simultaneous FIRST-app requests by locking the owner's
  -- business row. Every write either commits together or not at all.
  perform 1 from public.busy_businesses where id=p_business_id for update;
  if not found then raise exception 'Business workspace unavailable'; end if;

  select * into v_app from public.busy_mini_apps
   where business_id=p_business_id and app_key='main' for update;
  if found then
    -- Returning 'exists' is NOT permission to update someone else's draft.
    return jsonb_build_object('created',false,'existingAppId',v_app.id,
      'ownerReviewRequired',true);
  end if;

  insert into public.busy_mini_apps
    (business_id,app_key,public_slug,display_name,category,tagline,
      created_by,status,discoverable,draft_revision,draft_profile_revision,
      draft_config,last_error,updated_at)
  values
    (p_business_id,'main',p_public_slug,p_display_name,p_category,p_tagline,
      p_actor_user_id,'draft',false,2,p_profile_revision,
      p_draft_config,null,now())
  returning * into v_app;

  return jsonb_build_object('created',true,'app',to_jsonb(v_app),
    'privateOnly',true,'neverPublishes',true,'chargesCreated',false);
end
$$;


revoke all on function public.busy_create_first_mini_app_draft_v3199(
  uuid,uuid,text,text,text,text,bigint,jsonb
) from public,anon,authenticated;

grant execute on function public.busy_create_first_mini_app_draft_v3199(
  uuid,uuid,text,text,text,text,bigint,jsonb
) to service_role;
-- Source docs/sql-proposals/phase64-snapshot/first-enquiry.sql SHA256 7c0e92efb18f52173876622c3b369bf30ff3466620df7ddb33509ec124af09c8

CREATE FUNCTION public.busy_owner_first_enquiry_v1(p_business_id uuid,p_expected_revision bigint,p_capture jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; item jsonb; customer jsonb; source_record jsonb; activity jsonb; intake jsonb; filed jsonb; items jsonb; k text; total integer; event_date date; event_time time; event_at timestamptz; imported_at timestamptz:=clock_timestamp(); cid text; eid text; source_name text; imported_iso text; event_iso text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_capture) IS DISTINCT FROM 'object' OR p_capture-ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId','sourceHash','name','phone','email','address','service','eventDate','eventTime','note','confidence']<>'{}'::jsonb THEN RAISE EXCEPTION 'Unsupported capture' USING ERRCODE='22023'; END IF;
 FOREACH k IN ARRAY ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId','sourceHash','name','phone','email','address','service','eventDate','eventTime','note','confidence'] LOOP
  IF jsonb_typeof(p_capture->k) IS DISTINCT FROM 'string' OR octet_length(p_capture->>k)>10000 THEN RAISE EXCEPTION 'Unsupported capture field' USING ERRCODE='22023'; END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId'] LOOP
  IF length(p_capture->>k) NOT BETWEEN 1 AND 240 OR p_capture->>k !~ '^[A-Za-z0-9_-]+$' THEN RAISE EXCEPTION 'Invalid stable identity' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF btrim(p_capture->>'name')='' OR btrim(p_capture->>'service')='' OR (btrim(p_capture->>'phone')='' AND btrim(p_capture->>'email')='') OR p_capture->>'confidence' NOT IN ('Low','Medium','High') OR p_capture->>'eventDate' !~ '^\d{4}-\d{2}-\d{2}$' OR p_capture->>'eventTime' !~ '^\d{2}:\d{2}$' THEN RAISE EXCEPTION 'Required reviewed fields missing' USING ERRCODE='22023'; END IF;
 BEGIN event_date:=(p_capture->>'eventDate')::date;event_time:=(p_capture->>'eventTime')::time;
 EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RAISE EXCEPTION 'Invalid owner-recorded date' USING ERRCODE='22023'; END;
 -- Explicit UTC recording only; not proof of a customer event or appointment.
 event_at:=(event_date+event_time) AT TIME ZONE 'UTC';
 imported_iso:=to_char(imported_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');event_iso:=to_char(event_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');cid:=p_capture->>'customerId';eid:=p_capture->>'enquiryId';
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.revision IS DISTINCT FROM p_expected_revision OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 -- This is FIRST filing, not matching/forced-new or deleted-record recovery.
 IF (snap.payload ? 'customers' AND snap.payload->'customers'<>'[]'::jsonb) OR (snap.payload ? 'intakeLog' AND snap.payload->'intakeLog'<>'[]'::jsonb) OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'First filing requires empty customer/intake history and an original Inbox source' USING ERRCODE='22023'; END IF;
 IF snap.payload->'replyActions' ? cid THEN RAISE EXCEPTION 'Existing Work identity requires reconciliation' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'status'='Filed') THEN RAISE EXCEPTION 'Prior filing requires reconciliation' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous source' USING ERRCODE='22023'; END IF;
 SELECT x INTO item FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR item ? 'version' OR item->>'status' IS DISTINCT FROM 'Pending' OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM p_business_id::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Source identity mismatch' USING ERRCODE='42501'; END IF;
 IF p_capture->>'sourceHash' IS DISTINCT FROM encode(sha256(convert_to(item::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR btrim(item->>'rawText')='' OR jsonb_typeof(item->'source') IS DISTINCT FROM 'string' OR length(item->>'source') NOT BETWEEN 1 AND 240 OR (item ? 'screenshots' AND item->'screenshots'<>'[]'::jsonb) OR (item ? 'aiAnalysis' AND item->'aiAnalysis'<>'null'::jsonb) OR coalesce(item->>'visionPending','false')<>'false' OR (item->'parsed' ? 'stage' AND item->'parsed'->>'stage'<>'Enquiry') THEN RAISE EXCEPTION 'Unsupported source/media/stage' USING ERRCODE='22023'; END IF;
 source_name:=item->>'source';
 source_record:=jsonb_build_object('id',p_capture->>'sourceRecordId','source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'rawText',item->>'rawText','screenshots','[]'::jsonb,'screenshotOrderConfidence','Not checked','screenshotOrderReason','','aiAnalysisMode','','aiAnalysisSummary','','aiFieldConfidence','{}'::jsonb);
 activity:=jsonb_build_object('id',p_capture->>'activityId','kind','intake','date',event_date,'createdAt',imported_iso,'title','Enquiry captured from '||source_name,'note',coalesce(nullif(btrim(p_capture->>'note'),''),item->>'rawText'),'value','');
 -- Original contactOk default is a local contact preference, NEVER consent or
 -- provider/send authority. No consent, booking, quote, payment or reply is created.
 customer:=jsonb_build_object('id',cid,'name',btrim(p_capture->>'name'),'phone',btrim(p_capture->>'phone'),'email',btrim(p_capture->>'email'),'address',btrim(p_capture->>'address'),'service',btrim(p_capture->>'service'),'lastServiceDate','','lastJobValue',0,'contactOk',true,'createdAt',event_iso,'source',source_name,'history','[]'::jsonb,'activity',jsonb_build_array(activity),'sourceRecords',jsonb_build_array(source_record),'lifecycleStatus','Enquiry','currentEnquiryAt',event_iso,'nextEnquiryCheckDate',event_date+7,'enquiryFollowUpSentAt',NULL,'enquiryFollowUpStatus',NULL,'enquiryFollowUpOutcome','','enquiryFollowUpOutcomeRecordedAt',NULL,'nextRepeatDueDate','','lastActivityAt',imported_iso,'lastActivityKind','intake');
 intake:=jsonb_build_object('id',p_capture->>'intakeId','customerId',cid,'customerName',btrim(p_capture->>'name'),'source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'matchedExisting',false,'matchReason','','confidence',p_capture->>'confidence','screenshotCount',0,'screenshotOrderConfidence','Not checked');
 filed:=item||jsonb_build_object('status','Filed','reviewedAt',imported_iso,'filedCustomerId',cid,'filedStage','Enquiry','matchedExisting',false);
 SELECT jsonb_agg(CASE WHEN value->>'id'=eid THEN filed ELSE value END ORDER BY ordinality) INTO items FROM jsonb_array_elements(snap.payload->'inboxItems') WITH ORDINALITY;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(jsonb_set(jsonb_set(snap.payload,'{customers}',jsonb_build_array(customer)),'{intakeLog}',jsonb_build_array(intake)),'{inboxItems}',items),revision=snap.revision+1,updated_at=imported_at WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation','first_enquiry_filing','customerId',cid,'enquiryId',eid,'sourceRecordId',p_capture->>'sourceRecordId','intakeId',p_capture->>'intakeId','activityId',p_capture->>'activityId','previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',1,'filedStage','Enquiry');
END $$;

ALTER FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_owner_first_enquiry_v1(uuid,bigint,jsonb) TO authenticated;
-- Source docs/sql-proposals/phase65-snapshot/operations.sql SHA256 3131cce732cf63ea454b9493c614158b91a9638f96e27abbce020abc772c0121

CREATE FUNCTION public.busy_owner_pending_review_v1(p_business_id uuid,p_expected_revision bigint,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;item jsonb;n int;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 OR snap.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR p_enquiry_id IS NULL OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'Unsupported source' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF n<>1 THEN RAISE EXCEPTION 'Ambiguous source' USING ERRCODE='22023';END IF;
 SELECT x INTO item FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR item ? 'version' OR item->>'status' IS DISTINCT FROM 'Pending' OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM p_business_id::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Wrong source' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR octet_length(item->>'rawText')>10000 OR length(item->>'source')>240 OR btrim(item->>'rawText')='' OR jsonb_typeof(item->'source') IS DISTINCT FROM 'string' OR (item ? 'screenshots' AND item->'screenshots'<>'[]') OR (item ? 'aiAnalysis' AND item->'aiAnalysis'<>'null') OR coalesce(item->>'visionPending','false')<>'false' OR (item->'parsed' ? 'stage' AND item->'parsed'->>'stage'<>'Enquiry') THEN RAISE EXCEPTION 'Unsupported source' USING ERRCODE='22023';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'revision',snap.revision,'schemaVersion',1,'sourceHash',encode(sha256(convert_to(item::text,'UTF8')),'hex'),'pending',jsonb_build_object('id',p_enquiry_id,'rawText',item->'rawText','source',item->'source'));
END $$;

ALTER FUNCTION public.busy_owner_pending_review_v1(uuid,bigint,text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_owner_pending_review_v1(uuid,bigint,text) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_owner_pending_review_v1(uuid,bigint,text) TO authenticated;


CREATE FUNCTION public.busy_owner_manual_source_v1(p_business_id uuid,p_expected_revision bigint,p_enquiry_id text,p_raw_text text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;item jsonb;ts timestamptz:=clock_timestamp();
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 IF p_enquiry_id IS NULL OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 OR p_enquiry_id !~ '^[A-Za-z0-9_-]+$' OR p_raw_text IS NULL OR btrim(p_raw_text)='' OR octet_length(p_raw_text)>10000 THEN RAISE EXCEPTION 'Invalid manual source' USING ERRCODE='22023';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 OR snap.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(snap.payload) IS DISTINCT FROM 'object' OR (snap.payload ? 'customers' AND snap.payload->'customers'<>'[]') OR (snap.payload ? 'intakeLog' AND snap.payload->'intakeLog'<>'[]') OR (snap.payload ? 'inboxItems' AND snap.payload->'inboxItems'<>'[]') THEN RAISE EXCEPTION 'Only an empty initial intake is supported' USING ERRCODE='22023';END IF;
 item:=jsonb_build_object('id',p_enquiry_id,'status','Pending','source','Owner-supplied manual capture','rawText',p_raw_text,'queuedAt',to_char(ts AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'sourceOrigin','owner-manual','registeredBy',actor);
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(snap.payload,'{inboxItems}',jsonb_build_array(item)),revision=snap.revision+1,updated_at=ts WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation','manual_source_registration','enquiryId',p_enquiry_id,'previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',1);
END $$;

ALTER FUNCTION public.busy_owner_manual_source_v1(uuid,bigint,text,text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_owner_manual_source_v1(uuid,bigint,text,text) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_owner_manual_source_v1(uuid,bigint,text,text) TO authenticated;


CREATE FUNCTION busy_snapshot_private.initial_reply_context(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;c jsonb;e jsonb;source jsonb;n int;k text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 OR snap.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF p_customer_id IS NULL OR p_enquiry_id IS NULL OR length(p_customer_id) NOT BETWEEN 1 AND 240 OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 OR jsonb_typeof(snap.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR jsonb_array_length(snap.payload->'customers')>1000 OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'Unsupported collections' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'customers') x WHERE x->>'id'=p_customer_id;
 IF n<>1 THEN RAISE EXCEPTION 'Ambiguous customer' USING ERRCODE='22023';END IF;
 SELECT x INTO c FROM jsonb_array_elements(snap.payload->'customers') x WHERE x->>'id'=p_customer_id;
 SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF n<>1 THEN RAISE EXCEPTION 'Ambiguous enquiry' USING ERRCODE='22023';END IF;
 SELECT x INTO e FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF (c ? 'businessId' AND c->>'businessId' IS DISTINCT FROM p_business_id::text) OR (c ? 'business_id' AND c->>'business_id' IS DISTINCT FROM p_business_id::text) OR (e ? 'businessId' AND e->>'businessId' IS DISTINCT FROM p_business_id::text) OR (e ? 'business_id' AND e->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Wrong source scope' USING ERRCODE='42501';END IF;
 FOREACH k IN ARRAY ARRAY['id','name','service','phone','email','address'] LOOP IF c ? k AND (jsonb_typeof(c->k) IS DISTINCT FROM 'string' OR octet_length(c->>k)>10000) THEN RAISE EXCEPTION 'Unsupported customer field' USING ERRCODE='22023';END IF;END LOOP;
 FOREACH k IN ARRAY ARRAY['id','status','filedCustomerId','filedStage','reviewedAt','queuedAt','rawText'] LOOP IF e ? k AND (jsonb_typeof(e->k) IS DISTINCT FROM 'string' OR octet_length(e->>k)>10000) THEN RAISE EXCEPTION 'Unsupported enquiry field' USING ERRCODE='22023';END IF;END LOOP;
 IF c ? 'contactOk' AND jsonb_typeof(c->'contactOk') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Unsupported contact preference' USING ERRCODE='22023';END IF;
 IF (e ? 'registeredBy' AND e->>'registeredBy' IS DISTINCT FROM actor::text) OR c ? 'privateEnquiryReply' OR c ? 'version' OR e ? 'version' OR c->>'contactOk'='false' OR e->>'status' IS DISTINCT FROM 'Filed' OR e->>'filedCustomerId' IS DISTINCT FROM p_customer_id OR e->>'filedStage' IS DISTINCT FROM 'Enquiry' OR jsonb_typeof(e->'rawText') IS DISTINCT FROM 'string' OR e->>'rawText' LIKE '%Listing reference:%' OR coalesce(e->>'reviewedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN RAISE EXCEPTION 'Unsupported first reply source/target' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO source FROM jsonb_each(c) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 RETURN jsonb_build_object('customer',c,'enquiry',e,'source',jsonb_build_array(source,e));
END $$;

ALTER FUNCTION busy_snapshot_private.initial_reply_context(uuid,bigint,text,text) OWNER TO postgres;

REVOKE ALL ON FUNCTION busy_snapshot_private.initial_reply_context(uuid,bigint,text,text) FROM PUBLIC,anon,authenticated,service_role;


CREATE FUNCTION public.busy_owner_first_reply_review_v1(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;customer jsonb;enquiry jsonb;
BEGIN
 c:=busy_snapshot_private.initial_reply_context(p_business_id,p_expected_revision,p_customer_id,p_enquiry_id);
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO customer FROM jsonb_each(c->'customer') WHERE key IN ('id','name','service','phone','email','address','contactOk');
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO enquiry FROM jsonb_each(c->'enquiry') WHERE key IN ('id','status','filedCustomerId','filedStage','reviewedAt','queuedAt','rawText');
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'revision',p_expected_revision,'schemaVersion',1,'customerHash',encode(sha256(convert_to((c->'customer')::text,'UTF8')),'hex'),'sourceHash',encode(sha256(convert_to((c->'enquiry')::text,'UTF8')),'hex'),'customer',customer,'enquiry',enquiry);
END $$;

ALTER FUNCTION public.busy_owner_first_reply_review_v1(uuid,bigint,text,text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_owner_first_reply_review_v1(uuid,bigint,text,text) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_owner_first_reply_review_v1(uuid,bigint,text,text) TO authenticated;


CREATE FUNCTION public.busy_owner_reply_create_v1(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text,p_customer_hash text,p_source_hash text,p_text text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;record jsonb;reference jsonb;rows jsonb;
BEGIN
 c:=busy_snapshot_private.initial_reply_context(p_business_id,p_expected_revision,p_customer_id,p_enquiry_id);
 IF p_text IS NULL OR btrim(p_text)='' OR octet_length(p_text)>10000 OR p_customer_hash IS DISTINCT FROM encode(sha256(convert_to((c->'customer')::text,'UTF8')),'hex') OR p_source_hash IS DISTINCT FROM encode(sha256(convert_to((c->'enquiry')::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'First reply source changed or invalid wording' USING ERRCODE='40001';END IF;
 reference:=jsonb_build_object('version',1,'businessId',p_business_id,'customerId',p_customer_id,'inboxId',p_enquiry_id,'reviewedAt',c->'enquiry'->'reviewedAt','queuedAt',CASE WHEN jsonb_typeof(c->'enquiry'->'queuedAt')='string' THEN c->'enquiry'->'queuedAt' ELSE 'null'::jsonb END,'snapshotRevision',p_expected_revision);
 record:=jsonb_build_object('version',2,'ownerId',auth.uid(),'businessId',p_business_id,'customerId',p_customer_id,'reference',reference,'sourceStamp',(c->'source')::text,'text',p_text,'purpose','acknowledge','privateOnly',true);
 SELECT jsonb_agg(CASE WHEN value->>'id'=p_customer_id THEN jsonb_set(value,'{privateEnquiryReply}',record) ELSE value END ORDER BY ordinality) INTO rows FROM public.busy_business_snapshots s,LATERAL jsonb_array_elements(s.payload->'customers') WITH ORDINALITY WHERE s.business_id=p_business_id;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{customers}',rows),revision=revision+1,updated_at=clock_timestamp() WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',auth.uid(),'operation','private_reply_create','customerId',p_customer_id,'targetId',p_customer_id,'enquiryId',p_enquiry_id,'previousRevision',p_expected_revision,'revision',p_expected_revision+1,'schemaVersion',1,'target',jsonb_build_object('text',p_text),'recordHash',encode(sha256(convert_to(record::text,'UTF8')),'hex'),'sourceHash',encode(sha256(convert_to((c->'source')::text,'UTF8')),'hex'));
END $$;

ALTER FUNCTION public.busy_owner_reply_create_v1(uuid,bigint,text,text,text,text,text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_owner_reply_create_v1(uuid,bigint,text,text,text,text,text) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_owner_reply_create_v1(uuid,bigint,text,text,text,text,text) TO authenticated;
-- Source docs/sql-proposals/connected-builders/app-enquiry.sql SHA256 0f930f2fc63683db5f97aa189a5e0c8f768dd6d3e10a6088e4c008add5baee28

CREATE FUNCTION public.busy_connected_app_enquiry_review_v1(p_business_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;r public.busy_mini_app_requests%ROWTYPE;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE business_id=p_business_id AND id=p_request_id FOR SHARE;
 IF NOT FOUND OR r.request_type<>'enquiry' OR r.module_key<>'enquiry' OR r.status NOT IN ('received','reviewing') OR NOT EXISTS(SELECT 1 FROM public.busy_mini_apps WHERE id=r.mini_app_id AND business_id=p_business_id) THEN RAISE EXCEPTION 'Current business enquiry required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(r.payload->'message') IS DISTINCT FROM 'string' OR btrim(r.payload->>'message')='' OR octet_length(r.payload->>'message')>5000 THEN RAISE EXCEPTION 'Supported text enquiry required' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'requestId',r.id,'appId',r.mini_app_id,
 'requestHash',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex'),'message',r.payload->>'message',
 'name',coalesce(r.contact_name,''),'email',coalesce(r.contact_email,''),'phone',coalesce(r.contact_phone,''),'service',coalesce(r.service_name,''),
 'identityAssurance',coalesce(r.identity_assurance,'unverified'),'noCustomerIdentityInference',true);
END $$;

CREATE FUNCTION public.busy_connected_app_enquiry_import_v1(p_business_id uuid,p_request_id uuid,p_request_hash text,p_expected_revision bigint) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE observed jsonb;snap public.busy_business_snapshots%ROWTYPE;eid text:='app_'||replace(p_request_id::text,'-','_');item jsonb;receipt jsonb;
BEGIN
 observed:=public.busy_connected_app_enquiry_review_v1(p_business_id,p_request_id);
 IF observed->>'requestHash' IS DISTINCT FROM p_request_hash THEN RAISE EXCEPTION 'Enquiry changed' USING ERRCODE='40001'; END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 SELECT value INTO item FROM jsonb_array_elements(coalesce(snap.payload->'inboxItems','[]')) WHERE value->>'id'=eid;
 IF item IS NOT NULL THEN
  IF item->>'registeredBy' IS DISTINCT FROM auth.uid()::text OR item#>>'{miniAppOrigin,requestId}' IS DISTINCT FROM p_request_id::text THEN RAISE EXCEPTION 'Conflicting enquiry identity' USING ERRCODE='42501';END IF;
  RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'revision',snap.revision,'enquiryId',eid,'observedOnly',true,'notOwnReceipt',true);
 END IF;
 receipt:=public.busy_owner_manual_source_v1(p_business_id,p_expected_revision,eid,observed->>'message');
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{inboxItems,0}',(payload->'inboxItems'->0)||jsonb_build_object('source','Business App enquiry','sourceOrigin','mini-app-enquiry','miniAppOrigin',jsonb_build_object('requestId',p_request_id,'appId',observed->>'appId','requestHash',p_request_hash)),false) WHERE business_id=p_business_id;
 RETURN receipt||jsonb_build_object('requestId',p_request_id,'privateOnly',true);
END $$;

CREATE FUNCTION public.busy_connected_app_enquiry_file_v1(p_business_id uuid,p_expected_revision bigint,p_capture jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE snap public.busy_business_snapshots%ROWTYPE;item jsonb;observed jsonb;
BEGIN
 PERFORM busy_snapshot_private.lock_writer(p_business_id);
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 SELECT value INTO item FROM jsonb_array_elements(coalesce(snap.payload->'inboxItems','[]')) WHERE value->>'id'=p_capture->>'enquiryId';
 IF item#>>'{miniAppOrigin,requestId}' IS NULL THEN RAISE EXCEPTION 'Original App enquiry required' USING ERRCODE='42501';END IF;
 observed:=public.busy_connected_app_enquiry_review_v1(p_business_id,(item#>>'{miniAppOrigin,requestId}')::uuid);
 IF observed->>'requestHash' IS DISTINCT FROM item#>>'{miniAppOrigin,requestHash}' THEN RAISE EXCEPTION 'Enquiry changed before filing' USING ERRCODE='40001';END IF;
 RETURN public.busy_owner_first_enquiry_v1(p_business_id,p_expected_revision,p_capture);
END $$;

CREATE FUNCTION public.busy_connected_app_enquiry_state_v1(p_business_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;item jsonb;eid text:='app_'||replace(p_request_id::text,'-','_');record jsonb;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 SELECT value INTO item FROM jsonb_array_elements(coalesce(snap.payload->'inboxItems','[]')) WHERE value->>'id'=eid;
 IF item IS NULL THEN RETURN jsonb_build_object('state','Missing','businessId',p_business_id,'ownerId',actor);END IF;
 IF item->>'registeredBy' IS DISTINCT FROM actor::text OR item#>>'{miniAppOrigin,requestId}' IS DISTINCT FROM p_request_id::text THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='42501';END IF;
 IF item->>'status'='Filed' THEN record:=public.busy_owner_first_reply_review_v1(p_business_id,snap.revision,item->>'filedCustomerId',eid);
 ELSE record:=public.busy_owner_pending_review_v1(p_business_id,snap.revision,eid);END IF;
 RETURN jsonb_build_object('state',item->>'status','businessId',p_business_id,'ownerId',actor,'record',record);
END $$;

ALTER FUNCTION public.busy_connected_app_enquiry_state_v1(uuid,uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_connected_app_enquiry_state_v1(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_connected_app_enquiry_state_v1(uuid,uuid) TO authenticated;

ALTER FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid) OWNER TO postgres;

ALTER FUNCTION public.busy_connected_app_enquiry_import_v1(uuid,uuid,text,bigint) OWNER TO postgres;

ALTER FUNCTION public.busy_connected_app_enquiry_file_v1(uuid,bigint,jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid),public.busy_connected_app_enquiry_import_v1(uuid,uuid,text,bigint),public.busy_connected_app_enquiry_file_v1(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_connected_app_enquiry_review_v1(uuid,uuid),public.busy_connected_app_enquiry_import_v1(uuid,uuid,text,bigint),public.busy_connected_app_enquiry_file_v1(uuid,bigint,jsonb) TO authenticated;
-- Source docs/sql-proposals/connected-builders/durable-journey.sql SHA256 ef4fc480caff2c7edda4183981eef7a71d115f79612ea14844a1ce3b593673ba

CREATE FUNCTION busy_snapshot_private.file_app_enquiry_v2(p_business_id uuid,p_expected_revision bigint,p_capture jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; item jsonb; customer jsonb; source_record jsonb; activity jsonb; intake jsonb; filed jsonb; items jsonb; k text; total integer; event_date date; event_time time; event_at timestamptz; imported_at timestamptz:=clock_timestamp(); cid text; eid text; source_name text; imported_iso text; event_iso text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_capture) IS DISTINCT FROM 'object' OR p_capture-ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId','sourceHash','name','phone','email','address','service','eventDate','eventTime','note','confidence']<>'{}'::jsonb THEN RAISE EXCEPTION 'Unsupported capture' USING ERRCODE='22023'; END IF;
 FOREACH k IN ARRAY ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId','sourceHash','name','phone','email','address','service','eventDate','eventTime','note','confidence'] LOOP
  IF jsonb_typeof(p_capture->k) IS DISTINCT FROM 'string' OR octet_length(p_capture->>k)>10000 THEN RAISE EXCEPTION 'Unsupported capture field' USING ERRCODE='22023'; END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId'] LOOP
  IF length(p_capture->>k) NOT BETWEEN 1 AND 240 OR p_capture->>k !~ '^[A-Za-z0-9_-]+$' THEN RAISE EXCEPTION 'Invalid stable identity' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF btrim(p_capture->>'name')='' OR btrim(p_capture->>'service')='' OR (btrim(p_capture->>'phone')='' AND btrim(p_capture->>'email')='') OR p_capture->>'confidence' NOT IN ('Low','Medium','High') OR p_capture->>'eventDate' !~ '^\d{4}-\d{2}-\d{2}$' OR p_capture->>'eventTime' !~ '^\d{2}:\d{2}$' THEN RAISE EXCEPTION 'Required reviewed fields missing' USING ERRCODE='22023'; END IF;
 BEGIN event_date:=(p_capture->>'eventDate')::date;event_time:=(p_capture->>'eventTime')::time;
 EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RAISE EXCEPTION 'Invalid owner-recorded date' USING ERRCODE='22023'; END;
 -- Explicit UTC recording only; not proof of a customer event or appointment.
 event_at:=(event_date+event_time) AT TIME ZONE 'UTC';
 imported_iso:=to_char(imported_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');event_iso:=to_char(event_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');cid:=p_capture->>'customerId';eid:=p_capture->>'enquiryId';
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.revision IS DISTINCT FROM p_expected_revision OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 -- New finite repeated filing; original first-only entry remains unchanged.
 IF jsonb_typeof(coalesce(snap.payload->'customers','[]')) IS DISTINCT FROM 'array' OR jsonb_typeof(coalesce(snap.payload->'intakeLog','[]')) IS DISTINCT FROM 'array' OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR jsonb_array_length(coalesce(snap.payload->'customers','[]'))>=1000 OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'Unsupported collections' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(snap.payload->'customers','[]')) x WHERE x->>'id'=cid) OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(snap.payload->'intakeLog','[]')) x WHERE x->>'id'=p_capture->>'intakeId') OR snap.payload->'replyActions' ? cid THEN RAISE EXCEPTION 'Existing identity requires review' USING ERRCODE='40001';END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous source' USING ERRCODE='22023'; END IF;
 SELECT x INTO item FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR item ? 'version' OR item->>'status' IS DISTINCT FROM 'Pending' OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM p_business_id::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Source identity mismatch' USING ERRCODE='42501'; END IF;
 IF p_capture->>'sourceHash' IS DISTINCT FROM encode(sha256(convert_to(item::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR btrim(item->>'rawText')='' OR jsonb_typeof(item->'source') IS DISTINCT FROM 'string' OR length(item->>'source') NOT BETWEEN 1 AND 240 OR (item ? 'screenshots' AND item->'screenshots'<>'[]'::jsonb) OR (item ? 'aiAnalysis' AND item->'aiAnalysis'<>'null'::jsonb) OR coalesce(item->>'visionPending','false')<>'false' OR (item->'parsed' ? 'stage' AND item->'parsed'->>'stage'<>'Enquiry') THEN RAISE EXCEPTION 'Unsupported source/media/stage' USING ERRCODE='22023'; END IF;
 source_name:=item->>'source';
 source_record:=jsonb_build_object('id',p_capture->>'sourceRecordId','source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'rawText',item->>'rawText','screenshots','[]'::jsonb,'screenshotOrderConfidence','Not checked','screenshotOrderReason','','aiAnalysisMode','','aiAnalysisSummary','','aiFieldConfidence','{}'::jsonb);
 activity:=jsonb_build_object('id',p_capture->>'activityId','kind','intake','date',event_date,'createdAt',imported_iso,'title','Enquiry captured from '||source_name,'note',coalesce(nullif(btrim(p_capture->>'note'),''),item->>'rawText'),'value','');
 -- Original contactOk default is a local contact preference, NEVER consent or
 -- provider/send authority. No consent, booking, quote, payment or reply is created.
 customer:=jsonb_build_object('id',cid,'name',btrim(p_capture->>'name'),'phone',btrim(p_capture->>'phone'),'email',btrim(p_capture->>'email'),'address',btrim(p_capture->>'address'),'service',btrim(p_capture->>'service'),'lastServiceDate','','lastJobValue',0,'contactOk',true,'createdAt',event_iso,'source',source_name,'history','[]'::jsonb,'activity',jsonb_build_array(activity),'sourceRecords',jsonb_build_array(source_record),'lifecycleStatus','Enquiry','currentEnquiryAt',event_iso,'nextEnquiryCheckDate',event_date+7,'enquiryFollowUpSentAt',NULL,'enquiryFollowUpStatus',NULL,'enquiryFollowUpOutcome','','enquiryFollowUpOutcomeRecordedAt',NULL,'nextRepeatDueDate','','lastActivityAt',imported_iso,'lastActivityKind','intake');
 intake:=jsonb_build_object('id',p_capture->>'intakeId','customerId',cid,'customerName',btrim(p_capture->>'name'),'source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'matchedExisting',false,'matchReason','','confidence',p_capture->>'confidence','screenshotCount',0,'screenshotOrderConfidence','Not checked');
 filed:=item||jsonb_build_object('status','Filed','reviewedAt',imported_iso,'filedCustomerId',cid,'filedStage','Enquiry','matchedExisting',false);
 SELECT jsonb_agg(CASE WHEN value->>'id'=eid THEN filed ELSE value END ORDER BY ordinality) INTO items FROM jsonb_array_elements(snap.payload->'inboxItems') WITH ORDINALITY;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(jsonb_set(jsonb_set(snap.payload,'{customers}',coalesce(snap.payload->'customers','[]')||jsonb_build_array(customer)),'{intakeLog}',coalesce(snap.payload->'intakeLog','[]')||jsonb_build_array(intake)),'{inboxItems}',items),revision=snap.revision+1,updated_at=imported_at WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation','reviewed_app_enquiry_filing','customerId',cid,'enquiryId',eid,'sourceRecordId',p_capture->>'sourceRecordId','intakeId',p_capture->>'intakeId','activityId',p_capture->>'activityId','previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',1,'filedStage','Enquiry');
END $$;

ALTER FUNCTION busy_snapshot_private.file_app_enquiry_v2(uuid,bigint,jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION busy_snapshot_private.file_app_enquiry_v2(uuid,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.busy_connected_app_enquiry_import_v2(p_business_id uuid,p_request_id uuid,p_request_hash text,p_expected_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE observed jsonb;s public.busy_business_snapshots%ROWTYPE;e jsonb;eid text:='app_'||replace(p_request_id::text,'-','_');n int;ts timestamptz:=clock_timestamp();
BEGIN
 observed:=public.busy_connected_app_enquiry_review_v1(p_business_id,p_request_id);
 IF observed->>'requestHash' IS DISTINCT FROM p_request_hash THEN RAISE EXCEPTION 'Enquiry changed' USING ERRCODE='40001';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR s.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Snapshot unavailable' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(coalesce(s.payload->'inboxItems','[]')) IS DISTINCT FROM 'array' OR jsonb_array_length(coalesce(s.payload->'inboxItems','[]'))>=5000 THEN RAISE EXCEPTION 'Unsupported Inbox' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(coalesce(s.payload->'inboxItems','[]')) x WHERE x->>'id'=eid;
 IF n>1 THEN RAISE EXCEPTION 'Ambiguous Inbox identity' USING ERRCODE='22023';END IF;
 IF n=1 THEN
  SELECT x INTO e FROM jsonb_array_elements(s.payload->'inboxItems')x WHERE x->>'id'=eid;
  IF e->>'registeredBy' IS DISTINCT FROM auth.uid()::text OR e#>>'{miniAppOrigin,requestId}' IS DISTINCT FROM p_request_id::text OR e#>>'{miniAppOrigin,requestHash}' IS DISTINCT FROM p_request_hash THEN RAISE EXCEPTION 'Conflicting source' USING ERRCODE='40001';END IF;
  RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'revision',s.revision,'enquiryId',eid,'observedOnly',true,'notOwnReceipt',true);
 END IF;
 IF s.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 e:=jsonb_build_object('id',eid,'status','Pending','source','Business App enquiry','rawText',observed->>'message','queuedAt',to_char(ts AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'registeredBy',auth.uid(),'sourceOrigin','mini-app-enquiry','miniAppOrigin',jsonb_build_object('requestId',p_request_id,'appId',observed->>'appId','requestHash',p_request_hash));
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(s.payload,'{inboxItems}',coalesce(s.payload->'inboxItems','[]')||jsonb_build_array(e)),revision=s.revision+1,updated_at=ts WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',auth.uid(),'operation','app_enquiry_registration','requestId',p_request_id,'enquiryId',eid,'previousRevision',s.revision,'revision',s.revision+1,'schemaVersion',1,'privateOnly',true);
END $$;

CREATE FUNCTION public.busy_connected_app_enquiry_file_v2(p_business_id uuid,p_expected_revision bigint,p_capture jsonb,p_identity_decision text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.busy_business_snapshots%ROWTYPE;e jsonb;v jsonb;rid uuid;seed text;
BEGIN
 PERFORM busy_snapshot_private.lock_writer(p_business_id);
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 SELECT x INTO e FROM jsonb_array_elements(coalesce(s.payload->'inboxItems','[]'))x WHERE x->>'id'=p_capture->>'enquiryId';
 rid:=(e#>>'{miniAppOrigin,requestId}')::uuid;seed:=replace(rid::text,'-','_');
 IF rid IS NULL OR p_identity_decision IS DISTINCT FROM 'create_separate_contact' OR p_capture->>'customerId' IS DISTINCT FROM 'customer_'||seed OR p_capture->>'sourceRecordId' IS DISTINCT FROM 'source_'||seed OR p_capture->>'intakeId' IS DISTINCT FROM 'intake_'||seed OR p_capture->>'activityId' IS DISTINCT FROM 'activity_'||seed THEN RAISE EXCEPTION 'Review a separate contact identity; no automatic matching' USING ERRCODE='22023';END IF;
 v:=public.busy_connected_app_enquiry_review_v1(p_business_id,rid);
 IF v->>'requestHash' IS DISTINCT FROM e#>>'{miniAppOrigin,requestHash}' THEN RAISE EXCEPTION 'Enquiry changed before filing' USING ERRCODE='40001';END IF;
 RETURN busy_snapshot_private.file_app_enquiry_v2(p_business_id,p_expected_revision,p_capture);
END $$;

CREATE FUNCTION public.busy_connected_journeys_v1(p_business_id uuid,p_after text DEFAULT NULL,p_expected_revision bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;s public.busy_business_snapshots%ROWTYPE;e jsonb;r jsonb;items jsonb:='[]';cursor text;more boolean;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR s.schema_version IS DISTINCT FROM 1 OR p_expected_revision IS NOT NULL AND s.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot changed; reopen the first page' USING ERRCODE='40001';END IF;
 IF p_after IS NOT NULL AND (length(p_after)>240 OR p_expected_revision IS NULL) THEN RAISE EXCEPTION 'Current page required' USING ERRCODE='22023';END IF;
 IF jsonb_typeof(coalesce(s.payload->'inboxItems','[]')) IS DISTINCT FROM 'array' OR jsonb_array_length(coalesce(s.payload->'inboxItems','[]'))>5000 THEN RAISE EXCEPTION 'Unsupported Inbox' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(s.payload->'inboxItems','[]'))x GROUP BY x->>'id' HAVING count(*)>1) THEN RAISE EXCEPTION 'Ambiguous source identity' USING ERRCODE='22023';END IF;
 FOR e IN SELECT x FROM jsonb_array_elements(coalesce(s.payload->'inboxItems','[]'))x WHERE x->>'registeredBy'=actor::text AND x->>'status' IN ('Pending','Filed') AND (p_after IS NULL OR x->>'id'>p_after) ORDER BY x->>'id' LIMIT 50 LOOP
  IF e->>'status'='Filed' THEN r:=public.busy_owner_first_reply_review_v1(p_business_id,s.revision,e->>'filedCustomerId',e->>'id');ELSE r:=public.busy_owner_pending_review_v1(p_business_id,s.revision,e->>'id');END IF;
  items:=items||jsonb_build_array(jsonb_build_object('state',e->>'status','record',r,'requestId',e#>>'{miniAppOrigin,requestId}'));cursor:=e->>'id';
 END LOOP;
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(s.payload->'inboxItems','[]'))x WHERE x->>'registeredBy'=actor::text AND x->>'status' IN ('Pending','Filed') AND x->>'id'>cursor) INTO more;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'revision',s.revision,'items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'readOnlyObservation',true,'notOwnReceipt',true);
END $$;

DO $$ DECLARE f regprocedure;BEGIN
 FOREACH f IN ARRAY ARRAY['public.busy_connected_app_enquiry_import_v2(uuid,uuid,text,bigint)'::regprocedure,'public.busy_connected_app_enquiry_file_v2(uuid,bigint,jsonb,text)'::regprocedure,'public.busy_connected_journeys_v1(uuid,text,bigint)'::regprocedure] LOOP
 EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f);END LOOP;
END $$;
-- Source docs/sql-proposals/canonical-work/engagements.sql SHA256 dcca31ceba8e0b5aed0da832a53f925f1c147ba7da7feb471abe8169942af057

DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace AND left(proname,10)='busy_work_') THEN RAISE EXCEPTION 'Canonical RPC namespace already in use';END IF;END $$;

-- New canonical authority; NOT another customer DB or a replacement booking ledger.
CREATE SCHEMA busy_work_private AUTHORIZATION postgres;

REVOKE ALL ON SCHEMA busy_work_private FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE public.business_work_engagements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES public.busy_businesses(id) ON DELETE RESTRICT,
 customer_id text NOT NULL CHECK(length(customer_id) BETWEEN 1 AND 240),
 enquiry_id text NOT NULL CHECK(length(enquiry_id) BETWEEN 1 AND 240),
 created_by uuid NOT NULL, modified_by uuid NOT NULL,
 kind text NOT NULL CHECK(kind='quote'), status text NOT NULL CHECK(status='Prepared'),
 schema_version integer NOT NULL DEFAULT 1 CHECK(schema_version=1),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 source_snapshot_revision bigint NOT NULL CHECK(source_snapshot_revision>0),
 customer_hash text NOT NULL CHECK(customer_hash ~ '^[0-9a-f]{64}$'), source_hash text NOT NULL CHECK(source_hash ~ '^[0-9a-f]{64}$'),
 source_evidence jsonb NOT NULL CHECK(jsonb_typeof(source_evidence)='object' AND octet_length(source_evidence::text)<=262144),
 work_data jsonb NOT NULL CHECK(jsonb_typeof(work_data) IS NOT DISTINCT FROM 'object' AND work_data->>'type' IS NOT DISTINCT FROM 'quote' AND jsonb_typeof(work_data->'details') IS NOT DISTINCT FROM 'object' AND octet_length(work_data::text)<=262144),
 creation_operation_id text NOT NULL CHECK(creation_operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),
 legacy_record_hash text,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(business_id,customer_id,id),UNIQUE(business_id,customer_id,enquiry_id),UNIQUE(business_id,created_by,creation_operation_id)
);

CREATE INDEX business_work_customer_page ON public.business_work_engagements(business_id,customer_id,created_by,id);

CREATE INDEX business_work_owner_page ON public.business_work_engagements(business_id,created_by,id);

CREATE TABLE public.business_work_private_drafts(
 business_id uuid NOT NULL,customer_id text NOT NULL,engagement_id uuid NOT NULL,owner_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('reply','followup','work_notes')),revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 engagement_revision bigint NOT NULL,source_hash text NOT NULL,
 text text NOT NULL CHECK(octet_length(text) BETWEEN 1 AND 10000 AND btrim(text)<>''),
 extensions jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(extensions)='object'),
 operation_id text NOT NULL,updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(business_id,customer_id,engagement_id,owner_id,kind),
 FOREIGN KEY(business_id,customer_id,engagement_id) REFERENCES public.business_work_engagements(business_id,customer_id,id) ON DELETE RESTRICT
);

ALTER TABLE public.business_work_engagements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.business_work_private_drafts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_work_engagements,public.business_work_private_drafts FROM PUBLIC,anon,authenticated,service_role;


-- Local-only owner-report evidence. No lifecycle/booking permission follows creation.
CREATE TABLE public.business_work_agreement_evidence(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL,customer_id text NOT NULL,engagement_id uuid NOT NULL,
 created_by uuid NOT NULL,quote_revision bigint NOT NULL CHECK(quote_revision>0),
 evidence_class text NOT NULL CHECK(evidence_class='owner_reported_offline'),
 verification text NOT NULL CHECK(verification='unverified'),
 quote_terms jsonb NOT NULL CHECK(jsonb_typeof(quote_terms)='object'),
 terms_hash text NOT NULL CHECK(terms_hash ~ '^[0-9a-f]{64}$'),
 source_hash text NOT NULL CHECK(source_hash ~ '^[0-9a-f]{64}$'),
 owner_account text NOT NULL CHECK(btrim(owner_account)<>'' AND octet_length(owner_account)<=5000),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision=1),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 creation_operation_id text NOT NULL CHECK(creation_operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),
 FOREIGN KEY(business_id,customer_id,engagement_id) REFERENCES public.business_work_engagements(business_id,customer_id,id) ON DELETE RESTRICT,
 UNIQUE(business_id,engagement_id,created_by,quote_revision),UNIQUE(business_id,created_by,creation_operation_id),
 UNIQUE(business_id,customer_id,engagement_id,created_by,id,quote_revision,terms_hash)
);

CREATE INDEX busy_work_agreement_page ON public.business_work_agreement_evidence(business_id,customer_id,engagement_id,created_by,id);

ALTER TABLE public.business_work_agreement_evidence ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_work_agreement_evidence FROM PUBLIC,anon,authenticated,service_role;

-- Disabled/local-only append-only correction proposal; withdrawal is not erasure.
CREATE TABLE public.business_work_agreement_decisions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 evidence_id uuid NOT NULL,
 business_id uuid NOT NULL,customer_id text NOT NULL,engagement_id uuid NOT NULL,created_by uuid NOT NULL,
 decision_revision bigint NOT NULL CHECK(decision_revision>0),
 action text NOT NULL CHECK(action IN ('correct','withdraw')),
 statement text NOT NULL CHECK(btrim(statement)<>'' AND octet_length(statement)<=5000),
 quote_revision bigint NOT NULL,terms_hash text NOT NULL,
 reviewed_engagement_revision bigint NOT NULL,reviewed_source_hash text NOT NULL,
 operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(business_id,customer_id,engagement_id) REFERENCES public.business_work_engagements(business_id,customer_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(business_id,customer_id,engagement_id,created_by,evidence_id,quote_revision,terms_hash) REFERENCES public.business_work_agreement_evidence(business_id,customer_id,engagement_id,created_by,id,quote_revision,terms_hash) ON DELETE RESTRICT,
 UNIQUE(evidence_id,decision_revision),UNIQUE(business_id,created_by,operation_id)
);

CREATE INDEX busy_work_agreement_decision_latest ON public.business_work_agreement_decisions(evidence_id,decision_revision DESC);

ALTER TABLE public.business_work_agreement_decisions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_work_agreement_decisions FROM PUBLIC,anon,authenticated,service_role;

-- Private quote-version preparation only; never a sent offer or customer token.
CREATE TABLE public.business_work_quote_references(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL,customer_id text NOT NULL,engagement_id uuid NOT NULL,
 created_by uuid NOT NULL,quote_revision bigint NOT NULL CHECK(quote_revision>0),
 terms jsonb NOT NULL CHECK(jsonb_typeof(terms)='object'),terms_hash text NOT NULL CHECK(terms_hash ~ '^[0-9a-f]{64}$'),source_hash text NOT NULL,
 state text NOT NULL DEFAULT 'prepared_not_presented' CHECK(state='prepared_not_presented'),
 operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(business_id,customer_id,engagement_id) REFERENCES public.business_work_engagements(business_id,customer_id,id) ON DELETE RESTRICT,
 UNIQUE(business_id,engagement_id,created_by,quote_revision),UNIQUE(business_id,created_by,operation_id),
 UNIQUE(business_id,customer_id,engagement_id,id,created_by,quote_revision,terms_hash)
);

CREATE INDEX busy_work_quote_reference_page ON public.business_work_quote_references(business_id,customer_id,engagement_id,created_by,id);

ALTER TABLE public.business_work_quote_references ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_work_quote_references FROM PUBLIC,anon,authenticated,service_role;

-- V22.52 owner-private intent. No foreign keys block erasure of original requests/users.
CREATE TABLE public.business_work_quote_recipient_bindings(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL,customer_id text NOT NULL,engagement_id uuid NOT NULL,reference_id uuid NOT NULL,created_by uuid NOT NULL,
 quote_revision bigint NOT NULL,terms_hash text NOT NULL,source_hash text NOT NULL,review_hash text NOT NULL,
 consumer_id uuid NOT NULL,request_id uuid NOT NULL,link_id uuid NOT NULL,linking_owner_id uuid NOT NULL,app_id uuid NOT NULL,app_version_id uuid NOT NULL,
 request_revision text NOT NULL,link_revision text NOT NULL,
 provenance text NOT NULL CHECK(provenance='owner_linked_signed_in_request'),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision=1),state text NOT NULL DEFAULT 'owner_private_only' CHECK(state='owner_private_only'),
 operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(business_id,customer_id,engagement_id,reference_id,created_by,quote_revision,terms_hash) REFERENCES public.business_work_quote_references(business_id,customer_id,engagement_id,id,created_by,quote_revision,terms_hash) ON DELETE RESTRICT,
 UNIQUE(business_id,reference_id,created_by),UNIQUE(business_id,created_by,operation_id)
);

ALTER TABLE public.business_work_quote_recipient_bindings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_work_quote_recipient_bindings FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION busy_work_private.authorize(b uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=auth.uid();r text;
BEGIN
 IF actor IS NULL OR b IS NULL THEN RAISE EXCEPTION 'Not authorised' USING ERRCODE='42501';END IF;
 -- SHARE permits independent engagements while UPDATE/DELETE revocation serializes.
 SELECT role INTO r FROM public.busy_business_memberships WHERE business_id=b AND user_id=actor FOR SHARE;
 IF r IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 RETURN actor;
END $$;

CREATE FUNCTION busy_work_private.hash(v jsonb) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$SELECT encode(sha256(convert_to(v::text,'UTF8')),'hex')$$;

CREATE FUNCTION busy_work_private.source_context(b uuid,c text,e text,expected bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(b);s public.busy_business_snapshots%ROWTYPE;cust jsonb;item jsonb;projection jsonb;n integer;
BEGIN
 IF c IS NULL OR e IS NULL OR length(c) NOT BETWEEN 1 AND 240 OR length(e) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Invalid identity' USING ERRCODE='22023';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=b FOR SHARE;
 IF NOT FOUND OR s.schema_version IS DISTINCT FROM 1 OR expected IS NOT NULL AND expected IS DISTINCT FROM s.revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(s.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(s.payload->'inboxItems') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Unsupported source collections' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(s.payload->'customers') a WHERE a->>'id'=c;
 IF n<>1 THEN RAISE EXCEPTION 'Missing or ambiguous customer' USING ERRCODE='22023';END IF;
 SELECT a INTO cust FROM jsonb_array_elements(s.payload->'customers') a WHERE a->>'id'=c;
 SELECT count(*) INTO n FROM jsonb_array_elements(s.payload->'inboxItems') a WHERE a->>'id'=e;
 IF n<>1 THEN RAISE EXCEPTION 'Missing or ambiguous enquiry' USING ERRCODE='22023';END IF;
 SELECT a INTO item FROM jsonb_array_elements(s.payload->'inboxItems') a WHERE a->>'id'=e;
 IF (cust ? 'businessId' AND cust->>'businessId' IS DISTINCT FROM b::text) OR (cust ? 'business_id' AND cust->>'business_id' IS DISTINCT FROM b::text) OR (cust ? 'ownerId' AND cust->>'ownerId' IS DISTINCT FROM actor::text) OR (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM b::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM b::text) THEN RAISE EXCEPTION 'Source scope mismatch' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(cust->'id') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'id') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'filedCustomerId') IS DISTINCT FROM 'string' OR jsonb_typeof(cust->'name') IS DISTINCT FROM 'string' OR jsonb_typeof(cust->'service') IS DISTINCT FROM 'string' OR cust ? 'version' OR item ? 'version' OR cust->>'contactOk'='false' OR item->>'status' IS DISTINCT FROM 'Filed' OR item->>'filedCustomerId' IS DISTINCT FROM c OR jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR octet_length(item->>'rawText')>10000 OR item->>'rawText' LIKE '%Listing reference:%' OR coalesce(item->>'reviewedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN RAISE EXCEPTION 'Unsupported Filed source' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO projection FROM jsonb_each(cust) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 RETURN jsonb_build_object('actor',actor,'revision',s.revision,'customer',projection,'enquiry',item,'customerHash',busy_work_private.hash(projection),'sourceHash',busy_work_private.hash(item),'legacy',s.payload->'replyActions'->c);
END $$;

CREATE FUNCTION busy_work_private.project(r public.business_work_engagements) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('businessId',r.business_id,'customerId',r.customer_id,'engagementId',r.id,'enquiryId',r.enquiry_id,'ownerId',r.created_by,'revision',r.revision,'schemaVersion',r.schema_version,'type',r.kind,'status',r.status,'sourceHash',r.source_hash,'customerHash',r.customer_hash,'recordHash',busy_work_private.hash(r.work_data),'createdAt',r.created_at,'updatedAt',r.updated_at,
 'record',jsonb_build_object('type',r.kind,'done',r.work_data->'done','details',jsonb_build_object('quoteStatus',r.status,'quoteAmount',r.work_data->'details'->'quoteAmount','message',r.work_data->'details'->'message','plannedSentDate',r.work_data->'details'->'plannedSentDate')),'readOnlyObservation',true,'notOwnReceipt',true)
$$;

CREATE FUNCTION busy_work_private.target(b uuid,c text,id uuid,expected bigint DEFAULT NULL) RETURNS public.business_work_engagements LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(b);r public.business_work_engagements%ROWTYPE;ctx jsonb;
BEGIN
 -- Snapshot source lock precedes engagement locks everywhere; no reversed lock order.
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND business_work_engagements.id=target.id;
 IF NOT FOUND OR r.created_by<>actor THEN RAISE EXCEPTION 'Engagement unavailable' USING ERRCODE='42501';END IF;
 ctx:=busy_work_private.source_context(b,c,r.enquiry_id);
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=b AND customer_id=c AND business_work_engagements.id=target.id FOR UPDATE;
 IF r.created_by<>actor OR expected IS NOT NULL AND r.revision IS DISTINCT FROM expected OR r.source_hash IS DISTINCT FROM ctx->>'sourceHash' OR r.customer_hash IS DISTINCT FROM ctx->>'customerHash' THEN RAISE EXCEPTION 'Engagement/source conflict' USING ERRCODE='40001';END IF;
 RETURN r;
END $$;

CREATE FUNCTION busy_work_private.valid_quote(amount text,words text,day text,op text) RETURNS void LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF amount IS NULL OR amount !~ '^[0-9]+(\.[0-9]{1,2})?$' OR length(amount)>18 OR words IS NULL OR btrim(words)='' OR octet_length(words)>10000 OR day IS NULL OR day !~ '^\d{4}-\d{2}-\d{2}$' OR op IS NULL OR op !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid reviewed quote' USING ERRCODE='22023';END IF;
 BEGIN IF to_char(day::date,'YYYY-MM-DD')<>day THEN RAISE EXCEPTION 'Invalid day' USING ERRCODE='22023';END IF;EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN RAISE EXCEPTION 'Invalid day' USING ERRCODE='22023';END;
END $$;

CREATE FUNCTION public.busy_work_source_review_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);a jsonb:=x->'legacy';
BEGIN
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'ownerId',x->'actor','snapshotRevision',x->'revision','schemaVersion',1,'sourceHash',x->'sourceHash','customerHash',x->'customerHash','customer',jsonb_build_object('id',p_customer_id,'name',x->'customer'->'name','service',x->'customer'->'service'),'enquiry',jsonb_build_object('id',p_enquiry_id,'rawText',x->'enquiry'->'rawText','reviewedAt',x->'enquiry'->'reviewedAt'),'hasLegacyWork',coalesce(a->'details'->'enquiryReference'->>'inboxId'=p_enquiry_id,false),'readOnlyObservation',true,'notOwnReceipt',true);
END $$;

CREATE FUNCTION public.busy_work_create_quote_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint,p_customer_hash text,p_source_hash text,p_amount text,p_text text,p_date text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);r public.business_work_engagements%ROWTYPE;
BEGIN
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 PERFORM busy_work_private.valid_quote(p_amount,p_text,p_date,p_operation_id);
 IF x->>'customerHash' IS DISTINCT FROM p_customer_hash OR x->>'sourceHash' IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001';END IF;
 -- The exact original legacy source must be migrated explicitly, never duplicated.
 IF x->'legacy'->'details'->'enquiryReference'->>'inboxId'=p_enquiry_id THEN RAISE EXCEPTION 'Review legacy migration' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_engagements(business_id,customer_id,enquiry_id,created_by,modified_by,kind,status,source_snapshot_revision,customer_hash,source_hash,source_evidence,work_data,creation_operation_id)
 VALUES(p_business_id,p_customer_id,p_enquiry_id,(x->>'actor')::uuid,(x->>'actor')::uuid,'quote','Prepared',(x->>'revision')::bigint,p_customer_hash,p_source_hash,jsonb_build_object('customer',x->'customer','enquiry',x->'enquiry'),jsonb_build_object('type','quote','task','Prepare a private quote','origin','manual','done',true,'details',jsonb_build_object('quoteStatus','Prepared','quoteAmount',p_amount,'message',p_text,'plannedSentDate',p_date)),p_operation_id) RETURNING * INTO r;
 RETURN jsonb_build_object('operation','engagement_create_quote','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'engagementId',r.id,'actorId',r.created_by,'previousRevision',0,'revision',1,'schemaVersion',1,'sourceHash',r.source_hash,'recordHash',busy_work_private.hash(r.work_data));
END $$;

CREATE FUNCTION public.busy_work_migrate_legacy_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint,p_legacy_hash text,p_source_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);a jsonb:=x->'legacy';e jsonb:=x->'enquiry';ref jsonb;r public.business_work_engagements%ROWTYPE;
BEGIN
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' OR a IS NULL OR busy_work_private.hash(a) IS DISTINCT FROM p_legacy_hash OR x->>'sourceHash' IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Legacy review changed' USING ERRCODE='40001';END IF;
 ref:=a->'details'->'enquiryReference';
 IF a ? 'version' OR a->>'type' IS DISTINCT FROM 'quote' OR a->>'origin' IS DISTINCT FROM 'manual' OR a->'details'->>'sourceMiniAppRequestId' IS NOT NULL OR a->'details'->>'quoteStatus' IS DISTINCT FROM 'Prepared' OR jsonb_typeof(a->'done') IS DISTINCT FROM 'boolean' OR ref->>'version' IS DISTINCT FROM '1' OR ref->>'businessId' IS DISTINCT FROM p_business_id::text OR ref->>'customerId' IS DISTINCT FROM p_customer_id OR ref->>'inboxId' IS DISTINCT FROM p_enquiry_id OR ref->>'reviewedAt' IS DISTINCT FROM e->>'reviewedAt' OR coalesce(ref->>'queuedAt','')<>coalesce(e->>'queuedAt','') OR coalesce((ref->>'snapshotRevision')::bigint,0) NOT BETWEEN 1 AND (x->>'revision')::bigint THEN RAISE EXCEPTION 'Unsupported legacy source' USING ERRCODE='22023';END IF;
 PERFORM busy_work_private.valid_quote(a->'details'->>'quoteAmount',a->'details'->>'message',a->'details'->>'plannedSentDate',p_operation_id);
 INSERT INTO public.business_work_engagements(business_id,customer_id,enquiry_id,created_by,modified_by,kind,status,source_snapshot_revision,customer_hash,source_hash,source_evidence,work_data,creation_operation_id,legacy_record_hash)
 VALUES(p_business_id,p_customer_id,p_enquiry_id,(x->>'actor')::uuid,(x->>'actor')::uuid,'quote','Prepared',(x->>'revision')::bigint,x->>'customerHash',p_source_hash,jsonb_build_object('customer',x->'customer','enquiry',e),a,p_operation_id,p_legacy_hash) RETURNING * INTO r;
 RETURN jsonb_build_object('operation','engagement_migrate_legacy','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'engagementId',r.id,'actorId',r.created_by,'previousRevision',0,'revision',1,'schemaVersion',1,'sourceHash',r.source_hash,'recordHash',busy_work_private.hash(r.work_data));
END $$;

CREATE FUNCTION public.busy_work_list_v1(p_business_id uuid,p_customer_id text,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(p_business_id);items jsonb;more boolean;cursor uuid;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_customer_id IS NULL THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('engagementId',id,'enquiryId',enquiry_id,'type',kind,'status',status,'revision',revision) ORDER BY id),'[]') INTO items FROM (SELECT * FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND created_by=actor AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT p_limit) a;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'engagementId')::uuid;END IF;
 SELECT EXISTS(SELECT 1 FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND created_by=actor AND id>cursor) INTO more;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'ownerId',actor,'items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'readOnlyObservation',true,'notOwnReceipt',true);
END $$;

-- Retained history is not current source/mutation authority. No reassociation.
CREATE FUNCTION public.busy_work_history_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(p_business_id);r public.business_work_engagements%ROWTYPE;x jsonb;state text:='current';
BEGIN
 -- Current source checks lock membership/snapshot before the retained row.
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND id=p_engagement_id;
 IF NOT FOUND OR r.created_by<>actor THEN RAISE EXCEPTION 'Engagement unavailable' USING ERRCODE='42501';END IF;
 BEGIN
  x:=busy_work_private.source_context(p_business_id,p_customer_id,r.enquiry_id);
  IF x->>'sourceHash' IS DISTINCT FROM r.source_hash OR x->>'customerHash' IS DISTINCT FROM r.customer_hash THEN state:='changed';END IF;
 EXCEPTION WHEN SQLSTATE '42501' THEN state:='restricted'; WHEN SQLSTATE '22023' THEN state:='unsupported'; WHEN SQLSTATE '40001' THEN state:='unavailable';
 END;
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND id=p_engagement_id FOR SHARE;
 IF NOT FOUND OR r.created_by<>actor THEN RAISE EXCEPTION 'Engagement unavailable' USING ERRCODE='42501';END IF;
 RETURN busy_work_private.project(r)||jsonb_build_object('historicalOnly',true,'sourceState',state,'mutationAuthorised',false,
  'originalSource',jsonb_build_object('enquiryId',r.enquiry_id,'snapshotRevision',r.source_snapshot_revision,'sourceHash',r.source_hash,'reviewedAt',r.source_evidence->'enquiry'->'reviewedAt'));
END $$;

-- Fresh owner entry without assuming a customer exists on this device.
CREATE FUNCTION public.busy_work_discover_v1(p_business_id uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(p_business_id);items jsonb;cursor uuid;more boolean;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('engagementId',id,'customerId',customer_id,'enquiryId',enquiry_id,'type',kind,'status',status,'revision',revision) ORDER BY id),'[]') INTO items FROM (SELECT * FROM public.business_work_engagements WHERE business_id=p_business_id AND created_by=actor AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT p_limit) a;
 IF jsonb_array_length(items)>0 THEN cursor:=(items->(jsonb_array_length(items)-1)->>'engagementId')::uuid;END IF;
 SELECT EXISTS(SELECT 1 FROM public.business_work_engagements WHERE business_id=p_business_id AND created_by=actor AND id>cursor) INTO more;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'items',items,'nextCursor',CASE WHEN more THEN cursor ELSE NULL END,'readOnlyObservation',true,'notOwnReceipt',true);
END $$;

CREATE FUNCTION public.busy_work_compare_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE h jsonb:=public.busy_work_history_v1(p_business_id,p_customer_id,p_engagement_id);r public.business_work_engagements%ROWTYPE;x jsonb;original jsonb;current_source jsonb;state text:=h->>'sourceState';
BEGIN
 SELECT * INTO r FROM public.business_work_engagements WHERE business_id=p_business_id AND customer_id=p_customer_id AND id=p_engagement_id FOR SHARE;
 IF NOT FOUND OR r.created_by IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Engagement unavailable' USING ERRCODE='42501';END IF;
 original:=jsonb_build_object('customerName',CASE WHEN octet_length(r.source_evidence->'customer'->>'name')<=2000 THEN r.source_evidence->'customer'->'name' ELSE NULL END,'service',CASE WHEN octet_length(r.source_evidence->'customer'->>'service')<=2000 THEN r.source_evidence->'customer'->'service' ELSE NULL END,'enquiryText',r.source_evidence->'enquiry'->'rawText','reviewedAt',r.source_evidence->'enquiry'->'reviewedAt');
 IF state IN ('current','changed') THEN
  x:=busy_work_private.source_context(p_business_id,p_customer_id,r.enquiry_id);
  IF octet_length(x->'customer'->>'name')>2000 OR octet_length(x->'customer'->>'service')>2000 THEN state:='unsupported';
  ELSE current_source:=jsonb_build_object('customerName',x->'customer'->'name','service',x->'customer'->'service','enquiryText',x->'enquiry'->'rawText','reviewedAt',x->'enquiry'->'reviewedAt');END IF;
 END IF;
 RETURN h||jsonb_build_object('sourceState',state,'originalContext',original,'currentContext',current_source,'comparisonOnly',true,'currentSnapshotRevision',CASE WHEN current_source IS NOT NULL THEN x->'revision' ELSE NULL END,'customerEvidenceChanged',CASE WHEN current_source IS NOT NULL THEN r.customer_hash IS DISTINCT FROM x->>'customerHash' ELSE NULL END,'enquiryEvidenceChanged',CASE WHEN current_source IS NOT NULL THEN r.source_hash IS DISTINCT FROM x->>'sourceHash' ELSE NULL END);
END $$;

-- Current finite editor eligibility; never a restored customer or historical capability.
CREATE FUNCTION public.busy_work_edit_context_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_expected_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE;ops text[]:=ARRAY['edit_quote'];snapshot_rev bigint;
BEGIN
 IF p_expected_revision IS NULL OR p_expected_revision<1 THEN RAISE EXCEPTION 'Expected engagement revision required' USING ERRCODE='22023';END IF;
 r:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);
 IF has_function_privilege('authenticated',to_regprocedure('public.busy_work_edit_quote_v1(uuid,text,uuid,bigint,text,text,text,text,text)'),'EXECUTE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'Quote editing unavailable' USING ERRCODE='42501';END IF;
 IF has_function_privilege('authenticated',to_regprocedure('public.busy_work_private_write_v1(uuid,text,uuid,bigint,bigint,text,text,text,text)'),'EXECUTE') THEN ops:=array_append(ops,'private_followup');END IF;
 SELECT revision INTO snapshot_rev FROM public.busy_business_snapshots WHERE business_id=p_business_id;
 RETURN busy_work_private.project(r)||jsonb_build_object('currentEditContext',true,'allowedOperations',to_jsonb(ops),'contextSnapshotRevision',snapshot_rev);
END $$;

CREATE FUNCTION public.busy_work_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id);
BEGIN RETURN busy_work_private.project(r);END $$;

CREATE FUNCTION public.busy_work_edit_quote_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_expected_revision bigint,p_source_hash text,p_amount text,p_text text,p_date text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);before bigint:=r.revision;
BEGIN
 PERFORM busy_work_private.valid_quote(p_amount,p_text,p_date,p_operation_id);
 IF r.status<>'Prepared' OR r.source_hash IS DISTINCT FROM p_source_hash OR p_expected_revision IS NULL THEN RAISE EXCEPTION 'Quote conflict' USING ERRCODE='40001';END IF;
 UPDATE public.business_work_engagements SET work_data=jsonb_set(jsonb_set(jsonb_set(r.work_data,'{details,quoteAmount}',to_jsonb(p_amount)),'{details,message}',to_jsonb(p_text)),'{details,plannedSentDate}',to_jsonb(p_date)),revision=r.revision+1,modified_by=auth.uid(),updated_at=clock_timestamp() WHERE id=r.id RETURNING * INTO r;
 RETURN jsonb_build_object('operation','engagement_edit_quote','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',r.id,'actorId',auth.uid(),'previousRevision',before,'revision',r.revision,'schemaVersion',1,'sourceHash',r.source_hash,'recordHash',busy_work_private.hash(r.work_data));
END $$;

CREATE FUNCTION public.busy_work_private_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_kind text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id);d public.business_work_private_drafts%ROWTYPE;
BEGIN
 IF p_kind IS NULL OR p_kind NOT IN ('reply','followup','work_notes') THEN RAISE EXCEPTION 'Unsupported draft' USING ERRCODE='22023';END IF;
 SELECT * INTO d FROM public.business_work_private_drafts WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND owner_id=auth.uid() AND kind=p_kind;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'ownerId',auth.uid(),'kind',p_kind,'revision',coalesce(d.revision,0),'text',d.text,'engagementRevision',d.engagement_revision,'needsReview',d.engagement_revision IS DISTINCT FROM r.revision,'readOnlyObservation',true,'notOwnReceipt',true);
END $$;

CREATE FUNCTION public.busy_work_private_write_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_engagement_revision bigint,p_expected_draft_revision bigint,p_source_hash text,p_kind text,p_text text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_engagement_revision);d public.business_work_private_drafts%ROWTYPE;next_rev bigint;
BEGIN
 IF p_kind IS NULL OR p_kind NOT IN ('reply','followup','work_notes') OR p_text IS NULL OR btrim(p_text)='' OR octet_length(p_text)>10000 OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' OR p_expected_draft_revision IS NULL OR p_expected_draft_revision<0 THEN RAISE EXCEPTION 'Invalid private wording' USING ERRCODE='22023';END IF;
 IF p_engagement_revision IS NULL OR r.source_hash IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Private source changed' USING ERRCODE='40001';END IF;
 SELECT * INTO d FROM public.business_work_private_drafts WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND owner_id=auth.uid() AND kind=p_kind FOR UPDATE;
 IF coalesce(d.revision,0)<>p_expected_draft_revision THEN RAISE EXCEPTION 'Private revision conflict' USING ERRCODE='40001';END IF;
 next_rev:=p_expected_draft_revision+1;
 IF p_expected_draft_revision=0 THEN INSERT INTO public.business_work_private_drafts(business_id,customer_id,engagement_id,owner_id,kind,engagement_revision,source_hash,text,operation_id) VALUES(p_business_id,p_customer_id,p_engagement_id,auth.uid(),p_kind,r.revision,r.source_hash,p_text,p_operation_id);
 ELSE UPDATE public.business_work_private_drafts SET text=p_text,engagement_revision=r.revision,source_hash=p_source_hash,revision=next_rev,operation_id=p_operation_id,updated_at=clock_timestamp() WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND owner_id=auth.uid() AND kind=p_kind;END IF;
 RETURN jsonb_build_object('operation','engagement_private_wording','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'actorId',auth.uid(),'kind',p_kind,'previousRevision',p_expected_draft_revision,'revision',next_rev,'engagementRevision',r.revision,'schemaVersion',1,'textHash',busy_work_private.hash(to_jsonb(p_text)));
END $$;

CREATE FUNCTION busy_work_private.quote_terms(r public.business_work_engagements) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('engagementId',r.id,'customerId',r.customer_id,'enquiryId',r.enquiry_id,'quoteRevision',r.revision,'termsSchemaVersion',1,'recordHash',busy_work_private.hash(r.work_data),'sourceHash',r.source_hash,'presentation','internal_prepared_quote','amount',r.work_data->'details'->'quoteAmount','plannedQuoteDate',r.work_data->'details'->'plannedSentDate','wording',r.work_data->'details'->'message','service',r.source_evidence->'customer'->'service')
$$;

CREATE FUNCTION public.busy_work_agreement_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_expected_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE;terms jsonb;
BEGIN
 IF p_expected_revision IS NULL OR p_expected_revision<1 THEN RAISE EXCEPTION 'Exact quote revision required' USING ERRCODE='22023';END IF;
 r:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);
 IF NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_agreement_create_v1(uuid,text,uuid,bigint,text,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Evidence recording unavailable' USING ERRCODE='42501';END IF;
 terms:=busy_work_private.quote_terms(r);
 RETURN busy_work_private.project(r)||jsonb_build_object('currentAgreementReview',true,'terms',terms,'termsHash',busy_work_private.hash(terms),'evidenceClass','owner_reported_offline','verification','unverified','bookingEligible',false);
END $$;

CREATE FUNCTION public.busy_work_agreement_create_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_expected_revision bigint,p_terms_hash text,p_owner_account text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE;terms jsonb;e public.business_work_agreement_evidence%ROWTYPE;
BEGIN
 IF p_expected_revision IS NULL OR p_expected_revision<1 OR p_owner_account IS NULL OR btrim(p_owner_account)='' OR octet_length(p_owner_account)>5000 OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid owner report' USING ERRCODE='22023';END IF;
 r:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);terms:=busy_work_private.quote_terms(r);
 IF p_terms_hash IS NULL OR p_terms_hash IS DISTINCT FROM busy_work_private.hash(terms) THEN RAISE EXCEPTION 'Quote terms changed' USING ERRCODE='40001';END IF;
 IF EXISTS(SELECT 1 FROM public.business_work_agreement_evidence WHERE business_id=p_business_id AND engagement_id=p_engagement_id AND created_by=auth.uid() AND quote_revision=r.revision) THEN RAISE EXCEPTION 'Owner report already recorded for this version; inspect without replay' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_agreement_evidence(business_id,customer_id,engagement_id,created_by,quote_revision,evidence_class,verification,quote_terms,terms_hash,source_hash,owner_account,creation_operation_id)
 VALUES(p_business_id,p_customer_id,p_engagement_id,auth.uid(),r.revision,'owner_reported_offline','unverified',terms,p_terms_hash,r.source_hash,p_owner_account,p_operation_id) RETURNING * INTO e;
 RETURN jsonb_build_object('operation','engagement_owner_report','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'evidenceId',e.id,'actorId',auth.uid(),'schemaVersion',1,'previousRevision',0,'revision',1,'quoteRevision',r.revision,'termsHash',e.terms_hash,'sourceHash',r.source_hash,'evidenceClass',e.evidence_class,'verification',e.verification,'recordedAt',e.recorded_at,'bookingEligible',false);
END $$;

CREATE FUNCTION public.busy_work_agreement_list_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id);items jsonb;cursor uuid;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid page size' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('evidenceId',id,'quoteRevision',quote_revision,'evidenceClass',evidence_class,'verification',verification) ORDER BY id),'[]') INTO items FROM (SELECT * FROM public.business_work_agreement_evidence WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND created_by=auth.uid() AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT p_limit) x;
 IF jsonb_array_length(items)=p_limit THEN cursor:=(items->(p_limit-1)->>'evidenceId')::uuid;END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'ownerId',auth.uid(),'items',items,'nextCursor',cursor,'notOwnReceipt',true);
END $$;

CREATE FUNCTION busy_work_private.agreement_state(e public.business_work_agreement_evidence) RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE d public.business_work_agreement_decisions%ROWTYPE;
BEGIN
 SELECT * INTO d FROM public.business_work_agreement_decisions WHERE evidence_id=e.id ORDER BY decision_revision DESC LIMIT 1;
 RETURN jsonb_build_object('decisionRevision',coalesce(d.decision_revision,0),'decisionId',d.id,'reportState',CASE WHEN d.action='withdraw' THEN 'withdrawn' WHEN d.action='correct' THEN 'corrected' ELSE 'original' END,'currentOwnerAccount',CASE WHEN d.action='withdraw' THEN NULL ELSE coalesce(d.statement,e.owner_account) END,'decisionStatement',d.statement,'decisionRecordedAt',d.recorded_at);
END $$;

CREATE FUNCTION public.busy_work_agreement_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_evidence_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id);e public.business_work_agreement_evidence%ROWTYPE;current_terms jsonb;
BEGIN
 SELECT * INTO e FROM public.business_work_agreement_evidence WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND id=p_evidence_id AND created_by=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Evidence unavailable' USING ERRCODE='42501';END IF;
 current_terms:=busy_work_private.quote_terms(r);
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'ownerId',auth.uid(),'evidenceId',e.id,'revision',e.revision,'quoteRevision',e.quote_revision,'terms',e.quote_terms,'termsHash',e.terms_hash,'ownerAccount',e.owner_account,'evidenceClass',e.evidence_class,'verification',e.verification,'recordedAt',e.recorded_at,'recordedTimeMeaning','server_recorded_owner_report_not_external_event','currentQuoteRevision',r.revision,'currentTerms',current_terms,'termsChanged',busy_work_private.hash(current_terms) IS DISTINCT FROM e.terms_hash,'bookingEligible',false,'notOwnReceipt',true,'requestAssociationState','not_established_by_protocol')||busy_work_private.agreement_state(e);
END $$;

-- Finite readiness inspection. Does not query/adopt requests by customer or guess a link.
CREATE FUNCTION public.busy_work_booking_readiness_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_evidence_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v jsonb:=public.busy_work_agreement_read_v1(p_business_id,p_customer_id,p_engagement_id,p_evidence_id);
BEGIN
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'ownerId',auth.uid(),'evidenceId',p_evidence_id,'quoteRevision',v->'quoteRevision','currentQuoteRevision',v->'currentQuoteRevision','terms',v->'terms','currentTerms',v->'currentTerms','termsChanged',v->'termsChanged','decisionRevision',v->'decisionRevision','reportState',v->'reportState','verification','unverified','customerResponseEvidence','not_established_by_protocol','requestAssociationState','unsupported_missing_canonical_request_contract','bookingEligible',false,'executionAuthorised',false,'notOwnReceipt',true,'requirements',jsonb_build_array('Reviewed agreement policy and exact customer acceptance evidence','Persisted canonical quote-version/request/link association','Original request/link/Work-ledger transaction authority','Current diary conflicts, owner approval and target-specific receipt'));
END $$;

-- Review is source-current mutation context, never a historical observation/receipt.
CREATE FUNCTION public.busy_work_agreement_decision_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_evidence_id uuid,p_expected_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);e public.business_work_agreement_evidence%ROWTYPE;
BEGIN
 IF p_expected_revision IS NULL OR NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_agreement_decide_v1(uuid,text,uuid,uuid,bigint,bigint,text,text,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Correction unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO e FROM public.business_work_agreement_evidence WHERE id=p_evidence_id AND business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND created_by=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Evidence unavailable' USING ERRCODE='42501';END IF;
 RETURN busy_work_private.project(r)||jsonb_build_object('currentDecisionReview',true,'evidenceId',e.id,'quoteRevision',e.quote_revision,'termsHash',e.terms_hash,'terms',e.quote_terms,'originalOwnerAccount',e.owner_account,'verification','unverified','bookingEligible',false)||busy_work_private.agreement_state(e);
END $$;

CREATE FUNCTION public.busy_work_agreement_decide_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_evidence_id uuid,p_expected_revision bigint,p_expected_decision_revision bigint,p_terms_hash text,p_action text,p_statement text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE;e public.business_work_agreement_evidence%ROWTYPE;d public.business_work_agreement_decisions%ROWTYPE;state jsonb;
BEGIN
 IF p_expected_revision IS NULL OR p_expected_decision_revision IS NULL OR p_expected_decision_revision<0 OR p_action IS NULL OR p_action NOT IN ('correct','withdraw') OR p_statement IS NULL OR btrim(p_statement)='' OR octet_length(p_statement)>5000 OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid evidence decision' USING ERRCODE='22023';END IF;
 -- Original membership/source/engagement lock precedes evidence lock; serializes quote and decisions.
 r:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);
 SELECT * INTO e FROM public.business_work_agreement_evidence WHERE id=p_evidence_id AND business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND created_by=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Evidence unavailable' USING ERRCODE='42501';END IF;
 state:=busy_work_private.agreement_state(e);
 IF e.terms_hash IS DISTINCT FROM p_terms_hash OR (state->>'decisionRevision')::bigint<>p_expected_decision_revision OR state->>'reportState'='withdrawn' THEN RAISE EXCEPTION 'Evidence decision conflict' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_agreement_decisions(evidence_id,business_id,customer_id,engagement_id,created_by,decision_revision,action,statement,quote_revision,terms_hash,reviewed_engagement_revision,reviewed_source_hash,operation_id)
 VALUES(e.id,p_business_id,p_customer_id,p_engagement_id,auth.uid(),p_expected_decision_revision+1,p_action,p_statement,e.quote_revision,e.terms_hash,r.revision,r.source_hash,p_operation_id) RETURNING * INTO d;
 RETURN jsonb_build_object('operation','engagement_owner_report_decision','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',r.id,'evidenceId',e.id,'decisionId',d.id,'actorId',auth.uid(),'schemaVersion',1,'previousRevision',p_expected_decision_revision,'revision',d.decision_revision,'engagementRevision',r.revision,'quoteRevision',e.quote_revision,'termsHash',e.terms_hash,'sourceHash',r.source_hash,'action',p_action,'verification','unverified','recordedAt',d.recorded_at,'bookingEligible',false);
END $$;

CREATE FUNCTION public.busy_work_quote_reference_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_expected_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE;terms jsonb;
BEGIN
 IF p_expected_revision IS NULL OR NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_quote_reference_create_v1(uuid,text,uuid,bigint,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Quote preparation unavailable' USING ERRCODE='42501';END IF;
 r:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);terms:=busy_work_private.quote_terms(r);
 RETURN busy_work_private.project(r)||jsonb_build_object('currentQuoteReferenceReview',true,'terms',terms,'termsHash',busy_work_private.hash(terms),'presentationState','prepared_not_presented','executionAuthorised',false);
END $$;

CREATE FUNCTION public.busy_work_quote_reference_create_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_expected_revision bigint,p_terms_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE;t jsonb;q public.business_work_quote_references%ROWTYPE;
BEGIN
 IF p_expected_revision IS NULL OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Invalid preparation' USING ERRCODE='22023';END IF;
 r:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id,p_expected_revision);t:=busy_work_private.quote_terms(r);
 IF p_terms_hash IS NULL OR p_terms_hash IS DISTINCT FROM busy_work_private.hash(t) THEN RAISE EXCEPTION 'Quote terms changed' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_quote_references(business_id,customer_id,engagement_id,created_by,quote_revision,terms,terms_hash,source_hash,operation_id)
 VALUES(p_business_id,p_customer_id,r.id,auth.uid(),r.revision,t,p_terms_hash,r.source_hash,p_operation_id) RETURNING * INTO q;
 RETURN jsonb_build_object('operation','engagement_quote_reference','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',r.id,'actorId',auth.uid(),'referenceId',q.id,'schemaVersion',1,'previousRevision',0,'revision',1,'quoteRevision',r.revision,'termsHash',q.terms_hash,'sourceHash',r.source_hash,'presentationState',q.state,'recordedAt',q.recorded_at,'executionAuthorised',false);
END $$;

CREATE FUNCTION public.busy_work_quote_reference_list_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id);items jsonb;cursor uuid;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid page size' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('referenceId',id,'quoteRevision',quote_revision,'presentationState',state) ORDER BY id),'[]') INTO items FROM (SELECT * FROM public.business_work_quote_references WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND created_by=auth.uid() AND (p_after IS NULL OR id>p_after) ORDER BY id LIMIT p_limit) x;
 IF jsonb_array_length(items)=p_limit THEN cursor:=(items->(p_limit-1)->>'referenceId')::uuid;END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'ownerId',auth.uid(),'items',items,'nextCursor',cursor,'notOwnReceipt',true);
END $$;

CREATE FUNCTION public.busy_work_quote_reference_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r public.business_work_engagements%ROWTYPE:=busy_work_private.target(p_business_id,p_customer_id,p_engagement_id);q public.business_work_quote_references%ROWTYPE;t jsonb;
BEGIN
 SELECT * INTO q FROM public.business_work_quote_references WHERE id=p_reference_id AND business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND created_by=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Quote reference unavailable' USING ERRCODE='42501';END IF;
 t:=busy_work_private.quote_terms(r);
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'ownerId',auth.uid(),'referenceId',q.id,'revision',1,'quoteRevision',q.quote_revision,'terms',q.terms,'termsHash',q.terms_hash,'sourceHash',q.source_hash,'recordedAt',q.recorded_at,'presentationState',q.state,'currentQuoteRevision',r.revision,'currentTerms',t,'termsChanged',busy_work_private.hash(t) IS DISTINCT FROM q.terms_hash,'notOwnReceipt',true,'executionAuthorised',false,'providerEvidence','not_established_by_protocol','customerResponseEvidence','no_exact_quote_reference_in_original_protocol','requestAssociationState','not_established_by_protocol');
END $$;

-- Original-link lookup only; no new identity store or permission grant.
CREATE INDEX busy_quote_recipient_link_lookup ON public.busy_mini_app_request_links(business_id,customer_record_id,linked_by,request_id);

-- Identity observation only. Owner-linked CRM/request provenance is not verified personhood.
CREATE FUNCTION public.busy_work_quote_recipient_candidates_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v jsonb:=public.busy_work_quote_reference_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);items jsonb;cursor uuid;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid recipient page' USING ERRCODE='22023';END IF;
 IF v->>'termsChanged'='true' THEN RAISE EXCEPTION 'Current exact quote reference required' USING ERRCODE='40001';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('requestId',id,'appId',mini_app_id,'requestRevision',updated_at) ORDER BY id),'[]') INTO items FROM (
 SELECT r.id,r.mini_app_id,r.updated_at FROM public.busy_mini_app_requests r JOIN public.busy_mini_app_request_links l ON l.business_id=r.business_id AND l.request_id=r.id
 WHERE r.business_id=p_business_id AND l.customer_record_id=p_customer_id AND l.linked_by=auth.uid() AND r.consumer_user_id IS NOT NULL AND r.status='reviewing' AND l.bridge_state IN ('enquiry_linked','booking_draft') AND (p_after IS NULL OR r.id>p_after) ORDER BY r.id LIMIT p_limit) x;
 IF jsonb_array_length(items)=p_limit THEN cursor:=(items->(p_limit-1)->>'requestId')::uuid;END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'items',items,'nextCursor',cursor,'candidateOnly',true,'notOwnReceipt',true,'consumerAccessAuthorised',false);
END $$;

CREATE FUNCTION public.busy_work_quote_recipient_review_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v jsonb:=public.busy_work_quote_reference_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);r public.busy_mini_app_requests%ROWTYPE;l public.busy_mini_app_request_links%ROWTYPE;a public.busy_mini_apps%ROWTYPE;version public.busy_mini_app_versions%ROWTYPE;reason text:='missing_or_unsupported_request';identified boolean:=false;
BEGIN
 IF v->>'termsChanged'='true' THEN RAISE EXCEPTION 'Current exact quote reference required' USING ERRCODE='40001';END IF;
 -- Shared original request/link/app locks stabilise this observation only; no future execution authority.
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE id=p_request_id AND business_id=p_business_id FOR SHARE;
 IF FOUND THEN
  SELECT * INTO l FROM public.busy_mini_app_request_links WHERE request_id=r.id AND business_id=p_business_id FOR SHARE;
  IF FOUND AND l.customer_record_id=p_customer_id AND l.linked_by=auth.uid() AND r.status='reviewing' AND ((r.request_type='enquiry' AND r.module_key='enquiry' AND l.bridge_state='enquiry_linked') OR (r.request_type='booking_request' AND r.module_key='booking_request' AND l.bridge_state='booking_draft' AND l.action_record_id IS NOT NULL)) THEN
   SELECT * INTO a FROM public.busy_mini_apps WHERE id=r.mini_app_id AND business_id=p_business_id FOR SHARE;
   IF FOUND AND a.status IN ('live','update_pending') AND a.current_live_version_id IS NOT NULL AND a.current_live_version_id=r.version_id THEN
    SELECT * INTO version FROM public.busy_mini_app_versions WHERE id=r.version_id AND mini_app_id=a.id AND business_id=p_business_id AND state='live' FOR SHARE;
    IF FOUND AND r.consumer_user_id IS NOT NULL AND EXISTS(SELECT 1 FROM auth.users WHERE id=r.consumer_user_id) AND coalesce(to_jsonb(r)->>'request_origin','signed_in')='signed_in' THEN
     IF EXISTS(SELECT 1 FROM public.busy_mini_app_request_links x JOIN public.busy_mini_app_requests y ON y.id=x.request_id AND y.business_id=x.business_id WHERE x.business_id=p_business_id AND x.customer_record_id=p_customer_id AND y.consumer_user_id IS DISTINCT FROM r.consumer_user_id) THEN reason:='ambiguous_consumer_associations';
     ELSE identified:=true;reason:='owner_linked_signed_in_request';END IF;
    ELSE reason:='unsupported_consumer_or_request_origin';END IF;
   ELSE reason:='app_or_reviewed_version_unavailable';END IF;
  ELSE reason:='missing_or_incompatible_owner_link';END IF;
 END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'quoteRevision',v->'quoteRevision','termsHash',v->'termsHash','recipientIdentified',identified,'provenance',reason,'notOwnReceipt',true,'consumerAccessAuthorised',false,'quoteRequestAssociated',false,'customerResponseLinked',false,'executionAuthorised',false,'recipient',CASE WHEN identified THEN jsonb_build_object('consumerId',r.consumer_user_id,'requestId',r.id,'requestRevision',r.updated_at,'linkId',l.id,'linkRevision',l.updated_at,'appId',a.id,'appVersionId',version.id,'actionId',l.action_record_id) ELSE NULL END);
END $$;

CREATE FUNCTION public.busy_work_quote_binding_context_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_request_id uuid,p_expected_quote_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE q jsonb:=public.busy_work_quote_reference_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);v jsonb;
BEGIN
 IF p_expected_quote_revision IS NULL OR (q->>'quoteRevision')::bigint<>p_expected_quote_revision OR q->>'termsChanged'='true' THEN RAISE EXCEPTION 'Quote version changed' USING ERRCODE='40001';END IF;
 IF NOT has_function_privilege('authenticated',to_regprocedure('public.busy_work_quote_binding_write_v1(uuid,text,uuid,uuid,uuid,bigint,bigint,text,text)'),'EXECUTE') THEN RAISE EXCEPTION 'Private binding unavailable' USING ERRCODE='42501';END IF;
 v:=public.busy_work_quote_recipient_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_request_id);
 IF v->>'recipientIdentified' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Recipient unsupported; no private binding' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'revision',p_expected_quote_revision,'quoteRevision',p_expected_quote_revision,'sourceHash',q->'sourceHash','recordHash',q->'terms'->'recordHash','termsHash',q->'termsHash','terms',q->'terms','recipientReview',v,'reviewHash',busy_work_private.hash(v),'currentBindingReview',true,'bindingExists',EXISTS(SELECT 1 FROM public.business_work_quote_recipient_bindings WHERE business_id=p_business_id AND reference_id=p_reference_id AND created_by=auth.uid()),'consumerAccessAuthorised',false,'notOwnReceipt',true);
END $$;

CREATE FUNCTION public.busy_work_quote_binding_write_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid,p_request_id uuid,p_expected_quote_revision bigint,p_expected_binding_revision bigint,p_review_hash text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE v jsonb;r jsonb;b public.business_work_quote_recipient_bindings%ROWTYPE;
BEGIN
 IF p_expected_binding_revision IS DISTINCT FROM 0 OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Unsupported private binding revision' USING ERRCODE='40001';END IF;
 v:=public.busy_work_quote_binding_context_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,p_request_id,p_expected_quote_revision);
 IF p_review_hash IS NULL OR v->>'reviewHash' IS DISTINCT FROM p_review_hash OR v->>'bindingExists'='true' THEN RAISE EXCEPTION 'Recipient evidence changed or binding already exists' USING ERRCODE='40001';END IF;
 r:=v->'recipientReview'->'recipient';
 INSERT INTO public.business_work_quote_recipient_bindings(business_id,customer_id,engagement_id,reference_id,created_by,quote_revision,terms_hash,source_hash,review_hash,consumer_id,request_id,link_id,linking_owner_id,app_id,app_version_id,request_revision,link_revision,provenance,operation_id)
 VALUES(p_business_id,p_customer_id,p_engagement_id,p_reference_id,auth.uid(),p_expected_quote_revision,v->>'termsHash',v->>'sourceHash',p_review_hash,(r->>'consumerId')::uuid,p_request_id,(r->>'linkId')::uuid,auth.uid(),(r->>'appId')::uuid,(r->>'appVersionId')::uuid,r->>'requestRevision',r->>'linkRevision','owner_linked_signed_in_request',p_operation_id) RETURNING * INTO b;
 RETURN jsonb_build_object('operation','quote_recipient_binding','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'bindingId',b.id,'actorId',auth.uid(),'schemaVersion',1,'previousRevision',0,'revision',1,'quoteRevision',b.quote_revision,'termsHash',b.terms_hash,'sourceHash',b.source_hash,'reviewHash',b.review_hash,'consumerId',b.consumer_id,'requestId',b.request_id,'recordedAt',b.recorded_at,'consumerAccessAuthorised',false,'quoteRequestAssociated',false,'executionAuthorised',false);
END $$;

CREATE FUNCTION public.busy_work_quote_binding_read_v1(p_business_id uuid,p_customer_id text,p_engagement_id uuid,p_reference_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE q jsonb:=public.busy_work_quote_reference_read_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id);b public.business_work_quote_recipient_bindings%ROWTYPE;v jsonb;eligibility text;recipient jsonb;
BEGIN
 SELECT * INTO b FROM public.business_work_quote_recipient_bindings WHERE business_id=p_business_id AND customer_id=p_customer_id AND engagement_id=p_engagement_id AND reference_id=p_reference_id AND created_by=auth.uid();
 IF NOT FOUND THEN eligibility:='absent';
 ELSIF q->>'termsChanged'='true' THEN eligibility:='stale_quote_version';
 ELSE
  v:=public.busy_work_quote_recipient_review_v1(p_business_id,p_customer_id,p_engagement_id,p_reference_id,b.request_id);
  IF v->>'recipientIdentified' IS DISTINCT FROM 'true' THEN eligibility:='unavailable_recipient';
  ELSIF busy_work_private.hash(v) IS DISTINCT FROM b.review_hash THEN eligibility:='changed_source_evidence';
  ELSE eligibility:='current';recipient:=v->'recipient';END IF;
 END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'engagementId',p_engagement_id,'referenceId',p_reference_id,'ownerId',auth.uid(),'binding',CASE WHEN b.id IS NULL THEN NULL ELSE jsonb_build_object('bindingId',b.id,'revision',b.revision,'quoteRevision',b.quote_revision,'termsHash',b.terms_hash,'reviewHash',b.review_hash,'recordedAt',b.recorded_at,'provenance',b.provenance) END,'eligibility',eligibility,'recipient',recipient,'notOwnReceipt',true,'consumerAccessAuthorised',false,'quoteRequestAssociated',false,'executionAuthorised',false);
END $$;

-- Separate public-facing boundary. Hard denial precedes any private data lookup.
CREATE FUNCTION public.busy_work_consumer_quote_access_v1(p_binding_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
BEGIN RAISE EXCEPTION 'Consumer quote access disabled pending separate disclosure approval' USING ERRCODE='42501';END $$;

CREATE FUNCTION public.busy_work_consumer_quote_response_v1(p_binding_id uuid,p_action text,p_idempotency_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,pg_temp AS $$
BEGIN RAISE EXCEPTION 'Consumer quote response disabled; no authorised access context' USING ERRCODE='42501';END $$;

CREATE FUNCTION busy_work_private.protect_quote_binding() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN RAISE EXCEPTION 'Immutable private recipient binding; replacement/revocation requires a separate finite contract' USING ERRCODE='42501';END $$;

CREATE TRIGGER busy_work_quote_binding_immutable BEFORE UPDATE ON public.business_work_quote_recipient_bindings FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_quote_binding();

CREATE FUNCTION busy_work_private.protect_quote_reference() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN RAISE EXCEPTION 'Immutable private quote preparation; no presentation or acceptance inferred' USING ERRCODE='42501';END $$;

CREATE TRIGGER busy_work_quote_reference_immutable BEFORE UPDATE ON public.business_work_quote_references FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_quote_reference();

CREATE FUNCTION busy_work_private.protect_agreement() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN RAISE EXCEPTION 'Immutable evidence; use a separately reviewed append-only decision' USING ERRCODE='42501';END $$;

CREATE TRIGGER busy_work_agreement_immutable BEFORE UPDATE ON public.business_work_agreement_evidence FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_agreement();

CREATE TRIGGER busy_work_agreement_decision_immutable BEFORE UPDATE ON public.business_work_agreement_decisions FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_agreement();

CREATE FUNCTION busy_work_private.protect_identity() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,pg_temp AS $$
BEGIN
 IF ROW(NEW.id,NEW.business_id,NEW.customer_id,NEW.enquiry_id,NEW.created_by,NEW.creation_operation_id,NEW.created_at,NEW.legacy_record_hash,NEW.source_hash,NEW.customer_hash,NEW.source_evidence,NEW.kind,NEW.status,NEW.schema_version) IS DISTINCT FROM ROW(OLD.id,OLD.business_id,OLD.customer_id,OLD.enquiry_id,OLD.created_by,OLD.creation_operation_id,OLD.created_at,OLD.legacy_record_hash,OLD.source_hash,OLD.customer_hash,OLD.source_evidence,OLD.kind,OLD.status,OLD.schema_version) THEN RAISE EXCEPTION 'Immutable engagement/source identity' USING ERRCODE='42501';END IF;
 RETURN NEW;
END $$;

CREATE TRIGGER busy_canonical_identity BEFORE UPDATE ON public.business_work_engagements FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_identity();

-- Migrated legacy Work becomes read-only: no writable second authority.
CREATE FUNCTION busy_work_private.protect_legacy() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE r record;
BEGIN
 FOR r IN SELECT customer_id FROM public.business_work_engagements WHERE business_id=OLD.business_id AND legacy_record_hash IS NOT NULL LOOP
  IF TG_OP='DELETE' OR OLD.payload->'replyActions'->r.customer_id IS DISTINCT FROM NEW.payload->'replyActions'->r.customer_id THEN RAISE EXCEPTION 'Canonical legacy Work is read-only' USING ERRCODE='42501';END IF;
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;

CREATE TRIGGER busy_canonical_legacy_readonly BEFORE UPDATE OR DELETE ON public.busy_business_snapshots FOR EACH ROW EXECUTE FUNCTION busy_work_private.protect_legacy();

DO $$ DECLARE f record;r text;t regclass;
BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature,p.proname FROM pg_proc p WHERE p.pronamespace='busy_work_private'::regnamespace OR p.pronamespace='public'::regnamespace AND p.proname IN ('busy_work_source_review_v1','busy_work_create_quote_v1','busy_work_migrate_legacy_v1','busy_work_list_v1','busy_work_discover_v1','busy_work_compare_v1','busy_work_edit_context_v1','busy_work_history_v1','busy_work_read_v1','busy_work_edit_quote_v1','busy_work_private_read_v1','busy_work_private_write_v1','busy_work_agreement_review_v1','busy_work_agreement_create_v1','busy_work_agreement_list_v1','busy_work_agreement_read_v1','busy_work_agreement_decision_review_v1','busy_work_agreement_decide_v1','busy_work_booking_readiness_v1','busy_work_quote_reference_review_v1','busy_work_quote_reference_create_v1','busy_work_quote_reference_list_v1','busy_work_quote_reference_read_v1','busy_work_quote_recipient_candidates_v1','busy_work_quote_recipient_review_v1','busy_work_quote_binding_context_v1','busy_work_quote_binding_write_v1','busy_work_quote_binding_read_v1','busy_work_consumer_quote_access_v1','busy_work_consumer_quote_response_v1') LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
  IF f.proname LIKE 'busy_work_%' AND f.proname<>'busy_work_migrate_legacy_v1' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
 END LOOP;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  FOREACH t IN ARRAY ARRAY['public.business_work_engagements'::regclass,'public.business_work_private_drafts'::regclass,'public.business_work_agreement_evidence'::regclass,'public.business_work_agreement_decisions'::regclass,'public.business_work_quote_references'::regclass,'public.business_work_quote_recipient_bindings'::regclass] LOOP
   IF has_any_column_privilege(r,t,'SELECT,INSERT,UPDATE,REFERENCES') OR has_table_privilege(r,t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') THEN RAISE EXCEPTION 'Effective raw privilege remains for % on %',r,t;END IF;
  END LOOP;
  IF has_any_column_privilege(r,'public.busy_business_snapshots','UPDATE') OR has_table_privilege(r,'public.busy_business_snapshots','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') THEN RAISE EXCEPTION 'Snapshot fence missing';END IF;
  IF EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid='public.busy_business_snapshots'::regclass AND attnum>0 AND NOT attisdropped AND attname<>'business_id' AND has_column_privilege(r,'public.busy_business_snapshots',attname,'SELECT,INSERT')) THEN RAISE EXCEPTION 'Broad snapshot column access remains';END IF;
  IF has_schema_privilege(r,'busy_work_private','USAGE') THEN RAISE EXCEPTION 'Private helper schema exposed';END IF;
  FOR f IN SELECT p.oid,p.proname,p.pronamespace FROM pg_proc p WHERE p.pronamespace='busy_work_private'::regnamespace OR p.pronamespace='public'::regnamespace AND left(p.proname,10)='busy_work_' LOOP
   IF (f.pronamespace='busy_work_private'::regnamespace OR f.proname='busy_work_migrate_legacy_v1' OR r<>'authenticated') AND has_function_privilege(r,f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Unexpected inherited RPC execution' USING ERRCODE='42501';END IF;
  END LOOP;
 END LOOP;
END $$;
-- Source docs/sql-proposals/connected-builders/private-work-permissions.sql SHA256 7d33e4c826a8a3ed2aa6bf8fe312c78c531af181d10ffe0f9ac279a2e1a77119

DO $$ DECLARE f record;BEGIN
 FOR f IN SELECT oid::regprocedure AS signature,proname FROM pg_proc WHERE pronamespace='public'::regnamespace AND left(proname,10)='busy_work_' LOOP
  EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
  IF f.proname=ANY(ARRAY['busy_work_source_review_v1','busy_work_create_quote_v1','busy_work_list_v1','busy_work_discover_v1','busy_work_compare_v1','busy_work_edit_context_v1','busy_work_history_v1','busy_work_read_v1','busy_work_edit_quote_v1','busy_work_private_read_v1','busy_work_private_write_v1']) THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
 END LOOP;
END $$;
-- Source docs/sql-proposals/connected-builders/app-transaction.sql SHA256 4ce5b4b5e15bd6e4ab60e06be3febdf86b813247c554e6882d918a1f5265beb6

CREATE FUNCTION public.busy_connected_private_app_commit_v1(p_business_id uuid,p_actor_id uuid,p_app_id uuid,p_expected_revision bigint,p_profile_revision bigint,p_patch jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE role_name text;a public.busy_mini_apps%ROWTYPE;p public.busy_public_business_profiles%ROWTYPE;
BEGIN
 IF p_actor_id IS NULL OR p_business_id IS NULL THEN RAISE EXCEPTION 'Verified owner required' USING ERRCODE='42501';END IF;
 SELECT role INTO role_name FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id FOR SHARE;
 IF role_name IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO p FROM public.busy_public_business_profiles WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR p.revision IS DISTINCT FROM p_profile_revision THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE business_id=p_business_id AND id=p_app_id FOR UPDATE;
 IF NOT FOUND OR p_expected_revision IS NULL OR a.draft_revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'App revision changed' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' OR p_patch-ARRAY['draft_config','draft_revision','status','updated_at','display_name','category','tagline','draft_profile_revision','last_error']<>'{}' OR jsonb_typeof(p_patch->'draft_config') IS DISTINCT FROM 'object' OR octet_length(p_patch::text)>200000 OR (p_patch->>'draft_revision')::bigint IS DISTINCT FROM a.draft_revision+1 OR p_patch->>'status' IS DISTINCT FROM (CASE WHEN a.current_live_version_id IS NULL THEN 'draft' ELSE 'update_pending' END) OR p_patch ? 'last_error' AND p_patch->'last_error'<>'null' THEN RAISE EXCEPTION 'Finite private draft patch required' USING ERRCODE='22023';END IF;
 IF jsonb_typeof((p_patch->'draft_config')) IS DISTINCT FROM 'object' OR jsonb_typeof((p_patch->'draft_config')->'modules') IS DISTINCT FROM 'array' OR jsonb_typeof((p_patch->'draft_config')->'navigation') IS DISTINCT FROM 'array' OR (p_patch->'draft_config')->>'surface' IS DISTINCT FROM 'busy_mini_app' THEN RAISE EXCEPTION 'Original App config arrays and surface required' USING ERRCODE='22023';END IF;
 IF jsonb_array_length((p_patch->'draft_config')->'modules') NOT BETWEEN 1 AND 40 OR jsonb_array_length((p_patch->'draft_config')->'navigation') NOT BETWEEN 1 AND 40 OR EXISTS(SELECT 1 FROM jsonb_array_elements((p_patch->'draft_config')->'modules')m WHERE jsonb_typeof(m) IS DISTINCT FROM 'object' OR jsonb_typeof(m->'enabled') IS DISTINCT FROM 'boolean' OR jsonb_typeof(m->'key') IS DISTINCT FROM 'string' OR NOT EXISTS(SELECT 1 FROM public.busy_mini_app_module_catalog c WHERE c.module_key=m->>'key')) OR (SELECT count(*)<>count(DISTINCT m->>'key') FROM jsonb_array_elements((p_patch->'draft_config')->'modules')m) OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements((p_patch->'draft_config')->'modules')m WHERE m->>'key'='business_profile' AND m->'enabled'='true'::jsonb) THEN RAISE EXCEPTION 'Known unique App modules required' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements((p_patch->'draft_config')->'navigation')n WHERE jsonb_typeof(n) IS DISTINCT FROM 'string') OR (SELECT count(*)<>count(DISTINCT n) FROM jsonb_array_elements((p_patch->'draft_config')->'navigation')n) OR (SELECT coalesce(jsonb_agg(m->'key' ORDER BY m->>'key'),'[]'::jsonb) FROM jsonb_array_elements((p_patch->'draft_config')->'modules')m WHERE m->'enabled'='true'::jsonb) IS DISTINCT FROM (SELECT jsonb_agg(n ORDER BY n#>>'{}') FROM jsonb_array_elements((p_patch->'draft_config')->'navigation')n) THEN RAISE EXCEPTION 'Navigation must match enabled App modules' USING ERRCODE='22023';END IF;
 IF jsonb_typeof(p_patch#>'{draft_config,modules}') IS DISTINCT FROM 'array' OR jsonb_array_length(p_patch#>'{draft_config,modules}')>40 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_patch#>'{draft_config,modules}')m WHERE m->>'enabled'='true' AND NOT EXISTS(SELECT 1 FROM public.busy_mini_app_module_catalog c WHERE c.module_key=m->>'key' AND c.status='available')) THEN RAISE EXCEPTION 'Unavailable App capability' USING ERRCODE='22023';END IF;
 IF p_patch ? 'draft_profile_revision' AND (p_patch->>'draft_profile_revision')::bigint IS DISTINCT FROM p.revision THEN RAISE EXCEPTION 'Profile revision mismatch' USING ERRCODE='40001';END IF;
 UPDATE public.busy_mini_apps SET draft_config=p_patch->'draft_config',draft_revision=a.draft_revision+1,status=p_patch->>'status',updated_at=clock_timestamp(),display_name=CASE WHEN p_patch?'display_name' THEN p_patch->>'display_name' ELSE a.display_name END,category=CASE WHEN p_patch?'category' THEN p_patch->>'category' ELSE a.category END,tagline=CASE WHEN p_patch?'tagline' THEN p_patch->>'tagline' ELSE a.tagline END,draft_profile_revision=CASE WHEN p_patch?'draft_profile_revision' THEN p.revision ELSE a.draft_profile_revision END WHERE id=a.id RETURNING * INTO a;
 RETURN to_jsonb(a);
END $$;

ALTER FUNCTION public.busy_connected_private_app_commit_v1(uuid,uuid,uuid,bigint,bigint,jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_connected_private_app_commit_v1(uuid,uuid,uuid,bigint,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_connected_private_app_commit_v1(uuid,uuid,uuid,bigint,bigint,jsonb) TO service_role;

CREATE FUNCTION public.busy_connected_first_app_v1(p_business_id uuid,p_actor_user_id uuid,p_public_slug text,p_display_name text,p_category text,p_tagline text,p_profile_revision bigint,p_draft_config jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE member_role text;r bigint;
BEGIN
 SELECT role INTO member_role FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_user_id FOR SHARE;
 IF member_role IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501';END IF;
 SELECT revision INTO r FROM public.busy_public_business_profiles WHERE business_id=p_business_id FOR SHARE;
 IF r IS NULL OR r IS DISTINCT FROM p_profile_revision THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(p_draft_config) IS DISTINCT FROM 'object' OR jsonb_typeof(p_draft_config->'modules') IS DISTINCT FROM 'array' OR jsonb_typeof(p_draft_config->'navigation') IS DISTINCT FROM 'array' OR p_draft_config->>'surface' IS DISTINCT FROM 'busy_mini_app' THEN RAISE EXCEPTION 'Original App config arrays and surface required' USING ERRCODE='22023';END IF;
 IF jsonb_array_length(p_draft_config->'modules') NOT BETWEEN 1 AND 40 OR jsonb_array_length(p_draft_config->'navigation') NOT BETWEEN 1 AND 40 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_draft_config->'modules')m WHERE jsonb_typeof(m) IS DISTINCT FROM 'object' OR jsonb_typeof(m->'enabled') IS DISTINCT FROM 'boolean' OR jsonb_typeof(m->'key') IS DISTINCT FROM 'string' OR NOT EXISTS(SELECT 1 FROM public.busy_mini_app_module_catalog c WHERE c.module_key=m->>'key')) OR (SELECT count(*)<>count(DISTINCT m->>'key') FROM jsonb_array_elements(p_draft_config->'modules')m) OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_draft_config->'modules')m WHERE m->>'key'='business_profile' AND m->'enabled'='true'::jsonb) THEN RAISE EXCEPTION 'Known unique App modules required' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_draft_config->'navigation')n WHERE jsonb_typeof(n) IS DISTINCT FROM 'string') OR (SELECT count(*)<>count(DISTINCT n) FROM jsonb_array_elements(p_draft_config->'navigation')n) OR (SELECT coalesce(jsonb_agg(m->'key' ORDER BY m->>'key'),'[]'::jsonb) FROM jsonb_array_elements(p_draft_config->'modules')m WHERE m->'enabled'='true'::jsonb) IS DISTINCT FROM (SELECT jsonb_agg(n ORDER BY n#>>'{}') FROM jsonb_array_elements(p_draft_config->'navigation')n) THEN RAISE EXCEPTION 'Navigation must match enabled App modules' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_draft_config->'modules')m WHERE m->>'enabled'='true' AND NOT EXISTS(SELECT 1 FROM public.busy_mini_app_module_catalog c WHERE c.module_key=m->>'key' AND c.status='available')) THEN RAISE EXCEPTION 'Unavailable App capability' USING ERRCODE='22023';END IF;
 RETURN public.busy_create_first_mini_app_draft_v3199(p_business_id,p_actor_user_id,p_public_slug,p_display_name,p_category,p_tagline,p_profile_revision,p_draft_config);
END $$;

ALTER FUNCTION public.busy_connected_first_app_v1(uuid,uuid,text,text,text,text,bigint,jsonb) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.busy_connected_first_app_v1(uuid,uuid,text,text,text,text,bigint,jsonb) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_connected_first_app_v1(uuid,uuid,text,text,text,text,bigint,jsonb) TO service_role;
-- Source docs/sql-proposals/growth/opportunities.sql SHA256 30c421cad0cf7d2d7ac6ac449ca5f944fb241cd93cdccae660688201e35a2992

-- Never adopt a table/function/schema pre-created by an untrusted role.
DO $$ DECLARE n record;BEGIN
 FOR n IN SELECT nspowner owner,obj_description(oid,'pg_namespace') marker FROM pg_namespace WHERE nspname='busy_growth_private' LOOP
  IF n.owner<>'postgres'::regrole OR n.marker IS DISTINCT FROM 'busy_growth_owner_opportunity_v1' THEN RAISE EXCEPTION 'Unreviewed Growth schema' USING ERRCODE='42501';END IF;
 END LOOP;
 FOR n IN SELECT c.relowner owner,obj_description(c.oid,'pg_class') marker FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='public' AND c.relname IN ('busy_growth_opportunities','busy_growth_opportunity_versions') LOOP
  IF n.owner<>'postgres'::regrole OR n.marker IS DISTINCT FROM 'busy_growth_owner_opportunity_v1' THEN RAISE EXCEPTION 'Unreviewed Growth relation' USING ERRCODE='42501';END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE (ns.nspname='busy_growth_private' OR ns.nspname='public' AND p.proname LIKE 'busy_growth_opportunity_%') AND p.proowner<>'postgres'::regrole) THEN RAISE EXCEPTION 'Untrusted Growth function owner' USING ERRCODE='42501';END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS busy_growth_private AUTHORIZATION postgres;

COMMENT ON SCHEMA busy_growth_private IS 'busy_growth_owner_opportunity_v1';

REVOKE ALL ON SCHEMA busy_growth_private FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE IF NOT EXISTS public.busy_growth_opportunities(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES public.busy_businesses(id) ON DELETE RESTRICT,
 owner_id uuid NOT NULL,revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 UNIQUE(id,business_id,owner_id)
);

CREATE TABLE IF NOT EXISTS public.busy_growth_opportunity_versions(
 opportunity_id uuid NOT NULL,business_id uuid NOT NULL,owner_id uuid NOT NULL,revision bigint NOT NULL CHECK(revision>0),
 action text NOT NULL CHECK(action IN ('create','edit','retire','reopen','reinspect','feedback')),
 state text NOT NULL CHECK(state IN ('active','retired')),
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 100 AND btrim(title)<>''),
 description text NOT NULL CHECK(length(description) BETWEEN 1 AND 600 AND btrim(description)<>''),
 source_account text NOT NULL CHECK(length(source_account) BETWEEN 1 AND 300 AND btrim(source_account)<>''),
 service_id text NOT NULL CHECK(length(service_id) BETWEEN 1 AND 128),
 permission text NOT NULL CHECK(permission IN ('permitted','unknown','restricted')),
 provenance text NOT NULL DEFAULT 'owner_reported' CHECK(provenance='owner_reported'),
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),reviewed_source_hash text,
 feedback text NOT NULL DEFAULT 'clear' CHECK(feedback IN ('clear','useful','irrelevant','later')),
 feedback_reason text NOT NULL DEFAULT '' CHECK(length(feedback_reason)<=300),
 operation_id text NOT NULL CHECK(operation_id ~ '^[A-Za-z0-9_-]{8,120}$'),recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(opportunity_id,revision),UNIQUE(business_id,owner_id,operation_id),
 FOREIGN KEY(opportunity_id,business_id,owner_id) REFERENCES public.busy_growth_opportunities(id,business_id,owner_id) ON DELETE RESTRICT
);

COMMENT ON TABLE public.busy_growth_opportunities IS 'busy_growth_owner_opportunity_v1';

COMMENT ON TABLE public.busy_growth_opportunity_versions IS 'busy_growth_owner_opportunity_v1';

CREATE INDEX IF NOT EXISTS busy_growth_owner_page ON public.busy_growth_opportunities(business_id,owner_id,id);

ALTER TABLE public.busy_growth_opportunities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.busy_growth_opportunity_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_growth_opportunities,public.busy_growth_opportunity_versions FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION busy_growth_private.authorize(b uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=auth.uid();r text;creator uuid;
BEGIN
 IF a IS NULL OR b IS NULL THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT role INTO r FROM public.busy_business_memberships WHERE business_id=b AND user_id=a FOR SHARE;
 SELECT created_by INTO creator FROM public.busy_businesses WHERE id=b FOR SHARE;
 IF r IS DISTINCT FROM 'owner' OR creator IS DISTINCT FROM a THEN RAISE EXCEPTION 'Original current owner required' USING ERRCODE='42501';END IF;RETURN a;
END $$;

CREATE OR REPLACE FUNCTION busy_growth_private.projection(v public.busy_growth_opportunity_versions) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,pg_temp AS $$
 SELECT jsonb_build_object('opportunityId',v.opportunity_id,'businessId',v.business_id,'ownerId',v.owner_id,'revision',v.revision,'state',v.state,'action',v.action,'record',jsonb_build_object('title',v.title,'description',v.description,'source',v.source_account,'serviceId',v.service_id,'permission',v.permission),'provenance',v.provenance,'sourceHash',v.source_hash,'reviewedSourceHash',v.reviewed_source_hash,'feedback',v.feedback,'feedbackReason',v.feedback_reason,'recordedAt',v.recorded_at,'contactPermission','not_established','outcomes','not_established','notOwnReceipt',true)
$$;

CREATE OR REPLACE FUNCTION public.busy_growth_opportunity_read_v1(p_business_id uuid,p_opportunity_id uuid,p_revision bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);h public.busy_growth_opportunities%ROWTYPE;v public.busy_growth_opportunity_versions%ROWTYPE;
BEGIN
 SELECT * INTO h FROM public.busy_growth_opportunities WHERE id=p_opportunity_id AND business_id=p_business_id AND owner_id=a FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Opportunity unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO v FROM public.busy_growth_opportunity_versions WHERE opportunity_id=h.id AND revision=coalesce(p_revision,h.revision);
 IF NOT FOUND THEN RAISE EXCEPTION 'Version unavailable' USING ERRCODE='22023';END IF;
 RETURN busy_growth_private.projection(v)||jsonb_build_object('currentRevision',h.revision,'historical',v.revision<>h.revision);
END $$;

CREATE OR REPLACE FUNCTION public.busy_growth_opportunity_list_v1(p_business_id uuid,p_after uuid DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);items jsonb;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Bounded page required' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_agg(x.item ORDER BY x.id),'[]') INTO items FROM (SELECT h.id,jsonb_build_object('opportunityId',h.id,'revision',h.revision,'title',v.title,'state',v.state,'permission',v.permission,'feedback',v.feedback) item FROM public.busy_growth_opportunities h JOIN public.busy_growth_opportunity_versions v ON v.opportunity_id=h.id AND v.revision=h.revision WHERE h.business_id=p_business_id AND h.owner_id=a AND (p_after IS NULL OR h.id>p_after) ORDER BY h.id LIMIT p_limit) x;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'items',items,'nextAfter',CASE WHEN jsonb_array_length(items)=p_limit THEN items->-1->>'opportunityId' ELSE NULL END,'notOwnReceipt',true);
END $$;

CREATE OR REPLACE FUNCTION public.busy_growth_opportunity_write_v1(p_business_id uuid,p_opportunity_id uuid,p_expected_revision bigint,p_source_hash text,p_action text,p_record jsonb,p_feedback text,p_reason text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);h public.busy_growth_opportunities%ROWTYPE;v public.busy_growth_opportunity_versions%ROWTYPE;next_hash text;body jsonb;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' OR p_expected_revision IS NULL OR p_expected_revision<0 OR p_action IS NULL OR p_action NOT IN ('create','edit','retire','reopen','reinspect','feedback') THEN RAISE EXCEPTION 'Finite action and operation required' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM public.busy_growth_opportunity_versions WHERE business_id=p_business_id AND owner_id=a AND operation_id=p_operation_id) THEN RAISE EXCEPTION 'Already attempted: inspect independently, never replay' USING ERRCODE='40001';END IF;
 IF p_action='create' THEN
  IF p_opportunity_id IS NOT NULL OR p_expected_revision<>0 OR p_source_hash IS NOT NULL THEN RAISE EXCEPTION 'New server identity required' USING ERRCODE='22023';END IF;
  INSERT INTO public.busy_growth_opportunities(business_id,owner_id)VALUES(p_business_id,a)RETURNING * INTO h;
  v.state:='active';v.feedback:='clear';v.feedback_reason:='';
 ELSE
  SELECT * INTO h FROM public.busy_growth_opportunities WHERE id=p_opportunity_id AND business_id=p_business_id AND owner_id=a FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Opportunity unavailable' USING ERRCODE='42501';END IF;
  SELECT * INTO v FROM public.busy_growth_opportunity_versions WHERE opportunity_id=h.id AND revision=h.revision;
  IF h.revision<>p_expected_revision OR v.source_hash IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Revision/source conflict' USING ERRCODE='40001';END IF;
  IF v.state='retired' AND p_action<>'reopen' OR v.state='active' AND p_action='reopen' THEN RAISE EXCEPTION 'Invalid lifecycle decision' USING ERRCODE='40001';END IF;
  h.revision:=h.revision+1;
 END IF;
 IF p_action IN ('create','edit') THEN
  IF jsonb_typeof(p_record) IS DISTINCT FROM 'object' OR p_record-ARRAY['title','description','source','serviceId','permission']<>'{}' OR (SELECT count(*)FROM jsonb_object_keys(p_record))<>5 OR EXISTS(SELECT 1 FROM jsonb_each(p_record)WHERE jsonb_typeof(value)<>'string') OR length(p_record->>'title') NOT BETWEEN 1 AND 100 OR length(p_record->>'description') NOT BETWEEN 1 AND 600 OR length(p_record->>'source') NOT BETWEEN 1 AND 300 OR length(p_record->>'serviceId') NOT BETWEEN 1 AND 128 OR p_record->>'permission' NOT IN ('permitted','unknown','restricted') OR p_record::text ~ '[<>]' THEN RAISE EXCEPTION 'Finite owner report required' USING ERRCODE='22023';END IF;
  v.title:=p_record->>'title';v.description:=p_record->>'description';v.source_account:=p_record->>'source';v.service_id:=p_record->>'serviceId';v.permission:=p_record->>'permission';
  v.reviewed_source_hash:=NULL;v.feedback:='clear';v.feedback_reason:='';
 ELSIF p_record IS NOT NULL THEN RAISE EXCEPTION 'Unrelated report modification denied' USING ERRCODE='22023';END IF;
 body:=jsonb_build_object('title',v.title,'description',v.description,'source',v.source_account,'serviceId',v.service_id,'permission',v.permission);
 next_hash:=encode(sha256(convert_to(body::text,'UTF8')),'hex');
 IF p_action='reinspect' THEN v.reviewed_source_hash:=next_hash;END IF;
 IF p_action='retire' THEN v.state:='retired';v.reviewed_source_hash:=NULL;END IF;
 IF p_action='reopen' THEN v.state:='active';v.reviewed_source_hash:=NULL;END IF;
 IF p_action='feedback' THEN
  IF p_feedback IS NULL OR p_feedback NOT IN ('clear','useful','irrelevant','later') OR p_reason IS NULL OR length(p_reason)>300 OR v.reviewed_source_hash IS DISTINCT FROM next_hash THEN RAISE EXCEPTION 'Review exact source before feedback' USING ERRCODE='40001';END IF;
  v.feedback:=p_feedback;v.feedback_reason:=CASE WHEN p_feedback='clear' THEN '' ELSE p_reason END;
 ELSIF p_feedback IS NOT NULL OR p_reason IS NOT NULL THEN RAISE EXCEPTION 'Unrelated preference denied' USING ERRCODE='22023';END IF;
 INSERT INTO public.busy_growth_opportunity_versions(opportunity_id,business_id,owner_id,revision,action,state,title,description,source_account,service_id,permission,source_hash,reviewed_source_hash,feedback,feedback_reason,operation_id)VALUES(h.id,p_business_id,a,h.revision,p_action,v.state,v.title,v.description,v.source_account,v.service_id,v.permission,next_hash,v.reviewed_source_hash,v.feedback,v.feedback_reason,p_operation_id)RETURNING * INTO v;
 UPDATE public.busy_growth_opportunities SET revision=h.revision WHERE id=h.id;
 RETURN busy_growth_private.projection(v)||jsonb_build_object('notOwnReceipt',false,'ownOperationReceipt',true,'operationId',p_operation_id,'previousRevision',p_expected_revision,'executionAuthorised',false);
END $$;

-- Independent exact operation observation for uncertain outcomes; never an own-write receipt.
CREATE OR REPLACE FUNCTION public.busy_growth_opportunity_operation_v1(p_business_id uuid,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);v public.busy_growth_opportunity_versions%ROWTYPE;n bigint;
BEGIN
 IF p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{8,120}$' THEN RAISE EXCEPTION 'Exact operation required' USING ERRCODE='22023';END IF;
 SELECT * INTO v FROM public.busy_growth_opportunity_versions WHERE business_id=p_business_id AND owner_id=a AND operation_id=p_operation_id;
 IF NOT FOUND THEN RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'found',false,'notOwnReceipt',true);END IF;
 SELECT revision INTO n FROM public.busy_growth_opportunities WHERE id=v.opportunity_id;
 RETURN busy_growth_private.projection(v)||jsonb_build_object('found',true,'operationObserved',true,'operationId',p_operation_id,'currentRevision',n,'historical',v.revision<>n);
END $$;

REVOKE ALL ON FUNCTION public.busy_growth_opportunity_operation_v1(uuid,text) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_growth_opportunity_operation_v1(uuid,text) TO authenticated;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA busy_growth_private FROM PUBLIC,anon,authenticated,service_role;

REVOKE ALL ON FUNCTION public.busy_growth_opportunity_read_v1(uuid,uuid,bigint),public.busy_growth_opportunity_list_v1(uuid,uuid,integer),public.busy_growth_opportunity_write_v1(uuid,uuid,bigint,text,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_growth_opportunity_read_v1(uuid,uuid,bigint),public.busy_growth_opportunity_list_v1(uuid,uuid,integer),public.busy_growth_opportunity_write_v1(uuid,uuid,bigint,text,text,jsonb,text,text,text) TO authenticated;
-- Source docs/sql-proposals/creator/private-drafts.sql SHA256 d8b3beada8ca71a87d50aa410a5ec257e271b4b0a615c35f42abec70fd05a5f8

-- Reapplication is allowed only for the marked postgres-owned proposal, never hostile objects.
DO $$ DECLARE obj record;BEGIN
 FOR obj IN SELECT nspowner AS owner,obj_description(oid,'pg_namespace') marker FROM pg_namespace WHERE nspname='busy_creator_private' LOOP
 IF obj.owner<>'postgres'::regrole OR obj.marker IS DISTINCT FROM 'creator_private_v1' THEN RAISE EXCEPTION 'Untrusted Creator schema' USING ERRCODE='42501';END IF;END LOOP;
 FOR obj IN SELECT c.relowner AS owner,obj_description(c.oid,'pg_class') marker FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('busy_creator_draft_heads','busy_creator_draft_versions') LOOP
 IF obj.owner<>'postgres'::regrole OR obj.marker IS DISTINCT FROM 'creator_private_v1' THEN RAISE EXCEPTION 'Untrusted Creator table' USING ERRCODE='42501';END IF;END LOOP;
 IF EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='busy_creator_private' OR n.nspname='public' AND (p.proname LIKE 'busy_creator_draft_%' OR p.proname='busy_creator_media_review_v1')) AND p.proowner<>'postgres'::regrole) THEN RAISE EXCEPTION 'Untrusted Creator function' USING ERRCODE='42501';END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS busy_creator_private AUTHORIZATION postgres;

COMMENT ON SCHEMA busy_creator_private IS 'creator_private_v1';

REVOKE ALL ON SCHEMA busy_creator_private FROM PUBLIC,anon,authenticated,service_role;

CREATE TABLE IF NOT EXISTS public.busy_creator_draft_heads(
 business_id uuid NOT NULL REFERENCES public.busy_businesses(id) ON DELETE RESTRICT,
 owner_id uuid NOT NULL,draft_id text NOT NULL CHECK(draft_id ~ '^[A-Za-z0-9_-]{1,120}$'),revision bigint NOT NULL CHECK(revision>0),
 PRIMARY KEY(business_id,owner_id,draft_id)
);

CREATE TABLE IF NOT EXISTS public.busy_creator_draft_versions(
 business_id uuid NOT NULL,owner_id uuid NOT NULL,draft_id text NOT NULL,revision bigint NOT NULL CHECK(revision>0),
 content jsonb NOT NULL,opportunity_id uuid,opportunity_revision bigint,source_hash text,
 operation_id uuid NOT NULL DEFAULT gen_random_uuid(),request_key text NOT NULL CHECK(request_key ~ '^[A-Za-z0-9_-]{8,120}$'),
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(business_id,owner_id,draft_id,revision),UNIQUE(business_id,owner_id,request_key),UNIQUE(operation_id),
 FOREIGN KEY(business_id,owner_id,draft_id) REFERENCES public.busy_creator_draft_heads(business_id,owner_id,draft_id) ON DELETE RESTRICT,
 FOREIGN KEY(opportunity_id,business_id,owner_id) REFERENCES public.busy_growth_opportunities(id,business_id,owner_id) ON DELETE RESTRICT
);

COMMENT ON TABLE public.busy_creator_draft_heads IS 'creator_private_v1';

COMMENT ON TABLE public.busy_creator_draft_versions IS 'creator_private_v1';

CREATE INDEX IF NOT EXISTS busy_creator_opportunity_page ON public.busy_creator_draft_versions(business_id,owner_id,opportunity_id,draft_id,revision);

ALTER TABLE public.busy_creator_draft_heads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.busy_creator_draft_versions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.busy_creator_draft_heads,public.busy_creator_draft_versions FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION busy_creator_private.valid_media_ref(v jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE k text;
BEGIN
 IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v) key) IS DISTINCT FROM ARRAY['assetId','fileName','height','id','kind','privateUseReviewed','sha256','width'] THEN RETURN false;END IF;
 FOREACH k IN ARRAY ARRAY['assetId','fileName','id','kind','sha256'] LOOP IF jsonb_typeof(v->k) IS DISTINCT FROM 'string' THEN RETURN false;END IF;END LOOP;
 IF v->>'kind' IS DISTINCT FROM 'website_original' OR v->'privateUseReviewed' IS DISTINCT FROM 'true'::jsonb OR coalesce(v->>'assetId'!~'^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$',true) OR coalesce(v->>'sha256'!~'^[a-f0-9]{64}$',true) OR coalesce(v->>'id'!~'^[A-Za-z0-9_-]{1,120}$',true) OR jsonb_typeof(v->'fileName') IS DISTINCT FROM 'string' OR length(v->>'fileName')>200 OR (v->>'fileName') ~ '[<>/\\]' THEN RETURN false;END IF;
 IF jsonb_typeof(v->'width') IS DISTINCT FROM 'number' OR jsonb_typeof(v->'height') IS DISTINCT FROM 'number' OR (v->>'width')!~'^[0-9]{1,5}$' OR (v->>'height')!~'^[0-9]{1,5}$' THEN RETURN false;END IF;
 RETURN (v->>'width')::integer<=20000 AND (v->>'height')::integer<=20000;
END $$;

CREATE OR REPLACE FUNCTION busy_creator_private.media_projection(b uuid,a uuid,refs jsonb,writing boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE ref jsonb;asset_id uuid;path text;dbhash text;ctype text;bytes integer;result jsonb:='[]';found_asset boolean;query text;
BEGIN
 FOR ref IN SELECT value FROM jsonb_array_elements(refs) LOOP
  found_asset:=false;
  IF to_regclass('public.busy_website_original_media') IS NOT NULL AND to_regclass('storage.objects') IS NOT NULL AND to_regclass('storage.buckets') IS NOT NULL THEN
   query:='SELECT m.id,m.storage_path,m.sha256,m.content_type,m.byte_length FROM public.busy_website_original_media m JOIN storage.objects o ON o.bucket_id=''busy-website-originals'' AND o.name=m.storage_path JOIN storage.buckets bucket ON bucket.id=o.bucket_id AND bucket.public=false WHERE m.id=$1 AND m.business_id=$2 AND m.uploaded_by=$3 AND m.sha256=$4 AND m.content_type IN (''image/jpeg'',''image/png'',''image/webp'') AND m.byte_length BETWEEN 20 AND 9437184';
   IF writing THEN query:=query||' FOR SHARE OF m,o,bucket';END IF;
   EXECUTE query INTO asset_id,path,dbhash,ctype,bytes USING (ref->>'assetId')::uuid,b,a,ref->>'sha256';found_asset:=asset_id IS NOT NULL;
   IF found_asset THEN found_asset:=path ~ ('^'||b::text||'/'||a::text||'/[a-f0-9-]{36}\.(jpg|png|webp)$');END IF;
  END IF;
  IF writing AND NOT found_asset THEN RAISE EXCEPTION 'Original media unavailable or not owned' USING ERRCODE='42501';END IF;
  result:=result||jsonb_build_array(CASE WHEN found_asset THEN jsonb_build_object('id',ref->>'id','assetId',ref->>'assetId','sha256',ref->>'sha256','state','eligible','storagePath',path,'contentType',ctype,'byteLength',bytes) ELSE jsonb_build_object('id',ref->>'id','assetId',ref->>'assetId','sha256',ref->>'sha256','state','unavailable') END);
 END LOOP;RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.busy_creator_media_review_v1(p_business_id uuid,p_storage_path text,p_private_use_reviewed boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);asset record;ref jsonb;projection jsonb;
BEGIN
 IF p_private_use_reviewed IS DISTINCT FROM true OR p_storage_path IS NULL OR length(p_storage_path)>240 OR to_regclass('public.busy_website_original_media') IS NULL THEN RAISE EXCEPTION 'Review the original private asset' USING ERRCODE='42501';END IF;
 EXECUTE 'SELECT id,sha256 FROM public.busy_website_original_media WHERE business_id=$1 AND uploaded_by=$2 AND storage_path=$3' INTO asset USING p_business_id,a,p_storage_path;
 IF asset.id IS NULL THEN RAISE EXCEPTION 'Original media unavailable' USING ERRCODE='42501';END IF;
 ref:=jsonb_build_object('assetId',asset.id,'sha256',asset.sha256,'id','review','kind','website_original','privateUseReviewed',true,'width',0,'height',0,'fileName','');projection:=busy_creator_private.media_projection(p_business_id,a,jsonb_build_array(ref),false);
 IF projection->0->>'state' IS DISTINCT FROM 'eligible' THEN RAISE EXCEPTION 'Original media unavailable' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'assetId',asset.id,'sha256',asset.sha256,'notOwnReceipt',true,'privateUseReviewed',true,'publicUseAuthorised',false,'mediaProjection',projection);
END $$;


CREATE OR REPLACE FUNCTION busy_creator_private.valid_editor_v3(e jsonb,media jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;s jsonb;k text;shape text[];
BEGIN
 IF jsonb_typeof(e) IS DISTINCT FROM 'object' OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(e) key) IS DISTINCT FROM ARRAY['captions','detectedService','privacyWarnings','proposedScheduleDate','proposedScheduleTime','selectedCaptionId','story','summary'] OR jsonb_typeof(media) IS DISTINCT FROM 'array' THEN RETURN false;END IF;
 IF jsonb_typeof(e->'summary') IS DISTINCT FROM 'string' OR length(e->>'summary')>700 OR (e->>'summary')~'[<>]' OR jsonb_typeof(e->'detectedService') IS DISTINCT FROM 'string' OR length(e->>'detectedService')>180 OR (e->>'detectedService')~'[<>]' OR jsonb_typeof(e->'captions') IS DISTINCT FROM 'array' THEN RETURN false;END IF;
 IF jsonb_typeof(e->'proposedScheduleDate') IS DISTINCT FROM 'string' OR jsonb_typeof(e->'proposedScheduleTime') IS DISTINCT FROM 'string' THEN RETURN false;END IF;
 IF (e->>'proposedScheduleTime')<>'' AND (e->>'proposedScheduleTime')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RETURN false;END IF;
 IF (e->>'proposedScheduleDate')<>'' THEN
  IF (e->>'proposedScheduleDate')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN RETURN false;END IF;
  BEGIN PERFORM make_date(substring(e->>'proposedScheduleDate',1,4)::integer,substring(e->>'proposedScheduleDate',6,2)::integer,substring(e->>'proposedScheduleDate',9,2)::integer);EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN RETURN false;END;
 END IF;
 FOR c IN SELECT value FROM jsonb_array_elements(e->'captions') LOOP
  IF jsonb_typeof(c) IS DISTINCT FROM 'object' THEN RETURN false;END IF;
  SELECT array_agg(key ORDER BY key) INTO shape FROM jsonb_object_keys(c) key;
  IF shape=ARRAY['id','text'] THEN CONTINUE;END IF;
  IF shape IS DISTINCT FROM ARRAY['id','label','reason','recommendedChannels','text','tone'] THEN RETURN false;END IF;
  FOREACH k IN ARRAY ARRAY['label','tone','reason'] LOOP IF jsonb_typeof(c->k) IS DISTINCT FROM 'string' OR length(c->>k)>(CASE k WHEN 'reason' THEN 600 ELSE 120 END) OR (c->>k)~'[<>]' THEN RETURN false;END IF;END LOOP;
  IF jsonb_typeof(c->'recommendedChannels') IS DISTINCT FROM 'array' OR jsonb_array_length(c->'recommendedChannels')>3 OR EXISTS(SELECT 1 FROM jsonb_array_elements(c->'recommendedChannels') ch WHERE ch NOT IN ('"Facebook"'::jsonb,'"Instagram"'::jsonb,'"Google Business"'::jsonb)) OR (SELECT count(*) FROM jsonb_array_elements(c->'recommendedChannels'))<>(SELECT count(DISTINCT value) FROM jsonb_array_elements(c->'recommendedChannels')) THEN RETURN false;END IF;
 END LOOP;
 s:=e->'story';IF s='null'::jsonb THEN RETURN true;END IF;
 IF jsonb_typeof(s) IS DISTINCT FROM 'object' OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(s) key) IS DISTINCT FROM ARRAY['afterImageId','beforeImageId','confidence','reason','type'] OR coalesce(s->>'type' NOT IN ('before_after','finished_result','process','equipment','general','unclear'),true) OR coalesce(s->>'confidence' NOT IN ('High','Medium','Low'),true) OR jsonb_typeof(s->'reason') IS DISTINCT FROM 'string' OR length(s->>'reason')>700 OR (s->>'reason')~'[<>]' THEN RETURN false;END IF;
 FOREACH k IN ARRAY ARRAY['beforeImageId','afterImageId'] LOOP IF jsonb_typeof(s->k) IS DISTINCT FROM 'string' OR (s->>k)<>'' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(media) m WHERE m->>'id'=s->>k) THEN RETURN false;END IF;END LOOP;
 RETURN s->>'type'<>'before_after' OR (s->>'beforeImageId'<>'' AND s->>'afterImageId'<>'' AND s->>'beforeImageId'<>s->>'afterImageId');
END $$;

CREATE OR REPLACE FUNCTION busy_creator_private.valid_content(v jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,pg_temp AS $$
DECLARE k text;x jsonb;shadow jsonb;stripped jsonb;
BEGIN
 IF jsonb_typeof(v) IS DISTINCT FROM 'object' THEN RETURN false;END IF;
 IF v->'schemaVersion'='3'::jsonb THEN
  IF (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v) key) IS DISTINCT FROM ARRAY['brandFingerprint','brief','channels','editor','format','media','ownerFacts','preparedCopy','schemaVersion','text','treatment'] OR NOT busy_creator_private.valid_editor_v3(v->'editor',v->'media') THEN RETURN false;END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',caption->'id','text',caption->'text') ORDER BY ordinal),'[]') INTO stripped FROM jsonb_array_elements(v->'editor'->'captions') WITH ORDINALITY AS captions(caption,ordinal);
  shadow:=jsonb_set(v,'{schemaVersion}','2'::jsonb);shadow:=jsonb_set(shadow,'{editor}',jsonb_build_object('captions',stripped,'selectedCaptionId',v->'editor'->'selectedCaptionId','privacyWarnings',v->'editor'->'privacyWarnings','story',NULL));
  RETURN busy_creator_private.valid_content(shadow);
 END IF;
 IF v->'schemaVersion'='1'::jsonb THEN
  IF (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v) key) IS DISTINCT FROM ARRAY['brandFingerprint','brief','channels','format','media','ownerFacts','preparedCopy','schemaVersion','text','treatment'] OR v->'media' IS DISTINCT FROM '[]'::jsonb THEN RETURN false;END IF;
 ELSIF v->'schemaVersion'='2'::jsonb THEN
  IF (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v) key) IS DISTINCT FROM ARRAY['brandFingerprint','brief','channels','editor','format','media','ownerFacts','preparedCopy','schemaVersion','text','treatment'] OR jsonb_typeof(v->'media') IS DISTINCT FROM 'array' OR jsonb_array_length(v->'media')>6 THEN RETURN false;END IF;
  FOR x IN SELECT value FROM jsonb_array_elements(v->'media') LOOP IF NOT busy_creator_private.valid_media_ref(x) THEN RETURN false;END IF;END LOOP;
  IF (SELECT count(*) FROM jsonb_array_elements(v->'media'))<>(SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(v->'media')) OR (SELECT count(*) FROM jsonb_array_elements(v->'media'))<>(SELECT count(DISTINCT value->>'assetId') FROM jsonb_array_elements(v->'media')) THEN RETURN false;END IF;
  IF jsonb_typeof(v->'editor') IS DISTINCT FROM 'object' OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(v->'editor') key) IS DISTINCT FROM ARRAY['captions','privacyWarnings','selectedCaptionId','story'] OR v->'editor'->'story' IS DISTINCT FROM 'null'::jsonb OR jsonb_typeof(v->'editor'->'captions') IS DISTINCT FROM 'array' OR jsonb_array_length(v->'editor'->'captions')>6 OR jsonb_typeof(v->'editor'->'privacyWarnings') IS DISTINCT FROM 'array' OR jsonb_array_length(v->'editor'->'privacyWarnings')>12 OR jsonb_typeof(v->'editor'->'selectedCaptionId') IS DISTINCT FROM 'string' THEN RETURN false;END IF;
  FOR x IN SELECT value FROM jsonb_array_elements(v->'editor'->'captions') LOOP
   IF jsonb_typeof(x) IS DISTINCT FROM 'object' OR (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(x) key) IS DISTINCT FROM ARRAY['id','text'] OR jsonb_typeof(x->'id') IS DISTINCT FROM 'string' OR coalesce(x->>'id'!~'^[A-Za-z0-9_-]{1,120}$',true) OR jsonb_typeof(x->'text') IS DISTINCT FROM 'string' OR length(x->>'text')>15000 OR (x->>'text') ~ '[<>]' THEN RETURN false;END IF;
  END LOOP;
  IF (SELECT count(*) FROM jsonb_array_elements(v->'editor'->'captions'))<>(SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(v->'editor'->'captions')) OR (v->'editor'->>'selectedCaptionId')<>'' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(v->'editor'->'captions') caption_row WHERE caption_row->>'id'=v->'editor'->>'selectedCaptionId') THEN RETURN false;END IF;
  FOR x IN SELECT value FROM jsonb_array_elements(v->'editor'->'privacyWarnings') LOOP IF jsonb_typeof(x) IS DISTINCT FROM 'string' OR length(x#>>'{}')>500 THEN RETURN false;END IF;END LOOP;
 ELSE RETURN false;END IF;
 IF coalesce(v->>'format' NOT IN ('social','poster','advert','newsletter'),true) OR coalesce(v->>'treatment' NOT IN ('standard','welcoming','concise','detailed','brand'),true) THEN RETURN false;END IF;
 FOREACH k IN ARRAY ARRAY['text','brief','brandFingerprint','ownerFacts','preparedCopy'] LOOP
  IF jsonb_typeof(v->k)<>'string' OR length(v->>k)>(CASE k WHEN 'text' THEN 15000 WHEN 'brief' THEN 3000 WHEN 'ownerFacts' THEN 3000 WHEN 'preparedCopy' THEN 15000 ELSE 240 END) OR (v->>k) ~ '[<>]' THEN RETURN false;END IF;
 END LOOP;
 IF btrim(v->>'text')='' OR jsonb_typeof(v->'channels')<>'array' OR jsonb_array_length(v->'channels')>3 THEN RETURN false;END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v->'channels') a WHERE a NOT IN ('"Facebook"'::jsonb,'"Instagram"'::jsonb,'"Google Business"'::jsonb)) OR (SELECT count(*) FROM jsonb_array_elements(v->'channels'))<>(SELECT count(DISTINCT a) FROM jsonb_array_elements(v->'channels') a) THEN RETURN false;END IF;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION busy_creator_private.source_state(b uuid,a uuid,o uuid,r bigint,h text,writing boolean) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE head public.busy_growth_opportunities%ROWTYPE;v public.busy_growth_opportunity_versions%ROWTYPE;old public.busy_growth_opportunity_versions%ROWTYPE;
BEGIN
 IF o IS NULL THEN IF r IS NOT NULL OR h IS NOT NULL THEN RAISE EXCEPTION 'Unsupported source' USING ERRCODE='22023';END IF;RETURN 'not_linked';END IF;
 SELECT * INTO head FROM public.busy_growth_opportunities WHERE id=o AND business_id=b AND owner_id=a FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO v FROM public.busy_growth_opportunity_versions WHERE opportunity_id=o AND revision=head.revision;
 SELECT * INTO old FROM public.busy_growth_opportunity_versions WHERE opportunity_id=o AND revision=r;
 IF NOT FOUND OR old.source_hash IS DISTINCT FROM h OR v.permission IS DISTINCT FROM 'permitted' THEN RAISE EXCEPTION 'Source restricted' USING ERRCODE='42501';END IF;
 IF writing AND (head.revision<>r OR v.state IS DISTINCT FROM 'active' OR v.reviewed_source_hash IS DISTINCT FROM h) THEN RAISE EXCEPTION 'Source review changed' USING ERRCODE='40001';END IF;
 RETURN CASE WHEN v.state='retired' THEN 'retired' WHEN head.revision<>r THEN 'historical' ELSE 'current' END;
END $$;

CREATE OR REPLACE FUNCTION busy_creator_private.project(v public.busy_creator_draft_versions) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE state text;origin jsonb:=NULL;g public.busy_growth_opportunity_versions%ROWTYPE;
BEGIN
 state:=busy_creator_private.source_state(v.business_id,v.owner_id,v.opportunity_id,v.opportunity_revision,v.source_hash,false);
 IF v.opportunity_id IS NOT NULL THEN SELECT * INTO g FROM public.busy_growth_opportunity_versions WHERE opportunity_id=v.opportunity_id AND revision=v.opportunity_revision;
 origin:=jsonb_build_object('version',1,'type','owner_reported_opportunity','ownerId',v.owner_id,'businessId',v.business_id,'opportunityId',v.opportunity_id,'revision',v.opportunity_revision,'sourceHash',v.source_hash,'sourceAccount',g.source_account,'provenance','owner_reported','referenceOnly',true);END IF;
 RETURN jsonb_build_object('businessId',v.business_id,'ownerId',v.owner_id,'draftId',v.draft_id,'revision',v.revision,'content',v.content,'opportunityReference',origin,'sourceState',state,'recordedAt',v.recorded_at,'status','Draft','notOwnReceipt',true,'mediaProjection',busy_creator_private.media_projection(v.business_id,v.owner_id,v.content->'media',false));
END $$;

CREATE OR REPLACE FUNCTION public.busy_creator_draft_read_v1(p_business_id uuid,p_draft_id text,p_revision bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);head public.busy_creator_draft_heads%ROWTYPE;v public.busy_creator_draft_versions%ROWTYPE;
BEGIN
 SELECT * INTO head FROM public.busy_creator_draft_heads WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Draft unavailable' USING ERRCODE='42501';END IF;
 SELECT * INTO v FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id AND revision=coalesce(p_revision,head.revision);
 IF NOT FOUND THEN RAISE EXCEPTION 'Version unavailable' USING ERRCODE='22023';END IF;
 -- Same lock order as writes: live owner, source, then the Creator head.
 PERFORM busy_creator_private.source_state(v.business_id,v.owner_id,v.opportunity_id,v.opportunity_revision,v.source_hash,false);
 SELECT * INTO head FROM public.busy_creator_draft_heads WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Draft unavailable' USING ERRCODE='42501';END IF;
 IF p_revision IS NULL AND head.revision<>v.revision THEN SELECT * INTO v FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id AND revision=head.revision;END IF;
 RETURN busy_creator_private.project(v)||jsonb_build_object('currentRevision',head.revision,'historical',v.revision<>head.revision);
END $$;

CREATE OR REPLACE FUNCTION public.busy_creator_draft_write_v1(p_business_id uuid,p_draft_id text,p_expected_revision bigint,p_content jsonb,p_opportunity_id uuid,p_opportunity_revision bigint,p_source_hash text,p_request_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);head public.busy_creator_draft_heads%ROWTYPE;old public.busy_creator_draft_versions%ROWTYPE;v public.busy_creator_draft_versions%ROWTYPE;collision boolean;
BEGIN
 IF p_draft_id IS NULL OR p_draft_id!~'^[A-Za-z0-9_-]{1,120}$' OR p_expected_revision IS NULL OR p_expected_revision<0 OR p_request_key IS NULL OR p_request_key!~'^[A-Za-z0-9_-]{8,120}$' OR NOT coalesce(busy_creator_private.valid_content(p_content),false) THEN RAISE EXCEPTION 'Unsupported private content' USING ERRCODE='22023';END IF;
 -- Do not adopt or reset historical/public queue rows. No publication writer is called.
 IF to_regclass('public.busy_social_posts') IS NOT NULL THEN EXECUTE 'SELECT EXISTS(SELECT 1 FROM public.busy_social_posts WHERE client_draft_id=$1)' INTO collision USING p_draft_id;IF collision THEN RAISE EXCEPTION 'Original queue record requires separate review' USING ERRCODE='42501';END IF;END IF;
 -- Source lock precedes private head lock; Growth changes cannot race a save.
 PERFORM busy_creator_private.source_state(p_business_id,a,p_opportunity_id,p_opportunity_revision,p_source_hash,true);
 PERFORM busy_creator_private.media_projection(p_business_id,a,p_content->'media',true);
 IF EXISTS(SELECT 1 FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND request_key=p_request_key) THEN RAISE EXCEPTION 'Request already recorded' USING ERRCODE='40001';END IF;
 IF p_expected_revision=0 THEN INSERT INTO public.busy_creator_draft_heads VALUES(p_business_id,a,p_draft_id,1);END IF;
 SELECT * INTO head FROM public.busy_creator_draft_heads WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id FOR UPDATE;
 IF NOT FOUND OR p_expected_revision>0 AND head.revision<>p_expected_revision THEN RAISE EXCEPTION 'Draft revision changed' USING ERRCODE='40001';END IF;
 IF p_expected_revision>0 THEN
  SELECT * INTO old FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id AND revision=head.revision;
  IF (old.content->>'schemaVersion')::integer>(p_content->>'schemaVersion')::integer THEN RAISE EXCEPTION 'Older Creator serializers cannot replace supported media/editor state' USING ERRCODE='22023';END IF;
  IF ROW(old.opportunity_id,old.opportunity_revision,old.source_hash) IS DISTINCT FROM ROW(p_opportunity_id,p_opportunity_revision,p_source_hash) THEN RAISE EXCEPTION 'Original source cannot be rebound' USING ERRCODE='22023';END IF;
 END IF;
 INSERT INTO public.busy_creator_draft_versions(business_id,owner_id,draft_id,revision,content,opportunity_id,opportunity_revision,source_hash,request_key) VALUES(p_business_id,a,p_draft_id,p_expected_revision+1,p_content,p_opportunity_id,p_opportunity_revision,p_source_hash,p_request_key) RETURNING * INTO v;
 UPDATE public.busy_creator_draft_heads SET revision=v.revision WHERE business_id=p_business_id AND owner_id=a AND draft_id=p_draft_id;
 RETURN busy_creator_private.project(v)||jsonb_build_object('notOwnReceipt',false,'ownOperationReceipt',true,'operationId',v.operation_id,'requestKey',v.request_key,'previousRevision',p_expected_revision,'executionAuthorised',false);
END $$;

CREATE OR REPLACE FUNCTION public.busy_creator_draft_list_v1(p_business_id uuid,p_opportunity_id uuid DEFAULT NULL,p_after text DEFAULT NULL,p_limit integer DEFAULT 20) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);items jsonb;
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_after IS NOT NULL AND p_after!~'^[A-Za-z0-9_-]{1,120}$' THEN RAISE EXCEPTION 'Bounded exact cursor required' USING ERRCODE='22023';END IF;
 -- Filter through current privacy before selecting the bounded page, so restricted rows do not truncate discovery.
 SELECT coalesce(jsonb_agg(x.item ORDER BY x.draft_id),'[]') INTO items FROM (
 SELECT h.draft_id,jsonb_build_object('draftId',h.draft_id,'revision',h.revision,'format',v.content->>'format','briefPreview',left(v.content->>'brief',120),'opportunityId',v.opportunity_id,'recordedAt',v.recorded_at) item
 FROM public.busy_creator_draft_heads h JOIN public.busy_creator_draft_versions v ON v.business_id=h.business_id AND v.owner_id=h.owner_id AND v.draft_id=h.draft_id AND v.revision=h.revision
 WHERE h.business_id=p_business_id AND h.owner_id=a AND (p_after IS NULL OR h.draft_id>p_after) AND (p_opportunity_id IS NULL OR v.opportunity_id=p_opportunity_id)
 AND (v.opportunity_id IS NULL OR EXISTS(SELECT 1 FROM public.busy_growth_opportunities gh JOIN public.busy_growth_opportunity_versions gv ON gv.opportunity_id=gh.id AND gv.revision=gh.revision WHERE gh.id=v.opportunity_id AND gh.business_id=p_business_id AND gh.owner_id=a AND gv.permission='permitted')) ORDER BY h.draft_id LIMIT p_limit) x;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'items',items,'nextAfter',CASE WHEN jsonb_array_length(items)=p_limit THEN items->-1->>'draftId' ELSE NULL END,'notOwnReceipt',true);
END $$;

CREATE OR REPLACE FUNCTION public.busy_creator_draft_operation_v1(p_business_id uuid,p_request_key text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_growth_private.authorize(p_business_id);v public.busy_creator_draft_versions%ROWTYPE;
BEGIN
 SELECT * INTO v FROM public.busy_creator_draft_versions WHERE business_id=p_business_id AND owner_id=a AND request_key=p_request_key;
 IF NOT FOUND THEN RETURN jsonb_build_object('businessId',p_business_id,'ownerId',a,'found',false,'notOwnReceipt',true);END IF;
 RETURN busy_creator_private.project(v)||jsonb_build_object('found',true,'requestKey',v.request_key,'operationId',v.operation_id,'operationObserved',true);
END $$;

DO $$ DECLARE f record;BEGIN
 FOR f IN SELECT p.oid::regprocedure signature,ns.nspname,p.proname FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace WHERE ns.nspname='busy_creator_private' OR ns.nspname='public' AND (p.proname LIKE 'busy_creator_draft_%_v1' OR p.proname='busy_creator_media_review_v1') LOOP
 EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f.signature);EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
 IF f.nspname='public' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role') AND (has_schema_privilege(r.oid,'busy_creator_private','USAGE') OR has_table_privilege(r.oid,'public.busy_creator_draft_versions','SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege(r.oid,'public.busy_creator_draft_heads','SELECT,INSERT,UPDATE,DELETE'))) THEN RAISE EXCEPTION 'Effective Creator privilege leak' USING ERRCODE='42501';END IF;
END $$;
-- Source docs/sql-proposals/connected-builders/business-context.sql SHA256 4d6fd3ae5a09086c92ed53a88f3e7d1756297818cdd3a2e7526ec1624e07e59c

CREATE FUNCTION public.busy_connected_initialize_v1(p_business_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_snapshot_private.lock_writer(p_business_id);
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=a AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 INSERT INTO public.busy_business_snapshots(business_id) VALUES(p_business_id) ON CONFLICT(business_id) DO NOTHING;
 RETURN public.busy_connected_builder_read_v1(p_business_id);
END $$;

CREATE FUNCTION public.busy_connected_profile_write_v1(p_business_id uuid,p_expected_revision bigint,p_expected_profile jsonb,p_profile jsonb,p_owner_approved boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_snapshot_private.lock_writer(p_business_id);p public.busy_public_business_profiles%ROWTYPE;k text;m jsonb;r bigint;stored jsonb;allowed text[]:=ARRAY['businessName','businessType','tagline','description','serviceArea','services','contact'];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=a AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 IF p_owner_approved IS DISTINCT FROM true OR p_expected_revision IS NULL OR p_expected_revision<0 OR jsonb_typeof(p_profile) IS DISTINCT FROM 'object' OR octet_length(p_profile::text)>100000 OR (p_profile-allowed) IS DISTINCT FROM (coalesce(p_expected_profile,'{}'::jsonb)-allowed) OR jsonb_typeof(p_profile->'businessName') IS DISTINCT FROM 'string' OR length(btrim(p_profile->>'businessName')) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Review supported business facts' USING ERRCODE='22023';END IF;
 FOREACH k IN ARRAY ARRAY['businessName','businessType','tagline','description','serviceArea'] LOOP
  IF p_profile?k AND (jsonb_typeof(p_profile->k) IS DISTINCT FROM 'string' OR length(p_profile->>k)>3000 OR (p_profile->>k)~'[<>]') THEN RAISE EXCEPTION 'Invalid business wording' USING ERRCODE='22023';END IF;
 END LOOP;
 IF p_profile?'services' AND p_profile->'services' IS DISTINCT FROM p_expected_profile->'services' THEN
  IF jsonb_typeof(p_profile->'services') IS DISTINCT FROM 'array' OR jsonb_array_length(p_profile->'services')>50 THEN RAISE EXCEPTION 'Bounded services required' USING ERRCODE='22023';END IF;
  FOR m IN SELECT value FROM jsonb_array_elements(p_profile->'services') LOOP
   IF jsonb_typeof(m) IS DISTINCT FROM 'object' OR (m-ARRAY['id','name','description']) IS DISTINCT FROM coalesce((SELECT x-ARRAY['id','name','description'] FROM jsonb_array_elements(coalesce(p_expected_profile->'services','[]'::jsonb))x WHERE x->>'id'=m->>'id'),'{}'::jsonb) OR jsonb_typeof(m->'id') IS DISTINCT FROM 'string' OR m->>'id'!~'^[A-Za-z0-9_-]{1,80}$' OR jsonb_typeof(m->'name') IS DISTINCT FROM 'string' OR length(btrim(m->>'name')) NOT BETWEEN 1 AND 160 OR jsonb_typeof(m->'description') IS DISTINCT FROM 'string' OR length(m->>'description')>3000 OR ((m->>'name')||(m->>'description'))~'[<>]' THEN RAISE EXCEPTION 'Invalid approved service' USING ERRCODE='22023';END IF;
  END LOOP;
  IF (SELECT count(*)<>count(DISTINCT x->>'id') FROM jsonb_array_elements(p_profile->'services')x) THEN RAISE EXCEPTION 'Distinct service identities required' USING ERRCODE='22023';END IF;
 END IF;
 IF p_profile?'contact' AND p_profile->'contact' IS DISTINCT FROM p_expected_profile->'contact' THEN
  IF jsonb_typeof(p_profile->'contact') IS DISTINCT FROM 'object' OR (p_profile->'contact')-ARRAY['phone','email','openingHours']<>'{}' THEN RAISE EXCEPTION 'Supported contact fields required' USING ERRCODE='22023';END IF;
  FOR k,m IN SELECT key,value FROM jsonb_each(p_profile->'contact') LOOP IF jsonb_typeof(m) IS DISTINCT FROM 'string' OR length(m#>>'{}')>500 OR (m#>>'{}')~'[<>]' THEN RAISE EXCEPTION 'Invalid contact wording' USING ERRCODE='22023';END IF;END LOOP;
 END IF;
 PERFORM 1 FROM public.busy_businesses WHERE id=p_business_id FOR UPDATE;
 SELECT * INTO p FROM public.busy_public_business_profiles WHERE business_id=p_business_id FOR UPDATE;
 IF FOUND THEN
  IF p.revision IS DISTINCT FROM p_expected_revision OR busy_snapshot_private.profile_facts(p.profile) IS DISTINCT FROM p_expected_profile OR p.status<>'draft' THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
  stored:=p.profile;
  FOREACH k IN ARRAY allowed LOOP
   IF p_profile?k THEN stored:=jsonb_set(stored,ARRAY[k],p_profile->k,true);ELSE stored:=stored-k;END IF;
  END LOOP;
  -- Preserve unexposed per-service and contact extensions; no authority to edit them.
  IF p_profile?'services' THEN stored:=jsonb_set(stored,'{services}',(SELECT coalesce(jsonb_agg(coalesce((SELECT old-ARRAY['id','name','description','category'] FROM jsonb_array_elements(coalesce(p.profile->'services','[]'::jsonb))old WHERE old->>'id'=v->>'id'),'{}'::jsonb)||v),'[]'::jsonb) FROM jsonb_array_elements(p_profile->'services')v));END IF;
  IF p_profile?'contact' THEN stored:=jsonb_set(stored,'{contact}',(coalesce(p.profile->'contact','{}'::jsonb)-ARRAY['phone','email','openingHours'])||(p_profile->'contact'));END IF;
  UPDATE public.busy_public_business_profiles SET profile=stored,display_name=p_profile->>'businessName',revision=revision+1,updated_by=a,updated_at=clock_timestamp() WHERE business_id=p_business_id RETURNING revision INTO r;
 ELSE
  IF p_expected_revision<>0 OR p_expected_profile IS NOT NULL THEN RAISE EXCEPTION 'Business facts changed' USING ERRCODE='40001';END IF;
  INSERT INTO public.busy_public_business_profiles(business_id,public_slug,display_name,profile,updated_by)VALUES(p_business_id,'private-'||p_business_id::text,p_profile->>'businessName',p_profile,a) RETURNING revision INTO r;
 END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',a,'profileRevision',r,'profile',busy_snapshot_private.profile_facts(p_profile),'privateOnly',true,'publicationChanged',false,'recordHash',encode(sha256(convert_to(busy_snapshot_private.profile_facts(p_profile)::text,'UTF8')),'hex'));
END $$;

REVOKE ALL ON FUNCTION public.busy_connected_initialize_v1(uuid),public.busy_connected_profile_write_v1(uuid,bigint,jsonb,jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_connected_initialize_v1(uuid),public.busy_connected_profile_write_v1(uuid,bigint,jsonb,jsonb,boolean) TO authenticated;
-- Source docs/sql-proposals/connected-builders/website-history.sql SHA256 5d4edd3c1eca101b631cfec2a8644955b921f89828949582f819e20f8d987aa1

CREATE FUNCTION public.busy_connected_website_transition_v1(p_business_id uuid,p_actor_id uuid,p_expected_revision bigint,p_expected_draft jsonb,p_candidate jsonb,p_profile_revision bigint,p_operation text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE s public.busy_business_snapshots%ROWTYPE;h jsonb;u jsonb;r jsonb;t jsonb;receipt jsonb;updated jsonb;
BEGIN
 IF p_operation IS NULL OR p_operation NOT IN ('edit','undo','redo') OR p_actor_id IS NULL THEN RAISE EXCEPTION 'Finite private transition required' USING ERRCODE='22023';END IF;
 PERFORM 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=p_actor_id AND role='owner' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR s.revision IS DISTINCT FROM p_expected_revision OR s.schema_version<>1 OR nullif(s.payload->'websiteDraft','null') IS DISTINCT FROM p_expected_draft THEN RAISE EXCEPTION 'Website conflict' USING ERRCODE='40001';END IF;
 h:=s.payload->'websiteHistory';
 IF h IS NULL OR h='null' THEN h:=jsonb_build_object('v',1,'draftId',coalesce(p_expected_draft->>'id',p_candidate->>'id'),'undo','[]'::jsonb,'redo','[]'::jsonb);END IF;
 IF jsonb_typeof(h) IS DISTINCT FROM 'object' OR h->'v' IS DISTINCT FROM '1' OR h->>'draftId' IS DISTINCT FROM coalesce(p_expected_draft->>'id',p_candidate->>'id') OR jsonb_typeof(h->'undo') IS DISTINCT FROM 'array' OR jsonb_typeof(h->'redo') IS DISTINCT FROM 'array' OR jsonb_array_length(h->'undo')>8 OR jsonb_array_length(h->'redo')>8 OR h-ARRAY['v','draftId','undo','redo']<>'{}' THEN RAISE EXCEPTION 'Existing history requires review' USING ERRCODE='22023';END IF;
 u:=h->'undo';r:=h->'redo';
 IF p_operation<>'edit' THEN
  IF p_expected_draft IS NULL THEN RAISE EXCEPTION 'No current website' USING ERRCODE='40001';END IF;
  t:=CASE WHEN p_operation='undo' THEN u->-1 ELSE r->-1 END;
  IF t IS NULL OR t->'draft' IS NULL OR (p_candidate-ARRAY['generation','updatedAt']) IS DISTINCT FROM ((t->'draft')-ARRAY['generation','updatedAt']) THEN RAISE EXCEPTION 'Reviewed history target changed' USING ERRCODE='40001';END IF;
 END IF;
 -- The original finite writer retains all validation, locks, exact CAS and receipts.
 receipt:=busy_snapshot_private.website_commit_original(p_business_id,p_actor_id,p_expected_revision,p_expected_draft,p_candidate,p_profile_revision);
 IF p_expected_draft IS NOT NULL THEN
  t:=jsonb_build_object('draft',p_expected_draft,'revision',p_expected_revision,'at',clock_timestamp());
  IF p_operation='undo' THEN u:=u-(jsonb_array_length(u)-1);r:=r||jsonb_build_array(t);
  ELSIF p_operation='redo' THEN r:=r-(jsonb_array_length(r)-1);u:=u||jsonb_build_array(t);
  ELSE u:=u||jsonb_build_array(t);r:='[]';END IF;
 END IF;
 WHILE jsonb_array_length(u)>8 LOOP u:=u-0;END LOOP;
 WHILE jsonb_array_length(r)>8 LOOP r:=r-0;END LOOP;
 h:=jsonb_build_object('v',1,'draftId',p_candidate->>'id','undo',u,'redo',r);
 WHILE octet_length(h::text)>600000 AND (jsonb_array_length(u)>0 OR jsonb_array_length(r)>0) LOOP
  IF jsonb_array_length(u)>=jsonb_array_length(r) THEN u:=u-0;ELSE r:=r-0;END IF;
  h:=jsonb_build_object('v',1,'draftId',p_candidate->>'id','undo',u,'redo',r);
 END LOOP;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(payload,'{websiteHistory}',h,true) WHERE business_id=p_business_id;
 RETURN receipt||jsonb_build_object('operation',p_operation,'undoCount',jsonb_array_length(u),'redoCount',jsonb_array_length(r),'historyHash',encode(sha256(convert_to(h::text,'UTF8')),'hex'));
END $$;

-- Preserve the original externally supported signature; move implementation private.
ALTER FUNCTION public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) SET SCHEMA busy_snapshot_private;

ALTER FUNCTION busy_snapshot_private.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) RENAME TO website_commit_original;

CREATE FUNCTION public.busy_connected_website_commit_v1(p_business_id uuid,p_actor_id uuid,p_expected_revision bigint,p_expected_draft jsonb,p_candidate jsonb,p_profile_revision bigint) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$ SELECT public.busy_connected_website_transition_v1(p_business_id,p_actor_id,p_expected_revision,p_expected_draft,p_candidate,p_profile_revision,'edit') $$;

CREATE FUNCTION public.busy_connected_website_history_v1(p_business_id uuid,p_expected_revision bigint,p_expected_hash text,p_direction text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE a uuid:=busy_snapshot_private.lock_writer(p_business_id);s public.busy_business_snapshots%ROWTYPE;h jsonb;t jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=a AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR SHARE;
 IF NOT FOUND OR s.revision IS DISTINCT FROM p_expected_revision OR encode(sha256(convert_to((s.payload->'websiteDraft')::text,'UTF8')),'hex') IS DISTINCT FROM p_expected_hash THEN RAISE EXCEPTION 'Website changed' USING ERRCODE='40001';END IF;
 IF p_direction IS NOT NULL AND p_direction NOT IN ('undo','redo') THEN RAISE EXCEPTION 'Finite history direction required' USING ERRCODE='22023';END IF;
 h:=s.payload->'websiteHistory';t:=CASE WHEN p_direction='undo' THEN h->'undo'->-1 WHEN p_direction='redo' THEN h->'redo'->-1 ELSE NULL END;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',a,'revision',s.revision,'notOwnReceipt',true,'direction',p_direction,'target',t->'draft','entries',coalesce((SELECT jsonb_agg(jsonb_build_object('generation',v#>'{draft,generation}','revision',v->'revision','at',v->'at')) FROM jsonb_array_elements(coalesce(h->'undo','[]'))v),'[]'));
END $$;

REVOKE ALL ON FUNCTION public.busy_connected_website_transition_v1(uuid,uuid,bigint,jsonb,jsonb,bigint,text),public.busy_connected_website_history_v1(uuid,bigint,text,text),public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint),busy_snapshot_private.website_commit_original(uuid,uuid,bigint,jsonb,jsonb,bigint) FROM PUBLIC,anon,authenticated,service_role;

GRANT EXECUTE ON FUNCTION public.busy_connected_website_transition_v1(uuid,uuid,bigint,jsonb,jsonb,bigint,text),public.busy_connected_website_commit_v1(uuid,uuid,bigint,jsonb,jsonb,bigint) TO service_role;

GRANT EXECUTE ON FUNCTION public.busy_connected_website_history_v1(uuid,bigint,text,text) TO authenticated;
-- Source docs/sql-proposals/connected-builders/listing-lifecycle.sql SHA256 1c2be1132eb75d841338e3be79a59188534b7fa873f475a8abf1bf21340f7537

CREATE FUNCTION busy_snapshot_private.listing_candidate(b uuid,rid uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_snapshot_private.lock_writer(b);r public.busy_mini_app_requests%ROWTYPE;a public.busy_mini_apps%ROWTYPE;c public.busy_business_content%ROWTYPE;s jsonb;v jsonb;facts jsonb;p jsonb;refs text[];n int;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=b AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE business_id=b AND id=rid FOR SHARE;
 IF NOT FOUND OR r.request_type<>'enquiry' OR r.module_key<>'enquiry' OR r.status NOT IN ('received','reviewing') THEN RAISE EXCEPTION 'Current original enquiry required' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.busy_mini_apps WHERE business_id=b AND id=r.mini_app_id AND created_by=actor FOR SHARE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(a.draft_config->'modules')m WHERE m->>'key'='enquiry' AND m->'enabled'='true') THEN RAISE EXCEPTION 'Original app owner required' USING ERRCODE='42501';END IF;
 s:=r.payload->'listingContext';
 IF jsonb_typeof(s) IS DISTINCT FROM 'object' OR s-ARRAY['version','kind','recordId','revision','variantId']<>'{}' OR (SELECT count(*) FROM jsonb_object_keys(s))<>5 OR s->'version'<>'1'::jsonb OR s->>'kind' NOT IN ('product','event') OR coalesce(s->>'recordId','')!~'^[A-Za-z0-9_-]{12,80}$' OR jsonb_typeof(s->'revision') IS DISTINCT FROM 'number' OR (s->>'revision')!~'^[1-9][0-9]{0,9}$' OR (s->'variantId'<>'null' AND (jsonb_typeof(s->'variantId')<>'string' OR s->>'variantId'!~'^[A-Za-z0-9_-]{12,80}$')) THEN RAISE EXCEPTION 'Typed listing context required' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM regexp_matches(r.payload->>'message','^Listing reference: ([A-Za-z0-9_-]+) / approved revision ([1-9][0-9]{0,9})(?: / option ([A-Za-z0-9_-]+))?\.$','gn');
 SELECT x INTO refs FROM regexp_matches(r.payload->>'message','^Listing reference: ([A-Za-z0-9_-]+) / approved revision ([1-9][0-9]{0,9})(?: / option ([A-Za-z0-9_-]+))?\.$','n')x;
 IF n<>1 OR (length(r.payload->>'message')-length(replace(r.payload->>'message','Listing reference:','')))<>length('Listing reference:') OR refs[1] IS DISTINCT FROM s->>'recordId' OR refs[2] IS DISTINCT FROM s->>'revision' OR refs[3] IS DISTINCT FROM s->>'variantId' THEN RAISE EXCEPTION 'Ambiguous or conflicting listing reference' USING ERRCODE='22023';END IF;
 SELECT * INTO c FROM public.busy_business_content WHERE business_id=b AND id=s->>'recordId' FOR SHARE;
 IF NOT FOUND OR c.kind IS DISTINCT FROM s->>'kind' OR c.published_revision IS DISTINCT FROM (s->>'revision')::bigint OR jsonb_typeof(c.published) IS DISTINCT FROM 'object' OR c.published->>'status' IS DISTINCT FROM (CASE c.kind WHEN 'product' THEN 'active' ELSE 'scheduled' END) OR jsonb_typeof(c.published->'name') IS DISTINCT FROM 'string' OR length(btrim(c.published->>'name')) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Approved listing changed or unavailable' USING ERRCODE='40001';END IF;
 IF c.kind='product' THEN
  IF NOT(c.published ? 'amountMinor') OR jsonb_typeof(c.published->'currency') IS DISTINCT FROM 'string' OR c.published->>'currency' NOT IN ('GBP','USD','EUR') OR (c.published->'amountMinor'<>'null' AND (c.published->>'amountMinor')!~'^[0-9]{1,12}$') THEN RAISE EXCEPTION 'Unsupported approved product facts' USING ERRCODE='22023';END IF;
  facts:=jsonb_build_object('name',c.published->'name','description',c.published->'description','amountMinor',c.published->'amountMinor','currency',c.published->'currency');
  IF s->>'variantId' IS NOT NULL THEN
   IF jsonb_typeof(c.published->'variants') IS DISTINCT FROM 'array' OR jsonb_array_length(c.published->'variants')>40 THEN RAISE EXCEPTION 'Approved option unavailable' USING ERRCODE='22023';END IF;
   SELECT count(*) INTO n FROM jsonb_array_elements(c.published->'variants')x WHERE x->>'id'=s->>'variantId';IF n<>1 THEN RAISE EXCEPTION 'Exact approved option required' USING ERRCODE='22023';END IF;
   SELECT x INTO v FROM jsonb_array_elements(c.published->'variants')x WHERE x->>'id'=s->>'variantId';
   IF jsonb_typeof(v->'label') IS DISTINCT FROM 'string' OR length(v->>'label') NOT BETWEEN 1 AND 120 OR (v->>'amountMinor')!~'^[0-9]{1,12}$' THEN RAISE EXCEPTION 'Invalid approved option' USING ERRCODE='22023';END IF;
   facts:=facts||jsonb_build_object('optionId',v->'id','optionLabel',v->'label','amountMinor',v->'amountMinor');
  END IF;
 ELSE
  IF s->>'variantId' IS NOT NULL OR coalesce(c.published->>'startsAt','')!~'^\d{4}-\d{2}-\d{2}T' OR jsonb_typeof(c.published->'timeZone') IS DISTINCT FROM 'string' OR jsonb_typeof(c.published->'location') IS DISTINCT FROM 'string' OR coalesce(c.published->>'endsAt','')!~'^\d{4}-\d{2}-\d{2}T' OR (c.published->>'endsAt')::timestamptz<=clock_timestamp() OR (c.published->>'startsAt')::timestamptz>=(c.published->>'endsAt')::timestamptz THEN RAISE EXCEPTION 'Event expired or invalid' USING ERRCODE='40001';END IF;
  facts:=jsonb_build_object('name',c.published->'name','description',c.published->'description','startsAt',c.published->'startsAt','endsAt',c.published->'endsAt','timeZone',c.published->'timeZone','location',c.published->'location');
 END IF;
 IF octet_length(facts::text)>7000 THEN RAISE EXCEPTION 'Listing facts exceed supported bound' USING ERRCODE='22023';END IF;
 p:=jsonb_build_object('version',1,'authority','busy_listing_filing_v1','businessId',b,'ownerId',actor,'appId',a.id,'requestId',r.id,'requestHash',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex'),'messageHash',encode(sha256(convert_to(r.payload->>'message','UTF8')),'hex'),'selection',s,'facts',facts,'verifiedAt',to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 RETURN p||jsonb_build_object('integrity',encode(sha256(convert_to(p::text,'UTF8')),'hex'));
END $$;

CREATE FUNCTION busy_snapshot_private.valid_listing(b uuid,e jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p jsonb:=e->'listingProvenance';s jsonb:=p->'selection';
BEGIN
 RETURN coalesce(jsonb_typeof(p)='object' AND p-ARRAY['version','authority','businessId','ownerId','appId','requestId','requestHash','messageHash','selection','facts','verifiedAt','integrity']='{}' AND (SELECT count(*) FROM jsonb_object_keys(p))=12 AND p->'version'='1' AND p->>'authority'='busy_listing_filing_v1' AND p->>'businessId'=b::text AND p->>'ownerId'=auth.uid()::text AND p->>'ownerId'=e->>'registeredBy' AND p->>'requestId'=e#>>'{miniAppOrigin,requestId}' AND p->>'appId'=e#>>'{miniAppOrigin,appId}' AND p->>'requestHash'=e#>>'{miniAppOrigin,requestHash}' AND p->>'requestHash'~'^[a-f0-9]{64}$' AND p->>'messageHash'=encode(sha256(convert_to(e->>'rawText','UTF8')),'hex') AND jsonb_typeof(p->'facts'->'name')='string' AND jsonb_typeof(s)='object' AND s-ARRAY['version','kind','recordId','revision','variantId']='{}' AND (SELECT count(*) FROM jsonb_object_keys(s))=5 AND s->'version'='1' AND s->>'kind' IN ('product','event') AND s->>'recordId'~'^[A-Za-z0-9_-]{12,80}$' AND s->>'revision'~'^[1-9][0-9]{0,9}$' AND jsonb_typeof(p->'facts')='object' AND octet_length(p::text)<=10000 AND p->>'verifiedAt'~'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' AND p->>'integrity'=encode(sha256(convert_to((p-'integrity')::text,'UTF8')),'hex'),false);
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE FUNCTION busy_snapshot_private.listing_state(b uuid,e jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE p jsonb:=e->'listingProvenance';now_source jsonb;
BEGIN
 IF NOT busy_snapshot_private.valid_listing(b,e) THEN RAISE EXCEPTION 'Unsupported listing provenance' USING ERRCODE='22023';END IF;
 BEGIN
  now_source:=busy_snapshot_private.listing_candidate(b,(p->>'requestId')::uuid);
  IF now_source->'selection'=p->'selection' AND now_source->'facts'=p->'facts' AND now_source->>'requestHash'=p->>'requestHash' AND now_source->>'appId'=p->>'appId' THEN RETURN jsonb_build_object('current',true,'state','current','factsAtFiling',p->'facts');END IF;
 EXCEPTION WHEN OTHERS THEN NULL;END;
 RETURN jsonb_build_object('current',false,'state','changed_or_unavailable','factsAtFiling',p->'facts');
END $$;

REVOKE ALL ON FUNCTION busy_snapshot_private.listing_candidate(uuid,uuid),busy_snapshot_private.valid_listing(uuid,jsonb),busy_snapshot_private.listing_state(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;

-- Original function replacements follow. Historical source guards remain intact elsewhere.



CREATE OR REPLACE FUNCTION busy_snapshot_private.initial_reply_context(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;snap public.busy_business_snapshots%ROWTYPE;c jsonb;e jsonb;source jsonb;n int;k text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501';END IF;
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.schema_version IS DISTINCT FROM 1 OR snap.revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF p_customer_id IS NULL OR p_enquiry_id IS NULL OR length(p_customer_id) NOT BETWEEN 1 AND 240 OR length(p_enquiry_id) NOT BETWEEN 1 AND 240 OR jsonb_typeof(snap.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR jsonb_array_length(snap.payload->'customers')>1000 OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'Unsupported collections' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'customers') x WHERE x->>'id'=p_customer_id;
 IF n<>1 THEN RAISE EXCEPTION 'Ambiguous customer' USING ERRCODE='22023';END IF;
 SELECT x INTO c FROM jsonb_array_elements(snap.payload->'customers') x WHERE x->>'id'=p_customer_id;
 SELECT count(*) INTO n FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF n<>1 THEN RAISE EXCEPTION 'Ambiguous enquiry' USING ERRCODE='22023';END IF;
 SELECT x INTO e FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=p_enquiry_id;
 IF (c ? 'businessId' AND c->>'businessId' IS DISTINCT FROM p_business_id::text) OR (c ? 'business_id' AND c->>'business_id' IS DISTINCT FROM p_business_id::text) OR (e ? 'businessId' AND e->>'businessId' IS DISTINCT FROM p_business_id::text) OR (e ? 'business_id' AND e->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Wrong source scope' USING ERRCODE='42501';END IF;
 FOREACH k IN ARRAY ARRAY['id','name','service','phone','email','address'] LOOP IF c ? k AND (jsonb_typeof(c->k) IS DISTINCT FROM 'string' OR octet_length(c->>k)>10000) THEN RAISE EXCEPTION 'Unsupported customer field' USING ERRCODE='22023';END IF;END LOOP;
 FOREACH k IN ARRAY ARRAY['id','status','filedCustomerId','filedStage','reviewedAt','queuedAt','rawText'] LOOP IF e ? k AND (jsonb_typeof(e->k) IS DISTINCT FROM 'string' OR octet_length(e->>k)>10000) THEN RAISE EXCEPTION 'Unsupported enquiry field' USING ERRCODE='22023';END IF;END LOOP;
 IF c ? 'contactOk' AND jsonb_typeof(c->'contactOk') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Unsupported contact preference' USING ERRCODE='22023';END IF;
 IF (e ? 'registeredBy' AND e->>'registeredBy' IS DISTINCT FROM actor::text) OR c ? 'privateEnquiryReply' OR c ? 'version' OR e ? 'version' OR c->>'contactOk'='false' OR e->>'status' IS DISTINCT FROM 'Filed' OR e->>'filedCustomerId' IS DISTINCT FROM p_customer_id OR e->>'filedStage' IS DISTINCT FROM 'Enquiry' OR jsonb_typeof(e->'rawText') IS DISTINCT FROM 'string' OR ((e->>'rawText' LIKE '%Listing reference:%' OR e ? 'listingProvenance') AND NOT busy_snapshot_private.valid_listing(p_business_id,e)) OR coalesce(e->>'reviewedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN RAISE EXCEPTION 'Unsupported first reply source/target' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO source FROM jsonb_each(c) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 RETURN jsonb_build_object('customer',c,'enquiry',e,'source',jsonb_build_array(source,e));
END $$;


CREATE OR REPLACE FUNCTION busy_snapshot_private.file_app_enquiry_v2(p_business_id uuid,p_expected_revision bigint,p_capture jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid; snap public.busy_business_snapshots%ROWTYPE; item jsonb; customer jsonb; source_record jsonb; activity jsonb; intake jsonb; filed jsonb; items jsonb; k text; total integer; event_date date; event_time time; event_at timestamptz; imported_at timestamptz:=clock_timestamp(); cid text; eid text; source_name text; imported_iso text; event_iso text;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner access required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_capture) IS DISTINCT FROM 'object' OR p_capture-ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId','sourceHash','name','phone','email','address','service','eventDate','eventTime','note','confidence']<>'{}'::jsonb THEN RAISE EXCEPTION 'Unsupported capture' USING ERRCODE='22023'; END IF;
 FOREACH k IN ARRAY ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId','sourceHash','name','phone','email','address','service','eventDate','eventTime','note','confidence'] LOOP
  IF jsonb_typeof(p_capture->k) IS DISTINCT FROM 'string' OR octet_length(p_capture->>k)>10000 THEN RAISE EXCEPTION 'Unsupported capture field' USING ERRCODE='22023'; END IF;
 END LOOP;
 FOREACH k IN ARRAY ARRAY['customerId','enquiryId','sourceRecordId','intakeId','activityId'] LOOP
  IF length(p_capture->>k) NOT BETWEEN 1 AND 240 OR p_capture->>k !~ '^[A-Za-z0-9_-]+$' THEN RAISE EXCEPTION 'Invalid stable identity' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF btrim(p_capture->>'name')='' OR btrim(p_capture->>'service')='' OR (btrim(p_capture->>'phone')='' AND btrim(p_capture->>'email')='') OR p_capture->>'confidence' NOT IN ('Low','Medium','High') OR p_capture->>'eventDate' !~ '^\d{4}-\d{2}-\d{2}$' OR p_capture->>'eventTime' !~ '^\d{2}:\d{2}$' THEN RAISE EXCEPTION 'Required reviewed fields missing' USING ERRCODE='22023'; END IF;
 BEGIN event_date:=(p_capture->>'eventDate')::date;event_time:=(p_capture->>'eventTime')::time;
 EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN RAISE EXCEPTION 'Invalid owner-recorded date' USING ERRCODE='22023'; END;
 -- Explicit UTC recording only; not proof of a customer event or appointment.
 event_at:=(event_date+event_time) AT TIME ZONE 'UTC';
 imported_iso:=to_char(imported_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');event_iso:=to_char(event_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');cid:=p_capture->>'customerId';eid:=p_capture->>'enquiryId';
 SELECT * INTO snap FROM public.busy_business_snapshots WHERE business_id=p_business_id FOR UPDATE;
 IF NOT FOUND OR snap.revision IS DISTINCT FROM p_expected_revision OR snap.schema_version IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001'; END IF;
 -- New finite repeated filing; original first-only entry remains unchanged.
 IF jsonb_typeof(coalesce(snap.payload->'customers','[]')) IS DISTINCT FROM 'array' OR jsonb_typeof(coalesce(snap.payload->'intakeLog','[]')) IS DISTINCT FROM 'array' OR jsonb_typeof(snap.payload->'inboxItems') IS DISTINCT FROM 'array' OR jsonb_array_length(coalesce(snap.payload->'customers','[]'))>=1000 OR jsonb_array_length(snap.payload->'inboxItems')>5000 THEN RAISE EXCEPTION 'Unsupported collections' USING ERRCODE='22023';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(snap.payload->'customers','[]')) x WHERE x->>'id'=cid) OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(snap.payload->'intakeLog','[]')) x WHERE x->>'id'=p_capture->>'intakeId') OR snap.payload->'replyActions' ? cid THEN RAISE EXCEPTION 'Existing identity requires review' USING ERRCODE='40001';END IF;
 SELECT count(*) INTO total FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF total<>1 THEN RAISE EXCEPTION 'Missing or ambiguous source' USING ERRCODE='22023'; END IF;
 SELECT x INTO item FROM jsonb_array_elements(snap.payload->'inboxItems') x WHERE x->>'id'=eid;
 IF (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR item ? 'version' OR item->>'status' IS DISTINCT FROM 'Pending' OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM p_business_id::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM p_business_id::text) THEN RAISE EXCEPTION 'Source identity mismatch' USING ERRCODE='42501'; END IF;
 IF p_capture->>'sourceHash' IS DISTINCT FROM encode(sha256(convert_to(item::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001'; END IF;
 IF jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR btrim(item->>'rawText')='' OR jsonb_typeof(item->'source') IS DISTINCT FROM 'string' OR length(item->>'source') NOT BETWEEN 1 AND 240 OR (item ? 'screenshots' AND item->'screenshots'<>'[]'::jsonb) OR (item ? 'aiAnalysis' AND item->'aiAnalysis'<>'null'::jsonb) OR coalesce(item->>'visionPending','false')<>'false' OR (item->'parsed' ? 'stage' AND item->'parsed'->>'stage'<>'Enquiry') THEN RAISE EXCEPTION 'Unsupported source/media/stage' USING ERRCODE='22023'; END IF;
 IF item->>'rawText' LIKE '%Listing reference:%' THEN item:=item||jsonb_build_object('listingProvenance',busy_snapshot_private.listing_candidate(p_business_id,(item#>>'{miniAppOrigin,requestId}')::uuid));END IF;
 source_name:=item->>'source';
 source_record:=jsonb_build_object('id',p_capture->>'sourceRecordId','source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'rawText',item->>'rawText','screenshots','[]'::jsonb,'screenshotOrderConfidence','Not checked','screenshotOrderReason','','aiAnalysisMode','','aiAnalysisSummary','','aiFieldConfidence','{}'::jsonb);
 activity:=jsonb_build_object('id',p_capture->>'activityId','kind','intake','date',event_date,'createdAt',imported_iso,'title','Enquiry captured from '||source_name,'note',coalesce(nullif(btrim(p_capture->>'note'),''),item->>'rawText'),'value','');
 -- Original contactOk default is a local contact preference, NEVER consent or
 -- provider/send authority. No consent, booking, quote, payment or reply is created.
 customer:=jsonb_build_object('id',cid,'name',btrim(p_capture->>'name'),'phone',btrim(p_capture->>'phone'),'email',btrim(p_capture->>'email'),'address',btrim(p_capture->>'address'),'service',btrim(p_capture->>'service'),'lastServiceDate','','lastJobValue',0,'contactOk',true,'createdAt',event_iso,'source',source_name,'history','[]'::jsonb,'activity',jsonb_build_array(activity),'sourceRecords',jsonb_build_array(source_record),'lifecycleStatus','Enquiry','currentEnquiryAt',event_iso,'nextEnquiryCheckDate',event_date+7,'enquiryFollowUpSentAt',NULL,'enquiryFollowUpStatus',NULL,'enquiryFollowUpOutcome','','enquiryFollowUpOutcomeRecordedAt',NULL,'nextRepeatDueDate','','lastActivityAt',imported_iso,'lastActivityKind','intake');
 intake:=jsonb_build_object('id',p_capture->>'intakeId','customerId',cid,'customerName',btrim(p_capture->>'name'),'source',source_name,'stage','Enquiry','eventDate',event_date,'importedAt',imported_iso,'matchedExisting',false,'matchReason','','confidence',p_capture->>'confidence','screenshotCount',0,'screenshotOrderConfidence','Not checked');
 filed:=item||jsonb_build_object('status','Filed','reviewedAt',imported_iso,'filedCustomerId',cid,'filedStage','Enquiry','matchedExisting',false);
 SELECT jsonb_agg(CASE WHEN value->>'id'=eid THEN filed ELSE value END ORDER BY ordinality) INTO items FROM jsonb_array_elements(snap.payload->'inboxItems') WITH ORDINALITY;
 UPDATE public.busy_business_snapshots SET payload=jsonb_set(jsonb_set(jsonb_set(snap.payload,'{customers}',coalesce(snap.payload->'customers','[]')||jsonb_build_array(customer)),'{intakeLog}',coalesce(snap.payload->'intakeLog','[]')||jsonb_build_array(intake)),'{inboxItems}',items),revision=snap.revision+1,updated_at=imported_at WHERE business_id=p_business_id;
 RETURN jsonb_build_object('businessId',p_business_id,'actorId',actor,'operation','reviewed_app_enquiry_filing','customerId',cid,'enquiryId',eid,'sourceRecordId',p_capture->>'sourceRecordId','intakeId',p_capture->>'intakeId','activityId',p_capture->>'activityId','previousRevision',snap.revision,'revision',snap.revision+1,'schemaVersion',1,'filedStage','Enquiry');
END $$;



CREATE OR REPLACE FUNCTION public.busy_owner_first_reply_review_v1(p_business_id uuid,p_expected_revision bigint,p_customer_id text,p_enquiry_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE c jsonb;customer jsonb;enquiry jsonb;
BEGIN
 c:=busy_snapshot_private.initial_reply_context(p_business_id,p_expected_revision,p_customer_id,p_enquiry_id);
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO customer FROM jsonb_each(c->'customer') WHERE key IN ('id','name','service','phone','email','address','contactOk');
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO enquiry FROM jsonb_each(c->'enquiry') WHERE key IN ('id','status','filedCustomerId','filedStage','reviewedAt','queuedAt','rawText','miniAppOrigin','listingProvenance');
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',auth.uid(),'revision',p_expected_revision,'schemaVersion',1,'customerHash',encode(sha256(convert_to((c->'customer')::text,'UTF8')),'hex'),'sourceHash',encode(sha256(convert_to((c->'enquiry')::text,'UTF8')),'hex'),'customer',customer,'enquiry',enquiry)||CASE WHEN enquiry ? 'listingProvenance' THEN jsonb_build_object('listingStatus',busy_snapshot_private.listing_state(p_business_id,c->'enquiry')) ELSE '{}' END;
END $$;


CREATE OR REPLACE FUNCTION busy_work_private.source_context(b uuid,c text,e text,expected bigint DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid:=busy_work_private.authorize(b);s public.busy_business_snapshots%ROWTYPE;cust jsonb;item jsonb;projection jsonb;n integer;
BEGIN
 IF c IS NULL OR e IS NULL OR length(c) NOT BETWEEN 1 AND 240 OR length(e) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Invalid identity' USING ERRCODE='22023';END IF;
 SELECT * INTO s FROM public.busy_business_snapshots WHERE business_id=b FOR SHARE;
 IF NOT FOUND OR s.schema_version IS DISTINCT FROM 1 OR expected IS NOT NULL AND expected IS DISTINCT FROM s.revision THEN RAISE EXCEPTION 'Snapshot conflict' USING ERRCODE='40001';END IF;
 IF jsonb_typeof(s.payload->'customers') IS DISTINCT FROM 'array' OR jsonb_typeof(s.payload->'inboxItems') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Unsupported source collections' USING ERRCODE='22023';END IF;
 SELECT count(*) INTO n FROM jsonb_array_elements(s.payload->'customers') a WHERE a->>'id'=c;
 IF n<>1 THEN RAISE EXCEPTION 'Missing or ambiguous customer' USING ERRCODE='22023';END IF;
 SELECT a INTO cust FROM jsonb_array_elements(s.payload->'customers') a WHERE a->>'id'=c;
 SELECT count(*) INTO n FROM jsonb_array_elements(s.payload->'inboxItems') a WHERE a->>'id'=e;
 IF n<>1 THEN RAISE EXCEPTION 'Missing or ambiguous enquiry' USING ERRCODE='22023';END IF;
 SELECT a INTO item FROM jsonb_array_elements(s.payload->'inboxItems') a WHERE a->>'id'=e;
 IF (cust ? 'businessId' AND cust->>'businessId' IS DISTINCT FROM b::text) OR (cust ? 'business_id' AND cust->>'business_id' IS DISTINCT FROM b::text) OR (cust ? 'ownerId' AND cust->>'ownerId' IS DISTINCT FROM actor::text) OR (item ? 'registeredBy' AND item->>'registeredBy' IS DISTINCT FROM actor::text) OR (item ? 'businessId' AND item->>'businessId' IS DISTINCT FROM b::text) OR (item ? 'business_id' AND item->>'business_id' IS DISTINCT FROM b::text) THEN RAISE EXCEPTION 'Source scope mismatch' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(cust->'id') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'id') IS DISTINCT FROM 'string' OR jsonb_typeof(item->'filedCustomerId') IS DISTINCT FROM 'string' OR jsonb_typeof(cust->'name') IS DISTINCT FROM 'string' OR jsonb_typeof(cust->'service') IS DISTINCT FROM 'string' OR cust ? 'version' OR item ? 'version' OR cust->>'contactOk'='false' OR item->>'status' IS DISTINCT FROM 'Filed' OR item->>'filedCustomerId' IS DISTINCT FROM c OR jsonb_typeof(item->'rawText') IS DISTINCT FROM 'string' OR octet_length(item->>'rawText')>10000 OR ((item->>'rawText' LIKE '%Listing reference:%' OR item ? 'listingProvenance') AND NOT busy_snapshot_private.valid_listing(b,item)) OR coalesce(item->>'reviewedAt','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$' THEN RAISE EXCEPTION 'Unsupported Filed source' USING ERRCODE='22023';END IF;
 SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO projection FROM jsonb_each(cust) WHERE key IN ('id','businessId','business_id','name','service','phone','email','address','contactOk','sourceMiniAppRequestId');
 RETURN jsonb_build_object('actor',actor,'revision',s.revision,'customer',projection,'enquiry',item,'customerHash',busy_work_private.hash(projection),'sourceHash',busy_work_private.hash(item),'legacy',s.payload->'replyActions'->c);
END $$;


CREATE OR REPLACE FUNCTION public.busy_work_source_review_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);a jsonb:=x->'legacy';
BEGIN
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'ownerId',x->'actor','snapshotRevision',x->'revision','schemaVersion',1,'sourceHash',x->'sourceHash','customerHash',x->'customerHash','customer',jsonb_build_object('id',p_customer_id,'name',x->'customer'->'name','service',x->'customer'->'service'),'enquiry',jsonb_build_object('id',p_enquiry_id,'rawText',x->'enquiry'->'rawText','reviewedAt',x->'enquiry'->'reviewedAt')||CASE WHEN x->'enquiry' ? 'listingProvenance' THEN jsonb_build_object('miniAppOrigin',x->'enquiry'->'miniAppOrigin','listingProvenance',x->'enquiry'->'listingProvenance') ELSE '{}' END,'hasLegacyWork',coalesce(a->'details'->'enquiryReference'->>'inboxId'=p_enquiry_id,false),'readOnlyObservation',true,'notOwnReceipt',true)||CASE WHEN x->'enquiry' ? 'listingProvenance' THEN jsonb_build_object('listingStatus',busy_snapshot_private.listing_state(p_business_id,x->'enquiry')) ELSE '{}' END;
END $$;


CREATE OR REPLACE FUNCTION public.busy_work_create_quote_v1(p_business_id uuid,p_customer_id text,p_enquiry_id text,p_expected_snapshot_revision bigint,p_customer_hash text,p_source_hash text,p_amount text,p_text text,p_date text,p_operation_id text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE x jsonb:=busy_work_private.source_context(p_business_id,p_customer_id,p_enquiry_id,p_expected_snapshot_revision);r public.business_work_engagements%ROWTYPE;
BEGIN
 IF x->'enquiry' ? 'listingProvenance' AND (busy_snapshot_private.listing_state(p_business_id,x->'enquiry')->>'current')::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'Listing changed; review original source' USING ERRCODE='40001';END IF;
 IF p_expected_snapshot_revision IS NULL OR p_expected_snapshot_revision<1 THEN RAISE EXCEPTION 'Expected snapshot revision required' USING ERRCODE='22023';END IF;
 PERFORM busy_work_private.valid_quote(p_amount,p_text,p_date,p_operation_id);
 IF x->>'customerHash' IS DISTINCT FROM p_customer_hash OR x->>'sourceHash' IS DISTINCT FROM p_source_hash THEN RAISE EXCEPTION 'Source changed' USING ERRCODE='40001';END IF;
 -- The exact original legacy source must be migrated explicitly, never duplicated.
 IF x->'legacy'->'details'->'enquiryReference'->>'inboxId'=p_enquiry_id THEN RAISE EXCEPTION 'Review legacy migration' USING ERRCODE='40001';END IF;
 INSERT INTO public.business_work_engagements(business_id,customer_id,enquiry_id,created_by,modified_by,kind,status,source_snapshot_revision,customer_hash,source_hash,source_evidence,work_data,creation_operation_id)
 VALUES(p_business_id,p_customer_id,p_enquiry_id,(x->>'actor')::uuid,(x->>'actor')::uuid,'quote','Prepared',(x->>'revision')::bigint,p_customer_hash,p_source_hash,jsonb_build_object('customer',x->'customer','enquiry',x->'enquiry'),jsonb_build_object('type','quote','task','Prepare a private quote','origin','manual','done',true,'details',jsonb_build_object('quoteStatus','Prepared','quoteAmount',p_amount,'message',p_text,'plannedSentDate',p_date)),p_operation_id) RETURNING * INTO r;
 RETURN jsonb_build_object('operation','engagement_create_quote','operationId',p_operation_id,'businessId',p_business_id,'customerId',p_customer_id,'enquiryId',p_enquiry_id,'engagementId',r.id,'actorId',r.created_by,'previousRevision',0,'revision',1,'schemaVersion',1,'sourceHash',r.source_hash,'recordHash',busy_work_private.hash(r.work_data));
END $$;


CREATE OR REPLACE FUNCTION public.busy_connected_app_enquiry_review_v1(p_business_id uuid,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
DECLARE actor uuid;r public.busy_mini_app_requests%ROWTYPE;
BEGIN
 actor:=busy_snapshot_private.lock_writer(p_business_id);
 IF NOT EXISTS(SELECT 1 FROM public.busy_business_memberships WHERE business_id=p_business_id AND user_id=actor AND role='owner') THEN RAISE EXCEPTION 'Owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.busy_mini_app_requests WHERE business_id=p_business_id AND id=p_request_id FOR SHARE;
 IF NOT FOUND OR r.request_type<>'enquiry' OR r.module_key<>'enquiry' OR r.status NOT IN ('received','reviewing') OR NOT EXISTS(SELECT 1 FROM public.busy_mini_apps WHERE id=r.mini_app_id AND business_id=p_business_id) THEN RAISE EXCEPTION 'Current business enquiry required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(r.payload->'message') IS DISTINCT FROM 'string' OR btrim(r.payload->>'message')='' OR octet_length(r.payload->>'message')>5000 THEN RAISE EXCEPTION 'Supported text enquiry required' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('businessId',p_business_id,'ownerId',actor,'requestId',r.id,'appId',r.mini_app_id,
 'requestHash',encode(sha256(convert_to(to_jsonb(r)::text,'UTF8')),'hex'),'message',r.payload->>'message',
 'name',coalesce(r.contact_name,''),'email',coalesce(r.contact_email,''),'phone',coalesce(r.contact_phone,''),'service',coalesce(r.service_name,''),
 'identityAssurance',coalesce(r.identity_assurance,'unverified'),'noCustomerIdentityInference',true)||CASE WHEN r.payload->>'message' LIKE '%Listing reference:%' AND r.payload ? 'listingContext' THEN jsonb_build_object('listingProvenance',busy_snapshot_private.listing_candidate(p_business_id,p_request_id)) ELSE '{}' END;
END $$;
-- Original supabase/migrations/20261006165702_v3_36_multitenant_website_publishing_foundation.sql SHA256 49fbb291a0daae9456b5f50be36c40f3c8af6309cc80da88e5d987a58b7cef99


alter table public.busy_websites
  add constraint busy_websites_current_preview_deployment_fkey
  foreign key (current_preview_deployment_id)
  references public.busy_website_deployments(id)
  on delete set null;
-- Original supabase/migrations/20261006165702_v3_36_multitenant_website_publishing_foundation.sql SHA256 4fab3137b798bb6343e975ed4222e81c214b3cf201d6286fa360b8f4459fcd97


alter table public.busy_websites
  add constraint busy_websites_current_live_deployment_fkey
  foreign key (current_live_deployment_id)
  references public.busy_website_deployments(id)
  on delete set null;
-- Original supabase/migrations/20261006165702_v3_36_multitenant_website_publishing_foundation.sql SHA256 a1420ae844eab23d7648b92ae7957d440a19ac5dcb4ad39259fd4ebaebe767dd


create index if not exists busy_websites_business_idx
  on public.busy_websites (business_id, updated_at desc);
-- Original supabase/migrations/20261006165702_v3_36_multitenant_website_publishing_foundation.sql SHA256 b7f6881ec13c69db39412485c6adc49f87f7ea511c1fa7451b212c367b12b75f

create index if not exists busy_website_deployments_business_idx
  on public.busy_website_deployments (business_id, created_at desc);
-- Original supabase/migrations/20261006165702_v3_36_multitenant_website_publishing_foundation.sql SHA256 76ec567cac7603a9c4504563525a93d4354f8d49c9fc7e17272975be3628599c

create index if not exists busy_website_deployments_site_state_idx
  on public.busy_website_deployments (website_id, state, version_no desc);
-- Original supabase/migrations/20261006165702_v3_36_multitenant_website_publishing_foundation.sql SHA256 1a9576591c6bb812283f8e51cf1379637055d1f6094d1e2f84930f7f643f2f90


create or replace function public.busy_guard_website_deployment_immutable()
returns trigger
language plpgsql
set search_path = 'public', 'pg_temp'
as $$
begin
  if new.business_id is distinct from old.business_id
     or new.website_id is distinct from old.website_id
     or new.version_no is distinct from old.version_no
     or new.source_generation is distinct from old.source_generation
     or new.content_hash is distinct from old.content_hash
     or new.source_draft is distinct from old.source_draft
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Website deployment source/version fields are immutable';
  end if;
  return new;
end;
$$;
-- Original supabase/migrations/20261006165702_v3_36_multitenant_website_publishing_foundation.sql SHA256 70f43878ee95f81588369292b62f4a1c10be4842f2d709f86396273f3d9fbd48

create trigger busy_website_deployment_immutable
before update on public.busy_website_deployments
for each row execute function public.busy_guard_website_deployment_immutable();
-- Original supabase/migrations/20261006165735_v3_36_website_fk_indexes.sql SHA256 0e21ed17fe78ff3eebd8404fe4b6e903a7e6dddf08ce215f79cf4aee50e447f4
create index if not exists busy_websites_created_by_idx
  on public.busy_websites (created_by);
-- Original supabase/migrations/20261006165735_v3_36_website_fk_indexes.sql SHA256 b8ab8b05e2de92555b4bef3cb6fc89d3b3aaf3f32f0ca02e8a3c24afefd658d9

create index if not exists busy_websites_preview_deployment_idx
  on public.busy_websites (current_preview_deployment_id);
-- Original supabase/migrations/20261006165735_v3_36_website_fk_indexes.sql SHA256 462f4e58b3acee85d396ff719208160641b178937533cf6b9263cb53288ed45e

create index if not exists busy_websites_live_deployment_idx
  on public.busy_websites (current_live_deployment_id);
-- Original supabase/migrations/20261006165735_v3_36_website_fk_indexes.sql SHA256 7740bbb63cd69d60a1cf7b95ec38fd300390064a0e370bc535e07d1f8700e56b


create index if not exists busy_website_deployments_created_by_idx
  on public.busy_website_deployments (created_by);
-- Original supabase/migrations/20261007070450_v3_37_live_website_management_foundation.sql SHA256 6d34e5c42b702f1116763d5a1e26870648e7cf877160be276f05735a8781acf5


create index if not exists busy_websites_health_due_idx
  on public.busy_websites (last_health_check_at asc nulls first)
  where current_live_deployment_id is not null;
-- Original supabase/migrations/20261007070450_v3_37_live_website_management_foundation.sql SHA256 168de2237985f034c2f50a4391eb75a7bd698daabd103f828800e6ae4d919088

create index if not exists busy_websites_observed_deployment_idx
  on public.busy_websites (last_observed_deployment_id);
-- Original supabase/migrations/20261007070450_v3_37_live_website_management_foundation.sql SHA256 42dbdaaaec0209fcefe19966aa364439d24766cd8b55495174e19f42d4b3ec36

create index if not exists busy_public_business_profiles_source_website_idx
  on public.busy_public_business_profiles (source_website_id);
-- Original supabase/migrations/20261007070450_v3_37_live_website_management_foundation.sql SHA256 d0a84eef27d13a71a9a66080ee52ceeb14ebf6e9e0c877e68b7833244aacd376

create index if not exists busy_public_business_profiles_source_deployment_idx
  on public.busy_public_business_profiles (source_deployment_id);
-- Original supabase/migrations/20261007070450_v3_37_live_website_management_foundation.sql SHA256 76e91176bc3212f422accfc961fe967d74c1e8796335d00f054e0a88b74099de

create index if not exists busy_public_business_profiles_updated_by_idx
  on public.busy_public_business_profiles (updated_by);
-- Original supabase/migrations/20261007070450_v3_37_live_website_management_foundation.sql SHA256 7c84bf4b9d6a6a94901674a7d93d7ce768dda1784e3bea0448d0d13cc6fc9b39


create or replace function public.busy_guard_website_deployment_immutable()
returns trigger language plpgsql set search_path = 'public', 'pg_temp'
as $$
begin
  if new.business_id is distinct from old.business_id
     or new.website_id is distinct from old.website_id
     or new.version_no is distinct from old.version_no
     or new.source_generation is distinct from old.source_generation
     or new.content_hash is distinct from old.content_hash
     or new.source_draft is distinct from old.source_draft
     or new.change_label is distinct from old.change_label
     or new.change_summary is distinct from old.change_summary
     or new.page_count is distinct from old.page_count
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Website deployment source/version fields are immutable';
  end if;
  return new;
end;
$$;
-- Original supabase/migrations/20261007073500_v3_38_delivery_signals_usage_foundation.sql SHA256 33f051c29eba16139ebeba4728ee218a0ba6bea4a362edc2cbff6f739221497c


create index if not exists busy_websites_delivery_status_idx
  on public.busy_websites (delivery_status, provider_last_sync_at);
-- Original supabase/migrations/20261007073500_v3_38_delivery_signals_usage_foundation.sql SHA256 4ff2537665323bf860fd6ef54ffdafff5d963518a0cf233db10e61cd453a0803

create unique index if not exists busy_websites_default_hostname_unique_idx
  on public.busy_websites (lower(default_hostname))
  where default_hostname is not null;
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 51750f45c43c34e6a6f75a1fd5a61b1b61784583909d991c59a6f07714fd63be


do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'busy_mini_apps_preview_version_fkey') then
    alter table public.busy_mini_apps
      add constraint busy_mini_apps_preview_version_fkey
      foreign key (current_preview_version_id)
      references public.busy_mini_app_versions(id)
      on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'busy_mini_apps_live_version_fkey') then
    alter table public.busy_mini_apps
      add constraint busy_mini_apps_live_version_fkey
      foreign key (current_live_version_id)
      references public.busy_mini_app_versions(id)
      on delete set null;
  end if;
end
$$;
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 00cbb1600239d9bbdc5927740ea24f93fa3bd8c6e8b2b49b245429c1df9e4fad


create index if not exists busy_mini_apps_business_status_idx on public.busy_mini_apps (business_id,status);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 3be29aa30b19551f9d740120093197172c09ad227ebfcd0fdec943d6eb6c6637

create index if not exists busy_mini_apps_directory_idx on public.busy_mini_apps (discoverable,status,lower(display_name));
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 21359fdad8674cbd80dca92f757aed1aefd0b8f358960a80e9efe49ace8a64f5

create index if not exists busy_mini_apps_search_idx on public.busy_mini_apps using gin (search_document);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 309b5c632418cc27dad29d2c123fe6e70b189a9d12d110f93aca9ba1090bf22d

create index if not exists busy_mini_apps_preview_version_idx on public.busy_mini_apps (current_preview_version_id);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 da110a252d94b3c0e9bd2553d973cbcaa6f867b69e496875e85bd02c7cc54545

create index if not exists busy_mini_apps_live_version_idx on public.busy_mini_apps (current_live_version_id);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 049d66aaf2c4a4a17abda1171bbfedb6c5dbefb891c32d7c99ad7ae14620a72b

create index if not exists busy_mini_app_versions_business_idx on public.busy_mini_app_versions (business_id,created_at desc);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 f5777fa1ac8c37bbe9e5139ac479b67df4a50904a51adbafe508d2737b4ff7a0

create index if not exists busy_mini_app_versions_app_state_idx on public.busy_mini_app_versions (mini_app_id,state,version_no desc);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 4966a5c13e1f1ec87aec55cbad53ff7797fe0445e861505a2ffcff5ea91c4384

create index if not exists busy_mini_app_versions_created_by_idx on public.busy_mini_app_versions (created_by);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 8ea30ad42237d9893acb158a2c95178929b88e089e32c876077abb65b4698b5a

create index if not exists busy_mini_app_requests_business_status_idx on public.busy_mini_app_requests (business_id,status,created_at desc);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 e89fbd3aab45742f1680d1cb032791ff2f1917f2d61a6541f71d62bc2ac700ba

create index if not exists busy_mini_app_requests_consumer_idx on public.busy_mini_app_requests (consumer_user_id,created_at desc);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 580e29566ffec5dcaafcf6c88141c5af93656559e9baa2e5ec9999621445ca93

create index if not exists busy_mini_app_requests_app_idx on public.busy_mini_app_requests (mini_app_id,created_at desc);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 9fcceec1c5f24cee348b2ff453f10eeeb92ba71b9cb9e638602a1bc1fed4e756

create index if not exists busy_mini_app_requests_version_idx on public.busy_mini_app_requests (version_id);
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 71daec187d3f8347c65e75d292e93aac105bc8c87968ad7b62c88bfbe52cc347


create or replace function public.busy_guard_mini_app_version_immutable()
returns trigger language plpgsql set search_path='public','pg_temp'
as $$
begin
  if new.business_id is distinct from old.business_id
     or new.mini_app_id is distinct from old.mini_app_id
     or new.version_no is distinct from old.version_no
     or new.source_profile_revision is distinct from old.source_profile_revision
     or new.source_draft_revision is distinct from old.source_draft_revision
     or new.config is distinct from old.config
     or new.change_label is distinct from old.change_label
     or new.change_summary is distinct from old.change_summary
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.prepared_at is distinct from old.prepared_at then
    raise exception 'Mini App version source/configuration fields are immutable';
  end if;
  return new;
end;
$$;
-- Original supabase/migrations/20261007082234_v3_39_busy_apps_marketplace_foundation.sql SHA256 c8c05d15c2b9197fc2aaa66a48657e89deacb78dfd9b1b0f8fe145b418826d21

create trigger busy_mini_app_versions_immutable
before update on public.busy_mini_app_versions
for each row execute function public.busy_guard_mini_app_version_immutable();
-- Original supabase/migrations/20261007082328_v3_39_mini_app_version_hashing.sql SHA256 2a787ec987692204e9ed0f32a4a336fe751fe0bd440771cebea96b693f6619b4

create unique index if not exists busy_mini_app_versions_config_hash_idx
  on public.busy_mini_app_versions (mini_app_id,config_hash);
-- Original supabase/migrations/20261007082328_v3_39_mini_app_version_hashing.sql SHA256 4967e10867be20c7bc9be7410d6d450dbacf4f8398986ab1d91ad30f825ac49c


create or replace function public.busy_guard_mini_app_version_immutable()
returns trigger language plpgsql set search_path='public','pg_temp'
as $$
begin
  if new.business_id is distinct from old.business_id
     or new.mini_app_id is distinct from old.mini_app_id
     or new.version_no is distinct from old.version_no
     or new.source_profile_revision is distinct from old.source_profile_revision
     or new.source_draft_revision is distinct from old.source_draft_revision
     or new.config is distinct from old.config
     or new.config_hash is distinct from old.config_hash
     or new.change_label is distinct from old.change_label
     or new.change_summary is distinct from old.change_summary
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.prepared_at is distinct from old.prepared_at then
    raise exception 'Mini App version source/configuration fields are immutable';
  end if;
  return new;
end;
$$;
-- Original supabase/migrations/20261007082355_v3_39_mini_app_request_idempotency.sql SHA256 61ccf1a5e2838542c4569129fc7b56bf32092c3383c2e19ae9ecdbf5c30b61c1

create unique index if not exists busy_mini_app_requests_idempotency_idx
  on public.busy_mini_app_requests (mini_app_id,consumer_user_id,idempotency_key)
  where idempotency_key is not null;
-- Original supabase/migrations/20261007083706_v3_39_mini_app_security_indexes.sql SHA256 be9e0bc41ed562dd3ed0811502d989776322654ba89ddc7c6dbe6df22fcfbd37
create index if not exists busy_mini_apps_created_by_idx
  on public.busy_mini_apps (created_by);
-- Original supabase/migrations/20261007083706_v3_39_mini_app_security_indexes.sql SHA256 5f2666fff888b27bf10676b13dc04390b23d6aa1d75af2c69d966cc4c3546013


create index if not exists busy_mini_app_requests_module_key_idx
  on public.busy_mini_app_requests (module_key);
-- Original supabase/migrations/20261007101513_v3_40_mini_app_customer_journey_bridge.sql SHA256 06394d9324d96c1a999afece33170c2fe5cb5b5e3e31e5d8ef4ca4fb8e9b5a30


create index if not exists busy_mini_app_requests_email_idx
  on public.busy_mini_app_requests (business_id, lower(contact_email))
  where contact_email is not null;
-- Original supabase/migrations/20261007101513_v3_40_mini_app_customer_journey_bridge.sql SHA256 370e7ad83b8a8f4dd984c66ada355b668812e5040c8e84bc5bb4ab86444f86cd

create index if not exists busy_mini_app_requests_phone_idx
  on public.busy_mini_app_requests (business_id, contact_phone)
  where contact_phone is not null;
-- Original supabase/migrations/20261007101513_v3_40_mini_app_customer_journey_bridge.sql SHA256 790c4907f26b570d6bec46d37ac2a86b1f897c1ca497c8ea52707fdcef083f21

create index if not exists busy_mini_app_request_links_business_idx
  on public.busy_mini_app_request_links (business_id, linked_at desc);
-- Original supabase/migrations/20261007101513_v3_40_mini_app_customer_journey_bridge.sql SHA256 ff0ab7395218df2db6386b695184764ea50846011cc2dd5d3d6d60d4fbe37c35

create index if not exists busy_mini_app_request_links_customer_idx
  on public.busy_mini_app_request_links (business_id, customer_record_id);
-- Original supabase/migrations/20261007102458_v3_40_mini_app_bridge_hardening.sql SHA256 28ecd3e8fceed4e99bd4beb3ffa86db77107b3406c62ec6e4a095fc4d946e69a
create index if not exists busy_mini_app_request_links_linked_by_idx
  on public.busy_mini_app_request_links (linked_by);
-- Original supabase/migrations/20261007125000_v3_41_mini_app_request_messaging.sql SHA256 f946b1895e07e024d69c571b7e68c3c7526c5845ffaf9adea4f4e28cc57f3695


create index if not exists busy_mini_app_request_messages_request_idx
  on public.busy_mini_app_request_messages (request_id, created_at asc);
-- Original supabase/migrations/20261007125000_v3_41_mini_app_request_messaging.sql SHA256 f9ca19eb6c07a6578823abafc7f15915899d8f9bd1e2c8292442b29c48444b38

create index if not exists busy_mini_app_request_messages_business_idx
  on public.busy_mini_app_request_messages (business_id, created_at desc);
-- Original supabase/migrations/20261007125000_v3_41_mini_app_request_messaging.sql SHA256 7b7a5bce804b22c6d3a7872fff01fa0dae169a7657e91d7da332b031fb076931

create index if not exists busy_mini_app_request_messages_app_idx
  on public.busy_mini_app_request_messages (mini_app_id, created_at desc);
-- Original supabase/migrations/20261007125100_v3_41_mini_app_request_messaging_hardening.sql SHA256 6fe2720daa71bc5b15972103ee3d72c6e4bee2ece8883b23a85ac9b65dc908b8
create index if not exists busy_mini_app_request_messages_sender_user_idx
  on public.busy_mini_app_request_messages (sender_user_id, created_at desc)
  where sender_user_id is not null;
-- Original supabase/migrations/20261007133000_v3_42_mini_app_notifications.sql SHA256 c015b087abc6bbcdb70073d234e2c27f6d2d65478c1017fe7bf82e660636c4f3


create index if not exists busy_mini_app_requests_business_unread_idx
  on public.busy_mini_app_requests (business_id, updated_at desc)
  where business_unread_count > 0;
-- Original supabase/migrations/20261007133000_v3_42_mini_app_notifications.sql SHA256 7b8c3386c5c6328ccabdcf94f1fc4d571d0b94114fbae672c92928c19e0a69c6


create index if not exists busy_mini_app_requests_customer_unread_idx
  on public.busy_mini_app_requests (consumer_user_id, updated_at desc)
  where customer_unread_count > 0;
-- Original supabase/migrations/20261007143000_v3_43_mini_app_direct_entry.sql SHA256 ace27e217d2b1e0ab6b60e8a7a2fffeea72790aad173a6cc066081b8776a4fa6


create index if not exists busy_mini_app_entry_events_business_created_idx
  on public.busy_mini_app_entry_events (business_id, created_at desc);
-- Original supabase/migrations/20261007143000_v3_43_mini_app_direct_entry.sql SHA256 cf682f4f327e88ccbc236655233ddb7789d1d88966d4c67a1642c020d0107b26


create index if not exists busy_mini_app_entry_events_app_created_idx
  on public.busy_mini_app_entry_events (mini_app_id, created_at desc);
-- Original supabase/migrations/20261007143000_v3_43_mini_app_direct_entry.sql SHA256 25d1c5d687e6b4ce3ad4dd86a25aac72f8e3c5476e3502d5bffd728eaeb3ee5d


create index if not exists busy_mini_app_entry_events_consumer_created_idx
  on public.busy_mini_app_entry_events (consumer_user_id, created_at desc)
  where consumer_user_id is not null;
-- Original supabase/migrations/20261007143200_v3_43_mini_app_entry_daily_rollup.sql SHA256 7df719fe16d2c0fb0b26bebd5208a54320ad98f3e346f68d68cb89c0347f0e35


create index if not exists busy_mini_app_entry_daily_business_date_idx
  on public.busy_mini_app_entry_daily (business_id, event_date desc);
-- Original supabase/migrations/20261007154000_v3_44_public_mini_app_web.sql SHA256 9737d1f71b6527a2015da824e17080f8a3c93ccd81ae504bcbe67590f5306995


create index if not exists busy_mini_apps_public_web_version_idx
  on public.busy_mini_apps (public_web_version_id);
-- Original supabase/migrations/20261007161000_v3_45_guest_mini_app_requests.sql SHA256 a8cd71b1903c25540f06b7e1110926abd8dd696fcd124cefd484050035d2b2e3


create unique index if not exists busy_mini_app_requests_guest_challenge_idx
  on public.busy_mini_app_requests (guest_challenge_id)
  where guest_challenge_id is not null;
-- Original supabase/migrations/20261007161000_v3_45_guest_mini_app_requests.sql SHA256 0c4cd6d4ec5779f79e27c6f0450503f09694265cb4ab44a256a68c74c00283fb


create unique index if not exists busy_mini_app_requests_guest_access_idx
  on public.busy_mini_app_requests (guest_access_hash)
  where guest_access_hash is not null;
-- Original supabase/migrations/20261007161000_v3_45_guest_mini_app_requests.sql SHA256 d526a9b722d996f0532ca06b0408a3cd742216f51a6c912bb79a07db143dd3dc


create index if not exists busy_mini_app_requests_origin_created_idx
  on public.busy_mini_app_requests (business_id, request_origin, created_at desc);
-- Original supabase/migrations/20261007220000_v3_52_website_scale_hardening.sql SHA256 539aae8b04df2b01e3f2d660a62c2cd20e1a8e64f100bd5e61ac5a6e4c2e70fc


create index if not exists busy_websites_next_health_due_idx
  on public.busy_websites (next_health_check_at asc nulls first)
  where current_live_deployment_id is not null;
-- Original supabase/migrations/20261007220000_v3_52_website_scale_hardening.sql SHA256 1f8c692b4ccc4930e2a1755e38b6da84a83fed53eb83f525566fb4eff26e8577


-- Composite uniqueness allows the service-role backend to enforce tenant
-- identity at the database boundary, not merely in application code.
create unique index if not exists busy_websites_id_business_unique_idx
  on public.busy_websites (id, business_id);
-- Original supabase/migrations/20261007220000_v3_52_website_scale_hardening.sql SHA256 691c0f70482b78c1623bc50d1dc2704c800af932c29010dc30c297fb57fe2b18

create unique index if not exists busy_website_deployments_id_site_business_unique_idx
  on public.busy_website_deployments (id, website_id, business_id);
-- Original supabase/migrations/20261007221500_v3_52_tenant_fk_indexes.sql SHA256 a0235f3102bec216ad1b0b4d1530c4ec817c27fc3b9c90dd2d82b32e09d466b9
-- V3.52 follow-up: cover composite tenant-integrity foreign keys.

create index if not exists busy_website_deployments_tenant_site_idx
  on public.busy_website_deployments (website_id, business_id);
-- Original supabase/migrations/20261007234500_v3_55_business_app_journey_loyalty.sql SHA256 f7fe771416d179bd2e365a3cc6cd7c65f8a137ec4a03e8490bd2c0fa5a5adf73


create unique index if not exists busy_mini_apps_id_business_unique_idx
  on public.busy_mini_apps (id, business_id);
-- Original supabase/migrations/20261007234500_v3_55_business_app_journey_loyalty.sql SHA256 194eb325c3b4f15d3e8988acf94d8520a6f50dc07c27c84f0035792947a2c3d9


create unique index if not exists busy_mini_app_requests_id_business_app_unique_idx
  on public.busy_mini_app_requests (id, business_id, mini_app_id);
-- Original supabase/migrations/20261012193000_v3_181_durable_work_booking_ledger.sql SHA256 752a9d043a3523778a12fe5cf6533370fefb9f1b67094dc57588b78274a6cdb2

create index if not exists busy_mini_app_work_bookings_calendar_idx
  on public.busy_mini_app_work_bookings
  (business_id,state,calendar_date,calendar_time);
-- Original supabase/migrations/20261012193000_v3_181_durable_work_booking_ledger.sql SHA256 f39d410f4455c3424c87c851e02ef3c9cd2732f18dd67c42ffa5ad82d95e687f

create index if not exists busy_mini_app_work_bookings_app_idx
  on public.busy_mini_app_work_bookings
  (business_id,mini_app_id,updated_at desc);
-- Original supabase/migrations/20261012211000_v3_185_durable_message_delivery_intent.sql SHA256 722b84a7bbe6dde9fe6e8145a0a9fc64e344e63ad59a3c98bd489cec742f66d5

create index if not exists busy_mini_app_delivery_outbox_owner_review_v3185
 on public.busy_mini_app_message_delivery_outbox
 (business_id,mini_app_id,state,created_at desc);
DO $$ DECLARE f record; t record; col record; BEGIN
 FOR t IN SELECT c.oid,n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname<>'busy_staging_rls_canary' LOOP
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',t.nspname,t.relname);
  EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC,anon,authenticated,service_role',t.nspname,t.relname);
  FOR col IN SELECT attname FROM pg_attribute WHERE attrelid=t.oid AND attnum>0 AND NOT attisdropped LOOP EXECUTE format('REVOKE SELECT (%I),INSERT (%I),UPDATE (%I),REFERENCES (%I) ON TABLE %I.%I FROM PUBLIC,anon,authenticated,service_role',col.attname,col.attname,col.attname,col.attname,t.nspname,t.relname);END LOOP;
  IF t.relname=ANY(ARRAY['busy_mini_apps','busy_mini_app_module_catalog','busy_websites','busy_website_deployments','busy_public_business_profiles','busy_mini_app_versions','busy_mini_app_requests','busy_mini_app_request_links','busy_mini_app_entry_events','busy_mini_app_entry_daily','busy_mini_app_work_bookings','busy_mini_app_request_messages','busy_mini_app_message_delivery_outbox','busy_push_deliveries','busy_business_content','busy_businesses','busy_business_memberships']) THEN EXECUTE format('GRANT SELECT ON TABLE %I.%I TO service_role',t.nspname,t.relname);END IF;
 END LOOP;
 FOR f IN SELECT p.oid::regprocedure signature,p.proname,n.nspname,p.proname||'('||oidvectortypes(p.proargtypes)||')' AS exact FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='public' AND p.proname LIKE 'busy_%') OR n.nspname IN ('busy_snapshot_private','busy_work_private','busy_growth_private','busy_creator_private') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',f.signature);
  IF f.nspname='public' AND f.exact IN ('busy_connected_website_history_v1(uuid, bigint, text, text)','busy_connected_initialize_v1(uuid)','busy_connected_profile_write_v1(uuid, bigint, jsonb, jsonb, boolean)','busy_connected_workspaces_v1()','busy_connected_builder_read_v1(uuid)','busy_connected_app_enquiry_state_v1(uuid, uuid)','busy_connected_app_enquiry_review_v1(uuid, uuid)','busy_connected_app_enquiry_import_v2(uuid, uuid, text, bigint)','busy_connected_app_enquiry_file_v2(uuid, bigint, jsonb, text)','busy_connected_journeys_v1(uuid, text, bigint)','busy_owner_pending_review_v1(uuid, bigint, text)','busy_owner_first_reply_review_v1(uuid, bigint, text, text)','busy_work_source_review_v1(uuid, text, text, bigint)','busy_work_create_quote_v1(uuid, text, text, bigint, text, text, text, text, text, text)','busy_work_list_v1(uuid, text, uuid, integer)','busy_work_discover_v1(uuid, uuid, integer)','busy_work_compare_v1(uuid, text, uuid)','busy_work_edit_context_v1(uuid, text, uuid, bigint)','busy_work_history_v1(uuid, text, uuid)','busy_work_read_v1(uuid, text, uuid)','busy_work_edit_quote_v1(uuid, text, uuid, bigint, text, text, text, text, text)','busy_work_private_read_v1(uuid, text, uuid, text)','busy_work_private_write_v1(uuid, text, uuid, bigint, bigint, text, text, text, text)','busy_creator_draft_read_v1(uuid, text, bigint)','busy_creator_draft_list_v1(uuid, uuid, text, integer)','busy_creator_draft_write_v1(uuid, text, bigint, jsonb, uuid, bigint, text, text)','busy_creator_draft_operation_v1(uuid, text)','busy_growth_opportunity_read_v1(uuid, uuid, bigint)','busy_growth_opportunity_list_v1(uuid, uuid, integer)','busy_growth_opportunity_write_v1(uuid, uuid, bigint, text, text, jsonb, text, text, text)','busy_growth_opportunity_operation_v1(uuid, text)') THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);END IF;
  IF f.nspname='public' AND f.exact IN ('busy_connected_website_transition_v1(uuid, uuid, bigint, jsonb, jsonb, bigint, text)','busy_connected_website_commit_v1(uuid, uuid, bigint, jsonb, jsonb, bigint)','busy_connected_first_app_v1(uuid, uuid, text, text, text, text, bigint, jsonb)','busy_connected_private_app_commit_v1(uuid, uuid, uuid, bigint, bigint, jsonb)','busy_mini_app_entry_summary(uuid, uuid, timestamp with time zone)') THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);END IF;
 END LOOP;
END $$;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON TABLES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE ALL ON SEQUENCES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC,anon,authenticated,service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE f record; r text; BEGIN
 FOR f IN SELECT p.oid,p.prosecdef,p.proconfig,p.proowner FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE (n.nspname='public' AND p.proname LIKE 'busy_%') OR n.nspname IN ('busy_snapshot_private','busy_work_private','busy_creator_private','busy_growth_private') LOOP
  IF f.proowner<>'postgres'::regrole THEN RAISE EXCEPTION 'Unexpected function owner';END IF;
  IF f.prosecdef AND (f.proconfig IS NULL OR NOT f.proconfig&&ARRAY['search_path=pg_catalog, pg_temp','search_path=pg_catalog','search_path=""']) THEN RAISE EXCEPTION 'Unsafe definer search path: %',f.oid::regprocedure;END IF;
  IF has_function_privilege('anon',f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Anonymous function exposure';END IF;
 END LOOP;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP IF has_schema_privilege(r,'public','CREATE') THEN RAISE EXCEPTION 'Client schema CREATE exposure';END IF;END LOOP;
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'Missing RLS';END IF;
END $$;
COMMIT;
