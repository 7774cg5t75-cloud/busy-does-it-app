# Mission 12 — connected builders and customer enquiries

17 October 2026. Source development only; PR #23 remains draft and dependent on PR #21.

## Source and master identity

- Starting application source: `codex/disposable-supabase-review`, `55db12d247b149aa2052fc17f5d5dc536a77b8a7`.
- Mission branch: `codex/builder-mission12-connected-journeys`; initial preflight `0ad57abade13cfb9d0fe42da3b72544c692650c7`.
- Recoverable functional checkpoints: `f3512238cd0806d7c1c23e774f51b4fd07fb354b`, `e40813def24564df5b3a53c5a00810d48582f054`, `b8711f7a2e16d67dc0f8ad77f8153c84c36b3140`; final source/evidence commit follows these in PR #23.
- Current owner-supplied full Word master V22.24 opened and reviewed; original DOCX SHA-256 `07d6b64325c624abe50d81afc73f6fe5924416e3bd1c7ba5a71fc2160726e8e1`. Private document is unmodified and excluded from Git. Public provenance is updated without merging independent documentation PR #16.
- Existing application PR chain and PR #21's workflow/database safeguards are preserved. No merge, rewrite, hosted database operation, deployment, workflow dispatch, provider send, paid build or additional external spending.

## Delivered connected improvements

### Customer item → enquiry → existing owner request

The existing public product/event view now prepares a reviewable enquiry containing the item name, approved record ID/revision, selected product option and displayed price, or listed event dates/location. It offers a selectable standard option and accessible selected-option state. This is customer enquiry text, not a price guarantee, stock reservation, purchase or confirmed attendance.

Public Business App HTML carries item/revision/option through the existing link endpoint into the existing sign-in/deep-link flow. The original exact app/version website-link guard remains intact; only validated selection-reference query fields are removed before that unchanged guard is evaluated. Unknown/duplicate parameters, wrong pins and disabled actions fail closed. On authenticated open, the selected reference is re-resolved against the current server-returned approved feed; stale, cancelled, past and foreign selections are rejected.

The marketplace form fills service AND message, keeps bounded account/app/version/entry-scoped in-memory drafts across navigation, refuses old asynchronous callbacks and clears memory on account change/sign-out. Choosing another listing requests confirmation before replacing an existing message. Completed form state does not revive the old enquiry. The standalone form retains selected context, typed fields and saved/uncertain outcomes across navigation; returning while a request is pending does not silently submit again. Form identity includes item/option/revision, avoiding same-name collisions.

Submission still uses the original authenticated or protected guest request system, existing payload fields, tenant-scoped owner inbox, exact-payload idempotency and receipt controls. The original trusted submit function is exercised offline with inert boundaries and preserves the selected context in its saved service/message. An independently verified defect was fixed: `app_detail` omitted the server-resolved `business_id` even though its submission/replay paths consumed it. No schema, new request ledger, direct customer messages or booking authority were added. The context is customer-provided wording; owners must verify current details before making commitments.

### More useful App Studio preparation and natural editing

The existing goal-content assistant can ask for missing public contact details when the Contact module is enabled, and an optional first customer question/answer for an enquiry goal. Existing values stay unchanged; incomplete answers, invalid contacts, wrong scope and locks fail closed. Proposals use existing finite Studio operations, source binding, approval and exact Undo.

The existing typed/voice instruction interpreter accepts `add question "..." answer "..."`, including quoted wording containing “and”. It prepares an atomic, private, reversible FAQ change. It does not perform transcription, call a model or publish; an appended unsupported action such as “and publish” rejects the whole proposal.

### Shared content with clear owner choices

Both original design-transfer panels offer a separate opt-in to add missing answers to an existing FAQ. Default transfer semantics remain compatible. Existing destination wording is retained; same-question/different-answer and identifier conflicts are reported for review rather than overwritten. Limits, locks, same-business scope and exact reapproval remain enforced. No new brand profile, content store or automatic sync was created.

A verified controller integration defect was fixed: the existing app-to-website approval handler applied style/services but omitted the reviewed FAQ/testimonial sections. It now carries recomputed reviewed public-information sections into the same private website commit/Undo boundary. Product/event facts remain shared approved records; copied FAQs are destination drafts and still need separate publication approval.

