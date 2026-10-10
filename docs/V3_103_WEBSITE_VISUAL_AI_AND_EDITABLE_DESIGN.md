# V3.103 — Customer-controlled websites and screenshot-review integration foundation

## Product vision
BUSY should act as a professional website designer, producing a strong individual first result then allowing a business owner to refine **every meaningful visible part**, either by voice/chat or controls. This requires a flexible website document model, editing history, approved photo management, real desktop/mobile visual review and explicit owner approval; a fixed template with a handful of commands cannot satisfy the vision.

## Implemented in V3.103
- **Custom owner-written sections.** Safe instructions such as "add section called Our approach with text ...", "change text of Our approach section to ...", "move Our approach before Services", or "remove Our approach section" now update the private draft and regenerated page structure. The owner supplies literal copy; BUSY does not fabricate statements.
- **Approved gallery photo choice.** "use gallery photo 1 as hero" selects from the current business's gallery, but only when that image has a valid saved storage path and has not been explicitly disapproved. No internet stock photo lookup or arbitrary external URL injection.
- **Undo and redo.** An eight-step bounded history supports restoring private website edits and reapplying a change. New edits clear the redo path. Rebuilding from Brand Brain also preserves a previous draft where available. History is in-app state and is not a substitute for cloud versioning.
- **Private, unchanged go-live gate.** Website editing, undo and photo selection never publish a website. A new hosted version and exact hosted preview must still be reviewed and explicitly approved before publication.
- **Real screenshot-AI adapter.** A Node 22 server-side module accepts two locally generated and validated PNG screenshots (iPhone-style and desktop) and can make exactly **one** OpenAI Responses API vision request using an explicitly configured private server key and model.
- **Safe returned feedback.** The module translates the successful provider result into the existing design-only proposals contract. It can propose up to three permitted visual-theme changes, rejects changes to business wording, customer information, media, or publishing, and **does not apply** changes without owner approval.
- **Fail closed and metered shape.** Screenshot size/dimensions, one call, token output ceiling, timeout and no automatic retry are enforced. Test mocks confirm disabled mode makes zero provider calls.
- **Browser QA pipeline.** A GitHub Actions workflow compiles the native JavaScript and renders real screenshots of **fictional** sample websites without an Expo cloud build. Only an explicit manual workflow run with two consent flags, an enabled organisation variable and a configured secret may call the provider; default builds do not.

## What still needs engineering before we can claim the full feature is live
- The customer app does **not yet** invoke the vision model directly, upload signed customer screenshots, display side-by-side model-reviewed before/after visuals, or run a loop of automatic edits and another actual visual AI pass.
- Authenticated, tenant-isolated screenshot capture is required. The trusted render service must accept immutable private deployment identifiers, not arbitrary Internet URLs, enforce the same business membership as publishing and keep the screenshot bucket private.
- Before paying subscribers can invoke it, implement **atomic usage-credit reservations, monthly spend caps, usage logging and customer opt-in**. The current one-call limit is a safety boundary, **not** a guaranteed dollar spending cap.
- Implement owner-reviewed proposals, rebuild candidate, capture fresh screenshots and re-review the improved design. Limit it to an affordable, clear number of iterations, with undo and release comparison.
- Add comprehensive media selection, image cropping, flexible sections, per-element spacing/alignment, fonts, contact forms, navigation and multiple-page content management. The editor is more flexible in V3.103 but **not literally unrestricted** yet; arbitrary custom CSS/HTML or unreviewed scripts would create security and support risks.
- The Supabase worker remains **undeployed** from this branch; the signed iPhone build is **not submitted**. Source changes are not evidence that customers can already use V3.103 in a live hosted website.

## QA acceptance
1. Run all repository tests and new owner-edit and fake-provider vision tests (zero paid provider use).
2. Bundle iOS JavaScript in GitHub CI, avoiding Expo EAS build credits.
3. Verify browser screenshots with a fictional low-information business.
4. Only after separate consent and backend metering, invoke one true screenshot AI critique; assert response provenance, no customer claims, and provider usage logs.
5. Render owner-approved changes as **new private draft**, visually compare before/after, require explicit public approval.
6. Never confuse the original deterministic designReview score with verified AI screenshot critique.
