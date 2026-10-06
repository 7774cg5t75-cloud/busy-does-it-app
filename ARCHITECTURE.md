# Busy Does It code architecture

This branch restructures the large single-file prototype into domain modules without intentionally changing product behaviour.

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
