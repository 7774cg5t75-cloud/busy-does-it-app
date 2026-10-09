# busy-does-it-app

## V3.75 — Reality Check Engine (development)

V3.75 introduces a **founder-authorised, on-demand Reality Check** in Founder Operations: bounded HTTPS HEAD probes of BUSY-owned website default hostnames with matching website/deployment headers, aggregate reconciliation of existing Facebook/Instagram/Google Business API submission receipts, and Business App live/public deployment version comparisons. The system returns **only aggregate samples and clear uncertainty labels**. Provider receipts are not represented as public-feed visibility, and deployment records are not presented as App Store/device verification.

The founder-only Supabase reporting Edge Function was deployed with JWT verification; the app version is 3.75.0. No automatic external repairs or republishing were activated. Live BUSY website and Business App checks have no production deployments to exercise yet, and complete green GitHub CI and physical-device acceptance remain pending. See `docs/V3_75_REALITY_CHECK_ENGINE.md`.

## V3.74 — Safe Recovery Rechecks and Private Audit (development)

V3.74 builds on BUSY DOES IT's scheduled 15-minute aggregate incident watcher. Every completed scan automatically creates or updates a **founder-private recovery assessment**, showing when a recorded issue still requires review, has passed the first clean scan, or has cleared after two clean checks. Partial/unknown coverage is **not** treated as recovered. The founder dashboard displays this sanitized evidence; non-founders cannot read the recovery audit. A conservative replay policy still blocks all automatic website publishing, social reposting and Business App releases pending verified provider receipts, explicit approval and idempotency safeguards.

The Supabase migration is applied, the founder reporting Edge Function is deployed with JWT enabled, and database transition/security fixtures were verified with the test data rolled back. V3.74 Node regression tests are committed into GitHub's production workflow but full successful CI and iPhone acceptance are **not yet confirmed**. See `docs/V3_74_SAFE_RECOVERY_AUDIT.md`.

## V3.73 — Escalation and Founder Push Readiness (development)

V3.73 extends the monitored incident inbox with conservative `watch`, `persistent`, `urgent` and `unverified` classifications based on real background-scan coverage. The founder-only endpoint also reports the **authenticated founder account's own active push-device count** without leaking device tokens. A new pure delivery policy requires explicit opt-in, verified destination, fresh source data, quiet hours and a minimum 24-hour cooldown before any future sender may dispatch. The Founder Operations dashboard shows the escalation state and links to Production Bridge for device enrolment.

**Important:** No native founder push device is registered yet and **automatic push/email delivery is not enabled**. No customer publishing retries, hosting suspension or payments were activated. The V3.73 Edge Function is deployed with JWT verification. Regression tests were added to the GitHub workflow; full green CI and real-device acceptance still need confirmation.

See `docs/V3_73_ESCALATION_NOTIFICATION_READINESS.md`.

## V3.72 — Founder Reliability & Regression Gates (development)

The founder dashboard now distinguishes current scans, stalled scans, partial source coverage, unavailable alert inbox information and alerts awaiting review. A zero-alert view never claims that public websites have been proven reachable. Account-switch handling prevents an earlier acknowledgement response from confusing the current account's screen. GitHub's existing production check now runs V3.69–V3.72 founder-monitor regressions on new commits. A V3.72 authenticated founder reporting update is deployed with JWT verification; external alert delivery, automatic provider recovery and £50 billing remain disabled. **Full CI result and native iPhone acceptance are not yet confirmed.** See `docs/V3_72_FOUNDER_RELIABILITY.md`.

## V3.71 — Founder Alert Inbox & Commercial Guardrails (development)

BUSY's unattended V3.70 monitor now synchronises a **private, founder-only in-app alert inbox** every 15 minutes. Open, resolved and acknowledged states are tracked separately. Acknowledging an alert does not resolve or retry an incident; a reopened incident requires new acknowledgement. Founder role verification remains server-controlled, and customer roles cannot read or write inbox rows. The founder dashboard provides constrained class-specific review guidance without exposing customer data.

The backend migration and founder Edge Function are deployed. Rollback-safe database lifecycle tests and customer privilege checks passed. **External push/email alerts, autonomous recovery, subscription charges, live cancellation/hosting suspension and automatic AI cost blocking are NOT enabled.** V3.71 also introduces fail-safe subscription and usage policy helpers for later integration with verified billing and metering. An iPhone acceptance pass and full Node regression run are still required.

See `docs/V3_71_FOUNDER_ALERTS_AND_COMMERCIAL_GUARDRAILS.md` for details and release gates.

## V3.70 — BUSY Platform Autopilot 1.0 (development)

BUSY's **first unattended, server-side platform incident monitor** now operates in Supabase independently of the owner's iPhone. A private `pg_cron` job runs every **15 minutes**, scanning existing records for website job failures, expired website processing leases, failed/partially failed social publishing and failed Business Apps. It maintains low-noise grouped incident history, requires **two clean scans** before resolving an issue, and records incomplete data as unavailable rather than pretending there is no problem.

Your server-authorised **Founder Operations dashboard** now displays scan freshness, up to 12 recent aggregate incident records, and high-priority exception counts without exposing customer identities. Database tables have RLS enabled and direct normal-customer access revoked. We verified the deployed schedule, source coverage, rollback-safe simulated incident transitions, and access restrictions. GitHub CI adds security/continuity regression checks.

**Not yet active:** automatic founder push/email notifications (the founder account has no enrolled push device), destructive/external service recovery, payment/subscriber counts, £50 charges, AI invoices, and profit. For each, BUSY must have genuine evidence and carefully controlled activation. Our standing product goal is a future **£50/month app delivering extraordinary value with minimal founder time**.

Details: `docs/V3_70_PLATFORM_AUTOPILOT.md`.


## V3.69 — Founder Operations Security Foundation (development only)

- Implements a **separate, server-authorised founder-only dashboard** linked discreetly from Production Bridge. Unlike the customer-level Operations & Reliability view, the new `busy-founder-ops` backend can return **aggregate platform-wide** health and business-workspace activity after a fresh authenticated Supabase Auth check.
- **Deny-by-default role:** Only a user explicitly granted `app_metadata.busy_platform_role=founder` by an authorised administrator can request platform aggregates. Regular subscribers, owners of individual BUSY workspaces, and self-edited `user_metadata` cannot grant themselves access. No founder role has been assigned yet — activation requires identity verification.
- Shows actual workspace/membership counts, recent business snapshot activity, failed/pending website jobs, failed social/app records, and bounded 30-day AI/hosting usage counts. No names, emails, customer data or business IDs in results.
- Explicitly does **not** claim paying subscribers, £50 subscription payments, MRR, AI or hosting invoices, margins, continuous monitoring or unattended provider recovery. Those need verified, separate commercial and monitoring integrations.
- `supabase/functions/busy-founder-ops` is a deployed read-only Supabase Edge Function with JWT verification. The mobile app passes only the authenticated user's bearer token, never the privileged server key.
- `scripts/check-founder-operations.mjs` and `.github/workflows/check-founder-operations.yml` add auth/permission and reporting regressions alongside earlier V3.64–V3.68 checks.
- See `docs/V3_69_FOUNDER_OPERATIONS.md` for the one-time role activation safety gate and signed-device acceptance checklist.


## V3.68 — Self-Running Operations 1.0 (development branch)

- New **Operations & Reliability** screen on Home and Verified Business Activity, aimed at reducing routine owner workload with a single, low-noise, *per-business* exception digest.
- Reuses existing operational continuity and core-integrity data; groups duplicate issues, flags cloud conflicts for human review, separates provider status uncertainty from confirmed failures, and links safely to existing recovery screens.
- Reads the three authenticated website, Customer App and social reporting endpoints. Automatically retries **status reads only**, at most once, after transient connection/5xx issues. It will never automatically repost content, roll back websites, change business records or bypass approvals.
- Shows only genuine provider-reported hosting usage **counters**, not invented cost or revenue figures. Billing, active subscriber counts, AI cost, storage invoices, actual profit and £50 subscription payments remain **not integrated**.
- Does **not** expose cross-business platform administrator data. A separate founder-only, server-authorised, multi-tenant monitoring/billing system is a later milestone. The operations view is on-demand, **not** a new 24/7 background monitoring worker.
- Automated checks: `node scripts/check-self-running-operations.mjs`, earlier V3.64–V3.67 regression scripts, and standard production foundation.
- Commercial north star: a genuinely valuable eventual **£50/month** subscription which costs as little founder time as practical to operate. Details and acceptance gaps: `docs/V3_68_SELF_RUNNING_OPERATIONS.md`.


## Commercial objective (planning, not live billing)
Aim to make a future **£50/month BUSY DOES IT subscription feel excellent value** through reliable business-building, website/app/social support, genuinely verified outcomes and meaningful time savings. Build with sustainable multi-tenant costs and sensible AI/media usage limits; do not claim £50 billing is enabled until pricing and payment implementation is tested.

## V3.67 — Verified Business Activity & Results (development, not released)

- Adds a source-attributed, **read-only Verified Business Activity** screen, linked from Home and Growth Command Centre, for the authenticated business's existing website hosting, customer Business App and social publishing records.
- Distinguishes a provider-recorded live deployment or release, a destination-specific social publication receipt, an unpublished preview, a scheduled post, a recorded failure, and an unverified result. A queue row merely saying "Published" is not enough to claim a successful post.
- Shows separately which reporting systems responded and which could not be checked. A website/app/social event is **not automatically attributed to a Growth Project** without reliable project-specific source identifiers.
- Responds to spoken and typed publishing-status **questions** from authenticated records before the existing Operator takes any actions. The response never initiates publishing, retrying, deleting or scheduling.
- Offers deep links into the existing owner-controlled publisher screens for further checks or explicitly approved retry-only-failed-channel recovery.
- Uses existing owner-token Edge Functions and RLS; no new database, service-role key or hosting service subscription. Adds an independent suite: `scripts/check-verified-activity.mjs`.
- **Limitation:** provider-recorded successes are not independently verified public URL reachability. Real iPhone/connected-channel acceptance remains required. Details in `docs/V3_67_VERIFIED_BUSINESS_ACTIVITY.md`.


## V3.66 — BUSY Operator 3.0: voice and text project continuity (development, not released)
- Extends the existing **Talk to BUSY** microphone and typed-command experience to answer owner-only, RLS-authenticated saved growth-project questions. Voice passes through the existing transcription service; typed project queries read grounded checkpoints without another LLM call.
- Supports single-service status checks and in-conversation pronouns such as "open that project" and "show me the website wording." Keeps the selected project scoped to the current signed-in owner/business; clears context on new chat, sign-out or tenant switch.
- Open/continue safely navigates to Business Creation with the service and requested channel identified, offering explicit cloud load/review. It never overwrites wording, confirms public publication, schedules social content, or posts automatically.
- Refuses project-context requests to publish, launch live, schedule or delete without the separate existing permission process. Missing cloud records, bad authorisation or interrupted requests produce a truthful no-verification notice rather than invented status.
- Adds deterministic conversation/parser regressions, CI and a V3.66 Expo Snack preview. See `docs/V3_66_OPERATOR_GROWTH_VOICE.md`.
- Still requires actual signed-in iPhone audio, cross-device, private cloud, real provider receipt and native release acceptance testing. No new third-party account, cloud schema or service-role key was added.


## v3.65 Business Growth Command Centre 2.0 — development branch, not released
- Introduces a prominent Growth Command Centre on the Home screen, reading the 25 most recent creator-private saved growth projects from the V3.64 Supabase project checkpoints.
- Prioritises the **next safe step** per service from approved business facts and real private checkpoint stages. Stale service information requires explicit re-review; other account/business checkpoints are suppressed before display.
- Lets the owner type simple requests, including "where are we with carpet cleaning?", "what's left to do?", and "which drafts need approval?" without needing an extra AI call. Selecting Continue opens the existing Business Creation workspace with the correct service preselected, ready for explicit cloud loading.
- Displays review/hand-off progress only. **There is no verified public publication badge or automatic publish action** in the new centre. The existing website, Business App and social provider controls remain authoritative.
- Adds a dedicated Node test script and GitHub CI workflow for project progress, cross-tenant/stale state, safe intent routing and UI integration.
- Native iPhone/iPad account switching, real cloud sync and provider receipt verification remain outstanding before release. Full scope: `docs/V3_65_GROWTH_COMMAND_CENTRE.md`.


## v3.64 Business Growth Workspace 2.0 — development branch, not released
- Adds creator-private, cloud-saved growth projects for already-confirmed business services, with three independently reviewable website, Business App and social copy targets.
- Owner can create, review, edit, save, browse and load a per-service project. All checkpoints are revision-checked to prevent an older device from silently overwriting newer work.
- Per-target statuses distinguish local draft, owner-reviewed, handed to a **private editor**, missing confirmed facts, and stale information requiring fresh review. The workspace never treats a draft handoff as a real public publication.
- Changing the approved business profile marks earlier approvals stale, preserves edited copy, and requires explicit acknowledgement of the latest confirmed facts and new per-channel review.
- Private handoff progress is saved before navigating to the separate existing editor; offline/cloud-conflicted handoffs remain unperformed rather than reporting false success.
- BUSY Supabase `busy_growth_projects` table was deployed with creator-only Row Level Security, no anonymous grants, and no direct public publishing capability. Schema: `docs/V3_64_GROWTH_PROJECT_SCHEMA.sql`.
- New Node regression suite and CI workflow check cloud conflict scenarios, cross-owner/business isolation in client logic, drift, and review stages. Real authenticated iPhone/iPad tests and Apple native development build remain release gates.
- Details: `docs/V3_64_GROWTH_WORKSPACE.md`.


## v3.63 Coordinated Growth Draft Studio — development branch, not released
- Adds a three-channel, editable, approved-only draft studio in Build my business with BUSY. Owners can prepare factual website service copy, Business App enquiry instructions and social marketing wording without publishing.
- Draft preparation requires owner sign-in and an already confirmed service. Missing confirmed identity, service area or contact facts continue to block the relevant target.
- Selecting an approved service creates temporary local editable drafts. Changing the signed-in owner, business, service or relevant approved profile facts invalidates the old draft pack before any handoff.
- Per-target handoff: apply copy to an existing **private** website services draft (regenerates internal HTML), open Business App planner with the reviewed instruction, or open Social Media Creator with the text as a brief. None of these actions publishes a website, app or post.
- Local draft text is limited to 800 characters per target; local editor changes do not automatically sync across devices or persist when leaving the screen. Separate publisher approvals remain mandatory.
- Node regression tests added in `scripts/check-growth-drafts.mjs` with branch CI. Full signed-in iPhone/iPad handoff and end-to-end testing is still outstanding; V3.63 has not been merged into production.
- Scope, limitations and release acceptance gates: `docs/V3_63_COORDINATED_DRAFT_STUDIO.md`.


## v3.60 Conversational Business Understanding — development branch, not released
- Adds a review-only parser for owner-stated trading names, coverage areas and public contact information, plus clearly marked unconfirmed industry suggestions.
- Owner must explicitly confirm facts before BUSY puts them into the shared business profile; existing approved values are never silently replaced.
- Adds encrypted on-device draft restore scoped to the authenticated user and business. **This is not yet multi-device cloud conversation history.**
- Adds a bounded approved-only handoff contract for website, Business App and social draft creation. Publishing still requires independent approval.
- Extends deterministic automated tests for conflicting facts, non-approval of inferred claims, inline statement boundaries, PII redaction in excerpts and approved handoff limits.
- Remaining before release: authenticated tenant-scoped cloud conversation persistence and cross-device syncing, schema-constrained AI extraction, end-to-end device testing, and validation of actual builder payload propagation.
- A revision-safe authenticated REST cloud-draft client is implemented in `src/domain/conversationCloud.mjs` with conflict detection and scope validation, and is now wired to explicit manual Load/Save controls in the development business-creation screen. The database table has now been deployed and its RLS/grant configuration inspected; authenticated device-level end-to-end tests are still outstanding.\n- A proposed RLS-protected per-owner cloud checkpoint schema is now included at `docs/V3_60_CONVERSATION_STORAGE_PROPOSAL.sql` for review; the equivalent schema has been deployed to the BUSY Supabase project and the authenticated REST client has been wired to manual draft controls; full cross-device verification is outstanding.\n- **Production database change:** deployed the narrowly scoped `busy_business_conversations` table with RLS on, four creator-only policies, authenticated-only API privileges, no anonymous read grant. No existing data was modified.\n- Client UI is on development branch only; full real-auth testing and model-based extraction remain release gates.


## v3.55 Business App Builder 2.0 — Complete App Journey
- Turns the Business App Builder into one continuous owner journey: **describe the customer experience → answer only missing facts → BUSY builds the private app → review the real customer preview → explicitly approve Go Live**.
- The builder now surfaces a five-step journey card instead of making the owner reason about draft/version/module machinery. Technical module controls remain available underneath for fine-tuning, but they are no longer the primary path.
- Targeted planner questions are now editable in place. Answers are fed back into the controlled planner, and BUSY removes questions that have genuinely been resolved rather than reopening a broad setup form.
- App-specific service/contact answers can fill missing Business App facts without inventing data. Missing gallery imagery routes the owner back to approved Brand Identity photos instead of accepting fake photo descriptions.
- Applying an approved plan now automatically builds the private draft and prepares the matching **immutable customer preview**. It still stops before publication. The preview screen itself contains the explicit Go Live review gate.
- The customer preview is much closer to the real experience: approved hero imagery, gallery photos, services, contact details, enquiries, booking requests, dated offers and loyalty all render in customer-facing order.
- **Offers 2.0** adds optional start/end dates. The planner may only use dates and offer wording supported by the owner or an already-approved offer; invalid date ranges are rejected. Public web Business Apps hide offers outside their approved date window using the customer's local date.
- **Loyalty v1** is now a real reusable module rather than a placeholder. A business can define one simple target of 2–20 stamps/visits leading to one explicit owner-defined reward. BUSY will not invent the target, reward or terms.
- Signed-in customers can see their loyalty progress inside the live Business App/request journey. Owners can record one eligible stamp at a time; awards are atomic, idempotent, auditable and capped at the live reward target. Guest web requests cannot receive account loyalty stamps because there is no authenticated customer identity.
- Loyalty storage is service-role owned with explicit deny RLS for normal clients, composite business/app/request tenant-integrity constraints and customer-scoped idempotency.
- Every new V3.55 Loyalty foreign key has a covering production index. The Supabase performance advisor no longer reports unindexed foreign keys from this sweep; the new indexes are expected to show as unused until real Business App traffic exists.
- Booking requests now expose the existing real bridge more clearly: after BUSY creates the linked draft booking, the owner gets **Open BUSY booking to confirm**. Confirming the real BUSY booking updates the original Business App request to accepted; the request itself never silently creates a confirmed diary booking.
- Stable QR/share/deep links remain part of the live Business App flow, while owner-facing wording has been cleaned up from “Mini App” toward **Business App**. Internal table/function names remain unchanged for compatibility.
- Payments/deposits deliberately remain a planned controlled module. V3.55 does not collect money or imply that payments are available.
- Production checks now guard the continuous journey, targeted fact answers, automatic immutable preview, explicit owner Go Live, dated-offer evidence, bounded loyalty, tenant/RLS safety, signed-in loyalty progress, real booking confirmation bridge and the continued absence of payments.


