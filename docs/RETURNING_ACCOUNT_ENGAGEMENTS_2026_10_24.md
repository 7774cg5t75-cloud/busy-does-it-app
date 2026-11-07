# Returning account engagements and reviewed source comparison

24 October2026. Mission15, draft PR26. **Production source implemented and locally verified; hosted rollout remains disabled.**

The original Work/Get Paid entry now offers owner-scoped account discovery even when `customers=[]` on a fresh device/session. The owner can select an independent Prepared quote, inspect retained/current source evidence and privately observe an eligible follow-up without restoring a customer object or whole snapshot. This account-only surface is deliberately read-only. Existing authorised local-customer quote/private editing remains separate.

## Authority and exact checkpoints

The genuine private V22.51 original remains accessible and its exact bytes were checksum-reverified: `9740b05c5e523ef881e50a03f3fd65b29c65667b2c874992712575db20aa2c3b`. The previous complete review is reused: cover/footer22.51,2,198 paragraphs/19 tables, including Sections63–64. No original/private extraction is added to Git. Permanent individual authoritative engagements remain the approved direction; no migration/deployment/booking authority is inferred.

| Checkpoint | Commit | Tree |
| --- | --- | --- |
| Verified starting GitHub | `f3e13f9df2657e73fc69149661c7dc42cbe638e9` | `eadaa684d80f9b5dceb4731a0107884b8d73eadb` |
| Clean starting local mirror | `39499d89c53544387f6b25ff862aa30bec091f0a` | Same starting tree |
| Final frozen functional local | `149ad9ab391480ae9b81b354f9a2c8ae137b621e` | `f10c020d76416c740e7694e9f362156e37267e35` |
| Matching functional GitHub object | `30ed6b200520ab038a7366f7483da136c64275ee` | Same frozen functional tree |

API/mirror commit identities differ; exact tree equality establishes matching implementation. Delivery documentation follows this frozen functional source; its final head is reported at delivery without inventing a self-referential hash. Original draft21→23→24→25→26 bases/heads were independently checked and remain unchanged except the authorised additive Mission15 commits.

## A. Account-only discovery and deliberate selection

The original per-customer list requires a customer ID and therefore cannot discover unknown returning-account engagements. The new finite `busy_work_discover_v1(business, after, limit)` reuses the canonical records and trusted owner authorisation. It returns only engagement/customer/enquiry IDs, supported quote type/status and independent revision. There is no name/contact/raw quote/private text/unknown JSON in discovery. A matching `(business_id,created_by,id)` index supports the owner-wide UUID keyset query; response sizes remain default20/max50, not a lifetime history limit.

`CanonicalAccountWork` is mounted inside the existing CanonicalWorkEntry, already used by WorkHub and the original Home Get Paid shortcut. It reuses the canonical account-session adapter, semantic Card/Button/Text and original navigation. No AppController, customer registry, root store, booking ledger or quote engine is added.

The UI supports Find→bounded page→deliberate exact engagement selection→independent read/comparison→optional authorised private observation. Summary metadata is not authority for any mutation. Selection uses current server identity and target checks; stale actor/business/view responses are ignored. Scoped pending tokens prevent a previous workspace's asynchronous completion from blocking or overwriting a newer workspace. A stale old-owner adapter is additionally checked against the current UI actor/business before any result is displayed.

The rendered context explicitly distinguishes retained original customer/source facts, current authorised facts, the actual quote and account observation. No result is inserted into `customers`, `replyActions`, Inbox or any other local arrays. The original global snapshot revision is not advanced. Empty eligible pages are not proof that no unsupported/other-owner records exist. A fresh account observation is not device persistence or an earlier own-operation receipt.

## B. Original versus current source evidence

`busy_work_compare_v1` uses the existing creator-bound historical reader and current source helper. It returns the established one-record Work projection plus fixed original/current context fields: customerName, service, enquiryText and reviewedAt. Customer/source fingerprint-change flags expose that reviewed evidence differs without returning hidden contact/private/unknown fields. Oversized name/service values are omitted or treated as unsupported rather than returning unbounded recognition data.

Original engagement UUID, source ID, source snapshot revision/hash and complete retained source evidence remain immutable. The comparison can show exact visible corrections while reporting changes in other supported hashed fields separately. It never copies current facts into the canonical record, changes source references, generates a revision or invents a missing customer.

Current context is returned only if original trusted source validation authorises it. Missing/ambiguous/malformed source remains unsupported/unavailable; a foreign or newly restricted owner/source suppresses current context entirely. Original context is labelled retained historical evidence, not a reconstructed current customer. A comparison is always `comparisonOnly`, `historicalOnly`, `mutationAuthorised=false`, `notOwnReceipt=true` and is not registered by the client as an edit ticket source.

