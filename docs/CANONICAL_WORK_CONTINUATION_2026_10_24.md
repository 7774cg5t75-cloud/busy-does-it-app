# Canonical Work continuation, private follow-ups and historical inspection

24 October2026. Existing Mission15 branch, draft PR26. **Implemented and locally verified; hosted switch remains hard-disabled.**

Owners can now reach the existing canonical quote experience from Work and the original Get Paid shortcut, select the correct existing customer, inspect individual engagements and continue their independently revisioned quotes. Each supported engagement also has an owner-private follow-up editor with deliberate review/save, independent readback and repeat editing. A new finite historical reader retains access to the owner's recorded quote when the original source is corrected or unavailable, without granting editing authority.

## Verified authority and checkpoints

The genuine private V22.51 Word remains accessible and was checksum-reverified: `9740b05c5e523ef881e50a03f3fd65b29c65667b2c874992712575db20aa2c3b`. Its complete review from the previous mission is reused: cover/footer22.51,2,198 paragraphs/19 tables, including Sections63–64. Private original and extraction stay outside Git. Individual authoritative engagements remain the approved architecture; no master amendment or hosted activation is inferred.

| Checkpoint | Commit | Tree |
| --- | --- | --- |
| Starting GitHub | `a5b1225141a86bc451bbf730f33fea8fce9901c8` | `7b3f0f55571dd88ca2c8d8d9f202b7fd1045040e` |
| Clean starting local mirror | `3110ccf323eba1fd3968e85a38dc75c8923c6b53` | Same starting tree |
| Connected implementation | `f9f82bc62dae3b478458868869c7a926db16adf5` | `293d18435441fa28d3418f08d14c24d62b1f3afb` |
| Discard/readback correction | `448a46f1b6d4923b572d03eedd855331ad80b39b` | `ffb4b498fd10d82b0ac64e7cc743462c3839bcbf` |
| Final frozen local source | `370ff39f33f9aebfff318d3daeebaa4d6b7ba59c` | `19ea73db58c3740e4fe2fc8725e6859470bb5236` |
| Matching functional GitHub object | `bf1178945951f84d59f50a18b931bd16c08a283e` | Same frozen functional tree |

Mirror/API commits differ in identity but match exactly by tree. Delivery documentation follows the frozen functional source; the final branch head is reported at delivery without inventing a self-referential commit ID. Starting worktree was clean; dependency heads/bases were independently rechecked.

## A. Work/Get Paid continuation

`CanonicalWorkEntry` is a bounded-purpose selection surface mounted in original WorkHub and HomeCoreAreas' existing Get Paid explanation. It uses existing customer objects and the established `CanonicalWorkPanel`; it does not create a customer registry, quote engine, account controller or storage owner. Duplicate customer IDs and foreign-business local objects are excluded. Selection binds owner/business/workspace and exact customer object/fingerprint; existing dirty navigation must approve a transition.

The panel still uses original PrivateQuoteFields, useQuoteActionReview, enquiry preparation and Keep/Discard owners. Amount, date and exact owner wording are reviewed and saved through the existing finite canonical create/edit RPCs. Record selection does not update `replyActions`, root quote fields, global snapshot revision or customer arrays. Two supported engagements remain independently selectable and editable. The local panel is hidden when its original owner/business/workspace/customer binding changes, retaining its in-memory fields without exposing or rebinding old words to a new context.

All canonical controls are absent when `CANONICAL_WORK_ACCOUNT_ENABLED=false`; no flag is activated. The Get Paid shortcut continues to explain that invoices/payment collection are not enabled. The new integration is an inline original quote working surface, not a claim that account-only customers have been restored into local state. A genuinely available original customer is still required by this client slice.

## B. Engagement-private follow-up

`CanonicalPrivateFollowUp` binds original owner-edit navigation to the existing canonical private-draft adapter. The supported UI kind is **followup**; server `reply` wording remains available only through the existing finite contract, not a newly completed general reply workflow.

Supported sequence:

1. Select an engagement and inspect its current strict quote revision/source.
2. Explicitly inspect the authorised owner's private follow-up, including a genuinely absent draft at revision0.
3. Prepare exact owner wording in a multiline shared Field, with no assumed quote delivery/acceptance.
4. Review old account wording and proposed exact wording; Keep editing or approve a one-use finite private save.
5. Validate the exact target receipt, then independently read back private revision, engagement revision and exact text.
6. Deliberately edit/save again using the newly observed draft revision, or reopen in a fresh JS session as observation only.

