# Quote presentation grant candidates — 25 October 2026

## Authority and frozen source

The genuine private V22.52 original was reopened and verified: SHA-256 `863155d0d75c4ee7f627a6d670ce78eed128e2438eecfb7137b58f512443cb66`, 2,224 paragraphs/19 tables. Section65 requires deliberate exact-recipient/version review, fresh trusted Business App verification and separately permissioned customer access. Complete document/extracts remain outside Git. This is not disclosure, expiry/session, legal acceptance, deployment or release approval.

Starting GitHub `5b33ac479bff7ca35a627175fe4473929c4f9fe2`; local mirror `986577d6f7c88eb004422174ac2d26083fca949f`; identical tree `b41a88ae0df36abf0d4f5e7cec77945e545cc223`. Functional local `5136b7395b2d7deedef1fba9d481b8ce6805e96e`, matching GitHub `5919e4686c2e0196e82502dc6982a9ef11b43a30`, frozen tree `876e32a1be1f57d3078babb494ab18f890f10541`. Mirror commits differ because their existing parents differ; trees are verified identical without replacing history.

All five PRs21/23/24/25/26 were independently inspected: open/draft/unmerged, dependency bases unchanged. Source changes are additive on Mission15 only. Documentation/evidence checkpoint follows the frozen functional source.

## Actual connected implementation

1. An owner opens an existing exact quote/reference and effective recipient binding through the original Work/Get Paid components, reviews the existing private presentation preparation, then explicitly requests a fresh grant review. No recipient or grant is automatically selected.
2. A new subordinate owner-private grant candidate pins the immutable reference/revision/terms, whole compatible Work fingerprint, creator/customer/business, effective binding/revision, preparation, original signed-in consumer/request/link/app/version evidence, source/customer hashes and snapshot revision. Its server UUID, generation, revision, recording time and expiry are independent. It is always `candidate_disabled`, never an entitlement.
3. Original one-use review tickets support Keep/cancel, exact receipt validation, finite create, independent readback, explicit grant selection, bounded history and append-only revocation. New generations require a fresh review after revoking the previous candidate; expiry does not silently renew anything. Source/account/role/view/selection epochs invalidate callbacks. Failed readback retains an acknowledged receipt; uncertain writes remain fenced without replay. Reading matching state never reconstructs an acknowledgement.
4. The owner can inspect exactly the candidate whitelist, and review bounded typed-response candidate history. Separate private follow-up, reply and Work notes remain unchanged. No local customers/replyActions are restored or merged.
5. A private, non-application-executable validation seam independently authenticates the exact consumer and verifies live owner membership, canonical creator/source/terms, effective binding, preparation, grant, original request/link/app/version, expiry and revocation. Actual local transactions prove permissioned validation through disposable test-only transport. There is no public activation branch or test-auth bypass in deployable SQL.
6. A private typed response candidate transaction records only explicit `accept`, `decline` or exact `question`, authenticated actor, server UUID/time, grant-bound terms, revision CAS and operation identity. Candidate accept is explicitly **not legal acceptance**, not quote status, and grants no booking/payment authority. No production role can execute this worker. Existing public consumer access/response RPCs are unchanged and always deny.

The actual original-component/database bridge starts with two engagements, opens exact zero-amount/multiline quote terms, reviews/cancels/records/reopens/revokes a candidate, displays a fictional authenticated question candidate, then creates another candidate with an intentionally lost acknowledgement. Independent observation leaves the unknown fence intact. The other engagement, complete legacy Work/snapshot and all private purposes remain intact. This is local source/UI-component and database execution, not rendered native, hosted JWT/PostgREST, device or customer acceptance.

## Original authorities and changed ownership

`CanonicalRecipientManagement` composes the new bounded `CanonicalQuoteGrant`; no AppController change. `canonicalWorkSession` retains the original ticket/WeakMap, live account, exact scope, nonce, CAS, receipt and uncertainty ownership. `quotePresentationContract` supplies an exact whitelist and untrusted proposed grant identity for typed intents; those intents cannot authenticate or execute anything.

`quote-grants.sql` is an abort-fused additive upgrade after the exact installed canonical foundation and recipient-management package. It extracts the original source and recipient validators into private shared workers without impersonating the owner or changing auth.uid. Existing source/binding/recipient outputs and fingerprints are checked for parity. Current original request/link/app/version tables remain authoritative; no request/message/ledger writer is replaced.

The new tables are subordinate `business_work_quote_grant_candidates`, immutable revocations and typed response candidates. They are not another customer registry, quote engine, booking ledger or generic event system. All raw privileges are denied; RLS is enabled, privileged paths are fixed/qualified and private helper EXECUTE is revoked from non-superuser roles. Effective inherited/default raw privileges cause the upgrade to abort. Owner RPCs still require live explicit owner/creator checks; authenticated EXECUTE alone is insufficient. Original raw-snapshot and older-client full-write fences remain.

## Exact request relationship and limits

The candidate binds one owner-reviewed quote to one **existing selected request context** after fresh trusted verification. Owner-linked CRM-to-consumer provenance is not independently verified personhood. It does not prove the original request asked for this particular quote, and does not backfill a canonical UUID into an unrelated request or ledger. Two quotes for one customer remain distinct.

