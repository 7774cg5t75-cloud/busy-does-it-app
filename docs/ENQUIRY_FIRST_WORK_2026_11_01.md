# Enquiry-first private Work and owner operational App preview — 1 November 2026

Source-level development only. No hosted SQL, public activation, customer communication, job acceptance, booking, payment, provider call, signing, publication or merge occurred. PR26 and its original dependency chain remain draft/open.

## Source and authority

Starting remote report `d12624e95541388812de8875fa08f6afeb9e941f`, tree `550312c8228d8d1b2c0d0ba912815185819ca4da`. The previous functional `7f08f873d82f6251e57d255b5b4ecb362cf3e60b`, tree `93def3fda2243b68cc73215869d7355418d406df`, is preserved.

Functional commit `946d66f7a5462e3cdd7f4b4d5ce3e101914eb0f1`, tree `4e9f98bc8f968973e7017a74d2bbf88579e6152b`. Local metadata equivalent `6e242262b1dc338af4b8c9d4cbb537f1837558ba` has the identical tree; starting local equivalent `b0946de45fae469015e33d26a8ad0b6080db82d0` matched the starting remote tree. Any corrected implementation/report commits are identified in the final delivery and machine evidence. Report commits are additive documentation-only children, not self-referential hashes embedded in their own bytes.

Genuine private Master22.73 was reopened and reviewed: SHA256 `23793f82b471328bdd216897c212999a430652e19228fcb221a8ee16a7ddc272`,2,904 paragraphs/19 tables. Relevant connected Work/customer/builder, shared intelligence, privacy/security/cost and continuity requirements and root architecture/workflow policy remain authoritative. Private bytes/extraction remain outside Git; no general historical audit was restarted.

## Enquiry-first capability

An owner can use “Help me organise this work” on an exact original filed enquiry in the original Customer/Work panel. They no longer need a placeholder quote. The same finite preparation editor creates materially different catering, gardening and creative-project plans; owners can add/remove/reorder stages and tasks, change wording, check private progress, review/save, close/reopen and deliberately Undo. Supported corrections include adding a preparation stage, moving one stage before another, removing a uniquely identified task, marking a private checklist, and showing outstanding items. Ambiguity, unknown targets and automatic business actions are refused. Finite recognition is not general AI understanding.

Every write requires an exact copied proposal, one-use owner approval, current scope, CAS and original readback. Cancellation/stale callbacks cannot authorise a save. Unknown writes stay uncertain and are never replayed automatically; inspection remains an observation, not reconstruction of a lost own-operation receipt. Reopening from a new session independently reads the actual stored plan and its checked state.

## Canonical authority and lifecycle

Original `business_work_engagements` is quote-only, with immutable identity/status/schema invariants and one quote per exact enquiry. Weakening those constraints would make old quote readers unsafe. The new separately fused proposal instead adds `busy_work_private.enquiry_preparations`, a narrowly typed child of the ORIGINAL private Work authority keyed to exact business/owner/customer/filed-enquiry identity. It is not a job database, CRM or general workflow store. It records finite private planning, original historical source evidence, reviewed hashes/revision, five Undo entries and up to512 unique lifetime operation nonces. Its UUID is explicitly a preparation identity, never a fake quote ID.

The existing authenticated `busy-mini-apps` owner boundary and `workPreparationService` reuse the ORIGINAL source-review RPC under the verified user's JWT. Only then does the service-only enquiry RPC read/write the plan. Membership/snapshot locks, exact source CAS, a source-scoped advisory lock and private-plan CAS protect creation, revocation, progress and duplicate prevention. Client IDs select a source; names, contact similarity, hashes and customer assertions never grant authority. Raw service/customer table grants remain closed.

The independent server flag is absent by default and both original/new SQL gates must be open under later separate authority. New tables use private schema/RLS with no raw grants; routines have protected search paths and explicit owner/grants. SQL is a separately reviewed proposal with independent install/retaining-rollback fuses and hashes, not an automatically installed migration. Tests use an owned no-TCP disposable clone of the original synthetic form→Inbox→Customer database; they do not read or mutate hosted data or provision real Auth.

