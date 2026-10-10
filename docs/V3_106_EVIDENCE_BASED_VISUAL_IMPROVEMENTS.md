# V3.106 — Evidence-based private website design improvements

## Why this sweep
The private before/after reviewer could report that the candidate became worse but still return the `candidate-ready` status. That is not acceptable for a designer who should examine her own work.

## Implemented on the V3.106 development branch
- Require actual numeric, independently collected browser layout measurements for **both** mobile and desktop before starting any optional paid critique. Missing data fail closed without a vision request.
- Recheck an owner-approved candidate with a **fresh** screenshot and complete new measurements on both viewports.
- Reject a candidate that introduces **any new measured layout failure**, even when the number of problems stays equal; do not hand that candidate back as a ready improvement.
- Distinguish `candidate-ready` with a measured improvement from `candidate-ready` with no measured regression; no claim that subjective design quality improved without evidence.
- Protect every non-derived draft field, including customer contact details, tenant IDs and owner IDs, against unexpected changes by the candidate builder. Only generated markup and legitimate derived design metadata may vary.
- Enforce approved-photo provenance **again at application time**, even if a malformed or forged report reached a local client. Do not count identical theme tokens as an edit.
- Keep the deployed Supabase critic and private worker contract in exact agreement, with new free Node regression checks added to the production GitHub workflow.
- Update app/source version markers to V3.106. No new paid provider calls, signed iPhone build, database migration, Cloudflare deployment or website publication were performed by this sweep.

## Exact boundary
The genuinely hosted screenshot review integration remains disabled pending voluntary provider activation, permitted spend, customer opt-in and an end-to-end test. V3.106 improves the existing **reusable private visual-review engine** and its safety gates; it does not claim that a full two-pass AI renderer/automatic customer-site redesign is live. The customer-facing approval button currently applies allowed design tokens to a new **private draft**; it does not invoke this entire offline review cycle automatically. Future integration must preserve these stricter gates.

## Next steps
1. Expand visual QA beyond overflow/navigation/heading to contrast, tap sizes, legibility and keyboard/accessibility checks, with real browser-derived metrics rather than invented AI signals.
2. Connect private candidate screenshot rechecks into the authenticated owner experience before suggesting a revised design is better.
3. Add an opt-in, privacy-safe outcome log for approved/rejected suggestions, per-tenant separation and no unapproved cross-business model training.
4. Once pricing/limits are confirmed by the founder, consider a single funded test of the trusted renderer with the already deployed Supabase endpoint. Do not silently enable or charge.
