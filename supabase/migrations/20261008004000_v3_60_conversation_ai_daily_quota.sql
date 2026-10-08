-- V3.60 bounded server-only AI extraction quota, 20 requests per owner/business/day.
create table if not exists public.busy_conversation_ai_usage_daily (
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null default (now() at time zone 'UTC')::date,
  request_count integer not null default 0 check (request_count between 0 and 20),
  primary key (business_id, user_id, usage_day)
);
alter table public.busy_conversation_ai_usage_daily enable row level security;
revoke all on public.busy_conversation_ai_usage_daily from public, anon, authenticated;
-- Only the Edge Function's service role can debit a quota. No client writes.
create or replace function public.busy_try_conversation_ai_quota(
  p_business_id uuid, p_user_id uuid
) returns boolean
language plpgsql security invoker set search_path = ''
as $fn$
declare new_count integer;
begin
  insert into public.busy_conversation_ai_usage_daily(business_id,user_id,usage_day,request_count)
  values (p_business_id,p_user_id,(now() at time zone 'UTC')::date,1)
  on conflict (business_id,user_id,usage_day) do update
  set request_count = public.busy_conversation_ai_usage_daily.request_count + 1
  where public.busy_conversation_ai_usage_daily.request_count < 20
  returning request_count into new_count;
  return new_count is not null;
end
$fn$;
revoke all on function public.busy_try_conversation_ai_quota(uuid,uuid) from PUBLIC, anon, authenticated;
grant execute on function public.busy_try_conversation_ai_quota(uuid,uuid) to service_role;
