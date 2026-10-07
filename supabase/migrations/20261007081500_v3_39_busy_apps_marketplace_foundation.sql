create table if not exists public.busy_mini_app_module_catalog (
  module_key text primary key,
  title text not null,
  description text not null default '',
  status text not null default 'available'
    check (status in ('available','planned','disabled')),
  module_version integer not null default 1 check (module_version >= 1),
  capabilities jsonb not null default '{}'::jsonb,
  default_enabled boolean not null default false,
  sort_order integer not null default 100,
  updated_at timestamptz not null default now()
);

create table if not exists public.busy_mini_apps (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  app_key text not null default 'main',
  public_slug text not null unique,
  display_name text not null default '',
  category text not null default '',
  tagline text not null default '',
  status text not null default 'draft'
    check (status in ('draft','preview_ready','live','update_pending','disabled','failed')),
  discoverable boolean not null default false,
  draft_revision bigint not null default 1 check (draft_revision >= 1),
  draft_profile_revision bigint not null default 0 check (draft_profile_revision >= 0),
  draft_config jsonb not null default '{}'::jsonb,
  next_version bigint not null default 1 check (next_version >= 1),
  current_preview_version_id uuid,
  current_live_version_id uuid,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_document tsvector generated always as (
    to_tsvector('simple',
      coalesce(display_name, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(tagline, '')
    )
  ) stored,
  unique (business_id, app_key)
);

create table if not exists public.busy_mini_app_versions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  version_no bigint not null,
  source_profile_revision bigint not null default 0 check (source_profile_revision >= 0),
  source_draft_revision bigint not null default 1 check (source_draft_revision >= 1),
  config jsonb not null default '{}'::jsonb,
  state text not null default 'preview_ready'
    check (state in ('preview_ready','live','superseded','failed')),
  change_label text not null default 'Mini App update',
  change_summary jsonb not null default '{"items":[],"counts":{}}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  prepared_at timestamptz not null default now(),
  published_at timestamptz,
  unique (mini_app_id, version_no)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'busy_mini_apps_preview_version_fkey') then
    alter table public.busy_mini_apps
      add constraint busy_mini_apps_preview_version_fkey
      foreign key (current_preview_version_id)
      references public.busy_mini_app_versions(id)
      on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'busy_mini_apps_live_version_fkey') then
    alter table public.busy_mini_apps
      add constraint busy_mini_apps_live_version_fkey
      foreign key (current_live_version_id)
      references public.busy_mini_app_versions(id)
      on delete set null;
  end if;
end
$$;

