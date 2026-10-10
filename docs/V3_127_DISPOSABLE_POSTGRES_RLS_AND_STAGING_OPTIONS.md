# V3.127 — Real disposable PostgreSQL tenant-isolation verification

## Scope
This sweep extends V3.126's fictional loopback-browser testing with **real PostgreSQL 17 execution** in an ephemeral GitHub Actions service. It is not an online Supabase staging project.

### Implemented
- Created `v3.127` from the latest `v3.126` branch. Existing app customers, paid providers, Cloudflare routing, and both live Supabase projects remain untouched.
- `staging/ci-postgres-bootstrap-v3127.sql` sets up two fictional Auth owners on a disposable Postgres database and **directly imports** `staging/ISOLATED_ONLY_canary_setup.sql` (the same staging canary RLS SQL prepared in V3.126). It also sets up a separate disposable owner-writable table to validate `USING` and `WITH CHECK` policies.
- `staging/check-postgres-rls-v3127.sh` refuses to run unless explicit disposable-ci approval, PostgreSQL host `127.0.0.1`, port 5432, database `busy_staging_ci` and user `postgres` match the expected fixture. It confirms Postgres 17, tests own/foreign reads, absence of an identity, anonymous SQL grants, forbidden read-only writes, cross-tenant update/delete, attempted ownership reassignment, unauthorised inserts, and permitted owner actions.
- `.github/workflows/staging-postgres-v3127.yml` starts a fresh Postgres 17 service in GitHub Actions with an ephemeral CI-only password. It runs the actual SQL checks, not merely an offline validator. No Supabase access tokens, payment APIs or deployed test website are needed.
- `scripts/check-staging-database-contract-v3127.mjs` tests the safe CI configuration and verifies the existing release and staging gates remain blocked.
- The main regression workflow includes the new source-contract test. The Founder Operations expandable staging details explicitly explain that disposable SQL testing is not real hosted Supabase verification.

## Verified result
GitHub Actions confirmed that the real SQL job ran successfully against a disposable database. As expected, owners could read and modify their own editable rows, read-only canary writes were prohibited, anonymous requests lacked access, attempts to reassign ownership were rejected, and both cross-tenant directions were isolated.

GitHub workflow: https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/workflows/staging-postgres-v3127.yml

### Important limitations
- The CI `auth.uid()` stand-in reads an emulated session claim. **This does not validate genuine JWT signatures, expired tokens, Supabase Auth sessions, PostgREST scope enforcement, Storage policies or application endpoints.**
- The test covers the named staging canary and an isolated example table; it does not certify every Busy Does It production table or RLS policy. A read passing in CI is not proof that deployed server functions enforce tenancy.
- GitHub Actions is an ephemeral testing environment, not a stable real-user staging address. No public/HTTPS staging URL, signed iOS staging application or cloud deployment was created.
- The existing 12 cloud evidence requirements and the release audit still require independent verification and founder permission. No automatic public launch or customer pilot was activated.

## Financial and rollout choice
The connected Supabase account currently has two active projects (Busy Does It and Slow Roast). According to the current Supabase documentation, Free plans allow two active projects; a third active project may require a paid organisation/upgrade, with extra project compute charges. Do **not** create, repurpose, pause or upgrade either project without the founder's explicit approval and an up-to-date billing quote.

The safer no-new-project workflow for now is GitHub Actions source checks, disposable PostgreSQL RLS tests and fictional local-browser tests. When a separate cloud staging project becomes cost-approved, use the manual read-only canary from V3.126 first, then genuine RLS write probes, authenticated app routes, hosted website delivery, clean-up and rollback, and real-device testing.

Official billing reference: https://supabase.com/docs/guides/platform/billing-on-supabase

## Recommended V3.128
Expand the disposable database rehearsal beyond the simple canary to audit actual app-specific tenant-policy definitions and migration safety, and provide a per-environment, independently attested release-gate report. Do not activate production migrations or paid staging automatically.
