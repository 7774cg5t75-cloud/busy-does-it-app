# Busy Does It public website: privacy and activation review — 2 November 2026

**Status: DRAFT, not approved.** Marketing forms are intentionally disabled. This document is not a public privacy notice, and no live collection is authorised.

## Owner decisions required before accepting public information

1. **Controller identity**: confirm the legally responsible person/entity for data collected before Busy Does It Limited is registered, and which correspondence address can be published. Do not claim an unregistered company is the legal controller.
2. **Privacy notice**: publish an approved, accessible notice naming the controller and hello@busydoesit.co.uk; collection purposes, lawful bases, data categories, providers, any international transfers and safeguards, retention schedules, rights and ICO complaint details. Keep drafts marked as drafts until approved.
3. **Consent**: a specific unticked affirmative box for **one early-access launch email**; no subscription, no pre-ticked consent, no newsletter implied. Preserve consent timestamp/version and require email confirmation. Future marketing needs separate permission. Reference: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-direct-marketing-using-electronic-mail/how-do-we-comply-with-the-pecr-electronic-mail-marketing-rules/
4. **Immediate pending data**: sending a verification email first requires storing the email address in a *pending* state. It is **not eligible for marketing** until explicitly confirmed. Delete unconfirmed records after 7 days (using updated_at; separately expire tokens after 48h).
5. **Contact enquiries**: direct messages delivered to hello@busydoesit.co.uk through Resend/Namecheap. Establish an appropriate retention period and deletion process for the mailbox; do not store contact form content in the waitlist.
6. **Withdrawals and suppression**: process emailed deletion requests, maintain a proportionate suppression mechanism, and ensure launch notifications exclude pending/unsubscribed records. A self-service opt-out flow is desirable before wider campaigns; do not quietly expand this consent to a newsletter.
7. **Processors / DPAs**: verify and record Cloudflare, Resend, Supabase and Namecheap arrangements. Confirm relevant contractual and regional safeguards, access controls and incident procedures.
8. **Operational purge**: set up a scheduled, audited seven-day pending cleanup (see schema/retention_review.sql), verify with fictional staging records and monitor failures; no production enablement without it.
9. **Abuse protection**: require verified Turnstile Siteverify with host/action checks, a dedicated widget for real public hostnames, server-side per-IP throttling, and Cloudflare edge WAF rate limiting. Workers KV limits are non-atomic defense in depth, **not** a substitute for WAF protection.
10. **Delivery and recovery**: test from a real browser, confirm messages arrive at the Namecheap inbox, confirm opt-in via emailed link and deliberate POST, test replay, expiry, rate limits, sender failures and privacy flow. A Resend acceptance is **not proof of inbox delivery**.
11. **Secret isolation**: maintain staging-only server secrets, independent from live Busy customer/tenant services. Never store secrets in Git, website assets, chat or screenshots. Rotate compromised tokens.
12. **Launch authority**: retain explicit launch approval. Do not enable `MARKETING_PRIVACY_APPROVED=1` or `MARKETING_FORMS_ENABLED=1` until all gates above pass; publish/merge separately. Current public domain is outside this draft review.

## Confirmed as of 2 November
- Both external email domains and routine mailbox have previously been configured; the Business sending subdomain was independently verified by Resend.
- Staging-only Supabase table exists with RLS enabled, anonymous insert/select denied and no stored signups when checked.
- GitHub source checks and mock delivery/confirmation tests pass.
- Owner has configured preview-site Turnstile public/secret bindings, Resend and Supabase staging credentials, allowlisted preview host, public origin and Workers KV; values were not independently inspected through Cloudflare management API.
- An unauthenticated preview status check displayed `enabled:false` and `siteKey:null`, so automatic submission remained off.
- Open design/release review PRs: #40 and #41. Do not treat passing GitHub checks as approval or live delivery evidence.

## Activation sequence
Review privacy and legal identity → WAF/retention setup → apply schema to *approved* hosting environment → configure domain-specific Turnstile and secrets → verify full end-to-end flow with fictional records → approval → controlled enablement → monitor errors and consent audit. Keep rollback to forms OFF immediately available.
