# Busy Does It — Major Sweep and Code Architecture Review Policy

**Standing owner development instruction (12 October 2026).** Apply in future Busy Does It development sweeps, especially while completing the **App Builder first** and **Website Builder second**. This policy is intended to persist across ChatGPT sessions and future branches; include it by branching from the latest verified development branch.

## Mandatory two-master preflight (owner decision, 14 October 2026)

Before planning or beginning **any substantial sweep**, read both (1) the **latest saved Busy Does It product master** (the owner's versioned Word master, normally in ChatGPT Library or supplied by the owner) and (2) GitHub **`ARCHITECTURE.md`**, alongside the latest relevant source, prior sweep results and actual CI/staging evidence. Never rely on an outdated file copy or assume the two stay synced automatically. If the product master is inaccessible, disclose that limitation rather than claiming it was checked.

- **Product master defines desired outcomes:** every-business website/app creation, genuine business value, business-owner simplicity, ownership, tiers and costs, customer satisfaction, and reducing the founder's ongoing workload.
- **GitHub master defines technical truth:** current implemented functionality and proof level, reusable modules, schema, security/tenant controls, integrations, staged deployments, release blockers and technical quality.
- **Resolve conflicts consciously:** don't silently let technical convenience shrink the agreed product ambition, and don't claim a requested capability already works just because it is in the vision master.
- **Route every "save to the master" request:** product/experience/commercial decisions to the saved master; code/architecture/security/testing decisions to GitHub; lasting cross-cutting principles to both (concise cross-references). Version the saved copy, confirm commits, and never claim Library upload unless it actually succeeded.
- **Choose the fastest *responsible* route:** produce a short gap-and-dependencies review, prioritise genuine end-to-end customer outcomes and reuse of existing or safely integrated open-source components, and group complementary work into substantial sweeps. Preserve correctness, maintainability, privacy, security, accessibility, tenant isolation, honest provider evidence, reversibility and cost controls even if quality work takes longer. Avoid fragile speed-driven hacks **and** unnecessary overengineering.
- **Plan explicit verification:** state which outcomes can be proven by code tests, which need isolated staging, and which need separately approved paid external provider/device/publication tests. Check impact and regression risk, owner control/undo, and long-term maintenance before implementation.
- **After each substantial sweep:** compare delivered and still-missing outcomes with both masters, update the appropriate records, and identify the next highest-value dependency rather than allowing the roadmap to drift.

This preflight is a **required step**, not a suggestion. The owner prefers taking longer to implement the right long-term solution over shortcuts that cause maintenance debt or fail customers. See root `ARCHITECTURE.md`, section "Permanent policy — dual-master governance and outcome-first sweep planning".

## Six-area whole-app release objective — approved 19 October 2026 (Product Master V22.38)

The owner's agreed first-release customer-facing Home has one dominant typed/voice Ask Busy entry and six clear destinations: **Website Builder, App Builder, Content Creator, Get More Customers, Work & Customers, Get Paid**. Keep specialist features under the correct area; do not create a new Home tile for each provider/capability. They must be useful parts of **one connected assistant** using shared records, brand data, permissions, explicit approvals, genuine provider receipts and verified outcomes. This is a planned release definition, not evidence those features are presently available.

Use coordinated multi-area sweeps with **one named lead customer outcome and bounded related secondary changes**. First complete a practical builder feature checkpoint; then lead with **Content Creator + Home**, alongside **Get More Customers**, while incrementally developing Work & Customers and Get Paid through shared enquiry-to-payment journeys. Do not allow unlimited builder polishing to prevent development of the rest of the six-part product. Preserve all existing quality/safety criteria.

**Separate milestones:** *Complete Product* = all six core destinations meet stated first-release functional acceptance criteria and share coherent customer flows under repeatable source/integration checks; *Release Ready* = additionally verified in authenticated isolated staging and real supported devices/providers, including customer requests, publication and payment receipts, privacy/security, accessibility, credits/spend and recovery. Build-first can defer broad manual UAT but **cannot defer** basic regression/security checks or critical foundational integration verification. No paid/live staging/provider/production action is newly approved.

## Development priorities

1. Build both marketplace Business Apps and independently downloadable standalone apps as completely as practical in code before undertaking expensive comprehensive live/customer tests. App Builder receives the larger share of feature-development effort.
2. Complete the Website Builder, including individual designs, clear self-service editing and owner control, professional layouts and accessible, reliable, exportable sites.
3. Each major sweep should deliver several substantial, connected improvements where practical: real functional capabilities, richer but simple owner UX, shared Business Brain intelligence, safety and effective low-cost regression checks. Avoid adding more report-only frameworks when genuine functionality can be built.
4. Keep the owner experience simple and understandable; Busy should complete legitimate tasks reliably, with explicit approval for publishing, spending, irreversible customer data operations and store submissions.
5. Avoid paid external AI/model/voice/image generation, live paid tests, staging installation, deployment, customer communications, production changes, build signing and provider enrollment without **specific, separate owner approval**. Existing GitHub Actions checks may be run when they use the established no-paid-external-provider workflows; account for GitHub compute/usage limits.

## Per-sweep gates — ALWAYS

- Work from the latest verified branch; one coherent version and a clear changelog.
- Validate relevant tests, static/syntax checks, native/Edge contracts and appropriate unsigned exports in CI.
- Test private tenant isolation, permissions, schema boundaries, version freshness, customer-data protection, idempotency and owner approvals for any changed workflow.
- Fix regressions before declaring success; do not report an in-progress run as green.
- Report what was actually implemented and wired, what was tested synthetically/offline, and what remains unverified in hosted staging/physical devices.
- Avoid misleading proxies: new line count, passing static checks, and increasing intelligence inventories are **not** proof of quality or successful customer outcomes.
- Keep the user's expected additional spend at £0 unless they explicitly approve otherwise; avoid unnecessary redundant build/test matrix work.

## In-depth architecture audit: ~EVERY FIVE MAJOR SWEEPS

- **First intended review: V3.195**, then approximately **V3.200, V3.205, V3.210, ...** when the numbered versions correspond to completed substantial sweeps. If a version is a hotfix or a skipped number, count completed major sweeps rather than rigidly trusting numbers. Bring the audit forward if complexity, security regressions, major merge conflicts, build failures or duplicated systems require it.
- Keep normal feature development moving where safe, but allocate a meaningful part of the audit sweep to actually reviewing and **selectively simplifying** architecture.
- Inspect the source tree and tracked code size, file/function sizes, large mixed-purpose UI screens, high-coupling modules, ownership of client vs trusted server logic, circular dependencies, shared schema drift, duplicate business-domain rules and repetitive versions of identical helpers.
- Check domain boundaries across App Builder, Website Builder, standalone native runtime, marketplace, Business Brain, bookings/Work, auth/storage/Supabase Edge, Cloudflare and owner UI. Prefer clear bounded modules and one authoritative implementation per invariant.
- Assess interfaces, tests and maintainability: code comprehension, naming, cohesion, complexity, extensibility, error handling, observability, types/contracts, dependency hygiene, dead code and stale feature flags. Examine DB migrations, grants/RLS, tenant isolation and minimum safe deployment assumptions.
- Use evidence: list the top concrete maintainability risks with referenced files, impact/likelihood, and low-cost improvement plan. Record baseline before/after when refactoring and rerun existing tests and exports. Prefer real maintainability improvements over cosmetic moves or mass rewrites.
- Refactor small, logically related groups behind verified boundaries. Preserve existing UX, APIs, published content and safety behaviour; no speculative redesign of tested critical flows. Never silently remove features, change published state, or apply schema migrations.
- Produce a written **Architecture Health Report** in `docs/` at each full audit: findings, corrected issues, deferred issues, largest-file and coupling trends, CI evidence, known quality limitations, and next review target.
- A clean audit is NOT an assertion that the whole product is deployment-ready. Real authentication, staging, physical devices, providers, and user-journey validation remain separately gated.

## Definition of a successful sweep

Meaningful functional or maintainability improvements, no newly introduced regression according to available automated checks, transparent remaining uncertainty, and no additional unapproved costs. At ~five-sweep intervals, include architectural health as a first-class deliverable.
