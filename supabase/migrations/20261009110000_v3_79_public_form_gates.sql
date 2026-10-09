-- BUSY DOES IT V3.79 public lead intake foundations.
-- Default CLOSED: no website has visitor form intake enabled by this migration.
alter table public.busy_website_leads
  drop constraint if exists busy_website_leads_source_check;
alter table public.busy_website_leads
  add constraint busy_website_leads_source_check
  check (source in ('owner_entered','website_form'));
alter table public.busy_websites
  add column if not exists public_form_enabled boolean not null default false;

create table if not exists public.busy_website_form_quota (
  website_id uuid not null references public.busy_websites(id) on delete cascade,
  window_start timestamptz not null,
  submissions integer not null default 0 check (submissions between 1 and 12),
  primary key (website_id,window_start)
);
alter table public.busy_website_form_quota enable row level security;
revoke all on public.busy_website_form_quota from public,anon,authenticated;
grant select,insert,update,delete on public.busy_website_form_quota to service_role;

-- This is SECURITY INVOKER. Only service_role has EXECUTE, after bot
-- verification and the strict site-publishing gate in the Edge Function.
create or replace function public.busy_claim_website_form_quota(p_website_id uuid)
returns boolean
language plpgsql security invoker set search_path=''
as $$
declare v_window timestamptz;
declare v_count integer;
begin
  if p_website_id is null then return false; end if;
  v_window := pg_catalog.to_timestamp(
    pg_catalog.floor(pg_catalog.date_part('epoch',pg_catalog.clock_timestamp()) / 3600)*3600);
  insert into public.busy_website_form_quota(website_id,window_start,submissions)
  values(p_website_id,v_window,1)
  on conflict (website_id,window_start)
  do update set submissions=public.busy_website_form_quota.submissions+1
    where public.busy_website_form_quota.submissions < 12
  returning submissions into v_count;
  return v_count is not null;
end;
$$;
revoke all on function public.busy_claim_website_form_quota(uuid)
  from public,anon,authenticated;
grant execute on function public.busy_claim_website_form_quota(uuid)
  to service_role;

-- Only quota metadata, never contact details, is pruned automatically.
select cron.schedule('busy-v379-form-quota-retention','23 * * * *',
  $$delete from public.busy_website_form_quota
    where window_start < now() - interval '48 hours'$$);
