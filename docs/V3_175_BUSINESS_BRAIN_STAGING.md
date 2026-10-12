# Busy Does It — V3.175 Business Brain & Staging Integration Foundations

**Branch:** `v3.175` from `v3.174`. This is a development sweep, not a production release.

## Delivered in source control

### 1. Safer, structured handoff to isolated staging

`src/core/stagingRunnerHandoff.mjs` turns the V3.174 six-route, actually executed **offline state-machine fixture** checks into a bounded handoff specifying the proposed booking/enquiry route, offline prerequisites and separate backend evidence requirements.

- The handoff requires an exact private business ID, positive draft revision, safe test label, **isolated staging** and explicit owner preparation intent. Production, missing permission and malformed requests are rejected.
- No network transport is connected. Even a client-supplied claim that a trusted runner exists is **not** server-authenticated. A true staging runner would still need server-side identity, permissions, tenant isolation, a production-endpoint denylist, side-effect controls, test identities, idempotency and authoritative delivery checks.
- A second function checks receipt-shaped metadata for exact business, revision, run label, channel, request kind and proof step, rejecting duplicates, sensitive payloads, stale data and cross-tenant claims. It strips private data. **Even a perfectly shaped set of receipts remains unverified** without backend authentication and logs; it cannot authorise a booking or a release.

### 2. Business Brain owner-review work queue

`src/core/businessBrainWorkQueue.mjs` extends V3.174's three-at-a-time improvement planner into a revision-bound work queue for the Business Brain.

- Each item has a finite title, reason, evidence label, next step and explicit *not executed* status.
- A bounded set of explicit, current-business owner decisions can suppress rejected/postponed items. An approved item means **owner agreed to prepare**, not that changes were saved, sent or published.
- Owner decisions are matched to **business, customer goal, draft revisions, action ID and surface**. Cross-business or stale feedback is ignored or rejected.
- A separate decision preview cannot persist approval, edit a website or app, send messages, charge a provider or publish.
- **Important:** This sweep creates the pure decision policy and visible current-work queue, not an owner decision persistence service. Remembering feedback across sessions still needs a separately authorised, scoped backend write/read integration.

### 3. Both builders connected without added Home clutter

- The existing optional customer-goal section in Business App Studio displays the Business Brain queue for the current private app revision and a one-tap **Prepare a staging handoff (no live tests)** action. That button only creates a local planning object; it does not call a server.
- The Website Builder's optional customer-goal section displays its current Business Brain preparation and explains that the owner must use the private editor.
- Original-versus-proposed comparisons and Undo remain in the existing editors. No generated prices, invented facts or unsupported customer outcomes are inserted.

### 4. Regression and export workflow

- `scripts/check-business-brain-staging-v3175.mjs` covers malformed environments, no owner intent, missing request modules, six-route handoff, forged and mixed-tenant receipts, owner decisions and their exact scope, approval not execution, both builder integrations and inherited CI references.
- `.github/workflows/business-brain-staging-v3175.yml` retains historical regression suites, native/Edge source syntax checks and Busy plus independent standalone Expo iOS/Android exports.

## Limitations and required checks

These additions have **not** dispatched a staging runner, submitted a real request, confirmed a diary booking, contacted a customer, published a website/app, consumed AI credits or spent money.

Before calling the feature production-ready:
1. Verify an actual green GitHub Actions V3.175 workflow, including all historical checks, native syntax and all four exports.
2. Exercise the two optional builder screens and approval boundaries on real iPhone, iPad and Android.
3. Build or connect a server-enforced isolated staging runner *only with separate owner approval* and its own trusted authentication, tenant checks and endpoint allowlisting. Run real isolated test requests through marketplace, standalone and guest web.
4. Verify receipts using trusted server logs/signatures, separate customer delivery, owner notifications, guest receipt limits and actual diary confirmation.
5. If owners want remembered work-queue decisions, implement tenant-scoped, consented decision persistence and prove denial/revision boundaries before enabling it.
6. Recheck provider usage, credits, privacy, business controls and all release gates before distribution.

## Next suggested V3.176

Prioritise genuine staging infrastructure/authentication and an owner-approved, persistent Business Brain decision history over additional planning-only layers. Expand real-device and outcome-based evidence. Keep the customer experience simple and the owner in final control.
