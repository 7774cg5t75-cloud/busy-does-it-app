# V3.100 — Intelligent website design engine

## User goal
BUSY should build a visually accomplished, genuinely useful business website from even a short brief, without requiring customers to understand templates, page architecture, colour theory, layout, typography or search optimisation.

## Implemented (draft, hosting-worker source and validation)
- A **shared, deterministic design planner** examines actual services, meaningful service descriptions, approved photographs, about text, supplied FAQs/reviews and available contact details. It returns a reproducible design plan with its evidence counts and a clear explanation.
- With sparse content, choose a **focused landing page** with on-page navigation; do not generate empty dedicated pages. With enough real content, choose a richer homepage and dedicated service, about, gallery, FAQ and contact pages as appropriate.
- Different businesses use **different layout families**, not just different accent colours: conversion, organic, portfolio, artisan, showcase, boutique, editorial and minimalist designs. These are implemented in shared CSS used by both editable and hosted renderers.
- Prioritise storytelling for catering with an about story, photo galleries for visual businesses, service conversions for trades, and substantive introductions for professional services. Retain genuine customer testimonials on the homepage when a separate testimonial page does not exist.
- A sparse site's headline automatically gains **safe, fact-based copy** assembled from actual supplied service names and service area when the customer supplied no tagline or meaningful description. Never fabricate claims, case studies, reviews, licences, guarantees, prices, photos or contact details.
- A contact area with no phone or email is accurately labelled **Where we work** if the service area is known. With neither contact nor service area, omit it completely rather than displaying an empty Get in touch section.
- A design plan refreshes when BUSY safely edits the source draft. The builder explains the page-architecture choice in plain English.
- Existing private immutable hosted preview, deployment marker validation, explicit review/Go Live approval and customer business isolation remain in place.

## Tests and evidence
- The full production regression suite includes targeted V3.100 tests across sparse gardening, external cleaning, catered events, wellness, accounting and unknown sectors.
- Five self-contained **fictional** HTML websites are generated in CI, and rendered at 1440px desktop and 390px mobile widths using Chromium for visual QA.
- Initial screenshot inspection caught an empty Get in touch section on the no-contact examples. The source was corrected and regression coverage was added before release.
- GitHub native JS export validates mobile code **without** submitting an Expo cloud iOS build.

## Limitations and release gates
- These are deterministic planning rules and design systems, not a promise that BUSY can yet independently invent a perfect bespoke design or write copy beyond available facts. Future iterations can use a guarded AI design critic and alternative templates, backed by real screenshots and owner-reviewed copy.
- **Source code in GitHub does not mean the Supabase website worker has been deployed.** The new styles and smart page model must be tested against a real private hosted preview before production roll-out.
- **No public customer website was published.** Do not present a private draft as a live website.
- **No new Expo EAS signed iPhone build requested for V3.100.** Bundle substantial design improvements and then use one signed build after independent visual QA and backend staging are satisfactory.
