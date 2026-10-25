# Busy Does It — Major Sweep and Code Architecture Review Policy

**Standing owner development instruction (12 October 2026).** Apply in future Busy Does It development sweeps, especially while completing the **App Builder first** and **Website Builder second**. This policy is intended to persist across ChatGPT sessions and future branches; include it by branching from the latest verified development branch.

## Permanent architecture rule — Shared Intelligence, Separated Responsibilities (21 October 2026)

Owner-approved product-master reference: private **V22.42 (retaining Section 56)**; technical reference: root `ARCHITECTURE.md` under the matching permanent architecture principle.

- Deliver one useful conversational Busy with reusable, business-scoped Business Brain/Brand DNA, approved facts, customer/work context, permissions and outcome evidence. Don't create disconnected versions of these truths.
- Keep clearly accountable specialist domains for creative preparation, marketing, customer communications/CRM/Work, app/website composition, quotes/payments and their trusted provider execution. Shared intelligence supplies facts and recommendations; it does **not** silently obtain authority to send, publish, spend, book, mutate or take payments.
- Do **not** turn Business Brain, AppController, shared hooks or an orchestration layer into a giant module every unrelated feature must depend on. Prefer bounded, testable contracts, controlled data flows, independently understandable domain modules and reused canonical services.
- For each feature sweep identify the owner of facts, approval, writes and external effects; check touched-code responsibilities, fan-in/fan-out, coupling, copy-pasted business rules and static/dynamic dependencies. At approximately five-major-sweep audits, inspect oversized files/components and show concrete incremental refactors and regression evidence; don't rewrite just to shorten files.
- Protect tenant/owner boundaries, source identity, revision/CAS, stale-work denial, data portability, backward compatibility, current owner edits and result honesty in each domain's real trusted contract. Do not misstate source tests as hosted integration proof.


## Approved future visual direction — Midnight Intelligence (owner decision 21 October 2026)

Reference private Product Master **V22.43, Section 61** and the matching non-confidential `ARCHITECTURE.md` direction. Preserve premium near-black/midnight UI with exceptionally subtle stars, constellation links, restrained area-specific aurora tones and a distinctive non-cartoon Busy ring/presence. All effects are subordinate to legible, navigable business content; use shared tokens/components and keep page responsibilities separated from Business Brain and AppController. Actual listening/working/completed motion must be bound to truthful workflow state. Respect Reduce Motion, keyboard/screen readers, contrast, low-power/performance and correct six-area navigation. This is **future design approval only**, not permission for a broad code redesign, deployment, paid build or release. Review representative screens and motion with the owner before implementation; validate actual device/browser behaviour separately.

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

## Build-first active development — owner Phase67 instruction (23 October2026)

Prioritise coherent batches of working application code, reuse and essential automated quality checks. Use source/component, syntax, dependency, architecture and relevant security regressions during development; run the full applicable automated selection on frozen source before completion claims. Correct critical defects at their real boundary. Do not turn every mission into owner-performed device acceptance, hosted infrastructure investigation or documentation-only preparation. Actual device/browser/provider/JWT/release acceptance remains honestly separate and requires its existing authority; no relaxed security assertions, paid actions, hosted switches or abort-fuse removal.

Product authority for this mission is the accessible genuine V22.48 original plus explicit Phase67 implementation instructions. V22.49's original is unavailable and not reconstructed. The approved visual direction may now be implemented in original app chrome/Home/settings while preserving corporate identity, six destinations, source/tenant approvals, all existing business records and owner-created website/app appearances. Device appearance preferences must remain separate from business Brand DNA and account snapshots.

## Phase68 — genuine V22.49 policy authority

The newly supplied original V22.49 was actually opened and verified (provenance in master-access manifest). Its build-first reaffirmation supports substantial connected implementation and independent automated checks while deferring exhaustive founder/manual/device/hosted acceptance to stabilisation. Fix critical defects promptly, record failed and unavailable checks, and retain all thorough pre-release, security, privacy and deployment gates. This supersedes Phase67's missing-original limitation, without granting hosted rollout authority.


## V22.52 trusted quote recipient boundary — 25 October 2026

Current private master provenance is recorded in CODEX_MASTER_ACCESS.md. Approved explicit recipient/version review and fresh original-server verification do not grant customer disclosure. Owner-private binding, consumer access, presentation, provider evidence, structured response, agreement and booking remain separate finite authorities. Keep recipient/access/response gates disabled, SQL abort-fused, private originals outside Git, and hosted/JWT/device/retention acceptance separately reviewed. See TRUSTED_QUOTE_BINDING_2026_10_25.md for current locally verified scope.
