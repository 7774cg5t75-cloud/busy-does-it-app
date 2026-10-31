# BUSY DOES IT — Connected Staging Readiness & Premium Interiors

30 October 2026 · Source/local verification, with read-only hosted metadata inspection only.

## Source and authority

- Starting GitHub head: `b14e7f4d34812d3c2576ad78cd47b58d5c7e1281`, tree `95dfd65af0a157d3855b93aecec25e87bd43b52a`.
- Preserved previous implementation: `52a41e561734588567c4c117dd2ea7065781a2df` / `3cb9a940fdf2bcbd1e1c736fe0318b2f877fd622`.
- Frozen functional GitHub commit: `d6d8fef8bf61ae921e3ecbf0958070bd96a80e89`.
- Exact functional tree: `d4c8b00d1fc8e6a06a1174b6b97a790184409c9f`. Tested clean local checkpoint `520112bcd12a7ef1dacea735e60b696c1f6c913c` has this identical tree; the GitHub commit has the current remote parent rather than replacing its history.
- 72 functional files added/modified. Complete inventory and per-check process exits are in `CONNECTED_STAGING_READINESS_2026_10_30_CHECKS.json`. A later evidence-only commit records this report, architecture notes and generated review SQL.
- PR21 →23 →24 →25 →26 independently checked open/draft with existing bases intact. No reset, rebase, forced update, merge or dependent-branch changes.
- Genuine private V22.59 Word original reopened: SHA-256 `a275340a7258f96f830d2c53e46734c4b93c5365f1a172a0950b4c349c71c5cc`, 2,454 paragraphs/19 tables. Relevant premium-interior, one-assistant, connected-workflow, orb/cost and readiness requirements reviewed; original/extraction remain outside Git. The public provenance is not the full master.

## Implemented gateway and connected-functionality corrections

**Mini App now genuinely type-checks.** Replaying the untouched starting tree against the same real pinned dependencies reproduced69 primary diagnostics (exit1); the corrected gateway exits0. The starting69 primary diagnostics comprised33 missing/incompatible union properties,24 input-shape/null inference mismatches, one dynamic-key error, two implicit map parameter errors, six overwritten `ok` properties and three nullable comparison objects. Six related TS2785 notes accompanied the duplicate-property errors; they are not six additional primary failures.

Precise JSDoc boundaries now describe persisted request/message/link/Work rows, nullable count inputs, real SDK client types and helper return types. Literal `ok`/receipt `found` tags allow actual success/failure narrowing. Failed coordinated edits retain their evidence while returning an explicit failure tag. Matching client/server helper copies remain aligned. No blanket `any`, `@ts-ignore`, `@ts-nocheck`, relaxed compiler config, fake SDK or disabled validation was introduced.

The booking-link query now chooses between two literal PostgREST selections outside `.select`, preserving exact projections and tenant filters. Public information rendering uses finite tuple keys and explicit row/block shapes. Screenshot-comparison code uses the validated pair/candidate objects rather than assuming the mode proves they exist. Redundant `ok:true` prefixes were removed where the original helper already owns that result; no successful business outcome is invented.

**A genuine first-App receipt defect was corrected.** The original v3199 atomic-first SQL returns revision2. The reviewed creation client still expected1, rejecting an otherwise valid created draft before configuration. The explicit `expectedNoExistingApp` path now requires2; legacy unreviewed receipt compatibility remains unchanged. The original reviewed plan advances2→3. A real PostgreSQL/original-client regression verifies the returned revision2; the older inert goal-journey fixture now uses the actual SQL contract and still verifies both saves, independent reads, stale/unsupported denials, local typing and Undo.

**Private App SQL validates structure without null fall-through.** Both staged first-create and private-commit wrappers now reject missing/null/non-array modules/navigation, unknown or duplicate module keys, non-boolean enabled flags, missing required business profile and navigation that differs from the enabled set. Existing catalogue availability, current membership/profile locks, CAS, service-only invocation and original finite patch restrictions remain. These are approval-fused proposals, not hosted installations.

Selected staging action allowlists remain exactly bounded. Owner status still checks current authority before and after its multi-read packet. Existing private App writes keep transactional owner/profile/App locking; no read-membership-then-write fallback or generic privileged RPC was added. Consumer submissions, publication, messages, booking/payment and paid planning remain outside the staging allowlist. Service credentials remain server-side.

## Staging observations and concrete activation preparation

