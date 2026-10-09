# BUSY DOES IT V3.74 — Safe Recovery Rechecks and Private Audit

**Status:** Development branch `v3.74`. Not production release. No new unattended customer-content mutations.

## What was built
- A real database-backed **recovery assessment trail**, keyed by aggregate incident class and transition. A trigger runs automatically on every existing 15-minute background monitor scan. The audit contains only whitelisted incident type, transition, class-level count, clear-check count, assessment, timestamp and scan provenance. It never stores a customer's email, website address, account, post or other personal data.
- Recorded review states:
  - `requires_review`: a verified category still has recorded failed/stalled work.
  - `confirming_clear`: the first checked, clean database observation occurred; no false resolution yet.
  - `signal_cleared`: the existing incident monitor observed two clean checked scans and recorded the aggregate signal as resolved.
  - `unverified`: incomplete scanning, missing coverage or conflicting evidence. Unknown never implies recovery.
- The private recovery ledger has RLS enabled, no public/anon/authenticated table privileges, service role SELECT only and a private security-definer trigger. The old incident-monitor scheduler was left intact.
- A separate **external replay decision helper** refuses every real website, social post or Business App publication retry. Provider-accepted work is a no-duplicate signal; missing receipts require investigation; confirmed failed work still needs explicit approval plus later idempotency/provider checks. `canRetry` is always `false`.
- The founder-only Supabase reporting function now reads up to 12 grouped recovery audit entries after fresh Auth authorisation. Sanitised results are visible in a new V3.74 Founder Operations card with counts and monitoring verification.
- V3.74 regression tests added to the GitHub production workflow, alongside all V3.69–V3.73 tests.
- App/package configuration versioned 3.74.0.

## Verified
- Supabase migration `v3_74_recovery_review_audit` applied.
- Checked table exists, trigger enabled, authenticated clients lack SELECT/UPDATE, service role has SELECT.
- Transactional fixture tests passed for `requires_review` → first-clean `confirming_clear` → second-clean `signal_cleared`; fixture rolled back.
- Existing live monitor was executed safely and returned complete coverage of all four aggregate categories.
- Edge Function `busy-founder-ops` deployed as ACTIVE version 8 with JWT verification.

## Do NOT overstate
This is **self-maintaining incident evidence**, not automatic recovery of public websites, social posts or Business Apps. Old failed database rows may be historical; the true provider state must be checked against authenticated provider receipts before attempting customer-impacting corrections. No automatic provider retries, billing changes, content deletion, or push/email notifications were enabled.

## Outstanding gates
- Confirm complete green GitHub Actions run for V3.74, including `scripts/check-platform-autopilot-v374.mjs` (code is committed; a completed run status has not yet been independently retrieved).
- Real signed-in founder device acceptance and session/account switch.
- Verify read-only provider diagnostic probes and durable idempotency before any external retry action.
- Set up authenticated device notification delivery + verified provider receipts + explicit opt-in before live founder phone alerts.

## Files
- `supabase/migrations/20261009023000_v3_74_recovery_review_audit.sql`
- `supabase/functions/busy-founder-ops/recoveryReport.mjs`
- `supabase/functions/busy-founder-ops/report.mjs`
- `supabase/functions/busy-founder-ops/index.ts`
- `src/screens/founderOperations.js`
- `scripts/check-platform-autopilot-v374.mjs`
- `.github/workflows/production-check.yml`
