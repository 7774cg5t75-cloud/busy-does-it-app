# Busy Does It V3.145 — Coordinated Visual Quality, Safe Refinements and Business Preferences

## Scope (website-builder first)

V3.145 develops four complementary areas in one sweep, with common regressions rather than independent, disconnected changes. A small/simple owner experience stays the priority.

### 1. Better real-browser design evaluation
The private preview's opt-in, app-owned layout inspector now checks the computed colour contrast of visible text with safely measurable solid backgrounds and detects visibly small paragraph text. It also counts text where backgrounds such as photographs or gradients prevent a reliable contrast judgement. Findings explicitly distinguish **unassessed contrast** from good contrast. Metrics use standard relative luminance with 4.5:1 for normal text / 3:1 for large or sufficiently bold text; this is diagnostic and is *not* a full WCAG/accessibility audit. Existing checks for overflow, clipped headings, missing photos, anchor links and target sizes remain.

### 2. Safer design refinement and recheck
The existing owner-invoked, bounded private candidate preview remains separate from the live draft. Comparison now rejects alternatives if they increase low-contrast text, unreadably small body copy, unassessed backgrounds or reduce measured text coverage — even if another warning improves. Measurement versions and viewport width must match. The owner must explicitly **Keep** a candidate after the recheck; it never publishes or modifies business facts. The Keep action records feedback in the **same draft-state update** as the selected layout operation, with a draft generation guard and normal Undo history. No asynchronous feedback race.

### 3. Clear original/alternative comparison
The existing page's candidate panel shows plain-language descriptions plus how many measured layout warnings the original and candidate have. Owners can toggle **See my original design / See proposed alternative** in the same private preview before choosing **Keep** or **Return to my original design**. An equal warning count never claims aesthetic improvement. All checks are at the selected width; owners still need to verify other phones/tablets and the exact immutable hosted preview before publishing.

### 4. Deeper but privacy-safe preferences
Like/dislike events are still tied to the exact private draft. The latest preferences are now also evaluated by **page**, avoiding inappropriate borrowing across unrelated pages. When several candidate styles match independently detected problems, a previously liked suggestion is offered first, while an owner-rejected suggestion remains suppressed for that page. No unobserved benefit is claimed, and no feedback from another business is read. The private preference events remain excluded from hosted website preparation/domain payloads and are not AI model training.

## CI verification
- `scripts/check-website-deeper-review-v3145.mjs` asserts report validity, contrast regression protection, unchanged warnings vs actual improvements, consistent measurement coverage, preferred alternatives, owner page scope and atomic Keep wiring.
- `scripts/check-website-contrast-browser-v3145.mjs` uses real Playwright Chromium layout/computed CSS at 390/768/1440px, including intentionally low-contrast/small-font and complex-gradient fixtures. The alternative must not be accepted if it worsens readability.
- Dedicated `.github/workflows/website-visual-quality-v3145.yml` runs the new checks alongside historic private website, voice, mobile/tap, standalone ZIP and screenshot-review regressions, plus unsigned Expo iOS and Android JS exports.
- The standard production foundation workflow keeps the V3.145 fast regression.

## Boundaries
The screenshot-vision model integration added earlier is **still an offline/test adapter with a mocked response**, not a live screenshot critic. New customer-facing checks are actual DOM/CSS measurements, not claim of general AI aesthetic understanding or production screenshot uploads. No OpenAI/API call, signed-device build, staged/live database migration, cloud deploy, public website publication or user data transfer is performed here. Staging needs real screenshot/capture privacy, owner authentication, explicit credit reservation, model evaluation dataset, and human approval before any paid vision feature can ship.