## v3.54 Business App Builder Intelligence & Voice-First Creation
- Promotes the earlier Mini App machinery into the owner-facing **Business App Builder**. The owner describes what customers should be able to do in normal language; BUSY creates a reviewable plan before changing the private draft.
- Adds a controlled AI app planner in `busy-mini-apps`. The planner receives only the owner's request, the recorded approved business facts and the reusable module catalogue. Its output is schema-constrained and then server-side sanitised against the real catalogue before BUSY will use it.
- Existing app edits are incremental: modules already enabled remain enabled unless the owner explicitly asks to remove/change them. Short requests such as “add booking requests” therefore do not silently rebuild the rest of the app.
- The planner may only enable catalogue modules whose status is `available`. Loyalty, payments or unknown bespoke capabilities are surfaced as **planned/unsupported** rather than being falsely presented as working.
- The builder asks **targeted missing-fact questions** instead of opening a large setup form. Examples include the services to display, the contact route to use, approved gallery photos or the exact wording/terms of a requested offer.
- Offers are now a real reusable module rather than a permanent placeholder. Up to four explicit owner-supported offers can be stored in the immutable app config and rendered in both the in-app preview and the public web Business App. BUSY will not invent an offer, discount, price or terms.
- Voice-first creation is wired through the existing BUSY Operator voice/transcription path. “Build me an app…” or “change my app…” now carries the owner's spoken request into the Business App Builder, creates the plan, and stops for review before draft mutation/publication.
- A builder-screen **Describe it by voice** action opens the existing BUSY microphone experience directly. Typed and spoken requests therefore converge on the same controlled planner.
- Applying an app plan changes only the private mutable draft. The established **immutable preview → explicit owner publication approval → optional BUSY Apps listing** gates remain unchanged.
- Draft configs created by the planner use `surface: busy_business_app` and retain the exact plan, rationale, missing-fact list and owner request alongside the reusable module configuration for later review/version comparison.
- Production checks now protect planner schema enforcement, catalogue gating, explicit-offer requirements, targeted missing questions, voice hand-off and review-before-build behaviour.


## v3.53 Production Simulation & Release Readiness
- Adds a deterministic, isolated website-platform simulation covering **100, 1,000, 5,000 and 10,000 synthetic tenants** without writing fake customers into production. The simulation exercises burst publishing, duplicate taps, tenant fairness, stale worker recovery, provider backoff, confirmed-failure health logic, tenant-boundary mismatches and rollback safety.
- The scale simulator is now part of the normal Production foundation workflow, so later versions cannot silently reduce queue, health or provider capacity below the V3.53 release assumptions without failing CI.
- Adds backlog-sensitive publishing fan-out. The scheduled worker now scales from zero to eight worker invocations according to queue depth, while V3.52 atomic leases and one-operation-per-website protection prevent that extra concurrency from creating duplicate mutations.
- Immediate publish-triggered worker wakes are **coalesced** through a service-role-only database gate. A burst of taps can no longer turn into one Edge Function wake request per tap.
- Healthy website checks are spread over 12 hours while confirmed failures remain on fast 3–5 minute recovery cadence. The health scheduler can select up to 40 due sites per minute, giving the 10,000-tenant model headroom even with a simulated 1% incident rate.
- Healthy Cloudflare custom-hostname reconciliation is spread over 48 hours. Pending setup, owner-DNS and failure states remain on faster retry windows, preserving responsiveness without continuously polling already-proven infrastructure.
- Adds a service-role-only `busy_website_release_readiness()` snapshot that combines live queue/retry pressure with scheduler readiness. This is intentionally separate from synthetic simulation so an idle production database is never mistaken for proof of scalability.
- Adds a documented workload/cost envelope rather than inventing a currency estimate. At 10,000 tenants, the deterministic model remains below 90% of modeled health and provider scheduler capacity under the declared 1% incident / 1% owner-DNS assumptions.
- The V3.53 evidence and assumptions are documented in `docs/V3_53_WEBSITE_RELEASE_READINESS.md`.
- A true paid Supabase branch stress run is deliberately **not** created silently: Supabase branch creation has a separate platform cost and requires explicit cost confirmation. V3.53 therefore completes all no-cost deterministic simulation, CI release gates and live non-destructive production checks first.


## v3.52 Scale & Production Hardening
- Adds an atomic **worker lease** to every website publishing job. A job can only be claimed by one worker at a time, the queue visibility window is longer than the lease, and stale processing leases are automatically recovered into a safe retry path.
- Strengthens the publishing concurrency rule from “one active deployment/action pair” to **one active website operation per website**. Prepare, publish and rollback can no longer race each other on the same site.
- Worker batches are now **tenant-fair**. BUSY reads extra queue candidates, processes at most one business at a time within each batch, and quickly defers duplicate-business candidates so one noisy tenant cannot monopolise shared publishing capacity.
- Queue retries retain V3.51 exponential backoff/jitter, while V3.52 adds lease-aware completion/failure updates so a stale worker cannot overwrite the result of a newer worker.
- Permanent failures on a new update no longer change a previously proven live website to a failed site. The old live deployment remains the public truth while the failed update keeps its diagnostic evidence.
- Adds database-level **cross-tenant integrity constraints** linking website, deployment, domain, health, usage, enquiry and publishing rows by both resource id and business id. This protects service-role code from accidentally joining one tenant's infrastructure to another even if an application bug slips through.
- Every new composite tenant foreign key has a matching covering index. The Supabase performance advisor no longer reports unindexed foreign keys from the V3.52 tenant-isolation work; fresh indexes are expected to show as unused until real website traffic exists.
- Adds indexed provider scheduling fields (`provider_next_retry_at` / `provider_attempt_count`). Healthy Cloudflare hostnames back off to long reconciliation intervals, pending/owner-DNS states use appropriate shorter windows, and failed provider calls retain bounded recovery state without repeatedly selecting tenants that are not due.
- Website health checks now have an indexed `next_health_check_at` schedule. Unhealthy/not-yet-proven sites are prioritised, healthy sites are spread continuously, and the scheduler runs smaller batches every minute instead of creating a five-minute spike.
- BUSY now probes a site's BUSY address and custom-domain routes concurrently after verifying the immutable live alias, bounding wall-clock health-check time as customers add domains.
- Publishing includes **soft tenant capacity safeguards**: at most one active site operation, an unusually high 30-operations-per-hour business is temporarily paused, and one website cannot accumulate more than five active/pending custom domains.
- Adds a service-role-only `busy_website_operational_metrics()` snapshot for queue age, active/retrying jobs, recent failures, stale leases, due health work, due provider work and failed signal runs. This gives production operations pressure signals without exposing cross-tenant platform data to normal app users.
- Adds bounded operational retention: completed publish jobs and signal-run audit rows older than 180 days are pruned daily; immutable published website versions and rollback content are deliberately excluded from this cleanup.
- Website Management keeps the front end simple but now exposes the important expert facts under Publishing infrastructure: tenant fairness, single-operation protection and the current worker lease when one exists.
- Production checks guard the lease functions, stale-job recovery, tenant-fair worker logic, composite tenant constraints, adaptive health scheduling, rate/capacity safeguards and internal operational metrics.


## v3.51 Hosting Intelligence & Recovery
- Adds an owner-facing **Hosting intelligence & recovery** layer across publishing, Cloudflare, DNS, SSL and public health checks. BUSY now distinguishes a publishing problem from a route problem, a customer-DNS action, an internal provider issue and a temporary external failure instead of collapsing them into one generic error.
- Provider reconciliation now stores bounded recovery state inside each tenant domain: category, retry count, first failure, last attempt, next retry and a plain-English owner message. Scheduled domain sync respects the next-retry time instead of hammering Cloudflare on every cycle.
- Automatic provider retries use exponential backoff with a six-hour ceiling. Authentication/permission faults are classified as internal operator attention; rate limiting and temporary provider/network faults remain automatic retries.
- Successful Cloudflare responses reset provider retry attempts while preserving independent live-delivery recovery evidence. Pending DNS/validation states use slower scheduled checks so thousands of tenants cannot create a retry storm.
- Live-site health now uses **confirmed failure** semantics. A previously healthy hosted site, BUSY address or customer domain is not taken out of service after one failed probe. Two consecutive failures are required before BUSY withdraws a proven public route and falls back to another known-good address.
- Customer-domain health writes independent delivery-recovery evidence (healthy, transient observation or retrying) while preserving Cloudflare provider state. A recovered domain is automatically restored to active routing after the exact immutable deployment marker is observed again.
- Publishing jobs now use exponential retry delays with deterministic tenant/job jitter rather than synchronized linear retries. Clearly permanent failures such as a missing prepared artifact stop retrying instead of wasting queue capacity.
- Existing live content remains protected when a newer publication fails. BUSY surfaces the retained previously published version as rollback safety rather than treating an update failure as if the whole website disappeared.
- A new server-side **safe recovery** action can reconcile the shared Cloudflare platform, refresh a verified custom hostname and run exact-deployment health proof without changing approved website content. The normal background workers remain automatic; the button is an optional accelerator when an owner wants BUSY to recheck immediately.
- Website Management now reduces hosting incidents to three owner-level outcomes: **Live and healthy**, **BUSY is fixing a temporary issue**, or **We need one DNS change from you**. Technical evidence remains underneath for diagnosis without forcing a small-business owner to understand Cloudflare internals.
- Production checks now protect confirmed-failure semantics, tenant-scoped backoff, permanent-vs-retryable publishing errors, recovery orchestration and the owner-facing recovery centre.


## v3.50 Automatic Customer-Owned Domains
- Turns custom domains into one guided owner flow instead of separate technical actions. The owner enters a domain, adds one BUSY ownership TXT record, and checks ownership once; after that BUSY automatically continues into Cloudflare custom-hostname creation, SSL setup and scheduled provider reconciliation.
- Verified domains that have not yet received a Cloudflare hostname are now picked up automatically by the existing provider scheduler. A missed browser tap or interrupted request therefore no longer leaves a verified domain permanently stranded.
- Custom-hostname creation is idempotent. Before creating a Cloudflare hostname, BUSY searches the SaaS zone for an existing exact hostname and safely reuses it if a previous request succeeded externally before BUSY persisted the provider id.
- Cloudflare SSL validation now accepts both current TXT response shapes used by the provider API, while retaining hostname-ownership, certificate-validation and traffic-routing records as separate instructions.
- BUSY's own platform namespace (`busydoesit.co.uk` and all subdomains) is reserved and cannot be claimed as a customer-owned domain.
- Website Management now shows a five-stage customer-domain journey: domain ownership, Cloudflare hostname, DNS traffic route, SSL/HTTPS and exact website health proof. The app only calls the customer domain live after the real hostname serves the expected immutable BUSY deployment.
- The screen now shows only the DNS records relevant to the current stage. Before ownership it shows the BUSY TXT challenge; after ownership it shows Cloudflare/SSL/traffic records still required at the customer's DNS provider.
- The manual provider button is retained only as a safe **Check domain setup now** recovery/refresh action. Normal setup continues automatically after ownership verification and via the background reconciler.
- Once a customer-owned domain is fully active and healthy it becomes BUSY's preferred public website address ahead of the default `busydoesit.co.uk` tenant hostname, while the default address remains available as a separate fallback route.
- Production checks now guard automatic provisioning, idempotent Cloudflare recovery, current validation-record parsing, the reserved BUSY namespace, preferred custom-domain routing and the owner-facing journey UI.


## v3.49 Real Website Go-Live
- Turns the V3.47–V3.48 hosting machinery into one owner-facing **Go Live journey**. The owner still approves the exact immutable hosted preview once; after that BUSY automatically carries the release through publication, BUSY-address allocation, Cloudflare route proof and exact-deployment health verification.
- The website publishing worker now immediately asks the provider layer to reserve/promote the tenant-safe BUSY hostname after a publish or rollback, then invokes the live health verifier. These checks are non-destructive and cannot silently change the approved website content.
- A temporary provider/health-check problem does **not** fail the approved publication itself. BUSY records the public version separately and lets the existing scheduled provider/health workers retry delivery proof safely.
- Website Management now has a plain-English Go Live journey with five independent stages: owner approval, approved version published, BUSY address allocated, Cloudflare route verified, and exact deployment health proof.
- The final **Live and healthy** state is only reached when both the storage/live alias and the tenant-safe Cloudflare hostname prove the expected immutable deployment. A DNS/route problem is therefore not misreported as a publishing failure, and a successful publish is not misreported as a verified public route.
- After approval the mobile app follows the Go Live state automatically with short bounded refreshes, so the owner does not have to keep pressing Refresh while BUSY completes the background hand-off.
- Rollback uses the same joined-up verification path: restoring an immutable version also re-checks the public BUSY address and deployment marker automatically.
- The proven BUSY hostname becomes the preferred public address only after route proof; until then the existing hosted live alias remains a separate fallback truth.
- Production checks now guard the immediate delivery-verification hand-off, Go Live state model and owner-facing journey UI.


## v3.48 Automatic Tenant Website Addresses
- Closes the gap between **allocating** a BUSY hostname and actually proving it is live. A tenant address such as `site-business-1234.busydoesit.co.uk` now moves through **reserved → provisioning/route proof → active** instead of remaining permanently reserved after the owner publishes.
- Publishing or rolling back a website now automatically starts default-address route verification whenever that website already has a BUSY hostname.
- The scheduled Cloudflare provider reconciler self-heals older V3.47 state: a live website whose BUSY address is still marked `reserved` is promoted to `provisioning` without needing the owner to republish.
- If the address is first reserved after a website is already live, it enters `provisioning` immediately. If the website is still only a draft/preview, the address remains safely reserved until publication.
- The live-site health checker now tests reserved/provisioning/degraded BUSY addresses as well as active ones. It only marks the address `active` after the real public hostname returns the exact expected immutable BUSY deployment marker.
- A failed first route proof becomes a visible `degraded`/needs-attention state rather than being mistaken for a live website. An already-active address is not flapped by a single transient health-check failure.
- Website Publishing now explains whether the default BUSY address is merely reserved, queued for route proof, actively being checked, needs attention, or is independently proven live.
- The domain model exposes a primary public-address view: the proven BUSY hostname takes precedence when active; until then the existing hosted live version remains distinct rather than being relabelled.
- Production checks now assert this tenant-address lifecycle across provider reconciliation, publishing and health verification so a future refactor cannot silently regress the hand-off.

## v3.47 Cloudflare Production Activation
- BUSY now turns the previously prepared Cloudflare-for-SaaS infrastructure into an **automatic, idempotent production activation flow**. The existing five-minute provider scheduler checks the real platform state and performs the bootstrap only when credentials, nameservers and routing prerequisites are genuinely ready.
- The provider now distinguishes **credentials ready**, **nameservers ready**, **infrastructure applied**, **Cloudflare still activating** and **fully active** instead of collapsing them into one connected/not-connected flag.
- Once activation is needed, BUSY can create or reconcile the proxied fallback-origin record, the friendly `sites.busydoesit.co.uk` target, the wildcard BUSY DNS record, the Cloudflare fallback-origin setting, the `busy-website-router` Worker and its wildcard/exclusion routes. Existing correct resources are reused rather than recreated.
- The scheduled domain-sync path now performs platform reconciliation first, so adding the restricted Cloudflare token, Zone ID and Account ID is enough to let the backend move forward without another manual deployment step.
- Website Publishing now carries the provider preflight, platform inspection and activation state all the way from the server into the owner UI. This fixes the V3.46 state-drop where the server knew the real Cloudflare state but the mobile view did not retain it.
- The UI now shows whether automatic activation is waiting, applied, still being activated by Cloudflare or fully active, while keeping customer-domain ownership, routing, SSL and live deployment health as separate truths.
- No Cloudflare secret is exposed to the app, GitHub, logs or customer-facing website artifacts. The mobile client receives only boolean/status evidence.
- Production validation completed after the restricted credentials were added: the live provider reported `status=ready` with routing DNS, fallback origin, Worker script, wildcard Worker route and root/www exclusions all confirmed active.

Busy Does It mobile app prototype.

## v3.46 Production Domains & Hosting Activation
- BUSY now has a first-party production root domain: `busydoesit.co.uk`. Tenant-safe default website addresses are first-level hostnames such as `site-business-1234.busydoesit.co.uk`, while `sites.busydoesit.co.uk` is reserved as the friendly Cloudflare-for-SaaS CNAME target for customer-owned domains.
- Cloudflare account activation is no longer treated as a blind external checkbox. The website-provider service now performs a public DNS preflight against the root domain and can independently tell whether the authoritative nameservers have moved to Cloudflare.
- The preflight separately checks whether the BUSY website base hostname is actually resolving. Nameserver propagation, Cloudflare-for-SaaS credentials, routing DNS and real deployment health remain separate truths.
- Website status now exposes the platform preflight to the owner UI, so BUSY can show **nameservers propagating**, **SaaS setup required**, **routing DNS required** and **ready for customer domains** without pretending a later stage is complete.
- Existing provider-neutral routing, SSL and health boundaries remain intact: a Cloudflare custom hostname is not considered live until BUSY's health checker observes the expected live deployment through the public hostname.
- V3.46 now also includes the production routing layer that will be activated after the account credentials are connected: a Cloudflare Worker routes both BUSY-owned hostnames and Cloudflare-for-SaaS custom hostnames to a public-safe Supabase origin resolver, which serves only the current approved live static deployment.
- The platform bootstrap is designed to be automated once the restricted Cloudflare credentials are present: BUSY can create the dummy proxied fallback origin, the friendly `sites.busydoesit.co.uk` CNAME target, the wildcard BUSY DNS record, the fallback-origin setting, the routing Worker, and the wildcard Worker route without manual per-business setup.
- The registrar nameserver move has now been independently confirmed by BUSY (`anton.ns.cloudflare.com` + `ara.ns.cloudflare.com`). The remaining account-owner steps are deliberately narrow: enable Cloudflare for SaaS / Custom Hostnames, then place the restricted API token, Zone ID and Account ID into server secrets. No Cloudflare secret is committed to the app or repository.

## v3.45 Guest Mini App Requests
- Customers can now submit **enquiries and booking requests directly from the public web Mini App** without installing BUSY or signing into a BUSY account.
- Public forms reuse the exact immutable live Mini App configuration and only appear when the corresponding controlled `enquiry` or `booking_request` module is enabled.
- Existing V3.44 web artifacts are not silently rewritten. BUSY records a web-artifact capability version; an owner must republish through the existing approval flow before an older live artifact gains V3.45 guest forms.
- Before submission BUSY issues a short-lived, one-time guest browser challenge. The web page solves a small proof-of-work, the server checks the same browser fingerprint, a hidden bot-trap field, expiry and rate limits, then atomically consumes the challenge.
- Raw IP addresses are not stored. BUSY stores a keyed hash for the short-lived challenge/rate-limit window and prunes expired challenge rows automatically.
- Guest requests enter the **same** `busy_mini_app_requests` pipeline as signed-in requests with an explicit `request_origin=guest_web` and `identity_assurance=guest_browser_challenge`.
- The assurance label is intentionally narrow: it means BUSY verified the one-time browser challenge; it does **not** claim ownership of the email address or phone number typed by the customer.
- Guest booking requests remain requests only. V3.45 does not silently reserve or confirm a diary slot.
- A successful guest submission receives a high-entropy browser receipt. The same browser can securely check the current request status without exposing the request through the public Data API.
- Owner/admin users receive the same high-priority BUSY Apps notification for new guest requests. Guest requests appear in the existing owner review/bridge flow and can be linked into the normal BUSY customer journey or Draft booking flow.
- BUSY deliberately disables in-app conversation replies for guest web requests in the owner UI because V3.45 has no guest message-delivery channel. Owners are told to use the supplied contact details instead of being given a button that would appear to message the customer but would not reach them.
- Funnel reporting now distinguishes web views, action attempts, signed-in app opens, all genuine requests and genuine **guest web requests**.
- No CAPTCHA vendor or Cloudflare dependency is introduced. The challenge boundary is provider-independent so a stronger CAPTCHA/contact-verification adapter can be added later without rebuilding the request model.

