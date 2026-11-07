# Persistent Growth opportunities and returning-source review — 25 October 2026

## Genuine authority and source

The genuine private V22.53 Word original was reopened and checksum verified: `fa9456077fd843f1f04ea450d9e2ec425077695b6b106b91bf7cee150b727f62`, 2,254 paragraphs and 19 tables. Relevant Growth, authorised Business Brain learning, Creator, customer/privacy, App Builder and Work requirements were reviewed; Sections65–66 are unchanged. Original and complete extracts remain outside Git. No public summary substituted for the private original.

Starting GitHub evidence commit: `1c4ed8c9a53ac8362b5460e546e77ab55ef2cf44`; starting local commit `f9dbe881759a48a1e40ea96d593bb80c18579334`. Independently verified matching tree: `cc5fff521b1f760fa7d56aef144c9ac91acf923b`. Branch: `codex/builder-mission15-design-advancement`. Worktree was clean. Previous App Enquiry/Owner Opportunities report and complete CHECKS were reviewed. All five PRs21/23/24/25/26 were independently checked open/draft/unmerged with unchanged dependency bases. No reset/rebase/merge/force-push/history replacement.

Recoverable local checkpoints:

- `d1b9d61bf2d43b0403516f69f136d8c2b91220fd`: finite account opportunities, immutable versions, UI, tests and SQL proposal.
- `9ba07785f97e738eb141f547cc0f68f9a9eb20a8`: original coordinated App service/enquiry detail editing.
- `2f3b9569bd09ddbc7aad60f337b8c1ff666c5b07`: awaited account-switch negative assertion.
- `b4e36127dd1d1dc4db0e9265a05858f73818a9c0`: hostile pre-existing schema/table/function ownership upgrade guards.
- `ef5a029dcac3bd663f133346db277bcd731a85d3`: retained Creator approvals fail after account eligibility expires; failed account observations invalidate renewed preparation while keeping wording/receipts.

- Frozen functional `c924b58a647d452f43c6e7fb334031d4fe614368`, tree `cca069c0004937359ea1e7b41fc8d7e086715ee7`: dirty intake blocks old feedback callbacks; explicit Discard remounts only the intake through its generation key.

Matching GitHub functional commit: `dabb3b8f1a2e5b2fa7fd8f4d2bf7cb09c7a9794f`, identical frozen tree `cca069c0004937359ea1e7b41fc8d7e086715ee7`. Local/GitHub parent chains differ historically; source-tree equality is verified without rewriting either chain. Evidence-only documentation may follow.

## Finite opportunity authority

New abort-fused review package: `docs/sql-proposals/growth/opportunities.sql`. It is **not a deployed migration**. It adds only an owner-private opportunity head and immutable purpose-specific versions. This is not a CRM, customer registry, generic event ledger, request service or authoritative Work store. Stable UUIDs are server minted; each opportunity has its own revision. Explicit operations: create, edit, retire, reopen, reinspect and source-specific feedback. No arbitrary JSON patch/replacement: the report accepts exactly title, description, source account, selected service ID and private-processing permission, with finite types/lengths and no extension fields.

Every read/write requires a trusted server actor, live original owner membership **and the original business creator**, with reviewed locks. A co-owner, admin, member, foreign actor, anonymous actor or revoked owner cannot use another owner's opportunity authority. This deliberately leaves creator-less legacy businesses and account-transfer/recovery unsupported; it does not invent provenance or backfill creators. Actor/business/IDs are assigned and checked by SQL, never trusted from client report fields.

RLS is enabled, all raw table privileges are revoked from PUBLIC/anon/authenticated/service_role, and only four finite RPCs receive authenticated EXECUTE. Fixed privileged search paths and qualified objects are used. Private helpers have no client execution/schema rights. Effective privileges, not just direct grants, are tested. Production fuses remain unconditional. Hostile pre-created schema/table owners and untrusted function owners cannot be adopted during repeated installation. Trusted version markers and ownership checks precede upgrade; unknown legacy objects require review rather than implicit adoption.

Writes append a new immutable version and advance only that opportunity's head atomically. Expected revision/source hash and unique owner/business operation ID prevent stale decisions, double callbacks and replay. Independent history reads retain exact old wording and source accounts. An edit clears old relevance feedback and source-review applicability. Retirement retains history; deliberate reopening requires another source review. Retirement is not erasure. Immutable technical history is not approval to override lawful deletion/retention; those policies and any privileged erasure contract remain separately gated.

