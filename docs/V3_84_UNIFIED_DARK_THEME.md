# V3.84 — Unified Dark Design (development)

BUSY DOES IT now uses the V3.83 dark Home design language throughout the app's shared UI. The change is **app-wide**, including onboarding/sign-in, Work, Results, Settings, calendars, forms, social tools, customer records, website management, BUSY Apps builder control screens and the existing protected founder controls.

## Visual treatment
- Near-black `#0D131E` background, layered `#171F2D` charcoal panels, readable off-white headings and muted secondary text.
- BUSY blue `#3671E3` remains the filled primary button colour; brighter blue text is used for links and labels against dark cards.
- Dark blue/green/amber surfaces and borders replace pale dashboard panels and calendar boxes.
- Entire screen shell, navigation, system status bar and loading/authorization backgrounds now use the dark theme.
- Home's overflowing "For your review" label is shortened to "Review" and constrained so it cannot push the card outside its bounds.
- The Home attention summary is numeric instead of displaying the oversized "Review" word.
- Shared headings, card titles and buttons have slightly more compact typography.
- The development banner is hidden by default from customer-facing screen headers; no functionality or back-end reporting is removed.

## Scope and exclusions
This is a **visual theme sweep** only: no new provider permissions, API write paths, subscription changes, customer communications or live publishing. Any customer website or Mini App *being designed* retains its own branding, rather than being forced into BUSY's dark theme. Native iOS and Android system permission sheets are controlled by the operating system.

## Validation
- Updated V3.83 Home checks to accept the new version and shared dark shell.
- New `scripts/check-unified-dark-v384.mjs` checks palette contrast, form/nav tokens, dark safe areas, first-party controls and Home overflow; wired into GitHub production checks.
- GitHub CI/static assertions and native iPhone visual review are distinct requirements. **The new V3.84 build must still be installed and checked on a real iPhone.**

## iPhone acceptance
1. Install native internal preview V3.84 (version `3.84.0`, iOS build number 4) over V3.83. Registration and certificates should be reused.
2. Open Home, Work (calendar and booking detail), Results, Settings and at least one customer-edit form. Confirm no light gaps, invisible text, unreadable buttons or clipped words.
3. Test microphone and typed BUSY flows, keyboard scrolling, date pickers, alerts and switches.
4. Check Social Centre, Website Builder, Mini Apps, and the private Founder's Dashboard; verify authorization and data separation.
5. On an iPhone with increased text size, check accessibility, tap targets and long labels.
6. Record any remaining hard-coded component colour exceptions for follow-up fixes, without reverting the global design.

No automatic App Store release or billing change.
