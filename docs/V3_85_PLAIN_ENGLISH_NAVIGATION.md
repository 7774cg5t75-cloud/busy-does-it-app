# BUSY DOES IT V3.85 — Plain-English navigation and clearer results

## Purpose

Make BUSY feel like a practical assistant for tradespeople and other small business owners, **not** a technical control panel. Use everyday British English and let people get to the work they need in one or two taps. The original working screen keys, cloud records, permissions, provider behaviour and approval controls are unchanged.

## Changes

- **Customers & enquiries** replaces the user-facing “Customer pipeline” in Work, Results, Settings and customer records. This remains the same `workPipeline` screen and existing records.
- **Social Media** replaces “Social Control Centre” in the most prominent destinations.
- Home's expandable tools use straightforward destinations: “Today's priorities”, “Customer follow-ups”, “Messages & replies”, “What BUSY remembers”, “Grow my business” and “System health”. Their internal routes remain stable.
- Those deeper screens now have matching, clear page titles and avoid decorative version numbers in their main introductory wording.
- **Results** now starts with four recorded values: completed work value, confirmed bookings, value of booked jobs and enquiries requiring follow-up. It explicitly says these are based on saved records, not estimated earnings. The numerous existing analytic cards and evidence reports remain available after tapping **Show detailed reports**. This keeps uncertainty and deeper analysis available without making every customer scroll through it by default.
- **Settings** now starts with six practical destinations: account/privacy, customers/enquiries, social media, business type/services, connected accounts and spending limits. More technical detail and existing functions remain behind **Show more settings** rather than being deleted.
- Work and Social Media introductions have more concise, human descriptions. The social publishing workflow retains provider authorisation and approval safeguards.

## Wording principles

1. Describe what a customer **can do**, not the name of an internal system.
2. Prefer “Customers & enquiries”, “Quotes”, “Bookings”, “Messages & replies”, “Find more work” and “How BUSY learns” to terms such as pipeline, bridge, centre, triage or intelligence engine.
3. Surface today's actual action before secondary statistics.
4. Preserve truthfulness: **quote and booking amounts are not automatically income**; provider authorisation is not proof of live publishing; no automated sending without existing approval rules.
5. Keep complex evidence and founder-only operating tools accessible in advanced views with actual server-side permission enforcement.

## Validation and rollout

- `scripts/check-plain-language-v385.mjs` is included in the production GitHub workflow, alongside existing founder/security, first-render, business-flow and theme regressions.
- Existing route IDs (`workPipeline`, `socialMedia`, `dailyCommandCentre`, `communicationsHub`, `founderOperations`) are not renamed. No migrations or service deployments.
- Version `3.85.0`, iOS build number `5`; an independently signed iPhone build is required because this project is not yet set up to deliver EAS Updates over the air.

## iPhone acceptance checklist

1. Home: expand **See all BUSY tools** and check the renamed links.
2. Work: open **Customers & enquiries** and check existing customers, filters, quote and booking navigation.
3. Results: confirm the four-item summary, then expand/collapse **Show detailed reports**. Check the £ amounts come only from saved records.
4. Settings: check the six quick choices and expand/collapse **Show more settings**. Confirm your account/privacy and spending rules remain reachable.
5. Social Media: open drafts, scheduling, real provider status and existing approval controls.
6. Test accessibility on a small iPhone, larger text setting, and keyboard scrolling. Any overlooked technical labels can be refined in a follow-up.
7. Verify normal users cannot inspect founder-only data; a label change does not grant any permissions.

**Not an App Store release or live publishing action.** This sweep affects navigation copy/presentation; native iPhone review remains necessary.
