# Business App quotation review and non-binding decisions —25 October2026

## Authority and checkpoints

Genuine private V22.53 original reopened: SHA-256 `fa9456077fd843f1f04ea450d9e2ec425077695b6b106b91bf7cee150b727f62`,2,254 paragraphs/19 tables. Sections65/66 and unchanged earlier canonical/security requirements remain authoritative. No product-policy decision was reopened. Word/extracts remain private outside Git.

Starting GitHub `cce312df54e4d8bca097b5061b731efcfbe64068`, local mirror `7b0ebb23f4af6fdd3ba32740b769c06e93601884`, identical tree `db0970986013c74b73800cfd3a55f178ebde3205`. Functional local `921ece3251c114893b22e4378b246a51d47d0a34`, matching GitHub `8df6aee12f9ed324250c6234d19fed2daad0ac30`, frozen tree `f576ffe2ab2409671b9518d34d5e8e0398f6e940`. Documentation/evidence follows that frozen source. Existing mirrors have different parents; verified trees match without history replacement.

PRs21→23→24→25→26 independently verified open/draft/unmerged with original bases/dependency heads intact. No later legitimate work was overwritten.

## Original authentication boundary: what is actually proved

AppController's original ownerAccessToken stores tokens in SecureStore and may refresh through the existing Supabase refresh-token flow. miniAppsRequest forwards the bearer to the original busy-mini-apps service. Its requireUser calls supabase.auth.getUser(token); customerRequestDetail scopes the original request to consumer_user_id=user.id. submitRequest accepts only original enquiry/booking_request types, validates the original app/version and idempotency, and sanitises its fixed payload. V3.184 messages and V3.180/181 request/link/durable-ledger authority remain unchanged.

These prove account/request identity where the genuine service executes, **not recent reauthentication**. Refresh-token success and auth.uid alone do not establish renewed quotation viewing eligibility. No auth.sessions schema, client last-activity authority, new identity registry or test-auth bypass was invented.

The existing customer request-detail return now contains a finite quotation-readiness description based on its already verified user/request: always unavailable/release_disabled, account identity distinguished from unestablished recent authentication/viewing session/presentation entitlement. It reads no quote, creates no session and grants nothing. Existing request-read behaviour is unchanged; this metadata does not mark a quotation viewed.

## Actual Business App component and response source

Original MiniAppRequestDetail composes a new BusinessAppQuotationEntry. Entry is hard-disabled and returns null before any quote retrieval; there is no live consumer route, quote lookup by UUID, discovery link or fabricated public URL. Changing a client flag alone cannot activate it. BusinessAppQuoteReview is a bounded reusable source component tested separately with the actual local PostgreSQL seam.

The component displays only the exact isApprovedQuoteProjection/formatApprovedQuoteProjection output: business/customer-facing identity, quote label/version, scope, total/itemisation/VAT and applicable reviewed terms, expiry and explicitly unconfirmed timing. Raw Work/CRM/source/private fields never become its payload. Unknown fields reject. Server availability, receipt of a projection, component display and a structured decision remain separate facts; the owner is not told that a real customer viewed or received anything.

Explicit non-binding actions are Request to proceed, Decline and Ask a question. Review shows the exact quote/version/amount and exact question, with one-use Keep/record callbacks. Request to proceed creates no order/payment obligation; Decline does not cancel separately confirmed work; Question does not send a message. Binding Accept is absent from this component and still denied in the server contract.

businessAppQuoteSession is a finite operation adapter, not another quotation/request engine. It binds original account/request/app/presentation scope, obtains the original token before each operation, validates independent server observations and exact target receipts, rejects changed scope/forged observations, preserves acknowledged receipts after later read failure, and fences unknown outcomes without replay. Older/delayed observations cannot restore a different account/quote or replace newer question wording. The original dirty-navigation specialist owns unfinished-wording metadata. Client display expiry is explanatory only; actual eligibility is rechecked server-side. No device/account durability is claimed for an unsaved question.

## Exact request/source integration and owner Work evidence

