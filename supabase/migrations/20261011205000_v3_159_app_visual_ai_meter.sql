-- V3.159 private app screenshot design review — opt-in, service-role metered.
-- Migration alone NEVER enables image uploads, AI costs or a customer feature.
create table if not exists public.busy_app_visual_ai_limits (
 business_id uuid primary key,
 enabled boolean not null default false,
 monthly_request_cap integer not null default 0
   check(monthly_request_cap between 0 and 20),
 changed_at timestamptz not null default now()
);
create table if not exists public.busy_app_visual_ai_calls (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null,
 app_id uuid not null,
 draft_revision bigint not null check(draft_revision > 0),
 request_key text not null check(length(request_key) between 8 and 160),
 request_month date not null,
 state text not null default 'reserved'
   check(state in ('reserved','completed','failed')),
 input_tokens integer not null default 0 check(input_tokens>=0),
 output_tokens integer not null default 0 check(output_tokens>=0),
 created_at timestamptz not null default now(),
 finished_at timestamptz,
 unique(business_id,request_key)
);
create index if not exists busy_app_visual_ai_month_idx
 on public.busy_app_visual_ai_calls(business_id,request_month,state);
alter table public.busy_app_visual_ai_limits enable row level security;
alter table public.busy_app_visual_ai_calls enable row level security;
revoke all on public.busy_app_visual_ai_limits from public,anon,authenticated;
revoke all on public.busy_app_visual_ai_calls from public,anon,authenticated;
grant select,insert,update on public.busy_app_visual_ai_limits to service_role;
grant select,insert,update on public.busy_app_visual_ai_calls to service_role;
create or replace function public.busy_reserve_app_visual_ai_call(
 p_business_id uuid,p_app_id uuid,p_draft_revision bigint,p_request_key text
) returns uuid language plpgsql security definer
set search_path=public,pg_temp as $$
declare quota public.busy_app_visual_ai_limits%rowtype;
 claim_id uuid; used_count integer;
 month_start date:=date_trunc('month',now() at time zone 'utc')::date;
begin
 if p_business_id is null or p_app_id is null or
    p_draft_revision is null or p_draft_revision<1 or
    p_request_key is null or length(p_request_key)<8 or length(p_request_key)>160
 then return null; end if;
 select * into quota from public.busy_app_visual_ai_limits
  where business_id=p_business_id for update;
 if not found or quota.enabled is distinct from true or quota.monthly_request_cap<1
 then return null; end if;
 if exists(select 1 from public.busy_app_visual_ai_calls
   where business_id=p_business_id and request_key=p_request_key)
 then return null; end if;
 select count(*) into used_count from public.busy_app_visual_ai_calls
  where business_id=p_business_id and request_month=month_start
   and state in ('reserved','completed','failed');
 if used_count >= quota.monthly_request_cap then return null; end if;
 insert into public.busy_app_visual_ai_calls(
   business_id,app_id,draft_revision,request_key,request_month)
 values(p_business_id,p_app_id,p_draft_revision,p_request_key,month_start)
 on conflict(business_id,request_key) do nothing returning id into claim_id;
 return claim_id;
end; $$;
create or replace function public.busy_finish_app_visual_ai_call(
 p_business_id uuid,p_call_id uuid,p_state text,
 p_input_tokens integer default 0,p_output_tokens integer default 0
) returns boolean language plpgsql security definer
set search_path=public,pg_temp as $$
declare current_state text;
begin
 if p_business_id is null or p_call_id is null or
    p_state not in ('completed','failed') or
    p_input_tokens<0 or p_output_tokens<0 then return false; end if;
 select state into current_state from public.busy_app_visual_ai_calls
  where business_id=p_business_id and id=p_call_id for update;
 if current_state is distinct from 'reserved' then return false; end if;
 update public.busy_app_visual_ai_calls
  set state=p_state,input_tokens=least(p_input_tokens,100000),
      output_tokens=least(p_output_tokens,100000),finished_at=now()
 where business_id=p_business_id and id=p_call_id;
 return true;
end; $$;
revoke all on function public.busy_reserve_app_visual_ai_call(uuid,uuid,bigint,text)
 from public,anon,authenticated;
revoke all on function public.busy_finish_app_visual_ai_call(uuid,uuid,text,integer,integer)
 from public,anon,authenticated;
grant execute on function public.busy_reserve_app_visual_ai_call(uuid,uuid,bigint,text)
 to service_role;
grant execute on function public.busy_finish_app_visual_ai_call(uuid,uuid,text,integer,integer)
 to service_role;
