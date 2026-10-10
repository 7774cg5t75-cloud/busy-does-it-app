-- V3.104: future opt-in visual screenshot AI meter.
-- Not deployed by GitHub alone. Functions are service-role-only, and initial
-- business state is disabled. This does NOT activate paid customer reviews.
create table if not exists public.busy_website_visual_ai_limits (
  business_id uuid primary key,
  enabled boolean not null default false,
  monthly_request_cap integer not null default 2
    check (monthly_request_cap between 0 and 20),
  changed_at timestamptz not null default now()
);
create table if not exists public.busy_website_visual_ai_calls (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  request_key text not null check (length(request_key) between 8 and 160),
  request_month date not null,
  state text not null default 'reserved'
    check (state in ('reserved','completed','failed')),
  input_tokens integer not null default 0 check (input_tokens>=0),
  output_tokens integer not null default 0 check (output_tokens>=0),
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (business_id, request_key)
);
create index if not exists busy_website_visual_ai_calls_month_idx
  on public.busy_website_visual_ai_calls(business_id,request_month,state);

alter table public.busy_website_visual_ai_limits enable row level security;
alter table public.busy_website_visual_ai_calls enable row level security;
revoke all on public.busy_website_visual_ai_limits from public,anon,authenticated;
revoke all on public.busy_website_visual_ai_calls from public,anon,authenticated;
grant select,insert,update on public.busy_website_visual_ai_limits to service_role;
grant select,insert,update on public.busy_website_visual_ai_calls to service_role;

create or replace function public.busy_reserve_website_visual_ai_call(
  p_business_id uuid,p_request_key text
) returns uuid
language plpgsql security definer
set search_path=public,pg_temp
as $$
declare
  limit_record public.busy_website_visual_ai_limits%rowtype;
  found_id uuid;
  number_used integer;
  month_start date := date_trunc('month',now() at time zone 'utc')::date;
begin
  if p_business_id is null or p_request_key is null or
     length(p_request_key)<8 or length(p_request_key)>160 then
    return null;
  end if;
  -- Serialise reservations for the same business. Two simultaneous requests
  -- cannot both squeeze past the monthly allowance.
  select * into limit_record
    from public.busy_website_visual_ai_limits
    where business_id=p_business_id for update;
  if not found or limit_record.enabled is distinct from true then
    return null;
  end if;
  select id into found_id from public.busy_website_visual_ai_calls
    where business_id=p_business_id and request_key=p_request_key;
  if found_id is not null then
    return null; -- duplicate request keys never authorise a second provider invocation
  end if;
  select count(*) into number_used from public.busy_website_visual_ai_calls
    where business_id=p_business_id and request_month=month_start
      and state in ('reserved','completed','failed');
  if number_used>=limit_record.monthly_request_cap then
    return null;
  end if;
  insert into public.busy_website_visual_ai_calls
    (business_id,request_key,request_month,state)
  values (p_business_id,p_request_key,month_start,'reserved')
  on conflict (business_id,request_key) do nothing
  returning id into found_id;
  -- A concurrent duplicate must not receive permission to call the model.
  if found_id is null then return null; end if;
  return found_id;
end;
$$;

create or replace function public.busy_finish_website_visual_ai_call(
  p_business_id uuid,p_call_id uuid,p_state text,
  p_input_tokens integer default 0,p_output_tokens integer default 0
) returns boolean
language plpgsql security definer
set search_path=public,pg_temp
as $$
declare
  already text;
begin
  if p_business_id is null or p_call_id is null or
     p_state not in ('completed','failed') or
     p_input_tokens<0 or p_output_tokens<0 then
    return false;
  end if;
  select state into already from public.busy_website_visual_ai_calls
    where id=p_call_id and business_id=p_business_id for update;
  if already is distinct from 'reserved' then
    return false;
  end if;
  update public.busy_website_visual_ai_calls set
    state=p_state,input_tokens=least(p_input_tokens,100000),
    output_tokens=least(p_output_tokens,100000),finished_at=now()
    where id=p_call_id and business_id=p_business_id;
  return true;
end;
$$;
revoke all on function public.busy_reserve_website_visual_ai_call(uuid,text)
  from public,anon,authenticated;
revoke all on function public.busy_finish_website_visual_ai_call(uuid,uuid,text,integer,integer)
  from public,anon,authenticated;
grant execute on function public.busy_reserve_website_visual_ai_call(uuid,text)
  to service_role;
grant execute on function public.busy_finish_website_visual_ai_call(uuid,uuid,text,integer,integer)
  to service_role;