Separate abort-fused additive `quote-business-app.sql` follows the exact V22.53 package. Its private quote_request_validation and quote_request_decision_validation require exact signed-in consumer, original app/request, immutable presentation/quote and current source. They delegate to the existing quotation session/decision authority, including all original source/recipient/link/version predicates,15-minute idle checks, grant/validity expiry, live owner permissions, revocation locks, response CAS and operation identity. No new table or parallel request writer exists. No original request or message is inserted or modified by a quotation action.

Private workers have no application/service-role EXECUTE; only isolated disposable transport can exercise them. The original public consumer access/response RPCs still deny unconditionally. The workers remain local_validation_only and explicitly requireHostedSessionProof=true. This is real local SQL execution with mock UID/roles, not a production-ready reauthentication or presentation gateway.

Existing creator-private quote_access_decisions now supplies exact quote label/version, original app/request/link, actor account and owner-linked provenance, plus local_validation_current/stale evidence classification. It retains version-specific history after revocation where current owner/privacy authority permits; privacy-restricted or foreign requests still deny. CanonicalQuoteAccessPolicy displays that context and preserves separate reply/followup/work_notes. No new Inbox/notification/Communications engine or delivery claim is introduced. Returning owner inspection uses finite canonical context and needs no manufactured local customer or old own-operation receipt.

Owner-linked CRM/consumer provenance is not certified personhood. A presentation's reviewed request context does not prove an old request originally concerned that quote. Arbitrary request payloads/free text/customer IDs never establish the association. A future genuine gateway must extend original authenticated authority, not reinterpret submitRequest or bypass the durable booking ledger.

## Structured owner itemisation completed

QuoteItemisationEditor is composed inside the existing optional quotation-terms editor. The owner deliberately enters description, quantity, unit price and VAT amount; VAT defaults blank and no rate/treatment is inferred. Exact decimal/BigInt arithmetic calculates a proposed line total; the finite SQL contract checks quantities, price/VAT arithmetic, permitted nested keys and equality to the existing canonical quote total. Busy never silently changes quote amount, planned date or scope. Removing an unsaved item does not delete an account record.

Preparation is disabled while current item rows are invalid or do not match the original quote. Newly typed fields and exact wording survive source reviews. Zero amounts and fractional quantities/rounding are tested; unsupported oversized calculated totals return review-required instead of crashing. This is bounded quotation arithmetic, not a payment/invoice/tax engine.

Brand DNA/source inspection found existing hero/gallery assets but no established exact quotation-logo/rights association for this slice. Arbitrary logo URLs remain unsupported; no media rights, disclosure approval or new media registry was fabricated.

## Fresh frozen-source evidence

391 application regressions,105 foundation checks,262 original PostgreSQL stages,383 canonical/upgrade stages: all final selections passed, no failures/blocked/unexecuted. The SQL selection preserves all363 preceding stages and adds20 original-request/quotation stages. Expected-denial child exits are retained, not counted as unexpected failures.

Final original-component/database bridge:201 successful owner RPC children;10 customer-quotation validation operations(nine successful children and one expected revoked-read exit3);two successful isolated activation/question fixtures;Node exit0. It executes original owner item editing→finite save→customer quotation component→Keep→Request to proceed→exact Question→Decline→owner response inspection→revocation denial. A separate response really commits before its acknowledgement is deliberately lost; independent read observes response revision4 while the client remains unknown and refuses replay. Both engagements, full legacy Work/snapshot, private purposes and original requests/links remain unchanged. Real quote issuance, legal acceptance, booking/diary/invoice/payment effects are absent.

The earlier successful bridge used203 owner calls; its two additional Work-list pages reflect random server UUID order, not missing final assertions. Candidate SQL passed383. A focused cross-VM empty-array prototype comparison failed(exit1) and was corrected to assert the empty result length while retaining arithmetic/wording assertions. The oversized-total counterexample exposed a real rendering exception and is now permanently checked. One SQL tool request was interrupted before a child/artifact began; a default-sandbox Unix socket check failed EPERM(exit2). Neither was credited as SQL execution. An upload preparation guard initially compared Python code points with JavaScript UTF16 units; no remote mutation occurred, and corrected assembly produced the exact expected Git tree. Earlier mission failures remain preserved.

