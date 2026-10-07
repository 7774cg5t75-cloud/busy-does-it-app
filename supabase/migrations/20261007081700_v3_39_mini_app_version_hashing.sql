alter table public.busy_mini_app_versions add column if not exists config_hash text;
update public.busy_mini_app_versions
set config_hash=encode(digest(config::text,'sha256'),'hex')
where config_hash is null;
alter table public.busy_mini_app_versions alter column config_hash set not null;
create unique index if not exists busy_mini_app_versions_config_hash_idx
  on public.busy_mini_app_versions (mini_app_id,config_hash);

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
     or new.config_hash is distinct from old.config_hash
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
