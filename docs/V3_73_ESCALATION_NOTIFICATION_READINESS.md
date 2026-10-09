# V3.73 — Incident Escalation & Founder Push Readiness

**Development branch:** `v3.73` — not public release, not evidence of a delivered push notification.

## Goal
Advance BUSY DOES IT toward low-noise, self-running operations: distinguish ongoing operational exceptions from stale/unknown signals, and prepare founder notifications without leaking customer information or spamming a device.

## Implemented
1. **Evidence-aware escalation:** a pure `classifyEscalation` module classifies each aggregate source incident as `watch`, `persistent`, `urgent`, `resolved` or `unverified` using the existing background scan. An escalation requires recent (within 45 minutes), complete monitoring, a checked source and plausible timestamps; missing information refuses escalation. Stalled website processing receives earlier review priority than a generic historical failed record.
2. **Founder-only delivery-readiness check:** the existing authenticated `busy-founder-ops` function now counts **only active push devices registered to the freshly authenticated founder user ID**. It returns only an integer or unknown: never tokens, device identifiers or other owners' data. Supabase currently has **zero active founder push devices**.
3. **No fictitious push:** a registered Expo token, if one appears, still is not proof of successful delivery. External founder phone/email notifications are **not enabled**.
4. **Alert policy groundwork:** `notificationPolicy.mjs` makes prospective delivery eligible only after verified founder authorisation, explicit opt-in, a verified destination, a separate dispatch-activation switch, a fresh escalated incident and no acknowledgement. It respects **Europe/London quiet hours**, and a **minimum 24-hour cooldown per class** (requires genuine receipt history). Invalid timestamps or missing data fail closed. This is a pure policy helper, not a dispatch or scheduler.
5. **Founder dashboard:** shows the real device-enrolment state, links to Production Bridge for existing native push setup, counts persistent/urgent incidents and shows their evidence-derived triage level. No customer details are exposed.
6. **Regression additions:** `scripts/check-platform-autopilot-v373.mjs` contains tests for escalation thresholds, incomplete/stale monitors, private founder device lookup, quiet hours, cooldowns, opt-in and no invented notifications. Added to existing `production-check.yml` alongside V3.69–V3.72 tests.
7. **Version:** the development app, config and package version now display `3.73.0`.
8. **Deployment:** the founder reporting Edge Function was deployed with `verify_jwt=true`. Existing 15-minute scan schedule remains unchanged. No migrations or destructive database changes were necessary for this sweep.

## Operational boundaries
- **No unattended phone push/email has been sent or enabled.** The next gate is a real native founder push-device registration, a supervised test notification, verified delivery receipts, explicit opt-in, and a durable per-key dispatch ledger with idempotency, cooldown and quiet-hour enforcement.
- **No background repair of customer content.** Suggestions are read-only. Public website URL reachability and live provider availability have not been independently proved by this sweep; database failure history can reflect past failures.
- Real payment collection, cancellations, website suspension and AI spending enforcement are still separate commercial work.
- GitHub workflow tests are wired in but must not be called passing until their actual run/exit status is inspected. A V3.73 iPhone preview/real-device acceptance check remains required.

## Files
- `supabase/functions/busy-founder-ops/escalation.mjs`
- `supabase/functions/busy-founder-ops/notificationReadiness.mjs`
- `supabase/functions/busy-founder-ops/notificationPolicy.mjs`
- `supabase/functions/busy-founder-ops/alertInbox.mjs`
- `supabase/functions/busy-founder-ops/report.mjs`
- `supabase/functions/busy-founder-ops/index.ts`
- `src/screens/founderOperations.js`
- `scripts/check-platform-autopilot-v373.mjs`
- `.github/workflows/production-check.yml`

## Release acceptance checklist
- [x] New branch, version, dashboard, server-only founder device count, escalation and notification policy.
- [x] Edge Function deployed and JWT checking retained.
- [x] Regression tests authored and added to standard production-validation workflow.
- [ ] Confirm all GitHub automated checks are green from the relevant revision.
- [ ] Confirm authenticated Founder Operations renders with V3.73 on actual iPhone.
- [ ] Register founder's own native push device and verify push receipts, opt-in, quiet hours and cooldown.
- [ ] Develop and test durable, idempotent, manually enabled external dispatch before claiming live notifications.
- [ ] Validate safe read-only status probes with actual connected providers, without fake uptime or retries.
