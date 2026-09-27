# busy-does-it-app

Busy Does It mobile app prototype.

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
