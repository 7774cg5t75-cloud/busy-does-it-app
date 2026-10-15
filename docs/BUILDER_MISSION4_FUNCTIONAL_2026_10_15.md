# Mission 4 — dependent functional development

Dependency: draft PR #10 plus its Mission 4 review corrections (local 1594cb83 and b8022aa9). New work is isolated on codex/builder-mission4-completion and will use a separate draft PR based on the reviewed PR #10 head, never main/v3.240. Product preflight: supplied V22.18 and current architecture/policy; App Builder first, explicit approval, reuse of Business Brain/Brand DNA and existing private editors, no spend or production work.

## Functional sweep 1 — reviewed business-fact reconciliation

The App Builder's existing-app refresh button now opens a scoped comparison with the existing saved public business profile, rather than immediately rebuilding over custom copy. New missing facts/services can be selected by default; conflicting current wording is retained unless the owner explicitly selects its replacement. No service is removed, same-name services retain current IDs, and images/unsupported fields are not silently imported. Empty, malformed, duplicate, outdated, locked or foreign source facts are rejected or explained.

The extracted comparison component prepares selected finite edits in the original App Studio. It reuses the original planner, exact proposal binding, owner approval, CAS save, encrypted checkpoint and exact inverse. Source app/config/revision and saved-profile content/revision are checked again at the preview tap. No extra source of truth, baseline database, AI call or background sync is added. The old backend rebuild remains an explicitly invoked operation; source-only UI review does not update shared public facts or claim every profile field is synchronised.

Tests cover missing facts, explicit conflicts, stable IDs, exact full undo, preserved appearance, no removals, foreign/outdated/stale source rejection and owner locks. UI/native syntax and the 330-module dependency closure pass. Facts and transport are fixtures; no real saved customer business profile was read.

## Functional sweep 2 — reviewed owner editing protection

Owners can now inspect and change App editing locks through a compact extracted control. It prepares one lock-only Studio proposal; lock changes cannot be combined with copy/layout edits in the same batch. Unlocking an all lock remains possible through this explicit owner-approved route. The original endpoint, CAS revision, exact receipts, private encrypted recovery and owner permissions are reused. No privileged client-only permission or new endpoint is introduced.

Lock setting/removal is exactly reversible, including absent/null presentation and existing opaque lock IDs. The existing bounded lock-ID schema remains authoritative; the UI offers supported group choices and shows any legacy saved identifiers. A lock snapshot cannot remove other appearance properties. Public standalone projection continues stripping owner lock metadata.

Tests cover lock/unlock, separately reviewed revisions, no mixed content batch, exact inverse, legacy-ID restoration, malformed metadata, appearance deletion attempts and byte-identical client/Edge helper implementations. Native parser and 332-module preview graph pass. Real hosted owner/admin authorisation and device UX remain unverified.

## Functional sweep 3 — asynchronous website operations stay in their source workspace

One small ephemeral gate now binds existing visual-readiness/review/studio and original-media backup operations to live actor, business, exact draft object and hosted-preview scope. Duplicate starts are rejected synchronously. Workspace round trips invalidate old tokens; old completions cannot clear a newer operation's busy state. Existing review transport checks before/after token acquisition and after response, and payload fields cannot override the trusted business/action.

Original-media backup checks the live source after local reads, before upload, after response and before history/state replacement. A completed backup advances the private generation and synchronises the draft ref. An upload already authorised and sent before a scope change cannot be rolled back by local cancellation; its result is simply not attached to another draft. The underlying provider, file-size, credit and approval constraints are retained. No upload or paid review was invoked during this mission.

Tests execute actual extracted review transport and media backup code with paused local/token reads: actor changes prevent fetch, source changes prevent upload/state/history changes, payload scope overrides are rejected, and duplicate/round-trip/deployment scopes are checked. Native syntax passes. These are offline dependency-injected scenarios; actual provider cancellation, private cloud backup and hosted visual review remain unverified.

## Functional sweep 4 — target measured responsive fixes instead of guessing

The existing private WebView measurement script now returns at most six clipped-heading and six overflow section IDs, with no text, URLs or tenant identity. The bridge validates bounded identifiers/count agreement and retains legacy report compatibility. The existing measured coach can now propose the section actually measured, not always the homepage hero. Phone/default/tablet/desktop decisions use existing finite responsive heading controls; only supported operations that the original editor can actually apply are proposed.

Services-row suggestions require measured service-area overflow when location evidence exists. Unknown/off-page/locked targets and owner-disliked choices are omitted. Explanations include trade-offs and remeasurement requirements; wording, images and unrelated sections remain unchanged. Existing owner feedback, preview candidate, width portfolio, owner approval and Undo are reused; no AI call or second responsive/design engine.

New tests execute the actual generated measurement script against a fixture DOM, validate hostile/duplicate/oversized targets, and apply each named-width proposal through the original layout engine. They verify preserved content, unrelated sections, locks, page scope and feedback. Existing V3.144/V3.145 measured coach and interrupted measurement tests pass. Fixture DOM execution is not browser rendering, physical-device visual acceptance or proof of customer task improvement.
