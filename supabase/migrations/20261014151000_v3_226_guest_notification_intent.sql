-- V3.226: one transactionally saved notification INTENT for each guest
-- Business App customer request. NO provider send, cron, pg_net or worker.
-- Apply ONLY after independently approved/installed V3.39-V3.45 schema.
-- The request is still NOT a booking or proof of notification delivery.

create table if not exists public.busy_mini_app_guest_notification_intents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique
    references public.busy_mini_app_requests(id) on delete cascade,
  business_id uuid not null
    references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null
    references public.busy_mini_apps(id) on delete cascade,
  event_kind text not null default 'guest_received'
    check (event_kind = 'guest_received'),
  state text not null default 'pending'
    check (state in ('pending','claimed','provider_accepted',
                    'retry_wait','manual_review','cancelled')),
  attempt_count integer not null default 0
    check (attempt_count between 0 and 100),
  available_at timestamptz not null default now(),
  lease_expires_at timestamptz,
  last_attempt_at timestamptz,
  provider_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (state <> 'provider_accepted' or provider_accepted_at is not null),
  check (state <> 'claimed' or lease_expires_at is not null)
);

create index if not exists busy_mini_app_guest_notification_intents_dispatch_idx
 on public.busy_mini_app_guest_notification_intents
 (state, available_at, created_at)
 where state in ('pending','retry_wait');

create index if not exists busy_mini_app_guest_notification_intents_tenant_idx
 on public.busy_mini_app_guest_notification_intents
 (business_id, mini_app_id, created_at desc);

alter table public.busy_mini_app_guest_notification_intents enable row level security;
alter table public.busy_mini_app_guest_notification_intents force row level security;
revoke all on public.busy_mini_app_guest_notification_intents from public, anon, authenticated;
grant select, insert, update, delete
 on public.busy_mini_app_guest_notification_intents to service_role;

-- Do not add a client policy. A privileged server transaction can inspect
-- this table only via separately verified membership-scoped Edge handlers.
create or replace function public.busy_enqueue_guest_notification_v3226()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.request_origin = 'guest_web' then
    if new.guest_challenge_id is null
       or new.identity_assurance <> 'guest_browser_challenge'
       or new.request_type not in ('enquiry','booking_request') then
      raise exception 'Invalid guest request notification source';
    end if;
    insert into public.busy_mini_app_guest_notification_intents
      (request_id,business_id,mini_app_id,event_kind,state)
    values
      (new.id,new.business_id,new.mini_app_id,'guest_received','pending')
    on conflict (request_id) do nothing;
  end if;
  return new;
end;
$$;

-- Trigger invocation is internal to the INSERT transaction; no public
-- RPC for anonymous consumers and no user-provided request ID.
revoke all on function public.busy_enqueue_guest_notification_v3226()
 from public, anon, authenticated;
grant execute on function public.busy_enqueue_guest_notification_v3226()
 to service_role;

create trigger busy_mini_app_guest_notification_intent_v3226
after insert on public.busy_mini_app_requests
for each row
execute function public.busy_enqueue_guest_notification_v3226();

comment on table public.busy_mini_app_guest_notification_intents is
 'One durable pending owner-notification intent per saved guest request. No dispatch job or provider acceptance is established by this table.';