## What the source means

This first slice stores **owner-reported** possibilities only. The source account is the owner's bounded statement about where the information came from. It is not an independently authenticated external record, a verified prospect, contact consent or proof of demand. The selected service ID is retained as the owner's selection, not certified server-side business capability. Current approved services still come through original Brand DNA/Creator review; missing, ambiguous or changed service facts cannot be turned into current approved wording by an old saved report.

The server's source hash identifies exact report fields and independent versions. It does not certify their truth. Server `recordedAt` records an actual local database operation, not an invented observation/conversation time. `reinspect` records the owner's explicit current recheck of that exact account under live owner authority and CAS. It does not fetch or verify an external source. Returning sessions do not inherit preparation authority from a persisted reviewed hash: the UI requires a new deliberate review and current approved-profile comparison.

Historical, retired, restricted, unavailable and unresolved observations remain distinct. Historical reads cannot authorise editing. Changed report facts, changed approved profile, uncertain outcomes and failed account observations invalidate preparation eligibility. Owner wording is preserved for correction. No customer is manufactured from saved metadata; no enquiry, quote, response or paid work is inferred.

## Original owner journey

`GrowthAccountOpportunities` is inside the original GrowthCommandCentre. It reuses `OwnerGrowthOpportunity` for intake/correction and the existing owner-supplied Creator handoff, preserving the separate Use/Keep decision, wording, media and original private-draft owner. The owner can explicitly save a reviewed report, page through summaries, independently open one exact record, inspect prior immutable versions, recheck the source account, correct it, retire/reopen it and save/clear feedback. Pages are bounded20/default, server1–50 with UUID keyset cursor; these are pagination controls, not lifetime limits.

Each sensitive action has a one-use explicit review. Changes/typing, account/view changes, superseded callbacks and pending reads cannot silently restore an old selection. New typing during a pending result prevents replacing the intake. Dirty selection changes require Keep/Discard. A retained Creator confirmation also rechecks current permission to prepare; disabling eligibility closes an already-open confirmation without discarding wording.

Own-write success requires an exact target/revision/action receipt; the interface then independently reads the account record. A later failed read does not erase the acknowledged receipt. Unknown outcomes consume the approval and block further writes. A separate exact-operation observation can identify a committed operation without fabricating an own-write receipt. Not found may mean still pending and does not permit replay. Transport errors are conservatively unresolved, including server conflicts when a definitive rejection is not classified. An absent operation observation does not clear that uncertainty; a later fresh account session may be needed for a new reviewed action. Clearer confirmed-rejection recovery remains unfinished. The recovery pointer is session-scoped; this is not a durable device attempt-outbox or complete post-crash account recovery. A new session independently inspects saved IDs and does not reconstruct earlier receipts.

The original Creator preparation is still a **private owner note**, not a message to send. It preserves the source account and uncertainty in owner-supplied content evidence; no new sending/publishing path exists. A typed durable opportunity-ID → Creator-draft-ID association is not added in this slice. Do not derive attribution by matching note text. Original Creator save/readback remains separate from opportunity saving.

`GROWTH_OPPORTUNITY_ACCOUNT_ENABLED=false` is hard-disabled. AppController adds only the original finite-auth/request binding and its import; no new root state or orchestration owner. Production shows the existing session preparation and truthful unreleased-account explanation. The full saved account journey is implemented source and genuinely executed in isolated PostgreSQL fixtures, **not hosted account availability**.

## Preferences and connected acquisition

The new owner-private account feedback supports Useful, Not relevant, Reconsider later and Clear, with an explicit bounded reason, exact opportunity/source revision, CAS, genuine target receipt and independent readback. It is editable/reversible through new versions; source corrections clear applicability. This is a limited relevance-feedback foundation, not a global learning model, prediction of winning work or marketing permission. The UI shows exact saved feedback. No claim of automatic model training or new ranking engine.

Global preferences for work types, service promotion, geography or communication channels are not implemented or inferred from this feedback. They require a distinct finite purpose/source review. Existing private draft feedback and Business Brain remain intact; unrelated app-design/Growth-project writers and dangerous whole-snapshot writes were not reused.

Original exact request → request-link → recorded CRM Enquiry history remains unchanged. No new persisted authority proves opportunity → outreach → enquiry → quote → accepted work → payment. Same customer/name/date/text/price is insufficient. All such outcomes remain Not established. No contact scraping, automatic identity matching, provider request, campaign or cross-tenant learning is introduced.

