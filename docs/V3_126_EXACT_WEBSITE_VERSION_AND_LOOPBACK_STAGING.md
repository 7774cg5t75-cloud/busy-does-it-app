# V3.126 — Exact Website Version & Isolated Staging Rehearsal

## Completed in source
- Actual website publishing state selects the canonical hosted preview/live deployment ID. Out-of-order `preview_ready` rows cannot overtake it. A missing canonical record is blocked; legacy fallback requires exactly one candidate.
- A local HTTP server bound to `127.0.0.1` serves two different fictional sites with immutable SHA-256 response verification. It refuses both cross-business reads, unauthenticated/expired symbolic sessions and all write requests. Browser checks and screenshots cover mobile (390px) and desktop (1440px), business identity, links and overflow.
- A manual, **read-only** staging PostgREST probe is ready for a *future, new* isolated Supabase project. It requires explicit approval, two authenticated disposable owners, two rows, a publishable key and an expired JWT. Six GET-only cases detect incorrect owner access and fail closed.
- Source regressions and the dedicated GitHub Actions workflow are included. Screenshot/evidence artifacts contain fictional content, kept for seven days.

## Real staging setup remains a separate authorised operation
1. Confirm the financial implications before creating an additional Supabase project or paid branching environment. Busy Does It and Slow Roast currently exist as two separate active projects; do not repurpose either.
2. Provision a distinct nonproduction project and dedicated nonpublic configuration after founder approval. Never copy real customer records, production tokens, payment keys or DNS.
3. On the *new* project only, review `staging/ISOLATED_ONLY_canary_setup.sql`. It is deliberately NOT a normal `supabase/migrations` file; the read-only table is not deployed to production. Create two disposable Auth users, seed one separately owned row for each under controlled administration, and supply only protected env vars to `node scripts/run-isolated-staging-reads-v3126.mjs`.
4. Set `BUSY_STAGING_READ_APPROVAL=APPROVE_ISOLATED_STAGING_READS` only for an independently approved test. Confirm both own reads, both cross-tenant denials, anonymous denial, expired-session denial. Then separately verify cross-tenant *writes* and actual application tables, real website publish/rollback and cleanup.
5. Collect redacted evidence and manually approve or reject the specific staging run. Delete canary data, users and table after reviewing backups/retention.

## What is **not** claimed
A local HTTP rehearsal is not live HTTPS hosting or a real Supabase tenant-policy test. A successful canary-table read check is not a full app audit. No staging cloud project, actual RLS test, public website, signed iOS build, customer pilot, DNS change, paid API call or production migration is created by the V3.126 source changes. The 12 cloud gates and release audit remain blocked.

Official references: https://supabase.com/docs/guides/deployment ; https://supabase.com/docs/guides/platform/billing-on-supabase ; https://supabase.com/docs/guides/api/securing-your-api
