-- V3.79 visitor forms are anonymous: no owner user is impersonated.
-- Owner-entered rows must still retain an authenticated creator.
alter table public.busy_website_leads
  alter column created_by drop not null;
alter table public.busy_website_leads
  add constraint busy_website_leads_source_creator_check
  check ((source='owner_entered' and created_by is not null) or
         (source='website_form' and created_by is null and website_id is not null));
-- Keep all existing rows; no migration to public intake or automatic form enablement.
