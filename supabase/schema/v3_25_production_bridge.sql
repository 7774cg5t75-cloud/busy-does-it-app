-- V3.25 Production Bridge schema reference.
-- Applied to Supabase project qgkmuiipicazmcxxmoxv via reviewed SQL, with RLS enabled.
-- Keep this file in sync with the production database until the next CLI db pull captures it.

create table if not exists public.busy_push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.busy_businesses(id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'unknown' check (platform in ('ios','android','unknown')),
  app_version text,
  device_label text,
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create table if not exists public.busy_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  provider text not null default 'google_calendar' check (provider in ('google_calendar')),
  status text not null default 'not_connected',
  provider_account_id text,
  provider_account_email text,
  calendar_id text not null default 'primary',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}'::text[],
  last_error text,
  connected_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, business_id, provider)
);

create table if not exists public.busy_calendar_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  provider text not null default 'google_calendar' check (provider in ('google_calendar')),
  app_redirect_uri text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- busy_push_devices: authenticated owner-only RLS.
-- busy_calendar_connections / busy_calendar_oauth_states: RLS enabled and client access explicitly blocked.


-- Cover foreign keys used during account/business cleanup and OAuth-state expiry work.
create index if not exists busy_calendar_connections_business_idx
  on public.busy_calendar_connections (business_id);

create index if not exists busy_calendar_oauth_states_business_idx
  on public.busy_calendar_oauth_states (business_id);

create index if not exists busy_calendar_oauth_states_user_idx
  on public.busy_calendar_oauth_states (user_id);


-- V3.26 real Google Calendar mapping + server push delivery dedupe.
create table if not exists public.busy_calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  provider text not null default 'google_calendar' check (provider in ('google_calendar')),
  customer_id text not null,
  event_id text not null,
  calendar_id text not null default 'primary',
  busy_fingerprint text not null default '',
  busy_start_at timestamptz,
  busy_end_at timestamptz,
  google_start_at timestamptz,
  google_end_at timestamptz,
  google_updated_at timestamptz,
  status text not null default 'active' check (status in ('active','cancelled','completed')),
  last_sync_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, business_id, provider, customer_id),
  unique (user_id, business_id, provider, event_id)
);

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

create table if not exists public.busy_internal_config (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- All three V3.26 tables have RLS enabled and are server-only to anon/authenticated clients.
