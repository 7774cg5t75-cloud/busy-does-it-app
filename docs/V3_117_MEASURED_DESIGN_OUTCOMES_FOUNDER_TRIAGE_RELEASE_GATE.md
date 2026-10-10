# V3.117 — Better design decisions, owner feedback, operations and pre-release control

## 1. Measured design decisions
A new pure classification contract turns real browser before/after audits into four honest states: **measured-improvement**, **safe-alternative**, **needs-review** or **regression**. A candidate with zero additional problems is not necessarily aesthetically better or commercially more effective; only a reduction in actually measured problems qualifies as a measured improvement. Missing evidence, accessibility regressions and design-only changes that mutate customer facts are rejected. None of these states authorizes automatic publication.

Dedicated GitHub Chromium tests reuse mobile/desktop measurements from the actual fictional website generator, verify original and private alternative screens, and classify a deliberately degraded candidate. No paid screenshot AI model is activated.

## 2. Per-business outcome feedback, not made-up sales statistics
The website design feedback system (source-only since V3.115) now additionally accepts explicit **I kept this style** and **I changed back to another style** choices, hidden behind an optional question so the editor remains simple. Owners' choices influence their *own* next design suggestions, with the latest choice per family prevailing. They remain allowed to clear the data. The output clearly reports null for conversion uplift and revenue change; these are **reported owner choices**, not observed visitor outcomes or foundation model weight training.

The accompanying incremental SQL migration extends the existing explicit feedback choice constraint without allowing any global reuse, adding photos, copying site content or weakening the previous RLS/service-role-only tenant isolation. Both migrations and the edge code remain **undeployed** until approved and tested with live database policies, deletion and retention, canary owner, and rollback. No feedback is quietly collected for customers who don't click.

## 3. Read-only founder problem prioritization
The existing private Founder Operations view now prioritizes verified website job failures, queued jobs, failed social posts and Business App failures, and flags unavailable monitoring evidence before implying all is well. This is an *on-demand aggregate snapshot*, not a live notification or external repair. Users outside the server-authorized founder role never receive the aggregate report. No automatic retries, credential operations, billing changes, customer detail disclosures or external alerts are made.

## 4. Global-ready master release audit
Added a deny-by-default 11-gate release checklist to the Founder Operations screen. It covers tenant security, privacy, billing and credits, native devices, end-to-end customer journeys, domain delivery and rollback, screenshot quality, global-readiness (languages/currencies/timezones/regional architecture), operating reliability, terms and explicit founder sign-off.

Development success is **not** production readiness. Every gate starts unchecked. Even a complete paper checklist cannot deploy or certify production in itself; independent verification and explicit human release actions remain mandatory.

## What is and is not done
The V3.117 branch includes mobile UI and server-source changes plus tests. CI must pass existing regression tests, iPhone JS bundling, real offline Chromium screenshots, accessibility and design individuality checks. **No signed iPhone binary, deployed migration, actual customer metrics, model retraining, paid provider integration, public website, domain purchase, DNS change or unattended deployment** is part of this work.