### One more practical shared Business Brain

The existing universal capability planner now supplies one bounded intent interpretation to App Builder recommendations and customer-capability advice. It handles excluded capability lists, positive clauses, contradictory requests and forbidden dependencies. “No bookings; just enquiries” no longer recommends enabling booking merely because the business is a salon. Contradictions request clarification; excluded required dependencies do not become hidden prerequisites.

Recommendations still use the current catalogue and available modules, remain advisory and respect owner review. No module is enabled, model retrained, preference secretly persisted, cross-business data shared, provider called or money spent. This is deterministic language handling, not general speech-understanding or commercial-outcome proof.

### Safer approval, recovery and public data handling

The shared record editor binds publication approval to the exact selected saved revision and form snapshot. Unsaved fields and a newly refreshed external revision block approval of an older record. Save/publish updates the snapshot only for the same current form; refresh keeps typed work until the owner deliberately selects the saved record.

Malformed public feeds fail closed in the shared selector rather than throwing during display. Shared contract copies and the native/web adapters remain aligned. Account-bound in-memory form storage and standalone request-state storage are bounded to eight entries; no new PII persistence, cloud snapshot or analytics pipeline is introduced.

## Verification

**16 scripts passed**, including seven new focused suites and nine inherited checks. Exact commands, outputs and source hashes are in `BUILDER_MISSION12_CHECKS_2026_10_17.json`.

New tests execute the real trusted request submission and app-detail function bodies, real public Edge handoff callback, real HTML DOM handlers, actual marketplace/standalone/editor pre-render logic, actual private website controller apply handler, original finite planners, record adapter and retry helper. Database, React hooks, native and transport/provider boundaries are inert fixtures. These tests do not prove a deployed Edge HTTP service, real React rendering, device storage, browser acceptance or production authentication.

- Full JSX/module syntax: eight changed UI files, Node's built-in Acorn 8.17.0 plus MIT `acorn-jsx`, official source pinned at `8ed96d6ddec2065204ba07d924bb2e7bca539ea6`, obtained through GitHub tools. Tool files stay under /tmp; no application dependency change or npm installation.
- Pure-module syntax: 27 changed .mjs files.
- Full changed Edge entry-point syntax: TypeScript stripped with Node's built-in API, resulting modules checked by Node. This is not Deno type checking.
- Runtime used: Node 24.19.0. The rehearsal's pinned Node 22.14.0 was not installed or rerun.
- Blocked: `check-app-goal-editing.mjs` requires absent `@babel/parser`; `check-mission10-public-information.mjs` passes its initial pure checks but cannot complete its component-runtime portion without `@babel/core`. Neither is counted as passed. Existing full component/Expo export tests were not run. No Babel installation is assumed.
- An inherited test caught a changed default transfer policy. Fixed by making existing-FAQ additions a separate explicit opt-in; the unchanged inherited information-reuse test passes.
- Successful nine-stage rehearsal #15 remains evidence ONLY for `55db12d...`. No workflow or database rehearsal ran for Mission 12.

## Delivery and remaining limits

Compatible source rollout still requires separate approval: updated public link handling, additive app-detail metadata and client changes must be validated together in isolated staging before release. Older link endpoints reject extra reference fields rather than quietly accepting them. No hosted installation is authorised.

Transient forms survive navigation and the running sign-in flow, not process death/reinstall. No new encrypted PII draft store was added. Guest retry/receipt controls remain the original bounded semantics; manual duplicate-aware recovery is not an exactly-once delivery guarantee. Public catalogue snapshots may change after they were fetched; listing references are enquiry context, not transaction authority.

Real JSX/native rendering, accessibility with screen readers/large text, browser-to-sign-in-to-owner inbox journeys, Deno types, device process death, hosted JWT/RLS, independently verified notifications and signed exports remain unverified. No checkout, inventory, payments, tickets, live availability or confirmed booking capability is claimed.

Focused architecture health is recorded separately. The App Builder's full desired design/generation ambition is not declared complete. Next substantial mission should deepen the owner enquiry → reviewed reply → customer readback journey and content-aware app navigation/detail screens, using these original shared records and approval boundaries, with separately approved device/browser/staging verification when appropriate.
