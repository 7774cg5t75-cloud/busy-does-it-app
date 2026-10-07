create table if not exists public.busy_mini_app_request_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  request_id uuid not null references public.busy_mini_app_requests(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('business','customer')),
  body text not null check (char_length(body) between 1 and 3000),
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique (request_id, sender_user_id, idempotency_key)
);

create index if not exists busy_mini_app_request_messages_request_idx
  on public.busy_mini_app_request_messages (request_id, created_at asc);
create index if not exists busy_mini_app_request_messages_business_idx
  on public.busy_mini_app_request_messages (business_id, created_at desc);
create index if not exists busy_mini_app_request_messages_app_idx
  on public.busy_mini_app_request_messages (mini_app_id, created_at desc);

alter table public.busy_mini_app_request_messages enable row level security;
revoke all on public.busy_mini_app_request_messages from anon, authenticated;
grant select, insert, update, delete on public.busy_mini_app_request_messages to service_role;

comment on table public.busy_mini_app_request_messages is
  'Private server-mediated conversation messages attached to a signed-in customer Mini App request.';
