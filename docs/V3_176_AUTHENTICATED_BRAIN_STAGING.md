# V3.176 — Authenticated Business Brain Memory and Isolated Staging Connectivity

Development branch: `v3.176`, created from `v3.175`.

## What this substantial sweep actually implements

### 1. Business Brain owner decisions: persistent storage and native controls

- New migration: `supabase/migrations/20261012150500_v3_176_business_brain_owner_decisions.sql`. Private `busy_brain_owner_decisions` event-history table, with per-owner and per-business request-id uniqueness, bounded valid goals/action IDs, explicit RLS, **no anon or authenticated table access grants**, and **service-role-only** select/insert/delete. The service-role credential remains solely within the existing authenticated Edge Function.
- New `supabase/functions/busy-mini-apps/brainOwnerDecisionsService.mjs` implements server-validated private app history, owner-approved writes and clearing. Every operation receives the business ID from membership resolution, not from a caller-supplied table row. It checks the exact current `busy_mini_apps` app ID and draft revision. The event stream is limited to 80 current-revision entries, and idempotency only accepts repeats with *identical* contents.
- `supabase/functions/busy-mini-apps/index.ts` attaches `brain_owner_decisions`, `record_brain_owner_decision` and `clear_brain_owner_decisions` to the pre-existing authenticated `busy-mini-apps` API after `membership(user.id,businessId,writeActions.has(action))`; these actions are added to the owner/admin write set.
- `src/core/brainOwnerDecisionsContract.mjs` validates allowed actions and strips untrusted cross-business/stale records. `src/app/AppController.js` exposes signed-in read/write/clear methods and verifies response scope *again* on mobile.
- Business App Studio has a **Not useful — remember my choice** action for each current recommendation and a confirmation-gated **Clear my saved Business Brain choices** action. It reads history from the authenticated endpoint only while the optional customer-task panel is displayed and ties results to business, app ID and draft revision.
- The finite Business Brain planner already honours matching rejected/postponed actions without executing them. Decisions from a previous revision remain in the private database but are **not blindly reapplied** to later revisions. This is owner-decision persistence, not automatic model retraining, and no customer records or business secrets are saved.
- **Important boundary:** this sweep persists owner decisions for the *Business App* only. The Website Builder's suggestions remain read-only because its draft revision is not yet authenticated against the same server record. Do not claim persistent website owner choices until that backend link is implemented and tested.

### 2. Real authenticated staging connectivity probe, denied on production

- New `supabase/functions/busy-mini-apps/stagingConnectionGuard.mjs` rejects requests unless server-side `BUSY_STAGING_MODE=isolated`, a server-owned `BUSY_STAGING_PROJECT_REF` is explicitly set, the ref has valid syntax and matches the `https://<ref>.supabase.co` API URL of the running Supabase project. The caller cannot override staging mode, project ref or URL.
- The new `staging_connection_probe` Edge action is gated by the same owner/admin membership as other sensitive owner actions. It **performs an actual read-only backend lookup** of the current private app and verifies its ID and revision, then returns bounded evidence that staging owner authentication, project identity and database access agree.
- A native **Check isolated staging connection (read only)** button calls this route *only on explicit owner tap* and displays a useful result. On any production project lacking the exact staging configuration it must fail closed. This route sends no messages, creates no booking, calls no customer submission endpoint and never claims actual booking/enquiry delivery has passed.
- A genuine isolated staging runner executing real customer journeys still needs a **separate owner-authorised deployment**, test accounts, endpoint allowlists, tenant RLS validation, idempotency/rate-limit assertions, side-effect controls and server-authenticated receipts.

### 3. Security, lifecycle and QA

- New `scripts/check-authenticated-brain-staging-v3176.mjs` exercises owner-scoped records against a simulated Supabase query builder: valid writes, request idempotency, mismatched payload collision, different user isolation, stale revision denial, wrong app rejection, explicit clearing, client history validation, staging allowlist and malicious URLs, plus static checks for SQL, Edge, native controller, UI and workflow integration.
- New `.github/workflows/authenticated-brain-staging-v3176.yml` runs the new script, every historical V3.175– earlier regression, native/Edge source parse, Busy iOS/Android Expo exports and independent standalone iOS/Android exports.
- **Verification performed in development:** 87 assertions from the exact V3.176 focused regression file passed under an in-memory JS harness running the real source helpers with a fake database. This is meaningful code validation, but does **not** replace PostgreSQL integration testing, Supabase migration deployment, authenticated Edge execution, a complete GitHub Actions run, native bundler exports or tests on a physical device.

## Safe rollout sequence — NOT completed automatically

1. Inspect the SQL migration with database advisers/security review, apply it in a **disposable isolated staging database first**, and verify owner A/owner B/anon access denial, idempotency and private history/erase behaviour.
2. Deploy the changed `busy-mini-apps` Edge function **to isolated staging only** after project identity is confirmed. Do not set staging allowlist secrets on production.
3. Set both staging env variables only on that isolated project and verify the explicit native read-only probe. Test incorrect ref, missing env values and stale draft IDs.
4. Test business member, non-owner, revoked user, owner and admin JWT behaviour; prove unauthenticated and cross-tenant queries cannot read/change owner decisions.
5. Confirm the full V3.176 GitHub Actions workflow is green, including React Native syntax and four Expo exports.
6. Exercise the optional Business App Studio panel on iPhone/iPad (including Medium Display Zoom and dark theme), with storage unavailable, slow responses, network failure and successful owner decisions.
7. Test real enquiries/bookings in isolated staging only after the staging runner is independently approved and deployed; inspect delivery, inbox, separately confirmed diary and guest receipt behaviour.
8. Keep public publishing, purchases, app signing, external sign-ups and customer contact owner-approved throughout.

## Proposed V3.177

Implement and verify staged server-side customer-journey tests against *test-only endpoints* and make private website owner preferences persist safely with authenticated draft-revision validation. Prioritise real proof and safe, repeatable rollback over more planning-only layers. Continue improving Business Brain outcome evaluations while keeping user interface simple.

No live schema migration, Edge deployment, production request, real customer message, provider charge or app-store submission was carried out in this sweep.
