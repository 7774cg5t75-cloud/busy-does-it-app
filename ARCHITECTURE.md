# Busy Does It code architecture

This branch restructures the large single-file prototype into domain modules without intentionally changing product behaviour.

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
