# V3.108 — Better first-draft readability and safer self-service domains

## Delivered
- Improved the actual multi-family website generator CSS, not a static template: consistent 44px minimum navigational/interactable targets, readable paragraph typography and larger section eyebrow labels. Preserves the existing business-specific visual families.
- Added a browser regression workflow across the nine fictional business designs, using both mobile (390px) and desktop (1440px) Chromium to reject undersized website body text and click targets.
- Hardens customer custom-domain TXT ownership validation: only the **exact, correctly named TXT answer** and **exact random verification token** can establish ownership; DNS errors, wrong record types, wrong domains and substring matches fail closed. DNS lookup has a timeout; no existing domain DNS records are modified.
- Gives the owner a clear domain-DNS setup guide in Website Management: type, full record name and value displayed separately, no made-up record suggestions, warning about provider auto-appending domains, preserving email MX, and distinction between apex and www. DNS changes remain at the customer's registrar/DNS host.
- Leaves existing tenant checks, reserved BUSY hostnames, Cloudflare provisioning, SSL checks, live deployment validation, and manual customer publish approval unchanged.

## Safety and scope
Development branch only. No live Edge Function deployed, no Cloudflare purchase or BYO SaaS activation, no DNS modification, no customer website changes, and no paid EAS/AI provider calls. Existing native app version stays 3.105.0 until the next approved signed build. Real customer domains still need provider Cloudflare activation, ownership verification, DNS propagation, SSL and exact website health checks.

The browser checks are practical quality gates, **not** full WCAG 2.2 accessibility certification; outstanding contrast warnings over complex backgrounds remain unassessed and are not claimed to pass.

## Follow-up
- Verify Cloudflare SaaS domain onboarding and pricing before enabling customer custom hostnames.
- Add safer DNS health diagnostics to tell the owner the difference between missing records, pending TLS/SSL and incorrect routes without causing needless repeat provider API operations.
- Extend remediation beyond typography/touch targets to measured contrast and keyboard access, with private preview evidence and owner review.
