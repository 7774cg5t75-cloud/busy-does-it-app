create extension if not exists pgmq;

do $$
begin
  if not exists (
    select 1 from pgmq.list_queues() where queue_name = 'busy_website_publish'
  ) then
    perform pgmq.create('busy_website_publish');
  end if;
end
$$;

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

alter table public.busy_websites
  add constraint busy_websites_current_preview_deployment_fkey
  foreign key (current_preview_deployment_id)
  references public.busy_website_deployments(id)
  on delete set null;

alter table public.busy_websites
  add constraint busy_websites_current_live_deployment_fkey
  foreign key (current_live_deployment_id)
  references public.busy_website_deployments(id)
  on delete set null;

create table if not exists public.busy_website_domains (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  website_id uuid not null references public.busy_websites(id) on delete cascade,
  hostname text not null,
  status text not null default 'pending_verification'
    check (status in ('pending_verification','verified','active','error','disabled')),
  verification_method text not null default 'dns_txt'
    check (verification_method in ('dns_txt')),
  verification_token text not null,
  ssl_status text not null default 'pending'
    check (ssl_status in ('pending','provisioning','active','error')),
  routing_provider text not null default 'unassigned',
  is_primary boolean not null default false,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  activated_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (website_id, hostname),
  unique (hostname),
  check (hostname = lower(hostname)),
  check (hostname ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$')
);

create table if not exists public.busy_website_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  website_id uuid not null references public.busy_websites(id) on delete cascade,
  deployment_id uuid not null references public.busy_website_deployments(id) on delete cascade,
  action text not null check (action in ('prepare','publish','rollback')),
  status text not null default 'queued'
    check (status in ('queued','processing','retry_wait','succeeded','failed')),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  last_error text,
  requested_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists busy_websites_business_idx
  on public.busy_websites (business_id, updated_at desc);
create index if not exists busy_website_deployments_business_idx
  on public.busy_website_deployments (business_id, created_at desc);
create index if not exists busy_website_deployments_site_state_idx
  on public.busy_website_deployments (website_id, state, version_no desc);
create index if not exists busy_website_domains_business_idx
  on public.busy_website_domains (business_id, updated_at desc);
create index if not exists busy_website_publish_jobs_queue_idx
  on public.busy_website_publish_jobs (status, requested_at);
create index if not exists busy_website_publish_jobs_business_idx
  on public.busy_website_publish_jobs (business_id, requested_at desc);

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

drop trigger if exists busy_website_deployment_immutable on public.busy_website_deployments;
create trigger busy_website_deployment_immutable
before update on public.busy_website_deployments
for each row execute function public.busy_guard_website_deployment_immutable();

alter table public.busy_websites enable row level security;
alter table public.busy_website_deployments enable row level security;
alter table public.busy_website_domains enable row level security;
alter table public.busy_website_publish_jobs enable row level security;

create policy members_read_websites
on public.busy_websites for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.busy_business_memberships m
    where m.business_id = busy_websites.business_id
      and m.user_id = (select auth.uid())
  )
);

create policy members_read_website_deployments
on public.busy_website_deployments for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.busy_business_memberships m
    where m.business_id = busy_website_deployments.business_id
      and m.user_id = (select auth.uid())
  )
);

create policy members_read_website_domains
on public.busy_website_domains for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.busy_business_memberships m
    where m.business_id = busy_website_domains.business_id
      and m.user_id = (select auth.uid())
  )
);

create policy members_read_website_publish_jobs
on public.busy_website_publish_jobs for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.busy_business_memberships m
    where m.business_id = busy_website_publish_jobs.business_id
      and m.user_id = (select auth.uid())
  )
);

revoke all on public.busy_websites from anon, authenticated;
revoke all on public.busy_website_deployments from anon, authenticated;
revoke all on public.busy_website_domains from anon, authenticated;
revoke all on public.busy_website_publish_jobs from anon, authenticated;

grant select on public.busy_websites to authenticated;
grant select on public.busy_website_deployments to authenticated;
grant select on public.busy_website_domains to authenticated;
grant select on public.busy_website_publish_jobs to authenticated;

