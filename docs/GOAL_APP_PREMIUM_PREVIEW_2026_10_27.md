# Goal-to-app creation and premium homepage revision — 27 October 2026

## Authority and provenance

The genuine private V22.53 Word original was reopened, extracted privately and checksum-verified: `fa9456077fd843f1f04ea450d9e2ec425077695b6b106b91bf7cee150b727f62`, 2,254 paragraphs and 19 tables. Applicable original App Builder, Website Builder, shared business context, premium-preview and privacy requirements were reviewed. Sections 65–66 and existing six-area, voice and appearance decisions remain unchanged. Neither original nor complete extraction is in Git.

Repository `7774cg5t75-cloud/busy-does-it-app`; branch `codex/builder-mission15-design-advancement`. Starting clean local commit `36bc742be7d0ea03829aef404c1ab291a1065a25`, GitHub `22f8f2bd94ad575b5bcbf093b7e92da50877148b`, identical tree `1790e4962b66aa4799bca93b7b60283abb35217d`. Repository instructions, original source, preceding builder/Creator report and complete checks were inspected. PRs #21 → #23 → #24 → #25 → #26 were verified open, draft and unmerged; dependency bases and other heads were preserved.

Final functional local commit `2d14093302586a6781b9f3c6900aa99a06eda8ff`; equivalent GitHub functional commit `34781e6f532d2212cdc6d46f8ec5182c75c0d023`; exact functional tree `4865eeb5ad9dca4461d0eabdf3c2d0fa332881e4`. Subsequent evidence-only commits preserve that tested source. Local and GitHub histories remain additive to their respective original parents; equivalent trees do not imply identical commit IDs.

## Checkpoint A: an owner goal to a new private business app

New `goalToPrivateApp.mjs` adapts the original `inspectCapabilityIntent` and `planFunctionalBusinessApp` to the existing `build_draft` / `apply_app_plan` creation authority. It does not introduce a planner engine, database, app identifier or paid AI request. The new owner component in the original MiniAppBuilder lets the owner describe the outcome, choose one to six exact approved services, and review the business identity and supported customer actions before approval. Missing/ambiguous service identities, duplicate catalogue entries, unsupported requests and stale source are refused rather than guessed or silently truncated.

The original Brand Brain-derived `miniAppProfileDraft` supplies name, service descriptions, categories, contact and supported branding. Owners select existing facts instead of retyping them. Exact owner/business/profile/catalogue snapshots are reviewed again immediately before creation. This is source reuse, not a new Business Brain store or inferred approval.

Creation and configuration remain two distinct original saves:

1. Inspect authenticated original owner status; an existing app is never overwritten by this first-app path.
2. Create through original `build_draft` with `expectedNoExistingApp:true`; accept only its original identity/revision receipt.
3. Independently inspect the created app.
4. Apply the reviewed plan through original `apply_app_plan` with exact app ID/revision.
5. Independently reopen and compare the configured revision, services and enabled feature selection.

A failed later step does not delete the created app. Readback can report an observed app but cannot recreate a lost own-operation acknowledgement. No unknown write is replayed. An original source/account change invalidates continuation. Synchronous flight/uncertainty guards prevent stale double-click dispatch and block further mutation after an uncertain exception. The original owner-edit navigation/commit mechanism protects unfinished selections with Keep/Discard. An unrelated no-app-screen null-ID access was corrected.

The new card is a typed goal journey seeded from the existing owner build brief. Voice remains with the original Operator/planner route; a new live voice handoff into this card was not implemented.

This route supports a service-information/contact/gallery/enquiry app from the actual available catalogue. It does not enable booking requests, payments or other broader requested capabilities; the original broader planning surface remains separate. It supports an information-only app when the owner explicitly declines enquiries, rather than forcing every business into enquiries.

Focused verification exercises gardening, beauty and exterior-cleaning businesses with different service names, scope and customer actions. It executes the original functional planner and original server `applyBusinessAppPlan` body, independently reopens the result, renders the original MiniAppSurface, and performs an original finite Studio edit and exact Undo. The initial no-app MiniAppBuilder also renders. Original service/enquiry/FAQ editing and eight-operation continuation remain available after creation and are covered by the complete regression selection.

**Evidence boundary:** authentication, creation transport, helper dependencies and database I/O in these component tests are inert fictional fixtures. The original production source paths are connected, but this mission did not perform a hosted or real PostgreSQL app creation. The complete configured creation is not atomic, and deletion/Undo of app creation is not claimed; eligible subsequent Studio content edits retain original Undo.

## Checkpoint B: professional homepage orientation and reviewed private revisions

The existing private premium sample now supports deliberate owner revisions through the original finite Website Builder copy/layout operations. Owners can prepare a sample, inspect missing information, propose a headline or centred introduction, Keep the existing sample or Use the reviewed revision, and Undo the last sample revision. New typing, source changes and account switching invalidate stale callbacks. The actual account website draft remains separate and untouched.

The domain adapter also supports exact existing-service copy revisions and finite typography, spacing and hero-layout choices through the same original operations. The present owner component exposes headline and introduction-layout review; it does not claim a complete service/typography editing UI. Revisions retain historical supplied facts rather than silently rewriting their provenance. No media, review, qualification, price or trading history is fabricated.

