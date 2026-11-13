# Mission 15 Phase 15 — open development checkpoint

Branch `codex/builder-mission15-design-advancement`, draft PR #26, base/dependencies #25 → #24 → #23 → #21. Starting remote head `ce6b93f0e90beab5255ea223ae8b59f09f09ddf8` was verified unchanged before implementation. Final functional source `40aafa12de59a4f208904254f4e4ebc86881315f`, tree `fa1c50b275b6d7163c99c17a9d192b32236ba266`. Record-only commits may advance the PR.

## Mandatory master review

Read the complete owner-supplied V22.35 Word master: 1,796 body/table paragraphs, 425,343 extracted characters, including Sections 52.11–52.15. SHA256 `7d93efedb1ff68a57470bdb97073767a14a9fc64cd1c53c06fba3021d12e298d`. It supersedes V22.34. The private file/text remains outside Git; only provenance is public. Reviewed AGENTS, architecture and permanent development policies, public guidance, Phase 14 implementation/evidence and reused original contracts.

Dependency heads reverified unchanged, draft and unmerged: #25 `3e64352e7e043812b1ba79a0609b64c251a0f4bd`, #24 `2358f2ab0ba53e312a5da8de9e08e1d566966ace`, #23 `f9b11034449a8d401ea71afe27627c5715325c72`, #21 `55db12d247b149aa2052fc17f5d5dc536a77b8a7`.

## Delivered functionality

### Individual request-button and service-card editing

Owners can select an existing service’s enquiry or booking-request button in the original App Studio preview. Owner-preview presses select the exact service/action; they never submit a customer request. Customer-mode callbacks retain the original service name, request type and downstream published-version/review/receipt contracts.

Selected buttons offer normal/roomier relative sizing, outline/solid brand emphasis, left/full-width alignment and rounded/square corners. Display wording and destination cannot be modified by appearance data. Text size/weight follows the bounded size/emphasis contract. Calculated foreground colours preserve at least 4.5:1 on the supported solid button backgrounds across all native palettes. Controls wrap, have no fixed text height and preserve a 48-unit minimum button height; this is a rendering contract, not physical-device acceptance.

A uniquely identified service card has its own spacing, plain/card background and corners. Existing per-title/description typography remains available. Category, price/duration labels, service identity, owner copy, collection width, featured-first logic and customer actions are unchanged. No speculative service image or unavailable asset is attached.

Original Studio comparison, owner approval, trusted coordinated operations, CAS and snapshot Undo own persistence. The finite style map is client/trusted shared source, bounded to 20 identified services, with no executable/action/permission/URL properties. Reserved prototype keys and stale/unknown targets reject. Service/action/appearance locks apply to changes and inverse restoration. Styled-source removal is blocked until reset. Card and individual button resets affect only their named scope and preserve other styles; Undo restores the exact previous configuration.

Marketplace and standalone rendering use the same card token helper and shared ServiceActionButton. Public projection and native read validation carry the supported data; packaging copies the canonical helper/palette/component. Genuine request buttons remain requests, never confirmed appointments. No new backend request engine, schema or provider action.

Checkpoint `72184d4f7171676125ea05804bda13a3c3b388ef`; scoped-reset refinement `c67b9a8800be411d27025069c95cd9b9bd36daf1`.

### Contextual typed/voice-reviewed instructions

Existing selected-element interpretation now prepares supported requests such as make this button roomier, solid, outline, rounded, square or full width, and make this card more spacious. Exact selected service/action/source and original approvals remain authoritative. Unsupported compound instructions, stale service snapshots or unavailable actions reject without partial application. This extends the existing typed/transcript-review path; no real audio/provider call ran.

### Coordinated website text editing

The selected heading/paragraph toolbar can prepare a return to brand font, weight, alignment, line spacing and colour as five existing finite operations in one private atomic review. Owner wording, Brand DNA and other content are not overwritten. The original preview/Apply/Undo path remains the only editor; replaced selections cannot stage old callbacks. This is not arbitrary rich-text/range formatting, browser inline contenteditable or freeform placement.

### Personal/club planning and clearer Talk & Explore

The existing universal planner now accepts an explicit business/personal/club planning purpose. Neutral plans can discuss a project introduction, pages, media and appropriate requested capabilities without inventing a business identity. They explicitly report the missing creator/project workspace and remain planning-only: no records, modules, charges or publication are created.