## v3.44 Public Mini App Web Experience
- QR/share entry is now **web-first**: customers can browse the current live Mini App in a normal mobile browser without installing BUSY or signing in.
- Publishing a Mini App now renders an immutable public-safe HTML artifact from the exact approved live Mini App version and writes both a long-cache version path and a short-cache live alias.
- Rollback rewrites the live alias from the previously published immutable version, so the web experience follows the same known-good version as the native Mini App.
- Public browsing reads a static Storage/CDN artifact. BUSY AI, private Business Brain data, customer records and the operational business snapshot are not on the normal page-render path.
- Public modules include approved business profile, services, gallery, contact details and an honest empty state for Offers when no approved offer exists.
- Enquiry and booking CTAs do not create anonymous requests in V3.44. They preserve the exact business + intended action and hand off to BUSY's authenticated request flow.
- Signed-out native users retain the intended enquiry/booking action through sign-in, as well as the business slug.
- The 30-day funnel keeps **web views → action attempts → authenticated BUSY opens → genuine requests** distinct; a scan/view is never promoted into a lead or booking.
- Entry analytics remain bounded daily counters, not per-visitor browsing records.
- Marketplace discoverability and exact-link access remain separate. A live unlisted Mini App can still be reached from the owner's exact QR/share link.
- Cloudflare remains deferred. The current public web artifact uses BUSY's existing Supabase Storage/CDN and stable link function.
- App Store/Play Store fallback and verified guest enquiry/booking submission remain later controlled steps.

## v3.43 Mini App Direct Customer Entry
- Adds a dedicated **Share Mini App** centre for each live BUSY Mini App, including an in-app QR code, share sheet and direct-link test path.
- QR and shared links use a stable BUSY-hosted HTTPS landing URL backed by the new public `busy-mini-app-link` Edge Function. Cloudflare is not required for this stage.
- The landing page records a bounded attribution event and attempts the native `busydoesit://apps/<slug>` handoff while retaining a visible **Open in BUSY DOES IT** button.
- Native deep links now route straight to the exact live business Mini App. If the user is signed out, BUSY preserves the target and opens it after sign-in instead of losing the link.
- Marketplace discovery and direct access are deliberately separate: an owner can keep a live Mini App **unlisted** in marketplace search while an exact owner-shared link/QR continues to work.
- Direct-entry sources are counted as QR, shared link, deep link, marketplace, My BUSY Apps, notification, owner test or unknown. Landing-page visits and authenticated in-app opens are kept separate so neither is misreported as an enquiry or booking.
- Entry analytics are stored as bounded **daily counters**, not per-visitor browsing rows. The owner receives 30-day summaries, keeping storage/query growth predictable even as QR traffic increases.
- The public landing page contains no private customer or Business Brain data. It resolves only a genuinely live Mini App by public slug and shows the business's public display name/category.
- The same stable HTTPS route can later gain App Store/Play Store fallback or a branded universal-link domain without changing the Mini App/customer-request model or printed QR codes.

## v3.42 Mini App Notifications & Conversation Centre
- Adds separate durable unread counters for the business side and customer side of every BUSY Mini App request.
- A new request starts unread for the business; customer replies increment business unread state; business replies and genuine request-status changes increment customer unread state.
- Opening the exact request conversation clears only that side's unread counter. Reading as the business does not mark the customer's updates read, and vice versa.
- Conversation history no longer rides inside every owner-status/My BUSY Apps payload. Dedicated request detail loads the newest 30 messages and can page older messages, while request lifecycle events remain attached to the same timeline.
- Home and the Daily Command Centre now treat unread BUSY Apps customer replies as live customer work and can open the exact request directly.
- **My BUSY Apps** shows unread request activity and a dedicated conversation screen instead of embedding whole message histories inside list cards.
- Native builds can register a signed-in user's device for BUSY Apps request notifications. Expo Go keeps the unread experience but does not pretend remote push can be production-tested there.
- New request, reply and genuine status-change notifications are dispatched from the server after tenant/request ownership checks. Notification taps route to the exact request conversation.
- Push delivery uses the existing server-owned device registry and delivery-dedupe table; request/message/status notification keys prevent accidental resend on normal retries.
- Notification bodies are deliberately minimal. They do not expose internal Business Brain/customer-record data on the device lock screen.
- Fixed a V3.41 Mini App module-toggle regression where a module edit could incorrectly try to write a request-lifecycle event.
- Cloudflare remains deferred; V3.42 has no dependency on website-provider credentials.

## v3.41 Mini App Conversation Loop
- Adds durable request-scoped messaging between a business and the signed-in customer who created a Mini App enquiry or booking request.
- Business replies are owner-authorised; customer replies are accepted only for requests owned by that signed-in customer.
- Messages are stored in `busy_mini_app_request_messages`, tenant/request scoped, and not granted directly to anonymous or authenticated Data API clients.
- Message writes use BUSY request idempotency so network retries do not duplicate replies.
- Declined/closed requests stop accepting new messages; a first business reply may move `received` to `reviewing`, but never accepts a booking or invents a diary slot.
- Owners reply from Mini App Builder request cards; customers see and reply to the same thread from **My BUSY Apps**.
- BUSY Operator receives only a request-message count in general context, not conversation bodies.
- Cloudflare remains deliberately deferred and is not required for this loop.

## v3.40 Mini Apps Customer Journey Bridge
- Builds directly on the V3.39 BUSY Apps marketplace without requiring Cloudflare or website-provider setup.
- Mini App enquiries and booking requests now carry normalized customer name/email/phone/service/preferred-date fields in addition to the immutable raw request payload.
- Business-side review can deliberately link a Mini App request into the existing BUSY snapshot customer model. The bridge is durable and idempotent through `busy_mini_app_request_links`, so another device/session can see that the request has already been imported.
- Existing BUSY customer matching still prefers same phone, then same email, then exact full name; a Mini App request therefore joins an existing customer where evidence supports it rather than creating a duplicate by default.
- Mini App enquiries become normal BUSY enquiries with the same follow-up/customer journey system used elsewhere in the app.
- Mini App booking requests become BUSY booking actions with `bookingStatus=Draft`. The customer's preferred-date text is preserved, but BUSY does not invent a real diary date/time or silently confirm the booking.
- Only the existing BUSY booking confirmation action promotes a bridged booking request to customer-visible accepted status.
- Home/Command Centre now treats unlinked Mini App requests as real incoming work that needs owner review.
- Added `busy_mini_app_request_events` for auditable received/reviewing/accepted/declined/link/booking transitions.
- Added **My BUSY Apps**: signed-in customers automatically retain apps they have opened/used, may favourite them, and can see recent enquiry/booking-request status.
- A live app removed from marketplace discovery remains accessible from My BUSY Apps for a customer who previously used it.
- Directory discovery and My BUSY Apps remain server-mediated; the new consumer/link/event tables are not granted directly to authenticated or anonymous Data API clients.
- BUSY Operator can report how many Mini App requests are pending, unlinked, linked or sitting as Draft bookings and is explicitly instructed not to call a Draft booking confirmed.

## v3.39 BUSY Apps Marketplace Foundation
- Adds the first real BUSY Apps marketplace architecture without depending on Cloudflare.
- A BUSY Mini App is a tenant-owned configuration assembled from platform-tested reusable modules, not a bespoke generated codebase.
- Initial available modules: Business profile, Services, Gallery, Contact, Enquiry, Booking request and optional Offers.
- Loyalty and Payments are represented honestly as planned modules and cannot be enabled in V3.39.
- busy_mini_apps stores the mutable private draft and marketplace state.
- busy_mini_app_versions stores immutable prepared/live configurations with content hashes, change summaries and rollback history.
- busy_mini_app_module_catalog is the platform-owned reusable module catalogue.
- busy_mini_app_requests stores authenticated customer enquiry/booking requests; direct client writes are not granted.
- Booking is request-only in V3.39. A customer request does not silently create a confirmed business calendar booking.
- Customer requests are server-routed to the business resolved from the live Mini App; the consumer cannot choose/spoof a destination business ID.
- Request idempotency plus a per-user/app hourly request cap provide first abuse/duplicate protection.
- Publication and marketplace discoverability are separate owner-approved public actions.
- A live Mini App can remain unlisted while the business tests it.
- Signed-in BUSY users can search live/discoverable apps by business/category and open the immutable live version.
- Mini Apps share the same approved public-business profile layer as websites.
- Home now exposes BUSY Apps marketplace + owner Mini App management.
- BUSY Operator receives Mini App state and understands build/edit/open/status intents.
- Cloudflare remains optional/deferred: V3.39 has no dependency on completing the V3.38 external delivery setup.
## v3.38 Website Delivery & Real-World Signals
- Adds a provider-neutral website delivery layer on top of V3.37. Cloudflare for SaaS is the first adapter, not a hard-coded product assumption throughout BUSY.
- New private Edge Functions:
  - `busy-website-provider` — Cloudflare custom-hostname provisioning/sync and BUSY default-hostname reservation.
  - `busy-website-signals` — Cloudflare HTTP analytics ingestion plus BUSY website usage rollups.
