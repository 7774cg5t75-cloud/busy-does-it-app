-- Busy Does It early-interest retention operations — REVIEW ONLY.
-- For a PRIVILEGED server operator in the isolated marketing database.
-- Do NOT expose any operation here via the public Supabase Data API.
--
-- Requirement: schedule the deletion statement to run daily before production
-- form activation, verify with fictional records and monitoring, and retain evidence
-- of success/failure without logging applicants' email addresses.
--
-- Dry-run: show only aggregate counts, never personal data.
select
  count(*) filter (where status='pending') as pending_total,
  count(*) filter (
    where status='pending'
      and updated_at < now() - interval '7 days'
  ) as pending_due_for_deletion
from public.busy_marketing_waitlist;

-- Planned daily cleanup: run only after approved retention schedule is configured.
-- delete from public.busy_marketing_waitlist
-- where status='pending'
--   and updated_at < now() - interval '7 days';
--
-- Confirmed records: retain only for expressly consented launch notification;
-- add owner-controlled deletion / withdrawal and suppression operations before
-- marketing send. Never delete an unsubscribed suppression marker blindly if it
-- would permit an unwanted re-enrolment; apply a minimised suppression policy.
