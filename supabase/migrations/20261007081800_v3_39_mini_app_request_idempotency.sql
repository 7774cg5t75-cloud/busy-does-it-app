alter table public.busy_mini_app_requests
  add column if not exists idempotency_key text;
create unique index if not exists busy_mini_app_requests_idempotency_idx
  on public.busy_mini_app_requests (mini_app_id,consumer_user_id,idempotency_key)
  where idempotency_key is not null;
