# V3.110 — One simple website address decision, professional quality intact

## Development scope
BUSY's Website Management now offers three understandable routes:
1. **Use a BUSY-provided website address.** An existing, verified hostname can be displayed. Otherwise BUSY says the address will only be assigned and verified in the approved publishing process. This avoids inventing a slug or advertising an unproven public website.
2. **Connect a domain the customer already owns.** The ownership flow, protected DNS diagnostics, Cloudflare route/SSL state and separate live health checks remain unchanged and appear only after selecting this choice. A custom domain is optional; customers can upgrade later without rebuilding their website.
3. **Find and buy a new domain.** A clear, explicitly unavailable-yet pathway explains that an in-app registrar integration is still required for availability, pricing, payment, renewals and ownership. No fake results, charges, registrations, domain transfer or third-party purchase links.

The prominent address selection is reached from both Website Builder and Website Management. Customers can focus on their website draft and hosted preview first; domain selection never publishes or changes the live site. The exact hosted preview still requires explicit owner approval before Go Live.

## Quality and tests
- Regression assertions verify truthful domain state for unassigned, assigned but unverified, verified BUSY addresses, ownership-only customer domains and future-only purchases.
- A separate no-cost CI job bundles the iOS JavaScript (not a signed native build), renders several genuinely distinct fictional websites, checks keyboard focus/alt/labels on phone and desktop, and repeats the five-width responsive browser audit. Browser evidence is saved with no live customer data.
- The existing design engine still chooses styles from business evidence and supports customization. This sweep does not misrepresent layout snapshots as a fully automated AI aesthetic review.

## Activation gap
The BUSY default-address deployment, Cloudflare for SaaS setup and owner-scoped hosted preview infrastructure remain separate from a verified live launch. In-app domain buying **is not implemented or available to paying customers** until a commercial registrar/reseller API is researched, contracted and tested with pricing, renewals, refunds, ownership and customer consent.

No new paid API usage, DNS edits, registrar purchase, hosted publishing, Supabase production deployment or signed EAS build is performed by this source-only sweep.

## Next
Evaluate registrar options and genuine in-app purchase/renewal requirements; add an owner-approved priced transaction contract (availability quote TTL, checkout identity, idempotent purchase and transparent renewals) before enabling any buy action. Keep preview/build editing fast and designs visually differentiated.
