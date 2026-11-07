# B3 empty-source contract and the next approval boundary

Status update, 7 November 2026: the exact separately approved correction is **installed and independently verified** in the AI Lab as native migration `20261107113432`. See [the installation report and fresh private packet status](B3_SOURCE_CONTRACT_INSTALLATION_2026_11_07.md). No B3 execution is authorised by this document. The reviewed SQL files and code hashes remain unchanged; the original pre-install review below is historical context.

The work continues from development commit `1fa62a2e454793ecac000477fdf453d78c7892ae`, tree `e09fcd041a2f407ae18d650266ffa935847fd07b`, preserving the original unmerged dependency chain, prior implementation and failed execution evidence. Final functional/report identities and test totals belong in the frozen mission report; they must not be inferred from this starting checkpoint.

The corrected private Product Master V22.85 was verified from its genuine Word original: SHA-256 `9dc5e697e5a0f5c676db86aedc5aaf1db7be85808fb3320af438ed945d38e22c`, 3,353 ordered paragraphs and 20 tables. The original and complete extracts remain outside Git. This technical correction changes no product entitlement, design acceptance or publication authority.

## The defect and the evidence distinction

The original `busy_connected_builder_read_v1` deliberately raised SQLSTATE `40001` with “Workspace unavailable” for an absent or unusable snapshot. B3 attempted to recognise one exact HTTP 500 error body as proof that it could begin source preparation. `40001` means a serialization failure, not an ordinary missing-resource result. The observed hosted request repeatedly raised that error after the client had stopped; a client fetch deadline therefore did not establish that database processing had ended.

The earlier disposable PostgreSQL bridge translated a `psql` exception into a **synthesised** HTTP 500 response. It exercised real original SQL and original source orchestration, but it did not run PostgREST or establish its transaction retry, HTTP response or client-disconnect behaviour. Its passing result was not genuine PostgREST acceptance. Existing failed runs and containment receipts remain preserved privately; no old run is replayed by this fix.

Genuine PostgreSQL 17.11/PostgREST 14.18 reproduction passed 2/0 and corrected-path CI passed 20/0 on the frozen source. The [original final report](B3_EMPTY_SOURCE_FIX_2026_11_07.md) identifies binary/configuration provenance, request/backend observations and safe local cleanup. Synthetic Auth responses, locally signed fictional JWTs, simulated transport faults and genuine database/API transport remain labelled separately. None establishes a new hosted Supabase sign-in or Studio save.

## Implemented runtime v2

The runtime is `busy.ai-lab-b3-runtime.v2`. Its fixed owner RPC registry includes the proposed `busy_connected_builder_source_state_v1(uuid)` alongside the existing original source ports. It revalidates the native user and current original owner membership before requesting source state.

Only an HTTP **200** JSON response of at most **2,048 bytes**, with exactly these fields, can supply the absence proof:

| Field | Required value or relationship |
| --- | --- |
| `version` | `busy.connected-builder-source-state.v1` |
| `actorId` | The currently bound native owner |
| `businessId` | The currently bound canonical business |
| `snapshotExists` | Boolean presence of an original business snapshot |
| `profileExists` | Boolean presence of any original profile, including disabled profiles |
| `empty` | Boolean equal to `!snapshotExists && !profileExists` |

The probe returns its internal `{empty:true}` proof only when both presence flags are false and `empty` is true. An existing revision-one snapshot, a profile without a snapshot, a disabled profile, inconsistent flags, foreign identity, wrong version, extra/missing fields or any malformed response refuses preparation before the initializer.

Every HTTP error remains an error. The runtime no longer parses a 500/`40001` response as an empty workspace. It does not accept a generic failure, skip the probe, infer absence from a timeout or retry the request. Its existing origin, body, stream, JSON and deadline checks remain active.

First-failure diagnostics contain only a finite error code and allowlisted HTTP status. They use own data descriptors and do not copy exception text, response bodies, causes, getters, keys, passwords, JWTs or credential lengths. Subsequent denied calls do not overwrite the original failure classification.

