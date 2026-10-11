# V3.155 — Native business apps with real guest requests and contextual editing

## What changed

The project now supports two separate business-app distribution modes:
a working in-Busy Apps experience backed by established public owner apps,
and a separate native Expo project that can **optionally** use the same
server-owned, immutable published business configuration.

1. `supabase/functions/busy-mini-app-guest/publicNativeProjection.mjs` and
   the guest service's `public_app` action return ONLY allowlisted
   business-facing fields from the **actual LIVE version**. Requests MUST
   specify the exact app UUID, immutable live-version UUID and business slug.
   Drafts, stale versions, private owner notes, customer records, raw config,
   unapproved gallery images and auth/provider data never leave the service.
2. `src/core/nativeAppRuntimePlan.mjs` defines a second opt-in boundary:
   owner approval, a matched `live` app record, immutable version and a
   trusted HTTPS Supabase origin. No private native prototype gains public
   connectivity simply by being generated.
3. `src/core/standaloneNativePackage.mjs` preserves the default
   **offline unsigned prototype**, but can include an approved live runtime
   descriptor when supplied explicit matching trusted live-version evidence.
   This remains UNSIGNED and not store-ready.
4. `standalone/template/App.js` is a React Native-native customer experience:
   real, live owner-approved business identity, services, contact information
   and approved gallery; customer-facing enquiry and booking request forms.
   It never presents a request as a confirmed booking, never takes payment,
   and does not show fabricated business details if disconnected.
5. `standalone/template/nativeGuestRequests.js` directly invokes Busy's
   EXISTING live guest-challenge and guest-submit backend, including its
   fingerprint checks, idempotency key, rate limiting and business-side
   approval lifecycle. `nativeGuestProof.js` computes the SHA-256 challenge
   solution in bounded chunks with a timeout, rather than bypassing the
   server's anti-abuse checks. The service's receipt is kept **in memory
   only**, not persisted; delivery and real-device behavior still need live
   testing, including poor connectivity and IP changes.
6. The App Builder has selected-element text interpretation for limited
   header, spacing and navigation changes. The customer selects an
   element, enters a supported plain-language description, previews the
   private change and deliberately keeps/discards it. The server's existing
   optimistic draft revision check still protects live versions.

## Important correction found during integration

The earlier V3.154 private appearance panel was mistakenly mounted inside
the Marketplace screen. V3.155 relocates it inside the Business App Builder
and permanently tests that Marketplace UI does not access builder-only state.
Merely compiling an unsigned Expo bundle had not caught that runtime issue.

## Tests

- `scripts/check-native-public-booking-v3155.mjs`: strict public fields,
  exact live version checks, SHA-256 comparison with Node crypto, finite PoW,
  real guest challenge/submit contract with a mocked HTTP service, no
  fake bookings or payments, native offline default and approved live opt-in.
- `scripts/check-app-context-editor-v3155.mjs`: scoped appearance editing,
  unsupported payment/publishing rejection and Marketplace screen isolation.
- Dedicated `.github/workflows/app-native-guest-v3155.yml`:
  controls plus syntax checks and unsigned exports for **both the separate
  native customer app and the main Busy app** on iOS and Android.
  Mocked backend tests do NOT count as authenticated live staging.

## Required before genuine customer release

- Deploy the new read-only public endpoint to a test Supabase project,
  test signed/unsigned request policy with an actual published fictional
  business, server guest challenge, PoW, request receipt and owner response.
  Test the native app from real iOS and Android devices. Fail closed if
  fingerprint/user-agent/IP changes invalidate a request.
- Add production-quality native accessibility, input validation, receipt
  recovery, privacy policy and app-specific localisation, across many trades.
- Enable only real, verified customer app runtime plans during separately
  approved packaging. Never expose service-role keys, developer credentials,
  private data, arbitrary backend origins or raw source code.
- Add signed customer builds and Apple/Google developer-account
  provisioning after separate verified higher-tier entitlements and explicit
  external-fee acceptance. No standalone customer app is currently available
  to download from either store.
- Extend the contextual editing toolbar to other app modules, plus
  app-specific microphone transcription and visual feedback. The current
  contextual editor **does not claim voice conversations work**.

No live production changes, billing-provider activation, third-party
registration, signing, app-store submission or customer publication happened
in V3.155.
