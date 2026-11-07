# Mission 15 Phase 18 — shared customer recovery and website instructions

Continues verified `131573da89e13781a02116f3a64a74b442890c4a` on the existing Mission 15 branch/PR #26. PR #25/#24/#23/#21 were read from GitHub: all remain open, draft and unmerged at their expected heads. Private V22.35 was fully reviewed earlier in this current task; the original Word and extracted text remain available outside Git. Current project instructions, architecture, Phase 17 evidence and actual source contracts inform this batch.

## Delivered functionality

- Shared product/event catalogue controls bind their callbacks to the current feed, kind, selected record, filters and option state. Refreshing/replacing the feed or changing options invalidates older visible callbacks before they can prepare an enquiry or open an event link. Original trusted preparation/submission/version/consent/receipt systems remain authoritative; this UI guard is additional protection, not server authorisation.
- A selected listing disappearing from current results gets an accessible recovery explanation. Customers can clear search/category filters and return to current results in one action. Cancelled event actions remain unavailable under the original rules. No availability, booking, purchase or delivery claim is added.
- Service search/category views show result counts and a single Show all services action clearing both filters in marketplace and standalone. Both use one shared component, removing the duplicated marketplace implementation. Standalone service cards use stable service keys rather than a filtered index where identity is available.
- Original website page transactions support “move my services … make the heading bigger … give the section more space”. Bounded references apply only to a preceding exact visible section. A verified bug is fixed: reference resolution never rewrites or rejects quoted owner copy containing “this section” or “its heading”.
- A bounded modern whole-theme comparison coordinates existing typography, outlined cards, navigation and spacing operations. It changes actual canonical renderer output and preserves sections/wording, colours, images, destinations and order. It is an owner-reviewable design hypothesis through the original private preview/Apply/Undo path, not a visual aesthetic claim. Global theme scope is explained.
- Talk & Explore explains existing app service discovery from authorised service/category facts and actual search prerequisites. Hobby-app discussion reuses neutral planning and cannot hand off a business edit. No remote Explore authority/tools/AI/voice are enabled.

## Reuse, security and limits

No replacement editor, request engine, planner, memory store, provider action or schema. Source/request identity, original owner/CAS/locks/Undo and publication boundaries remain unchanged. Feed callback guards execute only in the shared presentation component; the trusted server still must reject stale/foreign submissions. No new hosted or device acceptance is claimed.

Approved service imagery remains unimplemented: current media entries have approved URI metadata but no reviewed stable service/asset association. The separate contract proposal records required asset identity, authority, revocation, publication, inverse and export rules. No unrelated photo is attached. General-purpose creation remains planning-only under the prior workspace/project authority proposal.

Architecture improvement: marketplace service filters now re-export the existing standalone component. Main AppController and Edge entrypoints are untouched; miniApps receives only a prop-wiring change. No speculative rewrite. Website grammar and native renderer dependencies require a compatible separately approved rollout/regenerated standalone export; no rollout occurred.

## Verification

Focused actual shared component tests cover original product enquiry context/revision, stale callback denial, removed-listing recovery, filter resets and component identity. Existing request/tenant/receipt suites and original website plan/renderer/locks tests pass focused checks. Quoted owner copy and unsupported/ambiguous commands have regressions. Twelve changed source/test modules parse with pinned tools. Environment health passed with no installation.

Final clean complete offline selection: **116 passed, 0 failed, 0 blocked, 0 unexecuted**, against frozen functional GitHub checkpoint `0ad2aeeadbaf5f3cba466147f9f80a0c9998131b`. The runner started from a clean committed tree. Initial broader run had 115 passes and one inherited duplicate-source assertion failure; runtime-identity replacement retained behavioural tests, then the complete final selection passed together. Exact source mapping and individual results are recorded in the accompanying checks JSON. Original sources run with inert native/auth/IO boundaries. No screenshot, geometric/aesthetic assessment, physical device, Expo export, hosted RLS or live provider acceptance is asserted. No blocked Chromium retry or comprehensive acceptance programme.

Mission 15 remains open. Next work: richer service/product/event detail-to-request flows with existing published contracts, compact selected-component controls, approved asset identity/association design, and further canonical responsive composition/candidate refinements.

No merges, deployments, hosted database/schema changes, workflow dispatch, publication, real customer/provider actions, credentials/billing changes, paid services/builds or additional external spending. £0.
