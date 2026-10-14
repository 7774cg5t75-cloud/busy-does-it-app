# Busy Does It V3.232 — Atomic Booking Close, Work Consistency and Simpler Evidence

**Starting branch:** V3.231 at `0965ba4e8e15ba6d33fac2c3756aa3798b1551ad` (Snack metadata after last verified application commit).
**Status:** Implemented and tested SOURCE CODE only. No live Supabase staging/production migration, no real customer notification or booking, no paid mobile build.

## Mandatory dual-master preflight

Read current Word product master **V22.14 — Ask Busy First / Optional Services** and GitHub `ARCHITECTURE.md` plus standing `docs/DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md`, V3.231 technical report, Work source and PostgreSQL fixtures. Product master continues to require one simple request, accurate verified outcomes, shared Business Brain, original Work/customer data, owner approval and no surprise charges. No new pricing or optional-service purchase flow was made; no independent subscription/wallet or CRM was created.

## Actual implementation

1. **Strong booking close inside one transaction.** Additive migration `20261014225500_v3_232_scoped_booking_close_revision.sql` adds service-role-only `busy_close_linked_booking_current_v3232`. The function enforces original owner/admin membership, exact business/request/actor, `booking_request` kind and exact owner-visible `status` and `updated_at` while holding the original request `FOR UPDATE` lock. It then invokes the *existing* V3.181 durable Work handoff in the same transaction. A failure anywhere during request/link/event/Work cancellation rolls back everything; concurrent or repeated stale closures fail. This wrapper cannot confirm a new booking or notify a customer.
2. **Existing authenticated Edge action uses the guarded closure.** When the owner closes an already linked booking through `update_request_status`, `busy-mini-apps/index.ts` now passes the V3.231 original clicked status/revision to the new transaction. Existing ordinary enquiry status CAS and other owner-approved V3.181 handoffs remain separate and functional. No second Work booking ledger, duplicate calendar provider or repeated linked request is created.
3. **Safer post-commit behaviour.** After a successfully verified atomic closure, the server returns the original request's verified closed state and Work ledger outcome, with `requestReadbackPending` and explicit negative provider-delivery flags, rather than performing an extra SQL read that could fail after a durable write and encourage retries. The full owner inbox can be refreshed later; it does not prove Apple/Google calendar sync or notification receipt.
4. **Bounded evidence extraction.** New small pure `bookingCloseEvidenceV3232.mjs` validates same-business/request Work closure receipt, checks `cancelled` versus `not_applicable` (closed unconfirmed draft), rejects contradictory ledger states and prevents false external calendar/customer notification claims. The original authenticated route retains authority over membership. This begins targeted backend simplification rather than another large controller.
5. **Full migration/source parity maintained.** Exactly **69** versioned SQL migration files, plus the separately isolated business baseline, are now covered by source count/hashes and pre-approval scripts. The real staging system is still canary-only; migration inventory is not an installation authorisation.

## Independent automated evidence

- New offline `check-booking-close-v3232.mjs`: **108** focused source/classifier/staging assertions passed.
- Inherited `check-owner-recovery-v3231.mjs`: **97** assertions. Inherited Production Foundation: **105** checks, alongside website/app/guest/receipt/regression suites.
- A new third CI job executes the **actual V3.180 request/link/events atomic handoff**, **V3.181 durable Work ledger** and new **V3.232 guarded booking closure** with **PostgreSQL 17**. It proves owner A/B scope, stale timestamps, original booking draft closure, confirmed booking cancellation, duplicate replay denial and deliberate Work UPDATE failure after request/event activity. The exception leaves the request, link, event and Work ledger unchanged; the fixture then issues `ROLLBACK`.
- Successful job markers: `V3.232_ATOMIC_OWNER_BOOKING_CLOSE_AND_FAULT_ROLLBACK_PASS` and `V3.232_DISPOSABLE_DURABLE_WORK_ROLLBACK_PASS`.
- An inherited PostgreSQL 16 job also exercises original guest request → alert intent → dispatch → per-device evidence → push-service receipt → owner stale CAS with full rollback. Source is never deployed to staging by CI.
- Verify all GitHub Actions conclusions against the final application-code commit before claiming completion; docs commits trigger additional runs.

## Explicitly not yet proved

- Genuine Supabase Auth/JWT owner A/B, revocation, staff role changes or RLS using real signed-in sessions.
- Hosted staging schema installation or genuine live website/app guest enquiry through owner inbox to a real calendar.
- Actual Apple/Google push receipt to a physical phone, external calendar delivery/consent or customer read.
- End-user iPhone/iPad visual and accessibility tests or paid TestFlight/store signing.
- Correctness of every third-party connector or commercial add-on/credit payment lifecycle.

## Next sweep candidate

V3.233 should target owner-facing booking confirmation recovery and safe cancellation handoff, broader request lifecycle evidence and a modest reusable owner-request UI extraction. Separately approved staging installation remains the decisive next validation dependency. Do not promise a real customer journey is complete on the basis of source-only CI.

**North star:** Make BUSY complete original customer/Work tasks correctly, prevent partial failures and accurately describe what actually happened.
