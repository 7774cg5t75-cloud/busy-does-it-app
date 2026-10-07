-- V3.52 follow-up: cover composite tenant-integrity foreign keys.

create index if not exists busy_website_deployments_tenant_site_idx
  on public.busy_website_deployments (website_id, business_id);

create index if not exists busy_website_domains_tenant_site_idx
  on public.busy_website_domains (website_id, business_id);

create index if not exists busy_website_enquiry_attributions_tenant_site_idx
  on public.busy_website_enquiry_attributions (website_id, business_id);

create index if not exists busy_website_health_checks_tenant_domain_idx
  on public.busy_website_health_checks (domain_id, website_id, business_id);

create index if not exists busy_website_health_checks_tenant_site_idx
  on public.busy_website_health_checks (website_id, business_id);

create index if not exists busy_website_publish_jobs_tenant_deployment_idx
  on public.busy_website_publish_jobs (deployment_id, website_id, business_id);

create index if not exists busy_website_publish_jobs_tenant_site_idx
  on public.busy_website_publish_jobs (website_id, business_id);

create index if not exists busy_website_usage_daily_tenant_site_idx
  on public.busy_website_usage_daily (website_id, business_id);
