# Source-bound bookings and customer continuity

24 October 2026. Implemented and verified in source with synthetic inert IO; not deployed or hosted-accepted.

## Authority and verified starting state

GitHub independently started at `f77a96e9dac3e2a3295eb393f2dd7a86e5b040cd`. Clean local branch `codex/builder-mission15-design-advancement` started at `dd1726d0757ca32a1508fc94d914c6a34fb24bbc`. Both had exact tree `4608580f0ed74a784d57f2750d774d351db0ea5c`; distinct local/API histories are preserved. All five PRs were open, draft and unmerged with original bases: #21 → #23 → #24 → #25 → #26. Current instructions, architecture, permanent engineering policy, previous Useful Customer Continuity report and complete354-child/exit0 evidence were reviewed.

The genuine private V22.49 Word remains accessible at `/workspace/busy-does-it-private-masters/Phase68_V22_49_original.docx`: SHA-256 `6107043b5470741cbc0bdb67ee52cf99917d1f9886f39a14d22fa290f2dfef11`, 2,132 body/table paragraphs and19 tables. The complete original was opened again; prior full private review/extraction remains available. The old transient attachment path had expired and was not treated as current authority. No original or private extracted contents enter Git. Existing six areas, appearance/voice/orb and Business Brain requirements are retained without unrelated changes.

## Original authoritative source relationships

These are tracked provisioning/writer contracts, **not newly inspected hosted deployment facts**:

| Source | Established relationship and limits |
| --- | --- |
| `20261007101513_v3_40_mini_app_customer_journey_bridge.sql` | Unique request link stores exact business/request/customer/action references. Forced RLS; public/anon/authenticated revoked; privileged service access. It explicitly links to snapshot customer/action identities, not a new customer database. |
| `20261012183000_v3_180_atomic_business_app_handoff.sql` | Authenticated Edge actor plus live owner/admin membership in original SQL writer; request-row serialization; immutable established customer/action association; status/link/event/unread transaction. No reopening of a closed request. |
| `20261012193000_v3_181_durable_work_booking_ledger.sql` | Unique request Work row stores business/app/request/customer/action, ledger UUID, calendar date/time/timezone, source, state and update time. Original transaction binds this to the request/link and rejects conflicting slot replays. Confirmation creates the row; closure retains it as cancelled. This is BUSY Work, not Google/Apple delivery. |
| Original AppController handoff | Uses stable `miniapp-booking-${requestId}` action identity, exact customer reference and `sourceMiniAppRequestId`. No name or contact matching was added. |
| Original Edge caller/classifier | Authenticates through the existing route/membership resolver and scopes app/request/link/ledger reads to the business. Existing status classifier remains authoritative for supported state tuples. |

The persisted references do **not** independently prove that every corresponding customer still exists in the current business snapshot. This sweep does not read raw snapshots to fill that gap. Continuation requires the existing authorised local customer and original request/action reference to match exactly. Absent or unsupported associations deny; no record is manufactured or recovered from an ID alone.

## Production implementation

The existing `owner_booking_revision` request supports an explicit `includeAssociation:true` branch. Only the current owner may use that branch; ordinary members and admins do not gain this access. The old status-only owner/admin contract remains separate and compatible.

The existing server classifier file now has a finite association classifier. It first validates original state/ledger agreement, then validates exact persisted customer/action identifiers, update times and ledger business/app/request/customer/action consistency. Ledger UUID, supported source, real date, minute-level time and bounded timezone are checked. Drafts may have no ledger; they are not treated as confirmed diary entries. Missing, inconsistent, malformed or unsupported records fail closed. Query ambiguity remains a denial through original `maybeSingle` semantics. Only fixed IDs, revisions, states and diary fields are returned; no names, contacts, messages, arbitrary link metadata, private replies or unknown extensions.

The Edge function re-reads the request revision after its link/ledger inspection and rejects concurrent original-transaction changes. It rechecks owner membership before returning the association. This is a bounded read, **not a transactional mutation authorization or durable point-in-time snapshot**. Privileged out-of-contract writers and revocation after the final permission check remain hosted acceptance concerns; no stronger guarantee is claimed.

The existing client contract validates the fixed projection again against the exact current customer and original stable action identity. Unknown nested fields are excluded. No caller-provided identity is used to establish the server association. An old deployed endpoint that lacks the new contract fails closed rather than falling back to raw reads.

## Connected owner outcome

In the original Work booking detail the owner can now:

1. Inspect the persisted customer/action association and original Work diary slot.
2. See when that slot differs from the local booking; neither record nor editor is changed.
3. Deliberately open the source-linked customer using the existing customer navigation, or open the exact ledger day using the existing diary.
4. Have that continuation perform a fresh source read and require exact unchanged evidence before offering the existing dirty-navigation decision.

Keep retains exact newer wording. Discard uses the existing one-use guard. New typing, source/role/business/customer/view/revision changes or a competing inspection invalidate stale callbacks. Async source read completion cannot replace newly typed notes or navigate with stale evidence. Source changes deny and ask for another inspection. Independent quote amounts/dates, newsletters, builders, preferences and customer data are untouched.

