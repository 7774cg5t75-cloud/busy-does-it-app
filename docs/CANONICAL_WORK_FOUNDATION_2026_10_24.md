# Canonical Work engagements — implementation and limitations

24 October 2026. Mission15, existing draft PR26. **Implemented source and synthetic local PostgreSQL/client verification; not deployed or enabled.**

One supported customer can now have independently identified, independently revisioned Prepared quote engagements in the proposed canonical database. Actual original customer/quote components created two records, reopened both, edited one and verified the other and original legacy Work were unchanged. This is a meaningful local foundation; it is not hosted account availability or support for every job/booking lifecycle.

## Authority and source checkpoints

The actual attached V22.51 Word was opened completely and retained privately outside Git. SHA-256 `9740b05c5e523ef881e50a03f3fd65b29c65667b2c874992712575db20aa2c3b`; 2,198 paragraphs/19 tables, cover/footer22.51. Ordered comparison preserves2,131/2,132 V22.49 paragraphs unchanged, updates the cover version and adds66 paragraphs in Sections63–64. Section64 approves individual authoritative engagements; nested-v2 remains historical session/compatibility evidence. No private original/extraction is published and no unrelated Section63 feature is implemented.

| Checkpoint | Commit | Tree |
| --- | --- | --- |
| Verified starting GitHub | `6f8351097f5222da890a4b301ce7af9671b95d50` | `1f8c5e0cbcd88df018eb915507737866e0003f06` |
| Clean starting local mirror | `3010a03a25fe0aa5f4721df3c1a21e75daa8d271` | Same starting tree |
| Schema/local SQL checkpoint | `fa78540f7061f784cfc42c37a9d048461103e36c` | `832e93e25ff586e76398b47042ececc321ded55a` |
| Connected client checkpoint | `2ad1b8560b56419b7e84290748b8f2a5f048f84f` | `4562e5b37a742cbb2b68f85f54f46cc2a1f4cb1d` |
| Private migration restriction | `de45af4a4680f6a4f95ff6f3ac8cb7dd6a393b82` | `15e882629705fd5cffac7ffdaa89c303177fa81b` |
| Final frozen functional local | `3fb5a323c601da92a1c607a5f30e91215e50fa6a` | `93cd895d937e0880e007ee729a910a5ef7c7192b` |
| Matching functional GitHub object | `6c29228034f923a00fc40c32c3f074de8a63c14e` | Same frozen functional tree |

Local mirror/API commits have different identities; exact matching trees establish source equality. The delivery documentation commit follows this frozen source; its exact identity is reported at delivery rather than inventing a self-referential hash. No prior history is rewritten.

## Canonical model and original authorities

The abort-fused [SQL proposal](sql-proposals/canonical-work/engagements.sql) uses `public.business_work_engagements`: server UUID, original business FK, exact original customer/Filed-enquiry IDs, trusted canonical creator/modifier, independent revision, source snapshot revision/fingerprints, complete source evidence and versioned complete compatible Work JSON. Existing customer and Inbox data remains in its original snapshot. No second customer database, request ledger or writable active-slot mirror is introduced.

The first slice supports **Prepared private quotes** only. Original retained `type`, task/origin, timestamps, details, exact amount/date/wording and compatible unknown fields survive operator-fixture migration. Canonical creation time/actor does not fabricate historical authorship. Snapshot source revision is observed evidence, not a counter advanced by one engagement save. A future quote→booking transition should preserve the same engagement identity, but is not implemented here.

`business_work_private_drafts` separates owner-private reply/follow-up wording from the Work projection, with engagement/customer/business/owner/kind identity, independent revision, observed engagement revision and hidden extensions. Existing legacy private reply/follow-up storage is untouched. New private wording has server-derived creator authority, not catalogue provenance or sending permission.

Original authorities reused: busy_businesses and live owner memberships; original snapshot schema/revision; exact Filed Inbox/customer associations and enquiry references; original customer screen and quote fields, enquiry wording preparation, quote review, dirty-navigation specialist and businessSnapshotSession identity. The original booking request/link and durable Work ledger are retained, not replaced.

## Finite server contracts

| Contract | Allowed effect/result |
| --- | --- |
| `busy_work_source_review_v1` | One current supported owner-scoped customer/enquiry review, fixed fields and server hashes; only boolean legacy-Work presence, no legacy private wording/hash |
| `busy_work_create_quote_v1` | New server-ID Prepared quote from exact eligible Filed source and expected snapshot revision |
| `busy_work_list_v1` | Creator-scoped fixed summaries, stable UUID keyset; default20/max50 per response, no lifetime20 limit |
| `busy_work_read_v1` | One exact creator-owned supported quote projection, independently revisioned; unknown/private extensions excluded |
| `busy_work_edit_quote_v1` | CAS update of quote amount, owner wording and planned date only; preserves complete other fields/engagements |
| `busy_work_private_read_v1` / `busy_work_private_write_v1` | Owner/engagement-specific exact wording; draft CAS and current engagement/source evidence |
| `busy_work_migrate_legacy_v1` | **Operator-only retention candidate; no application EXECUTE or UI authority.** |

