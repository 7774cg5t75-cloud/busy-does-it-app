# Busy Does It code architecture

This branch restructures the large single-file prototype into domain modules without intentionally changing product behaviour.

## V3.225 — Real existing guest RPC rehearsal, owner-action inbox and architecture health

- **Dual-master preflight completed first:** current saved Word master V22.5 and GitHub architecture/sweep policy. Preserve one reusable Business App runtime, shared tenant-scoped request data, affordable operation, owner approval and verified end-to-end customer outcomes. No product/pricing decision or Word-master edit in this technical sweep.
- **Actual PostgreSQL 16 integration test, no hosted changes:** scripts/prepare-disposable-guest-rpc-v3225.mjs builds an explicitly **CI-only**, source-hashed transaction from the real V3.180 staging-only business baseline and **ten historical migration SQL bodies** (V3.39 through V3.45 guest RPC prerequisites), omitting only cron registration for isolated safety. CI tests the genuine guest-request RPC's database write, atomic event, same-challenge idempotent replay, changed-payload replay, tenant separation, guest origin and expired challenges; then proves complete transactional rollback. Success marker V3.225_EPHEMERAL_GUEST_RPC_ROLLBACK_PASS. It is not an install of all 64 migrations or a real Supabase Auth/JWT integration test.
- **Original guest replay weakness independently demonstrated:** a consumed V3.45 challenge returns the original request ID, even when a caller supplies a changed payload. The V3.224 Edge handler's server-read exact stored-payload comparison is therefore essential; *never* interpret a returned ID alone as confirmation that the new payload was stored. Booking requests remain unconfirmed until independently approved and recorded.
- **Private owner queue is a real endpoint/source path, not deployed:** busy-mini-apps/index.ts adds an owner/admin-membership-checked `owner_queue_summary` using exact database counts scoped to the current business and main Business App, with minimal private request metadata and no customer PII. A bounded classifier is in ownerRequestQueueV3225.mjs. The existing AppController and miniApps screen add an **on-demand**, read-only Check customer requests action with exact response business/app matching; no background provider polling, automatic replies, booking confirmation, charges or new CRM database.
- **Architecture health reviewed:** large busy-mini-apps Edge handler, AppController and miniApps screen remain important coupling risks; the guest RPC's cron/extension side effects and initial provider notification race require targeted future separation and a durable request-linked outbox. Implement small, tested service boundaries rather than a mass rewrite; report: docs/V3_225_REAL_GUEST_RPC_OWNER_QUEUE_AND_ARCHITECTURE_HEALTH.md.
- **Release gate unchanged:** hosted staging still holds only the security canary and two canary migration records. SQL source and real disposable PostgreSQL tests do not grant database installation/deployment approval or prove authenticated tenant RLS, provider delivery, native builds or live customer outcomes. Independently review true schema, privileges, side effects, backup/restore and owner phase approval before hosted testing.


## Permanent Get More Customers refinement — coordinated, evidence-led marketing

