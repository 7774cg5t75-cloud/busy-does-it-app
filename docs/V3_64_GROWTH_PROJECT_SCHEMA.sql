-- V3.64: owner-private growth project checkpoints.
-- The deployed table is metadata + draft text only, never publishing authorisation.
create table if not exists public.busy_growth_projects (
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  service_key text not null check (char_length(service_key) between 1 and 120),
  service_name text not null check (char_length(service_name) between 1 and 120),
  draft_data jsonb not null check (
    jsonb_typeof(draft_data) = 'object' and pg_column_size(draft_data) <= 12000
  ),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, user_id, service_key)
);
create index if not exists busy_growth_projects_owner_recents
 on public.busy_growth_projects (user_id, updated_at desc);
alter table public.busy_growth_projects enable row level security;
revoke all on public.busy_growth_projects from anon, authenticated;
grant select, insert, update on public.busy_growth_projects to authenticated;
-- No anonymous access. Only the actual creator of this business may use private drafts.
create policy busy_growth_creator_select on public.busy_growth_projects
 for select to authenticated
 using (user_id=(select auth.uid()) and exists (
   select 1 from public.busy_businesses b
   where b.id=business_id and b.created_by=(select auth.uid())
 ));
create policy busy_growth_creator_insert on public.busy_growth_projects
 for insert to authenticated
 with check (user_id=(select auth.uid()) and exists (
   select 1 from public.busy_businesses b
   where b.id=business_id and b.created_by=(select auth.uid())
 ));
create policy busy_growth_creator_update on public.busy_growth_projects
 for update to authenticated
 using (user_id=(select auth.uid()) and exists (
   select 1 from public.busy_businesses b
   where b.id=business_id and b.created_by=(select auth.uid())
 ))
 with check (user_id=(select auth.uid()) and exists (
   select 1 from public.busy_businesses b
   where b.id=business_id and b.created_by=(select auth.uid())
 ));
comment on table public.busy_growth_projects is
 'V3.64 private coordinated draft and review checkpoints; not published state or provider confirmation.';
