-- V3.117: extend V3.115 restricted feedback to explicit owner-reported outcomes.
-- Safe development migration; never deploy or change live data automatically.
-- Outcome is a customer's statement about a design, NOT business analytics.
alter table if exists public.busy_website_design_feedback
  drop constraint if exists busy_website_design_feedback_preference_check;
alter table if exists public.busy_website_design_feedback
  add constraint busy_website_design_feedback_preference_check
  check(preference in ('liked','rejected','kept','reverted'));
-- Preserve business isolation, RLS, service-role-only access and no aggregation.
-- No website content, photos, traffic, billing, private contacts or IP addresses.
