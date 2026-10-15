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
