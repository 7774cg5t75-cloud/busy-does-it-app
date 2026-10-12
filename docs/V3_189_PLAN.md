# Busy Does It — V3.189 Connected Intelligence & Real-World Readiness 2.0

Development branch: `v3.189`, forked from `v3.188` at `1fd4edcaf3f37cc162c5cd8658f497fb9a2059e8`.

**Boundary:** Source changes, local/CI checks, disposable PostgreSQL and read-only offline staging preparation only. No hosted SQL, Supabase Auth or Edge deployment, real customer contact, provider charges, production mutation or release.

## Delivered

1. **Owner Business Brain next check** — `src/core/ownerNextActionV3189.mjs` is integrated into the existing business-app owner view by `src/domain/miniApps.js` and `src/screens/miniApps.js`. It prioritises observed closed/active booking conflicts above possible missing Work entries or replies. The screen presents one actionable explanation instead of a long technical evidence section. Absence from the 30/150/200-row limited snapshots remains **unproven** and never triggers an automatic booking change or reply.
2. **Individual-record proof contract** — `src/core/singleJourneyProofV3189.mjs` validates request/business/app scope, message and Work states, record uniqueness and caller-reported full-readback completeness. Conflicting or incomplete records never establish a confirmed booking. This is a **tested foundation** for a future independently authenticated per-request lookup. It does not implement that lookup or verify a signed JWT.
3. **Ambiguous task safety** — `src/core/ambiguousTaskOutcomeV3189.mjs` distinguishes a saved task, a gateway submission and a device receipt, and retains the existing idempotency reference when transport results are uncertain. It is a tested conservative policy, **not yet a wired production retry worker**. Existing durable message retry remains in place.
4. **PostgreSQL security regression** — `staging/ci-evidence-readback-v3189.sql` extends the V3.188 disposable PostgreSQL role and membership checks to reject changed-payload same-key replays and cross-business message attempts, checking that neither failure changes a message, outbox or unread count. This is not a real Supabase signed-JWT test.
5. **Isolated staging dependency handover** — `scripts/review-staging-dependencies-v3189.mjs` validates the offline integrity package and enumerates migration side-effect review categories, extensions, backup, role, secrets and separate approval gates. It uses the **dated 12 October observation**, not a fresh hosted inspection. Do not run blind SQL or reset the original canary.
6. **Automated verification and inventory** — `scripts/check-connected-readiness-v3189.mjs`, `.github/workflows/connected-intelligence-v3189.yml` and the intelligence source tracker add regression tests, disposable PostgreSQL 17 testing and Busy/standalone iOS and Android exports. The inventory distinguishes owner-connected functionality from development-only policies; code existence is not proof of completed customer jobs.

## How to reproduce locally (no deployment)

```sh
node scripts/check-connected-readiness-v3189.mjs
node scripts/prepare-staging-install-v3180.mjs
node scripts/verify-staging-install-v3186.mjs
node scripts/review-staging-dependencies-v3189.mjs
node scripts/check-evidence-readiness-v3188.mjs
node scripts/track-intelligence-v3183.mjs
```

The GitHub Actions V3.189 workflow adds disposable PostgreSQL and native export checks. Consult the actual workflow conclusion for pass/fail rather than treating a green earlier commit as proof that later commits passed.

## Explicit remaining gates

- Staging project `pnjdlogwegnqbsfpcofw` has **not** had Busy application migrations and Edge Functions installed. Reconfirm the current state, extensions and existing ledger independently.
- Verify a recoverable isolated staging backup, extensions/cron/network and grants/secret handling; obtain **separate express approval** before any hosted change.
- Test two real signed-in staging accounts with genuine Supabase JWTs, owner revocation, customer request, saved reply, ambiguous retry, Work booking confirmation/cancellation and cross-tenant denial.
- Verify actual device notification delivery and connected site/app customer entry where supported; do not infer it from saved rows or provider ticket submission.
- Continue per-business preference persistence, explicit feedback outcomes and privacy-safe learning. This version adds safer reasoning and test foundations, **not autonomous model retraining or cross-business learning**.
- Deep functional testing, paid-service checks, full pre-release privacy/security review and production rollout are still pending.

## Success criterion

Busy can offer a clearer next check when business data is incomplete, while the system refuses to claim that a customer replied, received a notification, paid or attended without independent evidence. All live customer-facing changes stay under owner control.
