# Mission 3 — connected builder completion

## Verified starting point and dual-master preflight

All numbered V3 branch pages were checked: newest remains v3.240. PR #10 is draft, open, unmerged and mergeable at 2254f6378d88000d40ce09e0a6e35fb85bb7613f. Its actual patch and latest commit were fetched. The local starting tree 7658fc8a265a2ab8f795aa9c628704bd1e07359b is the exact previously verified remote tree, preserving all eight prior sweeps. Work continues on dependent local branch codex/builder-mission3-2026-10-15; tested commits are transferred to the existing PR branch with an expected-head lease, not merged.

Rechecked supplied complete Product Master V22.18, architecture, permanent development policy and prior limitations. Relevant product priorities: App Builder first; one Business Brain and Brand DNA; simple owner review; exact undo; restart/interruption recovery; marketplace/standalone reuse; website responsive checks. Product intent does not establish delivered or hosted functionality. No newer Word master was supplied. No new product vision or commercial decision is introduced.

## Sweep 1 — encrypted App Studio continuity

Extended the original ephemeral Studio session with a small SecureStore adapter using the existing encrypted private-device storage contract. Proposals and confirmed undo are scoped to signed-in owner/business/app and exact revision/configuration. Restored proposals are recomputed through the original planner; stale sources do not apply. A durable submitting marker is awaited before the only network mutation. Unconfirmed saves/undos restore a warning, never replay, infer success or invent undo authority. Owners can refresh the current app and prepare a new reviewed proposal. Storage failures block submission and show an explanation.

Scoped native writes are serialized across same-scope remounts. Bounded seven-day checkpoints fail closed on corrupt, foreign, future or oversized records. No tokens are stored; public exports and existing backend persistence are unchanged. Confirmed inverse operations are still owner-approved CAS changes, not rollback of published state. SecureStore capacity varies by platform: failures are surfaced, not bypassed with unencrypted fallback.

Verification: new simulated-storage/transport tests cover restored proposal/undo, stale revision, actor changes, durable-before-write intent, lost confirmation/no replay, unavailable storage, bounded records and serialized writes. Existing Studio lifecycle, private save/recovery and native/Edge parse pass. Real SecureStore limits, app process restart and hosted customer journeys remain unverified.

## Sweep 2 — shared lock invariants across existing editing routes

A single pure website result guard now protects owner-locked sections across the existing voice, structured copy/collection, page and layout entry points. It rejects direct edits, hiding/deleting, indirect position changes, page membership/title changes affecting locked sections and global theme changes. Malformed locks fail closed. Unrelated unlocked copy remains editable. Measured recommendations reuse the same operation guard. No second editor or permission system was added.

Direct App service-list and gallery-description helpers now enforce the original app lock policy too; the corresponding Edge copies are byte-identical. Tests exercise supported operations unlocked first, then require the same operations to fail when locked, preserving original input exactly. The historical V3.133/134/135 website suites and V3.102 edit-freedom suite pass, as do V3.162 gallery/design and native syntax checks.

An extra historical V3.158 suite exposed an already stale source assertion: request-bridge protection moved from inline code to the V3.180/181 atomic database functions. The test now checks the actual RPC chain and SQL guard, and executes the existing pure preflight changed-action-ID rejection rather than looking for a removed inline spelling. Its original safety contract remains enforced; this was not an application regression or sandbox block. Supabase changelog fetch was blocked by the existing shell proxy connection failure; no Supabase SDK/API/schema feature was changed, only existing pure helpers, tested offline.

## Sweep 3 — preserve app composition and guard every existing draft write

Inspection found that module toggles rebuilt navigation in catalogue order and updated without a revision predicate; rebuilding business facts dropped presentation, the prior plan, offers and loyalty. The original buildConfig now retains those owner design settings and reconciles existing navigation with enabled modules. Explicit replacement plans keep their new plan/offer/reward settings but also retain surviving navigation order. A common pure config lock invariant rejects protected profile/copy/services/gallery/navigation/module changes during rebuilds and plans.

Module toggles use a shared client/Edge planner, keep relative order, preserve appearance and reject any displaced locked section. Trusted toggles, existing-app rebuilds and replacement plans require the caller's exact app/revision and condition database writes on business and revision. The five existing controller draft-write routes (module/rebuild/plan/move/appearance) share a synchronous in-flight guard and current-owner/workspace response checks. Finite edits also compare returned configuration against the original planner. There is no automatic replay after uncertainty.

Approved public business facts are intentionally refreshed by the explicit rebuild action; this does not introduce an automatic merge of arbitrary public copy. Locked facts fail closed rather than being silently replaced. Existing first-app creation paths remain separate. Client/server updates must be released compatibly; no server was deployed here.

Tests cover retained settings, stable enable/disable order, indirectly shifted locks, changed-profile lock rejection, foreign/stale receipt rejection and byte-identical helpers. The actual TypeScript setModule function is transpiled and executed against an injected fake DB to verify that stale versions cause no write and the conditional update includes app/business/revision. Parser and dependency graph checks pass. These are local simulations, not live database concurrency or customer evidence.

## Sweep 4 — fewer, task-relevant and content-grounded decisions

The existing goal-design reviewer selects from the original responsive suggestions by the chosen customer task. Gallery changes are reserved for the photo goal; service readability and actionable navigation take priority for their goals. Supported alternatives introducing any new static width advisory are excluded. Existing scoped owner-feedback filtering runs first; final edits use the original planner/Studio.

