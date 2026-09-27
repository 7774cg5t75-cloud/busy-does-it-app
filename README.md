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
