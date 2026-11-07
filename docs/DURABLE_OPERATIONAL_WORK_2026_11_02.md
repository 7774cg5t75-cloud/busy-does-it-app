# Durable private operational Apps and connected Work — 2 November2026

Source-development implementation only. No hosted SQL/Auth installation, activation, real customer access/submission/communication, job acceptance, invoice/payment, provider/model call, publication, signing, OTA, spending or merge occurred. All five dependent PRs remain draft/open with their original bases.

## Verified source and authority

Starting remote head `0e2c78b6dae220ceb37cfc7f02ea3129e8f2be94`, tree `a078653c30292c544a56e84e98385a969a3143ee`, matched the previous report. Prior functional `946d66f7a5462e3cdd7f4b4d5ce3e101914eb0f1`, tree `4e9f98bc8f968973e7017a74d2bbf88579e6152b`, remains an ancestor. The local detached metadata equivalent of the starting report was `e93b801b58eff1ee44d59e806b373a4a90864383`, with the identical starting tree. Publication uses non-force, expected-head updates and tree equality, preserving the existing remote ancestry rather than substituting local metadata SHAs.

Final functional source `6d2b21bdbcb6eec5b7d09cd63f503ca461a2f4a6`, tree `3eacfc201d5dbaaf9026f82cdeb00f3eb170fe4b`; local equivalent `90258f73762e003e011c6e871f7838ea96d16bfc` has the same tree. The final report is an additive documentation-only child; its exact commit/tree is supplied in the delivery, avoiding a self-referential hash inside its own bytes.

The genuine private owner-supplied Master22.73 was reopened and its original bytes verified against SHA256 `23793f82b471328bdd216897c212999a430652e19228fcb221a8ee16a7ddc272`. Relevant App/Work/customer, privacy, security, cost, continuity and simplicity requirements were reviewed alongside root instructions, architecture and original authorities. Complete bytes/extraction remain outside Git. No general historical audit was restarted. Supabase current functions documentation was checked; the changelog HTTP fetch failed because the sandbox proxy was unavailable, and that failed access was not represented as a successful documentation check.

## What now works

The original owner Studio can deliberately save a private operational view against an exact eligible preparation, independently read it back, close/reopen the project, and reconnect to current original Work progress. The owner chooses a supported existing business-information, service or contact screen as the private placement. Placement never enters customer `draft_config`, HTML or standalone configuration. One placement per App is supported within the original owner Studio; independently distributed owner-app runtime, additional placements and general owner dashboards are not implemented.

The view shows the private plan's current stage, outstanding tasks, checked tasks and counts. A route opens the original Work editor; changes still require original review, Work CAS and independent readback. Returning/refreshing reads current progress, not a checklist copied into App storage. Removing a placement retains the underlying plan, customer/enquiry/quote and history. A changed App/source, unavailable preparation or revoked membership refuses the view or requires renewed review; no similarly named source is substituted.

The original Work entry now includes “Here’s what needs doing”: a bounded, paged overview of started preparations. Rows identify the original enquiry or Prepared-quote source, source-current/changed/unavailable state, owner-approved plan title/current stage, outstanding/checked counts, and an exact route back to original Work. Up to20 records are inspected per page, with explicit next-page navigation. Finite “Which equipment tasks are outstanding?” filtering uses approved stage/task wording in the returned authorised page. It does not infer identities or perform writes. The original finite Work editor retains add/remove/reorder/check corrections and approvals. Ambiguous or consequential instructions remain unavailable rather than being guessed into automation.

The existing six Home areas, one assistant, Premium Midnight identity, original quote/forms/builders and financial/customer gates are preserved. This implementation does not turn the Work overview into a confirmed-job board.

## Original authorities and storage

`business_work_engagements` remains the original quote-only authority, including its immutable kind/status and private Prepared-quote lifecycle. Enquiry-first plans remain in the previous finite `busy_work_private.enquiry_preparations` child. The original authenticated filed-source reviewer, exact Customer association, Work readers/writers, five-entry Undo, source-review and duplicate-progress wrapper remain authoritative.

The original `busy_app_function_private` authority gains narrow `operational_heads` / immutable `operational_versions` records. These carry exact owner/business/App, App revision, private screen identity, source discriminant, customer/enquiry or quote ID/revision, immutable preparation identity, reviewed plan/source revision and source hashes, approval actor/request UUID and creation time. They store references and review evidence, not another Work plan or a generic JSON/CRM database. Private placement versions are bounded at32, consistent with the existing finite private-screen pattern. No silent history or nonce recycling is implemented.

