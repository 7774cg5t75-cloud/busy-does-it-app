# Mission 15 Phase 11 — simpler selected editing and readable app colours

Mission 15 remains open on `codex/builder-mission15-design-advancement`, draft PR #26, dependent on #25 and its unchanged #24/#23/#21 chain. Starting GitHub head verified before modification: `56ba27f14683012477c9386f354603f0e63648de`. Functional GitHub checkpoint: `29015cb85dc244857d80087644a38ada0ce9677a`, tree `da21f69735772bf9ce931a74b8d2011479f60f9f`. Local tested source has different commit metadata but the identical tree; see the checks record. Closeout adds documentation only.

Standing instructions, architecture/development policy, original editing/quality paths and Phase 9–10 records were reviewed. The supplied private V22.32 attachment was reopened and reverified against its prior complete review: SHA-256 `217b20a109368c92817e936d5a82845003d41e6b8ff92f1f79a07098d1cacb07`. Its direct-editing and proportionate quality requirements remain current; private bytes and extracted content stay outside Git.

## Working functionality

- **Selected services:** owners can select an owner-written service, edit its name/description or move it earlier/later. Raw source index plus exact row identity survives filtered presentation; identifiers, category and informational price/duration labels are preserved. Existing `services` Studio operations, comparison, owner approval, CAS and inverse Undo remain authoritative. Duplicate names, unsafe copy, locks and stale callbacks/source fail safely. Legacy rows that would be implicitly normalised require the full collection editor. Current customer enquiry and booking-request actions retain their original contracts.
- **Selected customer answers:** owners can select an FAQ, edit its question/answer or move it earlier/later through the original `public_collection` operation. Other entries and identifiers are preserved. Exact source, bounds, duplicate-question validation, copy locks and Undo remain intact. Typed/voice transcripts use the existing selected interpreter; supported short quoted changes and relative moves prepare proposals only. No generated business facts, testimonial editing or second information store.
- **Reachable app colours:** a compact, wrapping owner control previews existing palettes and explains their app-wide scope. Current colours are shown with an explicit calculated-contrast evidence label. Studio approval and Undo remain required; website branding and stored shared Brand DNA are not synchronised. Custom colour entry remains in the full existing brand editor. Service/FAQ edit buttons have explicit accessible selected states, visible palette-based outlines and bounded wrapping with a minimum 48-unit control height. Whole-card scrolling/text/customer actions are not intercepted. This is component evidence, not physical touch acceptance.
- **Verified colour correction:** the previous custom accent could reach only about 3.73:1 on a service-card surface for seed `#228822`, despite passing on the page. The original palette engine now adjusts the rendered accent against the more demanding surface, protecting both supported solid backgrounds while retaining the stored seed. The existing audit now includes small service-accent text. Actual rendered featured-service text is checked against its actual card colour. No claim about photos, overlays, disabled platform states or full accessibility certification.
- **Website picture toolbar:** compact framing, size and position groups stage original contextual instructions for private comparison and explicit Apply. Gallery framing/relative movement is per photograph; tile sizing is gallery-wide, with a separate phone preset. Hero and supported feature-photo options preserve the original finite responsive contracts. Unsupported feature-photo resizing is not offered. Availability executes the original pure layout operation, disabling locked, boundary and no-op choices. No arbitrary coordinates, new image source, upload or media approval path.
- **Website stale-callback correction:** wording saves, layout applications, instruction previews/applications and text/transcript callbacks reject replaced source/selection; old wording saves cannot submit an earlier buffer. Unmounted editor mutation callbacks are also excluded. Existing private save/quality/publishing boundaries and Undo are preserved.

## Checkpoints

