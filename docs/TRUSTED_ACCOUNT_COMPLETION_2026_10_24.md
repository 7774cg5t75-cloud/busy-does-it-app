# Trusted account recovery and connected product completion — 24 October 2026

Implemented application source and a fused SQL proposal, verified with fictional local fixtures. No hosted activation, native acceptance or external business action.

## Authority and source checkpoints

GitHub start `4ad6d80cbcc55fb9a3a04b5ab0e6f3c05e579cc2`; clean local start `1e0a7eaca714e0df7d34ed4df385eec18ea1c938`; identical tree `c0a965870f61e3a45f6aced4e3896db60f58b106`. Original Mission15 branch and all five PR bases were independently checked. Current AGENTS, architecture, engineering policy, complete returning-customer report/359-child historical evidence, original private schema handoff, exact provisioning functions and relevant existing source contracts were reviewed. The historical results were not credited as new execution.

The actual private V22.49 original was reopened and verified: SHA-256 `6107043b5470741cbc0bdb67ee52cf99917d1f9886f39a14d22fa290f2dfef11`, 2,132 body/table paragraphs and19 tables, V22.49 cover/footer. Original and full extraction remain outside public Git. Six Home areas, Brand DNA/Business Brain, appearance/voice/orb, security and original approval boundaries are retained.

Frozen functional local commit `1ee136f52e94ef268a0caa35bf0800d46e4f0706`; corresponding additive GitHub commit `0a9f007deb86198811b9939fc4cc381d1f693ded`; identical functional tree `ee879fd8a9e3fbe40e435dcf82cad1c8921e5779`. Later evidence/documentation changes do not change functional source. The final delivery message identifies the documentation checkpoint; no circular self-hash is claimed here.

## 1 — Disposable PostgreSQL restored and genuinely executed

Restored PostgreSQL17.11 from the official signed Debian trixie repository, using an isolated APT configuration, existing archive keyring and signed-index verification. Full download URLs and exact versions were checked before download; both package SHA-256 values matched the signed index and retained Phase59 hashes. Packages were extracted without system installation, maintainer-script execution, service changes or extra dependency installation. The verified cache stays outside Git at `/workspace/pg17-disposable`; reproduction details are in `DEVELOPMENT_TEST_ENVIRONMENT.md`.

The cluster uses only a private mode0700 Unix-socket directory, `listen_addresses=''`, local trust inside that directory and host authentication rejection. Initial normal-sandbox socket binding failed with EPERM/pg_ctl exit1; per-command additional network permission allowed the local Unix socket. No TCP exposure, sandbox-policy changes or hosted connection were used. Final `pg_ctl ... -m fast -w stop` exited0.

Freshly executed the original Phase59–66 chain with the private exact provisioning functions supplied outside Git: **262 passed SQL stages, zero failed/blocked/unexecuted, runner0**. This reused the original synthetic framework and its expected denials, rather than creating replacement provisioning SQL. Synthetic `auth.uid()` and local roles are not real Supabase JWT/PostgREST acceptance.

## 2 — Minimum canonical customer/booking/Work reader

`docs/sql-proposals/account-work/reader.sql` introduces one finite owner-scoped review RPC, `busy_owner_booking_work_review_v1`. It joins the existing request, app, persisted request link, original durable Work ledger and **current original snapshot**. The actual original v339/v340/v342/v3180/v3181 migrations and atomic Work writer establish the synthetic association in tests.

It checks live owner membership; exact actor/business/app/request/customer/derived-action identity; link creator and Work confirmer; all three source revisions; exact current snapshot revision/schema1; one unambiguous original customer; and the original booking action's source request. Membership locks precede request/app/link/Work and snapshot locks. Removed, malformed, duplicate, foreign, stale and unsupported records deny. Another owner, admin or ordinary member cannot use this private slice. Broader collaboration remains a separate product/security decision.

The return is a fixed allowlist: identity/revision metadata; one customer's ID/name/service; one booking action's ID/type/status/date/time; one Work ledger identity/slot/timezone/state; and explicit read-only/non-receipt flags. Contacts, notes, history, private replies, unknown fields and raw arrays are excluded. Valid differing snapshot/Work slots remain a visible conflict rather than being repaired. Complete original payload/revision hashes remain unchanged.

This is a `SECURITY DEFINER` proposal with reviewed PostgreSQL ownership, fixed `pg_catalog,pg_temp` search path, fully qualified sources and helper, explicit EXECUTE revocations and authenticated-only invocation followed by trusted actor checks. No private-schema/table/column access is granted to clients. Effective deployed inheritance, defaults and alternative privileged paths remain unverified. The deliberate production abort fuse is intact; no hosted migration is claimed.

Frozen new-reader verification: **45 passed local PostgreSQL stages, zero failed/blocked/unexecuted, runner0**. Includes original owner/co-owner/admin/member/foreign/anonymous denials, identical customer/action IDs in a foreign snapshot, changed source/revisions, missing/duplicate/deleted records, unknown-field non-disclosure, raw SELECT/full UPDATE/POST/upsert denials, actual competing revision/revocation connections and rollback. Concurrency reader child exits3 are expected PostgreSQL denials with holder exits0; they are not hidden test failures. The actual SQL response was separately consumed by the client/parent regression.

