# Busy Does It V3.214 — Owner-Approved Website → Live Business App Handoff

**Based on V3.213.** Build-first source implementation and offline regressions. No live Supabase/Edge deployments, migrations, payment charges, customer submissions, provider messages, public site changes, signed device builds or production writes.

## Why this sweep matters

The existing generated website builder publishes informational sites with real approved business contact details, while the public Business App already provides protected customer enquiry/booking-request intake using a guest browser challenge and transactional request persistence.

**V3.214 connects these two real systems without inventing an unverified website-hosted form or a second customer database.** An owner can approve links inside the website's private Contact section that guide visitors to a *currently published* Business App enquiry or booking request. On every visit, the existing public BUSY link Edge service independently checks that the app and requested action are still live.

This is an interim supported customer handoff, not complete public website enquiry-form capability; no booking, payment, customer notification or diary confirmation is created merely because a visitor opens a link.

## 1. Industry-neutral, published-app link contract

New \`src/core/websiteAppHandoffV3214.mjs\` prepares a bounded, zero-API-credit owner review. The business must have:
- One current private website draft with valid revision and matching tenant scope, containing a visible Contact section with owner-entered contact details.
- One authenticated owner-scoped Business App with matching \`business_id\`, current live version and matching live version ID, a valid published public slug, and \`live\` or \`update_pending\` state.
- A request module **enabled in the immutable published version**, not merely in an unfinished draft. The owner-scoped module catalogue must also say available; booking requests require real services and the business-approval capability.
- A canonical HTTPS URL using the existing Supabase-hosted \`/functions/v1/busy-mini-app-link\` route, with exactly the expected \`slug\`, \`source=web\` and \`intent=enquiry|booking_request\` parameters.

Unknown industries can use this integration. Any missing, mismatched, outdated or unsupported prerequisite produces a clear reason instead of a false operational status.

## 2. Private website edit with owner approval, undo and removal

New optional \`src/screens/websiteAppHandoffReview.js\` sits inside the existing Website Builder. Owners select enquiries or booking requests, review the exact target and explicitly approve an edit. The owner can also disconnect the link if it is outdated or unwanted.

The standard \`AppController.applyWebsiteLayoutAction\` recomputes the real live app evidence **at approval time**, checking the exact current website business, ID, revision, app ID, published version, slug, and canonical URL. It does not trust an arbitrary input link or yesterday's plan.

The existing \`websiteLayoutEditing.mjs\` supports two bounded actions, \`connect-app-request\` and \`disconnect-app-request\`. It checks complete revision/tenant context, valid intent, exact app/version UUIDs, visible Contact section and canonical HTTPS link, while rejecting URL spoofing, unsafe scripts, injected HTML, other app IDs and extra operation keys. All changes use the existing private rebuild/undo path; published websites are not silently changed.

The website HTML renderer uses an independent second validation of the stored owner-approved URL before including an accessible external link in Contact. It escapes href text and uses \`noopener noreferrer\`. The same private renderer and standalone export code path inherit this behaviour; unsupported/tampered links render nothing.

## 3. Critical live server gate

\`supabase/functions/busy-mini-app-link/index.ts\` previously looked up a live Business App but could present an \`intent=enquiry\` or \`intent=booking_request\` handoff when the corresponding module was no longer enabled. V3.214 also reads the **exact current live version**, verifies that the requested module is enabled and requires owner-entered services before a booking request. Missing or disabled modules fail closed before recording a request-intent entry or displaying a misleading action.

This is not a replacement for the existing \`busy-mini-app-guest\` anti-abuse challenges, rate limits, idempotent transactional saves, receipt recovery and owner inbox rules. Actual use of that public intake, live-state consistency and guest responses still need isolated staging deployment and end-to-end tests.

## 4. Joined Brand DNA and simple UX

The existing shared request journey adds a distinct \`ownerApprovedAppHandoffInPrivateDraft\` evidence stage, validated against the same business and referenced live app. A linked draft **still** says that public website publishing, browser opening, successful guest verification, saved request and provider notification delivery are not verified.

Business Brand DNA displays this distinction; no new main navigation or giant website setup screen is introduced. The owner can remove a link when the connected app becomes unavailable without restoring previous published changes.

## 5. Verification

\`scripts/check-builders-v3214.mjs\` tests canonical HTTPS links, invalid external domains/ports/path/extra parameters, malformed slugs, stale website/app IDs and revisions, missing owner-approved contact, unavailable/disabled modules, booking service and confirmation prerequisites, exact private apply/remove with Undo preservation, renderer behaviour for tampered/hidden/unapproved links, owner-controller rechecks and Edge live-module checks.

GitHub Actions workflow \`.github/workflows/builders-major-v3214.yml\` adds this suite to the V3.213–V3.210 and previous security/architecture/staging checks and unsigned iOS/Android JS exports. These checks cannot establish real public behaviour until CI, staging and actual devices/providers have been exercised.

## Additional live-version continuity safeguard

A Business App with a published `current_live_version_id` remains publicly reachable while the owner prepares a newer **private** draft (status `update_pending`). V3.214 aligns the public link, guest challenge/intake, signed-in customer detail and marketplace browsing with that condition. Each request entry still resolves the **immutable current published version** and checks its `state = live`; never use `draft_config` as visitor authority. This prevents owner edits from making an otherwise published handoff disappear.

The V3.214 focused suite explicitly checks the public handlers retain these guards. No database migration or live deploy was performed, so this source change is not verified as working on a hosted website or live Business App.

## Where V3.215 should go

1. Progressively prepare a genuinely transactional website enquiry adapter using the same scoped request storage and owner inbox, with verified published-site ownership, origin/auth challenge, anti-abuse limits, consent and privacy, idempotency and authoritative stored receipts. A new database write endpoint or migration requires separate review, isolated staging and owner approval.
2. Continue independent booking diary and payment confirmation safeguards, durable outbox/reconciliation, and operator-visible post-commit uncertainty handling.
3. Improve coordinated mobile/tablet/desktop website+app visual quality, actual screenshot comparison and a Business Brain learning loop informed only by verified outcomes.
4. Continue build-first substantial sweeps and cheap automated checks before the extensive paid/manual test phase; never claim an implemented-but-undeployed path works publicly.

**North star: You tell Busy what needs doing. Busy does it — and verifies the result.**
