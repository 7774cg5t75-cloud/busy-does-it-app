-- V3.78 private, business-scoped website lead follow-up foundations.
-- No publicly callable form and NO automatic customer-contact action.
create table if not exists public.busy_website_leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.busy_businesses(id) on delete cascade,
  website_id uuid references public.busy_websites(id) on delete set null,
  request_key text not null check (length(request_key) between 8 and 160),
  name text not null check (length(name) between 1 and 120),
  contact_method text not null check (contact_method in ('email','phone')),
  contact_value text not null check (length(contact_value) between 3 and 180),
  service_requested text not null default '' check (length(service_requested)<=160),
  notes text not null default '' check (length(notes)<=1200),
  source text not null default 'owner_entered'
    check (source='owner_entered'),
  contact_permission_confirmed boolean not null check (contact_permission_confirmed),
  status text not null default 'new'
    check (status in ('new','reviewing','quoted','booked','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null,
  unique(business_id,request_key)
);
create index if not exists busy_website_leads_business_recent_idx
  on public.busy_website_leads(business_id,created_at desc);
alter table public.busy_website_leads enable row level security;
revoke all on public.busy_website_leads from public, anon, authenticated;
grant select,insert,update on public.busy_website_leads to service_role;

-- Business membership checks are enforced by busy-website-publish before
-- any service-role query. Direct Data API access is intentionally denied.