- External provider secrets are read only from Supabase Edge Function environment variables:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_SAAS_ZONE_ID`
  - `CLOUDFLARE_SAAS_CNAME_TARGET`
  - `BUSY_WEBSITE_BASE_DOMAIN`
- Until those secrets are configured, provider/signal workers return a successful explicit `configured:false` result. BUSY never fabricates routing, SSL, hostnames or traffic.
- Verified custom domains can be prepared for Cloudflare only through the server-side owner/admin flow. Provider activation and SSL are tracked independently.
- Even after Cloudflare reports hostname + certificate active, BUSY keeps routing in `validating` until the live health worker proves the public hostname serves the expected immutable BUSY deployment.
- Default BUSY website addresses are tenant-safe and reserved only after a BUSY platform base domain is configured. Reservation is not presented as a live address.
- Cloudflare analytics ingestion uses aggregated `httpRequestsAdaptiveGroups`-style semantics: requests, visits and edge bytes remain distinct. A Cloudflare visit is never relabelled as a unique person.
- Added tenant-scoped daily usage/cost rollups for deployments, published versions, generated artifact bytes, requests, visits, edge transfer, health checks and active custom domains.
- Added a genuine website-enquiry attribution store. V3.38 does not silently add a contact form or count visits/clicks as enquiries; attribution rows exist only when a real approved public enquiry integration emits an event.
- New provider/domain/analytics schedulers continue independently of phones being open.
- Website Management and BUSY Operator now report real provider readiness, default-address state, traffic signals, usage and attributed enquiries.
- Account-owner gate still required: the Cloudflare account/zone/token cannot be created or funded by BUSY. Once those secrets are added, the deployed adapters are ready to use without a mobile-app redesign.

## v3.37 Live Website Management 2.0
- Builds on the V3.36 multi-tenant publishing platform; no parallel website stack was introduced.
- Website drafts are now multi-page structured models. V3.37 creates Home plus dedicated Services/About/Gallery/FAQ/Contact pages when the underlying approved sections exist.
- Private hosted previews keep cross-page navigation private by using signed Storage URLs. Public Storage deployments use explicit object-safe page links until a real custom-domain router supplies clean path rewriting.
- Each immutable deployment now stores a plain-English change label, structured change summary and page count. These source/version fields are protected by the existing immutability trigger.
- Version history and rollback now explain what changed rather than showing only version numbers.
- Safe conversational editing now supports exact headline/tagline/contact changes, adding/removing named services, changing service priority, section visibility and visual style. Vague seasonal/public claims are not invented.
- SEO foundation now includes per-page titles/descriptions/headings, LocalBusiness structured-data output from recorded facts, and an owner-facing SEO-basics audit.
- Added `busy_public_business_profiles`: a server-owned public-safe projection shared by website publishing and the future BUSY Mini-App platform. It is tenant-scoped, not a copy of the private Business Brain, and is not exposed directly to anonymous Data API users.
- Added live-site health monitoring. Published HTML carries the immutable deployment ID; BUSY checks HTTP reachability and verifies that the site is actually serving the expected deployment.
- Added scheduled `busy-website-health` Edge Function checks plus owner-triggered health verification. Health history is tenant-scoped and automatically pruned after 30 days.
- Added daily tenant-scoped website analytics rollup tables. V3.37 intentionally does not write every public page view into the operational database; raw/CDN analytics ingestion remains a provider integration.
- Domain state is now explicit across ownership, routing and SSL/TLS. Ownership verification does not imply traffic routing, and routing does not imply certificate activation.
- Cloudflare for SaaS is a researched candidate for the later real custom-domain routing/SSL adapter, but V3.37 does not claim it is configured without credentials/provider confirmation.
- Website health, domain truth, SEO basics, page count and public-profile revision are available to BUSY Operator context.
- “Check my live website” is a safe read/verification voice action. “Publish” and “rollback” remain exact-version owner-approval actions.
- Public visitor traffic still serves static Storage/CDN assets; BUSY AI and the transactional business database remain outside the critical path for normal website page loads.

## v3.36 Multi-Tenant Website Publishing Platform
- Built directly on the V3.35 voice-first Website Builder.
- Website hosting is multi-tenant from the first production-facing version: every website, deployment, domain and publish job is scoped to a real `business_id` from the existing BUSY business/membership model.
- Added live Supabase tables `busy_websites`, `busy_website_deployments`, `busy_website_domains` and `busy_website_publish_jobs`, all with RLS enabled.
- Authenticated app users receive tenant-scoped read access to website metadata only. Website/deployment/domain/job writes are server-mediated; anon and authenticated clients cannot directly mutate those tables.
- Added immutable website deployments. The content hash, tenant, website, version number and source draft cannot be changed after deployment creation; only processing/publication metadata changes.
- Added atomic per-site version allocation plus a concurrency guard so duplicate taps/requests cannot create multiple active jobs for the same deployment/action.
- Added a durable Postgres-native `busy_website_publish` queue. Customer devices never consume the queue and never receive worker credentials.
- Added `busy-website-publish` Edge Function as the authenticated owner/admin publishing API.
- Added `busy-website-worker` as a stateless server-only queue worker. Worker capacity can grow independently from the mobile app and website data model.
- Added a one-minute Supabase Cron wake for the worker through a private token stored in the existing server-only internal config. Retries continue even when every BUSY phone is offline.
- Hosted previews are prepared in a private website-preview bucket. Approved source images are copied out of the private BUSY source-media bucket into deployment-specific preview assets.
- Public deployments are copied into a separate public website bucket with immutable versioned assets and long CDN cache lifetimes.
- The live website uses a stable `live/index.html` alias while the underlying approved deployment remains immutable. Normal public page views therefore hit object storage/CDN rather than the BUSY database, AI or mobile app.
- Publishing follows **draft → immutable hosted preview → explicit owner Go Live approval → live**. Voice commands cannot bypass the Go Live gate.
- Previous published versions remain rollback targets. Rollback also requires explicit owner approval and switches the live alias back without deleting the newer deployment.
- Added Website Publishing Centre with hosted-preview preparation, exact-version preview, Go Live approval, live-site access, deployment history, rollback and shared queue health.
- Added custom-domain ownership records from day one. BUSY can create a tenant-scoped DNS TXT verification challenge and verify ownership, while routing/SSL remain separate explicit states.
- V3.36 deliberately does not pretend a verified domain is routed. Automated custom-domain routing/SSL activation and domain purchase require a genuine routing/provider integration.
- Added BUSY Operator hosting awareness. “Put my website live” opens the exact Go Live review rather than publishing directly; “roll back my website” opens version history; hosting-status questions distinguish editor draft, hosted preview and live version.
- The V3.35 Website Builder remains the editor. Updating a live site creates/changes a draft first; the owner then prepares and approves a new immutable deployment.
- Queue, RLS and scheduler infrastructure was applied to the live Busy Does It Supabase project and the server worker wake path returned HTTP 200 in a live check.

## v3.35 Website Builder / Voice-first site draft
- Built directly on the V3.34 Brand Brain branch.
- Added `src/domain/websiteBuilder.js` and `src/screens/websiteBuilder.js`.
- BUSY can now generate a saved internal one-page website draft from the structured V3.34 Brand Brain brief instead of starting from a blank website wizard.
- The draft uses recorded business identity, service descriptions, approved website imagery, approved testimonials, FAQs, social identity and public contact details. Missing public facts remain missing; BUSY does not invent them.
- The generated site model includes hero, services, about, gallery, testimonials, FAQ and contact sections where the Brand Brain has supporting information.
- A static semantic HTML document is generated alongside the in-app site model so the future publishing/hosting layer does not need to redesign the content structure.
- Internal BUSY planning values and job-duration assumptions are not exposed as public website pricing.
- Added an in-app mobile website preview using the same saved draft.
- The website draft is persisted in the same owner-scoped local/cloud business snapshot as the rest of BUSY.
- Rebuilding from Brand Brain increments the draft generation and refreshes the site from the latest recorded business facts.
- Added safe conversational draft edits for layout/style/section changes, including requests such as “make it more premium”, “make the main photo bigger”, “hide the testimonials” and “bring the gallery back”.
- Added BUSY Operator intents `website_build`, `website_edit` and `open_website`.
- Because these V3.35 website actions affect only a private internal draft, those three voice commands can auto-apply after transcription without a second confirmation tap. They cannot publish, host, buy a domain or change DNS.
- “BUSY, build me a website” now creates/rebuilds the internal draft from Brand Brain and opens the website preview.
- Website Builder is surfaced from Home and directly from Brand & Business Identity.
- Publishing remains disabled in V3.35. The draft explicitly reports “Not published” and no domain/hosting authority exists yet.
- The next publishing sweep can resolve approved image assets, hosting, domains and controlled live updates behind a separate owner approval boundary.

## v3.34 Brand Brain / Business Identity
- Built directly on the V3.33 Follow-up Engine branch.
- Added `src/domain/brandBrain.js` as the authoritative public-identity projection over existing BUSY business facts, services, approved job/marketing photos and connected-account state.
- Added one persisted `brandProfile` object for information that did not previously have an authoritative home: public description, tagline, service-area wording, phone/email, opening hours, domain, social links, tone of voice, visual direction, colours, business story, differentiators, logo note, service descriptions, FAQs, approved testimonials and selected hero imagery.
- Existing BUSY business name, trade, postcode/radius and service records remain authoritative. V3.34 does not create a duplicate service catalogue.
- Added the Brand & Business Identity Centre with identity completeness, core gaps, service copy, tone/visual choices, FAQ/testimonial approval, social identity, photo-library intelligence and consistency checks.
- Positive customer feedback is not automatically treated as a testimonial. Only owner-added entries marked approved for public use flow into the website brief.
- Brand Brain indexes completed-job photos already approved for marketing and reusable cloud social media. Unapproved customer photos are not promoted into website content.
- Added deterministic website readiness and a structured `websiteBrief` handoff containing business identity, services, contact details, tone, visual direction, FAQs, approved testimonials and approved imagery for the planned V3.35 Website Builder.
- Home, Settings and Business data now surface Brand Brain readiness.
- BUSY Operator receives bounded Brand Identity context and a new answer-only `business_identity_summary` intent for questions such as “What is missing from my brand?” and “Am I ready to build my website?”. Missing public facts must never be invented.
- Recorded tone of voice now informs BUSY customer reply drafts and Social Media AI output when present.
- The social-content Edge Function now accepts sanitised Brand Brain context and service descriptions while retaining the same privacy/evidence restrictions.
- No website has been generated or published in V3.34. No domain/hosting authority has been introduced.
- The signed native iOS build remains an independent Apple provisioning gate; V3.34 remains testable through the existing Expo Go path.

## v3.33 Follow-up Engine / Communications Bridge
- Built directly on the tested V3.32 Communications Hub branch.
- Added `src/domain/followUpEngine.js` as a deterministic prioritisation layer over Communications Hub; it does not create another customer or message store.
- Customer communication is separated into **Reply now**, **Follow up today**, **Waiting**, **No chase**, and **Do not contact** so BUSY does not manufacture activity just because a conversation exists.
- Newer incoming communication and pending matched Inbox items outrank ordinary chasing. Contact preference and duplicate-contact protection remain authoritative.
- Waiting customers get a sensible review date derived from the latest recorded outbound contact and the type of journey follow-up, without claiming that a timer alone makes another message appropriate.
- Added warm opportunity recovery for existing enquiry/quote journeys where saved evidence genuinely supports a follow-up. These opportunities remain distinct from cold acquisition or advertising.
- Added provider-ready communication state: BUSY can model preferred contact route and preparation/delivery state now, while real SMS/email/WhatsApp sending remains disabled and can later attach behind the same approval boundary.
- Added the V3.33 Follow-up Engine screen with top priority, ready-to-prepare items, waiting safeguards, recovery opportunities and provider readiness.
- Home, Work, Communications Hub and individual customer conversation screens now surface the same Follow-up Engine state.
- BUSY Operator receives the same ranked follow-up context and can answer “Who should I chase today?” while preserving **Reply now → Follow up today → Waiting** rather than inventing work.
- Drafting remains one customer at a time through the existing BUSY reply-draft path. Prepared wording is never recorded as sent.
- The signed native iOS build remains an independent Apple provisioning gate; V3.33 remains testable through the existing Expo Go path.

## v3.32 Communications Hub / Unified Inbox 2.0
- Built directly on the provisionally accepted V3.31 Customer Journey 2.0 branch.
- Added `src/domain/communicationsHub.js` as a deterministic communication layer that joins customer-facing communication around the existing customer journey instead of creating a second CRM/message store.
- Added a new Communications Hub with four explicit lanes: **Needs attention**, **Awaiting customer**, **Draft ready**, and **Done**.
- Pending incoming Inbox items that can be safely matched to one customer are surfaced inside that customer's communication thread; unmatched or ambiguous incoming items remain separate and route back through the existing BUSY Inbox review flow.
- Each communication thread combines recorded outbound follow-ups/review requests, saved incoming customer-message/source evidence, pending matched Inbox items, the current customer journey next action and communication-related stalled signals.
- Added deterministic incoming-message guidance for likely acceptance, scheduling requests, price/scope concerns, positive feedback, likely declines and customer questions. These labels are guidance only and are explicitly confidence-limited rather than treated as facts.
- Added duplicate-contact protection: when the latest recorded real contact is outbound and no newer incoming reply is saved, BUSY places the thread in **Awaiting customer** and suppresses another draft/chase recommendation.
- Prepared wording remains distinct from communication recorded as sent. Internal outcome records are also kept separate from outbound contact so BUSY does not mistake admin history for a customer message.
- Customer contact preference remains authoritative. “Do not contact” blocks reply drafting.
- Added a per-customer Communication Thread screen showing latest incoming interpretation, duplicate-contact guard, joined communication history and the underlying Customer Journey next step.
- Customer Command Centre now links directly into the customer's communication thread.
- Work and Home now surface communication health without replacing the raw BUSY Inbox, which remains the source-review/filing surface.
- Added BUSY Operator intents for `communications_summary`, `customer_communication_summary` and `customer_reply_draft`.
- BUSY can now answer questions such as “Who am I waiting to hear back from?”, “What did Sarah last say?”, and “When did I last contact John?” using the same communication-thread state shown in the app.
- “Draft a reply to John” uses the latest saved incoming message, prior recorded communication and Customer Journey context. It creates editable wording only; it cannot send the message.
- No unrestricted customer-send authority was introduced. Communication analysis and drafting remain separate from any future real SMS/email/WhatsApp provider integration.
- The signed native iOS build remains an independent Apple provisioning gate; V3.32 remains testable through the existing Expo Go path.

## v3.31 Customer Journey 2.0 / Customer Command Centre
- Built directly on the provisionally accepted V3.30 Daily Command Centre branch.
- Added `src/domain/customerJourney2.js` as a deterministic per-customer journey selector instead of pushing more lifecycle logic into AppController.
- Each customer now gets one joined journey across enquiry capture, source records, notes/activity, quotes, bookings, reminders, completed jobs, review requests, follow-up outcomes and recorded social outcomes.
- Customer Detail now opens with a Customer Command Centre showing the journey stage, completed-job count/value, recorded communication count, stalled-journey warnings and one recommended next step.
- Added a joined chronological journey timeline so an owner can see the relationship from enquiry through repeat work without reconstructing it from separate screens.
- Added a dedicated communication-history view that distinguishes recorded sends/outcomes from ordinary customer activity and prepared wording.
- Added deterministic stalled-journey detection for quiet enquiries, ageing sent quotes, unresolved follow-up outcomes, past confirmed bookings, completed jobs missing a review request and repeat timing that has become due.
- The “What happens next?” recommendation is evidence/rule based: finish live customer work first, then warm follow-up/outcome capture, review/repeat opportunities, and otherwise explicitly says nothing needs forcing.
- Customer contact preference remains authoritative. A record marked “do not contact” will not be turned into an outbound follow-up recommendation.
- Added “Ask BUSY about [customer]” from Customer Detail. BUSY receives a compact copy of that customer’s joined journey and can answer what has happened, what is open, what communication is already recorded, what is stalled and the single best next step.
- Added BUSY Operator `customer_journey_summary` intent. It is answer-only; it does not gain permission to send messages, publish, spend money or silently change a booking.
- Multiple completed jobs are treated as one continuing customer relationship, with relationship totals and repeat timing retained alongside the current live action.
- Existing quote/booking/reminder/review action screens remain the mutation boundary; Customer Journey 2.0 routes into them rather than inventing parallel write paths.
- The signed native iOS build remains an independent Apple provisioning gate; V3.31 remains testable through the existing Expo Go path.

## v3.30 Daily Command Centre / Business Brain 3.0
- Built directly on the provisionally accepted V3.29 Work & Calendar 2.0 branch.
- Added a dedicated `src/domain/dailyCommandCentre.js` layer that ranks the current business into three explicit lanes: **Do now**, **Later today**, and **Watch**.
- The ranking order protects live customer obligations, record integrity, schedule conflicts and high-severity connection issues before optional growth activity.
- Added a new owner-facing Daily Command Centre screen with a morning picture, confirmed seven-day work, today’s booked value/load, estimated open capacity, approval/input counts and explainable priority cards.
- Each surfaced item includes a plain-English “why” so the owner can see why it is ahead of other work.
- Added a durable briefing checkpoint to the normal local/cloud business snapshot. The screen can compare the current saved-business signals with the last reviewed briefing and surface meaningful changes instead of relying on model memory.
- The comparison tracks confirmed work, today’s bookings, due quotes/reminders, quiet enquiries, Inbox attention, approvals, owner-input items, schedule overlaps, high-priority core/continuity issues and the active work-goal gap.
- Home now uses the Daily Command Centre as the main priority surface instead of duplicating several independent intelligence cards at the top.
- The Daily Command Centre reuses existing action surfaces; it does not introduce hidden automatic mutations. Customer actions, booking changes, publishing and spend keep their existing approval boundaries.
- Added BUSY Operator `daily_briefing` intent. “Brief me” can now summarise **Do now → Later today → Watch** using the same deterministic Daily Command Centre state and only mentions changes that actually exist in the saved comparison.
- Added a Talk to BUSY quick ask for the daily briefing.
- The briefing checkpoint is persisted locally and in the owner’s existing cloud business snapshot so the “what changed?” baseline survives normal app restarts and device/cloud restores.
- The signed native iOS build remains an independent Apple provisioning gate; V3.30 remains testable through the existing Expo Go path.

## v3.29 Work & Calendar 2.0
- Built directly on the tested V3.28 BUSY Operator 2.0 branch.
- Added a dedicated calendar-intelligence domain in `src/domain/workCalendar2.js`; day workload/capacity policy no longer lives inside the Work screen or AppController.
- The Work calendar now combines confirmed BUSY bookings, connected external-calendar commitments, quote follow-ups, customer reminders, enquiry check-ins and BUSY planned openings.
- Added a 60-day forward planning horizon so completely empty days are visible to the intelligence layer rather than disappearing simply because no record exists yet.
- Each current/future day is classified as Open, Light, Comfortable, Busy or Overloaded from saved scheduled hours and potential timed overlaps.
- Day detail now shows booked job count/value, scheduled hours, estimated open capacity, follow-ups, external commitments and overlap warnings.
- Open-capacity figures are deliberately labelled as planning guidance based on an approximately 7.5-hour planning day; BUSY does not claim an empty-looking day is definitely bookable.
- Timed BUSY bookings and connected-calendar commitments are compared for overlaps. BUSY surfaces a potential conflict but never silently moves either item.
- Overdue quote follow-ups, reminders and enquiry checks roll onto today’s attention list while preserving the original due date.
- Open/light days can show one evidence-backed repeat-customer candidate whose typical duration fits the estimated open capacity. This is a suggestion only; BUSY does not contact or book the customer.
- Work’s weekly overview now includes open/light days, calendar follow-ups, external commitments and potential overlaps rather than treating “no BUSY booking” as automatically free time.
- BUSY Operator receives compact calendar intelligence for the next 45 days, including day load, booked work, follow-ups, external commitments, overlap count and possible fill candidate.
- Added Operator answer intents for “What have I got Thursday?”, “Where have I got a gap?” and “Can I fit another job Friday?” using the calendar intelligence rather than guessing.
- “Show me Tuesday” still opens the calendar directly on the resolved day.
- Added a Talk to BUSY quick ask for finding the next sensible gap.
- The signed native iOS build remains an independent Apple provisioning gate; V3.29 is testable through the existing Expo Go path.

## v3.28 BUSY Operator 2.0
- Built directly on the tested V3.27 Operational Continuity branch.
- Expanded Talk to BUSY from navigation/draft preparation into a broader voice-first daily operating layer.
- Added confirmed, preview-first Operator actions for creating bookings, changing booking date/time/value, cancelling bookings, completing jobs, adding customer notes and setting safe follow-up reminders.
- Every record-changing Operator action is forced through explicit confirmation on both the backend router and the client. A model response cannot silently downgrade that confirmation requirement.
- Added one-level undo coverage for the new BUSY-triggered customer/booking/reminder changes using the exact pre-change customer/action snapshot.
- Added deterministic client-side command validation for ambiguous customer matches, missing booking date/time, nonexistent open bookings, empty notes and reminder collisions.
- Follow-up conversation now carries the current structured customer/date/time/value/note context so corrections such as “actually make it 3pm” or “make the value £350” can reuse the active subject.
- Added a dedicated next-best-action answer for “What should I do now?” using Executive Briefing priorities plus Continuity constraints rather than inventing activity.
- Calendar commands can now carry a resolved date; “show me tomorrow/Tuesday” opens the Work calendar focused on that day.
- Added Operator quick asks for today’s priority, tomorrow’s calendar and customer work that needs chasing.
- Added `src/domain/operator2.js` so customer matching, action validation, confirmation policy and preview construction live outside AppController.
- Preserved the hard authority boundary: Talk to BUSY still cannot directly send customer messages, publish public posts or spend advertising money.
- The native iOS build remains independent of this sweep. V3.28 can be reviewed through the existing Expo Go path while Apple device provisioning is unavailable.

## v3.27 Operational Continuity
- Built directly on the V3.26 First Native Connections branch while the first signed iOS development build remains dependent on Apple account/device provisioning.
- Added a deterministic Operational Continuity domain layer that separates a degraded provider or connection from the rest of the business instead of treating the whole app as unavailable.
- Added a dedicated Continuity Centre showing what can still be used now, the current recovery queue, connection health and pending native release gates.
- Cloud conflicts, cloud-sync limitations, social publishing errors, device-diary conflicts, Google Calendar conflicts/sync errors and remote-push errors are surfaced with explicit recovery routes.
- Core-record or booking inconsistencies remain Release Core issues; Continuity consumes that health signal rather than duplicating record-repair logic.
- Optional integrations are clearly labelled as optional. A missing social/calendar/push connection does not make BUSY report the business as broken.
- Home now surfaces continuity only when an important limitation exists, while the normal “BUSY underneath” card always exposes the Continuity Centre without cluttering the main priority view.
- The recovery model is fail-safe: provider uncertainty never grants permission to duplicate a post, silently overwrite a booking or invent a successful sync.
- Customer records, Work, Business Memory/Executive Briefing, social draft preparation and Talk to BUSY remain available when an isolated integration is degraded.
- Added `src/domain/operationalContinuity.js` so connection-health policy lives outside the already-large AppController.
- Expo Go remains the fast test path for V3.27. The signed iOS development build, remote-push token proof and custom-scheme OAuth return still wait on Apple device provisioning.

## v3.26 First Native Connections
- Built directly on the tested V3.25 Production Bridge branch.
- Added the first real server-side Google Calendar booking sync. Confirmed BUSY bookings are created/updated in the connected primary Google Calendar with customer, service, address, duration and a private BUSY mapping marker.
- Added durable server-only calendar event mappings. BUSY tracks the last agreed BUSY fingerprint and Google event times so an external Google edit is detected as a conflict rather than silently copied over.
- Added explicit conflict resolution: Keep BUSY time writes the BUSY booking back to Google; Use Google time updates the BUSY booking only after the owner chooses it, then records the new shared baseline.
- Google Calendar events that are not owned by BUSY are returned as external commitments and now feed the Executive Briefing scheduled-load view without becoming customer records.
- Added server-side Google access-token refresh. Google refresh tokens remain only in the server-only connection table.
- Added a production watcher backed by Supabase Cron. Every 15 minutes it can inspect saved business state and send deduplicated remote pushes for trusted events: approaching confirmed bookings, unresolved past bookings and stale sent quotes.
- Added server-only push-delivery dedupe records so the same business event is not repeatedly pushed every cron run. DeviceNotRegistered Expo tokens are disabled automatically when the push service reports them.
- Added EAS project-link automation. If the repository has an EXPO_TOKEN secret, the v3.26 workflow runs eas init and commits the generated EAS project ID back to app.json; otherwise it reports that the account-bound step remains.
- Added a manual native-development-build workflow for iOS/Android once the EAS project is linked and platform signing/device provisioning is ready.
- Preview and production EAS channels are now explicit.
- The existing Snack/Expo Go path remains available as the fallback. Native-only push token registration and the custom-scheme OAuth return still require the first development build to be installed on the device.
- Existing owner approval rules remain unchanged; calendar sync never sends customer communication and server pushes only open the relevant BUSY work.

## v3.25 Production Bridge
- Built directly on the tested V3.24 Release-Grade Core branch.
- Added committed EAS development / preview / production build profiles, Node 22 production checks, native iOS/Android application identifiers, the `busydoesit://` URL scheme and app-version runtime policy.
- Added `expo-dev-client` for the first proper native development build while keeping the existing Snack/Expo Go publisher as a fast fallback.
- Added a deterministic Production Bridge screen and readiness gates. A capability is shown as Ready only when the actual runtime/backend requirement is present.
- Added an owner-scoped `busy_push_devices` registry with RLS. A native development build can obtain an Expo push token using the real EAS project ID and register it against the signed-in BUSY owner/business.
- Added authenticated `busy-push-dispatch` backend groundwork. V3.25 exposes only an owner test action, allowing end-to-end remote push verification without creating a broad server-send authority.
- Added server-only Google Calendar OAuth tables and a `busy-calendar-oauth` Edge Function. OAuth state, Google access tokens and refresh tokens stay server-side; the mobile app receives only status and the authorization URL.
- Google Calendar OAuth uses the existing server Google client credentials when available, a 10-minute one-time state, the minimal calendar event/calendar-list scopes needed for the planned bridge, and the `busydoesit://oauth/google-calendar` native callback.
- Added a production foundation GitHub check so future version branches validate build profiles, native identifiers, required plugins and production dependencies automatically.
- Added `src/domain/productionBridge.js` so production readiness stays outside AppController; V3.24’s release-domain extraction continues rather than reversing back into a monolith.
- Expo Go cannot generate the final production push token or receive the custom native OAuth callback. Those two gates intentionally remain marked as development-build work until the Expo account creates the EAS project ID and first native build.
- Hard authority boundaries remain unchanged: remote notifications open BUSY work; they do not send customer messages, publish posts, spend money or silently change bookings.

## v3.24 Release-Grade Core + Home Simplification
- Built directly on the tested V3.23 Proactive BUSY + Connected Diary branch.
- Home is now a single BUSY command centre instead of separate feature cards fighting for attention. The first screen focuses on one current priority, confirmed 7-day work, approvals/input, core health and the Talk to BUSY microphone.
- Autopilot, Business Memory, Executive Briefing, Proactive BUSY and release checks remain fully available underneath Home; they surface separately only when owner judgement or a useful drill-down is needed.
- Removed duplicate Home rendering of the same “best move” across Executive Briefing, Next Best Actions and proactive-watch cards. Other ranked recommendations are collapsed behind one optional control.
- Added a deterministic Release Core health screen for orphan customer/action links, invalid or overdue bookings, completed bookings missing job history, duplicate phone/email contacts, connected-diary conflicts, cloud conflicts and stale local reminders.
- Manual customer creation now blocks an obvious duplicate phone record and offers to open the existing customer instead.
- A new enquiry reuses an existing customer only when the phone match is backed by the same customer name; it appends the enquiry activity rather than creating a second customer record. Shared phone numbers with different names are not auto-merged.
- Added `src/domain/releaseCore.js` for release/lifecycle consistency checks and Home command-centre selection, beginning the next architecture phase outside the already-large AppController.
- Release Core issues route back into existing booking/customer/Inbox/diary/cloud repair surfaces instead of introducing hidden automatic fixes.
- Existing approval boundaries remain unchanged: no release-hardening path can send a customer message, publish, spend money or silently reconcile an important booking.
- Main navigation remains Home / Work / Results / Settings.

