# Busy Does It V3.239 — Private Responsive Design Review and Shared App/Website Clarity

**Baseline:** V3.238 verified branch and Snack preview source head 9fa34ce3efad1c7466ff0f6f3202b559f047def7. This is an owner-controlled source/UI improvement, not evidence of real hosted staging customer operation.

## The user-visible weakness
V3.238 produced real Chromium screenshots for first-party fictional websites in CI. However the actual private Website Preview still threw away a candidate whenever the owner switched from phone to tablet or desktop. Only a one-width comparison was visible. CI's fictional screenshots cannot be reused as proof of a customer's own website.

## Delivered
1. The actual, existing \`WebsitePreview\` keeps one candidate across phone/tablet/desktop switching while resetting only obsolete single-width measurements. The owner can explicitly request inspection of the **original** and **same candidate** at each size.
2. Pure reusable \`privateWebsiteCandidateWidthV3239.mjs\` scopes temporary reports by the actual business ID, website ID, generation, enabled page, candidate ID, intended viewport and real WebView viewport. It rejects stale drafts, cross-business reports, mismatched zoom widths, unsupported issue metrics and unexpected modes. It stores bounded warning IDs/counts only.
3. Each matching original/candidate pair reuses the existing V3.144 comparison and, at three widths, invokes the original V3.237 all-width evidence policy. A regression captured on any reviewed size blocks privately keeping that candidate. A valid single-width review still permits the existing owner-approved, undoable private edit (not public publishing), with explicit limits.
4. The shared Website/App requirements disclosure now shows what real device or customer-task checks remain. It makes no native screenshot or customer booking success claims.
5. CI inherits actual fictional Playwright capture, zero paid provider calls, source/production regressions and two disposable PostgreSQL suites. No new SQL migration, hosted staging installation, production publishing, charge or customer message.

## Critical truth boundaries
- Native WebView DOM reports can be real local observations without being **authenticated screenshots**. A tablet/desktop viewport simulated inside a phone is not a physical tablet/desktop test.
- This does not add a production screenshot service. V3.238's fictional CI screenshots remain a separate developmental regression fixture.
- Source-only tests are not customer journey verification. The private candidate is not a real, proven working booking/payment or enquiry feature.
- Explicit owner approval and Undo remain on private edits; public publish/provider billing require separate permissions and proof.

**Recommended V3.240:** measured UI/evidence health review, one narrowly scoped App Builder native device preview readiness contract, and authorised staging acceptance only with explicit approval. Continue avoiding duplicate builders and expensive manual test repetition.
