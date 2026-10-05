# Busy Does It code architecture

This branch restructures the large single-file prototype into domain modules without intentionally changing product behaviour.

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

## V3.26 Native Connections
- `busy-calendar-sync` is the server-side Google Calendar reconciliation boundary. The app supplies only bounded confirmed booking data; provider tokens remain server-side.
- `busy_calendar_event_links` stores the last agreed BUSY/Google state. Provider-side time changes are surfaced as conflicts and cannot mutate BUSY until the owner explicitly chooses Google’s time.
- `busy-production-watch` is an independent scheduled observer over the cloud business snapshot. It emits only a narrow trusted set of notifications and records a durable delivery key before future runs can resend the same event.
- `busy_push_deliveries` and `busy_internal_config` are server-only tables. The cron authentication token never enters the mobile client.
- `.github/workflows/eas-link.yml` performs the one-time Expo account link when an EXPO_TOKEN secret exists. `native-development-build.yml` queues the development build after project linking/signing is available.
