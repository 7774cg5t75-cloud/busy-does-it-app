# Returning-customer experience and connected functional completion — 24 October 2026

Four connected source implementation sweeps, verified with inert original-parent/component/storage fixtures. Account activation, hosted JWT/PostgREST, native/device and provider acceptance remain separate gates.

## Verified authority and checkpoints

Actual GitHub start `58eb4a932ef3f8b64db98e09531c52895ea6d859`, clean local start `cc88258daaacdc0a78151966cf9d3ab7239a1697`, identical tree `31a1846ae93053623580d63122c54daaf450d3cd`. Mission15 branch verified. All five dependency PRs independently open, draft and unmerged, with original bases21→23→24→25→26. Current instructions, architecture, engineering policy and complete previous delivery/CHECKS were reviewed;363 application passes and262+45 SQL stages remain historical.

Genuine private V22.49 Word reopened; exact SHA-256 `6107043b5470741cbc0bdb67ee52cf99917d1f9886f39a14d22fa290f2dfef11`, cover/footer22.49,2,132 body/table paragraphs/19 tables. Private original/extraction and original provisioning evidence remain outside Git. No redesign, new execution authority or product-master rewrite.

| Source checkpoint | Local commit | Additive GitHub commit | Identical tree |
|---|---|---|---|
| Returning customer context | `b2f73010be3674a0cd1b466b2cb9a4ded5f2d87f` | `79b1b61f7dfa7ba74c183250521d2a5f24742f3e` | `15bfb2b5541d508d2da0c3932cab95ee7db78a8f` |
| Quote/Creator/builder continuity | `9a8dd3fd83bd7b1ffa9263678c785c8644e288a0` | `86f91e809e8233c66e7f243474c2bdde0899f293` | `aea9ed388d9e02b3455a56c77f52dd21bb4cc53b` |
| Final functional freeze, exact role invalidation | `2ee605f7025907aa9a62837dc45245ceae3b5163` | `2ffb9eca984c8e9cb9863e23deed3e2d349841a5` | `9f7c6b5c958fa2cbac211b9d07f760ecbe22f2fe` |

Documentation/evidence follows this freeze; the final delivery message identifies its own ending checkpoint without a circular self-hash. Every API-created tree was checked against the corresponding local tree; branch publication uses the actual expected remote head and force=false.

## A — Supported returning-customer context

Extended the original Business App request interface and existing booking-readback specialist, reusing `busy_owner_booking_work_review_v1` and the existing account session/conversation reader. No new SQL, endpoint, controller, root state owner or customer store.

The owner can inspect one exact source-linked account customer and Work booking without requiring a restored local customer object. The view explains service, recorded account booking state, date/time/timezone and source/account revisions. It labels the result as the **last checked account observation**, not a recovered editable customer, whole-workspace save or lost-operation receipt.

A finite client display comparison now distinguishes:

- No corresponding device customer: account-only inspection remains useful.
- Matching listed device facts: does not establish saving or settle uncertainty.
- Different device/account facts: both are retained, without automatic replacement.
- Duplicate device identity: no local customer is selected from ambiguous copies.
- Foreign-business or unsupported local source: it is not combined with the observation.
- Account/Work slot conflict: diary continuation remains disabled.

Read-only Details reuses the existing accessible disclosure component and contains only fixed customer/action/request identities and checked revisions. Contact details, notes, private replies and unknown extensions are excluded. Active decisions remain outside the read-only disclosure.

Corrected an actual actor-binding gap: the previous view checked business/app/request and owner role but did not compare the packet ownerId with the current actor. Another owner's cached observation is now hidden when actor, business, request or role changes. Malformed/unknown response fields are rejected. A failed fresh inspection removes the prior observation instead of leaving an old result displayed as current; original request fields and typed wording are kept.

Existing fresh account/source reads, actor/business checks, true typing epochs, one-use dirty navigation and diary routing are unchanged. No account object is inserted into local arrays, no workspace revision advances, no editable-customer route is invented and no uncertain write is retried or converted to a receipt. `TRUSTED_WORKSPACE_BOOTSTRAP_ENABLED` stays false: this supported account view is implemented and source-tested, **not enabled against hosted data**.

## B — Checked private quote-follow-up reopening

