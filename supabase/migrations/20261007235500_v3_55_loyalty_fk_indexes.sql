-- V3.55 follow-up: cover every new loyalty foreign key for production scale.

create index if not exists busy_mini_app_loyalty_progress_tenant_app_idx
  on public.busy_mini_app_loyalty_progress (mini_app_id, business_id);

create index if not exists busy_mini_app_loyalty_events_tenant_app_idx
  on public.busy_mini_app_loyalty_events (mini_app_id, business_id);

create index if not exists busy_mini_app_loyalty_events_tenant_request_idx
  on public.busy_mini_app_loyalty_events (request_id, business_id, mini_app_id);

create index if not exists busy_mini_app_loyalty_events_awarded_by_idx
  on public.busy_mini_app_loyalty_events (awarded_by);
