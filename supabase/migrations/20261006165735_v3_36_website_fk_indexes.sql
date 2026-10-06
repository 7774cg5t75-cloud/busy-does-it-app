create index if not exists busy_websites_created_by_idx
  on public.busy_websites (created_by);
create index if not exists busy_websites_preview_deployment_idx
  on public.busy_websites (current_preview_deployment_id);
create index if not exists busy_websites_live_deployment_idx
  on public.busy_websites (current_live_deployment_id);

create index if not exists busy_website_deployments_created_by_idx
  on public.busy_website_deployments (created_by);

create index if not exists busy_website_domains_created_by_idx
  on public.busy_website_domains (created_by);

create index if not exists busy_website_publish_jobs_website_idx
  on public.busy_website_publish_jobs (website_id);
create index if not exists busy_website_publish_jobs_deployment_idx
  on public.busy_website_publish_jobs (deployment_id);
create index if not exists busy_website_publish_jobs_requested_by_idx
  on public.busy_website_publish_jobs (requested_by);