The source observation remains **not an own-operation receipt**. Unknown cancellation stays unknown; matching source state does not acknowledge an interrupted request. No target receipt advances the whole snapshot revision. No mutation, retry, resubmission or account-wide restoration occurs. The existing quote/enquiry preparation and original customer history remain available through their existing owners after navigation; no second quote or follow-up engine was introduced.

## Defects corrected and unsupported changes

Investigation display now invalidates on workspace revision, view and customer-content changes, as well as the existing typing/role/source/operation guards. Previously matching action references could leave older evidence visible after a revision change. Fresh continuation also binds the latest inspection token, preventing older asynchronous reads from authorising navigation.

Linked rescheduling remains deliberately unavailable. V3.180 rejects changed same-state metadata; V3.181 rejects a different ledger date/time/timezone for an existing confirmation. No reviewed atomic reschedule/conflict/receipt contract exists in these originals. Changing the local booking alone would violate source continuity. Current words and proposed fields are preserved; no new SQL or mutation authority was invented.

No newly verified durable device draft recovery, process-death guarantee or cross-device own-receipt reconstruction is claimed. The snapshot/customer existence gap and missing finite reschedule authority remain separate from the now-supported exact reference navigation.

## Frozen verification and retained failures

Frozen local functional commit `002595890fff0b14b3be1843468a31d9af17eb2d`, additive GitHub functional commit `0a73894fe76997817af15cfb9d0d2ce225a9c4e7`, identical tree `1fd150647d21283b4637c21ee83f2764606e9bbc`. The source was clean before the full run. Later documentation commits retain that tested functional source.

Fresh complete selection: **355 passed,0 failed,0 blocked,0 unexecuted; actual runner exit0 and all355 child exits0**. Selection hash `71683646a89da109084a0c88037bbc52a494e9120968d4ea0635055cd29e88a8`. Run05:22:32–05:30:01 UTC. Full per-child outputs, durations, hashes and actual codes are retained in companion CHECKS.

Additional fresh checks:105 production foundations exit0; all six changed production files syntax/transformation exit0, including actual Edge TypeScript; original appearance/Automatic/AA-token-contrast check exit0; architecture audit exit0; pinned dependency/runtime health exit0; whitespace check exit0. Node24.19.0/npm11.9.0 and51 offline packages unchanged. Full Expo/RN install and root lockfile remain unavailable: no native compile, screenshots or device/visual acceptance claimed. SQL is unchanged; no fresh PostgreSQL execution or hosted RLS/JWT proof is claimed.

The new regression executes the actual Edge read function in the established isolated VM with inert database IO and the original10,000ms limit. It covers select/filter construction, source revision change and read errors; actual server classifier/client projection parity; unknown extension non-disclosure; wrong business/app/customer/action; invalid source/date/time/state; draft/cancelled records; real original parent → Work → hook → dirty guard → source diary/customer navigation; changed revision and typing during read; and member/admin/viewer denial. Existing original quote, account/recovery, privacy, tenant, source and receipt regressions remain in the complete selection.

Two unsuccessful focused candidates were retained: original V3.233 source assertions failed at lines90 and97 (childexit1) after the first refactor obscured original classifier/select construction. The implementation was corrected to retain explicit legacy classifier and narrow legacy select paths. Original assertions were not weakened; all111 original assertions and the new regression pass. A stale private attachment path lookup also failed, then the checksum-matching durable private original was located. None is represented as successful first-attempt verification.

## Architecture, integration and next mission

Six existing production files changed; one original-parent test added. No production module, state owner, package, booking engine, store, generic workflow system or ledger was added. Existing server classifier/caller, client contract, original booking hook, Work screen, navigation and AppController preparation own their original responsibilities. AppController grows18,255→18,256 lines; Work4,291→4,303; Edge4,606→4,619. Static audit:1,487 files,158,718 physical lines,2,951 relative edges, zero detected static cycles. Large inherited files and privileged service-route coupling remain risks; static metrics exclude dynamic/aliased relationships.

Before hosted acceptance, separately review the original app/link/ledger migrations and effective grants/RLS, deploy the compatible Edge source only with approval, and test real owner/admin/member/revoked/foreign JWTs, duplicate/missing associations, mixed old/new clients, concurrent original transactions, effective service privileges and diary/customer navigation on real devices. Source checks do not establish deployment provenance, atomic read isolation or absence of unknown privileged writers. No raw snapshot access or broader private-record visibility is required by this change.

Next substantial functional mission: connect narrowly authorised current customer/Work readback to these persisted references so eligible source-bound navigation can continue after account reopening, while retaining existing recovery specialists. Separately design a real finite reschedule transaction only if its diary conflict, membership/revision and exact receipt contracts can be established; do not simulate it locally. That connected recovery offers more customer value than another visual sweep.

The PR chain remains open/draft/unmerged; oldest-first integration requires its separate approval. No hosted Supabase operation, migration, deployment, customer/provider message, booking, financial/tax execution, publishing, workflow dispatch or screenshot work occurred. SQL fences, production abort fuses, hosted switches, original Phase52 loss counterexample and dependencies are unchanged. Additional external spending **£0**.
