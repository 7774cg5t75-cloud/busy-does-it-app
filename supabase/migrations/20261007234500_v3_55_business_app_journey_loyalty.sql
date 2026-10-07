-- V3.55: complete Business App journey, dated offers and first real loyalty module.

create table if not exists public.busy_mini_app_loyalty_progress (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  consumer_user_id uuid not null references auth.users(id) on delete cascade,
  stamps integer not null default 0 check (stamps >= 0 and stamps <= 999),
  last_awarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mini_app_id, consumer_user_id)
);

create table if not exists public.busy_mini_app_loyalty_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  consumer_user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid references public.busy_mini_app_requests(id) on delete set null,
  delta integer not null check (delta between 1 and 20),
  balance_after integer not null check (balance_after >= 0 and balance_after <= 999),
  reason text not null default 'Owner recorded loyalty stamp',
  awarded_by uuid references auth.users(id) on delete set null,
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (mini_app_id, consumer_user_id, idempotency_key)
);

create unique index if not exists busy_mini_apps_id_business_unique_idx
  on public.busy_mini_apps (id, business_id);

create unique index if not exists busy_mini_app_requests_id_business_app_unique_idx
  on public.busy_mini_app_requests (id, business_id, mini_app_id);

do $
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_mini_app_loyalty_progress_tenant_app_fkey'
  ) then
    alter table public.busy_mini_app_loyalty_progress
      add constraint busy_mini_app_loyalty_progress_tenant_app_fkey
      foreign key (mini_app_id, business_id)
      references public.busy_mini_apps(id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_mini_app_loyalty_events_tenant_app_fkey'
  ) then
    alter table public.busy_mini_app_loyalty_events
      add constraint busy_mini_app_loyalty_events_tenant_app_fkey
      foreign key (mini_app_id, business_id)
      references public.busy_mini_apps(id, business_id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'busy_mini_app_loyalty_events_tenant_request_fkey'
  ) then
    alter table public.busy_mini_app_loyalty_events
      add constraint busy_mini_app_loyalty_events_tenant_request_fkey
      foreign key (request_id, business_id, mini_app_id)
      references public.busy_mini_app_requests(id, business_id, mini_app_id)
      on delete set null (request_id);
  end if;
end
$;

create index if not exists busy_mini_app_loyalty_progress_business_idx
  on public.busy_mini_app_loyalty_progress (business_id, updated_at desc);
create index if not exists busy_mini_app_loyalty_progress_consumer_idx
  on public.busy_mini_app_loyalty_progress (consumer_user_id, updated_at desc);
create index if not exists busy_mini_app_loyalty_events_business_idx
  on public.busy_mini_app_loyalty_events (business_id, created_at desc);
create index if not exists busy_mini_app_loyalty_events_consumer_idx
  on public.busy_mini_app_loyalty_events (consumer_user_id, created_at desc);
create index if not exists busy_mini_app_loyalty_events_request_idx
  on public.busy_mini_app_loyalty_events (request_id, created_at desc)
  where request_id is not null;

alter table public.busy_mini_app_loyalty_progress enable row level security;
alter table public.busy_mini_app_loyalty_events enable row level security;

revoke all on public.busy_mini_app_loyalty_progress from anon, authenticated;
revoke all on public.busy_mini_app_loyalty_events from anon, authenticated;

grant select, insert, update, delete on public.busy_mini_app_loyalty_progress to service_role;
grant select, insert, update, delete on public.busy_mini_app_loyalty_events to service_role;

drop policy if exists busy_mini_app_loyalty_progress_no_direct_client_access
  on public.busy_mini_app_loyalty_progress;
create policy busy_mini_app_loyalty_progress_no_direct_client_access
  on public.busy_mini_app_loyalty_progress
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists busy_mini_app_loyalty_events_no_direct_client_access
  on public.busy_mini_app_loyalty_events;
create policy busy_mini_app_loyalty_events_no_direct_client_access
  on public.busy_mini_app_loyalty_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

update public.busy_mini_app_module_catalog
set
  status = 'available',
  module_version = greatest(module_version, 2),
  description = 'Simple stamp/visit loyalty progress toward one owner-defined reward.',
  capabilities = jsonb_build_object(
    'public_read', true,
    'signed_in_progress', true,
    'owner_award', true,
    'builder_plan_supported', true,
    'min_target_stamps', 2,
    'max_target_stamps', 20
  ),
  default_enabled = false,
  updated_at = now()
where module_key = 'loyalty';

