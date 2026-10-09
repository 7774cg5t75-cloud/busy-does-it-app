-- V3.82 throttle opt-in provider refreshes to one every 30 minutes.
create table if not exists public.busy_founder_provider_refresh_slots (
  window_start timestamptz primary key,
  recorded_at timestamptz not null default now()
);
alter table public.busy_founder_provider_refresh_slots enable row level security;
revoke all on public.busy_founder_provider_refresh_slots from public,anon,authenticated;
grant select,insert,delete on public.busy_founder_provider_refresh_slots to service_role;
create or replace function public.busy_claim_founder_provider_window()
returns boolean language plpgsql security invoker set search_path='' as $$
declare window_start timestamptz;
declare claimed timestamptz;
begin
  window_start:=pg_catalog.to_timestamp(
    pg_catalog.floor(pg_catalog.date_part('epoch',pg_catalog.clock_timestamp())/1800)*1800);
  insert into public.busy_founder_provider_refresh_slots(window_start)
  values(window_start) on conflict do nothing returning busy_founder_provider_refresh_slots.window_start into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.busy_claim_founder_provider_window() from public,anon,authenticated;
grant execute on function public.busy_claim_founder_provider_window() to service_role;
select cron.schedule('busy-v382-provider-refresh-prune','27 2 * * *',
  $$delete from public.busy_founder_provider_refresh_slots where window_start<now()-interval '2 days'$$);
