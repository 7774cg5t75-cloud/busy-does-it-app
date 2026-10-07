-- V3.45 guest challenge FK query coverage.
-- guest_challenge_id on the durable request intentionally has no FK because
-- ephemeral challenge rows are pruned after expiry while the business request remains.

create index if not exists busy_mini_app_guest_challenges_business_idx
  on public.busy_mini_app_guest_challenges (business_id, created_at desc);

create index if not exists busy_mini_app_guest_challenges_version_idx
  on public.busy_mini_app_guest_challenges (version_id);
