-- PREPARED ONLY. Generate a migration with the Supabase CLI and rehearse in
-- isolated staging before rollout. No live installation is authorised here.
create table public.busy_business_content (
 business_id uuid not null references public.busy_businesses(id) on delete cascade,
 id text not null check (id ~ '^[a-zA-Z0-9_-]{12,80}$'),
 kind text not null check (kind in ('product','event')),
 revision bigint not null check (revision between 1 and 9007199254740991),
 draft jsonb not null check (jsonb_typeof(draft)='object' and octet_length(draft::text)<=16000),
 published jsonb check (published is null or jsonb_typeof(published)='object' and octet_length(published::text)<=16000),
 published_revision bigint,
 history jsonb not null default '[]'::jsonb check (jsonb_typeof(history)='array' and jsonb_array_length(history)<=8 and octet_length(history::text)<=128000),
 can_undo boolean generated always as (jsonb_array_length(history)>0) stored,
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now(),
 primary key(business_id,id),
 check ((published is null and published_revision is null) or (published is not null and published_revision is not null and published_revision between 1 and revision))
);
create index busy_business_content_kind on public.busy_business_content(business_id,kind,id);
alter table public.busy_business_content enable row level security;
-- Trusted Edge only; all membership checks are reused from existing routes.
-- No direct anon/authenticated read of private drafts/history, even with RLS.
revoke all on public.busy_business_content from public,anon,authenticated;
grant select,insert,update,delete on public.busy_business_content to service_role;
-- Bound initial catalogues consistently with the public/owner read contract.
-- Serialize concurrent creates for one business; this never elevates privileges.
create function public.busy_content_bound_insert() returns trigger
language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.business_id::text,11));
 if (select count(*) from public.busy_business_content where business_id=new.business_id)>=200 then
  raise exception 'This business catalogue has reached its 200-record capacity';
 end if;
 return new;
end $$;
revoke all on function public.busy_content_bound_insert() from public,anon,authenticated;
grant execute on function public.busy_content_bound_insert() to service_role;
create trigger busy_content_bound before insert on public.busy_business_content
for each row execute function public.busy_content_bound_insert();
