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
