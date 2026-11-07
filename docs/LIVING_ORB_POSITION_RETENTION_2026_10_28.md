# Living BUSY light, retained floating placement and compact native Home — 28 October 2026

## Authority and exact source

The latest message did not contain new image attachments. The approved Home reference and earlier genuine iPhone images already in the conversation were inspected; the owner's build27 feedback is treated as genuine feedback, not a screenshot independently seen here. No new screenshots/mock-ups/capture infrastructure were produced.

Actual local start `1b13a24dd739e85167692ee9684f3b5f7ffdafd5`; independently read GitHub start `972985e2c46bcbd1b75b8ff47af3057e6bc09f6c`; same tree `c84698008b8f62085e8bf747061874b812968a82`, clean worktree. AGENTS, architecture and sweep policy were reviewed. Genuine private V22.53 Word was reopened,2,254 paragraphs, SHA-256 `fa9456077fd843f1f04ea450d9e2ec425077695b6b106b91bf7cee150b727f62`. Original/full extraction stays outside Git. Original six areas, privacy, quotation, owner/source and publishing boundaries remain.

Frozen local functional commit `6ea7af209f79c37494cc766cd7f0d648f8ef80df`; corresponding GitHub functional commit `0b658f9d4fa1317e4ccdddfb2f23354e54c6308a`; exact shared functional tree `7163fc5fc1669a7f10e9d8b06eb79e0b5e96c565`. Existing additive mirror histories are preserved. No reset/rebase/merge/force-push or dependency PR edit.

## Mini-orb: reproduced causes, correction and compatibility

Two independent failures reproduced against the original source, both exit1 with actual y540 versus expected y240 after a successful upward drag:

1. Only `orbEdge` was persisted. Vertical position lived in component refs; keyboard eligibility unmounts the component, navigation uses screen keys/new screen trees, and remount initialisation chose the bottom bound. Rerender alone with genuinely unchanged geometry was not the failure.
2. A fully obstructed placement called `settle(null)`, clearing the last actual point. When the obstruction cleared, the previous code used that empty last point as preference and chose the default bottom. This reproduces a same-screen return to default without navigation.

The new `orbY` is an optional finite0–1 field in the original `busy-device-appearance-v1` preference record. Existing v1 records migrate in the reader with bottom default1, preserving mode/edge/chosen. Invalid new writes are rejected; malformed/missing optional historic positions safely default without losing appearance. No raw coordinates, owner/business identity, tokens, media or other private state are stored. The original AsyncStorage authority and serialised write queue are reused; no server/database/store is added. Old readers tolerate the optional field; an old app writer can omit it, in which case current readers safely default to bottom rather than invent an old position.

`floatingIntent` captures the deliberately selected edge and normalised height. `preferredFloatingOrb` reprojects it into the current measured safe viewport. Automatic obstacle avoidance changes only the current safe slot; it never replaces intent. When space returns, the preferred slot is sought again. A fully unavailable view hides the orb. Layout changes, scrolling, keyboard-driven remounts, navigation and orientation recover from the preference rather than a cleared last point. Each release/accessibility move writes once; drag frames only update native x/y values. Relaunch restoration is verified with a fictional saved record and reconstructed module, not actual native storage certification; real persistence requires successful original device storage writes. Original unconfirmed-write feedback remains available in Appearance.

Existing48-point geometry,9-point tap/drag threshold, two-axis native tracking,200ms safe-edge snap, overview allowlist, safe areas, keyboard/scroll hiding, protected-control measurement and VoiceOver movement/reset/dismiss remain. Reset restores right/bottom. Cancelled gestures return to retained intent without saving a new preference. Measurement invalidation during a drag retains the no-tap flag; a fresh deliberate touch or accessibility action is needed before voice can activate. Existing scope/layout/native-callback guards remain. The old full-width rail remains absent.

## Main orb: perceptible local light instead of stronger global pulsing

The prior idle clock mostly changed the entire halo by1.8% scale and about12 opacity points over7.2 seconds, leaving relative hotspots nearly stationary. This explains the limited source-level optical variation; it is not a measured physical perceptibility threshold.

Preserving the same geometry, colours, dark Midnight core, ring, arcs, microphone and connected constellation, Home now has one additional concentrated-light SVG layer. Feathered cyan/electric-blue and magenta/violet hotspots modulate between opacity.25 and.88 and drift5 points horizontally/3 vertically over the original slow cycle. This changes relative light distribution rather than making the whole ring uniformly brighter. It uses the existing native Animated value and loop: no new animation clock, JS-frame renderer, interval, provider call, dependency or blur library.

The local drifting layer is idle/Home-only; the mini-orb/dock remain restrained. Genuine listening, processing, speaking, error and review labels/treatments remain derived from original state. Idle optics disappear for actual active/error states rather than pretending to process. Unknown Reduce Motion status, Reduced Motion and inactive/background state use an attractive static light opacity.62 with zero translation; the original policy stops/cleans the native animation and observers. Main halo breathing remains. Constellation nodes themselves remain static; no twinkle or performance measurement is claimed.

## Home composition and shared chrome