New `busy_private_operational_v1` operations are only read/save/remove/check. The original finite App-owner reader checks current creator/membership/App revision; separately reviewed screen eligibility, exact source scope, source hashes, plan/source revisions and placement CAS are enforced in SQL. Transactional locks and original Work functions recheck source applicability. A new placement requires explicit owner approval of an exact observed proposal and an independently read-back operation receipt. Lost acknowledgements remain uncertain; the session cannot silently retry. Inspection is an observation, never a reconstructed own-operation receipt.

`busy_work_preparation_candidates_v1` returns bounded source identities to the trusted service, not raw tables to clients. Every displayed row then passes the original authenticated user-JWT source review and existing finite preparation reader. A final membership/snapshot/collection check refuses a mixed changed page. The service returns original source-grounded context and bounded summaries. Revoked or unavailable sources cannot disclose plan content through this collection.

The original owner `busy-mini-apps` route requires verified identity/current owner membership before the new adapter. `BUSY_PRIVATE_OPERATIONAL_APP_ENABLED` is absent/off by default and requires the existing private Work/enquiry gates too. A separate closed SQL setting and review-fused installation provide independent denial. Private tables have RLS and no raw grants even for service_role; public finite routines have protected search paths, explicit owners and service-only execution. No guest dispatcher/public submission authority is widened.

Installation and retaining rollback are separately reviewable proposals, tested only in owned disposable no-TCP PostgreSQL. Rollback closes/revokes the new interfaces while retaining all App versions, request identities, Work plans and historical source evidence. No hosted installation or migration was performed.

## Quote continuity and review

An enquiry-first plan remains the one mutable progress owner if an original quote is later prepared for the same exact enquiry. The original quote continuation and duplicate-progress denial still apply; no second checklist is copied. Quote-only plans also support private operational placement using exact original quote/source revisions.

A changed quote is not fresh approval of its older private preparation. The new server and SQL adapter refuse operational selection while original `needsReview` is true. The original quote editor must deliberately review/save that plan against the newer quote revision before a successor placement is accepted. Old bindings become unavailable; they do not silently follow new quote terms. The existing owner quote-reader return contract is preserved: the additional original source context needed by the new adapter is captured internally, not added to the existing quote projection/UI path.

## Three actual component/SQL journeys

All businesses, customers and Auth identities are synthetic. Original form/request → Inbox → Customer filing and source-review fixtures supply real original persisted enquiries. Native boundaries use original component bodies with inert React/native fixtures, not rendered pixels or physical-device acceptance.

| Business | Exercised behaviour |
|---|---|
| Catering | Original filed catering enquiry and reviewed private preparation; actual Studio operational/overview components select the authorised source, review/save placement, independently reopen from a fresh session, check another task through original Work, and reopen the same placement with newer progress. No festival booking, food order or acceptance. |
| Gardening | Original service enquiry and distinct materials/equipment preparation; saved/reopened private view and overview. A later original Prepared quote references the same enquiry plan. Original quote-side competing plan is refused; no binding job or material purchase. |
| Creative project | Original project brief and separate private sequence; saved/reopened placement, deliberate lost save acknowledgement with one write/no replay, and changed original source. Old view/actions are refused until explicit original source review and fresh placement approval. No publishing/provider action. |

An independently cloned, eligible original source also exercises original quote-only preparation → private placement → quote revision change → refusal → original Work reapproval → successor placement. The original12-stage quote-only suite remains unchanged and runs separately. Foreign business/owner/source/App, public/raw access, stale callbacks/App versions, placement CAS, membership revocation, binding removal, exhausted nonce reads and retaining rollback are tested. Original enquiry suite retains true simultaneous checklist-write/CAS and Undo tests; no duplicate mutable progress or business action is introduced.

## Observed failures and corrections

First CI run [41475755705](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41475755705), source `e506d63e25a261f5f47c6e72784543ccb4611ec0` / tree `8441b6b837a2048b291b1214c960f8bafece9bd0`, exited1 at the database stage (underlying psql exit3). Ten new stages passed before a quote-only positive fixture used a deliberately withdrawn original retail listing. The original writer correctly refused “Listing changed; review original source”. That denial is retained as an explicit negative counterexample. The positive case now uses an independently cloned eligible original service source; the listing guard was not removed or relaxed.

The fixture correction `5a63129cc656f21d7e586c545fc7821365fa4599` / tree `4f81c31c1fa90f3962a02b909f91ef099b485f25` and subsequent fresh-quote review fix `c9a35c4044fd065448a1116995f25f595b8a7e88` / tree `4f9f8f778ab63939cd5b8b5d1c317daf3623170a` remain ancestors. Runs [41480780022](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41480780022) and [41481138298](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41481138298) exited1 in the pre-existing quote-only component suite after the new operational tests. Adding `filedSource` to its normal reader response activated a formerly unselected component dependency (“AppEnquirySourceContext is not defined”). The final fix scopes that source context internally to the operational adapter and restores the original reader contract; no old assertion was deleted, skipped or weakened. Those unsuccessful runs did not execute the complete final application selection or unsigned exports and are not counted as passes.

