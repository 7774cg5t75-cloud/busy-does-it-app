# Mission 15 Phase 7 — supported first-version implementation complete

Continues existing branch `codex/builder-mission15-design-advancement`, draft PR #26 dependent on PR #25. Completion work starts at remote `d6954039a5116f34ca024cc2a1927f44e3175e2c` (local equivalent `63b8ed4f591316d7f60d660f32193dd3b1d4eeb9`, tree `42ce4ac9bdc5ea6a1a657884902b3ff31178e815`). Approved V22.31 and standing architecture requirements remain authoritative; no private master contents are committed. Earlier Phase 7 checkpoints remain intact.

This completes the supported first functional version requested for Phase 7, not universal freeform editing or release/device acceptance. Mission 15 remains open for Phase 8. This record supersedes the earlier Phase 7 service/typography/secondary-page unfinished-work list.

## Implemented completion

- **Reviewed customer requests:** signed-in marketplace clients send exact reviewed app/version IDs. The trusted original request handler rejects a new stale/foreign version before inserting a request. Original saved idempotent requests reconcile before this gate, so publication changes do not cause replay. A definitive no-write response releases the retry reference and asks for reload/re-review; uncertain transport retains the same reference. The original owner-inbox row retains its reviewed `version_id`, original service text and customer requirements. Free-text service requests stay valid, older clients retain their original optional-field contract, and no service prices/appointments/availability are invented. Standalone already enforces expected app/version through its original guest path; existing standalone review/recovery tests remain passing.
- **Broader selected typography:** exact service, FAQ and testimonial card headings/paragraphs now share finite font, weight, alignment, line spacing and colour operations with supported section text. Local, hosted-section and export renderers use the same class/CSS generators. Per-setting resets preserve all other overrides; resetting a card heading size no longer drops its other typography. Owner locks, exact selected identity, source generation, compound preview, Apply and Undo remain the original paths.
- **Readable brand text colours:** owner choices are original colour, section foreground or brand accent. Accent shades are adjusted with actual relative-luminance calculations to at least 4.5:1 against the supported canonical paper/soft/white or dark hero/contact backgrounds. Editorial/boutique light heroes use the correct light-background tokens. This is a calculated solid-colour guarantee within those contracts, not photo/screenshot contrast or accessibility certification. No arbitrary CSS, downloaded fonts, new Brand DNA overwrite or paid evaluation.
- **Direct size and natural instructions:** contextual heading-size presets reuse original responsive heading/item operations. Familiar selected requests such as “make this heading bold” or “change this heading to brand accent” produce finite appearance changes rather than replacing wording. Ambiguous unsupported bare colour requests such as “change this heading to gold” are rejected with a supported alternative; exact wording remains editable through Edit.
- **Owner-page movement:** relative movement on owner-created multi-section pages delegates to the original bounded page-section operations, with a single final commit. Actual page order survives save/reload and changes neither the home composition nor other destinations. Displaced locked sections reject the complete move. Core single-section pages and cross-page transfers are not falsely exposed as drag targets.
- **Accessible movement alternatives:** each permitted handle offers Earlier/Later buttons on activation as well as pointer drag and keyboard arrows. Screen-reader activation requires no drag or keyboard. Visible drop cues, threshold, pointer cancellation, blur/page exit, Escape and one-shot bridge submission remain; exact current source checks and original Undo apply to every path.

## Recoverable GitHub checkpoints

- `1eb169889812dcb290ff0ac39f83866e181115ec` — reviewed version and safe request retry outcome.
- `840991ce2388ad130b7d0bd39a262869c2d0673d` — selected card typography and calculated brand colours.
- `3d0a68495673f0c6a3696ba23af2cfe7e73c9944` — owner-page moves and no-drag alternatives.
- `2a0bd5bf7acb769877be39af58108fe8ded68d52` — original owner-inbox version regression and selected-language disambiguation.

Each connector-created tree matched the local checked tree before a fast-forward-only branch update. Final documentation/check manifest follows these feature checkpoints. No branch or dependency was rewritten.

## Verification

81 selected offline commands pass. 22 changed source/test modules parse with cached Babel, including JSX and both changed Edge TypeScript entry points. Original trusted handler and client initializer execute with inert DB/transport/SecureStore boundaries; the owner-inbox regression verifies exact saved version/context, duplicate reuse and no new stale request. Actual local and hosted section render functions test styles and reload. Gesture handlers execute with inert DOM events, including pointer cancel/blur, no-drag activation and keyboard alternatives. Owner-page tests execute original page operations and selected-plan transaction, real HTML ordering and locked displacement rejection.

The broad run initially found one extracted-function harness missing the actual new version-check import. That harness was corrected, not bypassed; original checks remain, and new owner-inbox/version assertions were added. Affected suites were rerun after the final language changes. Exact outputs, resolved failure and source SHA-256 values are in the completion checks JSON. Cached dependencies reused; no installation. Fictional HTML gallery and unsigned prototype generation are local evidence only. No Chromium retry, sandbox weakening, screenshot or aesthetic claim.

## Compatibility and remaining acceptance

The new marketplace client deliberately refuses a backend without the advertised `published-version.v1` request-review capability. Any separately approved rollout must install the matching trusted mini-app handler/helper before the updated client; old clients remain compatible. Website worker/client/export releases must include the shared typography/colour/layout/page modules together. No schema migration is required or authorised.

Before release: normal-sandbox browser pointer/touch/focus/scroll acceptance, iPad/iPhone screen reader and large-text checks, native Studio approval/Undo acceptance, and isolated hosted auth/tenant/stale-version/idempotency acceptance. None was performed here. The previous disposable rehearsal proves only its original commit/scope; no rerun or hosted database change occurred.

The supported first version does not include arbitrary CSS/colours/fonts, text-range styling, inline contenteditable writing, freeform pixel placement, gallery/card dragging, cross-page transfers, drag autoscroll or native dragging. Direct wording edits use the existing modal. Paragraph size uses existing section reading controls; new direct size presets cover headings. These are explicit future expansion boundaries, not fake controls. Individual service IDs/revisions and availability remain outside the original name/published-version request contract.

## Next substantial phase

Phase 8 should prioritise polished mobile owner editing: compact inline wording preview, finer paragraph sizing and card style presets through the same finite operations; continue reusable App Studio service/customer-portal journeys where trusted backends support them. Bring genuine browser/device acceptance into an approved compatible environment before expanding gesture claims. Do not repeat the blocked Chromium setup or replace existing planners/editors.

No merges, deployments, hosted database access or schema changes, workflow execution, publication, real customer/provider actions, paid builds/services, credentials or billing changes. Additional external spending £0.
