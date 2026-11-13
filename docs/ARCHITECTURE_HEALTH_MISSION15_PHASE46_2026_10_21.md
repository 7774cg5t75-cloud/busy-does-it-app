# Mission 15 Phase 46 architecture review

V22.41 Section 56 governs this sweep: shared business knowledge and Brand DNA, separate domain ownership. Original/private master content is excluded from Git; safe provenance is recorded separately.

## Actual responsibility extraction

The original `persistPrivateEnquiryReply` closure was selected after inspecting its complete captured dependencies and seven existing original-parent fixtures. It coherently mixed device checkpoint IO, full-snapshot freshness, serialisation, reply-field write/readback/reconciliation and exact customer acknowledgement into the central controller. Those are communications/recovery responsibilities, not Business Brain orchestration.

The controller closure is now five physical lines instead of fifteen, with zero awaits instead of two, no direct getItem/setItem, queue invocation or reply-copy algorithms. It passes a scoped cache key, a live context/role getter, the existing storage port and original customer setter to the specialist adapter. Acknowledgement still replaces only the original exact customer object; stale workspace/source/role/payload denies and delayed authority loss remains uncertain. Missing/unreadable context fails before IO. Original queue, reply field, encoded cache and readback remain authoritative. There is no new state owner, persistence engine, schema, account writer, provider or global ledger. No React hook moved or changed order.

Seven older fixtures now bind the real extracted adapter rather than duplicate or stub its implementation; their original behaviour assertions remain. A new boundary test additionally checks revoked roles while queued, no unauthorized IO, absent context and the actual original controller wrapper. Its initial expected status was corrected: after authority changes the inherited adapter returns unknown, even for a queued task which did no write. No production guard was relaxed.

## Preview and account responsibilities

Creator still owns one editable subject/body text and original draft record. `newsletterPreview.mjs` derives escaped HTML; `NewsletterPreview` owns only width and manual-copy visibility. Brand colour is finite validated hexadecimal and used decoratively; readable system typography and high-contrast text are conservative email fallbacks. No arbitrary CSS, HTML execution, remote media, auto-linked URLs or tracking. Native WebView disables scripts/storage/file access/data detectors and rejects navigation; web iframe uses an empty sandbox and no referrer. Actual native/browser behaviour still requires later acceptance.

`NewsletterAccountReadback` owns only transient read evidence, not draft state or writes. It uses the original authenticated snapshot reader through an explicit controller adapter which checks live business/scope/role; `inspectNewsletterAccount` compares the exact canonical saved record. Missing, different, duplicate, foreign and unknown outcomes remain distinct. Current edits/source review/device evidence are separate. This check neither retries a save nor restores or publishes content. No social-provider status is used as newsletter persistence evidence.

Newsletter-only exact whitespace comparison repairs save/dirty/reopen consistency; ordinary social normalisation stays intact. Brand DNA and source projections supply context rather than owning account writes or communication authority.

## Concrete before and after observations

Phase 45: 1,385 source files, 154,263 physical lines, 2,776 relative-import edges, zero detected static cycles; AppController 18,190 lines, 94 static relative outbound modules.

Phase 46 frozen functional tree: 1,394 source files, 154,422 physical lines, 2,804 edges, zero detected static cycles; AppController 18,189 lines, 94 outbound modules. New readback composition offsets most extracted controller lines: this is responsibility separation, not a claim of a dramatic size or fan-out reduction. The specialist persistence module is 26 physical lines, imports two existing core modules and owns no React state. New domain-specific presentation/read-evidence modules are not dependencies of unrelated builder/finance domains. Static metrics exclude dynamic/aliased imports and are not a runtime or quality proof.

## Remaining risks and gates

AppController, miniApps and other inherited controllers/hooks remain oversized; continue feature-led bounded extraction without speculative rewrite. Full-snapshot equality can be expensive; preservation here deliberately keeps the original semantics. The new manual HTML is a private document for review, not a campaign-ready email: images are retained in the original draft but omitted from preview, and system font fallback is used instead of loading external fonts. Real accessible scrolling, selection/export behaviour and mail-client rendering are unverified.

Snapshot readback proves only an observed exact original account record at its checked revision, not permanent durability, sync, immutable source history or delivery. Original membership/RLS/CAS, mixed-client field retention/revival, process-death recovery and cross-device concurrency remain staged acceptance requirements. Lost-save observations do not mint own-save receipts. Publisher membership, server-derived approval/revisions, media ownership/deletion, atomic mutations, restricted background authority and provider reconciliation remain separate trusted requirements; no exactly-once claim.

Keep PR26 and #25 → #24 → #23 → #21 open and unmerged. Current-branch offline tests do not prove eventual stacked integration. No live customer/provider/financial/schema/deployment operation; £0 external spending.

Final frozen functional selection: **296 passed, 0 failed, 0 blocked, 0 unexecuted; exit 0**. Eight final functional modules parse, exit0. Exact complete process outputs/exits and earlier corrected fixture evidence are in `MISSION15_PHASE46_CHECKS_2026_10_21.json`. Documentation-only changes follow functional freeze.