Read-only inspection identified **Busy Does It Staging / pnjdlogwegnqbsfpcofw**, ACTIVE_HEALTHY, PostgreSQL17.11. Public schema still contains only the two-row RLS canary; migration ledger contains `20261010224121 staging_canary_owner_read_v3130` and `20261010224205 restrict_staging_rls_event_helper_v3130`. Policies, function signatures/effective execute, indexes, triggers and default privileges were inspected without reading canary values, Auth-user rows or customer/business data. See the committed metadata JSON.

The canary allows authenticated owner-scoped SELECT; anonymous SELECT is denied. `rls_auto_enable` has restricted execution. Existing public-schema defaults are creator-dependent, including broad defaults for `supabase_admin` and remaining table privileges for `postgres`; installation must explicitly revoke/grant every selected object. Nothing hosted was changed to hide this finding. Production DB/schema/data was not queried.

`canonicalPrivateActivation` is an implemented deterministic **review-SQL composer**, not a deployment runner. It binds the exact original canonical Work and private-permission files by SHA-256, validates their expected transaction/fuse boundaries, then puts creation, final ACL closure and effective-grant assertions inside **one transaction**, with lock/statement timeouts. It retains its own unconditional approval fuse and requires an already-reviewed snapshot foundation. Local PostgreSQL rehearses that exact generated transaction. Later lifecycle/disclosure functions and service-role execution are closed before COMMIT; there is no separately committed broad grant window.

The updated staging manifest includes gateway/SDK/candidate/inventory hashes, the atomic Work SQL hash, prepared acceptance runner and retaining rollback references. `activationReady=false`, `serverSwitchEnabled=false`. This is not a complete installable operational schema: authentic snapshot CREATE/provisioning authority and full original constraint/trigger/index compatibility remain unresolved. The reconstructed disposable fixture is explicitly not production schema evidence. Original owner-status15-table/30-statement read closure and earlier finite SQL remain reusable dependencies, not a blanket historical migration replay.

**Retaining rollback:** disable the server switch first; use the existing fused durable/journey/canonical read-only rollback after separate approval. New writes are revoked while source requests, snapshots, customers, App/website drafts, engagements and scoped readback remain. The local test verifies retained data and denied later writes. No rollback drops records or restores broad snapshot access.

## Prepared real Auth/JWT acceptance

`scripts/run-connected-hosted-acceptance.mjs` defaults to printing a plan with **zero network requests**. `--execute` additionally requires exact source-bound `MUTATE_FICTIONAL_STAGING:<commit>` consent, explicit fictional-only configuration, the designated URL and private credentials for the original two fictional test owners. Production URL and incomplete approval fail before any request. It never creates users, accepts a service key or activates providers.

The execution path reuses the actual staging Auth/canary inspector, connected website session, original goal-to-App orchestrator, reviewed enquiry journey and canonical Work session. Prepared checks cover anonymous and cross-owner denial; website wording/design/hash readback; fresh sign-in reopening; stale writes and deliberate lost-ack/no-replay; App creation/configuration/edit/reopening; a separately provisioned original fictional enquiry; explicit separate-contact filing; private Prepared quote creation/readback/fresh reopening; and sign-out invalidation. Results contain booleans rather than tokens/customer payloads. This positive hosted path **has not run**.

Token expiry/refresh acceptance, controlled live membership revocation and hosted concurrency remain separate required checks. The original inspector currently discards refresh tokens and requires fresh sign-in; no automatic refresh success is claimed. Test-user/business/profile/request provisioning, schema installation, deployment and switch activation each need separate explicit approval. The harness cannot manufacture customer identity, consumer submission authority or source requests.

## Website, App, Work and Inbox interiors

New reusable `WorkflowStatus`, `EditorToolbar`, `EditorAction` and `ReviewPanel` use the existing theme, Card/Button authority and shared interior tokens. Status is supplied by the actual caller; the components cannot infer or trigger a save, send, payment or approval. Text and icons accompany colour; errors use alerts, notices use polite announcement, content wraps naturally and original48-point buttons remain.

- Website Builder and Preview: compact original save/uncertainty notices; shared responsive style/spacing and section-move toolbars, with the original named controls/handlers retained; coordinated composition and Explore reviews use the common review surface.
- App Builder: shorter task-first introduction and review cue; consistent actual Studio notices, private recovery warnings and clearly unsaved proposal status. The initial goal/planner, original module restrictions, editing and Undo remain authoritative.
- Inbox: whole-label, horizontally scrollable shared status tabs; useful filter-empty state with an original local clear-filter action. Source context, unmatched items, delivery distinctions and original customer/thread actions remain.
- Work/Customer and private financial preparation: common uncertain-operation and observation notices; Prepared quote fields clearly identify the working copy and state that saving is not issuing/acceptance/payment. Original conflict-disabled inputs, review controls and exact customer/engagement identities remain.

