# Architecture health — Mission 5

## Scope and provenance

Independent review of the accumulated private builder work in draft PRs #10 and #11, followed by seven functional sweeps on a branch depending on PR #11. GitHub predecessor head remains 348b60aa37f873a006382110cb2bc354270d22a3; both predecessors remain draft/unmerged. Product Master V22.18 defines ambition; the architecture and actual source/tests define current evidence. No production, provider, customer data, migration, paid build or deployment access; additional spending £0.

## Improvements

- One existing eight-entry website history, extended with encrypted continuity rather than a competing stack. Native store writes share the original App checkpoint's extracted queue. Rejected histories remain intact until a subsequent real edit; recovery never automatically replays mutations.
- Explicit website business provenance is assigned only on owner-created drafts or authenticated snapshot restoration. Foreign aliases are rejected. Unverified cached drafts cannot enter encrypted history, guarded commits or content-bearing asynchronous lanes. Read-only status/snapshot access remains possible to restore a verified draft. Cloud initialisation also checks an owner-scope epoch across awaited operations; previous-owner and owner-round-trip responses cannot assign a workspace or restore its website.
- Website command, selected, page, visual and connected-creation changes reuse the private commit/Undo boundary. Regeneration preserves public status. Deferred public approval is single-use and source-bound; no publication was performed.
- Original voice/language handlers extracted into a focused dependency-injected adapter. Original trusted transcript-only contracts, bounds, quota receipt checks and local replanning retained. No duplicate voice provider or command engine.
- Atomic coordinated style groups extend the original shared website layout engine. Finite appearance operations only, original owner lock checks, no nesting, no partial application, no content/brand replacement. Candidates reuse the existing measured width portfolio and approval path.
- One shared service-description matcher fills only unique, genuinely empty fields through original App/Website bridges. App transfer now enters the original encrypted Studio rather than bypassing its continuity lifecycle.
- App opinion identity is per attempt, not per permanent choice. One encrypted pending marker reuses the original server ledger key after uncertain confirmation and is removed only after verified completion. Changed-back opinions can become the latest decision. Website style feedback now calls the intended ledger handler and guards stale UI completions.

## Size and coupling

Tracked controller: 18,272 → 18,213 lines (-59); App screen: 5,283 → 5,288 (+5); Website screen: 1,601 → 1,626 (+25). These are maintainability indicators, not customer-quality proof. Focused voice/content/checkpoint adapters take related policy out of the oversized screens/controller. No dependency/package, schema, new database, model agent or competing builder added. Native website code still imports the canonical shared worker implementation, avoiding client/server helper copies for these new rules.

## Concrete remaining risks

1. **Hosted and native verification — high impact.** JWT/RLS/owner roles, concurrent database revisions, SecureStore capacity/process death, actual WebViews and end-to-end customer booking/enquiry outcomes require isolated staging/device evidence. Tests use fake transport/storage or fixture DOM and cannot substitute for it. Release requires explicit approval and compatible predecessor client/Edge code.
2. **Recovery capacity — medium/high.** Encrypted envelopes cap at 60,000 characters and native platforms may reject smaller records. Recent history is trimmed to fit; a draft or explicit point that cannot fit is not silently truncated. Device UI reports failure. This is bounded device continuity, not an unlimited cloud version history or recovery across all devices. Existing owner cache and authenticated cloud snapshot remain separate sources; only exact/immediate-predecessor recovery is accepted.
3. **Remaining large controllers — medium/high.** Authentication/cache/cloud-sync and creation orchestration still span a large controller. Domain/DNS/live-health error UI and full multi-business cloud selection deserve a future focused audit. Shared transport guards do not certify every product flow or all historical code.
4. **Feedback concurrency — medium.** A conflicting unknown App feedback attempt must be retried as originally reviewed or explicitly cleared; no automatic replay. Another app revision may establish a new intent. Native cleanup failure is returned as recoveryPending. Multi-device ordering and existing database uniqueness need staging. No retraining or commercial uplift claimed.
5. **Design evidence — medium.** Coordinated alternatives are industry/context hypotheses. The code can measure a rendered private DOM on supported devices, but this mission executed no real browser screenshot or physical-device acceptance. Publication is never authorised by offline scores.
6. **Legacy scope migration — medium.** Old website drafts lacking business provenance remain viewable but content operations require verified restoration/current owner build. Foreign cached drafts are not relabelled to bypass this requirement. Validate legacy-owner UX in staging.

## Verification boundaries

See the Mission 5 report and JSON check manifest. Every changed/new module was parsed. One ad-hoc parser command initially hit inherited Node child-process EPERM when listing files via git; supplying the same list from the shell allowed parsing without a security bypass. Historical source-marker assertions were updated to follow actual extracted/shared implementations; behavioural, privacy and malicious-input assertions remain enabled. No test was disabled. Full suite outcomes are recorded only after completion.
