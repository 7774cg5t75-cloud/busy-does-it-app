# V3.124 — Connected Intelligence and Controlled Cloud Readiness

## Real development changes

**Controlled Supabase rehearsal foundations.** Added a 12-gate, fail-closed staging readiness checklist that explicitly requires an isolated nonproduction Supabase environment without production credentials; two different fictional owner/business IDs; actual cross-tenant RLS tests; privacy/retention review; disposable migration and rollback rehearsal; real staging authentication and expired sessions; hosted preview hash evidence, bounded read recovery, cleanup and a separately approved founder sign-off. Each gate requires a source-bound trace, not a manually set boolean. Even twelve supplied traces mean only **ready for separate manual staging review**. There is no provisioned staging project, database connection, cloud migration, real host or customer pilot.

**Cross-tenant evidence.** A separate eight-case evidence evaluator tests owner reads for two distinct fictional businesses; A reading/writing B, B reading/writing A; expired sessions; and anonymous requests. Wrong-business data, missing own-record responses, missing probes, or invalid IDs fail closed. These are synthetic observations in CI. A caller naming a source "verified" CANNOT certify real cloud: realCloudVerified always remains false pending independently attested and manually reviewed staging verification. A passing fixture cannot authorize production.

**Global-Ready architecture.** Explicit business locale, display currency, IANA time zone and country are now validated as separate inputs. Country codes are checked against recognized Intl region names, not just arbitrary two-letter strings. Currency formatting uses correct ISO fraction units including zero-decimal JPY; date formatting keeps the UTC appointment instant intact and displays UK daylight saving and US local time correctly. These are **display-only helpers**: they cannot create bookings, perform FX conversion, calculate tax, change billing prices, translate unapproved copy, alter data residency or verify international compliance. The website builder shows the regional-check count only under optional website settings.

**Private Business Brain decisions.** The Website Builder now uses a per-business decision-evidence helper to explain why a proposed style came from previous explicit like/rejection feedback or merely the business category. A mismatched tenant ID discards the owner preference. Real business facts remain a higher-priority consideration. Owner-selected alternatives never alter public websites without separate approval, and no measured revenue, conversions, model retraining or cross-business learning is claimed.

**Founder simplicity.** The Founder Operations page preserves its single primary priority and expandable evidence. It also shows **real Supabase staging — not yet verified**, with zero of twelve cloud checks by default and the next unverified requirement. No private business records, secret values, provider payments or external alerts appear in that card.

## Verification

The new script check-website-staging-global-v3124.mjs tests fail-closed manifests, two-tenant canary cases, invalid regions, explicit translation/consent gates, daylight saving, JPY/GBP minor-unit display, private recommendation provenance, release blocking and the source-only design-feedback migration's RLS and service-role restrictions.

The dedicated GitHub Actions workflow additionally runs the V3.123–V3.117 source regressions, builds updated iPhone JavaScript, creates nine fictional business websites and checks them in Chromium at phone/desktop widths. Existing original/alternative visual audits, deliberately broken navigation, covered primary actions, five responsive widths and keyboard accessibility remain included. Screenshots are held as temporary workflow artifacts, not private customer data.

## Deliberately not activated

No live Supabase environment or RLS probe was contacted in this sweep; no production migrations were applied. The V3.115/V3.117 feedback migrations remain source-only pending consent and independent staging review. No domain purchase, cloud publication, real customer pilot, tax/billing changes, paid AI visual reviewer, regional provider access, external alerts, or signed native iOS build occurred.

A future *real* canary requires an explicit founder-approved staging project, isolated credentials and disposable accounts, two-way cross-tenant RLS checks, actual hosted HTTPS/version evidence, source-data and backup deletion, rollback and sign-off. Passing CI cannot substitute for that process.
