# Mission 4 independent integration review

Verified GitHub: latest numbered branch v3.240; draft PR #10 open/unmerged/mergeable at 91ca01a343090640b016f8514c5fff602f1ae522, preserving the fourteen reported prior sweeps and seventeen commits. Actual PR patch and local source were inspected. Local start 82086b71 is the exact previously verified remote tree. Preflight rechecked supplied complete Word Product Master V22.18 (especially sections 33, 40, 43–44 and 52–53), current ARCHITECTURE.md, permanent policy and prior test evidence. Product intent remains distinct from implementation/hosted proof.

## Reproduced defects and corrections

Five regression cases were observed failing before correction:

1. An uncertain undo could be re-enabled by prepare(null), used when clearing a preview. Any ambiguous save/undo now removes the retained inverse; clearing preview cannot revive it. A fresh successful receipt is required to obtain new undo authority.
2. A business_profile lock did not block Studio introduction copy. The existing shared policy now maps public text to its owning profile, and tagline to its header.
3. A copy lock did not protect service wording or photo accessibility text. The same client/Edge policy covers these content routes; image reordering remains a separate constraint.
4. Trusted setModule accepted a missing enabled decision as false. The original endpoint now requires an explicit boolean consistent with the requested action, before any update.
5. First-plan application could adopt an app created concurrently through ensureApp and then overwrite it with an unreviewed first plan. The original helper now supports requireNew; both pre-existing and unique-conflict rows fail closed in that path. Existing-app mutation still requires reviewed app/revision and CAS. No new endpoint/migration or first-app engine is introduced.

New tests exercise the actual lifecycle and transpiled trusted module/creation helpers with injected dependencies. Client/Edge locks remain byte-identical. No live database, customer record, provider or paid build was used. Supabase skill was consulted for Edge/security review; no SDK/schema feature or authentication policy was changed.

## Nine previously blocked checks

Independent baseline reproduced **97 passed / nine child-process EPERM blocks** across the recorded 106 scripts. The blocked portions only ran local source-hashing/acceptance packet generators. Their dependency closure (seven preparation modules) was inspected: filesystem hashing/writes, no network or SQL execution. Nine tests and four recursively spawning preparation modules now compose the same modules through awaited ESM imports. All original assertions remain; no subprocess is faked and no security restriction is changed.

The resulting complete **107-script review suite passed** before the final fifth review correction; affected regression and native/Edge parser checks also pass after that correction. Exact final results will be recorded with the mission verification manifest. Passing packet generation is not staging installation, real JWT/RLS, customer journey or provider verification. All acceptance flags remain false.

## Review scope and remaining limits

Reviewed exact proposal/receipt binding, encrypted checkpoint queuing/restoration, owner locks, client/server parity, module/rebuild CAS, first-plan creation, website scoped history and monotonic recovery, measured previews, and existing marketplace/standalone handoff coverage. Existing native syntax and dependency checks pass. This is a serious source/offline integration review, not a blanket security certification. Device SecureStore capacities, browser/native lifecycle, hosted auth and real concurrency remain unverified.

Keep PR #10 draft and unmerged. Review corrections belong on its existing branch; subsequent functional work uses a separate dependent branch/PR for readability. £0 additional spend; no deployment, publication, production data access, database execution or paid service.
