-- V3.44 Public Mini App Web Experience: immutable web artifacts, live alias state and funnel counters.

alter table public.busy_mini_apps
  add column if not exists public_web_url text,
  add column if not exists public_web_version_id uuid,
  add column if not exists public_web_status text not null default 'not_ready',
  add column if not exists public_web_updated_at timestamptz,
  add column if not exists public_web_last_error text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'busy_mini_apps_public_web_version_fkey'
  ) then
    alter table public.busy_mini_apps
      add constraint busy_mini_apps_public_web_version_fkey
      foreign key (public_web_version_id)
      references public.busy_mini_app_versions(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'busy_mini_apps_public_web_status_check'
  ) then
    alter table public.busy_mini_apps
      add constraint busy_mini_apps_public_web_status_check
      check (public_web_status in ('not_ready','ready','error'));
  end if;
end
$$;

alter table public.busy_mini_app_versions
  add column if not exists public_web_storage_path text,
  add column if not exists public_web_artifact_bytes bigint not null default 0,
  add column if not exists public_web_published_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'busy_mini_app_versions_public_web_artifact_bytes_check'
  ) then
    alter table public.busy_mini_app_versions
      add constraint busy_mini_app_versions_public_web_artifact_bytes_check
      check (public_web_artifact_bytes >= 0);
  end if;
end
$$;

create index if not exists busy_mini_apps_public_web_version_idx
  on public.busy_mini_apps (public_web_version_id);

alter table public.busy_mini_app_entry_daily
  drop constraint if exists busy_mini_app_entry_daily_source_check;
alter table public.busy_mini_app_entry_daily
  add constraint busy_mini_app_entry_daily_source_check
  check (source in ('qr','share','web','deep_link','marketplace','my_apps','notification','owner_test','unknown'));

alter table public.busy_mini_app_entry_daily
  drop constraint if exists busy_mini_app_entry_daily_stage_check;
alter table public.busy_mini_app_entry_daily
  add constraint busy_mini_app_entry_daily_stage_check
  check (stage in ('landing','web_view','action_intent','app_open'));

create or replace function public.busy_mini_app_record_entry(
  p_business_id uuid,
  p_mini_app_id uuid,
  p_source text,
  p_stage text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source not in ('qr','share','web','deep_link','marketplace','my_apps','notification','owner_test','unknown') then
    raise exception 'Unsupported Mini App entry source';
  end if;
  if p_stage not in ('landing','web_view','action_intent','app_open') then
    raise exception 'Unsupported Mini App entry stage';
  end if;

  insert into public.busy_mini_app_entry_daily (
    business_id,
    mini_app_id,
    event_date,
    source,
    stage,
    event_count,
    updated_at
  )
  values (
    p_business_id,
    p_mini_app_id,
    current_date,
    p_source,
    p_stage,
    1,
    now()
  )
  on conflict (mini_app_id, event_date, source, stage)
  do update
    set event_count = public.busy_mini_app_entry_daily.event_count + 1,
        updated_at = now();
end;
$$;

revoke all on function public.busy_mini_app_record_entry(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.busy_mini_app_record_entry(uuid, uuid, text, text)
  to service_role;

comment on column public.busy_mini_apps.public_web_url is
  'Stable public Storage live-alias URL for the current immutable Mini App web artifact.';
comment on column public.busy_mini_app_versions.public_web_storage_path is
  'Immutable versioned Storage path for the public web representation of this Mini App version.';