## v3.23 Proactive BUSY + Connected Diary
- Built directly on the tested V3.22 Executive Briefing branch.
- Added real local scheduled notifications using expo-notifications: morning briefing, confirmed-job reminders, post-job outcome prompts, one highest-value due obligation and one Approval Inbox summary.
- Notification priority is deliberately capped and deduplicated. BUSY does not schedule a notification for every optional opportunity.
- Added owner-controlled morning time, quiet hours and 30/60/120-minute job reminder lead times.
- Added notification response routing so tapping a reminder opens the exact booking, quote follow-up, customer, BUSY Inbox item, Approval Inbox or Executive Briefing.
- Added a 10-second test notification and manual “remind me in 1 hour” flow.
- Added a device-calendar bridge using Expo Calendar in the SDK 54 Snack preview: owners can choose a writable device calendar, create/update BUSY confirmed bookings, detect cancelled BUSY bookings and read other calendar commitments for the next 7 days.
- If a Google Calendar account is already configured on the device, its writable calendar can be selected through the device bridge; this is not yet the deeper Google OAuth server integration.
- External calendar time changes are surfaced as explicit conflicts. BUSY never silently changes an important booking: the owner chooses “keep BUSY time” or “use calendar time in BUSY”.
- Other selected-calendar commitments feed the Executive Briefing scheduled-load rows locally without creating customers or sending event details to BUSY Operator.
- Notification permission, native scheduled-notification IDs, selected device-calendar IDs and native event mappings stay device-local so one phone cannot corrupt another phone’s native state. Business data and higher-level intelligence continue through the normal cloud snapshot.
- The current Snack preview targets Expo SDK 54, where expo-calendar is available in Expo Go. The production Expo 57 path will need the newer Calendar API/development build before App Store release.
- Remote push remains a production-build step; V3.23 uses local scheduled notifications so the current Expo Go testing workflow remains usable.
- Hard authority boundaries remain unchanged: a notification or diary sync never grants permission to contact customers, publish publicly or spend money.

## v3.22 Executive Briefing + Forward View
- Built directly on the tested V3.21 Business Memory branch.
- Home now opens with an executive briefing: the most important recorded issue, confirmed 7-day work, risk count and a confidence-aware 30-day outlook.
- Added a dedicated Executive Briefing screen with confirmed 7/30-day bookings, warm quote range, repeat-work range, scenario view, scheduled-load radar, risk radar and a record-based weekly review.
- Confirmed booked value is never blended into a single factual number with forecast pipeline. BUSY presents confirmed work separately and labels variable quote/repeat projections as ranges.
- Forecast ranges use the existing Business Memory quote-follow-up and reactivation evidence. Weak samples deliberately produce wider ranges and a lower confidence label.
- Added next-7-day scheduled-load rows using saved bookings plus configured service planning durations. They are labelled as scheduled load, not assumed total working capacity.
- Added risk signals for unresolved past bookings, ageing quotes, a light forward diary, concentrated confirmed service value, owner-input items and open capacity goals.
- Added three scenarios: no new work, evidence-weighted warm quotes, and warm quotes plus repeat potential.
- Added a last-7-days review covering completed jobs/value, quote outcomes/wins, reviews, social booking outcomes and Business Memory changes.
- BUSY Operator now receives the Executive Briefing context and can answer “How does next week look?”, “Am I on track?”, “What is the biggest risk?” and similar questions without inventing future revenue.
- Existing owner rules, Controlled Autopilot boundaries and explicit approvals remain unchanged.
- Main navigation remains Home / Work / Results / Settings.

## v3.21 Business Memory / Long-term Learning
- Built directly on the tested V3.20 Controlled Autopilot branch.
- Added durable Business Memory snapshots so BUSY can compare current evidence with previous distinct evidence states instead of recalculating without history.
- Outcome memories now move through visible confidence stages: Too early to tell, Early signal, Useful evidence and Strong evidence.
- Samples below three remain visible but have zero ranking authority. Evidence influence grows gradually and stays bounded even at strong confidence.
- Existing quote-follow-up, quiet-enquiry, previous-customer, review and social outcomes feed the memory using real saved results and existing freshness weighting.
- Added service-value memory, quote-value-band memory, social-destination memory and repeat-interval memory where enough real records exist.
- Added a dedicated Business Memory screen with “BUSY learned this month”, current outcome memories, recent evidence shifts, service/value/channel/repeat patterns and ranking effects.
- Home now surfaces the strongest usable learned pattern and whether anything materially changed since the previous memory snapshot.
- Business Brain links directly into Business Memory and shows the new confidence layer.
- BUSY Operator now receives the bounded Business Memory context, so “why have you changed your mind?” can be answered from recorded evidence, sample size, confidence and ranking effects instead of generic AI reasoning.
- Business Memory snapshots and review timestamps are included in the normal per-business local and cloud snapshot.
- Owner rules, live customer obligations and hard approval boundaries continue to outrank learned patterns.
- Main navigation remains Home / Work / Results / Settings.

## v3.20 Controlled Autopilot
- Built directly on the tested V3.19 BUSY Operator branch.
- Added three explicit authority levels: Off, Prepare for me (recommended default) and Trusted internal actions.
- Prepare for me automatically prepares safe internal quote/enquiry follow-up wording and gathers already-prepared review/social work into one Approval Inbox.
- Trusted internal actions also enables the existing high-confidence safe record-filing evaluator; it does not expand authority to customer sends, public publishing, advertising spend or important booking changes.
- Added a Home Autopilot briefing showing how many prepared items are ready for approval and how many items need owner input.
- Added a dedicated Approval Inbox that routes each item into the existing final review/approval flow rather than executing external actions itself.
- Added Needs your input for low-confidence incoming records, owner-rule contact-limit conflicts, unresolved past bookings and missing real social outcomes.
- Added owner rules in normal English. V3.20 directly enforces contact-count limits where the saved activity supports them and exposes paid-advertising blocks while existing Business Brain rule logic continues to influence recommendations.
- Added safe automatic preparation checks when the app/cloud workspace is restored or relevant saved-business evidence changes.
- Added 24-hour snooze/restore controls plus a preparation log.
- Fixed V3.19 cloud snapshot coverage so recent Operator conversation context, operating snapshot and BUSY action audit are included with the business cloud snapshot alongside V3.20 Autopilot state.
- Hard boundaries remain: Autopilot cannot autonomously send customer messages, publish publicly, spend money, delete records or silently change important bookings.
- Main navigation remains Home / Work / Results / Settings.

## v3.19 BUSY Operator
- Built directly on the tested V3.18 Talk to BUSY voice/text layer.
- Talk to BUSY is now conversational rather than isolated-command based: the current subject, recent references and the last prepared draft are carried across turns.
- BUSY asks one focused clarification question when a required customer, date or other material detail is missing instead of failing or guessing.
- Added multi-step Operator Plans for goals such as filling a quiet day. Plans rank warm/live customer work first, then low-cost opportunity steps, while keeping each step individually controlled.
- Added conversational draft refinement: owners can say “shorter”, “friendlier”, “less salesy” or add a detail and BUSY revises the most recent relevant draft.
- Added a real “what changed since last BUSY conversation?” comparison using saved operating counts and values rather than invented narrative.
- Added visible action previews for booking/job-completion record changes before confirmation.
- Added a BUSY internal action audit trail and one-level undo for BUSY-triggered booking-preparation or job-completion record changes.
- Conversation does not expand authority: customer sends, public publishing and advertising spend still require their existing explicit approval paths.
- Recent conversation context, operator snapshot and audit history stay inside the normal per-business local/cloud snapshot.
- Main navigation remains Home / Work / Results / Settings.

## v3.18 Talk to BUSY
- Built on the modular V3.17.1 architecture and keeps the existing Proactive BUSY / Business Brain behaviour.
- Added a prominent Home microphone entry and typed-command alternative so the owner can tell BUSY what they want in normal language.
- Added genuine voice recording in Expo Go using expo-audio. Voice clips are sent only when the owner deliberately records a command.
- Added an authenticated busy-command Supabase Edge Function that transcribes voice server-side, interprets text/voice into a constrained command schema and keeps the OpenAI key off-device.
- Supported command routes include today/weekly work, calendar, due quote follow-ups, repeat customers, find-more-work, customer lookup, booking preparation, job completion, social-draft preparation, previous-customer draft preparation, BUSY Inbox, Results and Settings.
- Creating a booking or marking a job complete always stops at a visible confirmation card before changing a record.
- Voice commands cannot directly send customer messages, publish publicly or spend advertising money. Existing approval boundaries remain authoritative.
- Added Recent conversations with BUSY and stores the last 20 command/response pairs with the normal per-business local/cloud snapshot.
- Added graceful ambiguity handling: BUSY asks for a clearer request instead of guessing a customer, booking date or business fact.
- Main navigation remains Home / Work / Results / Settings.

## v3.17.1 Modular Architecture
- Structural refactor built from the existing V3.17 Proactive BUSY code without intentionally changing product behaviour.
- Replaced the single ~20,000-line application file with a small entry point plus dedicated core, controller, reusable UI, screen-domain and theme modules.
- Split the visible product into onboarding, Home, Work, BUSY Inbox/intake, customers/jobs, social/Business Brain, Results and Settings modules.
- Kept shared ranking/intake/date/value helpers and configuration in a central core runtime instead of duplicating logic across screens.
- Kept the state/orchestration layer central for behavioural safety while removing the thousands of lines of screen JSX from it.
- Updated Snack publishing so the complete module tree is uploaded and every JS/JSX module is syntax-checked before a preview is created.
- V3.16 and the original V3.17 branches remain untouched as fallbacks.
- No customer message, public post, cloud-tenancy rule, account-security boundary or advertising authority is intentionally changed by this refactor.
- See ARCHITECTURE.md for the new file map.

## v3.17 Proactive BUSY
- Built directly from the tested V3.16 Business Brain Intelligence 2.0 branch.
- Added a separate proactive signal engine so BUSY can surface useful combinations in the saved business records instead of waiting for the owner to inspect every area manually.
- New proactive patterns include clusters of BUSY Inbox items needing review, multiple quiet quotes, a light seven-day diary with a usable previous-customer pool, repeat-service windows approaching together, completed jobs with reusable follow-on value, and missing outcome data that would improve the Business Brain.
- The proactive layer is deliberately separate from Next Best Actions. Live customer obligations and ranked work still keep their existing authority; “BUSY noticed” is a nudge layer, not a second competing task list.
- Home now surfaces the strongest non-duplicate proactive pattern with its reasoning and evidence, plus a route into the full BUSY noticed watchlist.
- Work now includes the current proactive watch alongside the weekly plan so capacity, pipeline and timing patterns are visible where the owner naturally plans the week.
- Added a dedicated BUSY noticed watchlist showing active patterns, evidence, safe next actions and temporary hidden state.
- Owners can choose Not now to hide a current pattern for 24 hours or Seen to hide the current occurrence for seven days. A changing underlying signal receives a new occurrence ID and can surface again legitimately.
- Proactive hidden/seen state is stored per business in the same local/cloud persistence layer as the rest of BUSY rather than becoming a device-only preference.
- Business Brain now shows how many proactive patterns are active or temporarily hidden and links directly to the watchlist.
- Completed-job, quote, repeat-work and capacity nudges still prepare or open review flows only. V3.17 does not auto-message customers, auto-publish posts or spend money.
- Existing Facebook/Instagram publishing, V3.15 production safety, V3.16 ranked learning and the waiting Google Business integration remain unchanged.
- Main navigation remains Home / Work / Results / Settings.

## v3.16 Business Brain Intelligence 2.0
- Built from the tested V3.15 production-security baseline.
- Home now shows a ranked Top 3 Next Best Actions rather than one best move plus an unstructured list.
- Live customer obligations still rank first; optional opportunities are then weighed using likely business value, zero/low-cost leverage, real outcome evidence, evidence freshness, owner choices and owner-set rules.
- Every ranked recommendation can show a visible priority number, a cautious business-value label, decision confidence and the existing Why is this? evidence.
- Optional recommendations now teach BUSY in both directions: choosing one creates a small bounded positive signal, while dismissing one keeps the existing bounded negative feedback path.
- Owner-choice learning stays narrow and service-aware where possible. It cannot overpower real recorded outcomes, waiting enquiries, bookings, promised follow-ups or hard owner rules.
- Business Brain now exposes chosen vs dismissed recommendation history and the bounded ranking effect by recommendation family.
- Added a completed-job 3-step bundle: review request, finished-job social proof and repeat-service timing can all be prepared from the same saved completed job.
- Prepare all safe next steps only prepares internal drafts/timing. Customer messaging and public publishing still require explicit owner approval.
- Duplicate review/social Home cards for the same completed job are suppressed while the bundle is active.
- The completed-job bundle is surfaced from Home, the Work weekly plan and relevant completed-job history so the same intelligent follow-on is reachable from the places owners naturally work.
- Existing Facebook/Instagram live publishing, V3.15 security/reliability, per-business cloud tenancy and the waiting Google Business integration remain unchanged.
- Main navigation remains Home / Work / Results / Settings.

## v3.15 Production Security & Reliability
- Built from the tested V3.14 account-control foundation.
- Added request timeouts and clearer network-failure handling to Supabase Auth, cloud-data and social-publishing calls instead of allowing requests to hang indefinitely.
- Session refresh no longer signs a user out simply because the phone is temporarily offline; BUSY only clears the saved session when the refresh token is genuinely rejected or expired.
- Live publishing and retry requests deliberately do not auto-repeat after an uncertain network result, preventing a timeout from accidentally causing duplicate public posts.
- Added a request ID to sensitive social/backend calls for safer troubleshooting without logging customer content or provider tokens.
- Added server-side rate limits for OAuth starts, live-publishing switches, scheduling, publish-now, retry, provider disconnect and account removal.
- Added a server-only security-event table used for short-retention abuse protection and diagnostics. It does not store passwords, provider tokens, captions, customer messages or other business content.
- Revoked direct anon/authenticated table privileges from the server-only social connection, OAuth-state and publishing tables; the Edge Function service role remains the only backend path.
- Added explicit client-deny RLS policies to the old workspace owner/settings tables so their server-only intent is visible to the database security linter.
- Confirmed the BUSY social-media storage bucket is private.
- Strengthened new-account password validation in the app to require at least 10 characters containing both a letter and a number.
- Added production-safety visibility to Account & recovery and Connected Accounts.
- Supabase's leaked-password screening remains a project-level dashboard setting to enable before App Store release; it is not exposed by the connected management tool.
- Main navigation remains Home / Work / Results / Settings.

## v3.14 Account Deletion & Data Control
- Built from the tested V3.13 business-separated tenancy foundation.
- Added a genuine in-app owner account-removal flow with export-first guidance, typed DELETE confirmation, exact signed-in-email confirmation and a final destructive confirmation dialog.
- The server now validates the authenticated owner and business before any removal can happen; admins cannot use the owner-deletion route.
- Self-service removal is deliberately blocked if a business has other members or if the account owns multiple businesses, so one user cannot accidentally wipe shared data.
- Before removing BUSY data, the backend collects BUSY-stored social-media paths, attempts to revoke connected Meta/Google authorization, removes those stored files, then deletes the Supabase Auth account.
- Deleting the Auth account cascades through the user's BUSY business, membership, cloud snapshot, social connections, publishing settings and publishing records through the V3.13 tenant foreign keys.
- Existing posts already published on Facebook or Instagram are not deleted from those platforms; the UI states this clearly before confirmation.
- After successful server removal, the app clears the secure session and the deleted user's private local cache before returning to the signed-out account gate.
- The normal Sign out action remains non-destructive and preserves that account's private device cache.
- Existing Facebook/Instagram live publishing and Google Business waiting-state logic remain unchanged for normal accounts.
- Main navigation remains Home / Work / Results / Settings.

## v3.13 Business-Separated Social Tenancy
- Built from V3.12 after the account, local-cache and cloud-recovery foundation was tested.
- Added a real business_id tenant boundary to social provider connections, OAuth states, publishing records and publishing settings in Supabase.
- Migrated the existing BUSY prototype Meta connection, publishing history and live-publishing settings onto the authenticated owner's business without deleting or reconnecting the working Facebook/Instagram setup.
- The social publishing Edge Function now resolves the signed-in user's business membership server-side; the app never chooses or supplies another business ID as an authority.
- Facebook, Instagram and future Google OAuth state now carries the initiating business so provider callbacks return to the correct tenant.
- Provider connection lookup, draft lookup, scheduling, retry, cancellation, queue/history and live-publishing settings are now scoped by business_id rather than one shared "prototype" workspace.
- Scheduled publishing now scans due records across businesses, then checks each record's own business settings and provider connections before publishing.
- New uploaded social media is stored under a business-specific storage path; historic prototype media remains readable through its saved storage path.
- Added a Meta app-scoped user identity field for future deauthorization/data-deletion routing without touching another business's connection.
- The mobile app now validates the publishing server's returned business ID against the cloud workspace and blocks a mismatch rather than displaying cross-business data.
- Connected Accounts now shows publishing-tenancy health so the owner can see when the social backend matches the signed-in business.
- Existing live Facebook/Instagram publishing remains enabled for the migrated owner. Google Business remains waiting for external API eligibility/approval rather than being faked.
- With provider data now inside the same tenant boundary, a genuine self-service account deletion flow can be built next without knowingly leaving the old shared social workspace behind.
- Main navigation remains Home / Work / Results / Settings.

## v3.12 Account Safety & Recovery
- Built directly from the tested V3.11 production-data foundation.
- Added a real account gate: unsigned users no longer drop straight into whichever business data happened to be visible on the device.
- Local persistence is now isolated per Supabase user ID. The old shared prototype key is read only as a one-time migration source instead of remaining the normal storage location.
- Sign-out now clears the visible business state without deleting that account's private device cache, preventing one signed-out user from exposing their working data to the next account.
- Added recovery-aware cloud loading: BUSY checks the signed-in user's private device cache first, then restores the authoritative business snapshot from Supabase.
- Added optimistic cloud revisions. A stale device can no longer silently overwrite a newer cloud snapshot; BUSY stops the save, surfaces the conflict and asks the owner to restore the latest cloud copy.
- Added manual cloud restore and Sync now controls, with last-sync time and revision visibility.
- Added a user-facing data export through the native share sheet. The export includes the current BUSY business snapshot and account/workspace metadata, but deliberately excludes provider access tokens.
- Added password-recovery email requests to the account gate and Connected Accounts.
- Added a dedicated Account, privacy & recovery screen explaining the local cache, cloud copy and server-only provider-token boundary.
- Kept Facebook/Instagram publishing, schedules, receipts and the waiting Google Business integration unchanged.
- Full self-service account deletion remains intentionally blocked until the older prototype social workspace is migrated into the same per-business tenancy model; BUSY does not claim a deletion is complete while provider data would remain elsewhere.
- Main navigation remains Home / Work / Results / Settings.

## v3.11 Production Data Foundation
- Started from the tested V3.10 branch and preserves the live Facebook/Instagram publishing architecture plus the waiting Google Business connection.
- Added a real multi-user BUSY account path instead of a single hard-coded owner email. Existing owner sessions remain compatible, while the sign-in UI can now use any authorised account email.
- Added Supabase business workspaces, memberships and cloud snapshots. Each signed-in user is attached to a business workspace and core app state is stored behind authenticated Row Level Security.
- Added first-run cloud migration: when a signed-in business has no cloud snapshot yet, the existing local prototype data is uploaded as its first protected cloud backup rather than discarded.
- Added restore-on-sign-in: a business with an existing cloud snapshot can restore customers, services, work goals, bookings/quotes encoded in the customer pipeline, BUSY Inbox data, social drafts and Business Brain learning onto a device.
- Kept AsyncStorage as a fast local cache while adding a debounced cloud mirror, manual Sync now control, cloud status, last-sync time and revision visibility in Settings.
- Added separate business membership boundaries in Postgres so one authenticated user cannot read another business's snapshot through the public API.
- Hardened new RLS policies and added indexes for the new business-ownership path.
- Kept provider tokens and social publishing records server-side. V3.11 does not weaken the V3.10 public-post approval controls.
- This is a production-data foundation, not the final account/privacy phase. V3.12 should add account deletion/export, stronger recovery/conflict handling, per-user local-cache isolation and migrate the remaining prototype social workspace key into the new business tenancy model.
- Main navigation remains Home / Work / Results / Settings.