Original submitRequest/V3.39–40, V3.184 messaging and V3.180–181 request/link/booking-ledger transaction owners are unchanged. No consumer message writer, original request extension, quote-to-booking association or canonical lifecycle mutation is authorised here. A future structured response can carry exact grant/terms evidence only after separate access/response policy and real authentication acceptance. Stored messages, presentation, availability, viewing, response, legal acceptance and booking remain distinct.

## Verification and retained failures

Fresh final source: 388 application checks, 105 foundation checks, 262 original PostgreSQL stages, 317 canonical/upgrade stages, 190 successful owner RPC children plus one successful isolated authenticated-consumer question fixture child. Final bridge node exit0; every RPC/fixture child exit0; full snapshot unchanged. Companion CHECKS contain exact runs and original exit codes.

The SQL selection retains all275 previous canonical stages and adds42 grant/response stages, including actual competing grant and response transactions with one CAS winner, wrong same-customer quote/request, private projection exclusions, original helper parity, owner/member/admin/co-owner/foreign/revoked denials, stale app/link/source, privacy restriction, withdrawal, expiry, revocation, late response, raw/helper permissions, injected atomic upgrade failure, inherited privileges and retaining rollback. SQL uses PG17, `listen_addresses=''`, private Unix socket; no TCP or hosted connection.

Retained candidate1 SQL:299 passed/1 failed/16 unexecuted. Fixture had omitted the original preparation-withdraw writer grant after rollback (42501 instead of intended40001); production assertions were retained and fixture setup corrected. Candidate2 passed316; candidate3 passed317 after adding concurrent response coverage. Final317 adds competing grant creation and null-generation writer denial within existing stages. A new component-test attempt failed because the test looked for generation1 after its own lost-ack fixture created generation2; target label was corrected without relaxing assertions. Two interrupted permission/tool calls and an earlier temporary client-edit script ValueError are retained as unsuccessful attempts, not executed passes. Earlier mission failures remain unchanged.

Six changed JS/JSX/MJS files parse; three Python runners compile. Pinned isolated toolchain health:51 packages, no lock drift; no root Expo install. Static relative-import audit:0 cycles, AppController unchanged at18,287 lines. Phase52 retention-loss probe hash remains `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`. No VM/test limit or assertion weakening.

## Performance, upgrade and rollback

Grant histories use indexed bounded UUID pages (1–50); per-preparation generations and per-grant response revisions use unique indexed keys. These are page sizes, not lifetime limits. The original snapshot source validation still scans its supported customer/enquiry arrays; grant review may invoke it repeatedly. This mission preserves that established cost and makes no large-tenant latency claim. No whole snapshot is returned or mutated.

The additive upgrade requires exact installed authority fingerprints and rejects repeat/unknown installations; injected failure rolls back schema and helper changes atomically. Both retaining rollbacks revoke candidate writers without deleting data or restoring older readers. Private response mutation also denies after retaining rollback. Revocation is not lawful erasure. History is creator-private/current-privacy-bound, not unrestricted archival disclosure. Final policy for retention, erasure, legacy attribution, session lifetime and customer-facing field disclosure remains unresolved.

## Separately approved rehearsal readiness

Prepare only; no hosted access is authorised. Order: original provisioning/creator-membership and privacy fences → exact canonical foundation → recipient-management upgrade → quote-grants additive upgrade. Use the hashes in SQL CHECKS. Preserve fuses until separate isolated rehearsal approval; never use test transport wrappers in hosted deployment. Compatible client is the frozen tree above with every canonical/recipient/consumer rollout switch false.

Rehearsal must verify real JWT/PostgREST owner/admin/member/co-owner/foreign/revoked/anonymous boundaries, inherited/default grants, schema/function exposure, exact request identities, two quotes per customer, stale terms/source/app, expiry/revocation, private non-disclosure, lost acknowledgements and retaining rollback. No original send/request/booking/payment authority is enabled. Local mock UID/role tests do not establish those hosted predicates.

Before enabling any customer route: approve exact disclosure whitelist, expiry/session/revocation policy, presentation authority, typed response/legal semantics and privacy/retention treatment; independently review production grants/search paths; prove genuine authenticated recipient isolation and rollback. No private UUID/public URL acts as a bearer permission. There is no working public quote route in this implementation.

## Status and next milestone

Implemented/local-only: private grant review/create/list/read/revoke, exact safe projection, original request-context validation and privately executable typed response candidates, owner UI and real SQL integration. Hosted-disabled: all canonical/recipient/grant features; production consumer APIs remain unconditionally denied. Unsupported: real presentation, delivery/view tracking, actual response execution/legal acceptance, request/ledger canonical handoff, booking/diary/payment transitions, legacy private migration and source rebase.

Highest-value next milestone: separately review the finite access/session/disclosure and response policies, then implement an original authenticated Business App presentation/response integration that can be rehearsed under explicit isolated hosted approval. Preserve Prepared status and exact engagement UUID; any later booking transition must extend the original atomic request/link/ledger authority with its own agreement/conflict/CAS/receipt contract.

Additional external spending £0. No hosted Supabase access/migration/deployment/activation, disclosure, communication, booking, diary, payment/provider/tax/publishing action, screenshot or native workflow. Local PG stopped after verification. No manual owner testing requested.
