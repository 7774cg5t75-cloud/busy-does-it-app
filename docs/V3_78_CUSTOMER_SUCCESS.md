# BUSY DOES IT V3.78 — Customer Success Engine 1.0

**Branch:** `v3.78` based on `v3.77`. Development milestone, NOT a paid launch and NOT an end-to-end public website enquiry verification.

## Objective
Start converting genuine customer contact into useful business actions, while separating actual evidence from marketing-style conversion claims.

## Implemented
1. **Private, consent-aware customer enquiry ledger** (`busy_website_leads`). A business-scoped table stores only an explicitly *owner-entered* contact's name, contact method, contact detail, requested service, optional note and follow-up status. Its source is permanently restricted to `owner_entered`. It has unique `(business_id,request_key)` idempotency protection, required user confirmation of contact permission, bounded text and a finite status set. The table is RLS-protected and has no direct `anon` or `authenticated` Data API privileges: access is through a server authenticated with a protected service role.
2. **Server-enforced tenant permissions.** `busy-website-publish` has `lead_list`, `lead_add`, `lead_update` actions behind existing fresh-user authentication and business membership checks. Each is classed as a **write-authorised action**, so only members with **owner/admin** roles may use it. Every query is scoped to the resolved membership's `business_id`; the caller cannot choose another business by passing a record ID. Lead updates are optimistic-locked by existing status, and only whitelisted transitions are allowed. The `lead_add` workflow returns an existing record for the same business and idempotency key rather than double inserting.
3. **Customer-facing Website Management.** A private enquiry inbox, fields for manually recording an enquiry with contact permission, and explicit `new → reviewing → quoted → booked/closed` controls. The user must confirm permission; no message is automatically sent. Contact details display only within the current authenticated business view; stale requests from a previous account are discarded.
4. **Honest customer-value view.** Website-attributed enquiry *events*, owner-entered lead records, manually quoted enquiries and manually booked enquiries are displayed as **different measurements**. A manually selected `booked` status does not prove a booking exists in the diary, money was received, a social post was published or a job was completed. List samples are capped at 25.
5. **No automatic message or AI charges.** `leadWorkflow.mjs` provides deterministic next-step suggestions without contacting customers or invoking AI. It does not pretend to be a generated message or customer correspondence. No automatic follow-ups or paid campaign delivery were enabled.
6. **Code checks.** `scripts/check-customer-success-v378.mjs` added to the existing GitHub production CI alongside all earlier suites, covering consent/validation, idempotency, permitted status transitions, tenant filtering, bounded data, no-auto-send behavior and honest metrics.
7. **Versions** `3.78.0` and `APP_VERSION="3.78"`.

## Current verified state
- Database migration `v3_78_private_lead_followup` successfully applied to project `qgkmuiipicazmcxxmoxv`.
- `busy-website-publish` Supabase function **ACTIVE v19**, JWT verification enabled, from `index.ts`, `launchPreflight.mjs` and `leadWorkflow.mjs`.
- SQL checks confirmed that `authenticated` users cannot SELECT/INSERT the private table directly; the server role can insert; duplicate constraint and permission confirmation check exist.
- Focused helper and repository integration checks passed. This is not a completed green full CI result.
- No customer lead was created and no automatic customer message was sent during the sweep.

## Important limits
- The public contact form is **not yet enabled**. Capturing unauthenticated website visitors safely will require anti-spam (verified challenge or equivalent), ownership mapping, abuse limits, consent/privacy notice, storage retention, clear deletion, and delivery confirmation. Do NOT describe owner-entered records as website form conversions.
- Website analytics enquiry-attribution records are **events**, not verified human leads or sales.
- This does **not yet synchronise manually booked lead status with a real booking/quote transaction**. Further work should connect IDs and true write receipts, not infer actual customer conversions.
- There is no customer-facing automated reply, AI usage charge, billing integration, or website subscription enforcement.
- No real BUSY-hosted live website was published by this sweep. Real controlled staging publication requires explicit customer/founder Go Live approval; until that exists, no end-to-end external contact-form verification can be claimed.
- Full GitHub CI run, on-device iPhone acceptance, cross-tenant and anti-abuse integration tests, retention/purpose-limitation review, and provider/staging deployment are pre-release gates.

## Recommended next implementation
- An owner-authorised, privacy-noticed public enquiry endpoint with robust challenge/rate controls and abuse testing; once ready, route only verified submissions to this ledger with `source='website_form'` enabled by a separate reviewed database migration and audited terms.
- Real lead-to-customer/quote/booking linking, with separate verified outcomes and private customer-data deletion/export.
- A controlled **real** website launch to demonstrate draft → immutable hosted preview → approval → public availability → enquiry delivery before release.

## Files
- `supabase/migrations/20261009100000_v3_78_private_lead_followup.sql`
- `supabase/functions/busy-website-publish/leadWorkflow.mjs`
- `supabase/functions/busy-website-publish/index.ts`
- `src/app/AppController.js`
- `src/screens/websitePublishing.js`
- `scripts/check-customer-success-v378.mjs`
- `.github/workflows/production-check.yml`
