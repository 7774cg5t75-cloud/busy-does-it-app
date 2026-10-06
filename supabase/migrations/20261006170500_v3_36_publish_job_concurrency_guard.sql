create unique index if not exists busy_website_publish_jobs_one_active_action_idx
  on public.busy_website_publish_jobs (deployment_id, action)
  where status in ('queued','processing','retry_wait');