- Owner Preview's existing offline indicator is integrated beside the Home wordmark. Its short visible label is `PREVIEW · OFFLINE ⓘ`; the full accessible label and original explanation still state fictional data/no sends/publishing/bookings/account saves. Non-Home screens retain the original outer indicator. Production/staging do not get a fictional preview label. AppController changes only this Home notice placement condition; authentication/seed/transport authorities are untouched.
- Removed excess Home top padding and tightened greeting/helper/composer spacing. Greeting18/24, helper12/17; original wording and scope-bound text/send/voice routes remain. The ordinary-phone orb remains approximately199 points, never the old132-point presentation. Hero containment still exceeds the maximum active halo scale, with a smaller measured gap rather than overlap.
- Six original cards retain adaptive two-column/single-column behaviour and genuine actions. Minimum height64, padding7, gap6; title11.5/15 at weight600 and shorter supported descriptions reduce unnecessary wrapping. Text grows naturally: no fixed height, truncation or disabled scaling. Stronger Midnight cyan, violet, orange, pink, blue and green strokes plus concentrated icon glow distinguish the tools. Daylight retains its contrast-aware original accent tokens.
- Bottom navigation remains Home/Work/real assistant/Results/Settings. Central visible caption becomes `Talk`, while its button retains `Talk to BUSY` as the accessible name and original voice route. Its48-point action remains. Dock minimum64 and smaller inner spacing reduce wrapping pressure; it can still grow with accessibility text. Original outer SafeArea is retained.
- Existing compact recorded-value summary, Results/Work dashboards, real data selectors, guarded Get Paid explanation and original results/navigation actions remain. No income, traffic, demand, customer or success metrics are invented. Shared dock/header changes carry into existing screens; no broad specialist redesign or customer-owned design recolouring.

These changes reduce the nominal vertical budget, targeting all six cards and the beginning of the summary at ordinary phone text sizing. Actual iPhone fit at the owner's settings remains unverified; source dimensions do not prove rendered line heights or visual quality. Larger text continues to wrap/stack/scroll.

## Verification

- Full applicable application selection: **431/431 passed**, zero failed/blocked/unexecuted. Every child exit0; actual outer runner exit0. Start/end frozen local commit/tree match those above, both worktree entry lists empty. Both new actual-component regression scripts are included in the full selection.
- Foundation105/105 exit0; syntax13 changed source/check files exit0; architecture exit0 with zero detected static relative-import cycles; pinned test health exit0.
- Actual component tests cover unchanged-layout drag retention, reconstructed mini-orb, temporary full obstruction/scroll hiding and recovery, orientation/navigation reprojection, fresh saved preference module, v1 default migration, invalid positioning denial and layout-during-drag no-tap protection. Existing tests retain two-axis tracking, safe snapping, stale account/measurement callbacks, keyboard/sensitive-screen eligibility, VoiceOver reset/movement and no-rail assertions.
- Native-clock tests cover concentrated light opacity/translation, one original loop per orb, static unknown/Reduced Motion/background fallback, truthful active/error states, observer cleanup, preview-only inline indicator, full restrictions, original assistant route, adaptive cards and both palettes. Original automatic-appearance, source, builder, Creator, privacy, approval and Phase52 regressions remain passing.
- Expo SDK dependency validation exit0 (offline mode), config introspection exit0 and actual local iOS/Hermes export exit0:1465 modules,7.8MB HBC. Original bundle/profile/build27/OTA-disabled identity independently observed in local config output. No signed build acceptance is inferred.
- Separate Snack check remains exit1 with the same27 distinct missing-import diagnostics. The ordered diagnostic list is unchanged from the prior mission; historical81 was repeated output. It is not a pass, and no capture/preview infrastructure was restarted.

Raw logs, exact exits and artifact hashes are retained under `.test-artifacts/living-orb-retention/` and indexed in the companion CHECKS.

Original negative assertions and10-second VM limits remain. Retained failing logs include remount and temporary-obstruction counterexamples against the actual original source. A detached original-source worktree was used for the second counterexample; no active history/source was replaced. Previous mission failures remain retained separately.

No SQL, backend security or database contract changed, so no fresh PostgreSQL acceptance is claimed. AsyncStorage/Auth/native components in deterministic tests are inert boundaries, not device/JWT/PostgREST/provider evidence.

## Build readiness and remaining native assessment

No EAS build, OTA, distribution, App Store action, certificate/provisioning change, hosted operation or external spending. Prepared source remains3.105.0/build27 with `com.busydoesit.app.ownerpreview`, `owner-preview`, internal distribution and OTA disabled; production build25 unchanged. The owner reports build27 installed; Expo build history was not queried or invented here.

For the next separately authorised consolidated build: independently inspect Expo account/project/build history, choose the next unused iOS build number above the installed27, checkpoint that approved configuration, use the existing owner-preview GitHub/EAS route and original signing identity. The equivalent profile command is `eas build --platform ios --profile owner-preview`, only after explicit owner approval and account/history checks. Verify the actual signed artifact before providing any genuine installation link. No signed binary for this source exists now.

Physical review should confirm light visibility/comfort, finger tracking and retained placement through real keyboard/navigation/relaunch, safe obstruction handling, first-screen density under actual text settings and dock touch behaviour. Native smoothness, battery cost, pixel fidelity and guaranteed avoidance of every control are not claimed. Remaining specialist-screen refinement should follow actual feedback; their calm layouts and working finite editors were preserved.

## Next phase: Connected Business Workflows

Ready to move into isolated-staging preparation/source integration, not already connected hosted acceptance. Required dependencies remain: separately approved isolated project/provisioning and spending; genuine owner authentication/JWT/PostgREST and business/creator membership; reviewed finite schema/RPC versions with abort fuses/retaining rollback; original Website/App Builder save/readback/CAS and independent account reopening; exact request/Inbox/customer/CRM/Work identities with idempotency/receipts; source/media permissions, retention/erasure policy and tenant-denial tests. The original publisher business/workspace entitlement boundary remains closed. No email/name matching, broad snapshots, generic writer or prototype identity should replace those authorities.

Codex can prepare and automate local/staging checks once the relevant environment and explicit hosted permissions exist. This mission neither provisions that infrastructure nor claims real connected customer completion.
