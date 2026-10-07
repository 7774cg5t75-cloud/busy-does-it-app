alter table public.busy_website_health_checks
  drop constraint if exists busy_website_health_checks_target_type_check;

alter table public.busy_website_health_checks
  add constraint busy_website_health_checks_target_type_check
  check (target_type in ('live_alias','default_domain','custom_domain'));
