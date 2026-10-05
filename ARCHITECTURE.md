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
