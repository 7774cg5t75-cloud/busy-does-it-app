# Mission 13 — connected conversations and useful customer apps

Source development only. Draft PR #24 depends on PR #23; no prior branch was merged or rewritten.

## Preflight and source

- Start: `codex/builder-mission12-connected-journeys`, PR #23, `f9b11034449a8d401ea71afe27627c5715325c72`. Confirmed current and draft against GitHub before branching.
- Mission branch: `codex/builder-mission13-customer-conversations`.
- Full owner-attached Word Product Master **V22.27**, dated 17 October 2026, opened and reviewed: 1,691 paragraphs including table content; original DOCX SHA-256 `8c7e7134124f9b8c54fd8fd159f66dd199883dd0af601d390904e0ddec9005eb`. Supersedes the V22.24 mission checkpoint. No private text or document committed or modified.
- Read standing AGENTS, architecture/development policy and public master provenance/brief. Reviewed Mission 12 delivery, checks and architecture health; relevant current architecture/source for request-to-customer links, messages/receipts, communications/journeys, Work/booking, original Studio/universal planner, public content, both builders and recovery. The open dependency chain remains intact, including independent documentation PR #16.
- Reused original request/conversation tables, tenant membership routes, atomic message RPC, secure request keys, exact receipts, follow-up proof, approved live app versions, Business Brain conversation projection, public record contracts, controlled app modules, Brand palette, original Studio and Undo. No competing CRM, provider, brain, brand profile or transaction engine.

## A/D — grounded owner conversations and practical intelligence

The existing owner-authenticated follow-up check can now prepare from the latest customer message rather than always returning a generic acknowledgement. It identifies bounded price, availability, location, accessibility and option questions, displays the original saved subject and whether the original enquiry carries a listing reference, and lists facts the owner needs to check. A customer-supplied listing reference is not verified stock, price, booking or transaction authority.

An **exact**, case/spacing/punctuation-normalised question match against one valid FAQ in the current live app version can supply an approved answer. Negated, compound, ambiguous, malformed, long or unmatched questions fall back to cautious editable wording, not invented answers. Nothing uses a paid model, trains a model or executes customer instructions. FAQ answers longer than 240 characters need manual preparation. This is bounded deterministic assistance, not general semantic understanding.

The trusted read adapter selects only the same-business request, two newest messages, same-business app and its exact current **live** version. Existing read-only default remains compatible with older summaries/tests. Preparing an answer is an explicit owner route; no contact addresses are fetched. The current live-version ID extends the existing review stamp; changing that version invalidates approval. The original fresh-check, owner/admin route, actual message RPC, exact-payload idempotency, uncertain-result receipt lookup and saved-reply readback remain unchanged. Existing freshness checks are not a new atomic transaction across publication and message submission.

The owner reviews/edits and explicitly sends through the original supported **in-app** conversation. Sending, database save, push submission, delivered notification, customer read, accepted booking and actual Work record remain different facts. No new email/SMS/WhatsApp sender is implemented. Guest-originated requests retain the existing manual contact limitation; Busy does not pretend an in-app reply reaches them.

A verified defect in the original Communications Hub was corrected: `approved` and `unsent` could previously count as actual contact because of broad regex matching. Drafted, approved, sending, manually recorded sent, failed and unknown are now distinct projection states. Unknown provider claims do not become delivery proof. A latest uncertain attempt requires original receipt review before another suggestion; genuinely newer incoming activity changes the recommendation. Revoked customer contact permission blocks further contact suggestions. These are recommendations, not new server sending authority.

## B — functional customer app navigation and details

The marketplace customer runtime now has accessible, selected-state section controls using its existing approved module order and names. Customers can open Services, About, Contact or another available section instead of viewing static navigation labels. Private builder previews retain the original measured navigation presentation. No modules, owner locks, draft order or published configuration are silently changed.

Selecting a service/product/event or the enquiry/booking section can move the existing Shell to the measured request-form position. Picking a service after a listing asks before replacing its listing-specific message, avoiding mismatched saved context. The existing form, exact request payload and owner inbox remain authoritative. Native focus and actual scroll geometry still need device acceptance.

Product details display approved revision and options; a previously selected option must be reviewed/reselected after its record revision changes. Marketplace and standalone share this correction. Events show both start and end in the business time zone, including multi-day/DST/non-UK cases. No checkout, stock reservation, ticket, available-slot or attendance promise was added.

## C — shared website/app information

The original governed HTML content mount now shows public product options, prices and SKU labels on websites even when no enquiry handoff is configured. Previously option visibility was incorrectly tied to the app-only handoff selector. Options use text nodes, safe disclosure controls and existing approved public records; no fake website request endpoint appears.

Both public adapters and native views share the schedule formatter and approved-record schema. Existing Brand DNA/palette, FAQ/contact transfer approvals, destination overrides, private/public boundaries and exact app/version links remain intact. This sweep improves shared content presentation, not automatic brand synchronisation or external-site editing support.

