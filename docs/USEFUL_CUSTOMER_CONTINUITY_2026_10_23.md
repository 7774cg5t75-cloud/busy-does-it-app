# Connected customer work — useful continuity

23 October 2026. Source-tested implementation; no hosted execution, native acceptance or deployment.

## Verified authority and checkpoints

The actual private V22.49 Word was reopened: SHA-256 `6107043b5470741cbc0bdb67ee52cf99917d1f9886f39a14d22fa290f2dfef11`, complete ordered body/table content checked against the previous private full review (2,132 paragraphs, 19 tables). Original and extraction remain outside public Git. Current AGENTS, architecture, permanent engineering policy, previous Connected Work Status delivery and complete353-pass CHECKS were reviewed; earlier results were treated as historical.

Starting local commit `fae9ee76123822ad6656ae2ffa4a638c25494f41` and independently observed GitHub `9152c6ee26e2659463668fb511ba7447b99d5930` had identical tree `15ffb839b4bf4f3414a87f676d5932a5dd651155` and a clean local worktree. The distinct local/API histories were preserved, not rebased or replaced.

Frozen functional local commit `12c2faa6439ebd44c67def1dceba33face51c770` and additive GitHub commit `76fd32a072bfea171783be0f23c684e73c63efce` share exact tree `1a7bd40be28369abb3b6efa1830eafa0d573b0b2`. The following documentation-only commit records evidence; it does not change that tested functional tree. Final documentation references are supplied in delivery rather than embedded recursively in their own commit.

All five original PRs were independently open, draft and unmerged at preflight: #21 → #23 → #24 → #25 → #26. Existing branch and dependency bases are preserved. Remote writes use actual expected heads and force=false.

## Customer tasks implemented

**Investigate an interrupted booking without replaying it.** The original Work detail now presents the customer/request identity, recorded local status, exact bound attempted operation/revision, whether a valid own-operation receipt exists, and the narrowly verified current request/Work-ledger observation. A source observation never turns an uncertain attempt into an acknowledged save or booking confirmation. The operation remains fenced. Competing inspections are last-request-wins; changed typing, role, actor, source/action or operation hides stale investigation evidence.

The existing original `owner_booking_revision_v3233` response is checked for its exact fixed source-state/ledger tuples, tenant/request, supported identity, timestamp and read-only/no-delivery/no-retry flags. Only allowlisted metadata is retained. This improves the original client read validation; server authentication remains authoritative. Unknown extensions are not presented.

**Open the recorded diary day deliberately.** The owner can move from the booking to its original recorded date using existing navigation and owner dirty-edit review. Keep preserves exact newer note wording; Discard uses the original guarded transition. Missing/invalid dates deny before asking for destructive discard. This route does not establish availability, confirm a calendar event or submit a booking change.

**Reuse supplied enquiry requirements without replacing a quote.** The existing quote source card offers “Add supplied details without replacing my wording”. The original review shows exact current and proposed text. Only structured customer-supplied requirements from the original eligible Filed enquiry are appended, visibly labelled unconfirmed. The owner-authored prefix, amount and date remain untouched. Conflicting existing labelled values and repeated additions deny rather than overwrite. Existing customer/business/source/profile/revision/view/typing guards remain in force.

The original prepared-quote save and original form loader retain the resulting private wording and enquiry reference. This is the existing local original-record pathway, not a new durable device/account/financial receipt. It does not issue, send or accept a quote.

**Corrected stale review decisions.** Keep now consumes the original enquiry and asynchronous catalogue review callbacks. An old Use callback cannot change wording after Keep, nor can a duplicate Use trigger another catalogue read. Typing, source/profile changes, role/business/revision and view changes continue to deny stale approvals. No new ticket engine or storage owner was introduced.

## Original specialists and architecture

Seven existing production files changed: `businessSnapshotSession` and persistence ownership were deliberately left intact. `bookingCancelReadbackV3233` validates the existing original projection; AppController reuses it in the existing read branch; `useBookingActionReview` owns volatile investigation/read ordering/diary navigation; `work` presents it. `enquiryReplyText`, `useQuoteActionReview` and `QuoteEnquiryContext` own the finite requirement addition and review. No new production module, package, generic recovery layer, customer store or assistant was added.

