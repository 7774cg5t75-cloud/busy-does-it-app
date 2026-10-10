# V3.128 — Separate hosted staging and genuine Supabase Auth foundations

## Completed in GitHub (source-only)
1. **No production fallback on an internal staging build.** \`src/core/stagingRuntimeIsolation.mjs\` chooses a single approved staging Supabase project URL and publishable key for all shared cloud endpoints. It refuses the Busy Does It production and Slow Roast project references. Missing/insecure configuration uses reserved \`.invalid\` and the shared transport refuses outbound requests.
2. **Separate iPhone / Android installation.** \`eas.json\` now contains a \`staging\` internal-development profile with \`EXPO_PUBLIC_BUSY_ENVIRONMENT=isolated-staging\` and a separate \`staging\` update channel. \`app.config.js\` changes only staging-mode identity: “Busy Does It Staging”, \`com.busydoesit.app.staging\`, separate Android package and \`busydoesit-staging\` deep-link scheme. Existing normal builds retain the original identifiers and channel.
3. **Separate on-device data.** Staging mode uses new owner-session and cache namespace keys. It does not reuse existing Busy Does It sign-in state.
4. **Genuine Auth observation transport prepared but NOT executed.** The protected \`scripts/run-real-staging-auth-v3128.mjs\` will call **a separately approved Supabase project's real** \`GET /auth/v1/user\` with two different fictional-owner JWTs and require the Auth server to return the expected distinct account IDs before it can query the canary table. It also checks unauthenticated/rejected sessions and six read-only PostgREST cases. No passwords, refresh-token operations, SQL writes, provider calls or automatic publishing.
5. **Separate hosting marker source prepared but NOT deployed.** \`staging/isolated-staging-worker-v3128.mjs\` is an inert Cloudflare Worker until separately deployed. It can only answer \`GET/HEAD /__busy_staging/health\` with the pinned source commit and explicit “not yet verified” fields; all other routes and write methods are rejected. \`staging/wrangler.staging.example.toml\` intentionally has no account, zone, route or deployment credentials.
6. **Remote marker verification prepared but NOT executed.** \`scripts/run-hosted-staging-marker-v3128.mjs\` will make one HTTPS GET without sending Supabase JWTs and verify the expected host, exact commit, noindex/no-store, and truthful “not yet ready” fields.
7. **Protected GitHub workflow.** \`.github/workflows/real-staging-auth-v3128.yml\` runs only offline fixture tests on code pushes. The separate genuine Auth/HTTPS jobs require manual \`workflow_dispatch\`, exact approval phrase and \`isolated-staging\` GitHub Environment credentials. It has no production SQL write, paid AI, DNS update, EAS build or release operation.

## Why this has not launched a cloud staging environment
The connected Supabase account has Busy Does It and Slow Roast as active projects, with no independently provisioned staging project. Creating a new project or Supabase branch can incur charges. Supabase Branching also carries separate usage costs, potentially outside spend caps. Actual costs and organization/account billing need confirmation before any new project or branch action. Do not reuse either existing project as staging.

The full app's real database tables, server functions, Storage and Supabase user permissions have **not** been deployed to a separate backend. The staging Worker is a route identity marker, **not** a website hosting system. The EAS staging profile is a recipe, not a signed iPhone development build. These must never be reported as a launched or verified staging environment.

## Manual steps needed when the founder authorizes cloud resources
1. Select the correct Supabase organization and review an up-to-date cost quote. Approve creation of a **new dedicated nonproduction project**, with no production customer data, tokens, backups or mail providers copied. Do not spend or create the project automatically.
2. Review project settings, Auth email/test-user creation, permitted redirect URLs, RLS, Data API grants, Storage privacy and Edge Function permissions. Apply reviewed schema changes to **only the isolated new project**. Use the disposable two-owner canary SQL in \`staging/ISOLATED_ONLY_canary_setup.sql\` only after independent authorization, and create the two fictional owners and rows. Do not run production migrations in this environment without a compatibility/rollback review.
3. Obtain two **genuine** short-lived staging user access tokens by an authorized test sign-in and a rejected/expired test token; keep them in protected environment secrets. Never put JWTs, secret/service-role keys, user emails or project passwords in a repository, a copied chat or a staging Worker.
4. Create a separate staging HTTPS hostname and Cloudflare Worker deployment after reviewing hosting/DNS and costs. Provide only nonsecret routing metadata to the marker. Production default website delivery and the public root domain remain unchanged.
5. Configure GitHub repository Environment \`isolated-staging\` with required reviewers and secrets:
   - \`BUSY_STAGING_PROJECT_REF\`, \`BUSY_PRODUCTION_PROJECT_REF\`, \`BUSY_SLOWROAST_PROJECT_REF\`
   - \`BUSY_STAGING_PUBLISHABLE_KEY\`
   - \`BUSY_STAGING_OWNER_A_ID\`, \`BUSY_STAGING_OWNER_B_ID\`
   - \`BUSY_STAGING_ROW_A_ID\`, \`BUSY_STAGING_ROW_B_ID\`
   - \`BUSY_STAGING_OWNER_A_JWT\`, \`BUSY_STAGING_OWNER_B_JWT\`, \`BUSY_STAGING_REJECTED_JWT\`
   - \`BUSY_STAGING_HOST_ORIGIN\`, \`BUSY_STAGING_EXPECTED_HOST\`
6. Only after independent approval, manually dispatch \`V3.128 isolated hosted staging and real Supabase Auth preparation\` with \`approval_phrase\` set exactly to \`APPROVE_READ_ONLY_STAGING_AUTH_3128\`. The workflow will execute only GET requests to the named staging services, record redacted counts, and still require independent human review. It cannot certify arbitrary production policies, genuine sign-in expiry lifecycle, writes, or app readiness.
7. For a later signed internal iPhone build, configure \`EXPO_PUBLIC_BUSY_STAGING_SUPABASE_URL\` and \`EXPO_PUBLIC_BUSY_STAGING_PUBLISHABLE_KEY\` in the **appropriate protected Expo/EAS staging environment**, not in source files. Review the generated iOS package ID, update channel and server URL, and explicitly approve \`eas build --profile staging --platform ios\`; this is not run by this sweep. A missing config intentionally makes the test app offline, not a production client.
8. Validate full website generation, editing, immutable preview/publishing, real app and social integrations, two-owner read/write isolation, recovery and rollback. Verify customer data and secrets never appear in artifacts/logs. Review cleanup before marking any pre-release gate complete.

## Test limitations and next gates
- CI fixture tests can exercise the code paths but do not create authentic Supabase JWTs or prove server-side Auth.
- The V3.127 disposable PostgreSQL RLS checks remain real *local* SQL tests, not the isolated hosted project.
- Supabase \`getUser\` is an authenticated server request suitable for corroborating a supplied JWT/user identity; plain JWT decoding is not independent verification.
- Neither a green configuration guard nor a successful hostname marker proves full hosted website delivery, Supabase authentication for the app, or production release readiness.
- Do not enable customer sign-ups, payments, real email, AI calls or public website publication during initial staging tests without a new, separately authorised plan.

Current Supabase references:
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/guides/deployment/branching
- https://supabase.com/docs/guides/platform/manage-your-usage/branching
- https://supabase.com/docs/guides/database/postgres/row-level-security
