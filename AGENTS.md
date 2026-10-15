# Busy Does It — Standing Codex Repository Instructions

These instructions apply to all development work in this repository. They govern working practice; they do not prove that a feature is implemented or authorise a release.

## Before any substantial development mission: two-master preflight

1. Read `ARCHITECTURE.md` and `docs/DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md` at the **actual working branch/ref**. Inspect relevant implementation, recent changes, test evidence, and the live state of open draft PR dependencies.
2. Read `docs/CODEX_MASTER_ACCESS.md` and `docs/CODEX_PRODUCT_BRIEF.md`. These are **public guidance and provenance**, not a substitute for the owner's full, private Word product master.
3. Locate and actually open the **latest owner-approved Busy Does It Word Product Master** provided in the current task context or an explicitly authorised private location. Check the version against the access manifest and mention precisely which version was read. Do not claim to have read a master merely because another thread did, its name appears in a prompt, or this instruction mentions it.
4. If the full master is inaccessible, say so. Request the current document before product-scope decisions or major feature sweeps. You may perform independently safe, scope-neutral code review or prepare a plan, but do not invent requirements or silently fall back to an older document.
5. Product master = desired customer experience, product/business requirements and vision. `ARCHITECTURE.md` + actual source/test evidence = implemented technical truth. Resolve tensions explicitly; never present a product ambition as already working.

The repository is **public**. Never commit an owner's private master, unpublished business plans, personal information, credentials, customer data or private context here without explicit, informed approval. Do not try to obtain private attachments from another chat automatically.

## North star and priorities

- Customer promise: **"You tell Busy what needs doing. Busy does it."**
- A customer's request must be completed correctly, with real evidence of the outcome, not simply answered with impressive language or a plausible-looking mockup.
- Build Busy as an accessible, owner-friendly operating layer for many kinds of small businesses; simple, voice/typed-first interaction above sophisticated reusable intelligence.
- Current construction emphasis: **App Builder first, Website Builder second**, across many industries rather than a fixed handful. Preserve Business Apps in the Busy marketplace and the optional standalone app/export path.
- Share Business Brain, Brand DNA, design systems, owner feedback, customer context and existing capabilities across apps, websites, content, marketing and other business workflows. Prefer a single source of truth over competing agents, ledgers or engines.
- Improve per-business memory, outcome-based evaluation, owner-feedback loops and foundations for explicitly opt-in privacy-preserving aggregated learning. Tenant isolation, consent and oversight come first; do not claim the model retrains automatically.
- Owner's approved content, choices, design locks, exports/ownership, and final approval always matter. Avoid silent public changes, surprise charges and irreversible automation.

## Delivery method

- **Build fast. Build properly. Reuse intelligently. Improve continuously.**
- Start from the latest verified **compatible** source, not an arbitrary default branch. Inspect unmerged PR chains before branching. Never overwrite, duplicate, silently discard, or cherry-pick incompatible work. Keep experimental changes in a named isolated branch and **draft PR**; clearly document its base and dependencies.
- In substantial autonomous sessions, work through **multiple connected functional sweeps** where feasible. The target number is an aspiration, not a reason to invent work or skip tests. After a safe, verified sweep, continue to the next compatible improvement until task/usage limits or an approval gate intervene; do not imply background or indefinite execution.
- Per sweep: establish existing behaviour; identify user outcome and reuse; make integrated functional improvements; validate types/syntax/contracts and relevant automated tests; fix new failures; assess security/performance/maintenance; record evidence, remaining limitations and recoverable commits.
- At approximately **every five major sweeps**, perform a deeper architecture/code-health audit; sooner when risk warrants. Prefer selective simplification over speculative rewrites.
- Limit paid/duplicated builds and redundant scanning. Source-line growth, a passing script count, simulated previews and model opinions are not proofs of customer value or deployment readiness.
- Keep the existing public service, owner state and published data stable. Client/server contract changes must have a documented compatible staging rollout path, not an assumption of simultaneous production updates.
- Record exact branch, source commit, PR, changed functionality, tests passed/failed/blocked, sandbox restrictions, evidence type and next requirements. Honest reporting is mandatory.

## Security, authorisation, and costs

- Default additional **external spending budget: £0** until the owner expressly approves a particular cost.
- Normal isolated source editing, offline/local tests, Git commits and draft PRs are allowed for an authorised development task.
- No automatic merge to protected branches; no production/customer-data access or changes; no deployment, publication, email/social/customer sends, paid builds, paid model/provider calls, account purchases, live migrations or release actions without **separate, explicit owner approval**.
- Enforce identity/tenant scope, authorisation, revision/compare-and-swap invariants, owner locks, safe recovery, idempotency and private-to-public approval boundaries in **actual trusted server paths** as well as UI. Do not rely on client-side checks alone.
- Never disable or weaken assertions/security rules to hide failures; distinguish blocked environment from failed assertions. Verify any claim of device, browser, provider or hosted behaviour against real evidence.

## Updating masters and continuity

- When the owner asks to "add to the master", route product requirements to the **private versioned Word product master**, and implementation/security/testing facts to GitHub `ARCHITECTURE.md`; durable shared principles should be reflected in both with a clear cross-reference.
- Do not claim a Word master or connected source was updated unless it truly was. Never publish private material to this public repository by convenience.
- Keep `docs/CODEX_MASTER_ACCESS.md` current when a newly approved master supersedes its recorded version; archive/version the original privately. If an updated private master cannot be accessed, request it rather than guessing changes.
- A short mission prompt can point to this `AGENTS.md`, specify immediate priorities and ask for multiple substantial sweeps. It cannot override safety rules or supply a missing private product master.
