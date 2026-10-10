# V3.111 — Foundation for effortless, honest domain purchasing

## Customer experience in the development branch
The three existing choices still work. Under **Find and buy a new domain**, a customer can type a name and explore up to three local, offline domain-name ideas (.co.uk, .com, .uk). Each idea explicitly says availability and price **have not been checked**. No provider is contacted, no user search leaves the phone, and there is no checkout. A BUSY-provided website address remains the easy starting option.

## Provider research (10 October 2026)
- **OpenSRS**: dedicated reseller domain APIs and registration/portfolio management. Strong candidate for multi-customer BUSY registration after onboarding and commercial terms. https://support.opensrs.com/support/solutions/articles/201000063416-opensrs-api-guides
- **Namecheap**: registrar check, create, renew APIs, with sandbox testing, whitelisted client IPs and production API qualification requirements. Need evaluate commercial pricing and registrant/customer ownership. https://www.namecheap.com/support/api/intro/ ; https://www.namecheap.com/support/knowledgebase/article.aspx/9739/63/api-faq/
- **Cloudflare Registrar API (beta)**: supports search, live domain-check and billable registration on a Cloudflare account; requires billing and registrant setup. This is **not** equivalent to an unrestricted multi-tenant resale agreement, and account ownership/contact issues need legal and commercial resolution. Do not use the founder's own default registrant identity for customer domains. https://developers.cloudflare.com/registrar/registrar-api/
- **Nominet .UK reseller rules**: a domain reseller needs compatible registrar agreements, customer registrant records and clear policies. Confirm registrant rights, renewals, notices and transfers with selected provider and legal review before launch. https://registrars.nominet.uk/registry/dot-uk/policies/ ; https://registrars.nominet.uk/uk-namespace/registrar-agreement/registrar-obligations/

No registrar partner or pricing is selected. API availability and policy are subject to change.

## Purchase contract (pure code, no remote calls)
A future registration adapter must enforce:
- Exact registered domain and owning tenant, validated provider identity and traceable quote id.
- Recent **registry-checked** availability rather than cached idea search; short-lived quote and explicit premium status.
- Registration cost, tax, total amount, currency, term and a real renewal amount shown before consent.
- Customer registrant verification, owner approval, registrar terms, expiry/renewal acknowledgement and payment authorization.
- A stable checkout idempotency key, server-only API credentials and authoritative purchase outcome ledger. No domain label or website route may become "live" until independent provider registration/SSL/health checks.

The current function \`evaluateDomainPurchase\` **always blocks actual execution**, even if future quote conditions are satisfied. No payment API or domain registrar API is wired.

## Professional-quality checks
A new real-browser audit on fictional generated designs measures the opening heading, primary call-to-action, viewport clipping and broken internal anchors at phone and desktop sizes, complementing existing visual contrast, keyboard, mobile readability and responsive tests. It is automated usability evidence, **not** visual-critique AI or certification.

## Boundaries and next steps
This GitHub branch is source-only. No live domain API calls, domain registrations, DNS changes, customer website publishing, new paid subscription, Cloudflare activation or native iPhone release. Before introducing real purchases, choose a compliant reseller partner, sandbox-test user ownership, API billing and refunds, implement consent/payment ledgers, and verify transparent domain renewals.