Extended the existing scoped `readPrivateQuoteCopy` projection to return exact private follow-up wording only after the **complete original quote record and customer identity** match the current private device cache and revision. It is limited to eligible locally labelled Sent quotes without a recorded follow-up timestamp; that label is not independent provider-delivery evidence.

The original QuoteFollowUp editor offers “Review checked private follow-up wording”. It shows current and checked words, then explicit Keep editing / Use checked private wording. Use requires another independent exact device read, consumes the choice once and changes only the existing editor field. Amount, dates, quote status, saved record, customer history and unrelated work stay unchanged. No account write, message, issue, acceptance or payment occurs.

The approval binds original customer/action, actor/business/workspace, exact role, view, revision through the original parent, genuine typing epoch and current Filed-enquiry origin when present. New typing including ABA, navigation, source mutation/removal, partial/missing cache, account switch, competing record change and every role change invalidate it. Matching words do not reconstruct an own-save receipt. Another session can independently reopen the legitimately recorded follow-up through the existing preparation parent; that is observation, not proof of a prior device write acknowledgement.

The original reviewed private wording record/save path and scoped cache remain the owners. No second quote ledger or restoration framework. Prepared quote amount/date continuation remains separately covered by original regressions.

## C — Saved social wording continuation

Generalised the existing newsletter wording-only specialist into the same finite social/newsletter operation, retaining original newsletter labels/format checks. Added “Review saved social wording only” to the original Creator status surface.

The owner can prepare from approved Brand DNA/business facts, retain a saved original, edit media/brief/channels, inspect current-versus-saved text, deliberately Keep or Use saved social wording, save through the original private upsert and reopen through its protected transition. Only words change during the choice; independently edited photos, audience brief, channels, selected target and unknown saved fields remain. No duplicate content engine or store.

Original source confirmation is required before offering the old wording. Corrected/revoked business facts, actor/role/business changes, selected/removed/duplicate records, stale typing or media/channel changes invalidate the choice. Another fact review is required after correction; old wording is not automatically certified as true. Existing private device/account/publishing status distinctions remain; this new choice itself does not establish durable storage, consent, unsubscribe authority, media rights, scheduling or publication.

## D — Builder encrypted recovery readback

Original App Studio and Website history checkpoints previously trusted native write completion alone. They now read the exact encoded value back from the **same original scoped key**, inside the existing serialized queue, before reporting success. A silently dropped/truncated/foreign write or interrupted read is a failure; current draft/proposal stays available. App Studio's existing delete path also verifies absence, so it cannot silently claim a discarded checkpoint was removed when the old value remains.

The actual original App Studio session is tested with a silently dropped durable-before-write intent: it retains the proposal, reports the recovery error, dispatches zero operations and does not label an unattempted mutation uncertain. Good checkpoints independently reopen with exact wording/revision/source; same-scope remounts still serialize write/read pairs. Existing Website history limits, draft identity, Undo/Redo, age, recovery-point review and source checks remain.

These are synthetic native-storage fault tests, not proof of OS flush durability, physical-device restart or process-death acceptance. Owner website/app appearance, drafts, revision, published versions and approvals are unchanged. No new builder, project registry or publishing path.

## Fresh verification

- Full frozen application selection: **367 passed,0 failed,0 blocked,0 unexecuted**, every child exit0 and actual runner exit0. Four focused original-parent regressions added; all previous assertions retained.
- Independent production foundation: **105 passed, exit0**.
- Syntax:14 changed JS/MJS files parsed, exit0. Existing native-source syntax, pinned tool/dependency health and architecture audit exit0. Actual original parent/component paths use inert IO and the unchanged10,000ms VM module limit.
- No SQL changed. The original reader/writer/provisioning/ACL/rollback files and PostgreSQL runners remain byte-identical; **no PostgreSQL execution is newly claimed**. Prior262+45-stage results are retained historical evidence only. No hosted UID/JWT or PostgREST enforcement claim.
- Source hashes, raw child results and retained candidates are in the companion CHECKS JSON. Root Expo/React Native install and root lockfile remain absent, so full native/Expo build, real rendering and device acceptance are unavailable/unexecuted rather than invented.

Retained unsuccessful/interrupted evidence:

