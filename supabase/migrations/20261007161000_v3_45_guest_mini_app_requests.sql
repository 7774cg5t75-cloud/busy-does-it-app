-- V3.45 Guest Mini App requests: browser challenge, bounded rate limits and guest request receipts.

alter table public.busy_mini_app_requests
  alter column consumer_user_id drop not null,
  add column if not exists request_origin text not null default 'signed_in',
  add column if not exists identity_assurance text not null default 'signed_in_account',
  add column if not exists guest_challenge_id uuid,
  add column if not exists guest_access_hash text,
  add column if not exists guest_proof_verified_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'busy_mini_app_requests_origin_check'
  ) then
    alter table public.busy_mini_app_requests
      add constraint busy_mini_app_requests_origin_check
      check (request_origin in ('signed_in','guest_web'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'busy_mini_app_requests_identity_assurance_check'
  ) then
    alter table public.busy_mini_app_requests
      add constraint busy_mini_app_requests_identity_assurance_check
      check (identity_assurance in ('signed_in_account','guest_browser_challenge'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'busy_mini_app_requests_origin_identity_shape_check'
  ) then
    alter table public.busy_mini_app_requests
      add constraint busy_mini_app_requests_origin_identity_shape_check
      check (
        (
          request_origin = 'signed_in'
          and consumer_user_id is not null
          and identity_assurance = 'signed_in_account'
          and guest_challenge_id is null
          and guest_access_hash is null
          and guest_proof_verified_at is null
        )
        or
        (
          request_origin = 'guest_web'
          and consumer_user_id is null
          and identity_assurance = 'guest_browser_challenge'
          and guest_challenge_id is not null
          and guest_access_hash is not null
          and guest_proof_verified_at is not null
        )
      );
  end if;
end
$$;

create unique index if not exists busy_mini_app_requests_guest_challenge_idx
  on public.busy_mini_app_requests (guest_challenge_id)
  where guest_challenge_id is not null;

create unique index if not exists busy_mini_app_requests_guest_access_idx
  on public.busy_mini_app_requests (guest_access_hash)
  where guest_access_hash is not null;

create index if not exists busy_mini_app_requests_origin_created_idx
  on public.busy_mini_app_requests (business_id, request_origin, created_at desc);

create table if not exists public.busy_mini_app_guest_challenges (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  version_id uuid not null references public.busy_mini_app_versions(id) on delete cascade,
  request_type text not null check (request_type in ('enquiry','booking_request')),
  token_hash text not null unique,
  fingerprint_hash text not null,
  contact_hash text,
  pow_seed text not null,
  pow_difficulty smallint not null default 3 check (pow_difficulty between 2 and 5),
  state text not null default 'pending'
    check (state in ('pending','consumed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists busy_mini_app_guest_challenges_fingerprint_created_idx
  on public.busy_mini_app_guest_challenges (fingerprint_hash, created_at desc);

create index if not exists busy_mini_app_guest_challenges_app_created_idx
  on public.busy_mini_app_guest_challenges (mini_app_id, created_at desc);

create index if not exists busy_mini_app_guest_challenges_contact_consumed_idx
  on public.busy_mini_app_guest_challenges (contact_hash, consumed_at desc)
  where contact_hash is not null and consumed_at is not null;

create index if not exists busy_mini_app_guest_challenges_expires_idx
  on public.busy_mini_app_guest_challenges (expires_at);

alter table public.busy_mini_app_guest_challenges enable row level security;
revoke all on public.busy_mini_app_guest_challenges from anon, authenticated;
grant select, insert, update, delete on public.busy_mini_app_guest_challenges to service_role;

create policy busy_mini_app_guest_challenges_no_direct_client_access
  on public.busy_mini_app_guest_challenges
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.busy_mini_app_create_guest_request(
  p_challenge_id uuid,
  p_fingerprint_hash text,
  p_contact_hash text,
  p_guest_access_hash text,
  p_idempotency_key text,
  p_payload jsonb,
  p_contact_name text,
  p_contact_email text,
  p_contact_phone text,
  p_service_name text,
  p_preferred_date_text text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.busy_mini_app_guest_challenges%rowtype;
  v_existing_id uuid;
  v_request_id uuid;
  v_recent_fingerprint bigint;
  v_recent_contact bigint;
begin
  select *
    into v_challenge
  from public.busy_mini_app_guest_challenges
  where id = p_challenge_id
  for update;

  if v_challenge.id is null then
    raise exception 'Guest request challenge not found';
  end if;

  if v_challenge.state = 'consumed' then
    select id into v_existing_id
    from public.busy_mini_app_requests
    where guest_challenge_id = p_challenge_id
    limit 1;

    if v_existing_id is not null then
      return v_existing_id;
    end if;

    raise exception 'Guest request challenge already used';
  end if;

  if v_challenge.expires_at <= now() then
    raise exception 'Guest request challenge expired';
  end if;

  if v_challenge.fingerprint_hash <> p_fingerprint_hash then
    raise exception 'Guest request challenge does not match this browser';
  end if;

  if not exists (
    select 1
    from public.busy_mini_apps a
    where a.id = v_challenge.mini_app_id
      and a.business_id = v_challenge.business_id
      and a.status = 'live'
      and a.current_live_version_id = v_challenge.version_id
  ) then
    raise exception 'The live Mini App changed. Refresh and try again';
  end if;

  select count(*) into v_recent_fingerprint
  from public.busy_mini_app_guest_challenges c
  where c.fingerprint_hash = p_fingerprint_hash
    and c.consumed_at >= now() - interval '1 hour';

  if v_recent_fingerprint >= 5 then
    raise exception 'Too many guest requests from this browser. Try again later';
  end if;

  if nullif(p_contact_hash, '') is not null then
    select count(*) into v_recent_contact
    from public.busy_mini_app_guest_challenges c
    where c.contact_hash = p_contact_hash
      and c.consumed_at >= now() - interval '1 hour';

    if v_recent_contact >= 3 then
      raise exception 'Too many requests for these contact details. Try again later';
    end if;
  end if;

  insert into public.busy_mini_app_requests (
    business_id,
    mini_app_id,
    version_id,
    consumer_user_id,
    module_key,
    request_type,
    status,
    payload,
    contact_name,
    contact_email,
    contact_phone,
    service_name,
    preferred_date_text,
    request_origin,
    identity_assurance,
    guest_challenge_id,
    guest_access_hash,
    guest_proof_verified_at,
    business_unread_count,
    customer_unread_count,
    idempotency_key,
    created_at,
    updated_at
  )
  values (
    v_challenge.business_id,
    v_challenge.mini_app_id,
    v_challenge.version_id,
    null,
    case when v_challenge.request_type = 'booking_request'
      then 'booking_request' else 'enquiry' end,
    v_challenge.request_type,
    'received',
    coalesce(p_payload, '{}'::jsonb),
    nullif(p_contact_name, ''),
    nullif(p_contact_email, ''),
    nullif(p_contact_phone, ''),
    nullif(p_service_name, ''),
    nullif(p_preferred_date_text, ''),
    'guest_web',
    'guest_browser_challenge',
    v_challenge.id,
    p_guest_access_hash,
    now(),
    1,
    0,
    nullif(p_idempotency_key, ''),
    now(),
    now()
  )
  returning id into v_request_id;

  insert into public.busy_mini_app_request_events (
    business_id,
    request_id,
    actor_user_id,
    event_type,
    detail,
    created_at
  )
  values (
    v_challenge.business_id,
    v_request_id,
    null,
    'received',
    jsonb_build_object(
      'requestType', v_challenge.request_type,
      'source', 'public_web_guest',
      'identityAssurance', 'guest_browser_challenge'
    ),
    now()
  );

  update public.busy_mini_app_guest_challenges
  set state = 'consumed',
      contact_hash = nullif(p_contact_hash, ''),
      consumed_at = now()
  where id = v_challenge.id;

  return v_request_id;
end;
$$;

revoke all on function public.busy_mini_app_create_guest_request(
  uuid,text,text,text,text,jsonb,text,text,text,text,text
) from public, anon, authenticated;
grant execute on function public.busy_mini_app_create_guest_request(
  uuid,text,text,text,text,jsonb,text,text,text,text,text
) to service_role;

create or replace function public.busy_prune_mini_app_guest_challenges()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted bigint;
begin
  with deleted as (
    delete from public.busy_mini_app_guest_challenges
    where expires_at < now() - interval '24 hours'
    returning 1
  )
  select count(*) into v_deleted from deleted;
  return v_deleted;
end;
$$;

revoke all on function public.busy_prune_mini_app_guest_challenges()
  from public, anon, authenticated;
grant execute on function public.busy_prune_mini_app_guest_challenges()
  to service_role;

do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname = 'busy-mini-app-guest-challenge-prune'
  limit 1;
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end
$$;

select cron.schedule(
  'busy-mini-app-guest-challenge-prune',
  '17 * * * *',
  'select public.busy_prune_mini_app_guest_challenges();'
);

comment on table public.busy_mini_app_guest_challenges is
  'Ephemeral server-owned V3.45 guest browser challenges. Fingerprints are keyed hashes; raw IP addresses are not stored.';
comment on column public.busy_mini_app_requests.identity_assurance is
  'How BUSY authenticated the request origin. guest_browser_challenge verifies the browser challenge, not ownership of the typed contact details.';
