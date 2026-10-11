# Busy Does It V3.144 — Coordinated website intelligence sweep

## Permanent development rhythm
From V3.144 onwards prefer substantial, coordinated sweeps spanning several compatible improvements with shared regression checks, rather than a single tiny change per version. Keep the website builder first until its experience is excellent; build up the underlying Business Brain, private evaluation/feedback and infrastructure at the same time. Avoid unrelated risky migrations and never infer that a release has been tested just because source/CI passed.

## Improvements delivered
**1. Measured design adviser.** A previously trusted private WebView layout report can prompt a small named alternative. The V3.144 adviser only suggests a compact main heading when heading clipping was measured, or one-column service rows when mobile horizontal overflow was measured. It doesn't invent facts or claim to have visually perceived screenshots. Unsupported, irrelevant or previously owner-rejected suggestions are suppressed.

**2. Safe private preview → recheck → optional Keep.** The owner clicks a suggestion to create a separate candidate *in memory* using the existing owner-approved finite layout operation. The original draft is untouched. BUSY renders the candidate at the same page/viewport, runs the existing DOM inspector again, and compares warnings and measured counters. New problems or worsening metrics disable Keep. If there are no measured regressions, the owner can explicitly keep the change in the private draft with existing Undo/Redo, or return to the original. An unchanged warning count is NEVER labelled a measured improvement. Even a clean same-width check doesn't replace checking other device sizes or the signed hosted preview.

**3. Owner feedback foundation.** Accepting or rejecting a candidate captures explicit feedback within this *single* website draft only; data is capped at 20 simple feedback records, revalidated by draft/page, and preserved through a factual Brand Brain website refresh. Owner-disliked candidates are no longer promoted again for that draft. These records are **not** a global cross-business dataset, are not publicly rendered as HTML, are not silently transmitted to an AI provider and do **not** retrain any model.

**4. Real screenshot evidence and offline AI adapter rehearsal.** V3.103 already had an opt-in screenshot vision adapter and V3.104 a safe before/after candidate review. V3.144 connects them in `scripts/check-website-screenshot-loop-v3144.mjs` with genuinely rendered PNG captures of a fictional business at mobile/desktop sizes, stringent image validation, one **mocked** AI response (no external provider or credit charge), allowlisted design-only proposal handling, actual browser re-capture and rejection of an intentionally broken, overflowing candidate. This tests the **pipeline** but is NOT a production visual-AI service or proof that an actual AI judged the design. Authenticated screenshot collection, retention and metered provider requests need separate staging signoff.

## Source and boundaries
- `src/core/websiteMeasuredDesignCoach.mjs`: bounded suggestions, fair before/after comparison and owner-scoped feedback
- `src/screens/websiteBuilder.js`: simple optional Try / same-viewport audit / Keep or Return controls in the existing website preview
- `src/app/AppController.js`: explicit feedback persistence through current private draft, no remote writes
- `src/domain/websiteBuilder.js`: current-draft feedback survives business-fact refresh
- `scripts/check-website-measured-coach-v3144.mjs`: owner scope, no invented improvements, counter regressions, feedback limits and non-public UI boundary
- `scripts/check-website-screenshot-loop-v3144.mjs`: real offline screenshots + mocked paid-vision provider response + candidate re-capture and comparison
- `.github/workflows/website-coordinated-intelligence-v3144.yml`: broad earlier website regressions, browser tests and unsigned iOS/Android Expo exports
- Production CI retains the owner safety test.

## Honest limitations
The customer's phone isn't currently capturing or transmitting screenshots to a live AI model through this new feature. Customer-facing recommendations are based on finite DOM measurements rather than AI screenshot aesthetics. The real-image path is rehearsed only with fictional, offline website screenshots and an explicitly mocked model. This source sweep does not deploy anything to Supabase, publish a website, send customer information to a model, use provider credits, apply migrations or sign a real device build. Real iPhone/Android acceptance, screenshot privacy and billing, tenant verification, an AI critique QA dataset and designer-quality aesthetic evaluation remain future steps.
