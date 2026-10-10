# V3.121 — New-customer clarity and recovery safety

This development sweep focuses on real customer-friction and failure modes.

## 1. First-time website onboarding
New owners see a short next action from existing confirmed Brand Brain facts. If information is incomplete, BUSY identifies up to three plain-language details to check. When the brief is confirmed, it recommends creating a private first draft. Existing drafts remain editable without suggesting they are automatically public.

If a customer has changed a private website since the last hosted preview, the Website Builder now explicitly labels the previous hosted version as "not latest". Nothing is published by previewing.

## 2. Exact-version Go Live gate
A new read-only publication preflight is wired into Website Management. It checks that an immutable hosted preview exists, that it matches the current private draft, that it has actually been opened and explicitly reviewed, and that the server allows publishing with no conflicting job. It resets the in-app "reviewed" state when the preview ID, content hash, or private-draft freshness changes. Go Live remains disabled if any check fails.

This is a customer-facing safeguard and **does not replace server authorization**. Tenant identity, exact deployment/hash, permission, publishing idempotency and actual public delivery must still be independently verified by the server. No automatic publishing, domain purchase or approval is enabled.

## 3. Safe recovery after failure
Website Management now provides different next steps for in-progress jobs, bounded automatic recovery, a customer-owned DNS action, a server-permitted manual retry, and an unverified public site. The retry button remains disabled unless both the server and the read-only recovery guide permit it. A retained last-known-good deployment is not an automatic rollback or proof that public delivery is healthy.

## 4. Founder intervention without unsafe autopilot
Founder Operations now uses the existing founder-only aggregate incident counters and their freshness evidence to present the next manual investigation. Stale or missing snapshots must be refreshed before acting on old counts. Confirmed failures are still review items, not permission to restart services, retry external providers, charge subscriptions or message customers.

## 5. Repeatable evidence
The new regression contract covers first-time brand setup, exact preview freshness and customer review, conflicting in-flight jobs, DNS owner actions, automatic retry conflicts, last-known-good versions, founder-only incident visibility and missing provider data. The dedicated Chromium workflow renders nine entirely fictional businesses across phone and desktop screens, checks internal navigation and primary customer actions, and deliberately injects a broken in-page link to prove the audit catches it. Existing before/after screenshot quality, visual diversity, five-size responsiveness, and keyboard accessibility tests are retained.

## Not activated
The changes are in GitHub development source. No real customer beta, public site publication, registrar purchase, paid AI vision, production database migration, email/SMS incident alert, payment, signed native build, or live DNS change occurred. These still require controlled provider access and independently approved staged testing.