**Product-source decision (14 October 2026; saved Busy Does It Product Master V22.6, Section 42).** A competitor review of Holo (https://tryholo.ai/, company-published marketing descriptions) reinforces the existing Get More Customers roadmap. This is a **design constraint and candidate capability plan, not implemented code, proof of competitor results or authority to run paid services**.

- **Reuse the shared Business Brain and Design/Brand DNA** across the website, in-BUSY/standalone app, social content, emails, paid campaigns, search and video. Owner-authorised existing-website intake may propose brand facts with source/provenance, image rights, tenant scope and explicit correction/approval. Do not create a second competing brand profile or marketing record.
- **Canonical campaign/work package:** one same-business, revisioned brief should connect owner goal, audience/region, supported channels, assets, creative variants, website landing destination, calendar slots, publishing tasks, spend/AI-credit bounds and meaningful business capacity. Every task has separate status and provider confirmation: proposed, prepared, pending approval, scheduled, provider accepted/live, failed or reconciled. Never infer delivery from drafted plans.
- **Prepared-work queue and bounded autonomy:** Busy may prepare useful recommended marketing work without unsolicited public action; owner reviews concise Approve / Edit / Dismiss controls. Any later autopilot needs explicit granular time/channel/content/budget permissions, cancellation/pause, consent expiration, escalation, audit and server-side enforcement. Never silently change offers, launch ads, respond publicly or increase spend.
- **Continuous improvement from real evidence:** make comparisons from permitted business-scoped outcome events and actual provider receipts, with strength/provenance explicitly marked. Distinguish ad-platform estimates from independently proven website enquiries, bookings or payments. Diagnose broken funnels or lack of capacity before buying traffic; do not optimise against invented conversions or guarantee ROI.
- **Fair pricing and safe market intelligence:** surface external ad spend separately from subscription and creative/AI credits; quote paid generations before use and reuse existing assets. Research trends/competitor approaches only via lawful, appropriate sources; do not copy protected creatives, scrape private data, spam communities or train across businesses without proper consent.
- **Differentiation:** marketing is not a separate generation silo: integrate existing Website Builder, App Builder, booking/customer journeys, CRM, calendar, Get Paid and Get More Customers, so Busy can prepare a plan, execute owner-approved work and verify what really occurred.

Keep the existing architecture, V3.198 branded-content groundwork, V3.210 universal capabilities, source/proof-level contracts, GitHub CI/staging gates and both-master governance authoritative. Compare against current code before each sweep; deliver verifiable pieces rather than duplicative intelligence frameworks. See saved product master V22.6, Section 42. Holo claims must be independently evaluated; no Holo proprietary code or creative may be copied.

## V3.224 — Actual guest-request replay integrity and disposable PostgreSQL rollback proof

- **Both masters checked before implementation:** saved Word product master **V22.5**, especially single shared Business App backend, end-to-end functional workflows, customer ownership and quality-first dual-master governance; GitHub architecture, sweep policy and latest V3.223 evidence. Technical improvement only: no Word product-master version change.
- **Real Edge handler improved, not deployed:** the existing `busy-mini-app-guest` handler now independently reads back the full server-scoped stored request after the transactional guest-request RPC, and confirms exact guest challenge, business/app/request identity, contact metadata, sanitized request payload, request kind/origin/assurance and optional idempotency key before claiming it saved *the submitted* data. Replayed challenges can reference previously committed requests; never silently call a different payload a successful new submission.
- **Sequential replay notification restraint:** if the original challenge was already consumed, avoid a second unverified provider-notification attempt. Concurrent submission races remain possible and **exactly-once notification delivery is not proven**; preserve the future durable, atomic outbox requirement. A verified saved request is NOT a delivered notification, completed booking, external calendar entry or active native website form.
- **Real low-cost database test:** a new V3.224 GitHub Actions PostgreSQL 16 Docker job runs the existing **staging-only** V3.180 business/member SQL in a *single disposable transaction*, checks FK/table creation, FORCEd RLS, direct-client grant denials and service_role access, then rolls back all created tables, temporary auth users and mock roles. Verified `V3.224_EPHEMERAL_BASELINE_ROLLBACK_PASS` on GitHub. This is real Postgres DDL/transaction verification but *not* a genuine Supabase staging install, real JWT/RLS tenant isolation or recovery from an actual deployed migration.
- **Continuous quality:** 177 V3.224 source assertions passed; inherited development source tests and separate Production Foundation checks succeeded; no deployment, staging/production write, signed build, customer contact or charge. The first disposable-job failure was a test-only constant-folded divide-by-zero expression; the corrected rerun passed. Detailed record: docs/V3_224_GUEST_REQUEST_REPLAY_AND_DISPOSABLE_STAGING_BASELINE.md.
- **Next blocked milestone:** separately approved actual staging install and reversible restore procedure, verified two-tenant Auth/JWT, atomic guest request/idempotency and durable notification evidence. Keep universal customer experience simple, reuse one Business App request engine, and never confuse source CI with hosted readiness.


## V3.223 — Master-first architectural checkpoint: parity, rollback boundaries, honest outcomes

- **Master read first:** V3.222 and the permanent open-source strategy were reviewed before coding. Reuse existing V3.180 staging-only base schema, V3.220–V3.222 phase guards and V3.218/V3.222 Business Brain; no duplicate CRM/request database, editor, learning engine or unreviewed open-source installation.
- **Production bridge is not production truth:** V3.25 bridge source describes calendar/push systems including sensitive access token, refresh token and notification fields. The V3.223 source parity reviewer checks only declared staging business/member columns and bridge foreign-key targets; it cannot prove real production schema, privilege/RLS parity or permit copying production data. Never use the bridge as an installation migration.
- **Phase-one readiness remains blocked:** Latest read-only isolated staging check found the original RLS canary plus exactly two recorded canary migrations, without the shared Business App request backend. New safe catalog-only SQL and source-hashed offline review packet separate observed baseline from simulated two-table after-state. Unexpected partial tables, missing canary or a changed ledger MUST halt further work. Never automatically DROP, CASCADE, restore, execute SQL, install extensions or authorize the next phase.
- **Separate approvals for real work:** Before any isolated staging installation, independently re-check project identity/schema, compare actual production schema metadata without sensitive data, review exact file hashes and privileged side effects, prove disposable backup/restore and real two-tenant Auth/JWT/RLS isolation, obtain explicit owner-approved phase scope, and verify the real shared guest request/owner inbox. Static source regexes/approval flags cannot substitute.
- **Business Brain evidence age and scope:** Extend the same existing next-action engine with bounded valid owner-scoped report periods, a seven-day freshness window for source-labelled aggregate evidence, and stale/future/contradictory report rejection. A source-labelled rollup is still unverified until independently fetched and authenticated server-side. Private guidance stays one action, prioritizing original request recovery and stale app version review; never claim confirmed bookings, delivered provider messages or automatic cross-business learning.
- **Code health:** V3.223 adds offline actual-source regressions and an inherited CI workflow, retaining manual unsigned exports and avoiding repeated paid native builds. Technical record: docs/V3_223_MASTER_LED_STAGING_PARITY_AND_OUTCOME_EVIDENCE.md.


## Permanent policy — dual-master governance and outcome-first sweep planning

**Owner-approved standing instruction (14 October 2026): Two complementary masters, checked before EVERY substantial sweep.** The **saved, versioned Busy Does It product master (currently V22.4 as of this decision)** governs customer promise, business vision, product scope, commercial principles, UX simplicity and long-term goals. This repository's `ARCHITECTURE.md` and linked technical/sweep policies govern code architecture, implementation status, reuse decisions, security, verification and delivery. Do not claim they are automatically synchronised. Locate and READ the latest available version of BOTH plus current repository branch/code **before** proposing or beginning the next substantial sweep. Do not substitute conversation memory for retrieval.

**When the owner says "save to the master", classify and route intelligently:**
- Product idea, vision, customer experience, service design, pricing/tier value or long-term requirement: update the saved product master; update GitHub architecture too **only** if the decision implies lasting technical contracts or implementation direction.
- Technical design, engineering pattern, development principle, test/quality policy, security/reliability requirement or detailed code decision: update GitHub's master/policies; summarise in the saved product master **only** if it has strategic or customer-facing implications.
- Cross-cutting goals, product-engineering principles or planning/governance rules: record a concise matching decision in **BOTH** masters with a link/cross-reference and clear authority. Do not mindlessly duplicate entire documents.
- Preserve the existing saved master via a new version and provide the exact downloadable artefact; only claim Library synchronisation when an actual upload succeeds. New technical documentation should be committed on the latest appropriate development branch, not assumed to be merged into `main`.

**Mandatory pre-sweep procedure:**
1. **Retrieve both masters, inspect latest GitHub branch, recent sweeps and code**; compare against the owner's latest approved product vision, staged implementation and outstanding release gates.
2. Build a concise **vision-to-reality gap assessment**: what's already working/verified; implemented but unverified; merely designed; missing; and which existing modules/open-source building blocks can be reused.
3. Prioritise the **fastest responsible path to genuine customer outcomes**: reduce owner workload, maximise practical intelligence and simplicity, leverage existing components, group substantial related tasks, and resolve dependencies. Assess impact, confidence, reversibility, security, cost, testability, and maintenance burden. **Long-term correctness, reliability, security, accessibility, ownership and coherent architecture outrank short-term speed.** Spend additional engineering time if it avoids fragile shortcuts, quality debt and expensive rework; avoid unjustified gold-plating.
4. Present a substantial multi-topic sweep with clear scope, affected shared systems, evidence/acceptance tests, cost/spend constraints and real blockers. Differentiate code implementation from staging and paid external verification. Require explicit approval for production data changes, paid actions, irreversible operations and deployment.
5. Execute with lightweight CI/security/regression checks and deeper architectural review at agreed intervals; verify actual outcomes at the correct boundary, and give honest status. **Never call a mock, a source check or an unsigned export a verified live service.**
6. **Reconcile both masters after meaningful decisions and completed sweeps**: document product-level changes in the saved master when necessary, technical changes in GitHub, and any planned/remaining work with its proof level. Where the two disagree, treat the saved product master as the authority on vision and GitHub as authority on observed implementation; flag the conflict and resolve consciously rather than silently redefining the goal.

**Perpetual north star:** "Every new version should bring us closer to an app customers love using and a business that requires less and less of my time to operate." "You tell Busy what needs doing. Busy does it." Measure progress by dependable, independently evidenced end-to-end work—not lines of code, frameworks or visually convincing demos.

See [Major Sweep and Code Architecture Review Policy](docs/DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md) and [AI Builder Competitive Learnings & Open-Source Integration Strategy](docs/AI_BUILDER_COMPETITIVE_LEARNINGS_AND_OPEN_SOURCE_STRATEGY.md).

## V3.222 — Maintainable production-backed test semantics and outcome-first advice

- **One reviewed website Node harness:** scripts/lib/website-builder-test-harness-v3222.mjs source-checks exact websiteBuilder imports and injects the actual Brand/site, canonical published-app handoff, design planner/reviewer and safe edit functions. Sixteen older suites now reuse it; test-only Function evaluation uses exclusively checked-in source, not customer input. An unreviewed new import or entry point must fail rather than silently omit security.
- **CI progress verified:** at a V3.222 commit the new 71-check shared-harness suite, 86-check staging/intelligence suite, inherited builder and SQL source regressions and independent Production foundation check all succeeded in GitHub Actions. No conclusion about signed mobile builds, real server requests or provider delivery follows from source CI.
- **Staging phase drift:** the 14 October read-only separate staging observation still shows only busy_staging_rls_canary and two canary migration versions. The V3.222 evidence contract refuses changed ledgers, unexpected extra tables or partial business/member installation and prescribes refreshed authorised target inspection, source migration/side-effect review, rollback test, two-tenant Auth/JWT and phase-specific owner approval. Execution authority is ALWAYS false; no schema was applied.
- **BUSY's next action:** a conservative, single recommendation prioritises uncertain saved-request readback, stale immutable app links, owner-review of waiting customer enquiries from appropriately scoped *labelled* outcome rollups, then actual available modules or a missing-capability plan. Pure local source labels are not independent backend proof. No automatic send, publish, booking, billing or cross-tenant aggregated training.
- **Credit discipline:** rapid edits keep offline source and safety checks; heavyweight unsigned Expo exports remain manually dispatched and signed native builds require an explicit release decision. Technical detail: docs/V3_222_SHARED_BUILDER_HARNESS_STAGING_AND_BUSINESS_EVIDENCE.md.



## Permanent development principle — intelligent reuse and open-source integration

**Owner-approved permanent rule (14 October 2026):** **Build fast. Build properly. Reuse intelligently. Improve continuously.** Our existing Website Builder, Business App Builder, Business Brain, Brand DNA, universal capability catalogue, reliable workflow contracts, ownership/export protections, approval/versioning and publishing work are important assets. **Do not discard or unnecessarily rewrite them simply because open-source alternatives exist.** Incorporate useful external technology **alongside** Busy-owned code when it demonstrably accelerates progress or produces a better customer outcome.

1. **Before every substantial sweep, inventory what Busy already has.** Reuse and strengthen existing components and shared services first; avoid parallel visual editors, duplicate data stores, conflicting design schemas and redundant intelligence engines.
2. **Prefer proven, appropriately licensed open-source building blocks** when there is a genuine gap: evaluate fit, licence/attribution and third-party dependencies, maintenance and security posture, compatibility with Expo/React Native and hosted React/web, performance, accessibility, touch/mobile use and long-term portability. No proprietary competitor source or copyrighted assets may be copied without rights.
3. **Integrate through narrow, replaceable adapters.** Consider Puck (open-source React component editor, MIT) and GrapesJS (open-source HTML/web editor framework, BSD 3-Clause) for an *optional hosted website editor proof of concept*. Neither replaces the native app renderer or Busy's own data model, Business Brain, Brand DNA, permission boundaries, owner approvals or publishing workflow. Check exact version and plugin licences before use.
4. **Compare instead of blindly replacing.** Prototype safely; evaluate the current editor vs Puck vs GrapesJS on real Busy sections, round-trip design fidelity, voice/typed element editing, responsive views, undo, revision safety, security, performance, costs and maintenance. Adopt/replace only with demonstrated net gain and rollback plan.
5. **Apply competitor learnings beyond editors:** industry-neutral custom features, more distinctive designs, context-aware conversational editing, functional backend-linked app creation, real browser/transaction testing, customer-approved existing-site/data import, standalone distribution and continuous verified improvements after publication.
6. **Keep practical results authoritative.** Source-level checks or visually persuasive previews never prove real bookings, payments, form delivery, native-app publication or secure staging. Require owner approval, tenant isolation, server-side proof and proper end-to-end tests. Respect staging dependencies, provider costs and our build-first/lightweight-check cadence.

Detailed competitor comparisons, candidate integrations, architecture boundaries, adoption checklist and sequenced plan: **[AI Builder Competitive Learnings & Open-Source Integration Strategy](docs/AI_BUILDER_COMPETITIVE_LEARNINGS_AND_OPEN_SOURCE_STRATEGY.md)**. This document is a permanent planning reference, not an assertion that the candidate tools have been installed or the future capabilities implemented.

## V3.221 — Reusable evidence boundaries and code health

- **Staging-first safety:** V3.180's isolated-only business/membership baseline is inspected, not applied. Review source FK, supported member roles, FORCEd RLS and direct-client permission denial, plus dangerous SQL patterns; these are preliminary signals, not actual SQL execution permission. The 64-migration side-effect inventory flags privileged functions, schedule, pg_net/HTTP, extension and potential destructive operations for independent manual review and rollback/restore.
- **No implicit DB migration authority:** Only a separately authorised, explicitly scoped isolated-staging action after refreshed target inspection, exact source review, tested backup/rollback and authenticated tenant RLS proof could install a phase. Neither this version nor the source review functions obtain those authorisations.
- **North-star customer evidence:** one short owner recommendation should come from current owner intent, same-business website/app, exact immutable published app version and genuinely available modules. A possibly saved request outranks other suggestions; unknown commits require readback, not duplicate creation. Status fields never imply provider delivery, calendar booking, customer replies or a published native website intake form.
- **CI quality:** The Snack source graph includes the shared V3.213 receipt validator. Test harnesses must inject current canonicalWebsiteHandoffUrl instead of evaluating a stripped/partial websiteBuilder module or weakening its link checks. V3.221 source and Snack graph tests passed in Actions, while independently full green Production foundation check remains outstanding.
- **Economical iteration:** cancel superseded checks on fast development branches. Normal V3.221 changes run source/security assertions; heavier unsigned exports are reserved for manually requested workflow dispatch. Do not use paid native signing until an intentional stabilisation/test milestone. Details: docs/V3_221_CI_STABILISATION_AND_STAGING_FIRST_PHASE.md.


## V3.220 — Staging-first infrastructure evidence, safe recovery, simple owner guidance

- The **real isolated staging project** still has only busy_staging_rls_canary and two canary migration versions, plus pgcrypto. The source repository has **64 versioned SQL migrations** referencing base business and membership tables. Reuse staging/ISOLATED_ONLY_business_core_v3180.sql as a *candidate for manual staging-only approval*, not an authoritative copy of production.
- The offline V3.220 bootstrap reconciler reuses established migration dependency/risk scanners and divides the 65 source SQL files into five separately reviewed phases. A local-only SHA-256 manifest records the exact source bytes. A recorded read-only Supabase snapshot can become stale and cannot prove migration safety, owner consent, JWT isolation, backup restoration or real request behaviour.
- No phase review, even with every Boolean marked true, may automatically apply SQL, install pg_cron/pg_net/pgmq, deploy an Edge function, publish a website or claim independent request completion. Review schedule/HTTP/provider privileges, security-definer routines, grants, partial installs, existing migration ledger and rollback before approval; repeat the independent target read at install time.
- Universal website/app composition remains **any-industry**, source-scoped and proof-level aware. Owner-facing guidance presents one clear next action; deeper reasons are optional. An immutable app version change requires explicit handoff reapproval and separately approved website republish, never a silent redirect.
- Request recovery and notification delivery must be separately evidenced: unknown commit → reconcile existing receipt; verified saved request → owner inbox verification; attempted or purportedly delivered provider notification → independent provider proof; request accepted in BUSY ≠ confirmed external diary entry. No automatic duplicates, retries or provider charges.
- V3.220 worktree regression is configured to parse all 64 source migration SQL files in GitHub CI. Focused V8 contract testing is not a substitute for Node/Expo builds or PostgreSQL Auth/JWT/RLS and full rollback validation. See docs/V3_220_STAGING_BOOTSTRAP_AND_CONNECTED_CUSTOMER_JOURNEYS.md.


## V3.219 — Actual staging schema gates and verifiable customer outcomes

- **Verified external observation, 14 October 2026:** the separate Busy Does It Staging Supabase project has only busy_staging_rls_canary in its public schema. The shared business membership, Business App, immutable version, guest challenge and request tables and associated app RPC are absent in staging. This is not an active live staging request platform, regardless of source-level tests. Read-only catalog queries are documented for repeatability.
- Stage the actual existing business/app foundation BEFORE native website request intake. Compare migration dependency order and history, verify two-tenant membership/RLS isolation, live guest challenge/RPC and saved request readback; test a safe backup/restore and rollback before further migrations. The code only proposes these stages and NEVER grants deployment authority from source metadata alone.
- Website-to-app handoff recovery is owner-controlled: canonical HTTPS destination + business slug + immutable app/version + enabled module must match the current published version. Stale/forged/rotated links require owner review and separately approved website republication, never invisible redirects or auto-saves.
- An interrupted request's committed/unknown state must be reconciled through the original authenticated request receipt before suggesting any new submission. A browser result, preview or proposed transaction is not independent saved-request proof.
- Notification-outbox evidence separates queued, attempted, provider-accepted, failed, dead-letter and purported delivered states. Actual provider cryptographic/receipt verification cannot be established by a caller-set Boolean. Keep notification delivery distinct from accepted bookings, confirmed diary events and customer replies.
- Business Brain now prioritises a short, scoped next action (check an uncertain saved request, review stale app version, or act on verified available modules) in the existing Website Builder. No cross-tenant reuse, hidden publication, provider spend or fabricated outcomes.
- V3.219 source regressions and inherited unsigned export workflow are configured; independently confirmed full CI, deployment and actual browser outcomes remain outstanding. See docs/V3_219_STAGING_AUDIT_RECOVERY_AND_OUTBOX.md.


## V3.218 — Unique request scope, replay recovery and evidence-first Business Brain

- A website-native submission must use server-fetched published website + deployment + **exact owner approval revision**, approved immutable Business App version and tenant-aware guest proof; website Origin alone never authenticates. Existing busy_mini_app_requests remains the intended customer request record/inbox. The current Business App guest RPC cannot safely be reused for website-native input without a distinct new challenge and origin contract.
- Source-only schema and intentionally aborting SQL proposal define four future concepts: owner-approved form/notice, single-use challenge, unique **business+website+deployment+approval+type+key-digest** idempotency ledger and independent notification outbox. The SQL is stored in docs/sql-proposals, NOT migrations, and must be reconciled with the actual staging schema and RLS before real migration work. No database changes or public endpoint were made.
- The pure idempotency reviewer never grants a write: fresh requests require an atomic Postgres RPC, a matching committed replay requires independently authorised readback, pending/unknown outcomes require reconciliation before retry, and key reuse with a different payload or another approval/tenant/version is denied. Do not expose replayed request IDs to an unverified browser.
- Request recovery distinguishes commit-uncertain, server-read saved request, owner inbox proof and provider outbox state. A saved guest request is not proof of a native website form, delivered notification or verified diary appointment. The module itself does not authenticate its server inputs; only authorised handlers can.
- New bounded Business Brain outcome-priority planning uses same-business, source-labelled aggregate counts as hypotheses; it never queries data, shares between tenants, retrains a model, sends, charges or publishes. Any future verified rollup and customer-facing insights require a real server-owned evidence pipeline.
- Universal customer-action composition recommends reuse of actually published app modules and owner-reviewed private website handoff, with an industry-neutral fallback and no false native website form. Optional guidance sits in existing Website Builder review.
- V3.218 focused source assertions and inherited GitHub workflow were added. An isolated V8 run is NOT a complete Node/Expo, PostgreSQL, real browser, signed build or provider delivery verification. Technical details and activation gates: docs/V3_218_ATOMIC_REQUEST_RECOVERY_AND_UNIVERSAL_BRAIN.md.


## V3.217 — Future native website request transaction and owner authority

- Universal website and app composition still shares ONE business-owned customer request system. The existing guest mini-app RPC requires its mini-app challenge and cannot be treated as a website-native submission RPC; a new server-owned, atomic website source adapter and receipt origin must be reviewed and implemented first. Do not create a shadow customer database or claim that any native site form currently operates.
- Inactive V3.217 transaction design rechecks exact published website/deployment and same-business, immutable published app version, owner-approved form binding, supported request action and service before planning an atomic challenge + scoped idempotency + save + readback + inbox + separate notification outbox. All execution flags remain FALSE. New Edge endpoint, schema, migrations and real staging proof are outstanding.
- Local owner form specification tracks current private website generation, proposed fields, purpose, notice, retention, and exact deployment candidate; it is NOT a saved privacy approval or customer consent. A change invalidates the previous private comparison. Publication is a separate explicit server-authorised action.
- Pure guest receipt review can describe a saved Business App guest request only after an independently authorised server readback. A future website-native receipt needs its own server-backed origin and receipt contract. Internal acceptance does not prove diary/calendar or notification delivery; an unknown commit must reconcile before a second create.
- Business Brain uses owner intent, real available module evidence and scope-checked saved request evidence to suggest ONE useful next step without autonomous messaging or invented outcomes. Unknown industries remain eligible.
- Responsive future form estimates are not pixel measurements, colour-contrast audits, browser screenshots or screen-reader acceptance. Keep the interface optional and lightweight.
- V3.217 focused offline source checks and inherited GitHub workflow are distinct from independently successful full CI or public staging verification. See docs/V3_217_TRANSACTIONAL_REQUEST_DESIGN_AND_BUSINESS_COACH.md.


## V3.216 — Site-origin request trust boundary and industry-neutral advice

- Native website enquiries stay INACTIVE. A new pure server pre-commit guard defines exact published site/deployment identity, owner-approved consent, browser challenge scope, anti-replay/idempotency and bounded visitor fields. Its ok state is only a *preflight result*: it may not commit, create a receipt, confirm bookings or claim provider delivery. No Edge endpoint, migration or tenant-owned request storage is deployed by this version.
- A future website submission route must fetch site, deployment, approval and challenge records independently on the server, atomically consume the one-time challenge and use the existing tenant-scoped Business App request RPC/inbox and V3.213 saved-receipt semantics. Never trust an Origin header by itself or allow visitor-supplied tenant authority. Notifications and diary acceptance require independent evidence.
- The Website Builder's existing optional handoff panel can explain proposed fields, customer consent, remaining verification and mobile accessibility without enabling a public form or modifying a live site. The existing owner-approved immutable Business App link remains the interim path.
- The Business Brain suggests a practical customer action based on the business brief with an unrestricted fallback for any other industry. Suggestions may only be labelled available if supported by owner-scoped published module evidence and the existing guard. Recommendation is not publication, permission or successful outcome.
- V3.216 focused offline contract checks feed a dedicated GitHub Actions job alongside inherited architecture/security checks and unsigned iOS/Android exports. **Real CI results, deployed edge/data migrations and staging browser outcomes remain separate evidence states.**
- See docs/V3_216_SITE_ORIGIN_INTAKE_AND_CAPABILITY_ADVICE.md. Permanent universal-builder architecture and the three-layer learning/verification model remain authoritative.



## Permanent architecture decision — Universal Business Website & App Composition
**Adopted: 13 October 2026. Status: long-term architectural requirement, not a claim that every capability is currently implemented.**
**Guiding ambition: Build a system capable of creating almost any kind of business website or app — not merely an excellent fixed-template website builder.**

### Scope and product invariant
- **Any legitimate business, in any industry, must be able to begin creating a website or app.** Industry detection is advisory: it helps BUSY infer useful components and design choices but must never be a restrictive eligibility whitelist or a required preset.
- The customer describes the desired outcome in ordinary language. BUSY plans, composes, generates, reviews and refines a distinctive experience based on that business's real needs, available information, permissions and entitlements. Unrecognised, cross-industry and novel business models must have a flexible fallback and a route to bespoke requirements.
- Website and Business App builders are **two delivery surfaces over reusable business capabilities**, not two isolated feature factories. Where practical, build booking requests, forms, accounts, search, catalogue, commerce, memberships, subscriptions, content, workflow, customer communication and reporting primitives once; provide surface-specific presentation and distribution adapters.
- Do **not** equate "any business may use the builder" with "every conceivable website feature already works". Complex custom integrations, specialised infrastructure, regulated industries and yet-unknown requirements can be unsupported or require external vendors, licences, verification or owner setup. BUSY must state those limits accurately rather than fabricate working functionality.
- The owner retains control of brand identity, facts, content, domain, costs, approved capabilities and final publication. Generated designs must be individually suited to the business, not a new set of slightly different compulsory templates.

### Target capability-composition architecture
These layers describe the intended direction. Their presence in this document **does not mean the layers or their full contracts have shipped**.

1. **Business understanding and Design DNA.** Build a tenant-scoped brief from owner-approved identity, services, goals, tone, visual language, assets, accessibility needs and business-specific constraints. Reuse that evidence across website, in-BUSY Business App, optional standalone app and approved marketing content. Record provenance and conflicts; never invent testimonials, pricing, approvals, credentials, business hours or photo rights.
2. **Versioned capability catalogue.** Develop reusable, independently testable modules for layout/design, information pages, galleries, enquiries, booking requests, verified appointments, accounts, catalogue, checkout/payment handoffs, memberships, messaging, uploads, search, portals, accessibility and analytics. Each capability's target contract should declare its identifier/version, accepted business data, dependencies, supported surfaces, tenant scope, permissions, provider requirements, costs, regulatory conditions, tests and actual readiness state.
3. **Planning and orchestration.** Translate an owner request into a dependency-aware plan combining existing supported capabilities; flag missing information or capabilities; propose safe alternatives or a reviewed extension when necessary. BUSY should explain *why* a particular design, navigation or workflow fits the business. An industry profile may prioritise suggestions but may neither fabricate owner facts nor make an unavailable capability available.
4. **Shared workflows and surface adapters.** Use common business rules and independently verified server-owned transitions for actionable functions. Render and adapt them appropriately for responsive websites, the BUSY marketplace mini-app runtime and an optional separately packaged native app. A website contact button is not an enquiry receipt; a booking request is not a confirmed appointment; a checkout design is not evidence that money was collected.
5. **Constrained extension mechanism.** When a feature cannot be composed from existing modules, BUSY may prepare a versioned specification and, eventually, reviewed new functionality through a sandboxed/permissioned development process. Do not treat arbitrary AI-generated code as trusted executable website, database or payment logic. Require scoped permissions, threat modelling, dependency/security review, resource and cost limits, automated regression tests, rollback support and owner approval before any activation.

### Capability honesty and safe execution
- Track **planned → prototype → implemented → automated checks passed → staging integration verified → approved live deployment → real outcome verified** as distinct evidence states. These are not interchangeable. Every builder and the Business Brain must communicate the strongest *actually verified* state, not its hoped-for state.
- Recheck the authorised tenant, current draft revision, enabled module catalogue, entitlements, provider permissions and approved immutable content at the point of applying a change. The client-side preview is never an authorisation boundary.
- Keep sensitive operations server-side behind least-privilege access and tenant isolation; use idempotency/transactional boundaries where appropriate for bookings, billing, form intake, customer records and messages. Do not automatically enable payments, send communications, register accounts, buy domains or publish sites because an owner requested a draft.
- Respect opt-in consent, licensing, GDPR/privacy, accessibility, provider/platform rules and industry-specific legal requirements. A feature requiring specialist certification, manual approval or an unsupported external provider remains unavailable until the real conditions are met.
- Keep customer ownership, editable content, transparent subscription/credit consumption, export/portability where practicable, and explicit separate third-party or app-store costs as product constraints.

### Autonomous quality and continuous intelligence
- Prefer generation and revision driven by **actual business content**, responsive layouts and independently collected design evidence, not hardcoded industry stereotypes or invented confidence scores.
- Compare alternative website and app experiences across mobile, tablet and desktop; preserve owner-authored edits, design preferences, version history and reversible private proposals. Screen measurements and synthetic tests are evidence of those limited checks only, never proof of real-world usability or revenue.
- Make per-business memory and outcome-based evaluation foundational. Learn from owner-approved feedback and independently verified outcomes with revision/source tracking. Any cross-business aggregated learning must be explicit opt-in, privacy-protected and tenant-safe; it is not automatic model retraining.
- Keep the customer-facing interface radically simple: describe the goal, see BUSY's prepared result, optionally make changes by voice/text or directly on an element, then approve. Hide technical complexity unless it helps an informed decision.

### Permanent build-first development and acceptance policy
- Continue substantial, multi-workstream sweeps improving website composition, Business App functionality, shared primitives, AI planning, design quality and maintainability. **Do not stop at a finite list of industries, templates or modules.**
- Before implementing a capability, look for an existing reusable component or server boundary. Run low-cost static/type/syntax/security/regression and representative offline/unsigned-export checks each sweep; perform deeper code-health reviews periodically and full architectural reviews at milestones.
- Pursue theoretical completeness **until meaningful improvements become difficult to identify without real-world feedback**. At that point, explicitly tell the owner and recommend the separate, extensive hands-on/staging/paid-device testing and stabilisation phase. Do not substitute lengthy manual testing for ongoing cheap automated checks while building rapidly.
- Even after exhaustive theoretical preparation, real user journeys, physical devices, public-hosting behaviour, payment/booking/provider delivery and app-store release remain **unproven until independently exercised**. Do not call the platform finished or production-ready based only on code volume, proposals, source inspection or passing mocked tests.
- Preserve the north star: **"You tell Busy what needs doing. Busy does it."** The deciding quality measure is correctly completed, independently verified work with minimal business-owner effort.



## Permanent architecture decision — Release-wide integration contract
**Adopted: 13 October 2026. Status: mandatory acceptance criterion for the initial public release and all subsequent releases; this is a policy, not evidence that full integration currently works.**

### Non-negotiable launch requirement
- **Everything included in Busy Does It's first public release must work together as one coherent, reliable product, wherever features are meaningfully related.** The initial product may have a bounded feature set, and new capabilities may follow after launch, but no advertised launch feature may be an isolated demonstration that fails when the customer uses it with another advertised capability.
- Customers should describe outcomes in ordinary language while BUSY coordinates the Website Builder, Business Apps, Business Brain, Design DNA, bookings/calendar, customers/enquiries, content, marketing/discoverability, communications and Get Paid as appropriate to the requested task, supported permissions and enabled subscription.
- Do not claim that *all* features have to connect directly to *all* other features when no useful business relationship exists. Instead explicitly identify and verify every **relevant, supported cross-feature workflow and data handoff**. Shared business data must not diverge silently between surfaces.
- Keep a single canonical, tenant-isolated representation of approved business facts, identity, brand, customers, permissions and source-of-truth workflow states, with explicit ownership, versioning and provenance. Reuse services/events/contracts and policy checks rather than duplicating business logic in each screen or channel.

### Integrated-workflow acceptance, not just isolated feature checks
- Maintain a **launch feature inventory** with each feature's implemented/verified readiness, linked capabilities, dependencies, provider prerequisites, customer-facing promises, and relevant end-to-end journeys. Track a cross-feature **integration matrix** and assign each handoff an owner and automated regression coverage.
- Exercise customer journeys spanning multiple systems, including as applicable: create a business and reuse its Design DNA on website/app/social content; website or app enquiry to CRM to notification/follow-up; website or app booking to validated availability to calendar and customer record; quote/invoice/payment status to owner-approved customer communication; website publish/domain routing to searchable public content and measurable marketing outcomes.
- Treat state changes as real outcomes only with authenticated, authorised, tenant-scoped server-side receipts; use idempotency, retries, compensating actions/rollback and visible error states for partially failed provider operations. No silent data loss, phantom bookings, falsely marked payments, duplicated communications, cross-tenant leakage or "success" screens after failed delivery.
- Validate shared data synchronisation and permissions across iPhone/iPad/web/hosted sites and marketplace/standalone app surfaces as applicable, including offline/interrupted flows, subscriptions/credits, permissions revoked, external provider outages and failed actions.
- Continue low-cost automated type/lint/build/security/unit/contract/integration/regression checks during substantial build-first sweeps; expand cheap cross-feature tests as capabilities are added. Preserve the agreed transition to deep human/device/provider/staging testing once theoretical improvements slow down. Automated mocks alone do **not** certify launch readiness.
- Before the public release, run **real end-to-end staging and representative production-path verification** for all advertised, interconnected journeys, with evidence of expected results and recovery from failures. Verify what works, what remains unsupported and what third-party setup/costs are required.

### Release gate and scope discipline
- **No release while any included, advertised feature or required cross-feature connection is known to be broken, misleading or unverified.** Fix and verify the issue; otherwise explicitly propose removing/deferring the affected *entire customer promise* from launch scope for the owner's approval, rather than quietly shipping a disconnected or fake capability.
- New post-launch features follow the same integration contract before they become available as supported product capabilities. Document integration evidence and sign-off, not just lines of code, passing isolated tests or optimistic development summaries.
- Product north star: **One connected BUSY. One source of truth. Real completed outcomes. The customer shouldn't have to connect the dots.**


## Permanent architecture decision — Search and AI discoverability (Get More Customers)
**Adopted: 13 October 2026. Status: product requirement and future delivery direction, not a claim of an implemented SEO/GEO service.**

### Customer-facing promise
- Owners should be able to ask, in everyday language, **"Busy, help more customers find my business"**. BUSY should plan, explain simply, prepare and (where authorised) execute an integrated discoverability workflow inside **Get More Customers**. The owner should **not** need to understand SEO, GEO (generative engine optimisation), AEO, schema markup, backlinks or individual search-platform mechanics.
- Cover both **traditional search visibility** (including Google/Bing and relevant local search surfaces) and **AI-assisted discovery** (search answer engines and AI assistants that may cite or recommend public businesses). These are related, not separate customer products or guaranteed placement mechanisms.
- Treat discoverability as an ongoing, outcome-focused business service that cooperates with the Website Builder, App Builder, Business Brain, brand Design DNA, listings, marketing content and analytics rather than an isolated SEO checklist.

### Intended shared capability system
1. **Verified business foundation.** Reuse owner-approved business identity, service/location coverage, opening hours, qualifications, contact details, brand language and website ownership. Detect conflicts across website, directory listings and business profiles; request corrections instead of inventing facts, reviews or credentials.
2. **Technical and content discoverability.** Assess public indexing/crawlability, canonical URLs, redirects, robots/sitemaps, mobile performance, accessibility, metadata, internal linking, useful service/location pages and supported structured data (e.g. LocalBusiness where applicable). Make improvements through the common website publishing workflow; changes remain drafts until owner-authorised publication.
3. **Local trust and real-world reputation.** Help maintain accurate listings and eligible business profiles, encourage authentic customer feedback in provider-compliant ways, identify legitimate partnerships, earned coverage and useful citations/brand mentions. Avoid link schemes, purchased manipulative backlinks, fabricated mentions, review gating and unsolicited mass outreach.
4. **AI answer discoverability.** Produce clear, accurate, sourceable public business information and helpful content that AI search systems can independently discover. Where meaningful, monitor public AI-answer appearances or citations using transparent, repeatable samples; record prompt, engine, date, locale and sampling limitations. **No platform controls or guarantees that an AI assistant will include, cite or recommend a particular business.** Do not market speculative metadata tricks as proven ranking factors.
5. **Measurement and feedback.** Where accounts/permissions allow, integrate provider-supported performance signals (search impressions/clicks, indexed coverage, local actions, qualified enquiries/bookings and attributed conversions); separate verified analytics from estimates, model-generated suggestions and anecdotal AI mention tests. Log interventions, owner approvals, source provenance, costs, changes and observed outcomes in tenant-scoped feedback to evaluate real improvement over time.
6. **Autonomous planning with permission boundaries.** BUSY prioritises opportunities by business relevance, evidence, effort and expected value, prepares easy-to-understand proposals, and can safely perform low-risk authorised tasks. Publishing, paid campaigns, directory claims, public outreach, third-party account changes, spending and reputationally sensitive actions require the appropriate explicit consent/approval, provider access and rollback/receipts.

### Delivery sequence and acceptance
- **Foundation:** common public business facts, discovery readiness checks and website publishing-integrated fixes; transparent explanation of which checks actually ran.
- **Connected optimisation:** approved local-profile/listing workflows, provider-authorised search analytics, content recommendations, safe execution and clear before/after measurement.
- **Advanced learning:** privacy-safe prioritisation by observed business outcomes, and carefully qualified AI-answer visibility sampling; opt-in aggregated improvement only with tenant isolation and privacy controls.
- Require representative integration and staging tests before treating any provider operation as functional. Track capability readiness separately for planned, implemented, automated-verified, provider-tested and real-outcome-verified.
- Product principle: **the customer asks for more visibility; BUSY does the specialist work, explains material decisions in plain English and reports honest results without guaranteeing Google rankings, AI citations or revenue.**


## Current universal-builder implementation checkpoint — V3.211

- V3.210: a versioned, evidence-limited capability catalogue and one industry-neutral requirements planner support both website and Business App draft preparation.
- V3.211: approved **existing website section composition** now enters the existing private edit/undo/rebuild path, with draft/workspace/revision and exact-order checks. A separate owner review can prioritise **existing runtime-verified app screens** through the pre-existing server-mediated, optimistic-concurrency private coordinated-edit route.
- These changes do not extend the catalogue's actual transactional runtime, activate payments or customer account systems, or prove a real hosted booking/enquiry or device outcome. See docs/V3_211_REVIEWED_BUILDER_INTEGRATION.md.
- The next milestones are progressively more real reusable cross-surface server-owned functions, safe extension points, visual evaluation and verifiable outcomes; never confuse a planned capability with a completed task.

## Universal builder checkpoint — V3.212 shared customer requests

- Reuse the current Business App request state machine for future website and app enquiries and booking requests. Both builder surfaces must require one authoritative owner/tenant scoped request, authenticated receipt and independent booking confirmation. A website Contact link is not a transactional form.
- V3.212 adds the privacy-minimal review-only cross-surface contract, coordinated owner-facing readiness explanations, synthetically unverified status examples, static app width checks, and a version-checked private website contact-emphasis adjustment with existing undo.
- No live public website request endpoint, external notification, authenticated shared receipt adapter or independent diary commit has been deployed. These remain explicit prerequisites, not inferred capabilities.
- Detailed technical scope and limitations: docs/V3_212_SHARED_CUSTOMER_REQUEST_INTELLIGENCE.md.

## Universal builder checkpoint — V3.213 backend request receipts

- **Request verification must come from one server-owned record, not presentation or retry success.** V3.213 makes the signed-in Business App and guest mini-app Edge services share byte-identical minimal, business/app/request-origin-scoped saved-receipt rules. Guest booking confirmation requires consistent accepted request and same-business link, and still does not prove an independently delivered calendar or notification.
- Existing signed-in idempotent request and guest transactional intake remain the real implemented paths. The generated website builder has **not** acquired a public request-submission endpoint; exposing one requires owner-approved, authenticated/site-origin-safe, abuse-controlled, idempotent server adapter and independent staging tests.
- For committed owner request-status changes, downstream event, unread, push and dashboard refresh failures are separate outcomes and must not be presented as a lost database write or trigger blind retries. Future atomic outbox/compare-and-send guarantees require a reviewed migration and deployment.
- Implementation and evidence limits: docs/V3_213_SHARED_REQUEST_RECEIPTS_AND_RECOVERY.md.

## Universal builder checkpoint — V3.214 website-to-live-app request handoff

- V3.214 adds a **real, owner-approved private website link** to the already-existing public live Business App enquiry and booking-request journey. The owner-scoped planner requires a current website/business/revision, real contact information, exact live app version and enabled supported module. The existing private editor/rebuild/undo/owner approval route saves or removes that exact canonical HTTPS link; only separately approved website publication can make it public.
- The public Business App handoff Edge handler independently checks the **current live version's module** at click time and rejects unavailable actions. The website renderer verifies owner approval and exact canonical destination before exposing a link. This does **not** install a public website form, create a new request, deliver a notification or independently confirm a diary booking.
- The same evidence state is visible in Business Brand DNA without conflating a private draft link with a tested live visitor journey. Detailed source, tests and outstanding public intake milestones: docs/V3_214_WEBSITE_APP_REQUEST_HANDOFF.md.
- Next: build a genuine website-hosted request service only with source-of-truth site ownership, visitor anti-abuse protections, transactional idempotent save/recovery, privacy and consent, owner inbox/approval and isolated staging evidence. Do not bypass existing shared request state/booking safeguards or activate integrations based on screenshots or AI proposals.

- **V3.214 published-version continuity:** a current live Business App version must remain usable through public link, guest challenge/intake, signed-in discovery and marketplace browsing while the owner edits an unpublished draft (`update_pending`). Public data comes from the immutable `current_live_version_id` with a verified live version state, never the draft. Owner-approved website enquiry/booking links are separate handoffs to that verified public app, not hosted website forms.

## Universal builder checkpoint — V3.215 immutable website request links

- Owner-approved website → published Business App enquiry/booking links now **pin the exact app UUID and immutable current live version UUID**, not a reusable public slug alone. The public Edge redirect independently rejects altered/old/mis-scoped web intent links, missing modules and republished app versions **before recording a handoff intent**. Previously approved unbound website links require new owner review and website republication before the stricter route can accept them.
- A generated website's existing Contact block still is **not a transactional enquiry form**. Read-only website enquiry readiness explains tenant-bound published-site identity, abuse/challenge, privacy/consent, bounded fields, idempotency, stored receipts, owner inbox and isolated browser/device testing, keeping unimplemented steps false rather than displaying an imaginary full capability.
- Owner handoff links now have keyboard-visible focus, accessible touch-sized styling and a narrow-phone fallback. Static CSS and offline regressions are not measured visual quality or evidence of public customer submissions.
- Details and deployment prerequisites: docs/V3_215_IMMUTABLE_WEBSITE_HANDOFF_AND_INTAKE_READINESS.md.

## V3.46 Production Domain Activation
### BUSY-owned platform domain
- The platform root defaults to `busydoesit.co.uk`. Default BUSY websites use first-level hostnames such as `site-<slug>-<business-suffix>.busydoesit.co.uk`; `sites.busydoesit.co.uk` is reserved as the SaaS CNAME target and `origin.busydoesit.co.uk` as the fallback-origin record.
- Keeping BUSY-owned default websites at the first subdomain level means they can use the zone's normal proxied certificate coverage, while customer-owned vanity domains continue through Cloudflare for SaaS certificate provisioning.
- Default tenant hostnames retain the slug + business-id suffix strategy, so two businesses with the same trading name cannot collide.

### DNS preflight before provider activation
- `busy-website-provider` can query authoritative public DNS without a Cloudflare API token. It verifies whether the root domain's NS answers are Cloudflare nameservers and whether the BUSY website base hostname has A/AAAA/CNAME resolution.
- This preflight does not provision anything. It exists so BUSY can distinguish registrar propagation from later Cloudflare-for-SaaS configuration and from actual routed-site health.
- Provider status is fetched server-to-server by `busy-website-publish`; the client receives only readiness booleans, public hostnames and public DNS state, never provider credentials.

### Activation truth model
- **Nameservers active** means the root zone is authoritative on Cloudflare.
- **Provider configured** means BUSY has the restricted Cloudflare API token and SaaS Zone ID. **Platform bootstrap ready** additionally requires the Cloudflare Account ID; the friendly CNAME target and fallback hostname are deterministic BUSY-owned public configuration, not secrets.
- **Base hostname routable** means public DNS resolves the BUSY tenant website namespace.
- **Routing Worker active** means the BUSY Worker script and wildcard `*/*` zone route are both present. More-specific no-Worker routes protect `busydoesit.co.uk/*` and `www.busydoesit.co.uk/*` from being swallowed by the SaaS router.
- **Routing Worker active** means the BUSY Worker script and wildcard `*/*` zone route are both present.
- **Fallback origin active** means Cloudflare for SaaS has accepted `origin.busydoesit.co.uk`; the record itself is intentionally originless/dummy because the Worker is the real application origin.
- **Custom hostname active** still requires Cloudflare hostname/SSL state plus BUSY's independent health check to observe the expected deployment.
- These states are intentionally not collapsed into one green badge, preventing DNS or provider configuration from being mistaken for a genuinely working customer website.

### Multi-tenant website origin
- `busy-website-origin` is an unauthenticated **public-content-only** edge boundary. It accepts a hostname/path, resolves only a current live BUSY website or a verified Cloudflare-routed custom domain, and serves the matching file from the public `busy-website-public` storage bucket.
- It never exposes drafts, private previews, Business Brain data, customer records, service-role credentials or arbitrary storage paths. Hostnames are exact matched and object paths reject traversal.
- `cloudflare/busy-website-router/worker.js` is the edge router template. It preserves BUSY's root/marketing hostnames, routes tenant/custom hostnames to `busy-website-origin`, and uses Cloudflare's edge cache so normal traffic does not put the operational database on every page request.
- The provider bootstrap can upload the same router logic through the Cloudflare Workers API once the restricted account credentials are available, then attach a wildcard Worker route that also captures Cloudflare-for-SaaS custom-hostname traffic.

## V3.45 Guest Mini App Request Boundary
### Public request service
- `busy-mini-app-guest` is the only unauthenticated request-creation boundary. Direct Data API access to guest challenges and Mini App requests remains revoked.
- `busy_mini_apps.public_web_schema_version` prevents BUSY from claiming that a pre-V3.45 static artifact already contains guest forms. Existing live artifacts stay unchanged until the owner republishes through the normal approval gate; publish/rollback then writes schema version 2.
- A guest form first requests a short-lived challenge for one live Mini App version and one enabled request module. Submission must present the challenge token, a small proof-of-work, the same keyed browser fingerprint and valid bounded customer payload.
- The challenge is consumed inside `busy_mini_app_create_guest_request`, which locks the challenge row, rechecks the current live Mini App version, enforces recent browser/contact rate limits, inserts the request and writes the lifecycle event in one database transaction.
- Guest request access uses a high-entropy token derived server-side from the one-time challenge. Only its SHA-256 hash is stored with the request.

### Identity and privacy semantics
- Signed-in and guest requests share one downstream request/customer-work model, but their identity assurance is explicit. `signed_in_account` and `guest_browser_challenge` are never conflated.
- A guest browser challenge is anti-abuse evidence, not proof that the typed email/phone belongs to the person submitting the form. Owner UI and Operator wording preserve that distinction.
- Challenge fingerprints are keyed hashes of edge request signals; raw IP addresses are never persisted by the guest-request tables.
- Guest challenge rows are ephemeral and pruned after expiry. Long-lived request records retain the business/customer request itself, not the browser fingerprint.

### Conversation and booking safety
- V3.45 does not create a fake customer chat channel for guests. Owner chat composition is disabled for guest-originated requests; the supplied contact details are the current reply path.
- Guest browser receipts can read only the narrow status of the request they hold the secret token for.
- Booking requests remain `received/reviewing/accepted/declined/closed` request workflow records. The existing Draft/Confirmed booking bridge remains the only path that can represent actual BUSY booking state.

## V3.44 Public Mini App Web Experience
### Immutable static web artifact
- `busy_mini_app_versions` now carries public-web artifact metadata, while `busy_mini_apps` points at the web artifact corresponding to the current live immutable version.
- Publication renders from `version.config` only. That configuration is already the approved public Mini App projection; private Business Brain/customer state is not consulted by the renderer.
- The worker path is intentionally lightweight and synchronous because a Mini App artifact is one bounded HTML document. Versioned objects use long cache lifetimes; the live alias uses a short cache lifetime.
- A publish/rollback builds the target artifact **before** switching the live database pointer. If artifact creation fails, BUSY does not silently move the app to a version whose public web representation is missing.

### Public customer boundary
- The stable `busy-mini-app-link` URL resolves a live Mini App then redirects normal browsing to its cached public Storage artifact.
- Enquiry/booking buttons return through the same server boundary with an explicit intent. That records an action-attempt counter and opens a narrow `busydoesit://apps/<slug>?intent=...` route.
- V3.44 does not accept anonymous customer request payloads. Browsing is public; transactional enquiry/booking creation remains authenticated and server-mediated.
- Direct-link access is not equivalent to marketplace listing. `discoverable=false` hides directory search but does not revoke an exact owner-shared public link while the Mini App is live.

### Bounded funnel analytics
- `busy_mini_app_entry_daily` supports web-view, action-intent and app-open stages. Existing legacy landing counters remain readable for compatibility.
- Owner/Operator context receives only 30-day aggregates plus the genuine request count. No raw visitor history or per-scan identity is returned.
- Funnel semantics are strict: web view ≠ action intent ≠ in-app open ≠ customer request ≠ confirmed booking.

## V3.43 Mini App Direct Customer Entry
### Stable public entry boundary
- Live Mini Apps now have two distinct visibility concepts: **marketplace discoverability** and **exact-link accessibility**. `discoverable=false` removes a Mini App from directory search but is not treated as an access-control mechanism for an owner-shared public link.
- The canonical customer entry URL is currently the BUSY Supabase Edge Function `busy-mini-app-link?slug=<public_slug>&source=<source>`. It resolves only live Mini Apps and hands off to `busydoesit://apps/<slug>`.
- This indirection means printed QR codes can remain stable while the delivery layer later changes to a BUSY-owned universal-link domain or App Store fallback.

### Entry attribution without inflating business outcomes
- `busy_mini_app_entry_daily` stores bounded daily counters by Mini App, source and stage. `landing` means the HTTPS entry page was reached; `app_open` means an authenticated user opened the live Mini App in BUSY.
- `busy_mini_app_record_entry` atomically increments the day's counter, so thousands of scans do not create thousands of analytics rows and BUSY does not retain per-visitor QR/share browsing records.
- Landing visits and app opens are never treated as enquiries, bookings or customers. Those outcomes continue to require the existing explicit request flow.
- Owner status calls the server-only `busy_mini_app_entry_summary` aggregation for a 30-day summary. Direct Data API access is revoked from anonymous/authenticated clients; both entry functions write through service-role server boundaries.

### Deep-link continuation
- The app parses only the narrow `busydoesit://apps/<slug>` route for Mini Apps. A signed-out user keeps a pending slug/source through the account-access hop; once authentication is available BUSY opens the intended Mini App.
- Entry source is attribution metadata, not authorisation. The backend independently verifies that the target Mini App is live before returning its immutable live version.

## V3.42 Mini App Notifications & Conversation Centre
### Unread state without per-message polling
- `busy_mini_app_requests` owns bounded business/customer unread counters plus last-read timestamps. This keeps list/status queries cheap as the number of messages grows.
- Server-only `busy_mini_app_bump_unread` performs atomic increments so concurrent replies cannot overwrite each other's unread count.
- Business and customer read state are intentionally separate. Opening a conversation clears only the viewer's side.

### Bounded request conversation loading
- Owner status and My BUSY Apps no longer fetch all conversation bodies. The dedicated request-detail endpoints load only the latest 30 messages and expose a cursor for older pages.
- Request lifecycle events stay on the same detail timeline so `received → reviewing → booking confirmed` is distinguishable from human-written messages.
- Customer detail access is constrained by `consumer_user_id`; business detail access is constrained by tenant membership plus the request's `business_id`.

### Server-side notifications
- Signed-in users may register their Expo token through the authenticated BUSY Apps server boundary; the server never accepts another user's target identity from the client.
- Business notifications resolve owner/admin recipients from `busy_business_memberships`. Customer notifications resolve the consumer from the stored request.
- Dispatch reuses `busy_push_devices` and `busy_push_deliveries`. Delivery rows claim a deterministic notification key before Expo delivery, then retain provider receipts for dedupe/audit.
- Push payloads carry only the request route/role/request ID and public app slug needed for navigation. They do not carry private customer records or Business Brain evidence.

## V3.41 Mini App Conversation Loop
### One request, one shared conversation
- A Mini App enquiry/booking request owns a durable conversation thread in `busy_mini_app_request_messages` rather than a separate chat identity or CRM.
- Business writes require tenant membership; customer writes require that the request belongs to that signed-in consumer.
- The server derives business, Mini App and request ownership from stored records; clients cannot choose another tenant or recipient.
- Direct Data API access stays revoked; both sides use the `busy-mini-apps` Edge Function.

### Retry and lifecycle safety
- Each send uses BUSY's request idempotency key so a retry resolves to the same stored message.
- Declined/closed requests reject new messages.
- A first owner reply may move `received` to `reviewing`; messaging never marks a booking accepted and never confirms a diary slot.
- Conversation history is projected separately into owner status and My BUSY Apps, preserving tenant/customer visibility boundaries.

## V3.40 Mini Apps Customer Journey Bridge
### One customer journey, not a Mini App CRM
- V3.40 deliberately does not create a second standalone customer database for BUSY Apps.
- `busy_mini_app_requests` remains the durable external-request source record; once an owner reviews it, the client creates/links the existing BUSY snapshot customer/action record.
- `busy_mini_app_request_links` stores the durable cross-device bridge to the snapshot customer ID and optional action ID. Re-importing the same request therefore resolves to the existing link instead of creating another customer/action.
- Deterministic Mini App source/activity IDs make the client-side import itself duplicate-resistant if a network failure happens before the bridge acknowledgement is stored.

### Booking safety boundary
- A Mini App booking submission is a request only.
- On owner review it becomes a BUSY booking action with `bookingStatus=Draft`, `done=false`, origin `mini-app`, and the original preferred-date text.
- Relative/free-form date wording is not converted into a made-up confirmed date. Exact ISO/UK dates may be carried into the Draft; otherwise the owner chooses the actual slot.
- The existing Work booking confirmation path is the only point that updates the Mini App request to accepted/confirmed journey state.
- This preserves the existing BUSY calendar/customer rules and prevents a public customer action from bypassing owner control.

### Consumer relationship layer
- `busy_mini_app_consumer_apps` is a private server-owned relationship between a signed-in BUSY user and Mini Apps they have actually opened or used.
- Opening a live listed Mini App creates/refreshes that relationship. Sending a request also updates `last_action_at`.
- Customers can favourite apps; favourites are a presentation preference, not a business endorsement/ranking signal.
- A previously used live app may remain reachable from My BUSY Apps even after the owner removes it from marketplace discovery. New directory users cannot discover it.
- Consumer request history is read from the user's own `busy_mini_app_requests` rows through the Edge Function, never through direct table access.

### Request lifecycle audit
- `busy_mini_app_request_events` records server-side lifecycle events such as received, reviewing, accepted, declined, customer-link creation, Draft booking creation and real booking confirmation.
- Owner/admin status changes and customer submissions create audit rows server-side.
- Request status semantics remain conservative: linking a booking request into BUSY keeps it Reviewing; only a confirmed BUSY booking moves it to Accepted.

### Scale/security
- The new consumer/link/event tables are RLS-enabled but expose no anon/authenticated table privileges; all access is mediated by `busy-mini-apps`.
- Request contact fields are normalized into bounded columns for matching/querying while the bounded request payload remains available as source evidence.
- Owner Home and BUSY Operator consume the same server request/link state, so business workflow visibility does not depend on the Mini App Builder screen being open.

## V3.39 BUSY Apps Marketplace Foundation
### Product model
- A Mini App is configuration over a controlled module catalogue. BUSY does not generate arbitrary application code per business.
- One shared runtime can serve many businesses while each tenant owns its configuration, versions, requests and public identity.
- Module capability/state is platform-owned. Planned modules remain disabled until their implementation is genuinely available.

### Tenant/app/version model
- busy_mini_apps is unique by (business_id, app_key) and carries private draft configuration plus live/preview pointers.
- Public slugs include a tenant-derived suffix so same-name businesses cannot collide.
- busy_mini_app_versions is immutable for source/configuration fields. Only publication lifecycle metadata can change.
- Config hashes prevent duplicate immutable versions for identical module configurations.
- Rollback switches the live pointer to a previously published immutable version.

### Marketplace boundary
- The database tables are not granted directly to anon or authenticated.
- busy-mini-apps is the authenticated server boundary for owner management, marketplace search/detail and customer actions.
- Directory search returns only live + discoverable apps and only public-safe fields/configuration.
- Live publication and discoverability are separate states and both require explicit owner approval.

### Shared public profile
- Mini App drafts can be assembled from current approved Brand Brain public facts.
- Published Mini Apps synchronize those approved facts into busy_public_business_profiles.
- Websites and Mini Apps therefore converge on one public identity layer while retaining independent immutable publication versions.

### Customer actions
- Enquiry and booking_request are the first action modules.
- Booking requests are explicitly request-only; acceptance remains a business-side decision.
- Requests resolve business_id from the live Mini App server-side, never from consumer-supplied destination data.
- Requests are authenticated, server-mediated, idempotent and rate-limited.
- Business owners/admins can review/accept/decline requests without automatically turning them into confirmed bookings.
- A later sweep can bridge accepted booking requests into the existing Work/Calendar confirmation flow.

### Scale path
- Thousands of businesses do not imply thousands of separately compiled apps.
- Shared code + module versions + per-tenant configuration keeps fixes, security updates and new capabilities centrally deployable.
- Search/indexes, tenant-safe public slugs, immutable configs and bounded directory responses establish the first marketplace scaling boundary.
- The same model can later support richer vertical packs, loyalty, payments and business-specific customer experiences without abandoning the shared runtime.
## V3.38 Website Delivery & Real-World Signals
### Provider-neutral delivery boundary
- BUSY stores generic delivery fields on `busy_websites` and `busy_website_domains`; Cloudflare-specific API shapes stay inside `busy-website-provider`.
- Custom-domain lifecycle remains: BUSY ownership verification → provider provisioning → provider hostname state → certificate state → customer DNS → BUSY public deployment health.
- Provider `active` plus SSL `active` is necessary but not sufficient for BUSY routing `active`. The public hostname must serve the expected `busy-deployment` marker.
- Provider credentials never enter React Native, GitHub, public configuration or tenant tables. They belong in Supabase Edge Function secrets.

### Cloudflare for SaaS adapter
- Uses the Custom Hostnames API behind a private server-only Edge Function.
- The provider's custom-hostname ID is persisted in `provider_hostname_id`; normalized status/error details live in `provider_status`.
- Provider ownership/SSL validation records and the managed traffic CNAME are normalized into `required_records` so the app can explain exactly what the domain owner must configure.
- Scheduled sync polls only provider-created hostnames. It never auto-creates an external hostname merely because a local domain record exists; owner/admin preparation remains deliberate.

### Default BUSY addresses
- `default_hostname` and `default_url` reserve tenant-safe BUSY-owned addresses.
- The reserved hostname includes a business-specific suffix, so two businesses with the same trading name cannot collide.
- V3.38 does not declare a reserved address live until the BUSY platform domain/routing layer is externally configured and health-verified.

### Real traffic signals
- `busy-website-signals` reads aggregated Cloudflare HTTP analytics and writes tenant-scoped daily rollups.
- HTTP requests, Cloudflare visits, edge bytes, page views, unique visitors and enquiries are separate fields because they are not interchangeable measurements.
- Cloudflare traffic is filtered back to known BUSY hostnames before tenant rows are written.
- Provider aggregate result limits are surfaced as partial/error state rather than silently treating a truncated response as complete.

### Usage/cost control
- `busy_website_usage_daily` rolls up per-business delivery/deployment usage so pricing and fair-use decisions can be evidence-led.
- `busy_refresh_website_usage_daily(date)` aggregates internal deployment/artifact/health usage with external request/visit/egress rollups.
- A daily Cron refresh persists historical operational usage even when no app is open.

### Enquiry attribution
- `busy_website_enquiry_attributions` is the future join point between public website conversions and BUSY customer journeys.
- It is intentionally not populated from generic traffic. A real approved public enquiry module/provider must emit the event.
- Authenticated tenant members may read their own attribution rows; writes remain server-side.

### Background operations
- Website publish worker: every minute.
- Website health: every five minutes.
- Delivery-provider sync: every five minutes.
- Traffic signals: hourly.
- Usage rollup: daily.
- Provider/signal workers use private internal tokens and return `configured:false` rather than failing when the external Cloudflare account gate has not been completed.

## V3.37 Live Website Management 2.0
### Structured multi-page model
- `websiteDraft.pages` and `websiteDraft.navigation` are generated from the same approved section model as the editor.
- Page structure remains configuration, not separate generated codebases. This preserves one controlled editing/versioning path and is reusable by future public surfaces.
- The hosted worker renders each configured page from the immutable deployment source. Private previews use per-page signed URLs; public Storage pages use exact object paths until a domain router provides clean URL rewriting.
- Public HTML includes `busy-deployment` and `busy-page` metadata for operational verification.

### Change-aware immutable deployments
- V3.37 adds `change_label`, `change_summary` and `page_count` to each deployment.
- Change metadata is derived before deployment creation by comparing the new structured draft with the current live deployment source.
- The deployment immutability guard now protects these fields together with the original source/hash/version fields.
- Rollback therefore restores a known immutable source version and its corresponding shared public profile.

### Shared public-business profile
- `busy_public_business_profiles` is the approved public projection boundary between private business knowledge and public experiences.
- It contains only public-safe structured fields such as display name, business type, service area, contact details, public services, approved public assets, theme and page definitions.
- Writes are server-mediated. Authenticated business members may read their own projection; anonymous Data API access is not granted.
- The profile is updated at hosted-preview preparation and moved to live state only when the corresponding deployment becomes live.
- This table is intentionally designed for reuse by the future BUSY Mini-App/marketplace engine so website and mini-app surfaces do not create independent copies of business truth.

### Health monitoring
- `busy-website-health` is a private server-only Edge Function.
- Published pages expose the expected immutable deployment ID in HTML metadata.
- A health check validates HTTP reachability, response time and the observed deployment marker.
- A 200 response with the wrong/missing marker is `degraded`, not healthy.
- `busy_website_health_checks` stores bounded tenant-scoped history; records older than 30 days are pruned by the health worker.
- Supabase Cron wakes the health checker every five minutes; each invocation takes a bounded oldest-first batch so monitoring scales through capacity/batch tuning rather than app redesign.

### Analytics boundary
- `busy_website_analytics_daily` stores aggregate daily page views, unique visitors and enquiries by tenant/site/page/source.
- V3.37 does not insert a database row for every visitor event.
- Raw request/event collection belongs at the CDN/analytics provider edge and should be rolled up into this table asynchronously.
- This protects the BUSY operational database from becoming the serving/analytics hot path for public traffic.

### Domain truth model
- Domain ownership, routing and SSL are separate durable states.
- `busy_website_domains` now includes `routing_status`, `provider_hostname_id`, `routing_target`, `required_records`, `provider_status` and `last_checked_at`.
- The current TXT ownership flow remains real and isolated per tenant.
- Routing remains `not_configured` and SSL remains non-active until a genuine provider adapter confirms otherwise.
- A future provider adapter can map Cloudflare-for-SaaS-style custom-hostname and certificate statuses into these provider-neutral fields without changing the app data model.

### Conversational management safety
- Exact owner-provided public facts can update a private draft without a public confirmation.
- Safe supported edits include exact headline/tagline/contact changes, named service add/remove/reordering and deterministic layout/visibility changes.
- Broad requests that would require invented public facts (for example an unspecified “winter update”) do not fabricate services, offers, prices or claims.
- Publishing and rollback remain separate public-state actions with native owner approval of the exact immutable version.

## V3.36 Multi-Tenant Website Publishing Platform
### Tenant boundary
- The fundamental key is `business_id`, not user ID, filename or device ID.
- `busy_websites` owns one or more website projects for a business; V3.36 currently uses the `main` site key while retaining a one-business/many-sites schema.
- `busy_website_deployments`, `busy_website_domains` and `busy_website_publish_jobs` all repeat the business tenant ID deliberately so policies, indexes, audit queries and worker checks do not need to infer tenancy from opaque paths.
- Existing `busy_business_memberships` remains the authority for tenant access. Members may read their tenant website metadata; only owner/admin requests may prepare/publish/rollback or create/verify domain records through the server API.

### Immutable deployments and live alias
- Each website deployment receives an atomic version number and content hash.
- A database trigger makes tenant/site/version/source/hash/source-draft fields immutable after creation.
- The public live site is not an editable deployment row. It is a stable CDN object plus `current_live_deployment_id` pointer to one immutable approved deployment.
- Publishing a newer version marks the previous current deployment superseded but retains it as a rollback target.
- Rollback regenerates the stable live alias from an already-published immutable deployment; it does not mutate historical source content.

### Queued publishing
- `busy_website_publish_jobs` is the durable audit/status record.
- Postgres queue `busy_website_publish` carries only server-side job IDs.
- A partial unique index allows only one active `prepare`, `publish` or `rollback` job for a deployment at a time, protecting against duplicate taps and concurrent devices.
- `busy-website-publish` accepts authenticated app requests, verifies business membership and performs no heavy hosting work synchronously.
- `busy-website-worker` is stateless and server-only. It pulls batches from the durable queue, writes status, prepares assets/HTML, retries failures and archives completed messages.
- A Supabase Cron job wakes the worker every minute through a private token stored in `busy_internal_config`. App requests may also wake the worker immediately.
- This lets worker concurrency/capacity scale separately from app traffic.

### Storage/CDN model
- Original customer/job/social images remain in private BUSY source storage.
- Hosted preview assets are copied only from recorded approved storage paths into the private `busy-website-preview` bucket.
- Public deployment assets are copied into `busy-website-public` under `business_id/website_id/deployments/deployment_id` paths.
- Immutable public assets/version pages may use long CDN caching; the stable `business_id/website_id/live/index.html` alias uses a short cache lifetime so approved version switches propagate quickly.
- Public visitors load static files. Normal site traffic does not execute BUSY AI, load the business snapshot or require the mobile app.

### Go Live safety
- Preparing a hosted preview is non-public and may be initiated without a publication confirmation.
- Publishing and rollback are public-state changes and require an explicit native owner confirmation naming the exact version.
- BUSY Operator intents for Go Live/rollback only route the owner to the review flow; voice alone cannot publish.
- `ownerApproved=true` is required again at the server API boundary, so the UI is not the only safety control.

### Domains
- `busy_website_domains` reserves each hostname globally to one website/business.
- V3.36 supports DNS TXT ownership verification using `_busy-verify.<hostname>` and a tenant-scoped verification token.
- Domain ownership, DNS routing and TLS/SSL are intentionally separate states.
- `routing_provider='unassigned'` and `ssl_status='pending'` remain truthful until a real custom-domain routing provider is connected. V3.36 does not fake DNS changes, certificate issuance or domain purchase.

### Scale properties
- Tenant data is indexed by business and common deployment/job state paths.
- Public read traffic is offloaded to Storage/CDN.
- Deployment work is asynchronous/durable and can be processed by additional workers.
- Identical draft content is content-hash deduplicated per website.
- Site creation, deployment creation and publish jobs have race/concurrency protection.
- Failure for one business is recorded against that tenant/deployment/job and does not alter another business's live pointer.

## V3.35 Website Builder
- `src/domain/websiteBuilder.js` consumes `brandBrain.websiteBrief` and produces one persisted `websiteDraft`. Brand Brain remains the source of business/public identity truth; Website Builder owns presentation structure only.
- The draft is intentionally structured before it is rendered: theme, sections, SEO metadata, readiness snapshot, source summary and publish state are stored separately from generated HTML.
- Section generation is evidence-led. Services require existing BUSY service records; testimonials require explicit Brand Brain public-use approval; gallery/hero imagery comes from marketing-approved assets; contact details come only from Brand Brain public contact fields.
- Internal service values and planning durations are excluded from public website output by default.
- `renderWebsiteHtml()` generates a static semantic HTML representation from the same draft used by the mobile preview. V3.35 does not treat local device image URIs or private storage paths as publicly hosted assets.
- `applyWebsiteInstruction()` is deliberately narrow and deterministic in V3.35. It may change safe presentation state such as theme mood, hero prominence and section visibility. Unsupported content rewrites are not guessed.
- `websiteDraft` is persisted in the existing business snapshot. Rebuilds use the latest Brand Brain and increment `generation`.
- BUSY Operator receives a bounded `websiteBuilder` context and supports `website_build`, `website_edit` and `open_website`.
- These three intents are non-public internal-draft actions and may auto-apply from voice without a second confirmation tap. They are not classified as customer/public record changes.
- V3.35 has no hosting provider, deployment credential, DNS write, domain purchase, SSL provisioning or live-publication action. `publish.enabled` remains false and `publicStatus` remains “Not published”.
- The next website publishing/hosting layer must preserve an explicit owner-controlled go-live boundary and resolve website assets into publishable hosted URLs before deployment.

## V3.34 Brand Brain / Business Identity
- `src/domain/brandBrain.js` is a pure projection over the existing business record plus one persisted `brandProfile` object. It does not replace business name, trade, postcode/radius, services, customer records or connected-account truth.
- `brandProfile` owns only public-identity fields that previously lacked a stable home: descriptive copy, contact/public links, voice/style, story, differentiators, service descriptions, FAQs, explicitly approved testimonials and hero selection.
- Approved website-photo candidates are derived from job photos with `marketingOk=true` and reusable cloud social media. V3.34 never upgrades an unapproved customer image into public marketing material.
- Website readiness is a deterministic checklist and consistency layer. It is guidance for generation readiness, not an assertion that every optional brand field is complete.
- High-severity readiness checks cover missing business name/type/service area/services/contact route. Review checks cover issues such as connected social accounts without public profile links or malformed domain text.
- `websiteBrief` is the stable V3.35 handoff. It contains the recorded business identity, service master, public contact/service area, voice/style, approved FAQs/testimonials and approved image references.
- `src/screens/brandIdentity.js` is the owner-facing editor and evidence surface.
- Positive feedback remains separate from public testimonials. A testimonial enters Brand Brain only through explicit owner approval.
- BUSY Operator receives a bounded Brand Identity summary and `business_identity_summary` is answer-only. It may identify gaps and inconsistencies but may not invent missing public facts.
- Customer reply drafting may use a recorded Brand Brain tone of voice, but existing contact-preference and duplicate-contact protections still outrank style.
- Social Media AI receives sanitised tone, differentiators, public description/service-area wording and service descriptions. These are context, not permission to invent unsupported marketing claims.
- V3.34 adds no website rendering, publishing, hosting, DNS or autonomous public-update authority. Those remain future gates.

## V3.33 Follow-up Engine / Communications Bridge
- `src/domain/followUpEngine.js` is a pure prioritisation layer over V3.32 Communications Hub. It consumes communication threads and returns follow-up lanes, review timing, recovery opportunities and provider-readiness state without persisting a second communication model.
- Lane order is intentional: **Reply now** outranks **Follow up today**; **Waiting** suppresses duplicate chasing; **No chase** and **Do not contact** prevent BUSY from inventing unnecessary outbound work.
- Incoming customer evidence outranks chase timers. Contact preference and the V3.32 duplicate-contact guard remain hard constraints.
- Waiting review dates are guidance only. They do not themselves create send authority or prove that another message is appropriate.
- Warm recovery is limited to saved enquiry/quote follow-up journeys and remains separate from cold marketing.
- `src/screens/followUpEngine.js` is the owner-facing prioritisation/review surface. Draft preparation routes through the existing one-customer BUSY reply-draft path.
- Provider bridge fields model channel availability and transport state without claiming a real provider send. Future SMS/email/WhatsApp providers must attach behind the same customer thread + approval boundary.
- Home, Work, Communications Hub and Communication Thread all read the same Follow-up Engine object from AppController.
- BUSY Operator receives a bounded Follow-up Engine context. Chase/follow-up questions must preserve the deterministic lanes and may not promote a Waiting customer merely to create activity.
- V3.33 does not grant autonomous customer-send authority.

## Entry
- `BusyDoesItApp.js` — tiny root entry point.
- `src/app/AppController.js` — central state/orchestration layer and navigation handoff.

## Core
- `src/core/runtime.js` — shared configuration, seed data, date/value helpers, intake/reconciliation helpers and Business Brain utility logic.
- `src/theme/styles.js` — the shared React Native stylesheet.
- `src/components/ui.js` — reusable BUSY UI primitives, brand marks, shell, cards, buttons, fields, choices and explanation components.

## Screens
- `src/screens/onboarding.js` — setup/onboarding.
- `src/screens/home.js` — Home and background-work surfaces.
- `src/screens/talk.js` — Talk to BUSY voice/text command interface and confirmation surface.
- `src/screens/work.js` — weekly command centre, diary, pipeline, work goals and reply actions.
- `src/screens/intake.js` — BUSY Inbox, Quick Capture and intake history.
- `src/screens/customers.js` — customer records, jobs, post-job bundle, follow-ups, reviews and reactivation offers.
- `src/screens/social.js` — Social Control Centre, creator/draft flows, recommendation feedback and Business Brain.
- `src/screens/results.js` — Results and outcome capture.
- `src/screens/settings.js` — business data, account/privacy, business settings and connected accounts.
- `src/screens/index.js` — screen registry used by the controller.
- `supabase/functions/busy-command/index.ts` — authenticated voice transcription + constrained command routing.

## Refactor rules
1. V3.16 and the original V3.17 branches remain untouched fallbacks.
2. This refactor should not alter customer-facing behaviour, safety boundaries, cloud tenancy or publishing authority.
3. New work should go into the relevant domain module instead of rebuilding a monolithic root file.
4. Public messaging, posting and spend remain behind the same explicit owner approvals.
5. The Snack publisher includes the whole `src/` module tree and syntax-checks every JS/JSX file before publishing.

## V3.19 Operator layer
- The controller persists bounded conversation turns, the last operating snapshot and a small internal audit history.
- The busy-command Edge Function receives recent conversation context plus current saved-business context and returns a strict structured operator result.
- Operator results can be an answer, clarification, safe action, editable draft or multi-step plan.
- Record-changing actions keep explicit confirmation and a reversible pre-change snapshot where supported.

## V3.20 Controlled Autopilot
- `src/screens/autopilot.js` is the owner-facing authority, Approval Inbox, Needs your input and plain-English rule surface.
- Autopilot preparation is derived from the same saved customer/quote/job evidence used by Home and Business Brain; it does not create a separate hidden source of truth.
- Safe preparation can write drafts internally, but external actions route back through the existing customer/social approval screens.
- Trusted mode reuses the established high-confidence intake auto-file evaluator rather than introducing a broader write authority.
- Operator and Autopilot state are both included in the normal local cache and cloud business snapshot.

## V3.21 Business Memory
- `src/screens/memory.js` exposes the long-term evidence ledger, confidence stages, recent learning changes and service/value/channel/repeat memories.
- Business Memory snapshots are derived only from saved business outcomes and retained in the normal business snapshot; they are not a hidden model-side profile.
- Samples below three cannot affect rankings. Later stages progressively unlock bounded influence while freshness still reduces old evidence.
- BUSY Operator receives a compact memory summary so explanations of changed recommendations can cite the actual saved evidence.

## V3.22 Executive Briefing
- `src/screens/executive.js` is the forward-looking owner briefing surface.
- Forward view is derived from saved confirmed bookings, open quote value, due repeat-customer value, Business Memory outcome rates and current operational risks.
- Confirmed work is kept separate from forecast ranges. Forecast confidence widens/narrows the range rather than presenting false precision.
- The same compact Executive Briefing context is supplied to BUSY Operator for conversational outlook/risk questions.

## V3.23 Proactive BUSY + Connected Diary
- `src/screens/proactive23.js` is the owner-facing notification/diary control surface.
- Local notification candidates are derived deterministically from the Executive Briefing, saved confirmed bookings and Approval Inbox. Only a small priority-capped set is scheduled.
- Notification payloads contain structured local route data; taps navigate to existing approval/work surfaces rather than executing business actions.
- Device-calendar sync maps BUSY booking/customer IDs to native event IDs. External edits become reconciliation conflicts and require an explicit owner choice.
- Other events from the selected device calendar are used only as local scheduled-load context and are not turned into customer records.

## V3.24 Release-Grade Core
- `src/domain/releaseCore.js` is the first dedicated domain-selector module in the next refactor phase. It owns deterministic customer/link/lifecycle consistency checks and the compact Home command-centre summary.
- `src/screens/releaseCore.js` exposes those checks without giving them automatic mutation authority.
- Home no longer renders every intelligent subsystem as a separate top-level card. It acts as a thin command-centre surface over Operator, Autopilot, Business Memory, Executive Briefing and Proactive BUSY.
- Obvious duplicate phone records are blocked at manual entry, while repeat enquiries with a high-confidence existing phone match append to the existing customer lifecycle.
- Future refactors should continue moving pure forecasting, notification and diary selectors out of `AppController.js` before adding new controller-level intelligence.

## V3.25 Production Bridge
- `src/domain/productionBridge.js` converts actual runtime/backend state into release-readiness gates.
- `src/screens/productionBridge.js` owns the developer/owner-facing transition from Snack to a native development build.
- `eas.json` defines development, internal preview and production profiles; the Expo account still needs to perform the one-time project link that generates the EAS project ID.
- `busy_push_devices` is an authenticated owner-scoped table with RLS. Expo push tokens are device identifiers, not business snapshot data.
- `busy-push-dispatch` manually validates the BUSY user JWT and only exposes a same-owner remote test action in V3.25.
- `busy-calendar-oauth` is a server-side OAuth boundary. Provider client secrets, access tokens and refresh tokens never enter the React Native client or cloud business snapshot.
- Calendar OAuth callback state is one-time and expires after ten minutes. External provider connection state is isolated from the existing device-calendar bridge.

## V3.32 Communications Hub / Unified Inbox 2.0
- `src/domain/communicationsHub.js` derives communication threads and lane status from existing customer journeys, source records and pending BUSY Inbox items. It does not persist a parallel conversation database.
- Thread lanes are deterministic: pending matched incoming or communication-specific high-severity stalls → Needs attention; latest real outbound contact newer than incoming → Awaiting customer; safe communication preparation → Draft ready; otherwise Done.
- Duplicate-contact protection compares only communication explicitly recorded as sent against newer saved incoming communication. Prepared drafts and internal outcome records do not count as customer contact.
- Incoming-message intent helpers are deliberately bounded heuristics. They can label likely acceptance, scheduling, price/scope concern, feedback, decline or question, but those labels are not allowed to mutate business records.
- `src/screens/communications.js` owns the Communications Hub and per-customer Communication Thread views.
- Unmatched incoming information stays in the existing BUSY Inbox review/filing flow. The communications layer never guesses a customer match.
- Customer Journey remains the lifecycle source of truth; Communications Hub is the conversation projection over that journey.
- BUSY Operator receives a bounded Communications Hub context. `communications_summary` and `customer_communication_summary` are answer-only.
- `customer_reply_draft` can produce editable wording only when one customer is unambiguous, contact is allowed and the duplicate-contact guard is clear. It has no send authority.
- Real provider-specific SMS/email/WhatsApp sending is intentionally not implemented in this sweep; future providers can attach behind the same thread/approval model.

## V3.31 Customer Journey 2.0
- `src/domain/customerJourney2.js` owns per-customer journey derivation: joined timeline, communication history, relationship totals, stalled signals and next-action selection.
- The selector consumes the existing customer object plus its current reply action and never creates a second persistent customer-history store.
- Timeline rows are derived from enquiry/source records, customer activity, completed-job history, current quote/booking/reminder state, review outcomes and saved follow-up outcomes.
- Communication history is intentionally narrower than the full timeline: prepared/sent quote wording, follow-ups and review requests are separated from ordinary internal notes so BUSY does not mistake preparation for actual customer contact.
- Customer next-action ranking preserves the existing safety/order rules: contact preference → live action → warm follow-up/outcome → completed-job follow-on → repeat timing → no forced action.
- Stalled signals are deterministic saved-state warnings and do not autonomously send, cancel, move or create customer work.
- `src/screens/customers.js` renders Customer Command Centre and joined journey views while reusing the existing quote/booking/reminder/review screens for any write action.
- BUSY Operator receives a bounded per-customer journey summary through the normal owner-scoped command context. `customer_journey_summary` is answer-only and requires one unambiguous saved customer.
- Multiple jobs stay attached to the same customer record; relationship counts/value are derived from saved job history rather than a separate CRM table.

## V3.30 Daily Command Centre / Business Brain 3.0
- `src/domain/dailyCommandCentre.js` owns deterministic daily-priority selection and briefing-snapshot comparison. It does not mutate business records.
- `src/screens/dailyCommandCentre.js` is the owner-facing Do now / Later today / Watch view.
- The current briefing is derived from Executive Briefing, Work & Calendar 2.0, Release Core, Operational Continuity, Approval Inbox, customer follow-ups, active work goals, Business Memory changes and proactive signals.
- A single persisted `dailyCommandCheckpoint` stores the last owner-reviewed signal snapshot. The checkpoint lives in the same local cache/cloud snapshot as the rest of the business state and is not model-side memory.
- Change detection compares bounded numeric business signals rather than free-form text, making “since your last briefing” explainable and reproducible.
- Home consumes the Daily Command Centre as its top-level daily priority surface while Executive Briefing remains the deeper forward/forecast view.
- BUSY Operator receives a compact copy of the three lanes and real saved changes through `dailyCommandCentre` context. The `daily_briefing` intent is answer-only and cannot grant action authority.
- Daily Command Centre cards route into existing customer, calendar, Approval Inbox, Release Core, Continuity, Business Memory and proactive-watch flows. No new hidden send/publish/spend path is introduced.

## V3.29 Work & Calendar 2.0
- `src/domain/workCalendar2.js` owns derived calendar intelligence: forward-day rows, workload state, estimated planning capacity, follow-up placement, external commitments, overlap detection and gap-fill candidates.
- Calendar intelligence is derived from saved business state and connected diary snapshots; it is not separately persisted, so it cannot drift away from the underlying customer/booking records.
- The planning-capacity baseline is explicitly advisory. It helps rank Open/Light/Comfortable/Busy/Overloaded days but does not represent guaranteed staff availability or travel feasibility.
- Overlap detection only flags timed records that intersect. It never reconciles, moves or deletes a booking or external-calendar event.
- Overdue customer actions are surfaced on today while retaining their original due date for owner context.
- Repeat-work gap candidates are selected only from already-eligible customers with no active work and only when their typical service duration fits the estimated open capacity.
- `src/screens/work.js` renders the monthly/day intelligence and uses the existing customer/action screens for all actual record work.
- The BUSY Operator context contains a compact 45-day projection of calendar intelligence plus detailed bookings, follow-ups and external commitments for grounded day/gap questions.
- Calendar question intents are answer-only and do not create authority. Booking mutations continue to use the V3.28 preview/confirmation/undo path.

## V3.28 BUSY Operator 2.0
- `src/domain/operator2.js` owns deterministic Operator record-change policy: customer matching, open-booking lookup, hard confirmation intent classification, client-side preview construction and pre-execution validation.
- `src/screens/talk.js` remains the owner-facing conversational surface but now exposes common daily quick asks and clearly distinguishes a preview from an applied/undoable change.
- `src/app/AppController.js` still performs React state mutations, while Operator decision policy and safety validation have moved out of the controller.
- `supabase/functions/busy-command/index.ts` now routes booking edits/cancellations, customer notes, safe reminders, calendar-day requests and a single next-best-action answer. Structured conversation context supports short corrections without granting extra authority.
- Record-changing intents are confirmation-gated twice: server output marks them as confirmation-required and the client independently enforces the same intent set before execution.
- BUSY keeps a reversible pre-change customer/action snapshot for the latest Operator mutation. Undo restores the exact saved state rather than attempting a second AI interpretation.
- Calendar focus is transient UI state; it does not alter business records.
- Public posting, customer message sending and paid advertising remain outside Operator execution authority.

## V3.27 Operational Continuity
- `src/domain/operationalContinuity.js` owns deterministic connection-health and recovery classification across cloud sync, social publishing, device diary, Google Calendar, remote push and Release Core health.
- `src/screens/operationalContinuity.js` is the owner-facing Continuity Centre. It separates “what still works” from “what needs recovery” so one unavailable provider does not become a whole-app dead end.
- Optional integrations do not count as core failure merely because they are not connected. Only active conflicts/errors are promoted into the recovery queue.
- High-risk booking/data conflicts remain explicit owner-decision surfaces; Continuity never silently reconciles a booking, repeats a publish request or expands authority.
- Home surfaces the continuity card only when useful and keeps the healthy state compact.
- The native iOS build remains an independent production gate. V3.27 can be reviewed in the existing Expo Go path while Apple device provisioning is unavailable.

## V3.26 Native Connections
- `busy-calendar-sync` is the server-side Google Calendar reconciliation boundary. The app supplies only bounded confirmed booking data; provider tokens remain server-side.
- `busy_calendar_event_links` stores the last agreed BUSY/Google state. Provider-side time changes are surfaced as conflicts and cannot mutate BUSY until the owner explicitly chooses Google’s time.
- `busy-production-watch` is an independent scheduled observer over the cloud business snapshot. It emits only a narrow trusted set of notifications and records a durable delivery key before future runs can resend the same event.
- `busy_push_deliveries` and `busy_internal_config` are server-only tables. The cron authentication token never enters the mobile client.
- `.github/workflows/eas-link.yml` performs the one-time Expo account link when an EXPO_TOKEN secret exists. `native-development-build.yml` queues the development build after project linking/signing is available.
