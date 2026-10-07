create index if not exists busy_mini_apps_created_by_idx
  on public.busy_mini_apps (created_by);

create index if not exists busy_mini_app_requests_module_key_idx
  on public.busy_mini_app_requests (module_key);

create policy deny_client_mini_app_module_catalog
on public.busy_mini_app_module_catalog
for all to anon, authenticated
using (false)
with check (false);

create policy deny_client_mini_apps
on public.busy_mini_apps
for all to anon, authenticated
using (false)
with check (false);

create policy deny_client_mini_app_versions
on public.busy_mini_app_versions
for all to anon, authenticated
using (false)
with check (false);

create policy deny_client_mini_app_requests
on public.busy_mini_app_requests
for all to anon, authenticated
using (false)
with check (false);
