# Returning account Work — supported quote and private follow-up editing

24 October2026. Mission15, existing branch/draft PR26. **Implemented production source and local synthetic verification; not hosted-enabled or deployed.**

A returning owner can now discover and inspect an eligible Prepared quote with empty local customer/Work arrays, deliberately obtain fresh server eligibility, enter the original quote editor, review/save finite fields and independently read the result. The same engagement can continue through the original owner-private follow-up editor. No customer is reconstructed or inserted into local arrays, and no whole snapshot is restored.

## Verified authority and checkpoints

The genuine private V22.51 original remains accessible and its bytes were reverified: SHA-256 `9740b05c5e523ef881e50a03f3fd65b29c65667b2c874992712575db20aa2c3b`. Complete prior review is reused: cover/footer22.51,2,198 paragraphs/19 tables including Sections63–64. Original/extraction remain outside public Git. No new product-master amendment, migration, live operation or deployment authority is inferred.

| Checkpoint | Commit | Tree |
| --- | --- | --- |
| Starting verified GitHub | `b53d3bf889c2e2c818097bc8a5b203b541d4cdeb` | `56349dd1b9f4f0f7509cfb783f3015939f507b5a` |
| Clean starting local mirror | `69e6c58be1019536b04b7d17d2cdee3e392da4b2` | Same starting tree |
| Connected implementation | `caf9881366890b0472a283da098be2fe45d8ed39` | `5b0df63fe937c911100e7c48efea00b06154ccd9` |
| Private-wording retention correction | `510d4e9156fba5f4116ab3bb20e5a05a70c89897` | `b87c00b39e6db7452da1bffda351e2d95ee792ab` |
| Final frozen functional local | `f2a8cceb839beea896e34df6e8ac42fb40e1ffa4` | `1010af2bb518b9a9e7baaed621e9ffa99167598e` |
| Matching functional GitHub object | `cffee1822266579f35b9810edf72725b06ecf219` | Same frozen functional tree |

Mirror/API commits differ but exact trees match. Delivery documentation follows the frozen functional source; the ending delivery head is reported separately without inventing a self-referential hash. Draft dependencies21→23→24→25→26 were checked oldest-first; bases/dependency heads remain unchanged and all PRs open/draft/unmerged.

## A. Finite server eligibility

The new abort-fused `busy_work_edit_context_v1(business,customer,engagement,expectedRevision)` uses the original trusted target helper. It derives auth.uid, locks/checks live owner membership, checks exact canonical creator/business/customer/UUID, validates the unique current supported Filed source and its fingerprints, and requires the exact independent canonical revision. Missing/null, stale, corrected, removed, foreign or role-ineligible contexts deny.

The result is the existing finite quote projection plus `currentEditContext`, observed snapshot revision and a fixed allowed-operation list. No complete customer object, raw snapshot/source JSON, contact array or unknown extensions are returned. Quote/private mutation EXECUTE availability is checked as an additional restriction; fail-closed rollback cannot advertise a new editable context after writers are revoked. These operation flags are server-derived eligibility observations, not bearer credentials and not a substitute for authorisation.

Every actual `busy_work_edit_quote_v1` / private write still independently rechecks live authority, source, ownership and revision under original locks. Bypassing a UI binding grants no new server permission. The new function is a narrow authenticated RPC with explicit predicates and restricted effective grants; no private helper/schema/table access is opened. Fixed search paths, reviewed ownership, original RLS and inherited/default EXECUTE checks remain in the locally tested proposal.

The canonical session registers returned contexts as a distinct server-observed WeakMap kind, bound to original workspace/account identity and local revision observation. Clones, history/comparison objects, modified responses and stale actor/role/workspace evidence cannot mint an account edit approval. Context operations are finite: quote amount/date/owner wording and owner-private follow-up. Repeated or unknown operations retain one-use and uncertainty fences. This volatile context is neither a restored customer nor a durable operation ledger.

## B. Original editor boundary

`CanonicalAccountWork` adds a deliberate Review current account editing action only for a current source. It obtains fresh server context matching the selected engagement/revision, then routes entry through existing owner dirty-navigation review. While editing, discovery/selection callbacks do not silently replace the open editor. Close uses original Keep/Discard; afterward a fresh record inspection is required rather than presenting the old comparison as newly saved evidence.

`CanonicalWorkPanel` accepts an explicit account-context prop. In that mode it initializes only its existing quote working fields from the registered record, uses exact customer/engagement references and passes `quoteAccountContext` to the original `useQuoteActionReview` / `PrivateQuoteFields`. It does **not** construct a Customer, set selectedReplyCustomer to a fabricated object, shadow a new replyActions record or insert anything into original customer/Work arrays. The original hook has a bounded current-server-context branch; its legacy customer branch remains intact.