AppController remains18,255 lines. Work grows4,282→4,291. Static audit:1,486 source/test files,158,612 physical lines,2,947 relative import edges, zero detected static cycles (previous1,485/158,518/2,941). New test infrastructure reuses the original quote preparation fixture, inert component runtime, actual parent extraction and navigation registry. Oversized AppController, Work and miniApps remain maintainability hotspots; dynamic/aliased imports are outside the static graph. No cosmetic large refactor was attempted.

## Actual verification

The final source was committed and clean before the complete pinned offline selection. Actual runner exit0; **354 passed,0 failed,0 blocked,0 unexecuted; all354 child exits0**. Selection hash `9a9ab23aa253b3037540f828a967cd8d425df604336a89055de1bfa035c5afe0`. Full timestamps, outputs, durations, hashes and child exits are in the companion CHECKS JSON. This includes the original security, tenant, finite account/recovery, receipt, builder, content and Phase52 retention counterexample tests; none was skipped or weakened.

Fresh independent checks:105 production foundations exit0; seven changed production files Babel syntax/transformation exit0; existing Phase67 appearance/Automatic/AA-token-contrast regression exit0; pinned dependency/toolchain health exit0; architecture audit exit0; whitespace check exit0. Node24.19.0/npm11.9.0 and51 pinned offline packages are unchanged. Full Expo/RN install and root lockfile are absent: no full native/Expo build, native screenshots or visual acceptance is claimed.

New original-parent regression runs actual server classifier → client projection → original AppController preparation → Work investigation/dirty diary transition, including competing asynchronous reads. It also runs Filed enquiry → original source card/review → unchanged amount/date → original prepared save → original form reopening; it covers stale source/profile/typing/role/business/revision/view, duplicate addition/Use, and cancelled catalogue approval. IO is inert and fixtures synthetic, not genuine hosted JWT/provider evidence.

Two unsuccessful focused candidates are retained in CHECKS. Both exposed fixture ordering/ownership errors: rebuilding a source root each render correctly tripped stale navigation; typing after invalidating a source correctly hit the conflict guard. Fixtures now match original ownership and type before invalidation, retaining the behavioural assertions. The frozen full run had no failures or interruptions. One auxiliary previous-report lookup used the wrong filename suffix order, exit1, corrected by bounded file discovery; it was not a failing application test.

## Authority limits and next functional sweep

The original server revision projection (`supabase/functions/busy-mini-apps/ownerBookingRevisionV3233.mjs` and its original Edge caller) supplies request/app/business/status/revision and Work-ledger facts, but no exact customer/action association or supported date/time rescheduling contract. Therefore this sweep does **not** adopt a remote status into local booking state, clear an unknown acknowledgement, or implement rescheduling. Related conversation detail routes can mark unread state and were not repurposed as automatic read-only investigation. A matching record still cannot reconstruct an own-operation receipt.

No new durable unfinished booking recovery is claimed. Source observations remain session evidence; previous local/device/account distinctions, independent fields and original persistence semantics remain. Existing supported finite account customer/reply operations are unchanged. Content/Growth were not expanded because the coherent Work/quote route took priority.

Next: extend the existing authoritative booking projection only after its exact target/source association and permission contract is reviewed, then connect explicit conflict-safe reconciliation to the existing customer/diary specialists. Prioritise that usable continuation and source-bound quote recovery over more visual polishing. Genuine owner/member/revoked/foreign JWT/PostgREST, provider receipts, two-device/process-death recovery, native/browser behaviour and integration acceptance remain separately gated.

No SQL/Edge changes, hosted operations, new privilege, broad raw reads, full-payload fallback or financial execution. Snapshot fences, abort fuses, disabled hosted switches, Phase52 counterexample, dependencies and screenshot pipeline are unchanged. Appearance/Home voice/orb/mini-orb and all six destinations retain existing owners. £0 additional external spending; no screenshots, workflow dispatch, deployment, booking, messages, publishing, payments or tax actions. Oldest-first PR integration still requires its separate approval; no merge, rebase, force-push, closure or history replacement occurred.
