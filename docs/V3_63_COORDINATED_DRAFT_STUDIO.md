# V3.63 — Coordinated Growth Draft Studio

**Status:** Development-only on `v3.63`, based on `v3.62`. Not released or merged to `main`.

## Owner journey

1. Open **Build my business with BUSY** and select a service from the owner-confirmed Shared Business Profile.
2. Tap **Prepare three editable drafts**. The private studio derives simple factual wording for Website, Business App and Social Media. Blocked targets show missing approved facts rather than fabricated copy.
3. Independently edit each text field (800-character limit). Source facts are from the approved profile. Owner edits are the owner's responsibility to review.
4. Explicitly hand off each draft:
   - **Website**: when a private website draft exists, update only the named approved service's copy, regenerate its private HTML preview and leave live deployments untouched.
   - **Business App**: place the instruction in the existing Business App planning brief and open the builder. No module or public app version is created merely by handoff.
   - **Social**: open Social Media Creator with the text in its *brief* field, not a saved, scheduled or published post.
5. Independently review the relevant builder and use its existing explicit publication approval process (not performed by this studio).

## Safety and limitations

- Plan and drafted copy are fully local/pure. No new APIs, cron tasks, OpenAI generation, published actions, queued jobs, cloud writes, or service-provider calls.
- Requires a signed-in owner before private draft preparation.
- Source key includes owner and business identifiers plus current approved facts and target blockers. Switching accounts, businesses, selected services, or relevant approved facts hides the old editable pack until regeneration.
- Pending/draft/unapproved services are never candidate focus services. Missing contact details prevent website and Business App drafts. Social copy does not invent prices, new launch dates, promotions, bookings, or service claims.
- Editing here is temporary while this screen remains mounted. **There is no cross-device studio persistence**, and handoff is not an audit trail or publication confirmation.
- No live website/social/Business App state is inferred; users must still verify a separate editor's final content.
- The Website Builder's private-draft update still depends on the pre-existing local website draft and its publication gate. If no draft exists, the user opens the Website Builder first.
- The Business App planner still runs its own validation and capability constraints before any app changes.
- Stale checks only protect the studio handoff; provider-side release checks remain independent.
- Supports any business vertical with an approved service; no industry-specific hardcoded output.

## Validation

- `node scripts/check-growth-drafts.mjs`: approved-only draft creation, blocked targets, independent editing, bounded text, tenant/account staleness, UI wiring and private website handoff integration.
- `node scripts/check-coordinated-growth.mjs`: inherited V3.62 planning contract.
- `node scripts/check-conversation-understanding.mjs`: inherited conversation boundaries.
- `node scripts/check-production.mjs`: production foundation regression tests.
- GitHub workflow: `.github/workflows/check-growth-drafts.yml` on this development branch.

## Must verify on real signed-in iPhone/iPad before production merge

- [ ] Select an approved service, edit text, and confirm a no-op for unapproved/pending services.
- [ ] Missing details must block the corresponding draft, without exposure of another business's copy.
- [ ] Change approved service description or switch business/account; older draft pack must be hidden and rejected.
- [ ] Transfer website copy to *private* website preview; verify generated HTML and that live site is unchanged.
- [ ] Transfer Business App instruction; ensure no module is enabled or app published until the usual review/approval.
- [ ] Transfer social wording; ensure no scheduled post, AI publish action or live post occurs without the existing independent approval.
- [ ] Check narrow iPhone layout, long edits, keyboard handling, navigation back and re-entry, offline status, and Expo development build.
- [ ] Complete V3.60–V3.62 device acceptance gates and confirm current CI/preview checks.

## Next deliberate phase

Private, tenant-scoped, revision-safe studio persistence and explicit per-channel review acknowledgements can come later, followed by an audited dispatcher **only after** an appropriate per-provider integration, ownership check and idempotency design are verified. This sweep does not silently enact multi-channel publishing.
