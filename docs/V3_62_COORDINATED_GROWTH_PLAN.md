# V3.62 — Coordinated Business Growth Planner

## Scope

A confirmed business service can affect several customer-facing surfaces. V3.62 adds a deterministic, local preview of relevant work. The owner chooses an **already confirmed** service from the shared business profile, and BUSY outlines separate website, customer Business App and social-media changes.

### Implemented
- `src/domain/coordinatedGrowthPlan.mjs`: pure, multi-vertical planning from approved profile data only, with service deduplication and 30-service bound.
- Three review items per service: website content, customer enquiry workflow and social announcement. No invented pricing, offers, new launch dates or booking capabilities.
- Missing confirmed trading name, service area or customer contact are surfaced as blockers for the relevant channels.
- Cross-channel blocker ranking: prioritises confirming a fact that unlocks multiple areas.
- Manual selection and plan preview in the existing Business Creation screen; flags any existing website/app **draft** name mismatches using the already-present Business Creation Intelligence alignment checks.
- `scripts/check-coordinated-growth.mjs` and workflow: reject unconfirmed/draft services, deduplicate, test dependencies, tenant-independent invocation, stable output, no publication or auto-application.

### Safety and scalability
- No additional API calls, background jobs, data writes or model token usage for the planning preview.
- No multi-tenant cache or shared global mutable business data.
- The plan is advisory, **not** a record of what has already been published or synced.
- The plan does not create posts, edit customer apps or alter websites; the existing independent owner approval and publication pathways remain authoritative.
- The preview does not infer real customer demand, conversion uplift, published-site state, or whether a service was newly added.

### Acceptance before release
- [x] Node unit tests and inherited conversation regression checks (confirm on final commit).
- [x] Production foundation checks (confirm on final commit).
- [ ] Open the latest development preview and inspect the service selector on a signed-in device.
- [ ] Confirm pending/unapproved services never appear as selectable growth subjects.
- [ ] Confirm all channels show blockers for missing approved information.
- [ ] Confirm voice-based service descriptions still require the existing owner-approval workflow.
- [ ] Verify behaviour for a business without services and one with many services.
- [ ] Check that the independent publishing permissions still prevent unapproved external changes.
- [ ] Complete V3.60 and V3.61 device acceptance gates before considering a production merge.

## Later execution phase

A future audited job dispatcher can consume a separately approved plan with per-tenant durable idempotency keys, real provider status, retries and rate limits. V3.62 deliberately does **not** claim to do this yet.