Twelve changed JS/JSX/TS source files parse;three Python runners compile. Pinned51-package tooling passes health checks, no new dependencies or lock drift. Static relative-import cycles0, AppController unchanged at18,287 lines. The Phase52 retention-loss counterexample remains byte-identical at `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`. No VM limits/assertions/security expectations weakened. Component checks are not native rendering/accessibility acceptance or a Deno semantic typecheck.

Actual PG17 ran with explicit listen_addresses='' and0700 private Unix socket, fictional data only; stopped after final verification. Production abort fuses, RLS/raw-table restrictions, fixed privileged paths, effective EXECUTE restrictions, old-client fences and retaining rollback remain intact. The additive upgrade checks installed authority and atomically rolls back injected failure; it does not activate a hosted migration or customer access. Indexed existing per-presentation revisions/bounded pages remain; no history lifetime limit or large-tenant latency claim is introduced.

## Exact separately approvable isolated authentication rehearsal

Preparation only; no hosted test was performed or approved here. Not broad cutover and no new cloud resource is authorised.

1. Use frozen client/tree above and SQL fingerprints in companion CHECKS. Provision original business/creator membership and privacy fences, then exact engagements.sql→recipient-management.sql→quote-grants.sql→quote-access-policy.sql→quote-business-app.sql. Rehearse only with separately authorised fictional isolated storage; do not remove production fuses or deploy disposable transport wrappers to production.
2. Create distinct fictional authenticated owner/consumer accounts and actual provider-issued JWTs. Verify original getUser account identity, exact app/request/link scope, two quote versions for one CRM customer and creator-private boundaries. Never equate CRM IDs with auth UID or use service-role impersonation to claim JWT acceptance.
3. First establish a reviewed proof for fresh authentication/renewal that the existing refresh flow cannot currently supply. Test inactivity at15 minutes, renewed authentication against current source, banned/deleted/revoked accounts, token refresh versus reauthentication, concurrent session changes and failed renewal. No invented auth.sessions contract or client timestamp may fill this gap. Until proved, consumer entry remains denied.
4. Verify real PostgREST schema exposure, RLS, effective direct/inherited/default EXECUTE/table privileges, owner/member/admin/co-owner/foreign/anonymous denials, recipient binding, stale app/request/link/version, validity/DST/expiry, wrong quote and source/privacy changes. Use only the approved fictional projection; private Work/CRM/unknown fields must never cross the boundary.
5. Race revocation against reads and each non-binding response, then verify every subsequent request denies. Exercise exact CAS/idempotency/receipts, lost acknowledgements/no replay, old-client raw-read/full-write denial and data-retaining read-only rollback. Rollback must keep the restrictive current readers; do not resurrect an older access path or delete history as revocation.
6. Exclude all actual customers, sends/provider delivery, binding Accept, booking/diary, invoices/payments/tax, publishing, screenshots and production rollout. Legal/firm-offer/durable-copy controls and native/accessibility/device acceptance are separate later gates.

## Completion and next customer-value stage

Locally implemented: original request-screen composition with closed entry; exact safe customer-review component; finite target-bound local read/response protocol; explicit non-binding reviews; source-labelled owner evidence; structured owner item editing; real component/PG integration. Production-disabled: all consumer entry, access and responses, canonical rollout and binding acceptance. Unsupported: live quote discovery/presentation/activation, genuine recent-authentication proof, hosted JWT/PostgREST acceptance, real customer/provider evidence, logo/media authority, legally binding agreement and every booking/payment transition.

Next highest-value stage: implement the reviewed genuine session-proof/renewal and original Business App quote-discovery/service boundary, then undertake the narrowly scoped fictional JWT/PostgREST rehearsal only after separate approval. Finish the non-binding customer/owner journey before considering firm-offer acceptance or booking integration. Preserve immutable engagement identity and the original request/link/ledger transaction authority throughout.

Spending£0. No hosted Supabase access, migrations/deployments, feature activation, real disclosure/communications, booking/diary/invoice/payment/tax/provider execution, publication, screenshot/simulator workflow or owner manual testing. Draft PR stack preserved.
