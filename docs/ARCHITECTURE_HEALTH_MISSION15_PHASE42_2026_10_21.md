# Phase 42 architecture health — feature-led review

Five connected improvements retain the original customer snapshot, enquiry editor, Content Creator, finite Operator routing and six-area Home. No schema, dependency, provider or alternate persistence engine was added.

Census (static source only): 1,361 files, 153,580 physical lines, 2,718 relative-import edges, zero cycles. Phase 41 had 1,354 files and 153,369 lines. Main controller remains 18,188 lines (+17), miniApps 5,363 and main mini-app Edge 4,606. Counts include code/testing sources and do not establish runtime quality. Thirteen changed functional modules parse. Complete regression evidence is linked from the [delivery report](MISSION15_PHASE42_2026_10_21.md).

The new `privateEnquiryReply.mjs` prepares/inspects one private field on original customer records and reuses the existing filing reference, scoped cache envelope and readback. The original parent supplies authenticated-workspace context and the established checkpoint queue. The existing enquiry hook owns source/typing metadata, not a second wording store. `SavedEnquiryReplyButton` keeps recovery rendering and current-context checks outside the large customer screen. The original content engine, Brand DNA and source hook carry announcement/offer format evidence; no parallel copy engine.

Key risks and next actions:

* Oversized inherited controllers still mix permissions, records and UI orchestration. Keep future changes feature-led; a later tested extraction of the narrow snapshot adapter can reduce closure coupling. Avoid speculative whole-controller rewrites.
* Device readback and local guards do not authenticate server membership or guarantee cloud/OS durability. Account-specific save acknowledgement, hosted RLS/CAS and cross-device acceptance remain separate.
* Strict source stamps intentionally fail closed after source/customer changes. Canonical comparison and a smaller reviewed provenance projection deserve a focused follow-up; source stamps are not immutable authenticated evidence. Recovery never silently attaches another enquiry.
* Original private snapshots now retain an optional customer reply field. Verify older-client field retention, privacy, deliberate overwrite and actual hosted restoration before release. No live schema or hosted change was performed.
* Publisher membership, source approval, media ownership/deletion, restricted cron, provider receipts and uncertain-outcome reconciliation remain unchanged production gates.
* PR #26 and its dependent unmerged draft chain remain a substantial integration risk. An eventual independently approved stacked integration review is mandatory; passing offline checks is not merge/release acceptance.

Security review focused on exact owner/business/customer/source/revision, role transitions, source removal, pending typing, duplicate clicks, unknown readback, and no-send/provider/financial boundaries. £0 external spending; no live operations. Next deep architecture review after approximately five further substantial sweeps, sooner if risk warrants.
