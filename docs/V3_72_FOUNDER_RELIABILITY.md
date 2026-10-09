# V3.72 — Founder Reliability & Automated Regression Gates

**Status:** Development branch `v3.72`. Not publicly released.

## Goal
BUSY DOES IT must never present missing monitoring evidence as proof of healthy operation. Strengthen platform quality without new accounts, payment charges, automated destructive repair, or a demand for the founder to manually test every commit.

## Implemented
- Added a deterministic, server-derived **Operational Confidence** section to Founder Operations.
- Distinguishes: healthy recent monitoring with available alerts; recorded alerts requiring founder review; stale background scans; partially unavailable signal coverage; and an unavailable alert inbox.
- Every state uses constrained, truthful guidance. Even a clear scan is **not** a guarantee that all customers' public websites are reachable.
- Founder report still requires the same fresh Supabase Auth and server-controlled founder role. The new status is derived only from previously authorised aggregate data; there are no new per-customer disclosures or privileged endpoints.
- Founder acknowledgement UI now clears stale progress on account change and ignores completion from a request belonging to the previous account, preventing misleading cross-account success/error messages.
- Extended existing **Production foundation check** GitHub Actions workflow to execute the V3.69 founder security tests, V3.70 incident monitor tests, V3.71 alert/commercial guardrail tests and new V3.72 reliability classification tests.
- Version files updated to **3.72.0**.
- V3.72 edge reporting code deployed with JWT checking enabled. No SQL schema changes or modifications to background monitoring cadence.

## What remains outside this sweep
- Independent confirmation of full GitHub Actions execution. Workflow steps are committed but should not be called passing until the run and exit status are inspected.
- Actual signed-in founder iPhone/Expo Go screen acceptance, account switch, offline refresh and acknowledgement on an isolated QA alert fixture.
- External founder push/email notifications and device registration. Neither is enabled.
- Automatic external service recovery and website/social resubmission. These remain disabled.
- Real paid subscriber data, £50 payment collection, subscription entitlements and involuntary hosting suspension. Commercial decisions remain planning-only until verified billing and clear customer terms exist.
- Customer data/domain export and provider cost ledgers must be checked before any enforcement.

## Files
- `supabase/functions/busy-founder-ops/reliability.mjs`
- `supabase/functions/busy-founder-ops/report.mjs`
- `src/screens/founderOperations.js`
- `scripts/check-platform-autopilot-v372.mjs`
- `.github/workflows/production-check.yml`

## V3.72 acceptance checklist
- [x] Commit monitoring health classification and dashboard.
- [x] Deploy founder report with unchanged JWT restriction.
- [x] Add V3.69–V3.72 tests to existing automatic GitHub validation.
- [ ] Confirm GitHub workflow completed without any failed checks.
- [ ] Verify actual founder iPhone display in V3.72 Expo Go preview or suitable development build.
- [ ] Verify real-account acknowledgement permissions, account changes and session expiry in a supervised QA fixture.