## v3.10 Google Business live connection
- Started directly from the tested V3.9 branch; V3.9 remains the known-good baseline.
- Finishes the second genuine external publishing connection rather than adding another simulated intelligence layer.
- Uses one clean OAuth callback path for Google Business: `/functions/v1/busy-social-publish/callback/google_business`, matching the callback shown inside the app.
- Preserves Google OAuth authorization even when Business Profile API approval or API enablement is not ready yet, so setup can recover without repeating consent unnecessarily.
- Separates Google OAuth authorization, Business Profile account/location discovery and actual Local Posts publishing readiness.
- Adds a server-side Google re-check action so BUSY can retry account/location discovery after Google Cloud approval or API configuration changes.
- After a Google location is selected, BUSY performs a read-only Local Posts API check before treating Google Business as a connected publishing destination.
- Google Business remains unavailable to post selection until the Local Posts check succeeds; a merely authorized Google account is not presented as publish-ready.
- Google API permission/enablement failures are converted into useful setup guidance while tokens remain server-side.
- Existing Facebook/Instagram connection, Meta account lock, owner authentication, live-publishing switch, scheduling, provider-specific receipts and retry-only-failed-channel safeguards remain intact.
- No new permanent navigation area was added; Google setup and verification stay inside Connected accounts / Social Control Centre.
- The next major intelligence phase can therefore be built against three real connected publishing channels instead of relying on simulated channel state.

## v3.9 Weekly Command Centre
- Promoted the Work tab from a collection of operational metrics into a weekly command centre without adding another permanent navigation area.
- Added a rolling seven-day summary of booked jobs, booked value, days containing booked work, days with no booked job and the number of recorded customer/record items needing attention.
- Added BUSY's weekly plan: a maximum of three ranked next steps generated from existing business records rather than invented activity.
- Weekly priorities protect existing obligations first: overdue booked work, BUSY Inbox items needing review, promised follow-ups, due quote follow-ups and live enquiries outrank marketing.
- Warm-demand recovery, outcome recording, active work-goal continuation and prepared background work can enter the weekly plan after higher-authority operational work.
- Published-post, quote-follow-up and enquiry-follow-up outcomes can surface as weekly learning tasks so the Business Brain improves from real results instead of treating activity itself as success.
- An existing capacity goal stays authoritative. V3.9 points back into the same adaptive work-filling plan rather than starting a duplicate campaign for the same diary gap.
- When there is genuinely nothing urgent, BUSY says so instead of manufacturing a task. If the week has no booked work, Find more work remains an explicit owner choice.
- Added a 14-day capacity and opportunity radar. It looks beyond the immediate week for saved work in days 8–14, repeat-customer timing windows, sent quotes approaching their follow-up date and live enquiries nearing the quiet-enquiry threshold.
- The look-ahead stays factual: it reports what is present in BUSY's saved records and explicitly avoids pretending to predict future demand.
- Added a persistent "What changed?" briefing on Work. BUSY compares the current operating snapshot with the last time the owner opened Work and surfaces material changes in weekly booked jobs/value, live enquiries, due quotes, Inbox attention, social-outcome learning and the active work-goal gap.
- The briefing snapshot is local operating context only and is cleared with Reset Prototype.
- Surfaced the strongest already-prepared background action directly in Work: a review request, finished-job social post, quote follow-up or quiet-enquiry follow-up can be opened from the weekly command centre while keeping customer-facing approval intact.
- Finished the V3.9 operating loop with a calmer Home briefing. Home now shows one compact "BUSY has checked the business" summary, the most important current move and the next saved booking/week value, while detailed weekly reasoning stays inside Work.
- Home keeps a tiny local next-session snapshot so it can mention one meaningful change rather than duplicate the full Work change log. Reset Prototype clears this context too.
- Added proportionate capacity reasoning to Work. One missing booking keeps activity narrow around live/warm demand; two gaps can justify a small warm-customer plan; larger genuine gaps can justify broader free-first activity before paid reach.
- The proportional explanation uses the selected service's saved typical duration and the next available planning slot, while an active work goal remains authoritative.
- Added genuine ahead-of-time preparation: when there is nothing more urgent, a sent quote approaching its follow-up date or a live enquiry approaching the quiet threshold can have wording opened for review before it becomes overdue.
- The weekly plan remains derived from current records rather than a frozen task list, so bookings, quote/enquiry outcomes and work-goal progress automatically remove or reorder no-longer-relevant actions.
- The existing monthly diary, day detail, pipeline, Social Control Centre, live publishing and all V3.8 duplicate-publishing protections remain intact.
- Main navigation remains Home / Work / Results / Settings.

## v3.8 Social Control Centre + channel-safe live publishing
- Completed the Social Control Centre around real provider state, publishing receipts, schedules, failures and business outcomes.
- Added Google Business as a first-class live destination alongside Facebook and Instagram, including Business Profile location selection and server-side publishing.
- Added provider-specific results so each selected destination can succeed or fail independently.
- Retries now send only failed destinations; successful Facebook, Instagram or Google Business posts are not duplicated.
- Partially published records remain locked publishing history while failed destinations stay retryable.
- Completed-job records distinguish destinations that actually published from destinations that failed, keeping outcome evidence truthful.
- Scheduled, publishing and published records cannot silently regress into fresh drafts or create duplicate publishing instructions.
- The Social Control Centre separates ready-to-post work, schedules, items needing attention, recent publishing history and outcome reminders.
- Owner authentication, explicit live-publishing control and provider authorization remain separate safety boundaries.

## v3.5 Live social publishing + scheduling
- Replaced the simulated social-publishing boundary with a real server-side publishing architecture while keeping live external posting deliberately disabled until provider credentials and stronger owner authentication are complete.
- Added the `busy-social-publish` Supabase Edge Function for Meta and Google Business Profile OAuth, provider connection health, cloud drafts, media upload, scheduling, publishing, provider receipts and error handling.
- Added server-side OAuth state handling so Facebook / Instagram and Google Business authorization callbacks return directly to BUSY's Supabase backend. Provider tokens never enter the mobile app.
- Meta support is designed for an authorized Facebook Page and its linked Instagram professional account. BUSY can discover available Pages, require an owner selection when multiple Pages exist, and retain the selected Page / Instagram account server-side.
- Google Business support is designed to discover authorized accounts and locations, require a location selection when needed, refresh Google access tokens server-side and retain the selected location.
- Added private Supabase Storage bucket `busy-social-media`. Selected post photos are uploaded privately and fresh signed URLs are generated only when a provider needs to fetch the media.
- Added cloud publishing tables for provider connections, OAuth states and social posts. All three tables have RLS enabled plus explicit deny-all client policies; normal app clients cannot read provider tokens or publishing records directly.
- Added a real publishing queue with statuses including Draft, Held for setup, Scheduled, Publishing, Published, Partial failure and Failed.
- Added Postgres Cron + pg_net worker invocation once per minute. Only due posts that are explicitly owner-approved and genuinely Scheduled can be processed.
- While live publishing is disabled, test schedules are stored as Held for setup with owner approval cleared. Enabling live publishing later cannot accidentally release an old test schedule; the owner must approve it again.
- Added independent server-side destination checks. A stale or modified client cannot publish to Facebook / Instagram / Google Business unless the required provider account is genuinely connected; Instagram additionally requires a linked professional account.
- Added provider-specific publishing receipts and errors to the original social post record so BUSY can show what each provider accepted or rejected.
- Added a simple Social Media publishing calendar showing upcoming Scheduled or Held items and their selected destinations.
- Rebuilt Social Media Centre connection health around real provider state rather than V3.4's prototype toggles.
- Rebuilt post review so destinations appear only when genuinely connected. Generated AI recommendations cannot smuggle an unconnected destination into the publishing payload.
- Cloud-backed drafts can be saved before a provider is connected. Media storage, caption, source job/customer link and provider status stay together.
- Added queue synchronization back into local social drafts and completed-job records so Published / Failed / Scheduled state remains attached to the original business evidence.
- Social publishing itself is not treated as proof of business value. The Business Brain continues to learn from recorded enquiries, quotes, bookings and value rather than vanity metrics.
- Added `BUSY_LIVE_PUBLISHING=enabled` as an explicit server safety switch. It remains OFF in the current prototype.
- Live outgoing publishing should not be enabled while the app is identified only by a public Supabase publishable key. Proper BUSY owner authentication is the remaining safety prerequisite before the external side-effect switch is turned on.
- Meta developer credentials (`META_APP_ID`, `META_APP_SECRET`) and Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are not configured yet. V3.5 shows that setup state honestly instead of pretending the accounts are connected.
- Added Deno/backend validation for all three BUSY Edge Functions: AI Intake Brain, Social Content AI and Social Publishing.
- Added explicit server-only database policies and verified the publishing endpoint with a live HTTP 200 smoke test.
- Main navigation remains Home / Work / Results / Settings. V3.4 Operational Business Brain, V3.3 Social Media Centre, V3.2 AI Intake Brain and all existing approval/safety boundaries remain intact.

## v3.4 Operational Business Brain
- Promoted the Business Brain from an evidence display into a live recommendation layer used by Home.
- Added a Business Brain evidence ledger for previous-customer reactivation, quiet-enquiry follow-ups, quote follow-ups, finished-job social content and review requests.
- Every tracked pattern now exposes its recorded sample, observed successes, confidence, last evidence date and freshness.
- Evidence freshness changes recommendation weight without deleting old evidence: Fresh (≤30 days), Current (≤90 days), Ageing (≤180 days), then Stale. Older evidence remains visible but has a smaller ranking effect.
- Existing evidence adjustments are now freshness-weighted before Home ranks marketing opportunities.
- Added recommendation feedback. Tapping “Not useful” asks for a lightweight reason instead of silently discarding the suggestion.
- Feedback reasons include Just not now, Not suitable for my business, Wrong time of year, Too far away, Not worthwhile financially and Don’t suggest this again.
- “Just not now” hides the current suggestion without teaching a negative long-term pattern. The other business-specific reasons gently reduce similar future opportunities.
- Feedback is service-aware whenever the recommendation has a known service, so rejecting one driveway-cleaning idea does not automatically penalise unrelated services.
- “Don’t suggest this again” creates a removable owner rule that blocks that recommendation family, narrowed to the known service where possible.
- Hard recommendation rules apply only to marketing/opportunity suggestions. They cannot hide live customer obligations such as waiting enquiries, confirmed bookings or promised follow-ups.
- Manual owner rules now carry an explicit scope such as Social content, Work area, Season, Pricing, Customer contact or Global. Rules remain owner-set/highest authority rather than inferred AI facts.
- The Business Brain screen now shows which rules actively block recommendation types, recent recommendation feedback and the current ranking effect of each evidence pattern.
- Social AI continues to receive the full owner-rule set, so V3.3 content creation respects the same Business Brain rules.
- Results now surfaces an Operational Business Brain summary so the learning layer is visible outside its dedicated screen.
- Reset Prototype now clears V3.3/V3.4 social and Business Brain state as well as earlier prototype records.
- Improved long-form iPhone usability by allowing interactive keyboard dismissal throughout the main scroll container.
- Main navigation remains Home / Work / Results / Settings. V3.3 Social Media Centre, V3.2 AI Intake Brain, V3.1 reconciliation/calendar and all existing approval/safety boundaries remain intact.

## v3.3 Social Media Centre + Business Brain foundation
- Added a proper Social Media Centre without adding a fifth permanent bottom tab. It is reachable from Home, Results and Settings while the primary navigation remains Home / Work / Results / Settings.
- Owners can create content from deliberately selected phone photos or from completed-job photos already marked as reusable for marketing suggestions.
- Added a live server-side `busy-social-content` Supabase Edge Function using the existing private `OPENAI_API_KEY`. The mobile app sends only explicitly selected photos and never contains the OpenAI key.
- BUSY social AI can identify a likely before/after pair, finished-result story, work-in-progress set, equipment/behind-the-scenes set or general business-content set without forcing a story when evidence is weak.
- The social AI returns exactly three distinct organic caption options, recommended Facebook / Instagram / Google Business destinations and a concise reason for each option.
- Captions are explicitly instructed not to invent customer reactions, prices, guarantees, addresses, names or other unsupported claims. The backend also surfaces privacy warnings when selected photos may contain people, registration plates, addresses, documents or other potentially private detail.
- Generated wording remains editable before approval. Content can be kept as a draft, stored on a simple BUSY schedule, or approved as a simulated publish. V3.3 still does not send a real public provider post.
- Completed-job social drafts remain linked to the saved customer/job record so existing outcome tracking and work-goal evidence continue to use one record rather than creating a separate marketing truth path.
- Added Social Media Centre draft/schedule counts plus a queue of reusable completed jobs and saved content drafts.
- Added the first Business Brain screen. It separates owner-set hard rules from observed tendencies and temporary business state instead of silently turning AI guesses into permanent rules.
- Owner rules are persisted locally and explicitly labelled Owner-set / highest authority. They can be added or removed by the owner.
- Social evidence is shown with sample size, observed booking outcomes, confidence and freshness. Samples below the existing evidence threshold remain visibly low-confidence rather than being over-interpreted.
- Added per-destination evidence for Facebook, Instagram and Google Business based on recorded post outcomes. BUSY does not declare a winning channel from tiny samples.
- The existing Opportunity Engine evidence rules remain authoritative: recorded enquiries, quotes, bookings and value matter more than vanity metrics.
- Added backend validation for both AI Edge Functions so the Intake Brain and Social Content server code are type-checked independently of the Snack app build.
- The live `busy-social-content` Edge Function is deployed and active in the BUSY Supabase project.
- All V3.2 AI Intake Brain, V3.1 reconciliation/calendar, V3.0 connected-intake architecture and earlier safety/control rules remain intact.

## v3.2 AI Intake Brain
- Promoted Quick Capture from a storage/triage flow into an explicit AI Intake Brain layer before BUSY Inbox.
- A screenshot/text batch is analysed as one intake problem: likely conversation order, duplicate overlap, separate customer threads, structured fields and confidence all belong to one analysis result.
- Added a secure backend contract through `EXPO_PUBLIC_BUSY_AI_URL`. The mobile app never contains an AI provider key; live screenshot understanding must run through a BUSY-controlled server endpoint.
- Screenshot selection now prepares the deliberately selected images for that secure handoff while keeping the existing maximum of 8 images, thumbnail review, removal and manual ordering controls.
- Live analysis can return a reconstructed screenshot order and an overlap count so duplicated WhatsApp/Messenger-style screenshot regions can be ignored rather than treated as repeated customer facts.
- Live analysis can return more than one customer/conversation from an accidental mixed screenshot batch. BUSY then creates separate Inbox items linked to the same AI intake batch rather than merging unrelated customers.
- Important extracted fields carry separate confidence: customer name, contact, service, address, date/time and value. The review screen surfaces that confidence instead of relying only on one vague overall score.
- AI output is treated as evidence, not automatically as fact. Safe Autopilot is blocked when the screenshot has not actually been read, when the AI flags the thread for review, or when critical name/contact/service confidence is not High.
- Existing V3.1 customer matching, lifecycle reconciliation, duplicate prevention and owner-review boundaries remain authoritative after AI extraction.
- If the secure vision backend is not configured, screenshot-only batches remain visibly unresolved. BUSY does not fake OCR or invent what an image says.
- Text-only Quick Capture still works locally, and text plus screenshots can be structured while the selected screenshots remain attached as source evidence.
- Main navigation remains Home / Work / Results / Settings; the Intake Brain strengthens the existing flow rather than adding another permanent module.
- Added a Supabase Edge Function implementation at `supabase/functions/busy-ai-intake/index.ts` that performs the actual screenshot vision request server-side using OpenAI's Responses API and strict Structured Outputs.
- The server defaults to `gpt-6-luna` for the focused, high-volume intake workload, while allowing `OPENAI_INTAKE_MODEL` to override the model without changing the app.
- The Edge Function independently re-checks automation safety after the model responds; model output alone cannot grant Safe Autopilot authority.
- The live V3.2 preview now points at the deployed `busy-ai-intake` Supabase Edge Function. The app uses the project's client-safe Supabase publishable key to identify prototype requests; the OpenAI API key never enters the mobile bundle.
- Publishable-key gating is deliberately prototype-only. Before launch it must be replaced with proper BUSY user authentication plus server-side abuse/rate controls.
- The Edge Function is deployed and active in the BUSY Supabase project. Live screenshot inference begins as soon as `OPENAI_API_KEY` is added to Supabase Edge Function secrets.

## v3.1 cross-source reconciliation
- Added lifecycle reconciliation so connected business systems can update one existing customer/work journey instead of creating parallel records for each source.
- BUSY now distinguishes safe forward progression from duplicate/backwards changes. Example: Enquiry → Quote sent → Booking → Completed job can reconcile when identity, service and stage evidence all agree.
- Safe Autopilot may progress an exact existing customer from a weaker active stage to a stronger later stage when every other trust rule still passes.
- Same-stage duplicates and backwards lifecycle moves remain review items. Example: a second Quote while a Booking is already active does not silently overwrite the stronger work state.
- Reconciled source records carry a shared work-thread ID, previous stage, source connection and reconciliation receipt so the journey remains traceable.
- Completed-job reconciliation now closes the active booking state and links the completed history entry to the same work thread.
- BUSY Inbox labels forward progressions as “Continue” and shows the stage transition before filing.
- Added a four-source reconciliation demo using generated Email → CRM quote → Calendar booking → Invoicing completion items for one existing prototype customer.
- Reconciliation demo items stay in lifecycle order so the owner can file them top-to-bottom and watch the same customer journey advance.
- Home and Connected Accounts now show cross-source journeys reconciled, customers with multiple source systems and forward progressions waiting.
- Customer detail shows how many captured stages were reconciled into that customer lifecycle.
- Exact identity, service, address consistency, stage-specific evidence, duplicate detection and owner-control boundaries remain unchanged.
- Reconciliation does not grant customer-facing authority. Messages, public posts and paid spend still keep their separate approval controls.
- All V3.0 connected-intake architecture, v2.9 adaptive work-goal logic, v2.8 branding, v2.7 evidence learning and v2.6 capacity planning remain intact.
- Added a native monthly Work calendar directly on the Work landing screen without adding a fifth permanent tab. It shows confirmed/completed booking records by date, monthly booked value and BUSY's planned work-goal openings, with previous/this/next month controls and a deeper day-detail calendar behind it.
- Calendar days are tappable; selecting a date reveals the underlying booked jobs and lets the owner open the saved booking directly.
- The Work summary table is now drillable: non-zero/actionable metrics show a chevron and open the records behind the number (pipeline, bookings, follow-ups, background work, BUSY Inbox or intake history as appropriate).
- Zero-value summary rows stay visually plain rather than pretending there is something to inspect.
- Quick Capture now accepts up to 8 screenshots as one intake batch, with thumbnail review, removal and manual left/right reordering.
- BUSY attempts a first-pass chronological order from screenshot/file sequence metadata and marks the order as High, Medium, Check order or Confirmed rather than pretending certainty.
- The production vision design will use visible timestamps, repeated/overlapping messages and conversation continuity to reconstruct batches even when screenshots are selected out of order.
- Screenshot batches remain attached as source evidence through BUSY Inbox and manual review. Screenshot-only batches are deliberately blocked from Safe Autopilot until the secure live AI vision service has actually analysed the image content.
- Text and screenshots can be supplied together; pasted text can be parsed today while screenshots stay attached as evidence.
- Main navigation remains Home / Work / Results / Settings.