## App Builder continuation

The connected service/enquiry editor now edits category, informational price wording and informational duration with the service heading/description and supported enquiry button, using the **same original finite services/service_presentation Studio batch**. No second configuration engine or module capability. Blank optional labels deliberately clear only that service's wording. Other rows, ordering, branding, modules and compatible configuration remain unchanged. Original source binding, owner review, CAS, receipts, uncertainty and exact Undo remain decisive.

Informational labels are not quotation totals, VAT treatment, checkout prices, availability or bookings. The original app surface and inert enquiry-field preview remain unchanged. No publication, provider handoff or request submission occurs. Focused original component tests verify exact whitespace, independent rows, coordinated proposal, original batch recovery and Undo.

## Verification and operational boundaries

See companion CHECKS for exact fresh final child results, hashes, failures and execution source. PostgreSQL17 startup explicitly disabled TCP and used the approved private Unix socket; preflight verified both data directory and empty listen_addresses. A normal sandbox start could not bind the socket; the same approved local command was run with the required execution permission. No TCP or hosted fallback was used.

Fresh checks include original262 database stages, new Growth stages, actual original-component/client-to-PostgreSQL calls, full applicable application regressions, foundation, syntax/transformation, pinned dependencies and static import-cycle audit. Mock local auth.uid fixtures are not genuine JWT/PostgREST acceptance. No Expo/native/browser rendering or device screenshots were performed; offline tooling reports no installed application runtime. Source/component appearance uses existing semantic controls and themes; rendered/native accessibility remains unverified.

No hosted database access, migrations, deployments, rollout activation, customer disclosure, binding acceptance, real messages, booking/diary, invoice/payment/tax, publication, scraping, paid API or provider operations. All quotation/consumer/booking controls, original raw-read/write fences and Phase52 loss evidence remain unchanged. Local SQL is a purpose-specific reviewed technical candidate; release, legal/privacy retention, real JWT/account recovery and device acceptance remain separate.

Next high-value stage: a finite typed historical opportunity-reference on saved Creator preparations, deliberate returning-source reinspection and explicit activity receipts through the original communication authority. Then narrowly scoped work/service/area preferences can be developed without mistaking preferences for current eligibility or consent. Do not manufacture a complete attribution funnel where original persisted links are missing.

## Fresh final results

On frozen functional commit `c924b58a647d452f43c6e7fb334031d4fe614368`:

- Complete applicable application selection: **396 passed, zero failed/blocked/unexecuted**, exit0. Individual child exits and output hashes are retained.
- Production foundation: **105 passed**, exit0. Static relative-import cycles: **zero**.
- Seven changed application source files pass the original syntax/transformation check. Pinned offline tools are healthy; no full Expo/native/Deno acceptance is claimed.
- Actual original isolated PostgreSQL baseline: **262 passed**. Actual new Growth PostgreSQL: **36 passed**, including real concurrent CAS, wrong-role/foreign/revoked denial, hostile-object adoption denial, duplicate/stale denial, source correction, independent versions, exact-operation recovery, repeated installation and retaining read-only rollback.
- Actual original Growth panel/intake and finite account client to PostgreSQL: **22 successful RPC calls**, bridge exit0. SQL/bridge tests use fictional identities and mock local auth.uid, not genuine JWT/PostgREST.
- Earlier canonical PostgreSQL383 remains historical, not fresh credit for this mission.
- Phase52 source remains byte-identical: `1480655ab323ce18b6fcfc99e635f4abc77692e18c3d419b7debf201598b95c7`.

Retained failures/corrections: strict original-creator denial on an incomplete fictional fixture (fixture corrected, authority unchanged); initial UI syntax candidate; genuine stale Creator-confirmation counterexample; genuine dirty-intake/old-feedback data-loss counterexample. Upgrade review also added trusted ownership/version guards before any existing object is adopted. Earlier completed/interrupted broad candidates are retained separately and are not counted as the final run. No negative assertion, VM limit or privacy/receipt guard was weakened.

See [complete checks and limitations](PERSISTENT_GROWTH_SOURCE_REVIEW_2026_10_25_CHECKS.json). The final functional tree excludes only later evidence documentation. The disposable PostgreSQL server was stopped after verification. All production/consumer switches remain closed; no hosted migration, deployment, customer contact or financial operation occurred.