update public.busy_mini_app_module_catalog
set
  description = 'Future controlled payment/deposit module. Payments are not enabled in V3.55.',
  updated_at = now()
where module_key = 'payments';

create or replace function public.busy_award_mini_app_loyalty_stamp(
  p_business_id uuid,
  p_mini_app_id uuid,
  p_consumer_user_id uuid,
  p_request_id uuid,
  p_awarded_by uuid,
  p_idempotency_key text,
  p_target_stamps integer,
  p_reason text default 'Owner recorded loyalty stamp'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_progress public.busy_mini_app_loyalty_progress%rowtype;
  v_existing public.busy_mini_app_loyalty_events%rowtype;
  v_before integer := 0;
  v_after integer := 0;
  v_target integer := least(greatest(coalesce(p_target_stamps, 10), 2), 20);
begin
  if p_business_id is null or p_mini_app_id is null or p_consumer_user_id is null then
    raise exception 'Business, app and customer are required';
  end if;

  if nullif(trim(coalesce(p_idempotency_key, '')), '') is not null then
    select * into v_existing
    from public.busy_mini_app_loyalty_events
    where mini_app_id = p_mini_app_id
      and consumer_user_id = p_consumer_user_id
      and idempotency_key = p_idempotency_key
    limit 1;

    if found then
      select * into v_progress
      from public.busy_mini_app_loyalty_progress
      where mini_app_id = p_mini_app_id
        and consumer_user_id = p_consumer_user_id
      limit 1;

      return jsonb_build_object(
        'reused', true,
        'stamps', coalesce(v_progress.stamps, v_existing.balance_after),
        'targetStamps', v_target,
        'rewardReached', coalesce(v_progress.stamps, v_existing.balance_after) >= v_target,
        'eventId', v_existing.id
      );
    end if;
  end if;

  insert into public.busy_mini_app_loyalty_progress (
    business_id,
    mini_app_id,
    consumer_user_id,
    stamps,
    created_at,
    updated_at
  )
  values (
    p_business_id,
    p_mini_app_id,
    p_consumer_user_id,
    0,
    now(),
    now()
  )
  on conflict (mini_app_id, consumer_user_id) do nothing;

  select * into v_progress
  from public.busy_mini_app_loyalty_progress
  where mini_app_id = p_mini_app_id
    and consumer_user_id = p_consumer_user_id
  for update;

  if v_progress.business_id <> p_business_id then
    raise exception 'Loyalty tenant mismatch';
  end if;

  v_before := coalesce(v_progress.stamps, 0);
  if v_before >= v_target then
    return jsonb_build_object(
      'reused', false,
      'stamps', v_before,
      'targetStamps', v_target,
      'rewardReached', true,
      'alreadyComplete', true
    );
  end if;

  v_after := least(v_target, v_before + 1);

  update public.busy_mini_app_loyalty_progress
  set
    stamps = v_after,
    last_awarded_at = now(),
    updated_at = now()
  where id = v_progress.id;

  insert into public.busy_mini_app_loyalty_events (
    business_id,
    mini_app_id,
    consumer_user_id,
    request_id,
    delta,
    balance_after,
    reason,
    awarded_by,
    idempotency_key
  )
  values (
    p_business_id,
    p_mini_app_id,
    p_consumer_user_id,
    p_request_id,
    v_after - v_before,
    v_after,
    left(coalesce(nullif(trim(p_reason), ''), 'Owner recorded loyalty stamp'), 500),
    p_awarded_by,
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  returning * into v_existing;

  return jsonb_build_object(
    'reused', false,
    'stamps', v_after,
    'targetStamps', v_target,
    'rewardReached', v_after >= v_target,
    'eventId', v_existing.id
  );
end;
$$;

revoke all on function public.busy_award_mini_app_loyalty_stamp(
  uuid, uuid, uuid, uuid, uuid, text, integer, text
) from public, anon, authenticated;

grant execute on function public.busy_award_mini_app_loyalty_stamp(
  uuid, uuid, uuid, uuid, uuid, text, integer, text
) to service_role;

comment on table public.busy_mini_app_loyalty_progress is
  'V3.55 server-owned signed-in customer loyalty balance for one BUSY Business App.';
comment on table public.busy_mini_app_loyalty_events is
  'V3.55 auditable owner-recorded loyalty stamp events with idempotency.';
comment on function public.busy_award_mini_app_loyalty_stamp(
  uuid, uuid, uuid, uuid, uuid, text, integer, text
) is
  'V3.55 atomic one-stamp award capped at the live owner-defined reward target.';
