create index if not exists busy_mini_app_request_messages_sender_user_idx
  on public.busy_mini_app_request_messages (sender_user_id, created_at desc)
  where sender_user_id is not null;

create policy busy_mini_app_request_messages_no_direct_client_access
  on public.busy_mini_app_request_messages
  for all
  to anon, authenticated
  using (false)
  with check (false);
