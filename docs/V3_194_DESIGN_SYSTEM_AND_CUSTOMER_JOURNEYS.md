# Busy Does It — V3.194 Major Builder Sweep

**Development scope:** substantively improve Business App individuality and real customer journeys, maintain shared marketplace/standalone behaviour, and extend the Website Builder's owner-controlled typographic options.

**Source branch:** `v3.194`, based on `v3.193`. No paid AI-provider calls, paid media generation, hosted staging installation, production deployment, signing, or app-store submission.

## App Builder — layout and typography that really change screens

1. **Four real customer-facing typography systems** (balanced, editorial, impact, friendly) and **three service layout systems** (cards, rows, spotlight). This extends the twenty-plus-custom branding options from V3.193. It is not merely a list of selectable labels: fonts/weights/sizing are applied to the native title, service cards, and a rendered marketplace preview. Row layout forces one column; spotlight emphasises the first approved service; card layout retains a distinct card treatment. The parent module order and existing responsive width rules remain.
2. **One authoritative pure design source** at `src/core/appVisualPresentationV3194.mjs`, imported in the Busy marketplace, copied by the unsigned native Expo exporter and used by its native template. Does not require external fonts, network access, generated CSS, code execution, customer-data collection or paid AI.
3. The private App Builder appearance editor can preview and save these two finite controls through the existing revision-checked `set_appearance` server action, with the exact same supported enum rules in `src/core/appAppearanceEditing.mjs` and `supabase/functions/busy-mini-apps/appAppearanceEditing.mjs`. Existing published app versions are not silently changed by design edits. The device preview remains unsigned.

## Standalone App — a genuine additional customer action

4. For a **public, live-version-approved offer**, customers may tap **Ask about [offer]**, but only when the verified public enquiry module is enabled and the app's live projection allows enquiries. This navigates to the same protected, owner-replied **enquiry form** as other native enquiries with editable context for that offer. No automated submission, automatic discount claim, payment, reward redemption or fabricated availability. The V3.193 service-to-booking and service-to-enquiry routes continue to work.

## Website Builder — styling and safe cross-builder decisions

5. Added **Editorial serif headings** and **Friendly rounded headings** as supported, finite website typography options. The shared `designPlanner.mjs` retains valid owner theme overrides and the shared responsive `designSystem.mjs` now renders visibly different heading styles with system fonts; no paid fonts, remote CSS or HTML insertion.
6. Optional **match typography to my Business App** within the Website Builder. The owner sees the proposed compatible style and must explicitly approve. A pure same-tenant bridge checks exact Business App ID/revision and website ID/generation, and refuses stale selections or a change from another business. The controller applies only the private website `theme.typography` setting using existing layout rebuild and Undo/Redo. It does not publish either builder or change text/images/booking/customer data. A style match is NOT pixel-identical across mobile native and web.

## Automated coverage and safety boundary

- New `scripts/check-major-builders-v3194.mjs` covers all twelve typography/service combinations, precise owner changes, trusted server validation equality, standalone packaging, native offers enquiry gating, marketplace preview, website theme calculations/CSS and same-tenant evidence/stale revision guards.
- `.github/workflows/builders-major-v3194.yml` extends V3.193 and earlier checks, static parsing and four **unsigned** JS exports: Busy iOS and Android plus standalone iOS and Android.
- A failed draft attempt is not considered proof of customer success; confirm the final GitHub workflow status. The production foundation and Expo Snack checks remain separate.
- Real screenshot/device/accessibility validation, signed binary distribution, provider-backed authenticated customer transactions and live staging deployment still require dedicated future permission and tests.

## Next architecture checkpoint

Per `docs/DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md`, **V3.195 is the comprehensive code architecture and maintainability audit** after five larger builder sweeps. Preserve ongoing builder functionality development where safe, but examine large screens, source duplication (including Edge/client contracts), import graphs, changing module ownership and growing test/CI costs; refactor carefully with regression evidence.

**North star:** owner-approved, reliable tasks completed with minimum friction, distinctive designs that suit the business, simple interfaces, and increasingly well-structured and testable source code.
