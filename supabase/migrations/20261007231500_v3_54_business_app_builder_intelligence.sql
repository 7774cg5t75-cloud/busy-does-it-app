-- V3.54: app-builder intelligence metadata and real approved-offer capability.

update public.busy_mini_app_module_catalog
set
  description = 'Display approved offers supplied by the business owner. BUSY never invents discounts or terms.',
  module_version = greatest(module_version, 2),
  capabilities = jsonb_build_object(
    'public_read', true,
    'requires_approved_offer_data', true,
    'builder_plan_supported', true,
    'max_offers', 4
  ),
  updated_at = now()
where module_key = 'offers';

update public.busy_mini_app_module_catalog
set
  capabilities = coalesce(capabilities, '{}'::jsonb) ||
    jsonb_build_object('builder_plan_supported', true),
  updated_at = now()
where module_key in (
  'business_profile',
  'services',
  'gallery',
  'contact',
  'enquiry',
  'booking_request'
);

comment on table public.busy_mini_app_module_catalog is
  'Controlled reusable BUSY Business App modules. V3.54 planning may only enable catalogue modules marked available.';