## v3.0 connected operating assistant
- Promoted the connected-account layer from decorative prototype toggles into an honest connected-intake architecture that feeds the existing BUSY Inbox.
- Added Email / enquiries as a first-class intake source alongside Calendar, CRM / job system and Invoicing.
- Intake connections and customer-facing/marketing connections are now treated as different kinds of capability. Reading or receiving business data never grants permission to message customers, publish publicly or spend money.
- Connected Email, Calendar, CRM and Invoicing selections can run a prototype connected-source sync using generated demo records only. No real external account, inbox, calendar, CRM or invoicing provider is authenticated or read in v3.0.
- Prototype source events use the exact same parse → triage → Safe Autopilot / owner-review pipeline as Quick Capture. There is no separate “connected data” truth path.
- Each connected-source item is labelled with its origin and remains traceable through BUSY Inbox, Intake History and customer records.
- Safe Autopilot keeps the same narrow authority for connected data: only exact, high-confidence existing-customer updates with the required stage evidence and no conflict may auto-file.
- New-customer creation, name-only matching, conflicts, uncertain extraction and incomplete records still wait for owner review even when they arrive from a connected source.
- Added persistent connected-sync receipts recording which prototype sources ran, how many items were produced, how many filed safely and how many waited for review.
- Home now shows a compact BUSY connected-intake card when intake sources are selected, including waiting/auto-filed counts and a direct prototype-sync action.
- Connected Accounts now separates incoming business sources from customer-facing/marketing systems and explicitly explains the permission boundary.
- Quick Capture remains available and now clearly shares the same V3 intake pipeline as connected sources.
- No extra permanent navigation was added. Home / Work / Results / Settings remains the main structure.
- All v2.9 adaptive work-goal logic, v2.8 branding, v2.7 evidence learning, v2.6 capacity planning and earlier safety/stop rules remain intact.

## v2.9 adaptive work-filling plan
- Turned an active work goal into a persistent closed-loop plan rather than a one-shot recommendation.
- Each work goal now stores approved actions that were actually tried, including previous-customer outreach, quiet-enquiry follow-ups, quote follow-ups, finished-job posts, limited offers, free profile checks and capped paid tests.
- Approved actions are tied to the specific goal and persist with it. Closing/cancelling the goal clears that plan naturally without creating another permanent campaign area.
- BUSY now removes already-tried goal actions from the goal-specific recommendation queue instead of repeatedly recommending the same quote, enquiry, post, customer batch, offer or paid test.
- Previous-customer reactivation is especially adaptive: customers already contacted for the current goal are excluded from later batches, so a second batch can use different suitable customers if more bookings are still needed.
- Quote and enquiry recommendations skip customers already followed up for the active goal. Finished-job post recommendations skip a post already approved for that goal.
- The work-goal card on Home now shows how many goal actions have been tried and the latest recorded outcomes.
- The Best Move screen becomes “Best next move” after the first approved action and includes a compact BUSY’S PLAN card showing target, booked count, remaining count, actions tried and their current outcomes.
- Existing outcome data is reused rather than duplicated: quote outcomes, enquiry outcomes, reactivation bookings and post outcomes are reflected back into the plan automatically.
- Limited offers and paid tests are recorded as tried only when the owner explicitly approves/uses them.
- Paid-test prototype results are now truthful: approving a paid test records the route and cap, but the prototype no longer invents spend, enquiries or jobs.
- Free profile/audit work is also treated as a tried route for the active goal so BUSY does not keep looping back to the same free check.
- If all currently sensible routes have already been tried and the goal is still open, BUSY shows a deliberate “No new action worth forcing” hold state with recommended additional spend of £0 rather than manufacturing activity.
- Capacity, service matching, evidence confidence, owner approval and the stop condition still outrank the adaptive sequence.
- Main navigation remains Home / Work / Results / Settings.

## v2.8 brand identity system
- Adopted the approved “Trusted Assistant” direction as the primary BUSY DOES IT identity and the approved B/check monogram as the compact app mark.
- Replaced the plain text-only header with a reusable BUSY DOES IT brand lockup: assistant-style stacked-card/check symbol, BUSY wordmark, DOES IT accent and the existing “More work. Less fuss.” tagline.
- Added a compact B/check mark for small brand moments where the full identity would be too heavy.
- Cards whose eyebrow begins with BUSY now show the compact mark beside the label, making assistant/explainer moments visually distinct without putting a logo on every card.
- Updated visible self-reference language from ambiguous “Busy” to “BUSY”, so sentences such as “BUSY has spread 3 bookings…” clearly refer to the product rather than the ordinary word busy.
- Full brand name references are now visually consistent as BUSY DOES IT.
- Added a branded loading state using the primary mark and wordmark.
- Added a restrained brand section in Settings showing the primary identity and compact mark, so the branding system is inspectable without introducing another navigation area.
- Kept the rest of the interface deliberately calm: no large visual redesign, no extra permanent tabs and no branding repeated on every card.
- All v2.7 evidence-aware opportunity logic, v2.6 capacity planning, earlier safety rules and the existing Home / Work / Results / Settings navigation remain unchanged.

## v2.7 evidence-aware opportunity engine
- Replaced the fixed “roughly three previous customers per required booking” rule with confidence-aware audience sizing when enough recorded evidence exists.
- Previous-customer outreach now stores a lightweight local history of simulated sends so later confirmed/completed bookings can be compared with the people actually contacted.
- Reactivation evidence prefers service-specific outcomes once at least three usable results exist. If the service sample is too small, Busy can fall back to broader recorded outcomes; if the overall sample is still too small, the cautious one-in-three planning baseline remains in force.
- Audience sizing uses a smoothed planning conversion rate rather than the raw observed percentage, so one lucky or unlucky small run cannot swing recommendations aggressively.
- Work-goal reactivation audiences are now service-aware: a driveway-cleaning capacity target is sized from eligible driveway-cleaning customers rather than unrelated due customers from other services.
- Quote follow-ups, quiet-enquiry follow-ups and finished-job posts now each expose their own recorded sample, outcome rate and confidence. Their evidence can gently adjust ranking without overriding stronger customer intent, capacity or stop rules.
- Service-specific evidence is preferred where the sample is usable; broader all-service evidence is used only when the specific sample is too small.
- Special Offers currently show “no recorded outcome evidence yet” instead of pretending an offer conversion rate exists.
- Check-before-sending now explains whether the selected previous-customer batch came from recorded evidence or the cautious fallback.
- Expert details show the sample, observed bookings, planning rate, evidence basis and confidence behind the recommended first batch.
- Results now includes an Opportunity Engine evidence card so learning remains inspectable without creating another permanent dashboard or navigation tab.
- The v2.6 multi-slot capacity planner remains authoritative: evidence can change how much activity Busy recommends, but it cannot create capacity that does not exist.
- The v2.3 stop condition remains authoritative: once the work target is filled, further promotion stops regardless of historical conversion evidence.
- Main navigation remains Home / Work / Results / Settings.

## v2.6 multi-slot capacity planner
- Turned the v2.5 “spread this target across future openings” fallback into a real multi-slot capacity plan.
- When a requested target cannot fit one chosen slot, Busy now searches the next 21 days for clean morning/afternoon openings and allocates the required bookings across specific slots using the selected service’s editable planning duration.
- Each planned slot stores its own target allocation and visible label. A three-booking target can therefore become a concrete plan such as one booking Tuesday morning, one Tuesday afternoon and one Wednesday morning rather than collapsing into vague “any suitable work”.
- Work-goal booking matching is now tighter: spread goals count only confirmed/completed bookings that land inside one of the planned slots, and service-specific goals only count bookings for the selected planning service.
- Home shows the active multi-slot plan underneath the same existing work-goal card, including per-slot progress, without adding another permanent navigation area.
- Best first move shows the same plan before marketing recommendations so the owner can see where the requested work is expected to fit.
- If the current diary cannot provide enough clean capacity for the whole target within 21 days, Busy stops before marketing and states the shortfall. The owner can reduce the goal to the planned capacity or choose a different work goal.
- If another booking later occupies one of the planned openings, Busy flags the plan as stale and offers to rebuild it from the current diary instead of silently relying on outdated capacity.
- Multi-slot plans remain conservative: a confirmed booking anywhere in a morning/afternoon period makes that period unavailable to the planner unless it is one of the matching goal bookings already being tracked.
- The v2.5 capacity assumptions remain editable and visible. The v2.4 proportional audience logic, v2.3 stop condition, free-first ranking and paid-spend limits remain intact.
- The visible app stays simple. Main navigation remains Home / Work / Results / Settings.

## v2.5 capacity-aware work goals
- Added editable typical job length to service planning data so Busy can estimate whether a requested number of jobs can realistically fit into a selected diary slot.
- Exterior-cleaning and the other prototype vertical packs now include transparent starter duration assumptions; these are planning defaults only and can be corrected by the owner.
- Existing saved services are migrated safely: a saved duration is preserved, otherwise the current vertical default is used, with a conservative two-hour fallback for custom/unknown services.
- “Fill a spare day” now shows which priority service is being used for capacity planning when relevant and lets the owner choose between multiple wanted services before setting the booking target.
- Morning/afternoon slots use a simple four-hour planning window. This is deliberately transparent and is not presented as an exact real-world schedule.
- If a requested target exceeds the apparent slot capacity, Busy stops before recommending marketing and explains the mismatch.
- When some work can fit, the owner can reduce the goal to the realistic capacity of that slot or keep the larger target and spread it across the next suitable openings.
- If the typical job itself is longer than the selected slot, Busy does not pretend that a full job fits there; it instead offers to spread the target or correct the planning assumption.
- Added a “Typical job lengths” settings screen with simple 30-minute adjustments. The screen explicitly explains that travel, complexity and customer circumstances can change actual duration.
- Custom services now ask for an optional typical job length alongside rough job value.
- Home surfaces a capacity warning when an active goal conflicts with the selected slot instead of continuing to promote it.
- Fixed the proportional-batch explanation edge case: when the eligible customer pool is smaller than the planned cap, Busy now states that all available eligible customers are included rather than claiming it is holding some back.
- Centralised the visible prototype label so the app now shows v2.5 rather than the stale v2.1 badge.
- The v2.4 proportional ranking and v2.3 stop condition remain intact: capacity is checked before marketing, free/low-risk options still rank before paid reach, and promotion stops when the target is covered.
- Main navigation remains Home / Work / Results / Settings.

## v2.4 proportional opportunity engine
- Added a simple work-amount choice to the spare-capacity journey: one, two or three bookings.
- The chosen amount becomes the work-goal target, so Busy now tracks both the original target and how many bookings are still needed.
- Recommendation strength now changes with the remaining gap rather than treating every quiet period the same.
- One missing booking keeps the intervention deliberately narrow: strongest live intent first, then only a small previous-customer action if needed.
- Two missing bookings can justify a small targeted customer batch while broad promotion remains unnecessary unless cheaper routes fail.
- Three missing bookings can make a wider reactivation action or a limited offer proportionate before paid reach.
- Previous-customer reactivation now uses a proportional first batch instead of automatically selecting every eligible customer. The initial batch is capped at roughly three suitable customers per remaining booking and prioritises customers who are more overdue, then higher saved job value.
- The Check before sending and simulated-send flow now respects that selected batch and explains why the audience was deliberately limited.
- Special Offers are ranked more strongly only as the remaining capacity grows, and the offer booking cap uses the remaining requirement rather than the original target.
- Paid-test sizing is also proportional: Busy suggests a smaller cap for a small gap while never exceeding the owner's existing prototype maximum.
- Home now shows how many bookings are still needed and keeps the active goal aligned with the proportional engine.
- The stop condition from v2.3 remains unchanged: once the target is covered, Busy stops escalating and recommends £0 additional spend.
- No extra permanent navigation or marketing dashboard was added. Main navigation remains Home / Work / Results / Settings.

## v2.3 goal-aware opportunity engine
- Turned a chosen spare-capacity slot into a persistent work goal instead of a one-off screen choice.
- A specific suggested morning/afternoon goal now retains its date and daypart, so Busy can compare later confirmed bookings with the capacity the owner asked it to fill.
- The default target is deliberately simple: one suitable confirmed booking. The front end stays small while the stop condition is explicit underneath.
- Home now shows an active work-goal card with target, matching confirmed bookings and recorded booked value.
- When the target is reached, the Opportunity Engine promotes “Goal reached” above marketing and recommends £0 additional spend instead of continuing to manufacture activity.
- The Best first move screen also changes into a stop-state once the goal is covered.
- Closing a completed/cancelled work goal removes the active capacity target without adding another permanent tab or dashboard.
- Added a controlled Special Offer route to the same ranked opportunity ladder. It sits behind stronger existing demand / £0 customer opportunities and ahead of paid advertising.
- A work-goal offer starts at the normal saved service price rather than assuming a discount is necessary. The owner can deliberately change the price if an incentive is justified.
- Work-goal offers inherit the selected quiet slot and booking cap so the offer is tied to the actual capacity problem.
- Removed invented “24 contacted / 5 replied / 2 booked” figures from the offer-running screen. Offer progress now uses saved booking records when tied to an active work goal and otherwise clearly states that the prototype has not really sent anything.
- Paid reach remains the final escalation with a fixed maximum exposure and no guaranteed-results language.
- Trusted Autopilot remains record administration only; it does not gain authority to message customers, publish publicly or spend money.
- Main navigation remains Home / Work / Results / Settings.

## v2.2 spare-capacity opportunity engine
- Rebalanced the prototype away from adding more CRM/admin surface area and back toward the core Busy Does It promise: identify a business need, compare the lowest-risk ways to solve it and surface one simple next move.
- “Fill a spare day” now checks the saved booking diary and suggests likely open morning/afternoon slots instead of relying on a hard-coded Thursday example.
- Spare-slot detection is deliberately transparent: it uses only confirmed bookings currently saved in the prototype and does not pretend a live external calendar is connected.
- Choosing a gap now activates a clear spare-capacity goal and keeps the selected slot consistent with prepared customer wording.
- The Best first move screen now ranks several routes underneath: live enquiries, sent quote follow-ups, quiet enquiries, due previous customers, approved finished-job content, free profile improvements and finally a capped paid test.
- Existing customer intent outranks cold marketing. £0 and prepared actions normally outrank paid reach.
- Paid advertising is explicitly kept as an escalation and retains a visible maximum amount at risk with no guaranteed-results wording.
- Home now gives direct access to “I NEED MORE WORK” without adding another permanent navigation tab.
- A legacy saved quiet-slot value is no longer treated as confirmed spare capacity unless the owner deliberately selects/activates a work goal.
- Trusted Autopilot remains narrow record administration only; v2.2 does not expand automatic authority to customer messages, public publishing or spend.
- Main navigation remains Home / Work / Results / Settings.

## v0.6 big sweep
- Reply actions now open real prototype workflows instead of being simple labels.
- Interested customers can move into a quote-preparation flow.
- Booked customers can move into a booking date/time flow.
- “Not now” customers can get a future follow-up date.
- The built-in UK calendar now supports both past dates and future booking/reminder dates.
- Customer records can be edited.
- Customer deletion now requires confirmation and cleans up related follow-up state.
- The global “Contact previous customers” control now actually changes eligibility.
- Results now includes locally calculated customer-action activity.
- Old v0.6 marked-done actions are migrated back to pending so the richer workflows can be tested.
- Simulation wording has been tightened so prototype actions are not mistaken for real sends or live account connections.
- Testing workflow remains GitHub → clean Snack preview → direct Expo QR.


### Latest v0.6 sweep
- Slot-aware booking suggestions now match weekday wording such as “Thursday afternoon”.
- Booking time uses quick-select choices, with manual time entry still available.
- Quote suggestions explain whether the figure came from the customer's previous job or the saved service price.
- Completed quote / booking / reminder actions can be reopened and edited.
- Results now surfaces recent completed customer actions with their saved summaries.

### v0.6 bookings + action hub sweep
- Added a permanent Bookings screen for saved local prototype bookings.
- Added exact date/time clash detection with a suggested alternative time.
- Improved saved-booking correction so the warning changes to a green “ready to save” state once fixed.
- Added Customer Activity filters for To do, Quotes, Bookings, Reminders and Completed.
- Home now surfaces the next upcoming booking before generic marketing suggestions.
- Results is now local-activity-first; illustrative marketing figures are kept on a separate demo screen.
- Bookings and completed actions remain reopenable/editable from Home, Results, Settings and Customer Activity.

## v0.7 customer + work pipeline
- Added a dedicated customer detail screen with contact details, current action and job history.
- Added quote lifecycle states: Prepared → Sent (simulated) → Accepted / Declined.
- Accepted quotes can be converted directly into booking work.
- Added booking lifecycle states: Confirmed → Completed / Cancelled, with reopen support for cancelled bookings.
- Completing a booking updates the customer’s last-job date/value and appends a local job-history entry.
- Added due follow-up reminders that surface back on Home when their date arrives.
- Added a work diary split into Today, Upcoming, Past / completed and Cancelled.
- Added local pipeline metrics for active quote value, confirmed bookings, completed jobs and due follow-ups.
- Home now puts due customer follow-ups and booked work ahead of generic marketing suggestions.
- Customer records now open into a persistent customer history instead of being isolated rows.

## v0.8 flexible service-business core
- Moved industry-specific behaviour into business-type / vertical packs while keeping the customer, quote, booking, reminder, work and results core reusable.
- Added starter packs for exterior cleaning, window cleaning, gardening & landscaping, plumbing & heating, electrical, mobile hair & beauty and a generic service business.
- Repeat-customer eligibility is now service-specific instead of using one blanket 9-month rule.
- Added business-type selection during setup and a Business type & services control in Settings.
- Turned the Work tab into a real work hub with enquiries, active quotes, bookings, follow-ups and pipeline values ahead of marketing.
- Added a New enquiry flow for customers with no previous completed job.
- Added direct customer actions: create a quote, book a job or set a follow-up without needing a simulated marketing reply first.
- Added customer notes and an activity timeline alongside completed job history.
- Added repeat customer journeys so finished or cancelled actions do not trap a customer in one old workflow.
- Home now prioritises due follow-ups, upcoming bookings and active quotes before general marketing opportunities.
- Results now includes open enquiries and booked-work value alongside quotes, completed jobs and follow-ups.
- Existing customer records and job history are preserved when business-type rules change.