Account mode supports the three existing finite editable fields only. Legacy device-copy use, catalogue preparation and enquiry fabrication paths remain unavailable in this mode because their original local source contracts are different. Existing amount/date/wording remain exact, including zero and whitespace/newlines. Other quote fields, website/app/newsletter/preference edits and original legacy Work are not rewritten.

Review binds actual typing epoch, selected view, actor/business/customer/engagement, registered context and exact proposed fields. A callback-local one-use guard also prevents a second near-simultaneous save tap from clearing the first request's pending UI state. Exact target receipt and independent current-context readback are required; after a confirmed save the next context uses a genuinely returned server revision, never a fabricated increment or whole-snapshot confirmation.

## C. Demonstrated returning-owner journey

The final bridge runs original source components/hooks with inert native/external boundaries, backed by actual local PostgreSQL RPCs. It records the frozen source commit/tree and clean working state. The sequence includes:

1. Create/retain two independently identified canonical engagements from fictional eligible original Filed sources, keeping full original legacy Work intact.
2. Bind a separate fresh JS account session with **empty customers, Inbox and replyActions arrays**; discover/select/inspect the first saved engagement.
3. Obtain its current server edit context and deliberately enter the original quote editor without a customer prop/object.
4. Change the amount to exact `0`, set a planned date and preserve newline-containing exact owner wording.
5. Review and save through `busy_work_edit_quote_v1`; deny the duplicate callback; validate the exact committed receipt and fresh current-context readback.
6. Independently read revision3 and the exact fields. Read the second engagement and verify it is unchanged.
7. Inspect/review/save private follow-up through the original private editor; independently verify private revision4 under current engagement revision3.
8. Bind another fresh session and read both saved quote/private wording while its own-operation status remains idle. No earlier acknowledgement is reconstructed.
9. Verify original root arrays, unrelated root quote fields, legacy Work and the entire original snapshot hash remain unchanged.

These are local JS-session/database checks, not genuine hosted sign-in, physical-device persistence, process-death or provider acceptance. Original fake customer/source fixtures belong only to the disposable test database; the application never restores them into the returning session's arrays.

## D. Account-only private follow-ups and useful continuity

`CanonicalPrivateFollowUp` now accepts an exact customer reference separately from the original optional local customer prop. It reuses the same established finite private reader/writer and registered current context. Private follow-up eligibility is separate from historical visibility and is limited to the owning canonical creator. No unattributed legacy reply/follow-up text is copied or newly attributed.

Private revisions remain independent from the Work revision. The UI reviews existing versus proposed exact wording, validates one-use private-target receipts and independently reads the accepted revision/text. Newer typing during pending reads survives. A failed later read cannot erase a genuine acknowledged receipt; a lost acknowledgement remains unknown and cannot be repaired by matching words. There is no blind replay.

A real continuity defect was identified before delivery: rendering the private editor only while its account binding was currently valid would unmount its in-memory words when eligibility expired. The corrected parent keeps that originally authorised private editor mounted, but read-only, while showing why fresh review is required. The focused regression retains unsaved wording; the final SQL-backed bridge also expires the client binding, verifies exact unsaved text remains visible/read-only, verifies no such text was saved to SQL, and exercises deliberate Keep/Discard before closing. Scope/owner changes still hide private content from a different context.

This completes useful quote→private-follow-up continuation for the same immutable engagement. It does not send a message, change a quote's Prepared lifecycle, accept it, create a booking, issue an invoice or collect payment.

## E. Source comparison, correction and retention

The prior finite comparison remains the route for reviewing retained original and current authorised facts. Source hashes, original enquiry/customer IDs, original source evidence and canonical UUID are not rewritten. A changed source makes fresh edit-context validation fail; missing/ambiguous/malformed/foreign/private-restricted records remain read-only or unavailable. Existing historical observations cannot become edit contexts.

No rebase/correction mutation is added. An authoritative current-source relationship/version, deletion/erasure handling and permitted disclosure of prior facts need an explicit finite policy before such a write. Historical preservation is not blanket permission to retain personal information that must lawfully be removed. No real erasure request/customer data is processed here; legal retention/purge remains a real-data rollout gate.

Legacy migration remains operator-only and unavailable to application callers. Canonical creation authority must not be confused with original authorship of migrated private words. The positive returning-editor journey uses genuinely owner-created fictional canonical quotes; no hosted legacy backfill/attribution is approved. Source-less history/unknown compatible data remains preserved in its original supported form. The original booking request/link/diary/durable Work ledger has no newly reviewed canonical-ID acceptance/transaction contract, so booking execution and lifecycle changes remain unavailable.

## Fresh verification and retained candidates

Complete outputs are in the [application CHECKS](RETURNING_ACCOUNT_EDITING_APPLICATION_CHECKS_2026_10_24.json) and [SQL CHECKS](RETURNING_ACCOUNT_EDITING_SQL_CHECKS_2026_10_24.json); counts below are the final selections, not accumulated candidate totals.

