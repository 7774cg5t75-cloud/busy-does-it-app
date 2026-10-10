# V3.112 — Customer-simple registrar gateway and distinct websites

## Actual development work
- BUSY's optional Find a new domain experience still offers strictly offline ideas. It now also has a separate, explicit **Check if live domain search is connected** action.
- The request flows from the iPhone controller to the existing authenticated, owner/admin-scoped website-publishing service. It deliberately calls the registrar gateway with **no adapter**, meaning no external lookups, billing, registration or false price/availability claims.
- The new provider-independent registrar gateway is ready to evaluate the trusted adapter's output once a registrar partner is chosen. It conservatively checks the supported registrable UK/com domains, exact business and hostname binding, source identity, freshness, complete first-period amount and tax, renewal price, terms, quote expiry and premium flag. Unavailable/unknown/expired are separate states. Even valid test quotes have checkout disabled.
- The app ignores stale out-of-order status results from earlier search input. The existing BUSY-provided address, owner-controlled existing-domain connection and exact hosted-preview publishing checks remain intact.

## Real website quality checks
A dedicated new Playwright workflow generates fictional websites using the real design system, verifies differing first-screen screenshots and *computed* CSS design signatures across five industries, then reruns 320/375/390/768/1440px responsive tests and mobile/desktop keyboard and alt/label tests. It emits screenshots and report files retained for 7 days. This is a real quality regression gate, not certification or paid AI visual critique.

## Safety and activation
No registrar is yet selected, contracted or live. There is no real domain availability or quote API, no domain checkout, no registrant-payment/renewal ledger, and no live external cloud hostname provisioning in this sweep. No customer DNS was changed, no website auto-published and no paid services or signed iOS app build were run.

Before enabling actual searches: select approved reseller; test owner vs registrant rights in sandbox; implement bounded rate limits, a tenant-isolated database quote/transaction ledger, renewal notice/transfer policy and a second explicit approval for any financial charge; implement safe fallback and idempotent retries. Avoid creating owned domains in the founder's name instead of the actual customer's verified registrant.

No claim that current generated sites have passed subjective designer review. This sweep focuses on truthful, easy-to-use plumbing plus independent, visible design variation.