No source-rebase operation was added. The immutable original-provenance trigger and existing target helper still require matching current source/customer fingerprints before quote/private mutations. Actual SQL tests confirm that a changed, removed, foreign, ambiguous or malformed source comparison cannot authorise an edit. A future rebase needs its own explicitly reviewed current-source relationship and conflict policy while retaining original provenance; comparison alone is insufficient.

Historical retention also does not settle erasure law or customer deletion policy. No lawful-erasure request or real customer data is processed here. A reviewed retention/erasure contract and purge/bypass inventory remain mandatory before hosted real-data use; deleting a source array entry is not automatically interpreted as either lawful erasure or permission to recreate it.

## C. Private follow-up continuity

Account-only inspection may observe the current owner's follow-up only after a fresh strict engagement read matches the selected revision/record hash, followed by the existing finite private read. It is read-only, separately labelled and never included in discovery/shared Work summaries or historical comparison. Changed source eligibility leaves private inspection unavailable rather than exposing historical private replies through the Work reader.

The existing editor now permits typing during a pending read while continuing to block pending saves/duplicate operations. Actual typing epochs reject a delayed read's replacement and preserve the newest exact words. Deliberate Keep/Discard still uses the original owner-edit authority. A private read must distinguish a genuine revision0/text-null absence from unavailable or malformed evidence; invalid absence shapes are denied rather than converted into an empty draft.

Existing private writes retain actor/business/customer/engagement/kind binding, independent draft CAS, current Work/source checks, one-use approval and exact receipt/readback. Acknowledged receipts remain acknowledged if later inspection fails. Matching words after a lost acknowledgement remain an observation and never clear the unresolved-operation fence. No legacy unattributed wording is adopted and no message is sent.

Account-only editing is **not implemented**. The finite server quote/private writers exist, but this read-only context is not an original editable local customer and is not silently converted into one. Completing an explicit server-reviewed existing-editor binding is a client/source-contract integration task, not something deployment alone will fix. This limitation is visible rather than presenting prepared text as a new saved customer.

## D. Final source/database parity

Unlike the previous mission's pre-correction bridge, the completed final bridge runs on the actual clean frozen source above. It records `sourceSha`, `sourceTree` and `workingTreeChanged=false` in its result. It does not substitute mocked RPC values for SQL execution.

The original JS component/adapter journey uses actual disposable PG17 RPC calls with inert external IO and synthetic UID roles. It covers:

- Two independent canonical quotes for one original customer; exact fields/independent edits/reopening; unchanged legacy Work and entire original snapshot.
- Two reviewed private follow-up saves, separate draft identity, fresh-session readback and the other engagement's genuine absence.
- A real SQL read response deliberately delayed while the owner types; the new exact text survives. A subsequent explicit Discard opens actual readback through the corrected guard.
- Fresh account-only entry with empty customer/Work arrays, paginated exact engagement selection and read-only private observation; no inserted customer or invented own receipt.
- A whitelisted fictional fixture correction to one exact test source; actual SQL comparison displays the changed current facts and the UI disables private access. The test explicitly restores its fictional source and verifies the entire original snapshot hash matches afterward. This fixture handler is test-only, not a production mutation route.
- The corrected workspace lifecycle executes the original scheduled effect callbacks on a real SQL-backed editor and verifies hidden old-editor dirty metadata does not rebind to another workspace.
- The retained deliberate lost-acknowledgement test commits one actual mutation, discards its response and verifies readback cannot reconstruct the own receipt or permit blind replay.

Other owner/member/admin/foreign/revoked/anonymous/service denials, malformed/duplicate/source cases, real concurrent revocation and competing revisions, private isolation, raw-read/full-write denial, unknown preservation and fail-closed rollback are executed by the canonical SQL selection. Local UID fixtures are not real Supabase JWT/PostgREST, browser/native/device or provider acceptance. Scheduled effect invocation is genuine source-path coverage in the original offline runtime, not a claim of a native React renderer.

## Fresh verification and retained candidates

Full outputs are in the [application CHECKS](RETURNING_ACCOUNT_ENGAGEMENTS_APPLICATION_CHECKS_2026_10_24.json) and [SQL CHECKS](RETURNING_ACCOUNT_ENGAGEMENTS_SQL_CHECKS_2026_10_24.json). Final counts are counted once; candidate executions are not added to them.

| Selection | Fresh result | Runner |
| --- | --- | --- |
| Original Phase59–66 PostgreSQL baseline |262 passed,0 failed/blocked/unexecuted |0 |
| Canonical PostgreSQL, all prior67 plus16 new stages |83 passed,0 failed/blocked/unexecuted |0 |
| Frozen original-component→actual-PG bridge |45 RPC children passed; Node0; original snapshot unchanged |0 |
| Complete frozen application selection |380 passed,0 failed/blocked/unexecuted; all children0 |0 |
| Production foundation |105 passed |0 |
| Changed-source syntax, native-source parser, Python compilation, pinned dependency health, architecture/diff checks |Passed |0 |