A services/gallery goal with missing service names or no approved usable photos gives concrete content setup guidance instead of cosmetic alternatives. The UI explains each included choice's purpose and trade-off. This is deterministic public-config reasoning, not measured conversion or model retraining. The shared same-business draft-pair guard checks both camelCase and snake_case website tenant fields across Brand DNA consumers.

Tests cover task ranking, irrelevant-choice suppression, missing/unapproved content, rejected static regressions and conflicting tenant aliases. Existing goal editing, feedback, V3.240 intelligence and native parser checks pass. No AI call, customer record, service activation or additional design engine. One shell process creation was interrupted by an exec-server disconnect; the runtime reported connected/running on recheck, and work resumed without changing protections.

## Sweep 5 — scoped website history and monotonic recovery

The existing eight-entry Undo/Redo stacks and session recovery point are extracted into one small scoped history store and React adapter. Owner/business/website changes immediately expose empty history; callbacks from an old scope cannot update the new stacks. Recovery points are cloned and bound to actor/business; explicit foreign tenant aliases are rejected. No persistent website checkpoint or duplicate history engine was added.

Undo/Redo now reuse the existing recovery/rebuild path and advance the current generation rather than restoring an old number. This prevents an old reviewed generation from becoming current again after Undo. Public status belongs to the current account and is preserved. Synchronous ref checks reject repeat taps before render. Recovery obeys existing owner section locks. The legacy domain voice fallback and shared service-copy handoff also use the same lock guard; these routes previously sat outside the worker editors.

Tests execute the actual controller Undo handler with the real domain rebuild, checking monotonic generations, repeat taps, obsolete scope callbacks, unchanged public status, foreign scopes and locked voice/shared-copy paths. The shared website test harness explicitly imports the real new guard; its import allowlist stays enforced. Historical recovery, edit-freedom, native parsing and the 326-module offline preview graph pass. No preview was published. Restart persistence of website Undo/Redo is still absent; checkpoint persistence was added only to App Studio this mission.

## Sweep 6 — shared website commit boundary and final recovery corrections

The existing reviewed-website commit path now validates exact live source identity, current history scope, website ID, monotonic generation, tenant aliases, unchanged public status and owner section locks. Rebuild, literal copy, layout and page controls reuse it rather than separately recording history and replacing state. Existing cross-builder handoffs receive the same final guard. The ref updates synchronously, rejecting a second event from the same render. Other historical voice/publishing/media workflows remain separately scoped systems and are not claimed to have been comprehensively rewritten.

Final App Studio review reproduced a recovery integration gap: the screen's revision-reset effect calls prepare(null) after a successful save, changing checkpoint phase while retaining exact undo. Restore now accepts a source-bound confirmed inverse in a review checkpoint too, so this effect does not lose restart undo. The pre-network session guard also rechecks the exact proposal after awaiting encrypted storage. No success or undo is inferred from an unconfirmed receipt.

New tests execute the actual website commit handler, its immediate ref update, duplicate-event rejection, protected status/lock/scope checks and the real Studio prepare(null) revision effect before restart. Existing lifecycle, recovery, parser and 327-module dependency checks pass. This provides local functional evidence only; native lifecycle, platform storage capacity, hosted auth and database concurrency remain release gates.

## Final verification, review corrections and continuation

**106 offline check/preparation scripts: 97 passed, nine blocked_environment (inherited child-process EPERM), zero unresolved assertion failures.** Exact script results are in `BUILDER_MISSION3_CHECKS_2026_10_15.json`; logs remain in the task workspace. Affected checks were rerun after final review corrections. Native/Edge parsing and offline preview closure (327 modules) pass; nothing was published.

Final review reproduced and fixed a lock false positive: layout/voice cloning inserted empty item arrays into untouched sparse sections, making an unrelated edit appear to change locked content. Cloning now preserves absent fields. The new regression checks both locked protection and successful unrelated edits. Rebuild composition also preserves existing schema/surface identity alongside design settings; a regression verifies no schema downgrade. Four historical website source-marker suites now inspect the actual shared history push and guarded commit boundary; they retain original functional assertions and gain guard-wiring assertions. Earlier App source checks likewise follow the extracted original transport. Tests were not disabled or relaxed to bypass security or environment restrictions.

No hosted business functionality, real customer records, physical-device UX, native SecureStore process death, browser timing, live RLS/CAS concurrency or provider delivery was verified. These remain separate release gates. Additional external spending: £0. No deployment, publication, protected-branch merge, paid build or live migration was performed. Pre-existing untracked .expo/ and node_modules/ are preserved.

Next valuable sweeps: conflict-aware refresh of unlocked owner-edited facts using existing provenance; scope auditing/extraction of remaining asynchronous website media/hosted-review/voice paths; integrated lock/unlock UX; and separately approved isolated staging/device validation across marketplace/standalone routes. Any deployment, paid provider/device build, live data access or production action still needs separate authorisation; further ordinary offline source work does not.

Final first-app edge-case correction: the existing first reviewed-plan path creates an initial draft and then conditionally applies the plan, legitimately returning revision 2; first plain build returns revision 1. The extracted receipt guard now distinguishes these original contracts. New tests accept each exact first revision and reject unexpected later revisions. The affected composition, native/Edge parser and 327-module graph checks pass after correction. No first-app operation or external provider was actually executed.