Professional shared rendering improved through `heroServiceOverview` in the existing `websiteServiceIndex.mjs`. Both the editable renderer and original worker use it to orient visitors with up to three exact current service names, honestly labelled “Services include”. Hidden/empty/ambiguous collections produce no summary. Full service details and existing enquiry/contact links remain intact. Shared CSS adds balanced headings, readable lead text and a responsive service-summary rhythm using existing design tokens, with a single-column small-screen constraint. No extra image, remote font or model call is introduced.

Five fictional sectors—gardening, beauty, electrician, cafe and exterior cleaning—exercise actual original generated HTML, meaningful existing sector variation, shared service-summary output and original finite editing. The same normalised input produces the same HTML through the original paid-builder generation/rendering path. The original worker hero function is executed with inert asset resolution; source checks are not screenshots or visual acceptance.

The sample uses finite visitor-safe supplied facts, no private CRM/Brain projection, zero paid/provider requests, a 250,000-character HTML bound, four deliberate local revisions and a 30-minute local validity check. Expired samples refuse further revision and are hidden on a subsequent render/check. These are local UX/resource bounds, **not server quotas, account entitlements, durable expiry or abuse protection**. The inert WebView continues to disable JavaScript/storage and external navigation. No account sample record or public URL is created.

## Free-preview readiness and remaining gates

The owner-private sample uses the same underlying quality, generation and rendering components as the full builder. It remains a private session illustration. The approved visitor offer is not launched: no hosted endpoint, visitor provisioning, server-enforced spend/rate/concurrency limits, campaign budget reservation, deletion/retention lifecycle, account transfer or real visitor conversion measurement was added. Rendered mobile/desktop acceptance across the required varied scenarios remains outstanding. No screenshot/device quality is asserted.

No additional Creator storage or publisher feature was added in this mission. Existing encrypted device-intent, account v1/v2/v3, media and upload-operation recovery source remains intact. The concrete shared-context improvement is reuse of the original approved app profile/services in the new creation journey. Publisher workspace/business identity and public-use media rights remain unresolved and operationally closed.

## Fresh verification, unsuccessful candidates and corrections

Final frozen execution: **421/421 application children passed, actual outer runner exit 0; 105 foundation checks passed; health, ten-file parser and architecture checks exited 0 with zero static relative-import cycles.** Snack remains exit 1 as separately described. The temporary executor disconnect recovered with the same source and running process; the actual final exit was subsequently observed.

The companion CHECKS retains exact functional source/tree, clean initial/final worktree entries, every application child exit, actual outer exits, quality commands and artifact hashes. Only the final completed selection is credited as fresh application success.

Two strict website runtimes and the full-worker fixtures needed the newly introduced **actual shared helper** injected. Their exact source/import assertions remain; no dummy helper, removed assertion or weaker VM limit was substituted. An initial full candidate recorded 266 passes, 70 import-contract failures and 85 unexecuted children, outer exit 1. A second recorded 116 passes, two missing-helper failures and 303 unexecuted children, outer exit 1. The page-guide missing-helper counterexample also has actual child exit 1. Later runs were deliberately interrupted while correcting remaining fixture dependencies and approval-flight guards; their actual outer exit 2 and partial counts remain separate. All corresponding corrected focused tests passed before the final freeze.

An initial focused app example expected information-only behaviour without declining the original planner's default enquiry suggestion. The fixture was corrected to state the owner's actual choice (“without enquiries”); production intent semantics were not weakened. Its original assertion log is retained; the initial shell's trailing log command returned 0 and did not independently capture that node child's exit. Later focused and full invocations record actual child exits explicitly.

Foundation, parser, health, architecture and dependency checks ran against frozen source. Snack remains a separately known **exit 1 with 81 missing-import diagnostic lines**, not a pass. No paused preview/screenshot pipeline was restarted. Syntax checks cover source parsing, not native/Deno semantic or bundled acceptance.

No SQL, server permissions, RPC contract, app creation schema, media gateway, publisher or persistence API changed. PostgreSQL was not rerun; the prior 350 stages and 127 SQL-backed calls remain historical and are not fresh credit. New app integration evidence uses actual original function bodies with inert database/auth boundaries as stated above. The complete application selection preserves original privacy denials, Phase52 known-loss counterexample, unknown outcomes, source isolation, Studio continuation and compatible-field regressions.

## Architecture, security, performance and next work

Original live owner/business checks, independent app revisions, CAS, target-specific receipts, original Studio/Website Builder/Creator ownership, RLS and effective grants, fixed privileged paths, old-client fences, read-only retaining rollback, Phase52 evidence and V22.53 quotation protections remain unchanged. No generic writer, CRM, asset registry, publishing queue, new form engine or extra Home area was added. AppController contains a small source-ref/creation adapter; planning and workflow validation remain in a specialist module. Happy-path app creation uses three original status reads and two distinct original writes. Lost acknowledgements add at most an inspection, not a retry. Homepage revision is bounded local computation.

Additional external spending: £0. No hosted Supabase access, migrations, deployment, activation, uploads, provider actions, customer communications, publication, bookings, diary changes, financial/tax operations, screenshots, simulator capture or owner manual testing occurred. Every existing release/provider/customer gate remains closed.

Next substantial customer-value work: continue the newly created app directly into a guided original service-answer/enquiry review with clearer source-linked customer input explanations, and deepen private homepage editing through the same finite editor. Separately gated real authenticated creation/readback, native usability, lawful retention/erasure and visitor cost/privacy/rendered acceptance remain necessary before release. Broader app capabilities should be added only through their existing original catalogue and execution authorities.