| GitHub commit | Recoverable work |
| --- | --- |
| `f3230ff33cb0dc1410c8055bcadbe3dd5c65f0df` | Selected service wording/order and original Studio contracts |
| `51d00e1f99739fc4024c2a6748b910a5358373fa` | Website picture preparation and stale callback protection |
| `d5a83619af70b500fe3ef35aad087eda67e67a8d` | Solid-surface contrast correction, compact app colour review |
| `6b772e622698676921b294fbce91d138cce5f169` | Selected FAQ editing and trusted planner parity |
| `242f674cf0eba7ef14902947c55272dfd8dd2e6e` | Accessible service/FAQ selection controls |
| `4536cf01ba113ed6045948402c432203da4c88a2` | Picture availability through the canonical layout operation |
| `29015cb85dc244857d80087644a38ada0ce9677a` | Malformed/inherited palette labels fail safely without false contrast approval |

Every branch update used the expected remote head without force and compared exact local/remote trees. Dependencies #25/#24/#23/#21 remain open, draft and unmerged at their earlier verified heads.

## Verification and evidence limits

Bootstrap `--offline` and health passed with existing pinned Node 24.19.0/npm 11.9.0/Babel tools; no installation or dependency change. The initial reviewed baseline passed 95 checks. The final expanded exact-source selection passed **101/101**, with zero failed, blocked or unexecuted checks; its detailed outcomes are recorded in `BUILDER_MISSION15_PHASE11_CHECKS_2026_10_18.json`. Four new behavioural suites cover selected services, FAQ, picture controls and app colours; two older branding suites are now included in the selection. Twenty changed JS/JSX/MJS files parse; four environment-policy tests pass.

Tests execute original component, renderer, planner and private-commit paths with documented inert native/IO/transport boundaries. Selected service/FAQ operations are compared with the actual trusted shared planner. JSON reload, exact inverses, locks, stale source, public editor exclusion, supported customer buttons and approved standalone projection parity are exercised. Colour tests cover 221 custom seeds plus all 20 curated palettes; they are calculations, not screenshots. Original safe/advisory/critical and pre-publication rejection tests pass with inert transport/DB boundaries.

Two supplementary inherited assertions failed during development: the old audit assumed six readings and the older branding test depended on historical JSX spelling. The former now checks named measured pairs including service accents; the latter executes original parsed JSX expressions for initial enquiry wording/current website input. No assertion or security rule was suppressed. New fixture failures were corrected before checkpoints.

No Expo/native bundle, physical iPhone/iPad gestures, browser screenshot, visual aesthetic evaluation, OS restart, Deno semantic check, hosted persistence/Auth/RLS or live provider acceptance is claimed. Root Expo/RN installation and root lock remain absent. A reusable cloud environment is owner-managed; repository setup has not published/configured the platform. The existing normal-sandbox Playwright proposal remains inactive/unexecuted. Its minimum separately approved scope remains fictional first-party fixtures at 390×844, 768×1024 and 1440×900, source/revision/hash-bound screenshots and geometry, selection/movement/cancellation/scroll and keyboard checks, no credentials and runner-enforced egress isolation. It does not replace native/device acceptance or prove aesthetics.

## Architecture and next work

AppController and the main mini-app Edge entry are unchanged at 703,942 and 183,295 bytes. miniApps.js grows 279,797 → 280,654 bytes; selection/wording/colour responsibilities live in small dedicated adapters/components. AppVisualSelection is 7,717 bytes and appContextInstruction 9,258 bytes. The static census reports 1,110 source files, 2,198 static relative edges and zero detected cycles; dynamic/aliased/runtime imports are outside that proof. Large inherited controllers remain a maintenance risk, not a reason for a speculative rewrite.

No new request engine, editor, persistence ledger, schema, provider or memory system. Client/Edge operation contracts stay compatible. Existing standalone packaging copies the canonical palette engine; a future separately authorised client/native rollout must include its changed helper. No deployment is authorised by these checks.

Next unfinished substantial workstream: finite per-component App typography/appearance contracts through trusted Studio and matching marketplace/standalone renderers, preserving function bindings and exact Undo; then consolidate remaining mobile controls and obtain separately approved normal-sandbox browser/iPhone/iPad acceptance. Arbitrary per-element RGB/fonts, freeform native drag, inline rich text, drag-autoscroll and persistent device acceptance are not complete.

No merges, workflow dispatch, production/staging deployment, hosted database access/migration, customer/provider action, publication, credential/billing change or paid build/service. Additional external spending: £0.
