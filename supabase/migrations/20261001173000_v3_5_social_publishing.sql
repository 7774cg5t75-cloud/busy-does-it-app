create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.busy_social_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null default 'prototype',
  provider text not null check (provider in ('meta','google_business')),
  status text not null default 'not_configured',
  provider_account_id text,
  provider_account_name text,
  page_id text,
  page_name text,
  instagram_user_id text,
  instagram_username text,
  google_account_name text,
  google_location_name text,
  google_location_title text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  assets jsonb not null default '[]'::jsonb,
  scopes text[] not null default '{}'::text[],
  last_error text,
  connected_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_key, provider)
);

create table if not exists public.busy_social_oauth_states (
  state text primary key,
  workspace_key text not null default 'prototype',
  provider text not null check (provider in ('meta','google_business')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.busy_social_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null default 'prototype',
  client_draft_id text not null,
  source_customer_id text,
  source_job_id text,
  source_label text,
  service text,
  caption text not null,
  channels text[] not null default '{}'::text[],
  media jsonb not null default '[]'::jsonb,
  status text not null default 'Draft',
  owner_approved boolean not null default false,
  scheduled_for timestamptz,
  provider_results jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0,
  last_error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_key, client_draft_id)
);

create index if not exists busy_social_posts_due_idx
  on public.busy_social_posts (scheduled_for)
  where status = 'Scheduled' and owner_approved = true;

create index if not exists busy_social_posts_status_idx
  on public.busy_social_posts (status, updated_at desc);

alter table public.busy_social_connections enable row level security;
alter table public.busy_social_oauth_states enable row level security;
alter table public.busy_social_posts enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'busy-social-media',
  'busy-social-media',
  false,
  15000000,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'busy-social-process-due'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'busy-social-process-due',
  '* * * * *',
  $cron$
    select net.http_post(
      url := 'https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-social-publish',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'sb_publishable_-u4GplmvwptxNjdrh2UqEg_672Lhe74'
      ),
      body := '{"action":"process_due","source":"cron"}'::jsonb,
      timeout_milliseconds := 15000
    );
  $cron$
);