## E — optional private enquiry recovery

Marketplace customers may explicitly save, restore or delete a private enquiry draft through existing Expo SecureStore and the original shared checkpoint queue. It contains only bounded enquiry fields and selected public-record identifiers; no credentials, owner snapshot or cloud sync. It is scoped to signed-in user/app, binds the published version, and refuses stale or cancelled selected records. Unsupported secure storage fails honestly; no plain AsyncStorage/web fallback.

Restoration is available for 24 hours. Expired data is deleted on next access, **not** by a new background deletion service. Restore requires a replacement confirmation, performs no request mutation and cannot overwrite typing, changed feed/source, account/navigation scope or an unmounted screen after delayed IO. Successful submission clears only an identical saved draft; newer saved work is retained. Existing opaque request-reference/receipt recovery remains available after restart and must be checked before retrying an uncertain submission.

Only explicitly saved **enquiry** drafts receive persistent recovery. Booking forms, standalone guest forms and owner reply text are not newly persisted. The tests reconstruct helper instances against storage fixtures; actual OS restart, encryption, uninstall, logout/re-authentication, expiry and native storage limits remain device acceptance gates.

## F — verification and maintainability

**29/29 focused scripts passed**, including four new suites and both inherited Babel-blocked Mission 12 suites. See `BUILDER_MISSION13_CHECKS_2026_10_17.json` for exact commands, outputs and source hashes. Complete Babel syntax passed for 26 changed JS/JSX/TS modules; 18 changed mjs/cjs modules also passed Node syntax. The complete changed Edge entry point was TypeScript-stripped and Node syntax checked. No Deno type check, Expo export or complete repository suite was run.

Actual trusted read adapters, client proof checks, original send/recovery handlers, public HTML handlers and component functions are exercised with inert DB, transport, hooks/native or DOM boundaries. No real Auth/JWT, hosted RLS, provider, browser/device or production-readiness claim. The old nine-stage database rehearsal proves only `55db12d...`; it was not executed for this mission.

Babel tools were recovered entirely from the existing npm cache with `--offline --ignore-scripts --no-audit --no-fund` into a temporary directory. Exact direct versions and integrity-pinned transitive graph are recorded under `scripts/offline-tools`; the application package manifest is unchanged. Declared dependency licences are MIT, ISC, Apache-2.0 and CC-BY-4.0. Clean cached-only `npm ci` reproduced all 51 tool packages; no install scripts, paid service or external package download. Keep the distributed package licences; these tools are not bundled with the application. See that directory's README for reproduction.

A real test-harness bug was fixed: a component setter previously wrote into whichever component had most recently rendered. It now retains its owning component's slots; the cross-component navigation regression exercises this correction. Existing expectations were preserved. The older form-logic fixture gained only its new inert recovery-hook boundary; actual recovery-hook behaviour has separate execution tests.

## Recoverable GitHub checkpoints

- `d31e15e143773118e567e866a0ffbd62b0008d6f` — grounded owner reply preparation.
- `94caf74f8441ad893f4ce45db55339996e91627c` — explicit encrypted enquiry recovery.
- `dfca88ecab68da978c4081f8306d339d6ddf64c8` — functional app navigation/shared details.
- `62125d22a67020f4aa7e998c5ff57bf998dd7f3e` — honest communication states/reproducible offline tools.
- Final evidence/source refinements follow on the same PR. PR head records the exact ending commit.

GitHub connector commits preserve each checkpoint as a non-forced child of the previous branch head; local Git commits have equivalent source trees but separate commit identities. Remote source equality is checked before final reporting.

## Safety, rollout and remaining acceptance

Additional external spending **£0**. No workflows, merges, deployments, hosted database access/migrations, provider/account/billing changes, real messages, paid AI/builds or publication. Existing workflow registration, disposable network/proxy, exact-SHA/protected environment gates, migration history and PR dependencies are untouched.

New client fields/controls are additive; older Edge versions retain generic follow-up wording. Contextual answers require the reviewed updated Edge source in a separately approved compatible staging deployment. No schema installation is required by this mission. Before release, verify signed-in customer → owner inbox → draft/edit/approve → saved reply → customer readback; denied roles/revoked membership; publication races; duplicate/lost receipts; mobile navigation/focus/large text; secure-store restart/deletion and all unsupported guest/provider explanations.

The major controllers remain technical debt; focused extractions and exact size findings are in `ARCHITECTURE_HEALTH_MISSION13_2026_10_17.md`. No claim of broad app generation, transactional commerce, confirmed availability, external-site editing or autonomous customer communications.

Next substantial mission: deepen service/product/event-specific question-to-answer journeys and owner-reviewed response continuity, then connect genuinely supported customer follow-up outcomes to the same Business Brain. Prioritise targeted approved device/staging acceptance over another infrastructure redesign; add external channels only after provider/consent/security contracts are independently verified.
