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

## Sweep 4 — source-bound cloud restore approval and save/restore coordination

Restore now consumes a single-use confirmation for the exact owner, business, cloud revision and local payload reviewed by the owner. Local edits while the dialog/read is open, workspace changes, foreign receipts, older cloud revisions, unsupported schemas and foreign embedded website scope prevent replacement. Restore and save share the existing snapshot session's in-flight exclusion. A successful read establishes an observed no-op baseline without writing back immediately. Removed the redundant restore-specific raw cache write; the existing local persistence effect owns persistence. A malformed local snapshot now fails preparation safely instead of rejecting outside the save error handler.

New regression executes the actual session: one-use tickets, read-only transport, changed local data both before and during reads, owner changes, invalid snapshots, duplicate operations, save exclusion and post-restore no-op suppression. Controller wiring asserts the confirmation ticket is actually passed. No hosted business data was accessed.

## Integrated review and remaining gates

The four sweeps reuse the original Studio, encrypted checkpoints, Website history/gate and authenticated business snapshot REST boundary. No new storage, AI agent, database, migration, dependencies, background service or owner permissions were added. Snapshot logic and legacy domain handlers now have focused independently testable modules; the controller remains oversized and needs further careful extraction. Existing recovery/checkpoint and client/Edge parity tests remain in the integrated suite.

Release gates: authenticated staging concurrency/RLS; native restart and encrypted-storage lifecycle; real browser/tablet/mobile accessibility and visual checks; actual owner preview/approve/save/reopen/undo journeys; hosted preview/domain/provider integration. Tests here exercise real local modules with fixture transports and static/native parsing, not these environments. No code is approved for production. The new finite image restoration operation requires a compatible trusted Edge deployment before enabling it in a released client; old servers fail closed and old clients remain supported by the new planner.

Remaining investigation: the wider legacy owner-level cache has no general business-envelope migration; do not treat this mission's scoped restores as proof all cached data is fully business-provenanced. More Business Brain capability decisions, coordinated responsive design improvements and owner feedback remain valuable next sweeps. No private master changes made. Any staging/deployment/provider/device access with separate authorisation requirements remains a separate owner decision.

Final integrated local verification: **129/129 scripts passed**, zero failed and zero blocked. The inherited 124 plus five new functional regressions ran through Python subprocesses using available Node tooling; no child-process security settings were changed. Shared client/Edge modules are byte-identical; native syntax and whitespace checks pass. Historical EPERM limitations are not asserted to remain blocked when these permitted checks now execute successfully.


## Final integration correction and code-health review

After the four functional sweeps, declaration-order inspection found an inherited startup defect: two immediate render expressions used `cloudWorkspace` before its lexical declaration. The new regression fails on the actual predecessor controller and passes after moving that existing state declaration earlier. It audits immediate lexical references throughout App and executes the actual affected scope-initialisation statements with local hook fixtures. This is stronger than syntax-only coverage, but is not a complete React Native render or device test. Do not count this small repair as another substantial feature sweep.

Final final-source suite: **130/130 passed**, zero failed, zero blocked. Six new scripts supplement the predecessor's 124. The earlier 129-check checkpoint preceded this newly discovered/fixed defect. The predecessor regression failure is intentional reproduction evidence, not an outstanding failure.

Code-health review: the shared finite planner remains byte-identical between client and Edge; new restoration routes cannot bypass locks/URI approval. Snapshot restore consumes an exact-source ticket and only reads the existing API; no automatic retry or remote overwrite is added. Domain actions retain the trusted publishing request's owner/business checks and use existing gates rather than new state queues. Controller size remains approximately 701 KB despite extracting domain handlers; further scoped extraction and a real initial native render are priority follow-ups. The legacy owner-level cache provenance limitation above is unresolved and must be assessed before release.

Final approval-boundary correction: the exposed internal restore entry point now redirects ticketless calls to the owner confirmation dialog instead of creating a ticket itself. The Settings route already confirmed; the added assertion protects all internal callers. Targeted restore, render-order and native syntax checks pass after this correction.
