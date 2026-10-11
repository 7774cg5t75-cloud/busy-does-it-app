-- V3.156: app-specific, service-role-only 12/day voice budget.
-- Counts only. No audio, transcripts, selected modules or customer data stored.
create table if not exists public.busy_app_voice_daily_usage (
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  usage_day date not null,
  requests integer not null default 0 check(requests between 0 and 12),
  updated_at timestamptz not null default now(),
  primary key(owner_user_id,business_id,usage_day)
);
alter table public.busy_app_voice_daily_usage enable row level security;
revoke all on public.busy_app_voice_daily_usage from public,anon,authenticated;
grant select,insert,update,delete on public.busy_app_voice_daily_usage to service_role;
create or replace function public.busy_reserve_app_voice_request(
 p_owner_user_id uuid,p_business_id uuid)
returns table(allowed boolean,used integer,remaining integer)
language plpgsql security definer set search_path=public,pg_temp as $$
declare n integer:=null; max_daily constant integer:=12;
begin
 if p_owner_user_id is null or p_business_id is null or not exists(
   select 1 from public.busy_business_memberships m
    where m.user_id=p_owner_user_id and m.business_id=p_business_id
     and m.role in ('owner','admin')
 ) then raise exception 'A verified business owner or administrator is required';
 end if;
 insert into public.busy_app_voice_daily_usage as entry
  (owner_user_id,business_id,usage_day,requests,updated_at)
 values(p_owner_user_id,p_business_id,(now() at time zone 'UTC')::date,1,now())
 on conflict (owner_user_id,business_id,usage_day) do update
  set requests=entry.requests+1,updated_at=now()
  where entry.requests<max_daily
 returning requests into n;
 if n is null then
  return query select false,max_daily,0;
 else
  return query select true,n,max_daily-n;
 end if;
end;$$;
revoke all on function public.busy_reserve_app_voice_request(uuid,uuid)
 from public,anon,authenticated;
grant execute on function public.busy_reserve_app_voice_request(uuid,uuid)
 to service_role;
comment on function public.busy_reserve_app_voice_request(uuid,uuid) is
'Only confirmed business owners/admins can reserve a metered app transcription. 12 requests per business owner per UTC day.';
