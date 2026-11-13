# Job/booking edit continuity and builder recovery — 23 October 2026

## Verified authority and checkpoints

Started clean on the existing Mission15 branch. GitHub `4fe4bade229de418a656eabe202fed191d51d589`, local `bd14a847a05f9421717419e8d0f93295a1e97171`; identical tree `74f67eb1169eeb80d1f1fd6c5f1892844425d7c7`. Independently verified all five PRs open/draft in dependency sequence21→23→24→25→26. No dependency modification, merge or history replacement.

Actual V22.49 Word reopened, SHA-256 `6107043b5470741cbc0bdb67ee52cf99917d1f9886f39a14d22fa290f2dfef11`:2,132 body/table paragraphs,19 tables, cover/footer22.49. Complete ordered extraction matches the earlier complete private review. Original/extraction remain outside public Git. Current AGENTS, architecture, development policy, master-access/brief and latest351-pass report/CHECKS reviewed; previous results remain historical.

Frozen functional local `8328e7e2dd4ac4c03430e42912268d6f8b39ee48`, GitHub `333ca7895da86ab69d24e3a0525cf91b329236aa`, identical tree `e03c3a4a3f76c17b03e38805ac0d1754bbd6187e`. Local/API commit identities differ; tree equality is verified, not SHA equality. Normal additive expected-head/force=false publication preserves both histories. Companion CHECKS records complete child outcomes and hashes.

## Actual connected improvements

**Work → saved booking → editing → customer context:** the original date/time/value/completion-note setters now report unfinished work to the existing owner-edit navigation registry. Home/Back/customer/history/photos/status transitions retain the original navigation/domain owners. Keep retains exact wording; deliberate Discard restores original recorded fields. Retained callbacks cannot discard newer typing or proceed after customer, business, actor, role, view, revision, slot or diary-source changes. A changed booking displays an explanation and denies further save; amount/note inputs expose read-only state. Clash and recorded financial/status information remains visible.

**Booking save:** the original `completeReplyAction` remains the local record owner. A one-use pending review prevents repeated invocation of a retained save callback and waits for exact current record details before leaving. New typing during that readback stays dirty and keeps the editor open. Only the date/time/value fields included in that operation can be cleared as accepted. An unfinished completion note is not falsely treated as saved by a date/time save. The visible explanation tells the owner about that distinction.

**Job completion:** original `markBookingCompleted` still owns amount conversion, note trimming, customer history/lifecycle and prepared follow-on records. None of these rules changed. The original photo prompt now waits for matching local record readback and absence of newer/independent edits instead of immediately navigating across dirty wording. Changed date/time fields remain dirty when completion only records the original booking date and current value/note. Exact editor whitespace remains intact; the original record's trimming is not misrepresented as byte-identical persistence.

**Quotes:** original quote specialist now also binds retained actions to exact view, role and observed account revision. This denies a stale action after navigation, role change or competing account revision. Existing source, enquiry, catalogue, device-copy and financial review contracts remain. No new issue/send/payment authority.

**App Builder → gallery descriptions:** invalid, missing, fractional, out-of-range or unapproved photo loads are checked before opening a destructive decision. The original validated continuation owns replacement; a failed load cannot clear unsaved words first. In-place gallery changes invalidate retained decisions even if a source object reference/revision was reused. Existing search, stable original positions, source-change notice, original parent dirty registration and finite photo proposal/approval remain. No media approval, upload, customer-theme change or independent gallery store.

## Test evidence and retained failures

Fresh complete frozen selection: **352 passed,0 failed,0 blocked,0 unexecuted; runner exit0, all352 child exits0**. Command: `python3 scripts/testing/regressions.py --fail-fast --output .test-artifacts/job-booking-continuity-full.json`. Run was clean at start and bound to the frozen functional local commit. Existing scripts were retained; one new original-parent test was added and gallery negative cases extended.

New test uses the actual Work component, original owner-edit registry and extracted original `completeReplyAction`/`markBookingCompleted` parent functions. It covers exact multiline notes, Keep/Discard and stale tickets, customer navigation, save repetition, new typing during readback, current record conflict, role/actor/business/view changes, competing diary source, completion history/photo sequencing and unrelated quote/unknown-data preservation. Quote checks use the existing original parent fixture. Gallery tests use the actual original editor with invalid and in-place changed sources.

Separate fresh checks:105 production foundations;4 syntax parses;4 pinned Babel module/JSX transformations; original appearance/Automatic/contrast regression; toolchain health, architecture and clean diff checks. Existing runtime isolation, inert IO, process-local compilation and10,000ms module limit remain. No skipped/relaxed assertions.

Retained unsuccessful candidates: the original quote-navigation assertion failed when adding the booking hook displaced the fixture's last-two-effects execution. Both hooks now run unconditionally with quote effect ordering retained; the unchanged assertion passed focused and full runs. An extra Babel probe referenced a nonexistent helper and exited1 before app evaluation; corrected to the established tooling module and four transforms passed. Exact commands/causes/corrections remain in CHECKS, alongside earlier historical failures.

## Responsibility boundaries and security

One focused `useBookingActionReview` hook contains volatile booking edit/typing/own-record metadata and reuses `useOwnerEditNavigation`; it owns no persisted fields, booking engine, network API, account revision or new approval authority. Original AppController state and Work/domain functions remain authoritative. Quote preparation stays separate; no generic workflow framework or second store. Four production modules changed, one being the bounded new booking specialist.

Architecture scan:1,484 source/test files,158,314 physical lines,2,940 static relative edges,zero static cycles. AppController18,185 lines and miniApps5,375 unchanged; Work4,277. Large inherited modules remain coupling/maintenance risks. This static scan cannot prove dynamic/native/deployed dependency safety.

Exact source comparison confirms AppController/core/domain/SQL/Supabase/package/production entrypoints and screenshot implementation/request/workflows unchanged. Hosted switches remain disabled and abort fuses intact. Phase52 retention-loss counterexample unchanged, SHA-256 `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`, freshly included in the full selection. No server permission, member/admin collaboration policy, receipt or finite account-operation change. Existing privacy/tenant/approval tests remain passing.

## Limits, next work and operations

The booking readback is an original local React-record observation, not a device-write receipt, cloud confirmation or customer agreement. This is volatile edit protection, not process-death durability. Existing source-backed booking status operations keep their original server/review boundaries; this sweep does not expand or certify their asynchronous provider paths. No booking is executed during tests. Unsupported account domains and hosted JWT/PostgREST/native/device/release acceptance remain separately gated.

Semantic Midnight/Daylight styles and Automatic are reused. No new colour system, animation, overlay, theme remount or owner-authored website/app redesign. No rendered/native/whole-screen accessibility acceptance claimed. Root Expo/React Native dependencies remain absent; actual source transforms and inert parent execution are the available evidence. Screenshot pause respected without infrastructure work or owner manual testing.

Further broad cosmetic refinement offers less value than completing connected functionality. Recommended next substantial sweep: use the original booking and customer specialists to make asynchronous diary/status review and cancellation visibly pending/conflicted/uncertain, with typing and account-switch parent tests; then add narrowly scoped device draft recovery only where existing persistence can prove exact identity and acknowledgement. Preserve financial approvals and hosted gates. Limit builder work to reproducible edit-loss or navigation defects rather than more decorative variants.

Additional external spending **£0**. No hosted reads/writes, migrations, deployments, external customer/provider communications, publishing, payments/bookings/HMRC execution, paid build, workflow dispatch, screenshot/simulator attempt, merge/rebase/force-push or PR closure. Draft stack remains open and unmerged.
