# Phase55 — snapshot authority findings and trusted-writer handoff

Status: source-only investigation and implementation specification, **not an installed schema, deployable migration or implemented trusted writer**. The same-schema older-serializer loss probe remains unchanged and continues demonstrating the unresolved defect.

## Exact investigation boundary

Starting local ab9d908e9ccffdd45e067122991d089723ea8483 and remote b2329a1eb61bd4cbd3adc094c318d748ca090289 have the same tree4837e91038b766557bd1b45f5be3e0cfd0275fd7. `scripts/audit-snapshot-authority.py` examines every distinct SQL blob reachable through local Git refs, not just current migration paths. At the investigation checkpoint:293 refs,128 unique historical SQL blobs; neither `busy_business_snapshots` nor `busy_ensure_business` occurs in those SQL blobs. This includes locally available disposable-review/register branches and historical version branches. Remote-tracking refs are accessible historical source, not a promise that every server branch was freshly fetched. A whole-history definition-pattern search across other file extensions also found no CREATE TABLE/FUNCTION definition for either name.

The audit records blob identities for relevant artifacts and a ref-set fingerprint. Its absence finding is bounded to accessible Git objects; it does not establish that a hosted table is absent, that RLS is correct, or that an untracked deployment artifact never existed. No hosted database was inspected. The first Node subprocess audit attempt returned EPERM despite partial stdout; no success was inferred from it. The retained Python implementation uses checked subprocess exits and succeeds without that runtime restriction.

### What source actually establishes

| Component | Provenance and finding | Authority limitation |
| --- | --- | --- |
| Original account client | c1e0779ea7267b40741cf9240c026e7412c2b330, V3.11, changes only BusyDoesItApp.js. Calls rpc/busy_ensure_business and reads/upserts busy_business_snapshots | Client call sites, no DDL, grants, policies or RPC body |
| Historical writers | Original V3.11 uses POST resolution=merge-duplicates and complete payload. Current AppController initialization uses conflict-ignore creation; businessSnapshotSession uses conditional full-payload PATCH | Older writers may omit revision/schema conditions entirely; current predicates cannot constrain them |
| Current session | businessSnapshotSession.mjs exact business/revision/schema predicate, exact returned payload, one read after uncertain outcome, no blind retry | Server permission and preservation authority not supplied by client predicates or receipt comparison |
| Production bridge SQL | supabase/schema/v3_25_production_bridge.sql, blob e02f0467aee3e31415dcfc393f106ac08886ae77 | Not snapshot provisioning; no matching table/RPC definition |
| Staging business baseline | staging/ISOLATED_ONLY_business_core_v3180.sql, blob724264895e06144d6e576cbde8c28ea6d91a64ed, introduced a40b2271 | Explicitly NOT authoritative production schema; service-only synthetic business/membership baseline, no snapshots/ensure RPC |
| Disposable prerequisites | staging/disposable-supabase/fixture-prerequisites.sql, blob e5fc8be1c47d2f944763581a34da90ede1f1a3b5 | Explicitly acknowledges missing original business-core/internal-config migration; creates fixture-only internal config |
| Disposable Auth/RLS harness | staging/ci-postgres-bootstrap-v3127.sql and disposable README | JWT emulation/canary and local original catalogue tests do not provision or prove original snapshot authority |
| Edge readers | busy-production-watch/index.ts reads payload/updated_at; busy-founder-ops/index.ts aggregates snapshot counts | Existing service readers, not a replacement authenticated write authority |

## Precise missing artifact request

Supply a **sanitised schema-only original provisioning export or its original migration source**, with provenance/version, containing:

1. public.busy_business_snapshots: columns/types/defaults, primary/unique/FK/check constraints, indexes, owner, RLS ENABLE/FORCE flags, all policies, grants/default privileges and dependent triggers/functions. Include any revision/schema guard or writer interception definition.
2. public.busy_ensure_business: full signature/body, language, security mode, owner, fixed search_path, EXECUTE grants and all dependencies. Include authoritative business and membership table definitions, role rules and revocation path.
3. Any trusted writer RPC/service/function and capability configuration, including service-role callers, cron/worker writers and restore/import/delete paths. Include direct REST permissions and any bypass roles. Configuration should omit secrets and all customer data.
4. Relevant migration ledger/version ordering and intended supported client versions. A client interface, table screenshot, guessed DDL or the synthetic isolated baseline cannot substitute for these definitions.

This is the blocker for executable trusted SQL/code review. No migration was invented from the JavaScript payload shape. Exporting from a hosted project requires separate owner authority; this task did not request or perform hosted access.

## Minimum mutation contract to implement after source review

Use the **original snapshot row**, not a second ledger. The following describes required semantics rather than naming a fictitious existing RPC:

