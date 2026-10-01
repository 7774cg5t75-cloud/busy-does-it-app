drop policy if exists "server_only_connections" on public.busy_social_connections;
create policy "server_only_connections"
on public.busy_social_connections
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "server_only_oauth_states" on public.busy_social_oauth_states;
create policy "server_only_oauth_states"
on public.busy_social_oauth_states
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "server_only_social_posts" on public.busy_social_posts;
create policy "server_only_social_posts"
on public.busy_social_posts
for all
to anon, authenticated
using (false)
with check (false);
