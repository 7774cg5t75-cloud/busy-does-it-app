# V3.130 — isolated staging database connected; genuine Auth users next

## Live facts verified October 10, 2026 (not inferred from mock CI)
- Connected isolated Supabase organisation: **Busy Does It Staging**; org ref: xuocbohidxakzlgumnnf (Pro).
- Isolated project: **Busy Does It Staging**, ID **pnjdlogwegnqbsfpcofw**, region **eu-west-2**, status **ACTIVE_HEALTHY**, URL \`https://pnjdlogwegnqbsfpcofw.supabase.co\`.
- The original Busy Does It and Slow Roast production project IDs are distinct and were neither accessed nor mutated by this sweep. This Supabase connection presently only lists the staging organisation.
- Before mutations: public application tables = 0, staging Auth users = 0, migrations = 0, Edge Functions = 0.
- Applied **only to the isolated staging project** the existing tracked source \`staging/ISOLATED_ONLY_canary_setup.sql\`, recorded by Supabase as migration \`staging_canary_owner_read_v3130\`. The public \`busy_staging_rls_canary\` table uses \`auth.users(id)\` foreign keys, RLS enabled and forced, read-only policy \`auth.uid() = owner_id\` for authenticated role, no insert/update/delete privileges.
- Security advisors flagged a default provisioned \`public.rls_auto_enable()\` SECURITY DEFINER helper callable by \`anon\` and \`authenticated\`. After inspecting the function (an RLS event-trigger function), applied \`revoke execute on function public.rls_auto_enable() from public, anon, authenticated;\` as migration \`restrict_staging_rls_event_helper_v3130\`. The event trigger remains enabled.
- A subsequent security advisor scan returned **0 findings**.
- The actual staging DB read-only SQL attestation in \`staging/ISOLATED_ONLY_verify_live_rls_v3130.sql\` returned all **eight safety booleans true**, test Auth user count **0** and test row count **0**. No end-to-end Supabase Auth has occurred yet.
- \`src/core/runtime.js\` and the V3.129 fictional-preview Worker now require the **exact** new staging project reference. A wrong third Supabase project, either live existing project or missing config fails closed. Public \`.env.staging.example\` contains the staging URL but no API key. Nothing is deployed to Cloudflare or signed for iPhone.

## Founder action: create two fictional Supabase Auth accounts

Do **not** create accounts in the original Busy Does It organisation.

In the dashboard, while viewing the connected **Busy Does It Staging** project, open **Authentication → Users → Add user** (often labeled “Create new user”). Add the two entirely fictional accounts below:

- Owner A: \`bdi-stage-owner-a@example.invalid\`
- Owner B: \`bdi-stage-owner-b@example.invalid\`

Each must have a **different, strong password** generated privately and stored in a password manager. When the admin UI offers “Auto-confirm user”, enable it; reserved \`example.invalid\` addresses do not receive verification emails. Do not send passwords, recovery data, service-role keys, or JWTs into a chat, a GitHub source file, or a screenshot. The emails are intentionally non-deliverable; if the Supabase dashboard refuses them, stop and request an alternative fictional-account creation method instead of reusing personal/production accounts.

Avoid clicking **Invite user** to send an email; choose **Create new user** if available. Do not enable public anonymous sign-in, disable security protections, or create production customers.

The owner UUIDs are generated **by Supabase Auth**. After both users exist, independently confirm there are two staged users before the assistant runs the guarded staging-only seed SQL file \`staging/ISOLATED_ONLY_seed_two_real_auth_users_v3130.sql\`. It uses exact fictitious emails to look up genuine Auth-generated IDs, refuses missing or duplicated users and owner-ID conflicts, and inserts ONLY two read-only canary rows. It never inserts directly into Supabase \`auth.users\` and never generates JWTs.

## Genuine authentication verification steps after owner creation

1. Verify both real staging Auth accounts exist by count/status using only isolated project connector, without listing private passwords/emails.
2. Apply the seed SQL **to staging only**, then rerun \`ISOLATED_ONLY_verify_live_rls_v3130.sql\` (eight booleans true; two Auth accounts and two canary rows).
3. Obtain short-lived tokens **using actual Supabase Auth sign-in** on the staging project, never by setting fake JWT claims or generating arbitrary base64. Configure GitHub's protected \`isolated-staging\` environment with the staging project ref/public key, two Auth-generated owner UUIDs, fixed canary row UUIDs and short-lived JWTs. Those tokens must be hidden from build logs and never committed.
4. Manually run the V3.128 read-only live Auth/RLS workflow; it must call the real staging \`GET /auth/v1/user\`, accept genuine token identity matches, allow each owner's private row, deny foreign/anonymous reads, and fail closed on any error. *Short-lived token rotation and lifetime verification are separate follow-on tasks.* A source-only pass proves none of this.
5. Only after successful Auth checks, explicitly approve a separate Cloudflare Worker/HTTPS host. Build two real BUSY design-engine fictional sites from V3.129, deploy **only** to \`staging.busydoesit.co.uk\` if approved and available, and verify real JWT-bound HTTPS site previews, content digests, browser screenshots, revocation, rollback and cleanup.
6. Prepare a completely separate signed internal iPhone staging build using the EAS \`staging\` profile and its distinct bundle ID. No production customer accounts/data or provider secrets should be carried into staging.

## Safety / cost boundary

The separate Pro organisation and Micro compute already exist (user created them). This sweep did not add Cloudflare costs, DNS, provider calls, client sessions, real Auth users, signed iPhone binary or public website hosting. The app is **not** yet ready for customer-facing staging or production launch. Supabase providers' usage-based costs can still accrue on a Pro account; review its billing and spending controls periodically.

**Source check note:** \`scripts/check-staging-live-readiness-v3130.mjs\` and source-only CI assert project identity, code isolation and seed safety. They cannot independently certify a live Auth session; rely on actual Supabase connector SQL/advisors and later manual Auth HTTP probes for that evidence.
