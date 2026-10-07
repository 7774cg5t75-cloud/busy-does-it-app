create index if not exists busy_mini_app_request_links_linked_by_idx
  on public.busy_mini_app_request_links (linked_by);
create index if not exists busy_mini_app_request_events_actor_user_idx
  on public.busy_mini_app_request_events (actor_user_id);

drop policy if exists deny_authenticated_mini_app_consumer_apps
  on public.busy_mini_app_consumer_apps;
create policy deny_authenticated_mini_app_consumer_apps
on public.busy_mini_app_consumer_apps
for all
to authenticated
using (false)
with check (false);

drop policy if exists deny_authenticated_mini_app_request_links
  on public.busy_mini_app_request_links;
create policy deny_authenticated_mini_app_request_links
on public.busy_mini_app_request_links
for all
to authenticated
using (false)
with check (false);

drop policy if exists deny_authenticated_mini_app_request_events
  on public.busy_mini_app_request_events;
create policy deny_authenticated_mini_app_request_events
on public.busy_mini_app_request_events
for all
to authenticated
using (false)
with check (false);
