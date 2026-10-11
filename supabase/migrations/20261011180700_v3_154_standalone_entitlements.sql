-- V3.154: dedicated fail-closed standalone entitlement ledger.
-- NO billing rows are minted by this migration. Only a separately designed,
-- signature-verified billing provider webhook should write such evidence.
create table if not exists public.busy_standalone_entitlements (
 business_id uuid primary key references public.busy_businesses(id) on delete cascade,
 source text not null check(source='verified_provider_webhook'),
 provider_verified boolean not null default false,
 external_subscription_id text not null,
 status text not null check(status in ('active','expired','revoked')),
 tier_id text not null,
 allowance integer not null check(allowance>=0 and allowance<=100),
 used integer not null default 0 check(used>=0 and used<=allowance),
 period_end timestamptz not null,
 updated_at timestamptz not null default now()
);
alter table public.busy_standalone_entitlements enable row level security;
revoke all on public.busy_standalone_entitlements from anon,authenticated;
grant select,insert,update,delete on public.busy_standalone_entitlements to service_role;
comment on table public.busy_standalone_entitlements is
'Provider-verified future standalone app creation allowances. Service role only; never accept caller asserted tiers or paid state.';
