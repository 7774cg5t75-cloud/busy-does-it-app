# V3.86 — Calendar-first Work screen (development)

## Goal

Work should feel like a simple, useful business diary on a phone, rather than a wall of technical reporting. Existing booking, customer and business-intelligence functionality must remain available.

## Changes

- The standard Work entry view now leads with two compact saved-record figures: booked jobs for the current week and items needing review.
- A genuine immediate Work priority appears when there is work needing attention. The next confirmed booking is shown only when one exists.
- The existing **monthly calendar** (previous/next month, Today, booked-job markers, suggested-opening markers and tappable days) is now near the top, with selected-day booking links available in place.
- A clear **Customers & enquiries** card provides navigation and an **Add a new enquiry** action. The BUSY Inbox button appears here if there are real items requiring attention.
- **Find more work** is a direct action, but no marketing is automatically initiated by opening Work.
- All old detailed 7/14-day metrics, fuller weekly plan, proactive notices, capacity advice, legacy Work actions and additional customer management links remain behind an accessible, reversible **More work tools and reports** button.
- For an empty diary the calendar's selected date now says *No bookings saved for this day*, instead of showing a large all-clear card.
- The generic spare-capacity headline no longer assumes the customer's work is driveway cleaning. Suggestions still need to be tested with several business types.
- Dark palette remains as in V3.84; compact Work tiles are added rather than increasing oversized titles.

## Safety and preservation

No SQL schema changes, service deployments, automatic publishing, background notifications, new billing rules or customer data migrations.

Existing `workHub`, `workCalendar`, `workPipeline`, `bookings`, `workNow` and `dailyCommandCentre` navigation routes stay unchanged. Booking statuses, scheduling, completed work records and customer details continue to use the existing models and business isolation.

## Tests and release gating

- Version `3.86.0`, iOS build number `6`.
- `scripts/check-calendar-first-work-v386.mjs` is part of GitHub CI, alongside previous UI and existing security/production regression tests.
- **iPhone preview acceptance is required** before considering this version verified.

### iPhone checklist

1. Confirm the initial Work screen is short, calendar-first and does not show legacy reports until requested.
2. Try previous/next month, Today, selected-day details and the full calendar.
3. Test opening an existing booking, creating a new enquiry and navigating to Customers & enquiries.
4. Test the next-booking and needs-attention cases by using safe test records; verify accurate labels.
5. Expand and collapse More work tools; open work diary, full calendar, customer records, follow-ups and detailed reports.
6. Verify no cut-off text on the iPhone and legible day selection with accessibility settings.
7. Test at least two businesses with different service types, including one with no services or customers; no default specific-trade suggestion should appear.
8. Recheck the app's save/restore behaviour and normal-user isolation; no automated sends without approval.

No App Store release or EAS over-the-air update is implied. Until EAS Update is configured, install a new native preview build to see V3.86.
