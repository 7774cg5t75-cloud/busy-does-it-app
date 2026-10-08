# V3.65 — Business Growth Command Centre 2.0

**Status:** Development on branch `v3.65`. Not merged or released. Based on V3.64.

## Implemented

- Adds a prominent **Growth Command Centre** entry on Home alongside the existing Daily Command Centre (which is preserved).
- Adds `src/screens/growthCommandCentre.js` for a bounded, owner-only cloud overview of up to 25 recent saved growth projects. It refreshes on opening and explicit Refresh, not in a background loop.
- Reads projects using the existing `busy_growth_projects` owner-private RLS table, with an expanded `listGrowthProjects` SELECT to include `draft_data`. No database schema change or extra subscription is necessary.
- Derives per-channel status from the saved private checkpoint. Prioritises missing approved details, changed facts requiring review, owner-unreviewed drafts, reviewed wording, and finally private-editor handoffs.
- Provides deterministic typed questions: "What's left to do?", "Which drafts need my approval?", "Continue my carpet cleaning project?", and "Where are we with carpet cleaning?". Suggestions are grounded in actual saved project rows, not speculative AI output.
- Selecting Continue preselects that service in the existing **Build my business with BUSY** workspace; the owner then explicitly loads its saved private project before acting. No automatic overwrite.
- Client-side checks reject malformed/mismatched stored data, enforce source owner/business IDs in the original project fingerprint, ignore duplicates, and discard late asynchronous responses after tenant changes.
- Separates what BUSY knows from what it cannot verify: **handed_off** = transferred to a private editor, **not published**. Website, Business App and social publishing require separate provider confirmation and permission workflows.

## Safety constraints

- Entire Command Centre is read-only, with no provider publish endpoints, destructive database commands, or background job dispatcher.
- No invented usage metrics, launch progress or conversion uplift. Draft review counts are explicitly labelled private-only.
- A server/cloud error is shown as an unavailable state, never as "no projects" or "all done".
- Owner-only RLS remains the authority; client-side fingerprint checks add defence in depth. The Command Centre requests no customer records, photos, unpublished content from other accounts, or external marketing information.
- Typed natural-language queries are handled locally with conservative intent matching. **They are not yet routed through the global microphone/voice command pipeline**, so do not claim voice-first end-to-end project management is complete.
- Project list remains limited to 25 records (matching the existing cloud client) until a dedicated paged query is added.
- This view does **not** independently verify public website deployments, Business App releases or social post receipts, even if another part of BUSY has those records. Provider-verified completion should be a separately audited future feature.

## Automated checks

- `scripts/check-growth-command-centre.mjs`: realistic V3.64 checkpoint inputs, correct priority/status, conservative natural-language selection, stale-approved-fact detection, unconfirmed service handling, cross-business/user isolation, invalid rows and duplicate checkpoints, route wiring and absence of publish actions.
- `.github/workflows/check-growth-command-centre.yml`: inherited V3.62–V3.64 regressions, plus new command-centre checks.
- `.github/workflows/production-check.yml`: standard production foundation and website failure recovery simulation.
- `.github/workflows/publish-snack.yml`: generates a versioned Expo Snack preview metadata record on this development branch.

## Acceptance still required before a production release

- [ ] Open V3.65 on a signed-in iPhone. Verify the Home shortcut loads the new project dashboard.
- [ ] Save a real growth project on one device and refresh/load it on a second signed-in device, verifying accurate timestamps and per-target review status.
- [ ] Switch business/account during a pending refresh; no previous tenant data may remain visible.
- [ ] Change an approved service description, service area or contact; see the stale-facts notice and correct re-review path.
- [ ] Attempt to open a saved service that is no longer confirmed; no unauthorised review/handoff.
- [ ] Interrupt internet access, refresh, and confirm BUSY shows "unavailable" and leaves private records untouched.
- [ ] Confirm typed commands are safe, and publication requests never schedule or publish directly.
- [ ] Verify website, Business App and social live statuses in the *separate*, authenticated provider-specific systems.
- [ ] Recheck prior V3.60–V3.64 device acceptance gates and native development build once Apple Developer enrolment is resolved.

## Next extension

After real-device authentication and backend integration tests, consider unifying this with the global voice conversation, authenticated provider receipt checks, per-channel audited completion signals, and eventually notifications about genuinely stalled private work — all without mixing unverified draft progress with live publication.
