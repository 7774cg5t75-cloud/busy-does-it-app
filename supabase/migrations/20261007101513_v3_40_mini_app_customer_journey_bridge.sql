alter table public.busy_mini_app_requests
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists service_name text,
  add column if not exists preferred_date_text text;

create index if not exists busy_mini_app_requests_email_idx
  on public.busy_mini_app_requests (business_id, lower(contact_email))
  where contact_email is not null;
create index if not exists busy_mini_app_requests_phone_idx
  on public.busy_mini_app_requests (business_id, contact_phone)
  where contact_phone is not null;

create table if not exists public.busy_mini_app_consumer_apps (
  id uuid primary key default gen_random_uuid(),
  consumer_user_id uuid not null references auth.users(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  first_opened_at timestamptz not null default now(),
  last_opened_at timestamptz not null default now(),
  last_action_at timestamptz,
  favorite boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (consumer_user_id, mini_app_id)
);

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

create table if not exists public.busy_mini_app_request_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  request_id uuid not null references public.busy_mini_app_requests(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in ('received','reviewing','accepted','declined','closed','linked_customer','booking_draft','booking_confirmed')),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists busy_mini_app_consumer_apps_user_opened_idx
  on public.busy_mini_app_consumer_apps (consumer_user_id, last_opened_at desc);
create index if not exists busy_mini_app_consumer_apps_app_idx
  on public.busy_mini_app_consumer_apps (mini_app_id, last_opened_at desc);
create index if not exists busy_mini_app_request_links_business_idx
  on public.busy_mini_app_request_links (business_id, linked_at desc);
create index if not exists busy_mini_app_request_links_customer_idx
  on public.busy_mini_app_request_links (business_id, customer_record_id);
create index if not exists busy_mini_app_request_events_request_idx
  on public.busy_mini_app_request_events (request_id, created_at asc);
create index if not exists busy_mini_app_request_events_business_idx
  on public.busy_mini_app_request_events (business_id, created_at desc);

alter table public.busy_mini_app_consumer_apps enable row level security;
alter table public.busy_mini_app_request_links enable row level security;
alter table public.busy_mini_app_request_events enable row level security;

revoke all on public.busy_mini_app_consumer_apps from anon, authenticated;
revoke all on public.busy_mini_app_request_links from anon, authenticated;
revoke all on public.busy_mini_app_request_events from anon, authenticated;

grant select, insert, update, delete on public.busy_mini_app_consumer_apps to service_role;
grant select, insert, update, delete on public.busy_mini_app_request_links to service_role;
grant select, insert, update, delete on public.busy_mini_app_request_events to service_role;

comment on table public.busy_mini_app_consumer_apps is
  'Private server-owned My BUSY Apps history/favorites for signed-in consumers.';
comment on table public.busy_mini_app_request_links is
  'Durable dedupe/link record between a Mini App request and the business snapshot customer/action records created after owner review.';
comment on table public.busy_mini_app_request_events is
  'Server-side audit trail for Mini App request lifecycle and BUSY customer/work bridging.';
