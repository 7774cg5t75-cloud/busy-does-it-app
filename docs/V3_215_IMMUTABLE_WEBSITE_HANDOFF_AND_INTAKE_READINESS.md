# Busy Does It V3.215 — Immutable Website Handoff and Enquiry Readiness

**Base:** V3.214. **Method:** substantial multi-part, source-only build-first sweep. No staging or production Supabase deployment, database migration, customer submission, provider notification, published website change, paid AI use or signed device build.

## Why V3.215 was necessary

V3.214 connected generated website Contact sections to the already-operational *in-code* guest Business App enquiry/booking path through an owner-approved public link. That was preferable to inventing a second website customer database. However, its URL pinned **only the public slug**, while the separately saved draft remembered the app and immutable version IDs. If the slug's owner or public version changed, the old link could lead to a newer app version without the website owner's fresh approval.

This sweep closes that gap *in source* and makes the future native-website-enquiry requirements visible. It also makes supported handoff links genuinely tap-sized and keyboard-accessible across narrow and wide layouts.

## 1. Owner-reviewed links now identify exact immutable live version

New website approvals use the canonical link shape:

\`https://<trusted-supabase-project>.supabase.co/functions/v1/busy-mini-app-link?slug=<published-slug>&source=web&intent=<enquiry-or-booking_request>&appId=<exact-uuid>&versionId=<exact-published-version-uuid>\`

The V3.214 core planner now includes the current app ID and \`current_live_version_id\` in this canonical link; half-bound or invalid IDs fail. The existing exact draft/workspace/generation checks, immutable live version, owner-scoped feature catalogue, published module and booking-services requirements remain.

The private website layout editor now requires a **five-parameter exact canonical URL**, rejects injected/extra/duplicate/reordered query values, and still uses the original preview/rebuild/undo mechanism. The HTML renderer independently reproduces the complete canonical link with the stored IDs and emits no link for legacy, tampered or unapproved draft data. Cross-builder continuity reviews use this same contract.

## 2. Independent public server re-verification on every click

New pure \`supabase/functions/busy-mini-app-link/websiteRequestLinkGuardV3215.mjs\` is integrated into the existing public \`busy-mini-app-link\` Edge handler. For \`source=web\` and an enquiry/booking intent, **before any entry event or handoff page** it requires:

- Exactly five ordered, known query keys and valid slug/app/version IDs.
- Server-read published \`busy_mini_apps.id\`, slug and \`current_live_version_id\` matching the URL's original owner-reviewed IDs.
- Server-read immutable published version for that specific app, with state \`live\` and the correct \`mini_app_id\`.
- The requested module still enabled in that published configuration, including owner-entered services for booking requests.

Changed app ownership, slug reassignment, a newer live version, disabled module, unknown parameter or missing bound IDs fails closed with a plain reapproval message and **no request-intent event**. An allowed link opens the existing customer handoff only; guest challenge, rate limits, separate save, idempotency, stored receipts and Work diary proofs are separate actions and were not bypassed or reimplemented.

The new stricter protocol intentionally requires reapproval and separate website republication for any **older unbound website request links**, which no longer meet the server's \`source=web\` request gate. This is a migration/breaking-link consideration to verify during isolated staging before deployment. Ordinary non-website QR/share/app handoffs retain their existing path.

## 3. Preparatory native website enquiry safety gates

The new \`src/core/websiteEnquiryReadinessV3215.mjs\` is a **read-only evidence and design planner**, not a customer form endpoint. It evaluates known draft ownership, current public website delivery evidence, active published Business App handoff, and ten requirements for an eventual native website enquiry form, including:

- Server-resolved published website origin and business ownership, not client-supplied IDs.
- Abuse controls, browser challenges, traffic limits, owner-approved consent and privacy copy.
- Bounded input validation, idempotent transaction + receipt recovery, business inbox/readback and notifications.
- Isolated staging browser end-to-end and accessibility verification.

These unimplemented layers are **always marked unverified**, even when the existing website's HTTPS domain and published app can be independently checked. The planner never stores customer data, issues network calls, authorises payment or enables publishing.

The Website Builder's existing optional website/Business App handoff panel now offers **“What would my own website enquiry form need?”** with visible missing prerequisites and a clear explanation of the currently supported interim app-link path. Stale saved links warn of reapproval rather than falsely claiming a link will follow the old version. No new navigation maze or expensive provider invocation.

## 4. Responsive contact experience

The existing website visual design system now gives approved \`.busy-app-request-link\` elements a **48px minimum tap target**, clear keyboard \`:focus-visible\` outline, accessible readable labels, and a 100%-width narrow-phone fallback. The same CSS factory supplies private preview, hosted website and exported markup. This is a **static styling improvement**, not proof that actual multi-device screenshots were tested.

## 5. Testing and limits

\`scripts/check-builders-v3215.mjs\` covers canonical app/version binding, forbidden URL/query mutations, changed published state, module/service availability, private owner approve/undo, privacy-minimal intake readiness and frontend/backend source wiring. \`.github/workflows/builders-major-v3215.yml\` adds that suite before V3.214/V3.213/V3.212/V3.211/V3.210 and inherited security/staging/architecture checks, plus unsigned iOS/Android JavaScript exports. Focused offline checks test pure source behaviour, not real HTTP or an installed Supabase project.

**Not implemented or verified yet:** a website-native hosted form, site-bound public customer submission route, transactional database write, owner consent storage, independently confirmed notification, actual public browser handoff after deployment, device screenshots or an independently confirmed Work diary appointment. No user data was sent, no live app was republished and no separate database mutation or migration was performed.

## V3.216 recommendation

Implement the next independently testable **site-origin request intake boundary** without prematurely enabling it: exact published website deployment verification, private owner-approved contact schema/consent, source-bound challenge and idempotency keys, and a reviewed server-owned adapter to the existing business request inbox. Do **not** activate the new public endpoint until isolated staging migrations and anti-abuse, privacy and real-browser verification have been approved. Continue responsive owner experience and outcome-based intelligence alongside that development.

**North star: You tell Busy what needs doing. Busy does it — and verifies the outcome.**
