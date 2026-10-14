# Busy Does It — V3.231 Owner-Approved Request Freshness, Recovery and Two-Business Auth Readiness

**Base:** V3.230 `0586989c31c159846022baf96c4c755b9b7583e2` (Snack metadata at head; earlier V3.230 application-code checks passed).
**Status:** SOURCE ONLY, with real disposable PostgreSQL 16 fixtures. No hosted staging migration, signed-in provider test, notification send or paid build authorised.

## Dual-master decision preflight (performed)

- **Product master:** Latest saved owner Word product master is **V22.14 — Ask Busy First / Optional Services** (newer than V22.13). It requires reusing current capability/entitlement/credits systems, clear customer choice and explicit approval for spending. No new optional-service billing, pricing, entitlement, provider purchase or claim of availability was created in this sweep.
- **Technical master:** GitHub `ARCHITECTURE.md`, `DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md`, latest V3.230 report, source and green workflow were read. Preserve one authoritative Business App request, owner role check, customer event/Work handoff and notification outbox; do not build a competing CRM or shadow billing ledger.

## Implemented, not just planned

1. **Prevent stale owner status actions.** New pure `ownerRequestFreshnessV3231.mjs` requires exact business ID, original request ID, original current status, immutable client-visible `updated_at` and trusted server-read row. The existing authenticated owner status action checks this **before** Work handoff. The actual UPDATE now uses both `status` AND `updated_at` comparisons alongside business and request IDs. If another owner changed either field, update affects zero rows and BUSY demands a refresh. The existing lifecycle validator and linked Work safeguards remain in place.
2. **Owner's actual screen provides consented revision.** Original `miniApps.js` request cards and detail view pass the record being displayed to `AppController.js`, which requires original status/revision; it never manufactures a fresh timestamp behind the owner's back. Hide inappropriate "Mark reviewing" and terminal "Decline" actions. No new navigation or customer steps.
3. **Recovery without duplicate status writes.** In the original controller, an attempted but uncertain write triggers one existing `owner_inbox_receipt` **read-only**, authenticated owner lookup. The new pure `ownerStatusRecoveryV3231.mjs` distinguishes current target status, different current status and unverified state. Even if current status matches, it **does not claim** this owner action committed or send the write again. This reuses the V3.205 existing exact request receipt, not a new CRM, message provider or custom receipt database.
4. **Real, disposable PostgreSQL competing-action tests.** `CI_ONLY_v3231_owner_status_cas.sql` verifies an old timestamp, wrong previous status, wrong business ID and repeated identical click cannot change the original request. Exactly one correctly scoped fresh update succeeds; another tenant's request remains unchanged. It is assembled into the entire inherited original guest request → durable notification intent → lease → per-device ticket → Expo receipt transaction and completely rolled back in ephemeral PostgreSQL. **Raw SQL fixture is not real Auth/JWT evidence.**
5. **Preparing real tenant-security proof without pretending it passed.** `prepare-two-business-auth-v3231.mjs` creates a non-executable 11-scenario, exact-source SHA review matrix. Required future cases include real sign-ins for distinct businesses A/B, denied cross-business reads/writes, revoked membership, owner/staff role boundaries, stale-owner two-session requests, guest receipt privacy, outbox deduplication, actual backup/restore and disabled push workers. Every case stays `not_verified`; no identities, JWTs, external providers or database objects are created by the generator.

## Tests and evidence

`scripts/check-owner-recovery-v3231.mjs` checks freshness and recovery policies, actual owner/UI integration, tenant-scoped source, SQL CAS fixture presence and unverified staging gate. CI workflow `builders-major-v3231.yml` runs this alongside all inherited builder, guest, auth source, receipt, privacy and Production Foundation checks plus real disposable PostgreSQL transaction/rollback. **Never mark the final commit green without examining its Actions results.**

The live connected Supabase project `pnjdlogwegnqbsfpcofw` was still active/healthy and held only `busy_staging_rls_canary`, the two original canary ledger rows and no deployed Edge Functions at the V3.231 preflight. No source-to-live installation was approved. Actual signed-in, two-business Auth/JWT/RLS evidence, backup/restore and live guest → owner full customer journey remain **not verified**.

## Known limitations / follow-up

- The existing linked-booking close path invokes the separate durable Work handoff after a current preflight. Its full multi-record atomicity still depends on that Work transaction; this sweep's new compare-and-swap directly guards the ordinary request-status UPDATE, not every Work side effect.
- A readback after an uncertain HTTP result cannot establish which actor changed a status; BUSY must describe only the observed saved state.
- Original `owner_inbox_receipt` is an authorised service read, not proof of notification delivery, owner attention or confirmed booking.
- No change to launch pricing or add-on transaction flows from V22.14; commercial feature work must later reuse the existing entitlements/ledger and require explicit itemised consent.
- **Next candidate:** V3.232 tighten linked Work status/handoff atomicity, refactor the owner request UI seam behind visual tests, and prepare separately approved actual Auth/JWT + restore evidence before staging installation.

**North star:** Ordinary owners tell BUSY what they need; BUSY prevents silent races, knows exactly what is proven, and never sends duplicate customer actions after uncertainty.
