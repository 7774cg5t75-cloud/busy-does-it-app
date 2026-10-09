-- V3.76 periodic privacy retention: prune only sanitized, historic evidence
-- snapshots. No customer records, provider calls or external services touched.
-- The scheduled monitor's existing 15-minute cadence remains unchanged.
select cron.schedule('busy-v376-evidence-retention','17 * * * *',
  $$delete from public.busy_platform_evidence_snapshots
      where window_start < now() - interval '30 days'$$);
