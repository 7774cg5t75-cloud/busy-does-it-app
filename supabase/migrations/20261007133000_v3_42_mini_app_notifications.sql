-- V3.42 Mini App notifications, unread state and bounded conversation loading.

alter table public.busy_mini_app_requests
  add column if not exists business_unread_count integer not null default 0,
  add column if not exists customer_unread_count integer not null default 0,
  add column if not exists last_business_read_at timestamptz,
  add column if not exists last_customer_read_at timestamptz;

create index if not exists busy_mini_app_requests_business_unread_idx
  on public.busy_mini_app_requests (business_id, updated_at desc)
  where business_unread_count > 0;

create index if not exists busy_mini_app_requests_customer_unread_idx
  on public.busy_mini_app_requests (consumer_user_id, updated_at desc)
  where customer_unread_count > 0;

create or replace function public.busy_mini_app_bump_unread(
  p_request_id uuid,
  p_side text
)
returns table (
  business_unread_count integer,
  customer_unread_count integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_side = 'business' then
    return query
      update public.busy_mini_app_requests
      set business_unread_count = least(coalesce(busy_mini_app_requests.business_unread_count, 0) + 1, 9999),
          updated_at = now()
      where id = p_request_id
      returning busy_mini_app_requests.business_unread_count,
                busy_mini_app_requests.customer_unread_count;
  elsif p_side = 'customer' then
    return query
      update public.busy_mini_app_requests
      set customer_unread_count = least(coalesce(busy_mini_app_requests.customer_unread_count, 0) + 1, 9999),
          updated_at = now()
      where id = p_request_id
      returning busy_mini_app_requests.business_unread_count,
                busy_mini_app_requests.customer_unread_count;
  else
    raise exception 'Unsupported Mini App unread side';
  end if;
end;
$$;

revoke all on function public.busy_mini_app_bump_unread(uuid, text)
  from public, anon, authenticated;
grant execute on function public.busy_mini_app_bump_unread(uuid, text)
  to service_role;