The editor owns wording only. Independent private revisions, Work revision, actor/business/customer/engagement/kind and original source checks remain in the established adapter/server. Typing epochs, selected view, source identity and workspace changes invalidate retained approvals. Duplicate callbacks deny; pending operations do not run twice. Original dirty navigation protects private wording while switching engagements, sources or customers. No legacy private wording is copied into this editor.

An exact receipt confirms one private target only. Fresh matching text never supplies a lost own acknowledgement; unresolved outcomes keep the existing mutation fence. If readback fails after a valid receipt, the UI preserves that distinction explicitly rather than suggesting the acknowledged save failed. A concurrent changed engagement requires reopening the current strict record before review. These are local synthetic/component guarantees, not durable process-death/exactly-once or actual device acceptance.

## C. Historical availability versus editing authority

The new `busy_work_history_v1` is a single owner/creator-scoped read. It explicitly checks trusted auth.uid and live owner membership, then exact business/customer/engagement and canonical creator. It returns only the established finite quote projection plus fixed original enquiry ID, source snapshot revision/hash and reviewedAt. It does not return raw source evidence, unknown extensions, contacts, legacy private replies or private-draft text.

Its `sourceState` distinguishes current/changed/restricted/unsupported/unavailable. These are conservative categories, not fabricated records or proof of why something was removed. Source ambiguity/malformed collections remain unsupported; a changed ownership/tenant marker is restricted; missing snapshot is unavailable. The owner's legitimately retained canonical record remains inspectable under current membership even when its source is not mutation-eligible. Another owner/admin/member/foreign/revoked caller cannot use history to gain access.

Every result is labelled `historicalOnly=true`, `mutationAuthorised=false`, `notOwnReceipt=true`. The client does not register it as a mutation observation, so even current-looking historical data cannot mint an edit approval. The original strict reader/mutation target/source checks are unchanged. The panel offers explicit historical inspection alongside current Open; historical fields remain read-only. There is no source re-association, source repair, restored deleted customer, changed revision or resurrected Work action.

Membership locking precedes snapshot/current-source validation and retained row SHARE locking. Row identity/provenance remains immutable; compatible unknown Work fields remain stored and excluded from the public projection. Historical private-draft inspection after source changes is not added: private reads still require current source eligibility. Explicit correction/rebase, privacy erasure and retention policies remain future reviewed contracts.

## D. Legacy preservation and migration

The prior operator-only migration candidate is preserved and freshly rerun within the canonical SQL suite. Only fictional known-owner records exercise complete-record retention, original-slot freezing, duplicate denial and rollback. Current source relationships do not establish the original private-wording author, so no broader app migration/backfill authority was introduced. Source-less original actions and history summaries remain in their genuine supported form; they are not converted into invented complete records.

Application, anon and service-role EXECUTE remain denied for migration. Effective inherited grants, private schema/helper denial, fixed search paths, RLS, membership/source checks, raw snapshot privacy and full-write fences remain. Rollback retains data, identity/legacy guards and both original fences while revoking finite mutation execution. Historical read is read-only and remains behind the same explicit live owner/creator predicate. No hosted migration or dual-write is activated.

## E. Quote-to-booking boundary

Original `ownerBookingRevisionV3233`/association code and request/link/durable Work ledger identify business/app/request/customer/action and diary revisions. They do not yet persist a canonical engagement-ID relationship or prove acceptance of a Prepared canonical quote. Existing locally recorded Accepted→booking Draft preparation is not independent customer acceptance or a canonical booking transaction.

No lifecycle mutation was added. The canonical Prepared-quote schema remains intact. A future same-ID quote→booking transition needs reviewed acceptance evidence, exact request/ledger association, diary/conflict handling, independent CAS and truthful transaction receipts. Creating another engagement or editing only a local booking would not satisfy that contract.

## Fresh execution and actual defects

Complete outputs are in the [application CHECKS](CANONICAL_WORK_CONTINUATION_APPLICATION_CHECKS_2026_10_24.json) and [SQL CHECKS](CANONICAL_WORK_CONTINUATION_SQL_CHECKS_2026_10_24.json); previous mission CHECKS remain unchanged historical evidence.