create table if not exists public.busy_mini_app_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  mini_app_id uuid not null references public.busy_mini_apps(id) on delete cascade,
  version_id uuid references public.busy_mini_app_versions(id) on delete set null,
  consumer_user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null references public.busy_mini_app_module_catalog(module_key),
  request_type text not null check (request_type in ('booking_request','enquiry')),
  status text not null default 'received'
    check (status in ('received','reviewing','accepted','declined','closed')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.busy_mini_app_module_catalog
(module_key,title,description,status,module_version,capabilities,default_enabled,sort_order)
values
  ('business_profile','Business profile','Public business identity, service area and approved contact details.','available',1,'{"public_read":true,"source":"public_business_profile"}',true,10),
  ('services','Services','Browse the business services from the shared approved public profile.','available',1,'{"public_read":true,"source":"public_business_profile.services"}',true,20),
  ('gallery','Gallery','Approved public business imagery only.','available',1,'{"public_read":true,"source":"public_business_profile.assets.gallery"}',true,30),
  ('contact','Contact','Approved phone/email/contact information from the public profile.','available',1,'{"public_read":true,"source":"public_business_profile.contact"}',true,40),
  ('enquiry','Enquiry','Submit a structured enquiry through BUSY.','available',1,'{"customer_action":true,"request_type":"enquiry"}',true,50),
  ('booking_request','Booking request','Request a service/date through BUSY without silently creating a confirmed booking.','available',1,'{"customer_action":true,"request_type":"booking_request","confirmation_required_by_business":true}',true,60),
  ('offers','Offers','Display approved offers when the business explicitly creates them.','available',1,'{"public_read":true,"requires_approved_offer_data":true}',false,70),
  ('loyalty','Loyalty','Future reusable loyalty module.','planned',1,'{"future":true}',false,80),
  ('payments','Payments','Future payment module; no payment collection is implemented in V3.39.','planned',1,'{"future":true}',false,90)
on conflict (module_key)
do update set
  title=excluded.title,
  description=excluded.description,
  status=excluded.status,
  module_version=excluded.module_version,
  capabilities=excluded.capabilities,
  default_enabled=excluded.default_enabled,
  sort_order=excluded.sort_order,
  updated_at=now();

create index if not exists busy_mini_apps_business_status_idx on public.busy_mini_apps (business_id,status);
create index if not exists busy_mini_apps_directory_idx on public.busy_mini_apps (discoverable,status,lower(display_name));
create index if not exists busy_mini_apps_search_idx on public.busy_mini_apps using gin (search_document);
create index if not exists busy_mini_apps_preview_version_idx on public.busy_mini_apps (current_preview_version_id);
create index if not exists busy_mini_apps_live_version_idx on public.busy_mini_apps (current_live_version_id);
create index if not exists busy_mini_app_versions_business_idx on public.busy_mini_app_versions (business_id,created_at desc);
create index if not exists busy_mini_app_versions_app_state_idx on public.busy_mini_app_versions (mini_app_id,state,version_no desc);
create index if not exists busy_mini_app_versions_created_by_idx on public.busy_mini_app_versions (created_by);
create index if not exists busy_mini_app_requests_business_status_idx on public.busy_mini_app_requests (business_id,status,created_at desc);
create index if not exists busy_mini_app_requests_consumer_idx on public.busy_mini_app_requests (consumer_user_id,created_at desc);
create index if not exists busy_mini_app_requests_app_idx on public.busy_mini_app_requests (mini_app_id,created_at desc);
create index if not exists busy_mini_app_requests_version_idx on public.busy_mini_app_requests (version_id);

alter table public.busy_mini_app_module_catalog enable row level security;
alter table public.busy_mini_apps enable row level security;
alter table public.busy_mini_app_versions enable row level security;
alter table public.busy_mini_app_requests enable row level security;

revoke all on public.busy_mini_app_module_catalog from anon,authenticated;
revoke all on public.busy_mini_apps from anon,authenticated;
revoke all on public.busy_mini_app_versions from anon,authenticated;
revoke all on public.busy_mini_app_requests from anon,authenticated;
grant select,insert,update,delete on public.busy_mini_app_module_catalog to service_role;
grant select,insert,update,delete on public.busy_mini_apps to service_role;
grant select,insert,update,delete on public.busy_mini_app_versions to service_role;
grant select,insert,update,delete on public.busy_mini_app_requests to service_role;

create or replace function public.busy_allocate_mini_app_version(p_mini_app_id uuid)
returns bigint language plpgsql security definer set search_path=''
as $$
declare v_next bigint;
begin
  update public.busy_mini_apps
  set next_version=next_version+1, updated_at=now()
  where id=p_mini_app_id
  returning next_version-1 into v_next;
  if v_next is null then raise exception 'Mini App not found'; end if;
  return v_next;
end;
$$;

revoke all on function public.busy_allocate_mini_app_version(uuid) from public,anon,authenticated;
grant execute on function public.busy_allocate_mini_app_version(uuid) to service_role;

create or replace function public.busy_guard_mini_app_version_immutable()
returns trigger language plpgsql set search_path='public','pg_temp'
as $$
begin
  if new.business_id is distinct from old.business_id
     or new.mini_app_id is distinct from old.mini_app_id
     or new.version_no is distinct from old.version_no
     or new.source_profile_revision is distinct from old.source_profile_revision
     or new.source_draft_revision is distinct from old.source_draft_revision
     or new.config is distinct from old.config
     or new.change_label is distinct from old.change_label
     or new.change_summary is distinct from old.change_summary
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.prepared_at is distinct from old.prepared_at then
    raise exception 'Mini App version source/configuration fields are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists busy_mini_app_versions_immutable on public.busy_mini_app_versions;
create trigger busy_mini_app_versions_immutable
before update on public.busy_mini_app_versions
for each row execute function public.busy_guard_mini_app_version_immutable();

comment on table public.busy_mini_app_module_catalog is 'Platform-owned reusable Mini App modules. Business apps assemble these tested modules rather than arbitrary custom code.';
comment on table public.busy_mini_apps is 'One tenant-owned BUSY Mini App configuration stream; draft state is mutable, prepared/live versions are immutable.';
comment on table public.busy_mini_app_versions is 'Immutable prepared/live BUSY Mini App configurations linked to approved public business profile revisions.';
comment on table public.busy_mini_app_requests is 'Server-mediated customer enquiry/booking requests created through live discoverable BUSY Mini Apps.';
