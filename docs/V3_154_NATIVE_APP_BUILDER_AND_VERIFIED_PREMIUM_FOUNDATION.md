# V3.154 — Native App Builder prototype, verified-tier groundwork and safe editing

## Both distribution routes still matter

Busy Does It is building (1) the existing owner-controlled Business Apps that
operate in Busy Apps Marketplace and (2) future standalone downloadable iOS /
Android apps offered through a qualifying higher subscription. One customer
can use both routes. The native route is a genuinely separate React Native
project, not a screenshot or WebView wrapper of the website.

## Implemented in this development sweep

### Per-business standalone Expo prototype
- A finite, reusable app-screen specification is generated from an exact,
  owner-reviewed immutable Business App version, with an approved subset of
  the tested modules.
- `src/core/standaloneNativePackage.mjs` validates safe business app IDs,
  exact version, targets, module schema and explicitly preview-only flags.
  It creates prototype **app IDs distinct from Busy Does It** and marks all
  native actions as disabled until live authenticated provider integration.
- `standalone/template/` is a real, dark-themed React Native project with
  tab-like navigation between generated screens. It contains NO arbitrary
  generated JS, no payment interface, no fake booking submission, no EAS
  signing keys and no BUSY production project ID.
- `scripts/prepare-standalone-prototype-v3154.mjs` generates a separate
  local Expo project using a FICTIONAL salon business, never customer data.
  CI exports its unsigned iOS and Android JS bundles as well as the main BUSY
  bundles. **These are not installable IPA/APK binaries or store submissions.**
- Final customer app IDs, logos, verified runtime backends, store submission,
  owner signing credentials, privacy policy, push and maintenance remain
  upcoming work.

### Owner subscription eligibility without trusting the phone
- A service-role-only database foundation
  `busy_standalone_entitlements` has been added, with provider provenance,
  active period, exact business scope, allowance and usage counter.
- A new authenticated `standalone_eligibility_status` action on the existing
  Business App service checks workspace membership and reads that server-only
  row. Client requests cannot assert entitlement, an eligible tier or a
  subscription payment.
- The app provides a "Check my standalone subscription benefit" action and
  explains what verification actually returned. No entitlement is created
  by this sweep; a real, signature-verified billing webhook and reliable
  allowance reservation remain required before enabling a paid build.
- Crucially, checking an allowance NEVER orders, signs, charges for, builds
  or submits a customer's standalone app. It does not cover Apple/Google
  registrations or other external costs.

### Safe private app appearance editing
- Customers can prepare, preview, keep or discard finite changes to app
  header style, spacing and navigation presentation.
- The app displays the unsaved customer-view preview before "Keep".
- Server-side `set_appearance` requires owner/admin membership, the exact
  mini-app ID and optimistic current draft revision and only changes the
  allowlisted `presentation` object. Conflicts fail closed.
- A successful design change creates the NEXT private draft revision.
  Existing immutable preview and live versions remain unchanged and require
  fresh owner approval before republishing. Switching a setting back is a
  further owner-approved edit, not an unlimited historical Undo feature.
- The current design editor uses buttons. A contextual microphone, richer
  selected component editing, app-specific Undo history and full
  standalone app runtime remain future sweeps.

## Before standalone apps can be sold or downloaded
- Select and connect a real subscription/payment provider, authenticate its
  signed webhooks, define accurate tier benefit/allowance and atomic
  reservation of each build.
- Build an isolated per-customer EAS and platform signing/packaging service,
  with customer-owned developer accounts where appropriate and no sharing of
  credentials or public bundle IDs.
- Implement actual backend-driven native modules for approved public
  services and authenticated booking/enquiry requests, with explicit business
  confirmation and safe offline behaviour. Do not enable payments without
  their own reviewed integration.
- Test the generated native projects on signed physical devices, stage and
  review with Apple/Google, measure infrastructure costs and document
  ongoing maintenance, cancellation and export obligations.

No provider sign-up, subscription charge, signed native build, production
schema application, store submission, public marketplace publish or customer
credential transfer was performed here.