Home, main orb, constellation, four-edge floating-orb geometry/preferences, Talk routes, navigation, appearance modes, AppController, Owner Preview/configuration and root dependencies are unchanged. Existing social/Scheduled-label fixes remain. This is a meaningful additional interior adoption, not a claim that every legacy panel or invoice/provider screen has been redesigned or fully connected.

## Fresh verification

| Evidence | Result / process exit |
|---|---|
| Complete frozen application selection | **441/441 passed;0 failed/blocked/unexecuted; exit0** |
| Foundation | **105 passed; exit0** |
| Local PostgreSQL17.11 | **62 stages;0 failed; exit0**, 85 instrumented RPC attempts/65 successful calls; raw/concurrent probes additional |
| Syntax | **69 changed source modules; exit0** |
| Architecture | **0 static relative-import cycles; exit0** |
| Pinned-tool health / Expo dependencies | Both exit0; Expo explicitly warns dependency validation is less reliable offline |
| Real Deno2.5.6 Mini App + Website + typed helper probe | **0 diagnostics; exit0**, unchanged default checks, frozen pinned SDK lock |
| Genuine dependency bundles | Mini App105 modules and Website79 modules; each exit0; bundling is separate from type/runtime acceptance |
| Local Owner Preview iOS/Hermes | Exit0; no signed binary |
| Local isolated-staging iOS/Hermes | Exit0; no deployment/installation |
| Workflow components |32 width/font/palette combinations plus actual original layout/Inbox/private quote controls; exit0; inert execution |

The PostgreSQL chain retains cross-tenant/anonymous denials, multiple original enquiries, scoped reopening, current/revoked owner checks, independent quote revisions, stale CAS, lost acknowledgements, source provenance, real two-connection App CAS and membership-lock races, canonical quote CAS and retaining rollback. It uses actual SQL/roles/locks with **synthetic local auth.uid**, not hosted Auth/JWT/PostgREST acceptance.

Failures were kept: the first full selection had439 passes/two failures (toolbar control reachability and the obsolete revision1 creation fixture). The original Website test is unchanged; source now retains its controls. The goal fixture is pinned to original SQL revision2 and expects plan revision3; its original security/counterexample assertions remain. An intermediate rerun was stopped while correcting that stale fixture and is not credited as a completed pass. Initial compiler, new-fixture equality, sandbox socket and omitted-parser-arguments failures are distinguished in checks JSON. Historical Snack diagnostics were not rerun or represented as passing; actual iOS exports succeeded independently.

## Evidence limits and exact next step

No genuine new native/browser screenshots or recordings are available. This Linux workspace has no ready native iOS renderer or existing React Native Web/react-dom application surface. No capture pipeline, mockup or paid build was introduced. Component execution and Hermes/Deno compilation do not prove native visual quality, drag feel, battery use, real hosted permissions or release readiness. Owner Preview build29 was neither changed nor replaced.

**Lowest-cost next step:** obtain/review the authentic missing foundation DDL (or separately approve a source-reviewed designated-staging compatibility foundation), complete the full finite dependency/ACL install against fresh metadata, and rehearse it locally with the retaining rollback. Then seek separate approval for that exact staging SQL, fictional Auth/business/request setup and the two gateways, leaving the switch closed until the selected tests are approved. Verify actual provider Edge-runtime/CLI configuration; local Deno0 is necessary but not deployment acceptance. Only then authorise a bounded real two-owner hosted run, including the remaining expiry/revocation/concurrency checks. No new EAS build is needed for those backend tests.

**Recommended next substantial mission:** complete the authentic staging foundation and positive acceptance-harness rehearsal, close the refresh/revocation acceptance controls, then perform separately authorised hosted end-to-end draft/enquiry/private-quote verification. Continue targeted premium interior adoption in deeper App configuration, customer/Work review and remaining financial screens without touching accepted Home/orbs. Broad owner/iPhone end-to-end testing remains premature.

No hosted mutation, production change, EAS/OTA/distribution, signing change, build-number increment, paid AI/provider usage, real communication, booking/payment, domain/DNS or external spending occurred. `jasperjanes.co.uk` remains only the separately controlled future website test domain.