Talk & Explore answers personal/club questions using that same original planner. It explains useful information-site foundations and distinguishes them from private trackers/member accounts/shared storage that need real trusted support. Existing business projects and tenant checks remain intact. Personal-project discussion cannot prepare a change to the current business app, even when its wording includes a recognised style instruction such as more space.

Existing no-write Explore, exact owner/business/source checks, explicit Make changes, private review and separate approval remain. The internal remote capability foundation is unchanged and dormant: no distributed session, restricted bearer credential, remote AI/tool access or paid voice is activated. The working local executor has no write/provider handler. Existing owner credentials remain governed by their original editor permissions elsewhere.

Checkpoint `2a4329f409f00060817c9ede2841ec8f404e2414`; discussion-only scope correction `40aafa12de59a4f208904254f4e4ebc86881315f`.

## General-purpose architecture findings and staged route

Some assumptions are deliberate trusted boundaries: business membership/roles, `business_id` in apps/requests, essential business_profile runtime module, original owner inbox/CRM, public business versions and CAS. They cannot be removed by relabelling a screen or making up a business record. Current app/website save and publication remains business-scoped.

Reusable planning/presentation need not require trading details, services, opening hours, customer accounts or payment connections merely to discuss a personal information project. This phase removes that assumption from planning descriptions; it does not migrate identities or pretend a personal workspace exists.

Next staged implementation: (1) inventory ownership/resource scope and design a general owner/workspace/project authority with explicit business adapter; (2) separately review schema/RLS/permissions, private assets, export/retention and migration contracts, keeping existing business rows unchanged; (3) implement a narrowly bounded personal information-site workspace with exact revision/approval/Undo and tenant tests; (4) pilot selected non-commercial capabilities only with actual secure records and permissions; (5) review explicit personal-to-business conversion, consent/data purpose, domain/ownership, costs and rollback separately. No schema or live migration is authorised by this plan.

## Quality, evidence and limits

Finite appearance tokens cannot hide/disable buttons, change destinations or create actions. Real palette contrast is calculated; responsive wrapping/minimum size are source contracts. Original critical save/publication checks reject unsupported and orphaned styling; subjective spacing/emphasis remain owner choices. No screenshot, aesthetic judgement or accessibility certification claimed.

Pinned offline tools were healthy without installation (Node 24.19.0, npm 11.9.0, 51 isolated packages). Focused regressions cover actual customer/owner callbacks, public projection, original standalone service renderer, CAS/trusted planner parity, locks, exact Undo, stable source, reset scope, neutral tenant preservation and five-step website rendering. Earlier extracted native test fixtures were given genuine newly imported helper/component dependencies; behavioural assertions remain.

Final frozen-source complete selection: **115 passed, 0 failed, 0 blocked, 0 unexecuted**. The runner began from a clean committed working tree, mapped to the functional GitHub tree above. See the checks JSON for individual results and hashes. Two earlier broad runs passed 115/115; final reset and neutral-scope refinements justified a final integrated run on the clean frozen functional source. Source edits stopped before that final run. Thirty-one changed source/test files parse, four environment-policy tests pass, standalone fixture packaging passes, static relative-import cycles are zero and whitespace checks pass.

Tests execute original code with inert auth/native/IO boundaries. No real browser, iPhone/iPad, signed Expo export, hosted JWT/RLS or provider acceptance is established. The previous disposable DB rehearsal was not rerun and proves only its original source/scope. No comprehensive acceptance programme or blocked Chromium retry occurred.

## Compatibility and next work

A separately approved rollout must update authenticated Studio planner/appearance/lock helpers, guest projection/native palette/helper bundles, native validation/rendering and regenerated standalone exports before clients rely on the new operations. Older handlers fail closed on unknown operations. No DB migration is required for these JSON configuration fields. No rollout performed.

Mission 15 remains open. Next useful work: legitimate owner-written request labels with trusted meaning constraints; richer selected service layout/approved-image contracts; tighter mobile toolbar grouping; further product/event/service journey refinements and approved general owner/project tenancy design. Universal dragging, arbitrary styling/code generation, personal accounts/workspaces and unrestricted remote exploration remain unsupported.

No merge, deployment, publication, hosted database access/change, workflow execution, credential/billing change, real customer/provider action, package install or additional external spending. £0 additional spending.
