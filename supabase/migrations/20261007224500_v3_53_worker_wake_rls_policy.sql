-- V3.53 follow-up: explicit deny policy for internal worker-wake state.

drop policy if exists busy_website_worker_wake_state_deny_authenticated
  on public.busy_website_worker_wake_state;

create policy busy_website_worker_wake_state_deny_authenticated
  on public.busy_website_worker_wake_state
  for all
  to authenticated
  using (false)
  with check (false);