1. Account baseline candidate exit1 expected an absent field (`undefined`) after failure; the initial implementation cleared it to null. Corrected the implementation to remove the prior observation entirely, preserving the original assertion and stale-data protection. Corrected candidate exit0.
2. App Studio baseline candidate exit1 exposed a write-only queue fixture that intentionally did not persist its fake native write. The original assertion remains; the fixture now actually stores the value and adds an independent final-load assertion. A separate new test explicitly asserts silent-write denial and zero real-parent dispatch. Corrected baseline exit0.
3. The executor disconnected during a requested syntax-check launch. No check ran. The managed runtime reconnected; local checkpoint and all remaining source/evidence were verified intact, then syntax passed. No installation, reset or silent rollback.
4. Preliminary complete selection was deliberately interrupted to add exact owner→admin role-change invalidation:159 passed,0 failed/blocked,208 unexecuted, runner2. No credit for unexecuted checks. Final fresh367 selection ran against corrected frozen source with a clean tree at start.

## Architecture and preserved boundaries

Nine existing production files changed, four focused regressions added, one existing fixture strengthened and the selection manifest extended. **AppController unchanged**. No production module, runtime package, state owner, ledger, assistant, database, general JSON merge or persistence engine was added.

Fresh static audit:1,500 source/test files,159,259 physical lines,2,983 relative import edges,zero detected static cycles. AppController remains18,261 lines and miniApps5,403; inherited oversized modules and the large stacked PR are real maintainability risks. Static topology does not certify dynamic imports or runtime coupling.

The original account reader's SECURITY DEFINER ownership, explicit auth/live-owner predicates, grants, search path, membership-first locks, supported schema/source checks, unknown-field non-disclosure and fail-closed rollback remain unchanged. So do tenant isolation, production abort fuses, hosted flags, exact target receipts and uncertainty fences. Phase52 counterexample remains unchanged, SHA-256 `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`; its demonstrated cloud-loss defect is not claimed fixed in production.

Original Midnight/Daylight/Automatic styles, six Home areas, BUSY orb/voice/guarded mini-orb, Brand DNA/Business Brain, customer/account privacy and all quote/booking/payment/publication approvals remain. Screenshot infrastructure and request trigger are untouched; its retained offline source check does not dispatch or generate screenshots.

## Scope, staging and next useful work

| Capability | Implemented/local verification | Remaining gate |
|---|---|---|
| One owner-scoped returning booking context | Fixed account packet + explicit local comparison + read-only details | Hosted switch false; real JWT/PostgREST/ACL/RLS/account switching |
| Existing diary continuation | Existing fresh read/dirty-navigation path retained and regression-tested | Actual device/two-account behaviour; no booking execution |
| Private quote/follow-up continuation | Exact original device-cache projection + one-use second-read review | Actual OS recovery; broad account saving remains unsupported |
| Creator saved-wording correction | Original approved-facts/target/review/upsert/reopen tested | Genuine device/account durability and source/provider acceptance stay separate |
| Website/App encrypted recovery | Original checkpoint/session readback and fault/queue tests | Native SecureStore/platform limits, process interruption, OS durability |
| Broad account recovery and unsupported domains | Remain local/read-only/unavailable under original fences | Finite original-authority contracts and compatible clients/services |

The previous minimum separately approvable staging matrix remains: exact original schema/provisioning ordering → effective grants/inheritance/defaults and real owner/admin/member/co-owner/revoked/foreign/anonymous identities → fixed readers/finite writers → compatible client/service slice → legacy raw-access rejection and fail-closed rollback. No new SQL was invented or deployed. Production-watch/founder services and unknown dynamic/import/restore paths still need separately authorised acceptance; services can remain disabled for a bounded customer-inspection rehearsal. Broad cutover is not ready.

Next substantial customer value: connect a supported enquiry/Work context to deliberate quote preparation using the exact original source relationship, then improve checked Creator device continuation and builder recovery where real source/cache authority permits. Across the six areas: Website/App Builder should prove native recovery before broader save promises; Content Creator/Growth should complete exact private draft readback before provider claims; Work should extend only finite source-bound customer actions; Get Paid should continue private preparation with amounts/dates/approval preserved. Separate isolated JWT/PostgREST approval is still needed before activating the account slice. Do not replace missing authority with name guessing, broad payload reads or generic restoration.

Additional external spending **£0**. No hosted Supabase access, migration, deployment, provider/customer communication, live booking, financial/tax action, campaign, publishing, paid build, screenshot generation or workflow dispatch. No merge, rebase, force-push, history replacement, PR closure or dependency-branch modification. Existing draft chain remains open and unmerged.
