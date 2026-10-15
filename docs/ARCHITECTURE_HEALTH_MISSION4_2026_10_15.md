# Architecture health — Mission 4, 15 October 2026

Preflight: supplied Word Product Master V22.18, actual PR #10 patch and source, current architecture/development policy. Latest numbered branch v3.240; PR #10 was draft/unmerged at 91ca01a3. Preserve the fourteen prior reported sweeps. Review corrections and new functional work are separated into dependent draft PRs; neither is release approval.

## Review outcomes

Reproduced six groups of integration defects before correcting them: uncertain undo revival, incomplete profile/copy lock targets, omitted module enable decision, raced first-plan app adoption and sparse copy/services undo. Exact cases and runtime assertions are in the review report and two new regression suites. Client/Edge helpers remain byte-identical. New finite restore commands do not permit arbitrary profile replacement; owner lock changes are separate reviewed revisions.

The nine earlier EPERM blocks were test-composition failures, not failed customer functions. Audited packet generators now run through direct ESM composition. No sandbox setting, assertion, permission, migration or provider gate was removed. All acceptance packet flags remain false. The original 106-script baseline independently reproduced 97 pass / nine blocked; the reviewed 108-script set passes and the final feature set has 114 passes.

## Reused boundaries and selective extraction

- Saved business-fact comparison reuses the existing scoped public-profile record, original Studio planner, proposal binding, save CAS and encrypted recovery. It is not a second profile store or background synchronisation system. Missing facts can be selected; existing wording conflicts require explicit replacement. Normalised duplicate names and stale/foreign sources fail safely.
- Exact copy/service inverses reuse extracted existing service validation; parent absence/null and display tagline are preserved. There is no unrestricted whole-profile restore.
- Owner lock controls reuse the original endpoint and lock-ID schema, with a dedicated lock-only planner operation. Public/standalone projection still strips private owner lock metadata. New controls are extracted from the large screen.
- Website async scope/duplicate handling is an ephemeral gate around original transport and backup code, not a task queue or provider abstraction. Live identity, draft object and hosted scope are checked before/after awaits. An already sent upload/provider request is not undone by local cancellation.
- Measured website guidance reuses original WebView metrics, layout operations, feedback and width portfolio. Bounded section IDs improve attribution; no text/URLs are added to metric messages. Preview-only changes still require remeasurement and explicit Keep.
- App context guidance reuses industryOf/suggestionsForIndustry, current public facts, same-business website guards, original owner memory and responsive analysis. It adds at most one supporting hypothesis and preserves explicit owner styles/brand.
- Feedback mutations are extracted from two inconsistent controller closures into one scoped adapter over the original feedback validator/endpoints/unique request key. It does not create another Business Brain or ledger.

## Size, dependency and coupling evidence

Start → final functional source: AppController **18,272 → 18,272** lines; miniApps **5,270 → 5,283**; websiteBuilder **1,600 → 1,601**. Six sweeps were delivered with focused policy/components rather than substantial growth of these oversized files. They remain significant maintenance risks and should not be treated as solved by stable line counts.

New dependencies are existing local pure helpers or existing React/native components. No npm dependency, database schema, provider service or competing builder was added. New helpers have no back-import into the screens/controller. Shared Edge files are exercised by parity checks; the offline preview dependency graph resolves **334 modules** with no publication.

## Remaining risks and next priorities

1. **Client/Edge compatibility:** finite inverse/lock commands require coordinated staging validation. No server or client was deployed. Old clients fail closed where newer revision arguments are required.
2. **Native/browser lifecycle:** process-death SecureStore persistence/capacity, touch/keyboard usability and actual clipped-heading DOM measurements need real devices/browser acceptance. Fixture DOM and injected transport tests are not those proofs.
3. **Hosted security/concurrency:** actual owner/admin JWTs, tenant RLS, conditional writes, raced inserts and durable feedback uniqueness remain unverified on isolated staging. No live database/customer data was accessed.
4. **Remaining historical async routes:** hosted publication, older voice flows and ZIP-sharing/account-state workflows still need separate source-scope audits. This mission guards reviewed visual requests and original backup, not every asynchronous controller action.
5. **Content provenance:** the new normal refresh UI preserves app wording by default and stages supported selected fields. The older explicit backend rebuild still refreshes approved public facts; a universal field-level merge of every business/profile/media property is not implemented.
6. **Owner lock UX:** App controls are implemented. Comprehensive website lock/unlock controls and an audit of unsupported legacy opaque IDs remain future work. Locks are editing constraints, not authentication.

Next substantial work should combine separately approved isolated staging/native restart validation with remaining async route extraction, richer supported fact/media reconciliation and website protection controls. Keep the original engines and preserve truthful outcome evidence. No production approval, deployment, paid build, provider use or additional spending is implied.
