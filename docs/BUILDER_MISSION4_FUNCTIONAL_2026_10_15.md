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
