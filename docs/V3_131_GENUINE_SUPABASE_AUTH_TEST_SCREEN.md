# V3.131 — Real staging Auth test screen for a separate iPhone build

## Delivered in source (not yet installed or signed)

- Added \`src/staging/stagingAuthInspectorV3131.mjs\`, a real Supabase Auth and PostgREST client configured to access **only** \`https://pnjdlogwegnqbsfpcofw.supabase.co\`. It rejects production project \`qgkmuiipicazmcxxmoxv\`, Slow Roast \`rtqqnqbrqpjondvcyann\`, wrong third projects, missing public keys and non-staging build settings. No production fallback.
- Added \`src/staging/StagingSignInScreen.js\`, a minimal dark iPhone test page with fictional Owner A (Hillside Gardens) and Owner B (Fire & Table Catering), a password field, “Sign in and verify”, “Recheck access” and “Sign out and clear session”.
- Changed root \`App.js\` to show this sign-in diagnostic **only if** \`EXPO_PUBLIC_BUSY_ENVIRONMENT=isolated-staging\`. All other builds continue using the existing \`BusyDoesItApp\`, unchanged.
- Supabase sign-in uses **actual** \`POST /auth/v1/token?grant_type=password\`. The server-supplied access token must pass \`GET /auth/v1/user\` with a matching fictional email. Auth token then requests one known owner-specific canary row, one known foreign row (which must not be readable), and the same row anonymously (which must not be readable). The test fails closed if any stage is wrong.
- Passwords are cleared from the input after submission, no access or refresh tokens are persisted into AsyncStorage/SecureStore, and neither is included in results or logs. The access token is held in a JavaScript closure for this test only. Logout clears that state before making the real Supabase \`POST /auth/v1/logout\` request; the UI warns that an existing JWT could remain valid until expiry. Closing the screen clears local state. Expired/revoked sessions can be rechecked.
- **Important:** A successful sign-in and canary result proves one actual Supabase session's identity and RLS read isolation **when manually executed on the staging app**. It does NOT prove production app sign-ins, website publishing, Cloudflare HTTPS, App Store binaries, token revocation, or arbitrary app table policies.

## Actually verified

Connected **Busy Does It Staging** Supabase project \`pnjdlogwegnqbsfpcofw\` exists, is healthy, and has exactly two genuine Auth test users, two distinct fictional owner-linked canary rows, and forced RLS. Security advisors returned no warnings after enabling leaked-password protection. Previously executed isolated SQL under each role showed exactly one visible row, but was a PostgreSQL role simulation, **not** a live signed JWT check.

V3.131 GitHub CI in \`.github/workflows/staging-native-auth-v3131.yml\` tests **328 offline transport/identity/tenant/no-write/sign-out/negative-case assertions** using a simulated HTTP server; never supplies a real password. It exports **two separate iPhone JS bundles successfully**: one isolated staging-mode and one existing nonstaging-mode. These exports are **not installable signed iOS apps**. The production-foundation workflow independently runs the safety tests.

## First live iPhone session prerequisites — not yet complete

1. Keep the \`isolated-staging\` EAS build profile distinct: staging app display name, iOS bundle ID, Android package, URL scheme and OTA channel must not match production.
2. Configure **only the public Supabase publishable key** (\`sb_publishable_...\`) under \`EXPO_PUBLIC_BUSY_STAGING_PUBLISHABLE_KEY\` and the known staging project URL under \`EXPO_PUBLIC_BUSY_STAGING_SUPABASE_URL\` for the staging EAS build. Publishable keys are designed for clients, unlike **secret/service-role** keys, database passwords and JWTs, which must never be put into \`EXPO_PUBLIC_*\` or GitHub source. Do not copy staging private passwords into EAS.
3. Review Supabase Auth public sign-up settings and test-only email provider configuration before distributing staging builds to anyone beyond founder test users.
4. Approve, initiate and successfully sign an **internal iPhone staging development build** via \`eas build --profile staging --platform ios\` with the founder's Apple Developer/EAS credentials. V3.131 did **not** launch this build, create EAS credentials, incur new provider fees or alter DNS.
5. Install **Busy Does It Staging** separately on the test iPhone. Select fictional Owner A, type its locally saved private password without sharing it, sign in; demand all four green proofs (server identity, own row, foreign row blocked, anonymous blocked). Recheck and sign out. Repeat for Owner B. Never paste passwords or access/refresh tokens into ChatGPT.
6. Investigate any red status as a failed staging gate; do not enable customer site publishing or call the staging website pilot complete.
7. Once both genuine sign-ins pass, deploy a **separate approved HTTPS staging Worker** for fictional website previews, verify auth-gated private access, source SHA-256, iPhone/desktop rendering, tenant separation, expiry, rollback and cleanup. Cloudflare worker and DNS remain **not deployed**.

## Cost and isolation

No new Supabase project, database mutation, paid AI use, Cloudflare worker, DNS change, EAS hosted build, Apple signing or customer-data operation occurred during V3.131. The new page is a deliberately narrow testing harness; the full Busy Does It app remains unchanged on normal builds. The separate Supabase Pro organization will continue accruing its existing subscription and usage per plan.

**Current release gate:** source and JS exports ready; actual two-user Supabase password-session E2E, signed staging app, separate HTTPS host and full website workflows **still blocked/pending**.