The read-only probe's timeout is a terminal read failure. Native sign-in and source-write unknown acknowledgements retain their existing conservative classification, consumed intent and non-replay behaviour. A client timeout is still not a universal guarantee that every possible server-side transaction or infrastructure failure has stopped.

## Separately proposed SQL correction

The proposal is in [ai-lab-b3-empty-source](sql-proposals/ai-lab-b3-empty-source/manifest.json). Use its final reviewed manifest for exact installation, execution-derivative, function-body and retaining-rollback hashes. Do not substitute an earlier foundation approval or silently edit its approved bytes.

The proposal adds no table, business store, spending ledger or administration endpoint. It:

1. Adds an authenticated-only, original-authority source-presence projection. It uses the original owner/membership authority and checks both original source tables; disabled profiles count as existing source.
2. Changes the original reader's deterministic unavailable-workspace branch from `40001` to non-retrying `P0002`. The existing reader's successful result, ownership, access boundaries and source meaning remain unchanged. The reader still fails when source is unavailable; it does not return an empty success.
3. Changes eight manually raised conflict/history branches across the existing profile, private Website writer, transition and history authorities to `PT409`. These remain failed CAS or history decisions. They do not become successful writes or new spending authority.
4. Converts only genuine serialization/deadlock errors caught inside the source-state function to a terminal `PT503` failure. This never produces `empty:true` and does not expose private database error details.

The proposal pins old and revised function-body fingerprints, signatures, owner, search paths and effective execution grants. The new function is owned by the original trusted role, with execution revoked from PUBLIC, anonymous and service roles and granted only to the authenticated role. Original RLS/FORCE RLS, tables, records, owner locks, source revisions, native RLS hook and central AI policy remain separate protected invariants.

The managed runner must own the complete transaction and native migration-history insertion. The review fuse remains present; lock and statement timeouts remain five and 120 seconds. The control-plane project identity must be independently verified: `current_database()` alone does not identify the authorised Supabase project. No hosted installation or rollback was performed by preparing this proposal.

The retaining rollback is separately reviewed and separately approved. It closes execution of the new source-state port while retaining data, receipts, liability history and the non-retrying `P0002`/`PT409` safety corrections. Reintroducing the known `40001` behaviour is not the safe default rollback. Failure or uncertain acknowledgement must never trigger automatic rollback, repair or replay.

The correction addresses deterministic failure signalling and the bounded new absence projection. It does not promise that all database outages, connection recovery, transaction-commit failures outside the function handler or provider infrastructure can never retry. Genuine PostgREST tests and the final report must state those limits explicitly.

## Approval and source binding

Runtime, manifest, owner-approval and request-marker protocols are now version 2. A historical version-1 manifest, marker or execution approval cannot activate changed code. The full original import closure and exact workflow bytes remain pinned; a material code, SQL or source change requires new evidence and fresh one-use execution/request identities.

A v2 B3 packet cannot be prepared from B2 alone. Preparation requires its own independently verified native fix-migration receipt, exact execution hash, source-state `prosrc` fingerprint, corrected original function fingerprints, effective ACLs and fresh private verification evidence. The implemented `databaseContract` projection pins the migration name, execution hash, source-state version/body hash and corrected-function-set hash to the reviewed SQL manifest. It also binds the actual native migration version and the private verification-document hash. The latter must equal the B2 binding's fresh evidence hash, so both refer to one current verification record.

The preparation CLI now accepts `--verified-source`, containing exactly `verifiedB2` and `verifiedSourceContract`; an old B2-only input is refused. The SQL manifest is part of the reviewed import/hash closure. Both the Python pre-credential gate and original Node execution validator check the database-contract projection before credentials can be used. This checks the consistency of trusted private evidence; it is not cryptographic remote attestation and does not replace independent database inspection. No installed-contract metadata or execution-ready owner packet is fabricated while the hosted fix remains absent.

The fictional source facts and approved source-plan digest are unchanged:

`0d8ef3e45ec96a9d608571dc1118c5095daa80f37a019a0813ccc1a614c97ddb`

