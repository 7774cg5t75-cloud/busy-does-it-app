-- V3.81 founder-only, platform-scoped vendor usage and subscriptions ledger.
-- All read/write access is through freshly server-authorised founder API.
-- This is NOT a provider invoice or an automatic metering feed.
create table if not exists public.busy_founder_service_snapshots (
 id uuid primary key default gen_random_uuid(),
 service_key text not null check(service_key in
  ('supabase','cloudflare','github','expo','apple','meta','google','ai','email','payments')),
 request_key text not null check(length(request_key) between 12 and 128),
 source text not null default 'founder_entered'
  check(source in ('founder_entered','verified_log_sample')),
 plan_name text not null default '' check(length(plan_name)<=80),
 billing_status text not null default 'unknown'
  check(billing_status in ('unknown','free','trial','paid','inactive')),
 billing_cadence text not null default 'unknown'
  check(billing_cadence in ('unknown','monthly','annual','usage_based','none')),
 usage_value bigint check(usage_value between 0 and 1000000000000),
 allowance_value bigint check(allowance_value between 0 and 1000000000000),
 usage_unit text not null default '' check(length(usage_unit)<=50),
 amount_gbp_pence integer check(amount_gbp_pence between 0 and 100000000),
 renewal_on date,
 observed_at timestamptz not null,
 note text not null default '' check(length(note)<=500),
 recorded_at timestamptz not null default now(),
 recorded_by uuid,
 unique(service_key,request_key),
 constraint busy_founder_snapshots_creator_check check(
  (source='founder_entered' and recorded_by is not null)
  or (source='verified_log_sample' and recorded_by is null)
 ),
 constraint busy_founder_snapshots_allowance check(
   allowance_value is null or usage_value is not null
 )
);
create index if not exists busy_founder_service_recent_idx
 on public.busy_founder_service_snapshots(service_key,recorded_at desc);
alter table public.busy_founder_service_snapshots enable row level security;
revoke all on public.busy_founder_service_snapshots from public,anon,authenticated;
grant select,insert on public.busy_founder_service_snapshots to service_role;

-- One-time, explicitly time-labelled observation gathered from Supabase
-- function_edge_logs across BOTH projects sharing the Free organisation.
-- Not a provider invoice or continuously refreshed monthly total.
insert into public.busy_founder_service_snapshots(
 service_key,request_key,source,plan_name,billing_status,billing_cadence,
 usage_value,allowance_value,usage_unit,amount_gbp_pence,observed_at,note,recorded_by)
values(
 'supabase','v381_log_sample_oct09_0920_utc','verified_log_sample',
 'Free (organization confirmed)','free','monthly',
 14493,500000,'Edge Function invocations',null,
 '2026-10-09 09:20:00+00',
 'Log count from 1 Oct to 9 Oct 09:20 UTC across BUSY + Slow Roast projects. Not invoice/official complete billing-cycle meter.',null)
on conflict(service_key,request_key) do nothing;
