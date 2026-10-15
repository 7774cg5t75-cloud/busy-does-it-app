# Mission 6 — reliable connected owner outcomes

## Preflight

Start from codex/pr12-permanent-instructions, remote ecd2d70e9543143e948b87fcab810fe3bd744a3e (matching local tree ec4bf8dd). Actual GitHub PRs #10/#11/#12 remain draft/unmerged at their recorded heads; latest numbered branch is v3.240. Read standing instructions, public master-access/brief, current architecture, policy and prior implementation/evidence gaps. The private supplied Word V22.18 remains accessible with the manifest checksum; relevant recovery, business-memory and coordinated-design requirements reviewed. No successor supplied at preflight; owner was asked asynchronously. Public guidance is not the private master. No private master material is committed.

Baseline: all 124 predecessor offline scripts pass. Work is isolated on codex/builder-mission6-reliable-outcomes and will depend on the instruction branch, not overwrite predecessor PRs. No hosted access, production/customer data, provider/paid work, deployment or schema execution. £0 additional external spending.

## Sweep 1 — existing business snapshot save reliability

The original authenticated REST/CAS route now has a focused session adapter: synchronous duplicate protection, exact business/revision/payload receipt checks, no-op suppression for already observed copies, and live owner/business identity checks before and after asynchronous work. A lost confirmation permits one read-only observation and never replays PATCH automatically. Matching observed state is labelled as such, not proof this attempt saved it. Unresolved uncertain saves pause automatic syncing. A confirmed earlier snapshot can advance its cloud revision while explicitly retaining newer local changes, which are scheduled for another save. First creation uses ignore-duplicates and reads the winning row rather than merge-overwriting a concurrently created business snapshot.

Tests: actual adapter with fake REST verifies CAS filters, duplicate/no-op behaviour, owner switches, mismatched receipts, lost confirmation, one observation and newer local work. Actual initialisation handler verifies a raced first creation adopts the existing revision without replacement. Existing owner-race and native parse checks pass. Current Supabase documentation was consulted for filtered Data API/RLS semantics; no new API, database or policy was introduced. Hosted RLS and true database concurrency remain unverified.

## Sweep 2 — guided App content completion and exact image-description undo

The existing goal assistant can now prepare a first owner-written service when an enabled Services section has none, and ask for useful accessibility descriptions for up to three approved photos. Existing service content, image URIs, approvals and captions remain intact. Preparation still feeds the original private Studio preview, approval and revision-controlled save; it does not publish or invent business facts.

Fixed a real inverse defect: photo descriptions with explicitly null fields previously returned as absent fields after undo. A finite description restoration operation now preserves absent/null/empty values exactly, enforces the original image identity/approval/locks, and is identical in the client and trusted Edge planner. Older servers safely reject the new operation until a compatible staged rollout; no deployment performed.

Passed actual planner regressions: guided completion, exact undo/redo and Edge parity; existing goal content, design iteration, intelligent Studio, profile undo and native syntax checks. These are offline tests, not rendered accessibility, device or hosted journey evidence.

## Sweep 3 — Website domain/status operation isolation

Extracted the existing domain request, verification, provision, DNS diagnostic and traffic-status handlers from the oversized controller into a focused adapter. They retain the original authenticated publishing request and provider contracts. Hosting actions now reserve the existing gate synchronously, check scope after asynchronous steps, suppress foreign-workspace errors/cleanup, and stop delayed read-only polling when the reviewed draft/workspace changes. DNS diagnostics cannot return a switched-workspace result. No provider action was executed during development.

The new fake-transport regression executes these actual handlers for duplicate actions, successful paths, workspace switches and obsolete timers. Integrated suite at this checkpoint: 128/128 passed, zero failures or blocked checks. Hosted domain/provider behaviour remains unverified; existing runtime provider capabilities are unchanged.