All exposed finite functions explicitly derive trusted auth.uid and check current owner membership and exact business/customer/source/target. Membership SHARE locking precedes snapshot SHARE, engagement and private-draft locks. Revocation serializes; independent engagement edits can proceed independently. Fixed search paths, explicit ownership, RLS on canonical tables, restricted table/schema/function grants and effective inherited EXECUTE checks are included. Ordinary admins, members, other owners, anonymous and service-role callers have no implicit private access. A public SECURITY DEFINER entry point is justified only by its finite explicit predicates while raw tables remain inaccessible; authenticated EXECUTE alone is never authority.

No generic JSON merge/path/full-record replacement, unrestricted v1 helper, arbitrary raw snapshot SELECT or legacy PATCH/upsert fallback is added. Stable source hashes come from server observations, not caller assertions. Exact receipts bind operation nonce, actor, business, customer, engagement, target revision and committed fields/hash. Repeated stale operations deny. Readback is labelled observation, never a reconstructed own-operation receipt.

## Original client integration and demonstrated outcome

`canonicalWorkSession.mjs` binds finite observations/tickets/outcomes to the existing account-session/workspace identity. `CanonicalWorkPanel` is mounted by the original CustomerDetail and reuses PrivateQuoteFields, useQuoteActionReview, enquiry preparation and original Keep/Discard navigation. AppController adds one import and one binding, no new root hook/state owner.

Supported local component/database sequence:

1. Inspect a current eligible original Filed source for an existing legitimate customer.
2. Deliberately prepare original quote wording; amount/date remain explicit owner input.
3. Review exact fields; approve one finite create; validate exact committed receipt and readback.
4. Repeat for a different exact Filed enquiry; retain the first complete engagement and original legacy slot.
5. List/open each independent record through the original customer surface; review/edit one; verify the other unchanged.
6. Bind a fresh JS account session and read the current record without inheriting an earlier receipt.
7. Save/read engagement-specific private follow-up through the finite adapter; simulate a lost acknowledged response and preserve unknown outcome through matching read-only observation.

The actual client bridge executed23 real local RPC calls, with original JS components/hooks and inert external IO. The database and component transports are real local integration; native rendering, real Supabase auth, device restart and network delivery are not established. Fixtures add legitimate fictional source records before the journey; the client does not file another enquiry or restore account-only customers. Whole snapshot hash before/after client operations matches.

One-use review binds actor/business/customer/engagement, source fingerprint, actual typing epoch, fields and selected view. Authentication waits recheck typing before sending. New typing, source/context changes, navigation, role/business/account switch and stale callbacks invalidate approval. Unknown outcomes fence further mutations without blind replay. Independent fields, legacy Work and unrelated domains are not replaced. A target receipt does not advance the global snapshot revision or mean device save, customer contact, accepted quote, confirmed booking or payment. There is no durable operation-receipt ledger or historical idempotency service: creation nonce uniqueness and revision CAS reject supported duplicate/stale attempts, but fresh observations cannot reconstruct old acknowledgements or establish process-death/exactly-once guarantees.

**Hosted flag remains hard false** (`CANONICAL_WORK_ACCOUNT_ENABLED`). Original AppController→Customer parent test verifies zero canonical IO and no legacy mutation when disabled. Private wording SQL/adapter is verified; a complete engagement-private reply editor/recovery UI remains future integration. The original reply editor and prior recovery paths remain intact.

## Legacy preservation and migration boundary

Legacy Work does not reliably establish the original private-wording author. Review found that exposing legacy quote wording/hash to any owner or allowing owner migration would let another business owner adopt unproven private text. The application migration path and legacy wording/hash disclosure were removed. No authenticated, anonymous, service-role or inherited EXECUTE route may reopen it. This is a genuine confidentiality correction, not a complete migration policy.

Only the fictional known-owner operator fixture exercises exact retained-record migration, including full unknown data, atomic duplicate denial and unchanged original snapshot. Source-less legacy/history summaries remain untouched; they are not fabricated into complete engagements. Hosted backfill is blocked until reviewed original ownership/attribution and disclosure rules are encoded. There is no activated dual-write/backfill.

Migrated original slots are protected by a trigger against subsequent change/deletion, even through a privileged legacy update. Canonical identity/source fields are immutable. Original raw-read/full-write fences and business_id-only provisioning access are preserved. Old serializers have no canonical table write authority. The unchanged Phase52 older-serializer loss probe remains a known hosted risk until compatible fences/cutover are actually deployed; its file SHA remains `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`.

Rollback revokes canonical mutation execution, retains complete rows/private drafts, identity/legacy guards and both original fences, leaving reviewed read-only paths. It does not flatten records, drop tables or reopen dangerous old-client access.

## Fresh verification and retained failures

See companion application and SQL CHECKS for complete fresh results, child exits and retained unsuccessful candidates. Final SQL candidate SHA-256 `30a0de3389d1ae46ef4f8034bbdc855b2ee72e35ceb2409d3a5991a440744122` exactly matches tested source.

