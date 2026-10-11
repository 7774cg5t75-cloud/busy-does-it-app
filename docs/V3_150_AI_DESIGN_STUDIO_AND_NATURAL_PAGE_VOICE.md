# V3.150 — AI-assisted design studio and natural-language website editing

## Development implementation
**One website, multiple improvements in this sweep:**

1. The page editor can record an entire-page request using the existing
   manual-start/stop, five-minute, nine-MB, twelve-per-UTC-day recording controls.
   The server returns a transcript only: no Operator command/action.
   The owner reviews the words before previewing any safe change.

2. A distinct, optional LLM **interpretation** mode can rewrite natural
   spoken or typed requests into canonical section-specific design instructions.
   It is gated by `BUSY_WEBSITE_PAGE_INTENT_ENABLED=true`,
   `BUSY_WEBSITE_PAGE_INTENT_MODEL`, authenticated owner/admin membership,
   explicit user approval, and the same atomic daily usage allowance as voice.
   Only short section identifiers/titles and requested words are sent.
   The client RE-parses the proposed clauses against the exact current draft,
   page and revision. Unsupported/fabricated actions or ambiguous requests fail
   without changing anything. The cost is plainly disclosed before the call.

3. The existing screenshot reviewer already has authenticated ownership, a
   trusted private-hosted renderer, opt-in, model/key flags and per-tenant usage.
   V3.150 adds a **private design studio** that stages 1–3 successive safe design
   variations from an authenticated REAL screenshot-based AI critique. The
   studio uses only allowed finite theme tokens, preserves factual sections and
   business information, and renders before/after comparisons for mobile and
   desktop. The owner can discard all, apply all suggestions or explicitly
   choose a subset. Saving creates a NEW undoable private draft; existing
   hosting/publishing approval remains entirely separate.

4. Verification covers malicious/stale voice and AI responses, cross-tenant
   and old deployment rejection, non-content/non-photo mutation, the exact
   consent and quota route, safe HTML and independent responsive browser
   screenshots at phone and desktop widths.

## Important remaining gaps before calling Busy a fully autonomous designer
The first screenshots can be analysed by real AI only when the trusted
screenshot/vision provider is **configured and opted in**. The subsequent
private candidate variations have NOT yet been re-screenshoted and independently
re-scored by the model. The studio currently automates candidate creation and
presents alternatives; it does NOT guarantee improved aesthetics or run
unlimited model loops. Multi-turn free-form conversation and speech-to-speech
clarification are NOT implemented; the new bounded LLM interpretation handles
one request per explicitly authorized, metered call.

For the eventual autonomous design loop: authenticate and render each isolated
candidate, remeasure both viewports, run a metered AI critique against each,
limit passes and costs, reject regressions and confidently preserve customer
facts, only then present a ranked private alternative. Live staging,
provider readiness, real devices, publication, privacy and cost safeguards
must all be proven separately. No service enabled or deployed by this commit.

## Checks and deployment
Dedicated V3.150 tests plus earlier website voice, rendering, safety and
production checks run in GitHub Actions. Expo Snack preview is built
automatically; unsigned JS exports are NOT signed device builds.
