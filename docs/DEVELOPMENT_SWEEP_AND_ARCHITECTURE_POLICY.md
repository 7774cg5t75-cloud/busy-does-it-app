# Busy Does It — Major Sweep and Code Architecture Review Policy

**Standing owner development instruction (12 October 2026).** Apply in future Busy Does It development sweeps, especially while completing the **App Builder first** and **Website Builder second**. This policy is intended to persist across ChatGPT sessions and future branches; include it by branching from the latest verified development branch.

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