The future approved operation remains one native owner sign-in and at most six source writes through the existing original authorities: initialize; profile CAS; create the private Website; add the approved story; complete/protect its wording; preserve the approved customer action. The intended image-free pages remain Home, Services and Contact. Original Studio review, independent readback, owner wording, immutable history, Undo/Redo and source/CAS protections remain authoritative. No automatic save of model output is added.

Provider calls, model token requests, spending, automatic retries and publication remain zero. The original central AI policy remains disabled with a zero limit; no entitlement, allocation, tariff or financial operation is created. Original provider/publication/customer/financial gates remain absent by default. This correction neither designs a new website nor demonstrates AI creative superiority or Gold Standard acceptance.

## Required sequence before another B3 attempt

1. Use the completed frozen PostgreSQL/PostgREST reproduction, corrected-path and adversarial verification in the final report. Retain unsuccessful and superseded evidence honestly.
2. Review the final hash-pinned fix migration, retaining rollback and exact isolated-Lab preflight. Obtain a separate explicit installation approval. Do not reinstall the original foundation or use its old installation approval for this migration.
3. After any separately approved installation, independently verify native history, exact `prosrc`/ACL/ownership/RLS contracts, unchanged source records, disabled/zero AI controls and no partial installation. A missing, stale or uncertain receipt blocks packet preparation.
4. Prepare a fresh private v2 manifest and current code/source binding. Preserve the actual native owner and business identities in private evidence; never publish those identifiers or credential values in public Git. No credential re-entry is indicated by the empty-source incident; any future secret configuration requires its own authority.
5. Obtain separate authority for a single marker-only queue change. The existing marker remains unchanged during this source mission, so these source changes do not intentionally queue or execute B3. Keep the protected job waiting.
6. Bind a new short-lived owner approval to that actual run, attempt 1, actor and event SHA, after fresh source and Environment checks. Secure storage and owner release remain separate deliberate steps. Old consumed runs/approvals cannot substitute for this review.
7. If that exact source execution is separately approved, inspect the sanitised outcome and independently read back the original profile, private Website and history. Unknown outcomes, partial source, duplicate callbacks and any failure stop without automatic retry, deletion, reset, repair or account changes.

An eventual AI comparison remains a later, separately approved milestone using the existing provider adapter and central budget reservation/readback/settlement. This source correction authorises no deployment, credential transfer, provider activation, paid inference, publication or changes to staging, production or other projects.

## Evidence status

| Evidence | Status here |
| --- | --- |
| Runtime v2 source and synthetic boundary tests | Frozen CI: 40 passed, 0 failed |
| Original source orchestration and six-write preservation | Frozen CI: 18 cases/535 assertions, 0 failed |
| Genuine PostgreSQL 17/PostgREST pre-fix reproduction | PostgreSQL 17.11 / PostgREST 14.18: 2 passed, 0 failed; original SQL kept retrying after client abort |
| Genuine PostgreSQL 17/PostgREST corrected-path tests | Frozen PostgreSQL 17.11/PostgREST 14.18 CI: 20 passed, 0 failed |
| Migration, rollback, ACL/RLS and fault-injection checks | Frozen PostgreSQL 17 CI: 17 passed, 0 failed |
| Hosted fix migration | Subsequently installed once under separate exact approval; native receipt `20261107113432` independently verified |
| New native B3 save or real AI comparison | Not performed; fresh private v2 packet prepared without execution authority |

The final frozen functional source is `9cdb7d3bdf167b32f1af1c261d11b3e8dabf30d4`, tree `9cea4908e3c83e095f31fa2d35d34174901d2d92`. See [the complete report](B3_EMPTY_SOURCE_FIX_2026_11_07.md) and [independent CI evidence](evidence/b3-empty-source-20261107/ci-summary.json) for 528 application passes, 332 disposable SQL stages, 105 foundation assertions, 36 Deno targets, security/install/compilation and six legacy successes.

Passing technical tests cannot approve professional visual quality. Free/paid rendering quality remains equal, and the three design-reference candidates remain separate from the zero approved Gold Standards.
