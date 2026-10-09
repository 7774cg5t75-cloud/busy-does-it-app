# BUSY DOES IT V3.76 — Evidence & Intelligence Engine

**Status:** development branch `v3.76`. Not released; real iPhone acceptance and full GitHub Actions suite remain outstanding.

## Purpose
Preserve privacy-safe real-world verification *history*; identify patterns across repeated checks; reduce needless checking and costs. Do not mistake an internally accepted provider submission for public delivery or invent underlying shared-root-cause attribution.

## Implemented

1. **Private evidence history.** A new `public.busy_platform_evidence_snapshots` table retains only explicit aggregate numeric fields: sampled BUSY-owned website endpoints and results; submitted social-provider receipt counts and anomalies; Business App version handoff results. It stores NO hostnames, URLs, business IDs, customer IDs, post IDs, media, emails, provider response payloads, tokens, or free-form JSON. RLS enabled; `anon`/`authenticated` table privileges revoked; service role only SELECT/INSERT/UPDATE.
2. **Atomic 30-minute check claim.** Founder-only `verify_external` must first claim a database time slot via the no-parameter `public.busy_claim_evidence_window()` RPC, executable only by the service role. The unique primary key blocks duplicate claims, including overlapping concurrent requests. A second call in the same half-hour returns HTTP 429; no new external probes run. Each accepted invocation checks at most **4 website HTTPS HEADs, 12 social database records and 8 Business App database records**. At most 48 claims per day (up to 192 website HEAD requests/day) when actively requested; there is no automatic hourly external provider polling.
3. **Safe persistence.** The Edge Function constructs the recorded row from the already-sanitized, bounded digest, validates numeric limits and complete category totals, then patches only its claimed `running` row. Failed or unavailable sources are `null`/partial, never coerced into healthy zero. Response carries a `historyPersisted` indicator, so dashboard can warn when evidence was shown but not stored.
4. **Retention.** Scheduled hourly database-only cleanup `busy-v376-evidence-retention` deletes snapshots older than 30 days. It does not contact external providers or alter customer content. No new automated external checks are enabled.
5. **Trend intelligence.** The founder-only summary fetches up to 336 completed/partial evidence snapshots from the past seven days, computes conservative issue observations on *complete* snapshots, and compares recent vs previous daily average issue observations **per check** only if both windows contain at least two complete observations with actual samples. The analysis flags:
   - Several sampled website endpoints unreachable or mismatched in the same check — a **possible** shared infrastructure symptom, not proof of a provider outage.
   - Repeated website issues across separate sampled snapshots — may represent the same website, never automatically counted as multiple incidents.
   - Repeated social receipt anomalies across checks — may represent the same posts; accepted receipts still do not prove public visibility.
   The server returns only aggregate labels and safe generic notes.
6. **Founder dashboard.** V3.76 Evidence & Intelligence shows the seven-day sample count, latest sample time, trend, issue observations, conservative diagnostic hints, and bounded policy limits. After a 429 the existing manual check explains the 30-minute cooldown. The app's normal on-demand founder refresh shows saved history. No tenant-specific data is exposed.
7. **App version** 3.76.0; `scripts/check-platform-autopilot-v376.mjs` added to GitHub production validation with previous regressions.

## Verified in development
- Both Supabase migrations `v3_76_evidence_snapshots` and `v3_76_evidence_retention` applied.
- A rolled-back SQL fixture verified the first atomic claim succeeds and the second claim is blocked; authenticated clients have neither direct table access nor RPC execute permission, and the claimed row can be completed.
- The new founder reporting Edge Function deployed **ACTIVE v11** with JWT enforcement.
- Pure JavaScript fixture verification checked data sanitisation, bounded counters, possible-shared-website symptom and conservative trend handling.

## Honest limitations & next release gates
- No real website or Business App production instances existed when this workflow was introduced; those external health categories could not yet be exercised end-to-end.
- Existing Facebook/Instagram/GBP submission receipts are not public-feed readbacks. Real provider polling needs separate scope, cost, quotas and user approval review.
- Historical aggregate sample patterns are not population-wide reliability or definitive causation; no customer identifiers are collected for provider grouping.
- The `verify_external` path is manually requested by an authenticated founder. Automatic scheduled external checking and automatic content retries are **disabled**.
- AI/model costs and provider billing invoices are not yet measured; rate limiting controls volume but does not verify actual cash spend.
- Confirm GitHub Actions successfully passed at this commit and perform future native iPhone acceptance and site/provider integration testing before release.
