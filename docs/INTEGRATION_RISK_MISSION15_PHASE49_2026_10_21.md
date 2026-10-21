# Mission 15 Phase49 — bounded draft-PR integration-readiness review

Read-only GitHub PR metadata, complete recursive blob trees (not truncated), base/head comparisons, current specialist source and existing regression contracts were inspected. No merge, rebase, cherry-pick, branch rewrite, dependency-branch update, migration execution or workflow dispatch. This is a risk assessment, not a merge-conflict rehearsal or production-readiness declaration. Exact refs, paths, overlap sets and graph evidence are in the adjacent JSON.

## Actual graph and overlap

At preflight all five PRs were open/draft/unmerged. Each head was ahead of its current base with **zero commits behind**; merge base equalled the base head. This is a linear dependent stack at the inspected refs. Shared files are expected sequential edits, not proof of present textual conflicts.

| PR | Changes against actual base at initial inspection | Commits ahead / behind | Incremental migration files |
| --- | --- | --- | --- |
| 26 | 629 files; 632 at final frozen Phase49 functional head dd13d23ee2d51e9c818a9b6aa4716a6a316bb9e1 | 373 / 0 at initial inspection; four functional checkpoints followed | 0 |
| 25 | 27 files | 4 / 0 | 0 |
| 24 | 34 files | 5 / 0 | 0 |
| 23 | 43 files | 5 / 0 | 0 |
| 21 | 18 files | 11 / 0 | 0 |

PR26/base25 share 17 changed paths; 26/base24 16; 26/base23 21. PR25/24 share7, 25/23 share6, 24/23 share14; PR21 has no changed-path overlap with these four. Counts are pairwise incremental path intersections, not lines in conflict. Documentation-only Phase49 evidence later adds paths without changing frozen application/test source.

Highest-risk shared surfaces:
- AppController and original builder/mini-app parents: state, navigation, scoped snapshots and approval guards. Preserve later descendant implementations when reviewing ancestry; do not copy older files over newer ones.
- Core/Edge/worker/standalone businessContentRecords and businessContentHtml: public projection, approved revision, option identity and catalogue boundaries must deploy compatibly.
- Core/Edge ownerConversationPreparation and ownerFollowupReadbackV3235: private preparation must remain distinct from approval and delivery.
- appCoordinatedStudio, appPublicCollections, standalone App/nativeCustomerActions: shared owner edit/source contracts and marketplace/standalone parity.
- Offline fixture runtime, standalone preparation and pinned lockfiles: keep extracted original-parent fixtures bound to current real helpers; install no replacement dependency tree just to hide breakage.

## Schema and rollout prerequisites

No production migration or schema SQL is added by the inspected PR diffs. PR21 changes only its existing disposable-review workflow/tooling/staging SQL among SQL paths. This does not prove a clean hosted database already has the inherited tables, functions, grants or RLS.

The inherited supabase/schema/business_content_records.sql explicitly says PREPARED ONLY: its catalogue table, published revision and trusted-Edge grants require separately reviewed migration generation and isolated staging before rollout. Existing request/Work migration function dependencies and service-role restrictions must be inventoried in their actual chronological and function-call order; file naming or this stack order alone does not establish installation.

The current client uses the original authenticated busy_business_snapshots REST/CAS contract. This bounded search did not find its DDL in tracked SQL files; establish the authoritative provisioning and membership/RLS/revision enforcement source before any hosted release. Do not invent it through client guards or silently create a replacement table. Generic CAS checking does not establish server source approval, publisher exactly-once claims, revoked-media safety or provider receipts.

## Mixed-client/private-field risk

AppController buildPersistentSnapshot constructs the known payload; businessCache completes defaults while retaining supplied fields. Current customer/private reply and socialDrafts/contentEvidence remain inside original snapshots. The authenticated session conditionally PATCHes a complete payload and verifies exact returned payload/revision/schema; its unknown-outcome branch reads once, does not retry, and does not mint an own-save receipt.

An older client that loads a current revision but serializes only its known fields could still drop new private reply/source metadata, reintroduce previously removed data or overwrite compatible new fields. CAS prevents stale revision writes; it is not a capability/version retention fence. Field preservation by current fixtures is not old-client or hosted proof.

Required compatibility matrix before release: oldest supported and newest client load→unrelated edit→save; private reply create/replace/remove; newsletter/manual source evidence and exact text; sparse snapshots; owner/business/role changes; revoked contact permission; same/different revisions; two devices, deletion and lost acknowledgements. Use inert source fixtures first, then separately approved isolated authenticated CAS/RLS acceptance. If a server version/capability contract is needed, review schema/rollout authority separately; no tombstone or parallel ledger was added here.

## Safest eventual review/integration sequence

1. Freeze exact refs, verify the existing base of PR21 (mission11-shared-records), draft status, clean tree and graph again. Separately approve any actual integration; this report does not authorise it.
2. Review dependencies oldest-first: **21 → 23 → 24 → 25 → 26**, preserving history. After each separately approved integration, inspect the recalculated diff/base/graph rather than assuming prior overlap counts still apply. No splitting or rebasing is prescribed.
3. On a future isolated compatible checkout, run pinned tooling, original-source focused tests, complete updated offline selection, syntax, import cycles and byte-parity checks. Include disposable-review source checks without dispatching its workflow.
4. Rehearse the real inherited schema and trusted functions only in separately authorised isolated staging, with RLS membership/ownership denial, source revisions/CAS, idempotency, scheduler containment, approval/receipts and rollback evidence. No customer or production data.
5. Validate new/old owner clients, guest/web/standalone clients and Edge/worker combinations before any provider or release gate. Browser/native accessibility and recovery, physical-device acceptance and provider uncertainty/receipt tests remain distinct.
6. Email/publishing/financial rollout requires its own trusted contracts, permissions, owner approval and spending authority. Nothing about a green source suite authorises sends, campaigns, invoices, payments, bookings or deployment.

Relevant existing evidence: mission11 record/permission tests; mission12/13/14 actual builder/customer/request/conversation contracts; Phase31–49 source/draft/quote/reply/newsletter parent checks; shared public-record and standalone parity; snapshot/CAS/own-save/unknown-outcome tests. Full Phase49 CHECKS records actual execution, while hosted/device/provider/mixed-client claims remain deferred.