A changed eligible customer/enquiry source reopens with a source-review warning. Saving/editing is refused until an explicit source-review approval. Keeping the plan against that reviewed source changes the reviewed hashes/revision, not original historical questions/customer wording or unrelated records. Malformed, withdrawn, reassociated or revoked source authority remains unavailable rather than manufacturing a replacement. A global stale snapshot ticket is also denied even when the relevant content is otherwise unchanged.

## Quote continuity without duplicate progress

Existing quote-only preparations keep their original route and contracts. A later Prepared quote can explicitly continue the original enquiry plan through the same editor and exact quote/source checks. There is no copy, automatic conversion, fabricated acceptance or durable quote reassociation. A source-scoped wrapper around the original finite quote writer refuses a second mutable plan where enquiry-first progress exists; the retained raw implementation is not service-callable. Conversely, an existing quote plan prevents creating competing enquiry-first progress. A minimal owner-only continuity marker survives retaining lockdown without exposing plan contents, preserving old quote reads.

The quote reference checks business, creator, customer, enquiry, source fingerprints and exact quote revision. Stale/foreign/unrelated references are refused. No job, booking, issued quote, invoice or payment is inferred from private progress or a later quote.

## Owner-only App operational screen

The original App Studio mounts `OwnerOperationalPreview`; the customer MiniAppSurface does not. The owner selects an exact eligible filed source, reviews the intended private view, then sees its current preparation stage, outstanding/checked tasks, source state and a route to the ORIGINAL Work panel. Updates still use that original editor/authority; screen configuration cannot write progress.

The server reuses the existing finite private App-owner reader and independently checks exact App/revision plus exact plan/revision, current source and owner membership. Foreign/stale App references fail. Source/account/App changes invalidate cached views or require renewed review. Customer-facing App configuration is independently checked unchanged after preparing the private view; no private plan, source metadata or executable capability enters public config/HTML or distribution.

Important limit: the operational view binding is deliberately session-only and separately reviewed, not a saved App-screen placement. The underlying Work plan is durable and can be independently reopened; after closing Studio, its view must be selected/reviewed again. No new durable App-binding contract, renderer engine, public screen type, Home tile or assistant was introduced. Unsaved App layout/wording is not replaced by this private view.

## Three original component/authority journeys

All records and identities are fictional. The prerequisite uses the real original guest request, Inbox import, Customer filing and canonical source-review contracts. The new test clones that disposable database before any quote creation and asserts that all three preparation saves/reopens still leave the canonical quote table empty. React/native boundaries are inert component fixtures, not pixels or physical devices; SQL roles/functions are real PostgreSQL transactions.

| Business | Distinct workflow and actual behaviour |
|---|---|
| Catering | Requirements, catering considerations, equipment, owner review. Owner reorders equipment, adds a task, checks progress, reviews/saves/reopens; private App view shows exact remaining work. No festival, food order or payment. |
| Gardening | Request assessment, materials, preparation and next steps. Source/customer change invalidates the old ticket; explicit fresh source review preserves the original evidence and exact plan. No accepted job, purchase or binding quote. |
| Creative/project brief | Requirements, supplied content, design review, approval questions. Plan remains tied to the original brief through reopening; deliberately lost acknowledgement is independently inspected with one write and no replay. No website publication/customer approval/provider operation. |

Additional tests exercise true simultaneous PostgreSQL progress writers, exact Undo, foreign owner/customer/source/App, public/raw privilege denial, malformed/duplicate/action-bearing plans, revoked membership, corrupted original source, later exact quote reference, quote-side duplicate refusal, stale App revisions, immutable source history, retaining rollback and zero booking rows. The previous quote-only component/PostgreSQL suite remains in the same final workflow rather than being replaced.

## Verification

