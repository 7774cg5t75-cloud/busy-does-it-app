# V3.107 — Real browser website readability and accessibility quality

## Scope delivered in source
- A separate **offline, real-Chromium** page-quality audit alongside the existing 390px phone / 1440px desktop screenshot and layout measurements.
- Checks foreground/background colour contrast for visible text where computed solid colours can be measured, using 4.5:1 for normal text and 3:1 for larger/bold text. Transparent, blended and image/gradient backgrounds are explicitly **unassessed**, not falsely reported as passes.
- Checks main paragraph/list font sizes against an initial conservative 14px legibility floor, interactive controls against a **simplified** 24 CSS pixel target-size test, and missing names, form labels, image alt attributes, document language, main landmark and heading-level skips.
- Browser evidence is versioned, bounded and validated in the pure private-review comparison contract. Missing or invalid quality measurements must never be treated as a successful full quality review.
- Rejects a revised candidate if a previously detected issue category worsens in quantity, even when both versions have the same problem names. A single common comparator is now used by both the browser report and private review engine.
- Additional no-cost assertions are added to production CI; a separate Playwright browser workflow validates controlled fixtures and records **fictional** mobile/desktop screenshots and before/after JSON evidence.

## Important limitations
- This is not a full WCAG 2.2 conformance audit: target-size exceptions, colour contrast over complex backgrounds, keyboard traversal, screen-reader flows, zoom, reflow and cognitive accessibility require further specialist examination.
- The automated report is an engineering quality signal. BUSY does not claim that she used live customer screenshots, improved a real website automatically, or completed an AI self-review.
- The owner-facing protected Supabase visual reviewer from V3.105 remains off until explicitly authorised with configured spending limits, provider keys and privacy safeguards.
- No existing public website, deployment, cloud provider setting, migration, credits, or installed iPhone app is changed by this branch.

## Following build
Show the owner an understandable mobile/desktop before-and-after quality report, without displaying technical metrics by default. Preserve opt-in consent, review credit limits, tenant boundaries, full draft history and explicit publish approval.
