-- Marketing-only intake tables. Do not apply to production until privacy, anti-abuse and deployment gates pass.
create table if not exists public.busy_marketing_waitlist (
  id bigint generated always as identity primary key,
  email text not null unique check(length(email)<=254 and email=lower(email) and position('@' in email)>1),
  status text not null default 'pending' check(status in ('pending','confirmed','unsubscribed')),
  consent_version text not null,
  consent_at timestamptz not null default now(),
  confirmed_at timestamptz,
  token_hash text unique check(token_hash is null or token_hash ~ '^[0-9a-f]{64}$'),
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.busy_marketing_waitlist enable row level security;
revoke all on public.busy_marketing_waitlist from public, anon, authenticated;
revoke all on sequence public.busy_marketing_waitlist_id_seq from public, anon, authenticated;
grant select,insert,update on public.busy_marketing_waitlist to service_role;
grant usage,select on sequence public.busy_marketing_waitlist_id_seq to service_role;
-- No anon or authenticated policies: requests must traverse the reviewed server boundary.
create index if not exists busy_marketing_waitlist_pending_expiry_idx
  on public.busy_marketing_waitlist(token_expires_at) where status='pending';
-- Operations must purge expired unconfirmed entries after seven days, and honour deletion requests.
-- Never send marketing to status != 'confirmed'. This only consents to ONE launch notice, not a newsletter.
