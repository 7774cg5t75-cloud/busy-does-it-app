# Mission 15 Phase 10 — selected visual editing and reliable verification

Mission 15 remains open on `codex/builder-mission15-design-advancement`, draft PR #26, dependent on #25 and its existing chain. Starting GitHub head verified: `54a3cf2ec876a7c054344277f94f43e104538ea1`. Fully tested functional GitHub source: `f36022ae165e87eaebe901b11e25bd3072d1983c`, tree `97855c12eba8dca63ac428b695b8ff5c973ad34d`. The closeout commit adds records only.

## Preflight and environment

Reviewed standing instructions, relevant architecture/policy, Phase 9 completion evidence and existing editing/projection paths. The complete approved V22.32 master review from Phase 8 remains current; the same supplied private attachment is reverified at SHA-256 `217b20a109368c92817e936d5a82845003d41e6b8ff92f1f79a07098d1cacb07`. No private document is in Git.

Phase 9 health passed immediately using Node 24.19.0, npm 11.9.0, Python 3.12.14 and all existing pinned Babel tools. The relevant Phase 9 three-check baseline passed before implementation. No package installation, runtime upgrade, command-network permission or dependency change was needed. A saved/reusable Codex Cloud environment remains owner-managed: select the approved branch/runtimes, run the documented setup command during a registry-enabled setup phase and verify health. Repository scripts do not configure or publish that platform environment. See DEVELOPMENT_TEST_ENVIRONMENT.md; optional runtime Expo/Playwright and normal-sandbox browser acceptance remain separate.

## Functional improvements

### Approved image selection in App Studio

The existing visual-selection surface supports tapping visible approved gallery images. It binds the actual raw source index and exact URI, even when preview URI filtering changes visible positions. Owners prepare accessible description/caption edits and Earlier/Later moves through original `photo_description` and `photo` Studio operations. Locks, current source, normal comparison/CAS approval and exact inverse Undo remain authoritative. URLs, media approval and other records are not changed.

Supported size/corner/layout controls still use existing gallery-wide presets; that scope is stated rather than pretending per-image resizing. Current public-gallery contract is bounded to 15 images; this is not universal arbitrary asset editing or native dragging. Changed-source caption drafts remain visible but cannot be applied until current source is explicitly reselected.

### Selected typed and voice-assisted instructions

Extended the existing contextual interpreter and reused original Studio proposals. Supported examples include moving the selected photo earlier/later, changing its caption/description, editing supported selected public wording and preparing finite service/gallery/header/typography changes. Existing app-wide typography and gallery-wide size effects are explained. Unsupported colour/CSS/transactional instructions, mixed selected requests and inherited object keys fail safely; no partial unsupported colour operation is inferred.

The existing recorder/transcription component is reused. Its original app ID/revision/business gate and allowance remain intact; no provider/API implementation was replaced. It uses the existing approved whole-app transcription scope while the selected identity is rechecked locally. Record/Stop/review/Send remain explicit, and returned words only populate the instruction field. A separate preview and normal owner approval are still required. No actual audio or provider action was performed; tests inject an inert provider counter.

### Mobile Website Builder controls and a verified recovery fix

Typography categories now bind to draft/generation/page/section/item/field. Previously, a paragraph's selected size category could remain active after selecting a heading, whose available groups differed, and throw during rendering. Switching selection now closes stale groups safely; retained old callbacks cannot stage an instruction for the replacement selection.

Controls wrap in compact rows and offer optional explanatory guidance. Section headings expose existing phone/desktop size operations directly; unsupported card-specific responsive heading controls are not advertised. Foreground/brand-accent colour options remain finite and reuse original contrast-aware tokens. No arbitrary CSS, fonts or coordinates.

Website example instructions now **prepare** an unsaved change instead of immediately calling Apply. Owners can compare it and use the existing explicit Apply control. Direct owner-written text saving remains the original private-save path. Original generation/locks/quality/Undo and canonical HTML/CSS are preserved. Tests execute the original stage → static preview → private commit path; no WebView geometry or touch-device result is claimed.

### Gallery readability and genuine public parity

A focused `AppGallerySurface` replaces gallery rendering inside miniApps.js. It supplies an explicit canonical palette surface and matching text/caption tokens, preserves measured image callbacks and finite responsive columns, and excludes owner controls from public mode. Captions use the existing typography body-size scale; standalone's former hardcoded 13-point caption now uses that same scale.

