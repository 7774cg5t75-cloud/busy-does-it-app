-- V3.137 private website-original storage. Apply in isolated staging first.
-- The service gateway checks Supabase Auth + business membership on every call.
-- NO direct anonymous/authenticated object reads or writes are granted.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('busy-website-originals','busy-website-originals',false,9437184,
 array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.busy_website_original_media (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.busy_businesses(id) on delete cascade,
 uploaded_by uuid not null references auth.users(id) on delete cascade,
 storage_path text not null unique,
 content_type text not null check (content_type in ('image/jpeg','image/png','image/webp')),
 byte_length integer not null check (byte_length between 20 and 9437184),
 sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 unique (business_id,uploaded_by,sha256)
);
create index if not exists busy_website_original_media_business
 on public.busy_website_original_media(business_id);

create table if not exists public.busy_website_original_media_audit (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.busy_businesses(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 storage_path text not null,
 action text not null check (action in ('upload','download')),
 byte_length integer not null check (byte_length between 1 and 9437184),
 created_at timestamptz not null default now()
);
create index if not exists busy_website_original_media_audit_rate
 on public.busy_website_original_media_audit(business_id,user_id,action,created_at desc);

alter table public.busy_website_original_media enable row level security;
alter table public.busy_website_original_media_audit enable row level security;
revoke all on public.busy_website_original_media from anon,authenticated;
revoke all on public.busy_website_original_media_audit from anon,authenticated;
grant all on public.busy_website_original_media to service_role;
grant all on public.busy_website_original_media_audit to service_role;
-- Do not create permissive storage.objects policies for this bucket.
-- Production deployment is a separate explicit, reviewed operation.