- Inputs: business ID, exact expected row revision and supported schema, finite operation name, stable customer/draft target ID, exact expected target/source evidence and operation-specific values. Never accept an arbitrary JSON path or caller-defined allowlist.
- Server derives authenticated principal and live business membership/role. User-editable metadata, version strings and caller capability booleans are not authority. An operation is a server-reviewed capability: its role, schema, payload structure, field ownership and side effects are enforced by trusted code. Merely declaring the newest client version grants nothing.
- Within one transaction, authenticate/authorise, lock the original business row, compare expected revision/schema and locate exactly one target in the original array. Reject duplicates, wrong tenant/role, missing targets, stale source/target, unsupported record versions and invalid input before mutation. Source-dependent acceptance must validate source through original authoritative catalogue/filing contracts, not a submitted stamp alone.
- Mutate only the finite operation's owned fields on the server-loaded row. Preserve unrelated top-level, customer and draft data without sending it through an older client serializer. Unknown extensions are outside the writer's authority: preserve them in place or reject a replacement that cannot safely retain them. Do not recursively merge arbitrary submitted JSON or treat unknown values as editable.
- Distinct operations for reply wording replacement, explicit whole private-reply removal and content-record updates/removal. Omission means **no operation**, not deletion. Explicit removal validates current target identity/version and removes that target only. It must not resurrect removed data from a cached payload. Revision conflicts reject stale replacements after deletion; unknown extensions cannot be silently stripped by a replacement.
- Independent quote amounts/dates, other customers and other content drafts are never part of a reply operation. Full business restore/import is a separately authorised operation and cannot bypass capability/retention checks.
- Increment row revision once, return exact committed target/row identity, revision/schema and operation receipt. Maintain existing distinction between a returned own-save receipt and later matching readback. Lost acknowledgement remains unknown; read/reconcile without blind replay. Do not invent idempotency unless its original trusted storage/receipt contract is established.
- Membership check and row mutation must share a well-defined transaction/revocation boundary. The actual locking/privilege strategy needs original schema review; an Edge read-then-write role check alone is insufficient against revocation races or direct REST bypass.

## Rollout ordering and acceptance gates

| Order | Action and exact source contract | Required evidence / authority |
| --- | --- | --- |
| 1 | Obtain the original definitions above; inventory every writer, including V3.11-style direct upsert and current initialization/PATCH/restore | Sanitised schema provenance; no customer-data access needed |
| 2 | Review oldest-first draft chain21→23→24→25→26 against exact current refs, plus prepared business_content_records.sql prerequisites and inherited function dependencies | Separate integration approval; no merge in this mission |
| 3 | Design trusted finite operations on original row; explicit delete semantics and unknown-field policy | Reviewed SQL/service implementation based on original grants/RLS, with rollback and concurrency proof |
| 4 | In separately authorised isolated staging, install original provisioning and trusted writer; **block incompatible direct INSERT/UPDATE/upsert/PATCH/restore writers before enabling protected new fields** | Actual permission-denial tests including old clients with omitted predicates; no claimed client capability bypass |
| 5 | Route supported client initialization/save/removal through reviewed trusted contract; unsupported clients get upgrade/read-only state | Compatible client/Edge/worker/standalone ordering and real authentication/RLS/CAS tests; preserve unsaved device work |
| 6 | Execute retention matrix below, schema/migration rollback and recovery, then browser/device acceptance | Original hosted/local Supabase trusted boundary, no mock-only readiness claim |
| 7 | Only then separately authorise rollout | No rollback to an unrestricted legacy writer while protected fields remain; rollback must retain a write fence/read-only mode |

### Required retention matrix

- New versus oldest and same-schema older serializers: unrelated edit cannot drop private reply provenance, newsletter evidence, brand corrections or unknown top-level/nested fields.
- Direct legacy POST upsert/PATCH without expected revision/schema must be rejected by actual server authority, not merely by the current client's request builder.
- Omitted optional fields leave server data alone; explicit removal removes exactly its reviewed target; stale cached replacement after removal cannot resurrect it.
- Current/stale revisions and simultaneous writers: exactly one expected-revision winner, loser preserves private unsaved work and must re-review. Two businesses with equal customer/draft IDs cannot cross scopes.
- Live revoked owner/admin membership, staff/viewer, foreign user, malformed/duplicate target and changed enquiry/catalogue all fail closed.
- Dropped response after commit: no duplicate mutation/retry receipt invented; observed matching data stays distinguished from a confirmed own-save result.
- Unknown extension changes/removal require the responsible newer operation or fail closed. No generic JSON merge or tombstone store is prescribed.

Current source-only evidence proves client predicates, readback distinctions, exact dirty-editor guards and the counterexample. It does **not** prove these trusted implementation properties. Keep check-mission15-phase52-retention-contract.mjs unchanged until the real enforceable boundary defeats its loss scenario; add real server tests rather than substituting an optimistic mock.