| Selection | Fresh result | Exit |
| --- | --- | --- |
| Original disposable PG59–66 baseline |262 passed,0 failed/blocked/unexecuted |0 |
| Canonical PostgreSQL |96 passed,0 failed/blocked/unexecuted: all prior83 plus13 edit-context cases |0 |
| Final frozen original-component→actual-PG bridge |58 successful RPC children, Node0, exact source/tree/clean state, legacy/snapshot unchanged |0 |
| Final complete application selection |381 passed,0 failed/blocked/unexecuted; all child exits0 |0 |
| Production foundation |105 passed |0 |
| Seven-file parser, native-source parser, Python compilation, pinned tool health, static architecture and diff checks |Passed |0 |

The final bridge explicitly covers the complete new returning-owner quote/private journey and corrected editor lifecycle on **the same frozen implementation**. It also reruns real delayed SQL response/new typing, source-correction comparison, exact independent target preservation and deliberate unknown-outcome/no-replay paths. Member/admin/co-owner/foreign/revoked/anonymous denials, stale/null/source-incompatible contexts, actual revocation/concurrency CAS, raw-access/legacy-write rejection, private isolation and retain-data rollback are exercised in PostgreSQL. Fresh edit contexts deny after rollback revokes writer execution.

SQL SHA-256 `6e13c33d933b5ac481fcb609f4304ce656fc64e489fb6e2d08eb381050fc80e0` matches the tested fused candidate. Bridge prerequisites now require96 stages and a matching candidate hash. PostgreSQL17 used the approved cached runtime, exact disposable directory, explicit empty TCP listen_addresses and private0700 Unix socket; runners rechecked those conditions before testing. The server was stopped afterward. Mock UID roles and scheduled lifecycle fixtures are not Supabase JWT/PostgREST or native React/device acceptance.

The initial parent expiry test failed with exit1 when the private editor was unmounted; the failure log is retained. The corrected test explicitly uses unsaved private wording. Two incomplete full selections are preserved with runner2:166/0/0/215 and94/0/0/287, intentionally interrupted for the correction and expanded bridge coverage. They are not counted as passing complete runs. Earlier successful59-call candidates remain intermediate evidence; UUID page position can alter the number of list reads, so final58 calls does not mean a missing assertion. No test assertion/denial, VM limit or runner timeout was weakened; previous missions' failures/cancellations remain untouched.

## Security, architecture and remaining gates

Server-derived identity, live owner membership, canonical creator, exact business/customer/source/UUID, independent CAS and membership-before-row locking remain mandatory. Public RPC EXECUTE alone is not authority. Effective grants, fixed search paths, no private-schema helper access, no raw snapshot/table read and no full-payload write fallback are preserved. No new generic JSON operation, parallel store, ledger, customer registry or root account controller is introduced.

All source fuses and `CANONICAL_WORK_ACCOUNT_ENABLED=false` remain intact. No hosted activation is claimed. The unchanged Phase52 retention-loss probe has SHA `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`; passing local candidates are not proof that currently unmodified hosted old clients cannot lose data.

Static audit:1,526 source files/160,469 physical lines/3,055 static relative edges/zero detected cycles. AppController is unchanged at18,287 lines/97 imports; no production module/package is added. The original quote hook has an explicit narrow account branch, not a new quote implementation. UI source/owner dirty-state metadata stays in established specialists and the original canonical session.

The context read temporarily locks its exact target using the original helper and validates original snapshot JSON sources; source scans and large-history throughput still need measurement. Owner-wide index and bounded20/50 keyset pages are retained; no lifetime engagement cap is introduced. No native rendered/a11y, hosted ACL/view/service-role bypass, actual JWT, browser/two-device/process-death or provider/release acceptance is inferred from these local checks.

Remaining gates: reviewed source-rebase/retention/erasure policy; legacy private authorship before any backfill; actual isolated JWT/PostgREST and mixed-client/service acceptance; unsupported Work/job/booking lifecycle; trustworthy customer acceptance and exact canonical-ID request/diary/ledger association; broader domain account read/write compatibility. No source repair, sending, acceptance, booking, invoice/payment or tax authority is added.

The next substantial customer-value stage is a reviewed source-change decision journey that preserves unsaved quote/private words and immutable original provenance, with an explicitly justified current-source correction contract only after retention/ownership decisions. In parallel, prepare the minimal separately approvable authenticated staging slice for the now locally connected returning quote/follow-up journey; do not infer broad cutover readiness.

Additional external spending **£0**. No hosted Supabase reads/writes/migrations, deployment, rollout activation, real customer/provider communication, booking/payment/tax execution, publication, paid build, screenshot/simulator capture, workflow dispatch, merge/rebase/force-push/history replacement, dependency modification or PR closure. Private master/confidential provisioning remains outside public Git; draft21→23→24→25→26 stays open/draft/unmerged.