SQL SHA-256 `03e84843469e02bca9ef21ff98e181675740817321d5591d64a12ec809fefee2` matches the actual tested candidate. The bridge prerequisite now requires83 passing stages and this current candidate hash. All PostgreSQL startups explicitly used empty `listen_addresses`, the verified private0700 Unix socket and original disposable cluster. Both runners verified the exact data directory and no TCP. No new installation, hosted connection or system service was used; the cluster was stopped afterward.

Two bridge candidates failed with Node/runner1 after35 successful SQL calls. The first assertion searched JSON-escaped output for literal-newline wording; the second assumed Text children were a scalar, but the original inert runtime stores child arrays. The final assertion inspects actual Text-child strings while preserving exact newline/wording comparison. Actual RPC output retained the correct text and both failed candidates kept the legacy snapshot unchanged. The failed artifacts are preserved, not counted as successes. A corrected candidate passed before the separate frozen-source45-call run. No SQL assertions, owner denials, timeout or VM limits were weakened.

The stale-adapter/current-owner mismatch check was added before freezing and has a focused original-parent regression. No full selection was interrupted or cancelled during this mission. The previous mission's unsuccessful/cancelled evidence remains unchanged in its existing CHECKS.

## Security and architecture impact

The new functions explicitly derive auth.uid and check live owner membership and canonical creator/business/customer identity. Authenticated EXECUTE is not authorisation by itself. Existing membership-before-source/row locking, fixed search paths, private helper schema, RLS, explicit grants and effective inherited-execution audit apply to both new RPCs. Admin/member/co-owner access is not broadened. The original provisioner/business_id-only access, raw snapshot/full-write fences, immutable canonical IDs/source evidence, restrictive migration and retain-data rollback remain unchanged.

`CANONICAL_WORK_ACCOUNT_ENABLED=false` remains hard false. Production abort fuses remain in source. No old-client fallback, generic JSON writer, second customer store, ledger or restore engine is introduced. The original Phase52 loss counterexample remains unchanged with SHA `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`; it is not presented as a deployed fence guarantee.

Static audit:1,525 source files/160,379 physical lines/3,052 static relative edges/zero detected cycles. AppController remains18,287 lines/97 imports and is unchanged. WorkHub, Get Paid original wiring, Website/App Builder, Creator/Growth, BUSY voice, appearance modes, private original persistence and screenshot infrastructure are preserved. No production dependency is added. The new component owns only read-only observation state; domain execution and writes remain in established specialists.

Owner-wide keyset discovery now has its own matching index. Pagination controls are not lifetime limits; original SQL tests still exercise27 retained engagements. No large-history benchmark or frozen multi-page snapshot is claimed. Source comparison still scans original JSON collections and validates source evidence twice through existing helpers; reducing that cost needs a reviewed shared private read helper and measurement, not cached client guesses.

## Remaining blockers and next useful stage

- Hosted schema/ACL/default-inherited privileges/views/service bypasses and genuine owner/member/admin/revoked JWT/PostgREST acceptance remain unverified. No hosted project was accessed.
- Account-only quote/private editing needs explicit current server-reviewed customer/source binding through the original editor. Current account route is inspection only; no broad customer restore.
- Source rebase/correction writes, lawful erasure/retention and historical private-wording access remain unimplemented policy/contracts. Retained provenance is never rewritten.
- Legacy private authorship remains unproven. Operator migration stays unavailable to application callers; no automatic backfill or new owner attribution.
- Same-ID quote→booking needs a canonical engagement-ID link to the original request/diary/ledger and independently valid acceptance/conflict/receipt authority. Prepared wording or a local Accepted label is insufficient. No booking execution is added.
- Actual native UX/accessibility, process death, two-device/account-switch durability, provider delivery and release acceptance remain gated. No screenshots or manual owner acceptance were requested.

Next highest-value stage: a narrowly reviewed server-derived existing-editor binding for current account-only engagements, preserving the read-only comparison/historical boundary and original provenance. Follow with explicit source-change review/rebase design and the legacy ownership/retention decision before any real-data rehearsal. This completes useful returning work without manufacturing a local customer or prematurely extending booking authority.

Additional external spending **£0**. No hosted Supabase reads/writes/migrations, deployment, rollout activation, customer/provider communication, booking/payment/tax action, publication, paid build, screenshot/simulator capture, workflow dispatch, merge/rebase/force-push/history rewrite, dependency-branch modification or PR closure. Private Product Master/confidential schema handoffs remain outside Git; draft21→23→24→25→26 stays open/draft/unmerged.