## v0.9 customer pipeline + work diary
- Fixed New enquiry so the custom-service field starts blank instead of duplicating the selected service.
- Added clearer customer pipeline statuses for new enquiries, active quotes, bookings and follow-ups.
- Added new-enquiry priority cards to Home and Work so fresh leads do not disappear behind general marketing suggestions.
- Strengthened the Work hub with pipeline value and open-action totals.
- Improved the work diary with overdue-job detection, clash warnings, booked values, separate completed and cancelled sections, and clearer diary health.
- Added a customer stage readout to each customer detail screen.
- Added a combined customer pipeline value across active quotes and confirmed booked work.
- Changed quote handling from a purely simulated-send label to a local operational status: users can mark a quote as sent while the prototype remains explicit that it sends nothing automatically.
- Results now uses operational wording for quotes marked as sent and shows total customer work in the pipeline.
- Preserved the v0.8 flexible service-business architecture and vertical packs; no exterior-cleaning logic was promoted into the reusable core.

## v1.0 customer workflow + pipeline
- Added a single Customer pipeline screen covering new enquiries, active quotes, bookings, follow-ups and recently completed jobs.
- Work and Settings now link directly to the customer pipeline.
- Results links back into the live customer pipeline instead of acting as a dead-end report.
- Home now shows one clear top-priority customer task instead of stacking duplicate or competing priority cards.
- Past bookings that still need an outcome are surfaced ahead of general marketing suggestions.
- Follow-up reminders now have quick 1-week, 2-week, 1-month and 2-month choices, plus a one-tap 7-day snooze when overdue.
- Customer detail now shows service-specific repeat timing and whether the customer is due now.
- Quote wording now records “marked as sent” rather than implying the prototype actually sent anything.
- Preserved the flexible service-business architecture so the workflow remains reusable beyond exterior cleaning.

## v1.1 faster customer workflow
- Added customer search to both Customer records and Customer pipeline using name, phone or service.
- Added direct quote, booking and follow-up shortcuts for fresh enquiries inside the pipeline.
- Added a one-step “Save & mark quote as sent” option so simple quotes do not need reopening before moving on.
- Added separate active quote value and booked-work value to the pipeline summary.
- Added overdue / due-now status highlighting inside the pipeline.
- Expanded the Work dashboard with overdue bookings, next-7-days job count and next-7-days booked value.
- Fresh enquiries now surface in Work when no overdue booking or follow-up is taking priority.
- Added optional job address / postcode capture to new enquiries and customer records, and surfaced it on customer and booking detail.
- Simplified the Work navigation label so Customer pipeline remains a stable destination even when empty.
- Kept all new workflow logic service-business-generic; exterior cleaning remains a test pack rather than a hard-coded product boundary.

## v1.2 daily operations + follow-up
- Added 7-day quote follow-up detection so sent quotes that have gone quiet return to the Work priority queue.
- Work now prioritises overdue bookings, due reminders, stale sent quotes and unanswered enquiries before general marketing.
- New-enquiry cards show how long the customer has been waiting, with the oldest unanswered enquiry surfaced first.
- Customer pipeline search now also matches job address / postcode.
- Added pipeline stage filters for enquiries, quotes, bookings, follow-ups and completed work.
- Sent quotes that have waited 7+ days are highlighted as “Follow up” in the pipeline.
- Booking completion now captures an optional completion note alongside the actual / expected job value.
- Completed-job notes flow into the permanent customer job history and activity timeline.
- Results now counts completed jobs from permanent customer history instead of relying only on the current live action.
- Results also shows quote follow-ups due.
- Preserved the “simple by default, depth on demand” principle and kept the workflow generic across service-business verticals.


## v1.3 job photos + reusable assets
- Completing a booked job now offers an optional job-photo step instead of ending the workflow abruptly.
- Job photos are chosen explicitly with the system photo picker; Busy Does It never silently browses the camera roll.
- Selected photos attach to the completed customer job and can stay private to that job.
- A separate permission toggle controls whether those exact photos may be suggested for future marketing; attaching a photo never means it is automatically public.
- Approved job photos can trigger a £0 finished-job content opportunity before paid promotion.
- Busy Does It can prepare an editable finished-job post draft from approved photos, but the prototype does not publish anything.
- Customer job history now shows photo counts and saved post-draft status.
- Results now counts attached job photos, reusable-with-permission photos and prepared finished-job drafts.
- The photo workflow stays service-business-generic and uses the customer’s real saved service rather than exterior-cleaning assumptions.



## v1.4 business opportunity engine home
- Reworked Home around one ranked “Best thing to do today” instead of showing a wall of competing opportunities by default.
- Customer commitments rank first: overdue bookings, due reminders, stale sent quotes and unanswered enquiries are surfaced before general marketing.
- Useful £0 moves then rank underneath, including approved job-photo content, due previous customers, profile fixes and old-quote follow-up.
- Added the missing stale-quote follow-up signal to Home so the same operational priority can surface outside the Work hub.
- Secondary opportunities are hidden behind “See other opportunities” so more intelligence underneath does not create more visible complexity.
- Added a genuine “Nothing worth doing right now” state with recommended spend £0 instead of manufacturing activity.
- Upgraded the explanation ladder to “Why this?” followed by “Expert details” for the underlying evidence.
- Kept customer-control and permission rules intact: no messages are really sent, no public post is published and no paid spend happens automatically in this prototype.
- Preserved the service-business-generic core; the ranking logic uses customer/work signals rather than exterior-cleaning-only assumptions.


## v1.5 prepared actions + learning
- Home ranking now weighs urgency, existing customer intent, recorded value, cost and how ready the next action already is instead of relying on one fixed display order.
- Recorded outcomes now feed back into ranking: finished-job content can move up or down based on saved post outcomes, while completed prototype reactivation value can strengthen future reactivation recommendations.
- Finished-job content now runs through a complete prototype chain: approved job photos → prepared editable post → connected destination selection → explicit owner approval → simulated publish → business outcome capture.
- Facebook / Instagram and Google Business prototype destinations must be deliberately connected before they can be selected for the simulated publish.
- Prepared post drafts can return to Home as a ready-for-approval opportunity instead of disappearing after the draft is saved.
- Approved posts with no recorded outcome can return later as a low-priority learning task rather than outranking live customer work.
- Post outcomes are recorded as No enquiry yet / Enquiry / Quote / Booking, with optional booked value, and are explicitly labelled as user-entered attribution rather than guaranteed causation.
- Completed jobs now retain whether the underlying customer workflow originated from the prototype reactivation flow or a direct/manual customer action.
- Results adds separate traceable value buckets for completed work, live pipeline, prototype-reactivation completed value and post-attributed booking value without adding them into a potentially misleading headline total.
- The visible navigation remains Home / Work / Results / Settings. Social, CRM-style follow-up, attribution and learning continue to behave as capabilities underneath the opportunity engine rather than becoming new permanent tabs.


## v1.6 closed-loop opportunity engine
- Extended the v1.5 prepare → approve → outcome → learn pattern beyond finished-job posts.
- Live sent quotes that have gone quiet for 7+ days can now surface as a prepared quote follow-up rather than just an instruction to “follow up”.
- Quote follow-up flow: Busy Does It drafts a polite message from the saved customer/quote data → owner edits/reviews → explicit simulated send approval → outcome recorded as No reply yet / Still considering / Accepted / Declined.
- Once a quote follow-up has been approved, the same quote is no longer repeatedly surfaced as a stale quote while its outcome is unresolved.
- Quote follow-up outcomes feed gently back into future ranking. Accepted follow-ups and accepted quote value are tracked separately.
- Completed jobs can now create a prepared review-request opportunity when customer contact is allowed.
- Review-request flow: completed job → low-pressure editable request → explicit simulated send approval → outcome recorded as No response yet / Review left.
- Review-request outcomes also feed gently back into future ranking, with small-sample restraint.
- Previous-customer reactivation on Home now opens directly into the already-prepared service-group message review rather than adding an extra advice screen.
- Home can surface low-priority learning tasks for unresolved quote-follow-up, review-request and finished-job-post outcomes without letting them outrank live customer work.
- Customer job history now exposes review-request preparation / outcome controls for completed jobs.
- Results now has an Opportunity Engine learning section covering quote follow-ups, review requests, reactivation value and related outcomes.
- Results continues to keep overlapping value buckets separate rather than manufacturing one inflated total.
- The visible navigation remains Home / Work / Results / Settings.
- Added a JSX syntax gate to the automatic Snack preview pipeline so invalid JS/JSX fails before a preview link is published.


## v1.7 record-based opportunities
- Removed the legacy typed opportunity totals for previous customers, eligible customers, old enquiries, old quotes and highest old quote value from the active prototype data model.
- New enquiries now store the date the enquiry actually arrived. This lets Busy Does It distinguish fresh enquiries from quiet enquiries using the customer record itself.
- A quiet enquiry is currently defined as an unresolved enquiry that is at least 7 days old, has no quote / booking / reminder in progress, has contact permission and has not already had a prepared follow-up approved.
- Quiet enquiries now have a complete closed loop: record detected → low-pressure message prepared → owner edits/reviews → simulated send approval → outcome recorded as No reply yet / Still interested / Not interested → outcome gently influences later ranking.
- Quote records now capture an editable sent date, allowing imported / pre-existing sent quotes to be represented accurately instead of assuming every quote was sent today.
- Quote follow-ups due are calculated from real sent quote status and sent date (7+ days) rather than a typed old-quote count.
- Added record-based Quiet Enquiries and Quote Follow-ups Due screens listing the actual customers, services, ages and quote values behind each opportunity.
- Home now separates fresh enquiries from quiet enquiries and ranks a record-derived quiet-enquiry follow-up as an existing-intent opportunity.
- Work and the customer pipeline now show age-aware enquiry states such as New enquiry, Quiet enquiry and Follow-up sent.
- Customer detail shows the enquiry received date and exposes the prepared quiet-enquiry follow-up / outcome flow when relevant.
- Other Opportunities now recalculates from saved enquiries, sent quotes, due previous customers and completed jobs rather than hard-coded counts.
- The old fixed demo funnel no longer advances automatically from previous customers to invented old-enquiry and old-quote totals. After a £0 action, Busy Does It reassesses the current records.
- Business Data now displays calculated opportunity counts. The only remaining manual profile inputs are explicitly labelled prototype-only because no live Google Business / social account is being read yet.
- Manual profile-test numbers no longer participate in Home ranking.
- Results now includes quiet-enquiry learning and removes the illustrative marketing-results totals from the main Results screen.
- Main visible navigation remains Home / Work / Results / Settings.


## v1.8 automatic admin underneath
- Kept v1.7 record-based opportunity discovery, but moved more routine administration into the records themselves.
- New enquiries now receive an automatic 7-day next-check date when they are captured. Busy can use that stored lifecycle date to decide when an unresolved enquiry becomes a quiet-enquiry opportunity.
- Sent quotes now receive an automatic 7-day follow-up due date. Quote-follow-up detection prefers that stored due date rather than repeatedly recalculating an invented demo rule.
- Customer records now maintain lightweight lifecycle and last-activity pointers as quotes, bookings, follow-ups and outcomes change.
- Completing a job now automatically updates the customer’s latest job date/value, stores repeat-service timing when the service has a sensible repeat interval, and pre-drafts a low-pressure review request when customer contact is allowed.
- Post-job repeat timing is service-specific. Non-repeatable services do not receive a fake repeat reminder.
- Saving job photos with marketing permission now automatically prepares the finished-job post wording and opens the editable draft. The owner no longer has to ask Busy to create the draft after already approving the photos.
- Public posting still requires a separate owner approval; automatic preparation does not mean automatic publishing.
- Review-request opportunities are deduplicated to the customer’s latest completed job and are suppressed while that customer has active customer work, reducing contradictory or repetitive asks.
- Added a compact Home card showing how many next steps are ready and how many timelines Busy is maintaining in the background.
- Added a non-tab Background Work screen showing quiet enquiries, due quote follow-ups, prepared review drafts, prepared post drafts and future repeat-service dates.
- Work shows the number of background next steps ready without adding another permanent navigation item.
- Completed-job confirmation now tells the owner which follow-on admin Busy has already prepared.
- New-enquiry and quote screens show the automatic future check date before the record is saved/sent.
- Results now includes the amount of routine admin prepared / watched underneath the Opportunity Engine.
- Main navigation remains Home / Work / Results / Settings.
- Busy still does not send a real customer message, publish publicly or spend money without the required approval in this prototype.


## v1.9 smart intake + duplicate prevention
- Added the first real intake layer so business information can enter Busy without field-by-field manual entry.
- Work now has Quick Capture as the lowest-friction intake path. The owner can paste a customer message, email / quote note, phone note, calendar / booking note or invoice / job note.
- Quick Capture locally extracts a draft customer name, phone, email, address, service, event date, booking time, value and lifecycle stage where those details can be inferred from the pasted text.
- Extraction is explicitly treated as a draft. Busy always shows a review screen before changing records.
- The owner can change the inferred stage between Enquiry / Quote sent / Booking / Completed job and edit every extracted field before approval.
- Busy checks phone first, then email, then exact full name for possible duplicate customers.
- A likely match is merged into the existing customer rather than silently creating another record.
- The owner can override a proposed match with “This is a different customer”, so duplicate prevention never becomes forced merging.
- Quick Capture prevents lifecycle downgrades: weaker imported information cannot overwrite stronger active work such as a confirmed booking.
- New enquiries from existing previous customers now use a current-enquiry field, allowing the same customer record to re-enter the pipeline without creating a duplicate customer.
- Imported Enquiry records enter the normal 7-day enquiry lifecycle watch.
- Imported Quote sent records create/update the sent quote, value and automatic follow-up due date.
- Imported Booking records create/update confirmed Work bookings.
- Imported Completed job records update job history/value, calculate sensible service-specific repeat timing, and prepare post-job review admin.
- Completed imported work can also close an existing active booking rather than leaving contradictory open work behind.
- Source metadata is stored against the customer and Quick Capture keeps a local intake audit trail showing source, stage, extraction confidence and whether the item created or merged a customer.
- Customer search now includes imported email/address data and customer detail shows how many captured source items are attached.
- Results includes Quick Capture counts, created-vs-merged customer totals and captured lifecycle stages.
- Connected Accounts now explains the intended future architecture: real email, calendar, CRM and invoicing integrations should feed candidate data into this same parse → match → review → merge/create pathway rather than bypassing owner review.
- No real external inbox, calendar, CRM or invoicing account is read in v1.9.
- Main navigation remains Home / Work / Results / Settings.


## v2.0 Busy Inbox + automatic triage
- Built the first Busy Inbox layer on top of v1.9 Quick Capture. Incoming candidate information can now be queued and triaged before it changes customer/work records.
- Quick Capture now defaults to “Add to Busy Inbox & triage”, while keeping an optional immediate Analyse & Review route.
- Busy Inbox stores pending candidate items locally and recalculates their triage against the current customer database and active work before review.
- Triage considers detected lifecycle stage, extraction confidence, missing required information, possible duplicate matches and conflicts with stronger active customer work.
- Pending items are separated into Needs attention and Ready to review instead of being shown as one unsorted list.
- Candidate priority favours live bookings, quotes and enquiries over lower-urgency completed-job admin, while uncertainty/conflicts increase review priority.
- The top Inbox candidate can participate in the Home Opportunity Engine ranking, so genuinely important incoming information can become the single best next move.
- Busy Inbox does not silently file records in v2.0. Owner review remains required before an Inbox item creates or merges a customer/work record.
- Reviewing an Inbox item reuses the v1.9 duplicate-prevention and lifecycle-protection rules: strong phone/email matches can merge, name-only matches are treated cautiously, owners can override a proposed match, and weaker incoming data cannot move a customer backwards.
- Filing an Inbox item marks it Filed and keeps the existing Intake History audit trail. Dismissed items remain visible as processed and can be returned to the Inbox.
- After filing one item, Busy can offer the next pending Inbox item to reduce repeated navigation.
- Added a clearly labelled four-item test Inbox batch so triage ordering and exception handling can be tested without pretending those items are real business data.
- Corrected stage inference so “Can I get a quote?” remains an Enquiry; only evidence that a quote was actually sent/provided is classified as Quote sent.
- Carried forward the v1.9 safeguard that an undetected service stays blank and must be confirmed rather than inheriting a default service.
- Work now leads with Busy Inbox, then Quick Capture/manual entry. Home and Settings expose Inbox access without adding another permanent tab.
- Results now reports Inbox items waiting, Needs attention vs Ready to review, filed items and dismissals separately from already-filed Quick Capture records.
- Connected Accounts now defines the intended future architecture: email, calendar, CRM and invoicing integrations should feed candidate events into Busy Inbox for triage/matching before filing.
- No real email, calendar, CRM, social inbox or invoicing system is read in v2.0.
- Main navigation remains Home / Work / Results / Settings.


## v2.1 Trusted Autopilot + exceptions only
- Added a separate Automatic Record Filing control with two modes: Review everything and Safe items only.
- Safe items only is intentionally narrow. It can only file into an already-known customer when the customer is matched exactly by phone or email, the extracted record is high-confidence, the customer name matches exactly, the service is explicitly detected and matches the existing record, and there is no active-work conflict.
- Existing phone/email/address data must stay consistent. A conflicting phone, email, service or saved address blocks automatic filing and leaves the item for review.
- Safe Autopilot never trusts a name-only match and never creates a brand-new customer automatically in v2.1.
- Duplicate source text is detected before automatic filing so the same Inbox item cannot quietly be filed twice.
- Stage-specific evidence is required: sent quotes need an explicit sent date and value; bookings need an explicit future date and time; completed jobs need an explicit non-future date and must not duplicate an existing completed job.
- Existing open enquiries and active customer work block automatic filing where they could create contradictory records.
- Safe Autopilot can file trusted Enquiry / Quote sent / Booking / Completed job record updates into the existing customer lifecycle, while reusing the v2.0 follow-up dates, Work booking records and completed-job admin.
- Automatic filing is record administration only. It never sends a customer message, publishes publicly or approves/spends advertising money.
- Every auto-filed item produces an Inbox receipt, Intake History record, customer activity entry and visible reason explaining why Busy had authority to file it.
- Busy Inbox now separates Auto-filed safely from Filed after owner review, and shows why Safe Autopilot stopped when a candidate failed a rule.
- Existing pending items that now pass the safe rules can be explicitly handed to Busy with “Let Busy file this safely”.
- Added a Safe Autopilot test using an existing prototype customer so the narrow automatic path can be verified deliberately.
- Results, Work and Settings expose the automatic-filing mode and auto-file counts.
- Connected Accounts now describes the same future trust architecture for email/calendar/CRM/invoicing feeds.
- Main navigation remains Home / Work / Results / Settings.


### V3.60 cloud and AI integration status

- Creator-scoped cloud conversation draft RLS table has been deployed. Manual Load / Save controls are wired in the development app, with optimistic revision conflict checking.
- Authenticated `busy-conversation-extract` Edge Function is deployed (JWT required). Suggestions are evidence-validated in the client and remain unapproved; neither AI extraction nor a conversation triggers publication.
- Daily server-side AI usage quota: 20 requests per business creator, per business, per UTC day. The quota table and RPC are service-only; authenticated client roles cannot directly change counts.
- AI review sends the description to the configured AI service only when the owner explicitly taps its button. Failed AI reviews leave the local draft unchanged.
- **Not release-ready:** signed-in cross-device tests, tenant separation tests with real accounts, actual provider response, iPhone/iPad voice and UI testing, and publication gate regression must pass. See [V3.60 release acceptance](docs/V3_60_RELEASE_GATE.md).
