# BUSY DOES IT — controlled Coming Soon website launch

Release candidate branch: site/public-launch-candidate-20261102 (stacked on site/copy-and-colour-refresh-20261102).
Target Pages project: busydoesit-preview. Current production branch in prior dashboard screenshots: site/busy-homepage-v2270-review.
Target public domain: https://busydoesit.co.uk/.
Keep the Busy app, paid subscriptions and automatic marketing forms OFF.

## Must pass BEFORE touching public domain
1. Busy Does It Limited is **not yet incorporated**. The operator is currently an individual. The individual has confirmed the display name **Jasper Janes**, trading as Busy Does It, for a discreet legal/privacy page. Verify any trading-name/correspondence-address disclosure, and approve the final privacy notice (privacy.html still says draft; review copy: LAUNCH_PRIVACY_NOTICE_REVIEW.md).
2. Confirm workable enquiry-email retention/erasure process. Verify hello@busydoesit.co.uk sends and receives.
3. Approve final website copy, ClearFlow fictional provenance, mobile visual review, link integrity, Unsplash image source/attribution.
4. Confirm the intended Cloudflare production deployment and DNS/Worker route state.
5. Keep MARKETING_FORMS_ENABLED=0 and every automated signup/privacy/retention/WAF release gate off.
6. Explicit founder approval to publish.

## Safe production cutover (account owner)
1. In Workers & Pages > busydoesit-preview > Settings > Build > Branch control, choose the final approved launch branch for Production. Save and verify the exact expected commit and the production pages.dev site.
2. In that Pages project > Custom domains > Set up a domain, enter busydoesit.co.uk. Follow the Pages-domain association workflow (do not merely add a CNAME first). Confirm TLS/SSL activation.
3. Check the root web DNS at @. Earlier screenshots showed an old Namecheap parking A record at 162.255.119.123; the Pages workflow may replace it, but review the current value before making changes.
4. Configure www.busydoesit.co.uk to redirect permanently to the apex using an appropriate Pages/Cloudflare setup, and verify no loops. Earlier screenshots showed a Namecheap parking CNAME for www.
5. Do NOT delete email records: MX (mx1.privateemail.com and mx2.privateemail.com), TXT SPF, privateemail._domainkey, _dmarc or the notify Resend sender records. Preserve all customer-site routing records and the busy-website-router wildcard Worker.
6. Test live public HTTPS from a phone AND desktop, Slow Roast/feature links, ClearFlow photos and slider, email mailto and two-way delivery, and /api/config must report enabled:false.
7. AFTER correct public delivery and privacy approval, remove the homepage noindex instruction via a separately reviewed commit. Then supply robots.txt/sitemap and request indexing through Search Console.
8. Check Facebook sharing text/image in the actual platform; a branded PNG card remains optional polish until independently tested.
9. Save live evidence, monitor for errors, and keep a rollback route to the previous production branch.

Cloudflare Pages documentation: https://developers.cloudflare.com/pages/configuration/custom-domains/
Cloudflare branch controls: https://developers.cloudflare.com/pages/configuration/branch-build-controls/

Passing a Cloudflare preview build is NOT proof that the live public domain is correct.
