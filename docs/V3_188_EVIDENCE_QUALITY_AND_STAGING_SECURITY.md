# Busy Does It — V3.188 Evidence Quality & Isolated Staging Security

Development branch: \`v3.188\`, created from verified \`v3.187\`. **No hosted staging SQL, provider deployments, production changes, real customer messages or purchases were performed.**

## 1. Busy's Business Brain distinguishes observed evidence from incomplete snapshots

\`src/core/customerEvidenceCompletenessV3188.mjs\` is a small independently tested owner-evidence quality policy. It checks the existing V3.187 customer-outcome review and recent owner-authenticated message/Work snapshot bounds. It distinguishes:
- **Observed contradiction:** a closed customer request with an active stored BUSY Work entry.
- **Requires a full-record lookup:** an accepted request without a matching Work row **in the retrieved sample**, or an enquiry with no saved owner response **in the retrieved sample**.
- **Unknown / incomplete:** messages capped at 150, Work entries capped at 200 and filtered to a recent time window, or requests capped around the latest 30.

An absence of a reply or booking in a recent sample is never represented as proof the record does not exist. An individually authenticated, complete record lookup would still be needed before contacting a customer or correcting a booking. The private Business App review now explains this in simple language. It never returns customer names, phone numbers, contact data or message content and doesn't perform any automatic action.

The existing Business Brain still doesn't measure real revenue, delivery to a device, a finished job, or customer satisfaction.

## 2. Staging operator preflight is more specific and always refuses unattended installation

\`src/core/isolatedStagingPreflightV3188.mjs\` and \`scripts/review-staging-preflight-v3188.mjs\` provide a precise offline handover for the isolated staging project: expected project ID, original canary, existing canary migration ledger, exact additional extension requirements, SHA-256 package integrity and migration side-effect review counts. Its planned steps identify independent identity validation, safe backup/recovery, extension privileges, full database/Edge/Auth review, separate owner approval, reviewed installation, and subsequent real signed-customer tests.

The CLI reads only a dated observation from previous independent Supabase read-only inspection. It explicitly refuses to treat its output as a fresh live check, installation permission or a successful Auth/RLS audit.

**Current independently checked staging state (12 October 2026):**
- Project \`pnjdlogwegnqbsfpcofw\`, **Busy Does It Staging**, PostgreSQL 17, ACTIVE_HEALTHY, London region.
- Only \`public.busy_staging_rls_canary\` exists in public (2 fictional rows). No application schema installed and no deployed Edge Functions.
- Exactly 2 already-recorded canary migrations: \`20261010224121\` and \`20261010224205\`.
- \`pgcrypto\` installed; \`pgmq\`, \`pg_cron\`, \`pg_net\` available but **not installed**.

Do not run a blind 63-migration SQL bundle or reset the working canary. Independently confirm existing versions and extensions at installation time, inspect dangerous cron/network/privileged SQL and payment callbacks, agree the backup/restore method, verify staging-only credentials, and obtain **separate express approval** before modifying staging. Production is not a permitted destination.

## 3. Database-level revocation and isolation rehearsal

\`staging/ci-tenant-role-revocation-v3188.sql\` builds on V3.187's complete fictional enquiry/booking/customer reply flow in an ephemeral PostgreSQL 17 instance. It adds:
- Direct grants on business memberships, customer messages and private push-outbox tables must not be accessible to \`anon\`/\`authenticated\`.
- The elevated message and booking RPCs must not be callable directly by the untrusted authenticated role.
- The delivery outbox must have row-level security enabled and forced.
- Revoking a fictional owner's membership blocks sending a customer reply. Neither message nor unread counter may change.
- Restoring that fictional membership restores the scoped owner reply path, with its atomic outbox and unread changes.

These are **actual PostgreSQL role/transaction tests**, not a reproduction of Supabase Auth's complete signed JWT/Edge routing. A real JWT-based two-tenant denial test remains a release gate.

## 4. Architecture and intelligence inventory

The change adds small pure modules and a read-only report rather than increasing the large app controller. \`scripts/track-intelligence-v3183.mjs\` now surveys **21 representative capabilities**: the previous 19 plus sample completeness and isolated staging operator readiness. It measures code existence, wiring and test-file presence—not an AI intelligence score, real completed jobs, new model weights or actual conversion lift.

The code's line count uses the established physical-code-file methodology, excluding YAML and documentation. The verified CI measurement should be used as the snapshot for V3.188.

## 5. Reproducibility and remaining gates

\`.github/workflows/evidence-staging-v3188.yml\` runs the new security SQL test in disposable PostgreSQL 17, new V3.188 focused tests, prior booking/message/Work/outcome/staging/source regression tests, import/syntax checks, and Busy + standalone Expo iOS/Android exports.

To prepare offline package and review, **without deploying or applying SQL**:

\`\`\`sh
node scripts/prepare-staging-install-v3180.mjs
node scripts/verify-staging-install-v3186.mjs
node scripts/review-staging-preflight-v3188.mjs
\`\`\`

Green CI means reproducible local evidence, not signed mobile binaries, hosted staging deployment, verified real two-business Auth accounts, actual notification delivery or marketplace-wide reliability. Real staging and production remain untouched.

## V3.189 priority

Finish reviewing exact migration/extension effects, backup recovery and staging-only Edge secrets. After obtaining **specific approval to install in isolated staging**, run an independently authenticated owner/customer journey end to end with fictional accounts and evidence captured from the real staging project. Keep tracking real outcomes and finish safe customer/owner controls without hiding uncertainty under a numerical AI score.
