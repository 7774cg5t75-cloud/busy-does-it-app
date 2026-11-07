# Phase 20 architecture health

Read-only census: 1,162 source files, 149,484 physical lines, 2,354 static relative edges, zero detected cycles. Dynamic/aliased resolution and runtime behaviour are outside this graph.

- AppController 17,850 lines / 703,942 bytes; miniApps 5,331 lines / 283,629 bytes; main app Edge entry 4,606 lines / 183,564 bytes. All unchanged in this phase.
- Source-bound catalogue selection, filters, revision/option transitions and projections are isolated in a 31-line pure helper. Existing 51-line shared component owns rendering and original interest preparation; no second request engine/store. Same-component guarded state reset permanently forgets an old scope without an effect-delay frame.
- Public browsing `contextKey` is a UI scope discriminator, never authorisation. Business/kind derive from the actual feed. A stale transition source is rejected. Original server identity, membership, source/version and receipts remain mandatory.
- Functional requirement updates merge against queued state, preserving typed customer fields. Canonical/native policy copies match; shortcuts cannot overwrite a nonempty own topic. Original in-flight/unknown outcome guards remain.
- Original candidate and atomic editing contracts remain bounded. New service guide uses existing tokens and owner feedback/order checks. Wording preservation rejects field/new-content operations; no unsupported CSS or generated executable actions.
- New catalogue helper and topic component are explicitly packaged for standalone. Future rollout must coordinate worker/client/shared bundles and regenerated exports; no rollout occurred.

Remaining risks: inherited giant controllers still need incremental feature-led extraction; callback/input batching deserves later real React Native acceptance; parent account/session boundaries must supply verified scope where relevant, never treat arbitrary context strings as permission. Service asset identity, durable personal tenancy and restricted distributed Explore remain future trusted contracts. No acceptance, security certification, schema or deployment claim.