Final GitHub Actions run [41360544391](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41360544391) succeeded on the functional commit/tree above. Downloaded artifact13105676695 was checked against GitHub SHA256 `68f1fa659f6a720b2790bb0cd3694d3c3ea405a1aa189d54ee604841c641fc4b` before reading its evidence. The application report independently records the same initial/final SHA/tree, clean initial/final tracked source, and `sourceStable:true`.

| Verification | Observed result / process exit |
|---|---|
| Complete application selection |478 passed,0 failed/blocked/unexecuted; every child exit0; runner exit0 |
| Original disposable PostgreSQL |99/99; exit0 |
| Original customer forms/Inbox/Customer PostgreSQL |21/21; exit0 |
| New enquiry-first PostgreSQL |13/13 stages; exit0 |
| Existing quote-only preparation PostgreSQL |12/12; exit0, original route unchanged |
| Original Edge/Deno |25/25 checked; exit0 |
| Foundation |105 assertions; exit0 |
| Syntax, architecture, security baseline/by-design, dependency guard |exit0; baseline970 source files/557 locked nodes, not a registry vulnerability audit |
| Unsigned Owner Preview iOS/Hermes export |1,541 modules; exit0 |
| Unsigned isolated-staging iOS/Hermes export |1,600 modules; exit0 |

Autolinking includes Expo Crypto57.0.4 and Secure Store57.0.4. Exports/autolinking are not native-device acceptance. No package/lock update or new registry audit was performed. The preceding verified dependency evidence retained31 low affected nodes in one deepmerge family; the reviewed actual-entry backport/guard still passes. No advisories were suppressed or declared clean.

All six restored legacy workflows independently succeeded on this same functional SHA: [Growth3.63](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41360548867), [Growth3.65](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41360548905), [Founder3.69](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41360548894), [Platform3.70](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41360548857), [Voice3.66](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41360548909), [Workspace3.64](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41360548963). These observed passes do not assert completion of unrelated PR or release acceptance.

The companion checks JSON preserves all478 child IDs/arguments/status/exit codes and actual PostgreSQL stage results. No CI failure was suppressed or corrected in this frozen run. The two unsuccessful local environment attempts below are retained separately; prior-mission failures remain in their original reports.

Local PostgreSQL startup exited1 because the sandbox could not bind its private Unix socket (`Operation not permitted`); process startup itself worked. No security control, TCP route or hosted access was bypassed. Real final database verification therefore uses the permitted disposable CI environment. Local core, syntax, original parent/continuation,105 foundation assertions, architecture, security and dependency guards passed. One sandbox-enabled Playwright launch exited1 because Chromium was absent; no repeated download/bypass or synthetic screenshot was substituted.

## Readiness and next bounded steps

This is useful durable owner-private preparation, not a real operational job lifecycle or activated customer workflow. The eight-stage/twelve-task limits, five Undo snapshots and512 successful-save/Undo/source-review nonce lifetime remain; readonly App previews do not consume writes. Small one-off enquiries fit the exercised scope, but long-running/high-edit preparations can exhaust512. There is no silent recycling/reset. A future lifecycle would need explicitly reviewed immutable archived generations, one CAS-controlled active successor, generation-bound receipts and retained non-replay protection before raising ordinary-use capacity.

Next: add a reviewed durable private operational-screen binding through the original App authority, keeping customer publication separate; extend useful owner-led finite progress views around actual source records. A real job lifecycle would need its own original canonical typed record/status/acceptance authority, verified association to the enquiry/quote, explicit owner/customer commitments where applicable, revisioned transitions, receipts and privacy/retention. Staff access, communication, booking, invoices, money, providers and generated execution each still require their own approved tools and acceptance; a checked item grants none of them.

Hosted JWT/RLS/PostgREST, schema installation/rollback, real ingress/privacy/retention/erasure, native/browser rendered UX and appropriate independent release assurance remain outstanding. No manual owner device testing is requested. Existing App/Website builders, forms/private artifacts, protected receipt recovery, six-area Premium Midnight/orb experience, native crypto, guarded deepmerge install and central AI cost gates are preserved.
