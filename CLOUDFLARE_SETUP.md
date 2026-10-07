# BUSY DOES IT — Cloudflare production activation

This file is the operator checklist for V3.46. It contains no secrets.

## Current public domain state

- Root zone: `busydoesit.co.uk`
- Authoritative nameservers: Cloudflare
- BUSY default website pattern: `site-<slug>-<business-suffix>.busydoesit.co.uk`
- Customer-domain CNAME target: `sites.busydoesit.co.uk`
- SaaS fallback hostname: `origin.busydoesit.co.uk`
- Router Worker: `busy-website-router`

BUSY independently verifies the nameserver and routing state; dashboard settings are not treated as proof that a customer website is live.

## One-time account-owner steps

1. Open the `busydoesit.co.uk` zone in Cloudflare.
2. Open **Custom Hostnames** and enable **Cloudflare for SaaS**.
3. If Cloudflare requires billing details for the non-Enterprise plan, complete that step in Cloudflare.
4. Create a restricted API token scoped to the BUSY Cloudflare account and the `busydoesit.co.uk` zone.
5. Give the token only the capabilities BUSY currently uses:
   - Zone DNS Write
   - SSL and Certificates Write
   - Workers Routes Write
   - Zone Analytics Read
   - Account Workers Scripts Write
6. Store these values only in Supabase Edge Function secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_SAAS_ZONE_ID`
   - `CLOUDFLARE_ACCOUNT_ID`

Do not commit the token to GitHub and do not put it in the mobile app.

## What BUSY automates after those values exist

The internal `bootstrap_platform` provider action is idempotent and deliberately refuses to run before the root nameservers are live. Once credentials are present it can:

1. Create/update the proxied dummy fallback record at `origin.busydoesit.co.uk`.
2. Create/update the friendly SaaS CNAME target at `sites.busydoesit.co.uk`.
3. Create/update the wildcard BUSY website DNS record.
4. Set the Cloudflare-for-SaaS fallback origin.
5. Upload the `busy-website-router` Worker.
6. Add no-Worker exclusions for `busydoesit.co.uk/*` and `www.busydoesit.co.uk/*`.
7. Add the wildcard `*/*` Worker route used by BUSY default sites and SaaS custom hostnames.
8. Re-run DNS/provider readiness checks.

The bootstrap will not silently overwrite a conflicting Worker route owned by something else.

## Production truth rules

A domain is not considered live merely because it was added to Cloudflare.

BUSY keeps these states separate:

- root nameservers active
- provider credentials configured
- routing Worker deployed
- root/www exclusions installed
- fallback origin active
- routing DNS resolving
- custom hostname active
- custom-hostname SSL active
- BUSY health check observed the expected immutable deployment

Only the final observed delivery state can mark a customer domain active.