- Original Phase59–66 PostgreSQL baseline:262 passed/0 failed/0 blocked/0 unexecuted; runner0.
- New canonical PostgreSQL stages:60/0/0/0; runner0. Includes real concurrent revocation and CAS races, independent row writers, owner/admin/member/co-owner/foreign/anonymous/revoked denials, two businesses with matching original IDs, duplicates/malformed/source conflicts, unknown preservation/non-disclosure,27-record pagination, private drafts, raw-read/legacy-write denials and retaining rollback.
- Original JS components→actual local PG bridge:passed,23 RPC calls, every RPC child0, Node/bridge0; original snapshot unchanged.
- Final frozen application selection:378/0/0/0, all children/runner0; pinned10-second component VM unchanged. Complete artifact records exact source/selection hash.
- Production foundation105/105, eight changed-source parser checks, native-source parser, Python compilation, pinned dependency health and static architecture audit:exit0. Syntax is not an Expo/native build or Deno semantic typecheck.

Historical unsuccessful SQL candidates remain in CHECKS: initial0/1/0/43 rejected the original legitimate business_id-only provisioning grants; corrected the guard, not the privacy fence. Next38/1/0/5 correctly denied revoked membership but test diagnostics lacked verbose SQLSTATE; fixed diagnostics without weakening42501. Next39/1/0/4 exposed buffered concurrency-checkpoint reading; fixed bounded pipe reads without changing VM limits. Failed runners1, failed psql/expected-denial children recorded explicitly (psql3 is normal for expected denials). Subsequent passing candidates remain intermediate evidence, not extra final pass totals. Two intermediate378-pass app runs are historical to later changes, not additional final credit. A cancelled permission prompt was not treated as consent or retried as approval. A bulk source-transport read later exceeded tool output capacity and was replaced with bounded reads; it was not a test failure or source change.

No known final failing/blocked selected check is hidden. Local mock UID roles are not genuine JWT/PostgREST. Public Supabase changelog fetch403 was retained as a documentation limitation; relevant public RLS docs were consulted without project/database access. No hosted advisor was run under the no-hosted-access restriction.

## Architecture, scale and next gates

Final static audit:1,520 source files,160,068 physical lines,3,036 static relative edges,zero detected cycles. AppController18,287 lines/97 imports remains oversized; this mission adds two wiring lines, no root state/hook. MiniAppBuilder, existing booking ledger, old private reply persistence, screenshot pipeline, hosted functions/migrations, dependency locks and appearance system are unchanged. No production package is added. Separate finite storage for canonical Work and its private drafts follows the approved domain ownership rather than duplicating customers/Business Brain. Static graphs do not certify dynamic coupling or performance.

Indexed business/customer/creator/UUID paging and row CAS remove the one-current-slot/lifetime20 constraint;27 rows were actually tested. Source validation still scans original snapshot arrays and locks the source row, so large-history throughput and source-retention strategy need measurement. Current strict source validation may deny reading an otherwise retained engagement after customer/source correction or pruning; archival read/source rebase and explicit deletion/retention policy are unresolved. No arbitrary resurrection or delete API is provided.

| Gate | State / requirement |
| --- | --- |
| Local Prepared-quote CRUD, two independent rows, private wording | PASS within documented supported slice |
| Application switch / production fuse | Hard-disabled / source fuse intact |
| Original schema/provisioning and synthetic effective privileges | Locally tested; genuine hosted schema/default/inherited ACL acceptance still required |
| Legacy authorship and operator backfill | BLOCKED pending explicit provenance/disclosure/migration policy |
| Source correction, archival read, retention/deletion | Not implemented; retained rows deny unsafe source changes |
| Jobs/bookings/lifecycle/request-ledger/quote→booking same ID | Not implemented in canonical slice; original systems preserved |
| Broad customer recovery and repeat-enquiry filing | Existing account-only observations preserved; canonical editor needs legitimate current customer/source; no broad restore |
| Other domain readers/writers and services | Not cut over; newsletter/builders/Work/service compatibility requires explicit review |
| Genuine JWT/PostgREST, views/RPC/role inheritance/service bypass | NOT YET TESTED in isolated hosted project |
| Two-device, account switching, process death, native UX | Source fixtures cover selected guards; actual device/durability acceptance outstanding |
| Rollback | Locally tested retain-data/read-only; hosted rehearsal separate |

The next substantial stage should complete engagement-specific quote/private-reply selection in original Work/Get Paid, a reviewed source-change/archive inspection contract, and the legacy private-ownership decision. Then prepare a minimal separately authorised staging slice with original provisioning, both fences, only reviewed finite RPCs, compatible client and unsupported services/old clients denied. Production remains separate; no claim of staging/release readiness follows from these local passes.

All draft dependencies remain open/draft/unmerged:21→23→24→25→26, unchanged bases and dependency heads. Additional external spending **£0**. No hosted Supabase access/change, migration, deployment, customer/provider communication, financial/booking/tax/publication action, paid build, screenshot, workflow dispatch, merge/rebase/force-push or PR closure. Disposable PG17 used fictional data/private Unix socket/no TCP and was stopped after verification. Private master and original confidential schema handoffs remain outside public Git.
