# V3.70 — BUSY Platform Autopilot 1.0

## North star
A BUSY DOES IT subscription business customers love paying a future **£50/month** for, which requires progressively less owner intervention. V3.70 establishes **actual unattended technical incident detection** without sacrificing customer authorisation, privacy or cost controls.

## Implemented and deployed

- A **database-native Supabase pg_cron task** named `busy-v370-platform-incidents` checks every **15 minutes** even if the iPhone and app are off. It uses local database SQL only; no outbound API calls, webhooks, additional vendor accounts or secrets.
- The scanner reads **four aggregate signals** from existing database records:
  1. Website publishing jobs explicitly marked `failed`.
  2. Website processing jobs whose **lease has expired by over five minutes** (stalled processing), not mere queued jobs.
  3. Social posts in `Failed` or `Partial failure` status, including historical failures.
  4. Business Apps with `failed` status.
- **Durable incident lifecycle:** records are deduplicated by signal type and updated with affected count, last observed time, and repeat/transition totals. Two consecutive healthy scans resolve a previously open record, preventing flapping on one transient green result. A failed or unavailable source **never clears** an incident.
- **Durable scan history:** timestamps, per-source coverage (`checked` / `unavailable`), and overall scan status (`complete` / `partial`). The database automatically keeps scan records 30 days and resolved incidents 90 days.
- **Founder-only incident reporting:** V3.69 `busy-founder-ops` Edge Function extended to retrieve at most 12 recent aggregate incidents plus the last scan, **only after a fresh Auth server check that `app_metadata.busy_platform_role === 'founder'`**. Returns whitelisted titles, keys, counts and timestamps. No business names, customer records, emails, user IDs, device tokens or detailed incident contents.
- **In-app dashboard** now shows monitoring freshness, scan-source coverage, priority and open incident counts, recent resolutions, and missing activation gates. A scan older than 45 minutes is flagged as stale.
- **No data leaks:** direct `anon` and `authenticated` SQL access to incidents, scan records and the monitor function is revoked; both tables have RLS enabled. The Edge Function uses its private service key only on the server.
- **Verification:** Supabase migration applied and active cron task inspected. An initial real database scan completed with all four sources checked. SQL transaction tests confirmed creation, deduplication, two-clean-scan resolution and reopening with all test changes rolled back. Database privilege checks confirmed regular authenticated users cannot access the protected records or invoke the scanner. `scripts/check-platform-autopilot.mjs` tests stale/partial statuses, sanitisation, non-founder responses, incident counts, retention and cron scheduling.

## Clear boundaries (no misrepresentation)

- This is **unattended detection and logging**, not automatically delivered push/email alerts. Founder notification delivery is not enabled because **there are currently no registered founder push devices**, and neither a verified email-delivery route nor rate-limited alert receipts have been configured. The UI explicitly states this; it never claims a notification was delivered.
- This sweep performs **no external or destructive recovery**. Retries of reads in V3.68 remain bounded and owner scoped; the platform scanner does not resend social posts, alter websites, change jobs, restore backups, reauthenticate external accounts or charge customers.
- Failed records can reflect **past unresolved activity**, not a current complete outage. A healthy scan does not prove Internet-wide uptime. We do not infer customer SLA coverage or public URL reachability.
- The existing authenticated founder account remains enabled, but real-device checks are still required for the new incident display.
- The dashboard still cannot claim real paying subscribers, MRR, invoices, AI spend or profit without authoritative billing and provider cost ledgers.

## Device/production acceptance

- [ ] Open latest V3.70 Expo Snack preview and sign in with the same founder account.
- [ ] Open Settings → Production Bridge → Founder Operations, confirm the Autopilot section shows a recent 15-minute scan, four sources checked and genuine incident counts, not customer details.
- [ ] Confirm ordinary account / revoked founder role receives 403 for aggregate API.
- [ ] Verify cron job executes unattended at the next 15-minute boundary and `busy_platform_monitor_runs` advances without an app session.
- [ ] Simulate a job failure and remediation only in an **isolated QA fixture**; never publish/resend production content as a test.
- [ ] Provision a verified founder notification delivery destination, plus strict 24-hour per-class cooldown, grouped alert digest, provider receipts and user-controlled quiet hours **before enabling delivery**.
- [ ] Add idempotent, explicitly authorised safe recovery for specific job classes only after rollback and duplicate-action testing.
- [ ] Add audited cost observations, backend cost budgets and fair-use policies after invoice sources are integrated.

## Architecture

`pg_cron` → `busy_platform_internal.run_monitor()` → `public.busy_platform_monitor_runs` + `public.busy_platform_incidents` (RLS deny direct customer reads) → authenticated `busy-founder-ops` → founder-only mobile dashboard.

- SQL: `supabase/migrations/20261009010000_v3_70_platform_autopilot.sql`
- Sanitiser: `supabase/functions/busy-founder-ops/incidentReport.mjs`
- Endpoint: `supabase/functions/busy-founder-ops/index.ts`
- UI: `src/screens/founderOperations.js`
- Tests: `scripts/check-platform-autopilot.mjs`, `scripts/check-founder-operations.mjs`