Marketplace previously sliced at 12 images while the existing native public projection permits 15 approved HTTPS images. A small pure public-gallery projection is now shared byte-for-byte by client and guest/native source. Marketplace public rendering uses the same approved rows/cap/descriptions as the existing native contract. The native projection's external fields and 15-image schema are unchanged. Private owner review may still display draft rows, but unapproved images do not gain selection/edit authority. No media approval or wire-level authorisation is conferred by UI filtering.

Twenty curated palette foreground/surface combinations meet the tested 4.5:1 caption contrast calculation. This covers explicit solid backgrounds, not photos, opacity/overlays, physical rendering or accessibility certification.

## Recoverable GitHub checkpoints

| Commit | Change |
| --- | --- |
| `b961c8645233e5c96977205e28e411766c619d0a` | Approved selected image wording and reversible movement |
| `757b5da071c7632e241269077fcff5900f9696f4` | Selection-scoped mobile website controls and prepare-before-Apply examples |
| `71a3dea8c2e204fb8c721146ab45179eadd95ea7` | Original selected instruction/voice adapters |
| `a93eba52811b32c1361505e1c3881a90c2696240` | Gallery extraction, palette captions and public projection parity |
| `b1720de989c5052139d6c098081b0d21c53b0a54` | Safe unknown-key/unsupported-request handling |
| `f36022ae165e87eaebe901b11e25bd3072d1983c` | Reject serif-font requests rather than misrepresent an existing typography-scale preset |

Each update protected the expected head without force and verified exact local/remote tree equality. Local commit metadata differs from connector-created GitHub commits; checks JSON records the mapping and source tree. Existing PR dependencies remain draft/unmerged.

## Verification

Final reviewed offline selection: **95 passed, zero failed/blocked/unexecuted**. This includes all prior Phase 9 checks plus four new functional suites and three relevant contextual/voice regressions. Nineteen changed JS/JSX/MJS files parse using pinned tools; four environment-policy unit tests pass. Shared public-gallery and existing client/Edge operation parity are checked. Original standalone renderer, marketplace renderer/component paths, exact inverses, JSON reload, locks, stale source/callbacks, private/public controls, receipt/version and owner-scope safeguards are exercised at documented inert boundaries.

An inherited voice/order script had two obsolete source-string assertions: an old literal preview JSX tag and direct mutation-call spelling. They already failed against the starting source. Replacements execute the actual original comparison/renderer and current move-controller adapter, including stale revision and invalid receipt rejection. No functional assertion was disabled to obtain green tests.

No full Expo install/export, Deno semantic check, browser screenshots, real voice, physical-device gesture, OS restart, hosted JWT/RLS/provider or production-readiness proof. Browser preparation/workflow proposal from Phase 9 stays unexecuted/inactive; Chromium security was not weakened or retried. The older successful database rehearsal is evidence only for its earlier exact source and scope.

## Architecture, release limits and next work

See ARCHITECTURE_HEALTH_MISSION15_PHASE10_2026_10_18.md for the deeper review. The source census finds 1,099 files, 2,153 static relative edges and zero detected cycles, with stated dynamic/runtime limitations. miniApps.js decreases 281,708 → 279,797 bytes; AppController (703,942) and main mini-app Edge entry (183,295) remain unchanged. New focused components/adapters reuse existing engines rather than adding controllers.

Any separately approved guest-function rollout must include the new sibling `publicAppGallery.mjs` helper; client builds must include their matching canonical helper. Existing projection schema/semantics stay compatible. No schema migration or new server operation is introduced. No rollout is authorized/performed. Other inherited marketplace/native projection differences still merit targeted acceptance; this change certifies only tested gallery parity, not all data boundaries.

No merges, production/staging deployment, hosted mutation/migration, customer messages, app/site publication, paid build/service, credential or billing change. Additional spending remains £0. No workflow execution was requested or dispatched.

Mission 15 remains open. Next workstream: further finite selected text/colour/component contracts through original App Studio, simpler remaining owner controls, and real browser/iPad/native acceptance in an explicitly approved compatible sandbox-enabled runner. Per-element App typography, arbitrary RGB/fonts, native dragging, web inline contenteditable and drag-autoscroll are not claimed complete.
