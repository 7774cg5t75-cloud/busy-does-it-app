# V3.64 — Business Growth Workspace 2.0 (development branch)

## Scope completed

- Uses the V3.63 confirmed-only draft generator and carries three separately reviewable targets: website, customer Business App, social media.
- Adds an owner-private cloud workspace table `busy_growth_projects` on the BUSY Supabase project. One checkpoint per creator + business + normalized service (not a public feed).
- Saves up to 25 recent project listings per business (list paging beyond 25 is a later scale improvement). Cloud Load/Save is explicit. A handoff action first records its state as an optimistic revision-safe cloud checkpoint.
- Project stages: **draft**, **reviewed**, **handed_off**, **blocked**, **needs_review**. No invented **published** stage; real publishing remains separate.
- A change to confirmed profile fields marks previous review/handoff stages stale. Copy stays preserved; to continue, owner explicitly acknowledges latest facts and reviews each available channel again.
- Cross-owner/business source keys are rejected during rebase. No auto-publishing, no background executor, no marketing performance inference.
- Checks original website/app/social existing permission gates; private editor handoffs do not publish.
- Conflict-safe cloud create-only POST and revision-filtered PATCH prevent silent cross-device overwrites. Load prompts before replacing unsaved device text.
- Cloud credentials are from the existing authenticated BUSY owner session; no service-role key is embedded in the client.

## Production database foundation (deployed separately)

A narrowly scoped table was created in the BUSY Supabase project using `docs/V3_64_GROWTH_PROJECT_SCHEMA.sql`.
- Primary key is `(business_id, user_id, service_key)`.
- Foreign keys cascade only when the business/user is deleted. No existing customer data modified.
- Row Level Security is enabled; no anon grant. Authenticated read/create/update policies require authenticated account ID and actual business creator ownership.
- Data API requires explicit authenticated grants (Supabase 2026 default exposure change).
- `revision` is an optimistic concurrency counter, checked in REST update filters.
- No delete permission to regular clients, no auto-publication stored procedures.
- Security advisors were inspected. Existing unrelated warnings include `pg_net` in public schema and leaked-password protection disabled; neither originated from this table.

## Validation / tests

- `node scripts/check-growth-workspace.mjs`: three draft stages, editing resets review, approved source drift, tenant source guard, blocked channels, rebase, simulated two-device revision conflict and owner/business scoping.
- `node scripts/check-growth-drafts.mjs`: inherited website handoff and approved-only content checks.
- `node scripts/check-coordinated-growth.mjs`: inherited profile and blocker checks.
- `node scripts/check-conversation-understanding.mjs`: existing AI suggestions and guardrails.
- `node scripts/check-production.mjs` / GitHub workflow production checks.
- Workflow `.github/workflows/check-growth-workspace.yml` runs the V3.64 tests.

## Still requires device acceptance before production release

- [ ] Sign in on real iPhone, create a project, review each channel, save it, relaunch, select same service, load and verify exact wording/stages.
- [ ] Load the same project on an iPad; edit and save there; attempt to save an old iPhone revision and confirm the conflict message, without replacing iPad text.
- [ ] Test signed-out access and separate owners/non-creator members. RLS configuration was inspected, but authenticated device isolation is not yet demonstrated.
- [ ] Change confirmed service details while a saved project is loaded; ensure previous reviews are invalid and owner acknowledgement keeps personal edits.
- [ ] Ensure website HTML remains private and no social post/app release goes live without its separate final approval.
- [ ] Test interruption during handoff, poor network, screen transitions, on-device keyboard/scroll, token refresh, real app publishing boundaries.
- [ ] Verify app has no unexpected writes to other owner cloud records; rerun final head CI and Snack preview after all changes.
- [ ] Complete V3.60–V3.63 acceptance gates and native development build after Apple Developer approval.

## Limitations (do not overclaim)

- The cloud table is deployed, but real device authenticated end-to-end save/load has not been demonstrated.
- Manual project selection and load are necessary; no real-time push reconciliation or full offline-first sync yet.
- Handoffs require successful cloud checkpoint saving; if offline/conflicted they remain in the workspace and are not handed to private editors.
- `handed_off` means sent to a private editor, never actually published or accepted by the external provider.
- The workflow is revision-safe but not a transactional guarantee across separate cloud and local-website state changes. Review of each editor is still essential.
- No Apple native build can be installed before Apple account resolution and native test configuration.
