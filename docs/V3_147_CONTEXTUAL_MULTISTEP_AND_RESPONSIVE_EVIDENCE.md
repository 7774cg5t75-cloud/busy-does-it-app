# Busy Does It V3.147 — Faster Contextual Editing and Safer Multi-Step Changes

## Four coordinated website-builder improvements

### 1. Owner-controlled multi-step spoken or typed instructions
The selected website element remains the only reference. The customer can say or type a bounded request such as **“Make this heading bigger and centre this section”** or **“Make this heading bigger; give this section more space”**. The parser `src/core/websiteContextPlan.mjs` supports at most **three** finite grammar instructions in one request (400 characters max), preserves literal wording like “Fish and Chips”, and rejects guesses, repeated writes to the same setting, unsupported operations and publishing instructions.

The focused `websiteTapEditor` now shows the exact parsed steps before the user presses **Apply N changes together**. The existing V3.141 transcription service is still transcription-only: it never directly executes commands, and users must deliberately review the words and press Apply. The V3.142 manual Stop and separate Send approval still govern the microphone. Nothing is sent to another AI provider for local instruction parsing.

In `src/app/AppController.js`, the app **re-parses the original text against the current selected website revision when Apply is pressed**, validates the draft identity and prepares all changes on a private immutable candidate. If any step fails, **nothing changes**. On success all edits share **one Undo snapshot**; the website still requires separate hosted-preview approval before publishing. This improves ease of use without trading away safety.

### 2. Subtle toolbar and accessibility polish
The universal toolbar from V3.146 continues to work on **heading, picture, body text, button and whole-section backgrounds**. Pressing Enter/Space on a keyboard-editable element now focuses the primary toolbar action rather than making people tab through the entire webpage. The primary action, microphone and More have labels naming the selected element. Escape dismisses the toolbar and returns focus to that element. Tap elsewhere to hide it.

Browser tests exercise this at 320px, 375px, 390px and 768px with real touch and keyboard input. A nested heading still selects the heading; tapping an empty section background selects its enclosing section. Minimum finger-friendly target sizes remain part of V3.146 regressions. This remains an opt-in private-only editor; ordinary public/ZIP and signed hosted HTML do not include editor scripts.

### 3. More honest visual-review readiness
`src/core/websiteViewportEvidence.mjs` records whether the **current draft page and generation** has been inspected at an actual phone (≤480px), tablet (481–959px), and/or wide (≥960px) viewport. The customer sees plainly which widths were checked and what still needs checking.

Checking a phone twice cannot be mistaken for checking desktop. Evidence from another tenant, another page, or an older draft is not reused; changing the website resets the state. Even checks with zero common warnings do not imply the hosted website or real-device accessibility is verified, and the existing required hosted-preview publishing gate is unchanged. The existing DOM CSS measurements for contrast, typography and overflow, plus V3.144 mocked screenshot review, are retained.

### 4. Reuse and continuous quality
The selected-instruction planner reuses V3.140's exact context grammar and the existing structured and layout domain operations—**no second editor engine**, public AI dependency, data sharing system or arbitrary model-generated operation list. One new focused pure module handles parsing and transaction preparation; the current AppController owns authorization, draft revision and Undo.

`scripts/check-website-context-plan-v3147.mjs` tests real website-model edits and atomic rollback if step two fails, stale selection, tenant ownership boundary and no accidental publish. `scripts/check-website-viewport-coverage-v3147.mjs` verifies review evidence boundaries. Playwright tests exercise small-screen touch and keyboard controls with all older website editor, voice, domain, image and visual-quality tests. The production foundation CI retains the new small safety tests on future versions. Dedicated CI also exports unsigned iOS and Android JavaScript.

## Pre-release caveats
Source and automated browser/JS export success do **not** establish real iPhone microphone, signed native app or customer usability acceptance. Staging still needs authenticated recording and usage-meter migrations, real device tests, provider spend controls and a hosted publishing dry-run. The visual checker is browser-derived, **not** an active general-purpose AI screenshot evaluator or aesthetic quality guarantee. No app/domain/site is deployed or published and no paid AI credits are consumed by this source-development sweep.
