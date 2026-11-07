-- REVIEW ONLY: original owner_status dependency closure; designated staging only.
BEGIN;
DO $$ BEGIN RAISE EXCEPTION 'OWNER STATUS REVIEW FUSE: separate staging installation approval required'; END $$;
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
COMMIT;