## 3 — Original client return-to-work connection

Extended existing `businessSnapshotSession`, the booking readback validator and request conversation specialist. A narrow owner revision observation precedes the new fixed RPC. Every returned root/nested key and identity is checked. The session can inspect this bounded account-only context after read-only startup without requiring a restored local snapshot.

The original Business App request screen shows the exact current customer and Work identities, current account revision, snapshot booking and durable diary evidence, with agreement/conflict wording. Diary continuation requires a **fresh** request association and account read, original dirty-navigation review, unchanged view/actor/business/source and genuine reply typing epoch. Unfinished reply wording prevents leaving. New typing, including same-words ABA, account switching, stale source/revision and unrelated changed local payload deny stale completion.

No account record is inserted into local customer/Work arrays. No global local revision advances, no independent dirty quote/newsletter/website field clears, no missing record is manufactured and no unknown booking outcome or own receipt is reconstructed. Arbitrary customer editing/recovery remains unsupported. The actual AppController exports the adapter; original-root tests verify its disabled path performs no IO.

**Hosted use remains hard-disabled** by the existing `TRUSTED_WORKSPACE_BOOTSTRAP_ENABLED=false`. The complete account journey is therefore a prepared source/local-SQL slice, not an activated customer capability.

## 4 — Private quote-follow-up device continuity

The original `QuoteFollowUp` screen now reuses `QuotePrivateSaveStatus` and the existing `checkPrivateQuoteCopy`/scoped business-cache reader. Owners can verify whether the exact quote record, including previously recorded private follow-up wording, exists in the existing private device copy.

Newer unrecorded wording remains clearly separate; a checked older record never replaces it. Real typing epoch, view, customer, workspace, actor/business and original parent source/revision checks invalidate late completion. A fresh UI can independently observe the cache without recovering a prior own-save receipt. Zero amounts, dates, exact multiline words and unrelated fields are retained. Missing/interrupted reads remain unknown; no write is retried.

Corrected the shared status panel to require the receipt's **exact workspace scope**, preventing old-workspace evidence being displayed as current merely because record/customer/stamp happen to match. Account saving, provider delivery, quote issuance/acceptance and payment are not established. This continues the existing quote engine and device storage; no new ledger or account API.

## 5 — Creator private target integrity

Corrected the original `upsertSocialDraft` and existing handoff specialist. A selected saved draft must resolve to exactly one current eligible private record. Missing/deleted/duplicate, foreign-business or published targets no longer silently become another draft or update multiple matching records. Generated new-target IDs cannot collide with existing targets.

Words, media, channel choices, brief and unknown saved fields are preserved on denial. Deliberate separate-new-draft intent still uses the existing Creator workflow and retains the original saved target. Original parent/hook/upsert/reopen tests cover these paths, actor/role changes and stale typing. No media permission, marketing consent, publication, scheduling execution, account save or provider result is invented.

## 6 — Conversation draft race corrected

The original Business App conversation's “Use as an editable draft” could overwrite words typed while its source recheck was pending. It now uses the real editor epoch, current request/actor/business/role/review and one-use approval handling. Keep consumes the old alert approval; duplicate or stale callbacks deny. A late suggestion cannot replace newer text, including text that changes and returns to the same words. This reuses the original editor and source-check authority, without saving or sending a message.

Builder responsive preview was inspected: its existing renderer already consumes measured container width through `onLayout`. No speculative width override, duplicate builder or cosmetic change was added. Existing builder regressions remain in the full selection.

## Verification and retained unsuccessful evidence

Final automated results: **363 application regressions passed,0 failed/blocked/unexecuted; every child exit0 and runner0**. The independent production foundation selection passed **105 checks, exit0**. Fresh source checks parsed12 changed JS/MJS files; Python compilation, existing native-source syntax, actual SQL/client parity, pinned dependency health and architecture audit all exited0. Full Expo/native build remains unavailable because the root application install and root lockfile are absent; no native/device/rendering claim is made. Raw child outputs are recorded in the companion CHECKS JSON. The full application selection, production105, source syntax, actual SQL/client parity, architecture and runtime hashes are separate evidence classes. No assertion, test isolation or existing10,000ms VM limit was weakened.

Retained SQL candidates: candidate1 had23 passes/9 failures from a missing original v342 fixture dependency; candidate2 had32/1 from test JSON-operator precedence; candidate3 had35/1 because repeat setup attempted an invalid downgrade of an already-confirmed original request; candidate4 passed36; candidate5 had37/1 from parsing indented psql output; candidate6 passed41; candidate7 had44/1 because the foreign fixture attempted a prohibited nonblank initialization; candidate8 and final passed45. Corrected only the fixture/setup/assertion defects, retaining the original writer and initialization denials.

Retained client candidates: first account UI test looked for a raw TextInput rather than the original Field boundary; second used the wrong dirty-registry fixture contract. Corrected the fixtures and added the actual root integration check. First follow-up test incorrectly expected a status write into a departed workspace; the root deliberately leaves old-scope state untouched, and the status panel now rejects that scope. First conversation test did not await the original detached preparation promise; the real callback now returns it and success explicitly. All candidate child exits1 are retained; corrected candidates exit0.

