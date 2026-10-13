# V3.211 — Reviewed Universal Website and App Integration

**Base:** V3.210. **Policy:** build-first source changes, automated regressions, no paid signed builds, no live migrations/deployments, no customer messages, payments or publication.

## Why it matters

A request to Busy should connect website and app capabilities instead of leaving the owner with two disconnected design proposals. V3.211 takes the first practical step: translating the already existing shared requirements plan into two separately owner-approved and reversible/private-edit paths. This is real private draft editing, not a claim of real customer workflows or checkout/booking integrations.

## Website: apply a reviewed composition

The website layout editor now accepts one new bounded action named apply-reviewed-composition. It uses the owner-reviewed existing section IDs from the universal requirements planner. Before applying any change, it validates:

- Current website ID and generation, an explicit business workspace, original observed section order, and a genuinely different exact permutation of enabled sections.
- Main hero remains first. Hidden, unknown, repeated or invented section IDs, injected operation fields, blank tenant context, stale revisions and repeated approvals fail closed.
- The customer explicitly sees an alternative private order and separately approves it. The shared UI recomputes the current plan immediately before applying.
- The operation uses the *existing* private website layout controller, rebuild and generation increment; the controller records the previous website in the established undo stack. Published and hosted immutable versions remain unchanged.

New planning safeguards refuse to promote empty or unapproved galleries, blank services, empty FAQs/reviews and missing contact details. The owner may still edit those sections through existing controls. This does not create novel components or transactional website capabilities.

## Business App: apply a reviewed navigation

The new universal app navigation module reuses supported Business App runtime screens, real business-scoped server feature catalogue, enabled navigation validation and coordinated app editor. It prioritises only explicitly requested, enabled modules when required service names, approved images or promotion terms exist. It leaves business identity first and never enables an absent screen.

The owner must separately review the proposed before/after order and approve. Approval recomputes the current business, website and app revisions, requested goals, enabled screens and exact navigation operations. Existing authenticated, optimistic-concurrency saveCoordinatedAppChanges and the server's apply_coordinated_edits route remain the only save boundary. Successful saving means one new **private app draft revision**, not real device acceptance or a live customer outcome.

No account, payment, real availability, confirmed appointment, delivery or custom executable code capability is fabricated.

## Interface and verification

The optional universal requirements panel is reused by both builders; it adds context-specific approval actions instead of another long setup screen. Editing the typed brief or switching business invalidates a previous review.

A new V3.211 offline regression script tests exact website ordering, revision/tenant and injection rejection, source/undo invariants, user-approved app navigation, real runtime prerequisites, disabled features, novel unsupported goals and two-builder controller wiring.

The new GitHub Actions workflow on V3.211 runs both V3.211 and V3.210 suites, inherited architecture/security/staging checks, source parsing and unsigned iOS/Android JS exports. These exports are not paid signed mobile builds. Passing focused checks does not establish full CI, real hosting, device behaviour or external provider delivery.

## Continuing the agreed development programme

Keep developing meaningful cross-builder capabilities before broad expensive hands-on tests: real reusable server-owned customer enquiries and booking flows, feature composition beyond navigation, visual comparisons across device sizes, website/app Brand DNA coordination and genuine outcome-based Business Brain intelligence. Continue inexpensive checks every sweep, periodic deep code-health reviews and explicit owner approval before any live action.

**North star: You tell Busy what needs doing. Busy does it — then independently verifies it.**
