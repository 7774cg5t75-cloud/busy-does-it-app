# Architecture health — Mission 3, 15 October 2026

This review follows six functional sweeps, supplied Master V22.18 and the permanent architecture policy. It is not production approval.

## Corrected boundaries and maintainability

- Studio remains one planner, one lifecycle and one original CAS save service. SecureStore continuity is a thin bounded adapter, not another authoritative draft database. Native writes serialize per actor/business/app across remounts; submitting markers precede network writes; recovered ambiguity never triggers replay.
- Website locks now live in one dependency-free worker module, imported by existing mutators, measured coach, recovery and final commit checks. Structured copy, voice fallbacks, collection/page/layout controls and shared-content handoffs do not each invent a lock policy.
- App rebuild/module operations reuse one shared pure composition/lock invariant; client and Edge copies are checked byte-for-byte. Five controller draft-write routes share the existing synchronous in-flight ref and original transport. Trusted existing-app writes now compare app/business/revision.
- Website Undo/Redo and recovery still use the original eight-entry state and domain rebuild; one scoped store/hook replaces unscoped arrays. Undo advances generation; account switches invalidate callbacks synchronously. Four repetitive controller commit blocks are removed.
- No new npm dependencies, schemas, provider adapters, public endpoints, billing systems or secondary Business Brain. New policy modules are leaves or depend on existing pure planners; no new import cycle is introduced. Offline preview packaging explicitly includes the shared website lock module.

## Size and coupling evidence

Compared with the Mission 3 starting tree (local 987139f9, remote 2254f637): AppController 18,264 → 18,272 lines (+8); MiniAppBuilder screen file 5,260 → 5,270 (+10); website screen 1,600 → 1,600. These files remain high-coupling maintenance risks. The implementation adds tested modules rather than expanding their mixed responsibilities substantially. The pure Studio lifecycle is 117 lines, with separate thin hooks/checkpoint adapter.

Largest tracked source files at review: AppController 18,272; miniApps 5,270; Edge mini-app index 4,569; work screen 4,239; customers 1,986; runtime 1,641. Do not interpret line counts or a passing graph as user-journey proof.

## Deferred risks and next review targets

1. **High impact: rollout compatibility.** Revised client/server commands require paired staging validation before deployment. Existing clients lacking app/revision arguments fail closed on rebuild/module mutations. No rollout occurred.
2. **High impact: historical asynchronous controller paths.** Five draft-write routes are guarded, but media backup, hosted visual review and several older voice/account workflows remain large and require separate live-scope audits. No blanket tenant-security certification is claimed.
3. **Medium impact: device persistence.** SecureStore capacity and platform/unlock behaviour vary. Storage failures block Studio submission and never fall back to plaintext. Device process-death, restart and large-batch UX need actual tests. Checkpoints expire after seven days; undo is available only at its exact current revision.
4. **Medium impact: approved fact refresh.** An explicit app rebuild refreshes public facts, preserves design/plan settings and rejects locked changes. It is not a field-by-field merge UI for unlocked older Studio copy. A future conflict-aware facts reconciliation should reuse existing provenance.
5. **Medium impact: lock UX.** Policy enforcement is much broader, but comprehensive lock/unlock controls and every historical regeneration/provider path are not finished. Global changes affecting locked sections fail conservatively.
6. **Release evidence:** no hosted RLS/CAS concurrency, browser/physical-device acceptance, live customer journey, push/provider result or deployment was exercised. Nine inherited scripts cannot launch child processes because of sandbox EPERM. Source-marker tests were updated to actual extracted transports/RPC guards; runtime and safety coverage remained enabled.

Next architecture review should extract the related private App transport/rebuild controller group and remaining website async scope handling, while retaining existing APIs and proving actual device behaviour in separately approved isolated staging. Do not mass-refactor the controller or replace either builder engine.