An initial syntax invocation without required source arguments exited1 and ran no checks; corrected frozen-source invocation parses12 files and exits0. A preliminary broad-filter regression candidate was deliberately interrupted before the final full freeze selection:118 passed,0 failed/blocked,245 unexecuted, runner2. Its unexecuted checks are not credited. Auxiliary source lookups of guessed paths returned nonzero; these were not application or SQL test failures. GitHub tree creation succeeded; a response-parsing adapter initially expected the wrong response shape, then verified the exact identical tree before commit preparation. No branch write occurred from that error.

## Architecture and integration

Eight existing production modules extended, four original-parent regression scripts added, one SQL reader/rollback proposal and one extension of the existing PostgreSQL runner. No new production module, dependency, assistant, root state owner, customer database, booking/quote engine, generic restoration framework or ledger. AppController grows only18,253→18,261 lines for integration and exact draft targeting; the existing oversized controller remains a risk. miniApps5,375→5,396; customers2,081→2,089.

Static audit:1,496 source/test files,159,151 physical lines,2,972 relative edges, zero detected static cycles. This excludes documentation and does not establish dynamic/runtime coupling quality. Large inherited AppController/miniApps and stacked schema/client/service dependencies remain the main hotspots. Before this additive mission, PR26 already had844 changed paths against its base; size is review exposure, not progress or readiness evidence.

All draft PRs21→23→24→25→26 were independently open, draft and unmerged. Preserve original bases and integrate oldest first only with separate authority: catalogue/business/membership migrations → original app request/link/notification/atomic Work prerequisites → trusted writers and privacy readers → compatible client/service slice → effective fence/rollback acceptance → release review. No merge/rebase/force-push/history replacement/closure/workflow dispatch.

## Minimum separately approvable staging slice

| Dependency | Local/source status | Hosted gate / scope |
|---|---|---|
| Original provisioning and creator membership | Exact private originals executed in disposable fixture | Verify original staging schema/order; no automatic missing-row repair |
| Account customer/Work reader | New45-stage candidate and actual SQL/client parity | Review actor policy, ownership, search path, effective inherited/default/table/column grants and exposed RPCs |
| Raw-read/full-write fences | Retained baseline and new denials; fuses intact | Genuine owner/admin/member/co-owner/revoked/foreign/anonymous JWT/PostgREST tests |
| Secure startup and request inspection | Original root/session/screen source-tested; hosted flag false | Explicitly approved isolated client; no broad restoration |
| Deliberate diary navigation | Fresh source+account checks and dirty/typing protection tested | Browser/device account switching and two-device races not yet tested |
| Finite enquiry/reply operations | Retained original regression/SQL baselines | Exercise only reviewed supported slice; uncertain writes never replay |
| Views/helpers/Edge/worker/import/restore | Existing inventories retained; deployed absence not proved | Audit all exposed privileged paths before fence activation |
| Production-watch/founder service projections | Existing minimal proposals retained | Keep services/notifications disabled for limited inspection rehearsal |
| Other legitimate snapshot domains | Broad recovery/writes unsupported under fences | Explicit local/read-only denial; blocks broad production cutover, not a disabled-scope rehearsal |
| Rollback | New reader revoked, original data and both fences retained in actual local SQL | Real PostgREST denial and compatible-client rollback still required |

A first limited rehearsal can use fictional original request/link/Work + canonical customer/action rows and genuine separately authorized staging JWT identities, testing startup → exact inspection → deliberately reviewed diary navigation. It must not execute bookings, contact anyone or enable unsupported domains/services. Source projections cannot substitute for those hosted checks. No actual hosted rehearsal was performed.

## Remaining gaps and next mission

Returning owners still cannot restore arbitrary customers, Work history, quotes, newsletters, preferences or builder data through a broad account projection. Canonical readback cannot manufacture missing saved associations. Quote follow-up verification is exact **device** evidence, not account persistence. Creator target integrity does not solve protected cloud draft storage. Other-owner collaboration, linked rescheduling and broad service access remain deliberately restricted. Genuine process-death, physical-device, provider and two-device/JWT acceptance remain unverified.

Next highest-value work: complete a deliberately scoped customer-context view using this verified recognition contract and its original source links, then extend one original device-backed private draft continuation only where exact current source/ownership/readback permits. Separately request approval for the minimal JWT/PostgREST staging slice above when useful; do not reopen raw access or require every future product feature to test that bounded slice.

Phase52 counterexample remains unchanged: SHA-256 `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`. Its older-serializer data-loss scenario is not claimed fixed in production. Existing database fuses, privacy fences, disabled hosted flags, approvals and exact receipt/uncertainty contracts remain.

Additional external spending **£0**. No hosted Supabase read/write, migration, deployment, customer/provider communication, campaign, publishing, booking/payment/tax action, paid build, screenshot work or workflow dispatch. Private masters, original schema handoffs and exact provisioning bodies remain outside public Git.
