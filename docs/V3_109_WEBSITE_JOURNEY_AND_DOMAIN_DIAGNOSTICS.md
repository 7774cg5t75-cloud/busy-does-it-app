# V3.109 — Simple professional websites and domain setup with clear diagnostics

## Completed in development source
- Moved optional **website address selection** earlier in Website Management, close to the first website action rather than hidden below publishing, live health and recovery details.
- Explain that a customer's existing domain is optional and they may start by reviewing the website, then attach their domain later; the BUSY-generated address is only displayed when an actual address has been recorded, not invented.
- Added a protected, **read-only** per-business DNS inspection action: owner/admin membership, exact domain row, bounded provider-authored records, safe name restrictions, fixed public DNS-over-HTTPS resolver, short request timeouts and no mutations. Does not reserve or charge visual-AI credits.
- Checks ownership TXT, CNAME and provider-supplied A/AAAA records conservatively: visible exact matches, differences, propagation delays and lookup failures are distinguished. CNAME flattening remains inconclusive; it does not claim SSL or traffic are working.
- UI displays plain-English explanations without changing DNS. Exact instructions for modifying DNS remain customer-controlled at their own DNS provider; MX/email settings must not be changed.
- Added production regression tests and a separate Playwright workflow to inspect individually generated websites at 320, 375, 390, 768 and 1440 CSS pixels, including horizontal overflow, navigation clipping, headings and small touch targets.

## Strict boundaries
- Not a domain availability or registration service; customer must actually own the domain before adding the TXT value.
- Public DNS visibility is not proof of ownership until separately verified, and is not proof of Cloudflare activation, HTTPS or correct live-site deployment. The exact hosted version still requires owner approval and independent health checks.
- No live Supabase Edge Function deployment, no Cloudflare SaaS purchase/activation, no DNS changes, no public customer website changes and no new signed iPhone build from this development sweep.
- The browser test uses fictional business information only and does not qualify as full accessibility certification.

## Next
- One-screen owner experience showing only the next required domain action; optional expert DNS details.
- Server-side conflict detection and clear guidance for existing MX/email records and apex-vs-www hostnames without touching them.
- Preview proofs and visually excellent, genuinely distinct designs, then eventually one approved live test through the existing owner-only deployment path once vendor costs are understood.
