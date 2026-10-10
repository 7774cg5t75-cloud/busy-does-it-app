# V3.113 — One-tap private professional layouts and offline registrar simulation

## Direct customer improvement
Website Builder now offers a **Try [named style] (private draft)** button in its design review card. A customer can quickly try a different professionally curated family (e.g. organic, minimal, editorial, conversion, artisan, boutique) without knowing the prompt syntax. The suggestions use their real business type and current design family. Photo-led layouts are only offered when the private draft contains approved customer media. Each tap goes through the existing tracked private-draft edit and undo actions; it does not change business facts, ownership, contact details, public hosting or a published website. Customers still preview and approve the exact hosted version before Go Live.

## Quality guard
Real Chromium generates original and owner-selected alternative sites from the same fictional business details. On mobile and desktop, it measures navigation/touch targets, contrast, labels, text, heading, overflow, and checks that ALL visible business words and services are unchanged. A deliberately tiny-navigation candidate is rejected as a measured regression by the existing V3.107 review-cycle comparison rules. Existing 5-business design diversity and multi-viewport accessibility suites run too. This is a real browser quality *test*, not a production AI screenshot reviewer or automatic customer-site self-correction.

## Registrar research/prototyping
A **test-only deterministic registrar sandbox** lives under scripts/lib, not the mobile app or deployed Supabase server. It simulates: available domain with separate renewal pricing; already taken domain; expensive premium name; missing renewal; unknown result; provider outage; and cross-tenant response forgery. Every case runs through the same server-side registrar-validation boundary introduced in V3.112, which must reject stale, incomplete, wrong-business or unsafe results.

This is NOT a connected OpenSRS, Namecheap or Cloudflare external sandbox account. The production Edge Function continues to inject adapter:null, returns 'not connected', has no domain purchase or charged availability lookup, and requires no new accounts or API keys.

## Boundaries
No real registrar services, billing, domain purchases, Cloudflare for SaaS activation, customer DNS mutations, AI charges, public website publication or signed iOS app build. Source is committed and validated on the development branch only.

## Next
Explore a *genuine external* registrar sandbox with a vendor account and explicit owner permission when practical; keep renewal price, registrant rights, tenant isolation, one-time checkout and refund/transfer policies central. Continue evidence-based visual design improvement without turning every website into one default template.