Local PostgreSQL process startup exited1: the sandbox denies TCP and private Unix sockets, including a correctly no-TCP attempt. No hosted/TCP workaround was used. One sandbox-enabled Playwright launch exited1 because the Chromium executable was absent. No browser download, repeated bypass attempt, mockup or actual native screenshot is claimed. Original syntax/core,105 foundation, security baseline/by-design, dependency guard and architecture checks passed locally; the import census reported zero static relative-import cycles, not comprehensive runtime architecture assurance.

## Frozen verification

[Final primary run41481545782](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41481545782) succeeded on the exact final functional SHA/tree above. Downloaded artifact13162315146 was SHA256-verified against GitHub digest `6c647abe95b7496614397ddf68bb90f0528bca831ba62501cea851d7844ffd8d` before inspecting the results. The application report records identical initial/final functional commit and tree, `sourceStable:true`, and empty initial/final working-tree entries.

| Verification | Observed result / process exit |
|---|---|
| Complete application selection |479 passed;0 failed, blocked or unexecuted. Every child exit0; runner exit0 |
| Original disposable PostgreSQL |99/99 stages; exit0 |
| Original public-form/customer lifecycle PostgreSQL |21/21; exit0 |
| Original enquiry-first Work PostgreSQL |13/13; exit0 |
| New durable operational App/Work PostgreSQL |13/13; exit0 |
| Original quote-only preparation PostgreSQL |12/12; exit0 |
| Foundation |105 assertions; exit0 |
| Original Edge/Deno |25 entries genuinely checked; exit0 |
| Source syntax, architecture, security baseline/by-design, dependency guards |exit0; baseline974 source files/557 locked nodes, not a registry vulnerability audit |
| Unsigned Owner Preview iOS/Hermes export |1,544 modules; exit0 |
| Unsigned isolated-staging iOS/Hermes export |1,603 modules; exit0 |

The158 PostgreSQL stages are local transaction/component evidence, not independent hosted-security certifications or complete code coverage. Autolinking includes Expo Crypto57.0.4 and Secure Store57.0.4; exports/autolinking are not physical-device acceptance. No package/lock change or new registry vulnerability audit was performed; the previously recorded31 low affected deepmerge nodes remain an upstream finding with the reviewed actual-entry backport/guard preserved, not a clean-audit claim.

All six restored workflows independently succeeded on the SAME functional SHA: [Growth3.63](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41481558416), [Growth3.65](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41481557990), [Workspace3.64](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41481558279), [Voice3.66](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41481557673), [Founder3.69](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41481557918), [Platform3.70](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41481558045). This is observed functional-source CI, not a claim that every unrelated/latest PR or release gate is green.

The companion checks JSON retains all479 child commands/status/exit codes, actual PostgreSQL stage results, failed/superseded source checkpoints and local blocked attempts. No assertion was removed or weakened to obtain these passes.

## Limits and next development

Source-level private development may continue. This is durable private preparation and App placement, not an activated customer/operational job service. The underlying eight-stage/twelve-task limits and512 lifetime write-nonce cap/five Undo snapshots remain. Exhaustion denies further saves, Undo and source-review while retaining current reads/evidence. A generation proposal requires immutable archived generations, generation-bound receipts/nonces and one CAS-controlled active successor; it is documented, not implemented. Thirty-two immutable App placement versions are a separate finite cap; further changes/removal at that cap refuse writes while retained reads remain. Long-running production use must address archival/retention explicitly, not quietly recycle identities.

The next substantial progression is a separately reviewed original canonical job authority, based on the exact original enquiry/quote and independently verified acceptance where applicable, with explicit owner approval, finite statuses, CAS, idempotent transition receipts, unknown-outcome recovery and separate completion evidence. The current lifecycle summary truthfully marks customer acceptance/job/completion/financial action as unestablished/unavailable. The precise proposal in `OPERATIONAL_WORK_LIFECYCLE_PROPOSAL.md` does not enable any transition. Staff access, customer communication, booking, invoicing/payment and providers require their existing distinct approved authorities; checklist completion grants none.

Remaining gates: hosted schema/JWT/PostgREST/RLS/storage and rollback acceptance, genuine native/browser UX and accessibility, long-running archival/retention/erasure, appropriate independent assurance, operational monitoring and separate activation/release approval. No owner manual-device testing is required during this source mission. Existing protected customer recovery, public form/publication gates, native crypto/SecureStore, guarded dependency installation/deepmerge mitigation and central AI spend admission remain intact.
