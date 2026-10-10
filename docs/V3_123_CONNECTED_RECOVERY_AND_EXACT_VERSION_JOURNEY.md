# V3.123 — Connected tenant-safe read recovery and exact website lifecycle

## 1. Bounded policy wired into an actual authenticated status transport
The existing read-only business activity status service now consults the common website automation boundary contract. Three known business-scoped sources (website, Business App, social) call only existing status operations using the owner's JWT and business ID. Transient 408/502/503/504 statuses or independently identified network/timeout failures may receive one additional read request, then stop; 429 rate limits, status 500, unknown providers, invalid business scopes and cross-tenant responses cannot trigger unbounded retry or a privileged write. This is a real source-code connection, not just a dashboard description; it does not introduce an external scheduler or paid API calls.

## 2. Exact current hosted preview takes priority over unordered deployments
The shared website publishing view compares the selected immutable hosted preview's source_generation with the private draft's generation, not the first deployment returned by an API. Missing, mismatched or outdated generations fail closed for publication. A successfully prepared preview still requires the exact-version customer review, separate Go Live click and authoritative server tenant/permission/preflight verification.

## 3. Connected customer safety messages
A new read-only customer safety summary joins the shared publishing state, preview approval and recovery guardrails. Website Management displays one clear next step: check details, build privately, wait for an ongoing job, check DNS instructions, await bounded recovery, review manual recovery, prepare new hosted version, review the exact version, or independently verify the public site. The summary cannot publish, charge, change a domain or tell a customer a recorded deployment is a proven live site.

## 4. Tests and evidence
A new integration suite tests the ACTUAL authenticated status transport with simulated HTTP replies: retry 503 and a verified network failure once, refuse 429 and 500, refuse wrong-tenant replies, stop after the second failed read and reject unknown actions. The same suite covers out-of-order deployments, missing source-generation proof, owner consent, Business Brain business isolation, safe manual recovery and global-release blocking.

The GitHub workflow also compiles iPhone JavaScript and runs Chromium browser tests against nine fictional business websites, including source text, navigation, visible actions, private design alternatives, multiple viewport widths and keyboard accessibility. These demonstrate development-source quality, not the success of a real customer rollout.

## What remains
No production Supabase learning migration, real user pilot, domain registration, new paid AI screenshot reviewer, public website publishing, supplier charge, automated customer action or signed iOS app was activated. Real staging deployment, tenant-policy testing, privacy/retention review, recovery monitoring, signed-device testing and the Global-Ready master release audit remain future manual gates.
