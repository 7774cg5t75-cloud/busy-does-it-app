create policy busy_mini_app_entry_events_no_direct_client_access
  on public.busy_mini_app_entry_events
  for all
  to anon, authenticated
  using (false)
  with check (false);
