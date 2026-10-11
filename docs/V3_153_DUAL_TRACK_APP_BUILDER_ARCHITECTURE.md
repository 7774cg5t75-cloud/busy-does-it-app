# V3.153 — Dual-track App Builder: Marketplace + Standalone

## Product decision
Busy Does It shall ultimately offer **both**:
- Functional customer-facing business apps operating inside the Busy Does It
  marketplace, using Busy-managed permissions, booking requests and approved
  customer information.
- Individually branded standalone downloadable apps, with iOS/Android
  packaging, signing, store review and distribution as a higher-subscription
  offering **subject to verified billing entitlements and clear allowances**.

Do not force customers to abandon the in-Busy app when they choose a standalone
app. Reuse the approved business profile, safe app runtime capabilities,
app design preferences and immutable preview wherever technically valid.

## Implemented in V3.153 development code

1. `src/core/appExperiencePlanner.mjs` recommends a distinct functional
   module order and layout approach for hospitality/food, appointments, trades,
   professional, creative and unknown businesses. Recommendations only use
   AVAILABLE server-owned catalog modules. No invented bookings, offers,
   payment acceptance or app activity.
2. `src/core/appRuntimeScreenSchema.mjs` is a finite reusable app-screen
   specification. It ensures a public business profile exists, rejects
   disabled/planned/unknown modules, refuses booking flows without
   server-confirmed business approval requirements, and never enables payment
   collection or arbitrary executable code.
3. `src/core/appDistributionChoices.mjs` represents both routes and a
   standalone-app planning checklist. It identifies a matching immutable
   app-preview revision, platform targets and owner acknowledgements for:
   Apple/Google developer accounts, external fees, app-review acceptance,
   third-party services and ongoing maintenance. It refuses to equate a
   higher-tier name or self-declared payment with a verified billing
   entitlement.
4. `src/screens/miniApps.js` surfaces both routes **before** the existing
   app-planning flow, offers explicit disclosures and selections, and permits
   the owner to prepare a PRIVATE standalone plan only after reviewing the
   disclosures and generating an exact app preview. It cannot create signed
   binaries, contact stores, charge fees or publish. Customers can still
   independently use the existing in-Busy app journey.
5. `scripts/check-app-builder-dual-track-v3153.mjs` and
   `.github/workflows/app-builder-dual-track-v3153.yml` cover both paths,
   checked catalog actions, different industries, customer acknowledgement,
   preview version correctness and no accidental submission. The tests
   export unsigned iOS and Android BUSY code only.

### Subscription and cost policy to apply *before* release

- Target positioning: standalone-app **creation** is an allowance/benefit of
  an appropriate higher Busy subscription; availability and numbers are
  provisional until a real tier and credit ledger is agreed.
- Every premium checkout, app-builder entry and standalone order must state
  what Busy includes and what it does not. The user must explicitly acknowledge
  third-party accounts, potential registration fees, possible operating costs,
  maintenance and store-approval risks before requesting packaging.
- Store registration, other providers and services are **not** assumed to be
  included in Busy subscriptions. Never guess a current fee or currency.
- Require a server-sourced active subscription/entitlement record; **never**
  trust a client-supplied `tierId`, `standaloneIncluded` or purchase success.
- Standalone packaging must use an immutable approved app-version identity and
  business membership. Signed artifacts and provider credentials must be
  isolated by business and managed by approved provider processes.
- A premium subscription grants access to the defined service, **not** a
  guarantee that Apple or Google approves the resulting app.
- Define export and content ownership, cancellation, domain/contact portability,
  who owns store developer accounts, renewal responsibility, allowances and
  per-app hosting cost before public sale. Do not claim that an in-Busy micro-app
  is automatically an independent App Store submission.

## Release blockers and V3.154+ priorities

1. Connect real billing to immutable, server-verified entitlements and
   allowance/credit metering for standalone app build requests. Do not
   activate premium bundling on a provisional tier.
2. Implement distinct per-business standalone packaging and signing workflows
   for iOS/Android, using supported frameworks and credentials with strict
   isolation. Consider store/template policies and customer-owned developer
   accounts when choosing the provider process.
3. Deploy and exercise full request/booking/enquiry, owner approvals, guest
   access, profile updates, marketplace discovery and rollback end to end in
   authenticated staging using fictional businesses.
4. Build native screen/component editing, tap-and-talk, private visual design
   comparison, Undo and session recovery using the shared boundary patterns.
   The first sweep **does not claim** to deliver standalone binaries,
   contextual component speech editing or real developer-account integration.
5. Validate standalone maintenance/cost economics, failure recovery,
   notifications, privacy/permissions, release-signing, store submission,
   deletion/ownership/export and continued service after cancellation.
6. Prove app layout and functionality on real iPhone/iPad/Android devices.
   Current CI only proves static contracts and unsigned BUSY JS exports.

No developer or store signup, new provider enrollment, subscription change,
charge, public marketplace publication or live store submission occurred in
this development sweep.