grant select, insert, update, delete on public.busy_websites to service_role;
grant select, insert, update, delete on public.busy_website_deployments to service_role;
grant select, insert, update, delete on public.busy_website_domains to service_role;
grant select, insert, update, delete on public.busy_website_publish_jobs to service_role;

create or replace function public.busy_allocate_website_version(p_website_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version bigint;
begin
  update public.busy_websites
     set next_version = next_version + 1,
         updated_at = now()
   where id = p_website_id
   returning next_version - 1 into v_version;

  if v_version is null then raise exception 'Website not found'; end if;
  return v_version;
end;
$$;

create or replace function public.busy_enqueue_website_publish_job(p_job_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message_id bigint;
begin
  if not exists (
    select 1 from public.busy_website_publish_jobs where id = p_job_id
  ) then
    raise exception 'Publish job not found';
  end if;

  select pgmq.send(
    queue_name => 'busy_website_publish',
    msg => jsonb_build_object('job_id', p_job_id)
  ) into v_message_id;
  return v_message_id;
end;
$$;

create or replace function public.busy_read_website_publish_jobs(p_limit integer default 5)
returns table(msg_id bigint, read_ct bigint, enqueued_at timestamptz, vt timestamptz, message jsonb)
language sql
security definer
set search_path = ''
as $$
  select q.msg_id, q.read_ct, q.enqueued_at, q.vt, q.message
  from pgmq.read(
    queue_name => 'busy_website_publish',
    vt => 120,
    qty => least(greatest(coalesce(p_limit, 5), 1), 20)
  ) q;
$$;

create or replace function public.busy_archive_website_publish_message(p_msg_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select pgmq.archive('busy_website_publish', p_msg_id);
$$;

create or replace function public.busy_retry_website_publish_message(p_msg_id bigint, p_delay_seconds integer default 60)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select (pgmq.set_vt(
    'busy_website_publish',
    p_msg_id,
    least(greatest(coalesce(p_delay_seconds, 60), 5), 3600)
  )).msg_id;
$$;

create or replace function public.busy_website_publish_queue_metrics()
returns table(queue_name text, queue_length bigint, newest_msg_age_sec integer, oldest_msg_age_sec integer, total_messages bigint, scrape_time timestamptz)
language sql
security definer
set search_path = ''
as $$
  select m.queue_name, m.queue_length, m.newest_msg_age_sec,
         m.oldest_msg_age_sec, m.total_messages, m.scrape_time
  from pgmq.metrics('busy_website_publish') m;
$$;

revoke all on function public.busy_allocate_website_version(uuid) from public, anon, authenticated;
revoke all on function public.busy_enqueue_website_publish_job(uuid) from public, anon, authenticated;
revoke all on function public.busy_read_website_publish_jobs(integer) from public, anon, authenticated;
revoke all on function public.busy_archive_website_publish_message(bigint) from public, anon, authenticated;
revoke all on function public.busy_retry_website_publish_message(bigint, integer) from public, anon, authenticated;
revoke all on function public.busy_website_publish_queue_metrics() from public, anon, authenticated;

grant execute on function public.busy_allocate_website_version(uuid) to service_role;
grant execute on function public.busy_enqueue_website_publish_job(uuid) to service_role;
grant execute on function public.busy_read_website_publish_jobs(integer) to service_role;
grant execute on function public.busy_archive_website_publish_message(bigint) to service_role;
grant execute on function public.busy_retry_website_publish_message(bigint, integer) to service_role;
grant execute on function public.busy_website_publish_queue_metrics() to service_role;

comment on table public.busy_websites is
  'V3.36 multi-tenant website projects. One business may own multiple sites; publishing is server-mediated.';
comment on table public.busy_website_deployments is
  'Immutable website deployment source versions. Only deployment state/artifact metadata may change after creation.';
comment on table public.busy_website_domains is
  'Tenant-scoped custom-domain verification/routing state. Verification does not imply routing or SSL activation.';
comment on table public.busy_website_publish_jobs is
  'Durable audit/status rows corresponding to server-side queued website publishing work.';
