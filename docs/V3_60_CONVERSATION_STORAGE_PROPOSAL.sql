-- V3.60 proposed cloud conversation checkpoints; NOT deployed by this commit.
-- Private to the authenticated account that created the business.
create table if not exists public.busy_business_conversations (
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  brief text not null default '' check (char_length(brief) <= 6000),
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index if not exists busy_business_conversations_user_idx
  on public.busy_business_conversations (user_id, updated_at desc);
alter table public.busy_business_conversations enable row level security;
revoke all on public.busy_business_conversations from anon, authenticated;
grant select, insert, update, delete on public.busy_business_conversations to authenticated;
-- No security definer function and no membership-recursive RLS lookup.
-- Restrict to actual creator; other members need a separately reviewed sharing design.
create policy busy_conversations_owner_select
 on public.busy_business_conversations for select to authenticated
 using (user_id = (select auth.uid()) and exists (
   select 1 from public.busy_businesses b where b.id = business_id and b.created_by = (select auth.uid())
 ));
create policy busy_conversations_owner_insert
 on public.busy_business_conversations for insert to authenticated
 with check (user_id = (select auth.uid()) and exists (
   select 1 from public.busy_businesses b where b.id = business_id and b.created_by = (select auth.uid())
 ));
create policy busy_conversations_owner_update
 on public.busy_business_conversations for update to authenticated
 using (user_id = (select auth.uid()) and exists (
   select 1 from public.busy_businesses b where b.id = business_id and b.created_by = (select auth.uid())
 ))
 with check (user_id = (select auth.uid()) and exists (
   select 1 from public.busy_businesses b where b.id = business_id and b.created_by = (select auth.uid())
 ));
create policy busy_conversations_owner_delete
 on public.busy_business_conversations for delete to authenticated
 using (user_id = (select auth.uid()) and exists (
   select 1 from public.busy_businesses b where b.id = business_id and b.created_by = (select auth.uid())
 ));
comment on table public.busy_business_conversations is
 'V3.60 private per-creator business conversation checkpoint; never public, never approved business facts. Requires owner review before production deployment.';
