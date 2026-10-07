-- V3.45 capability marker: do not imply older V3.44 static artifacts already contain guest forms.

alter table public.busy_mini_apps
  add column if not exists public_web_schema_version smallint not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'busy_mini_apps_public_web_schema_version_check'
  ) then
    alter table public.busy_mini_apps
      add constraint busy_mini_apps_public_web_schema_version_check
      check (public_web_schema_version between 1 and 100);
  end if;
end
$$;

comment on column public.busy_mini_apps.public_web_schema_version is
  'Renderer capability version for the currently published static Mini App web artifact. V3.45 guest forms require schema version 2+.';
