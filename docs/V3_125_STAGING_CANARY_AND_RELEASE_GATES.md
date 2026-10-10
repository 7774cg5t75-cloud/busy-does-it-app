# V3.125 — Isolated staging canary and exact-version proof

## Completed in source
- Configuration-only guard checks six independent conditions: different HTTPS Supabase project roots; explicitly dedicated staging HTTPS host; preview/staging build profile; immutable source SHA; public publishable key classification; and verified absence of production access, real customer data, public writes or paid provider use.
- Website canary evidence contract checks eight conditions: same fictional business owner, fictional-only material, matching exact draft generation, externally observed SHA-256 artifact digest, private HTTPS staging preview origin, approval of that immutable deployment ID, desktop/mobile reviews, and bounded read recovery with unauthorised writes denied. It **does not make external requests**, publish or claim trusted observations.
- Business App Builder's existing preview and live version freshness now require a positive draft revision and an immutable version ID and number. A no-draft revision or mismatched version never appears current because two zeros happen to match.
- Founder Operations retains one clear next action; detail rows are optional and show all checks as unverified by default. No secrets, tenant data or URLs are shown.
- Standard version CI additionally checks the V3.125 assertions; a separate isolated staging safety workflow runs the new and previous website/cloud/regional guard regressions and validates mobile JavaScript export.

## Setup to be approved before real staging
1. Identify a genuinely **new, separate** Supabase nonproduction project with no relationship to the current customer database or production provider tokens. Record project refs in a founder-controlled offline deployment manifest; do not put secret keys in this repository.
2. Configure an isolated nonproduction HTTPS website host and EAS preview build channel, pinned to the exact git commit. DNS and Cloudflare changes require a separate owner-approved action.
3. Confirm publishable key is only in client code; secret/service-role tokens remain server-only. For staging users, use two disposable independently authenticated test-owner accounts and businesses with authorised scope. Do not reuse existing customer records.
4. Review applicable migration source, create an isolated disposable staging database, verify RLS in **both** directions against actual JWTs, unauthenticated and expired sessions, and deny writes across both owners. Confirm permissions as well as row policies.
5. Rehearse one fictional website and Business App journey. Capture the source commit, immutable preview ID, generation/revision, independently observed artifact SHA-256, mobile and desktop screenshots, and read-only recovery traces with secrets redacted.
6. Review privacy, deletion, test-media disposal and backup retention; rehearse recovery and rollback. Review all 12 V3.124 cloud gates independently and obtain a fresh founder sign-off for that specific run.

## Stop conditions
- Any project/host shared with production; missing or untrusted evidence; reused live credentials; cross-tenant exposure; real customer material; provider charges; missing rollback; stale preview revision; unapproved public publication.
- Fail closed if hosting is unavailable or any evidence cannot be reproduced independently. A passing CI workflow is **source-only**, not an end-to-end certified cloud staging environment.

## What did not happen
No separate Supabase project, cloud browser host, Cloudflare DNS changes, signed iOS IPA, production database changes, customer data transfer, paid AI calls, live staging RLS probe or publication were executed as part of the repository changes. Manual environment setup and evidence review remain prerequisites to claiming a staging launch.