- Original disposable PostgreSQL baseline:262 passed/0 failed/0 blocked/0 unexecuted, runner0.
- Canonical PostgreSQL selection:67/0/0/0, runner0. This reruns all60 prior canonical stages and adds historical correction/removal/ambiguity/malformed/foreign-source inspection, role/foreign/revoked denials, missing snapshot and private non-disclosure. Existing concurrent revocation/CAS, independent writers, exact readback, unknown retention and fail-closed rollback remain exercised.
- Latest completed original-components→actual PG bridge:35 finite RPC calls, every child0, Node/bridge0. Quote A/B independent creation/reopen/edit and original snapshot preservation remain tested. Actual new follow-up UI inspects, saves twice, fresh-session reads and verifies no draft for the other engagement. Historical observations cannot mint write approvals. Additional page reads vary with UUID order; call count is execution evidence, not feature coverage inflation.
- Final complete application selection:379/0/0/0, all children/runner0 on the clean frozen source. Original VM limit and runner timeouts unchanged. The35-call database bridge was completed at checkpoint9908c378 before the final workspace-effect correction; final original-parent/source tests cover that correction. A later optional bridge attempt was cancelled without a result file; it is not counted or automatically retried.
- Production foundation105/105; eight-file syntax, native-source parser, Python compilation, pinned51-package tool health, architecture audit and diff checks passed. No root Expo install/native build/typecheck is claimed.

The new original-parent regression reproduced an actual Discard bug: the private editor's second epoch check rejected a legitimate readback after Discard itself advanced the typing epoch. A changed remote wording fixture failed with exit1 before correction, then passed after allowing the original guard to execute the authorised transition. Typing during review, duplicate callbacks, Keep and role-change denials remain asserted. A separate wording defect was corrected so a confirmed target receipt remains explicit when readback is unavailable. Scope-bound rendering prevents old editor contents being shown under changed actor/business/customer context.

Four incomplete full runs are retained, not counted as passes:163/0/0/216,96/0/0/283,352/0/0/27 and30/0/0/349, all intentionally interrupted with runner2 before the corrected frozen selection. A second reproduced defect registered hidden old-editor dirty metadata against a new workspace; the panel now reports dirty state only while its original binding remains visible. The parent fixture explicitly executes scheduled lifecycle effects because the offline runtime intentionally does not execute them automatically. Initial no-effect fixture failures are retained separately from the genuine before-fix lifecycle reproduction (exit1); the final corrected parent test passes without relaxing its assertion. The second checkpoint updates the bridge's prerequisite from a historical minimum to exactly67 stages plus a matching SQL SHA; README now matches the current selection. One local PG start failed with exit1 because default startup used `/var/run/postgresql`; it briefly opened loopback listeners before shutting down. No test queries ran in that failed start. Corrected starts explicitly disabled TCP and used the private0700 Unix socket; both SQL runners verified no TCP and exact disposable data directory. The cluster was stopped after final verification.

Tested SQL SHA-256: `f105fe4a3e0bca77a5583bc81dcff9dbb2f425376f55ce00d6a96eafee56bee5`. Phase52 known-loss probe unchanged: `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`. No assertion weakening, hosted advisor/project query or genuine JWT acceptance claim.

## Architecture, limitations and next customer outcome

Static audit:1,523 source files/160,235 physical lines/3,048 static edges/zero detected cycles. AppController remains18,287 lines/97 imports and is unchanged. WorkHub and HomeCoreAreas add bounded wiring; two focused UI components reuse original customer objects, quote fields, theme components, owner-navigation and existing canonical session. No production package, store, booking engine, ledger or root state owner is added. Existing large modules remain integration risks; static import graphs do not certify runtime coupling or performance.

Account engagement pages remain default20/max50 server responses without a lifetime limit. The local customer selector and original Filed-source controls still need larger-list UX/performance assessment. Historical current-source classification scans original snapshot arrays; no history-scale benchmark is claimed. Original complete JSON is retained internally, while finite supported fields are displayed. Actual Midnight/Daylight rendering, accessibility/device acceptance, hosted JWT/PostgREST/ACL/view/service bypasses, two-device races and process-death durability remain unverified.

Next useful stage: deliberate source-correction comparison/rebase with immutable provenance and private-draft conflict review, plus original Work/Get Paid engagement selection across reopening without requiring an unavailable local customer. Resolve legacy authorship policy before any backfill. Then define the smallest canonical-ID booking association and acceptance contract before adding lifecycle execution. These gates should guide separately authorised isolated staging; broad cutover remains blocked by unsupported readers/writers/services.

Draft21→23→24→25→26 remains open/draft/unmerged with unchanged dependency bases/heads. Additional external spending **£0**. No hosted Supabase reads/writes, migration, deployment, rollout activation, provider/customer communication, financial/booking/tax execution, publication, screenshot, simulator capture, paid build, workflow dispatch, merge/rebase/force-push/history replacement or PR closure. Private originals and confidential provisioning material remain outside public Git.
