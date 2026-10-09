-- V3.82 optional read-only provider API observations.
-- No tokens stored in this table or sent to clients; account owners must
-- authorise limited provider credentials in Supabase secure server secrets.
alter table public.busy_founder_service_snapshots
 drop constraint busy_founder_service_snapshots_source_check;
alter table public.busy_founder_service_snapshots
 add constraint busy_founder_service_snapshots_source_check
 check(source in ('founder_entered','verified_log_sample','provider_api_readonly'));
alter table public.busy_founder_service_snapshots
 drop constraint busy_founder_snapshots_creator_check;
alter table public.busy_founder_service_snapshots
 add constraint busy_founder_snapshots_creator_check
 check((source='founder_entered' and recorded_by is not null)
    or (source in ('verified_log_sample','provider_api_readonly') and recorded_by is null));
