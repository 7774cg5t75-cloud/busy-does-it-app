-- V3.126 STAGING-ONLY disposable read isolation fixture.
-- DO NOT add to supabase/migrations/ or apply to Busy Does It or Slow Roast.
-- Only run after a NEW independent nonproduction project is identified and
-- specifically approved. The two fictional Auth users and rows are created
-- separately under controlled staging setup (not by this file).
create table if not exists public.busy_staging_rls_canary (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  marker text not null check (length(marker) between 8 and 80)
);
alter table public.busy_staging_rls_canary enable row level security;
alter table public.busy_staging_rls_canary force row level security;
revoke all on public.busy_staging_rls_canary from public, anon, authenticated;
grant select on public.busy_staging_rls_canary to authenticated;
drop policy if exists busy_staging_canary_owner_read on public.busy_staging_rls_canary;
create policy busy_staging_canary_owner_read
 on public.busy_staging_rls_canary for select to authenticated
 using ((select auth.uid()) = owner_id);
-- No INSERT/UPDATE/DELETE grants or policies for clients.
-- Staging operator must seed two rows with independently authorized admin SQL,
-- then delete the rows, users and table after the test.
