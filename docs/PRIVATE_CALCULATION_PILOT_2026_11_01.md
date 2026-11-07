# Mission15 — first finite bespoke-functionality pilot

1 November2026. Offline/private source development only.

## Exact source and authority

Starting GitHub `587b1472bb2e750d05d30d8d5199e8abbc85777a`, tree `5025d2c20bd9f67fa2d6874a5d70a60cd33969b6`; clean equivalent local recovery `7580b73cc869573581ef6a3e790d5e0d61bad215`. Prior typed-screen functional3238eba/treee821ffd preserved. Existing worktrees and draft dependencies remain intact.

Implementation GitHub `a6d3cbf48115891eb83c3d27eff9399c90169cc1`, tree `a6305587d1421313412c72ae6b1f03a8b6c00945`; final functional `efa5204c0274fb7b13c573a8fee309aa8697befd`, tree `c0027ed5b6955580c023a6cffc36e8b94399fcd6`. Equivalent local final `a5e372bcafd9f408cb0754766256fdb6c68d2787`. Exact tree identity checked before each additive GitHub reference update. Final report is a later documentation-only commit.

The newly supplied genuine MasterV22.73 supersedes22.72: original SHA256 `23793f82b471328bdd216897c212999a430652e19228fcb221a8ee16a7ddc272`,2,904 paragraphs/19 tables, cover dated1 November2026. Original opened; relevant security, continuity, builder/cost requirements and added Section83 quality requirements reviewed. Original and extraction retained with private permissions outside Git. Section83 website quality work does not authorise provider activity or divert this calculation mission.

## What works

The original App goal editor now hosts a clearly labelled private calculation experiment, visible only in Owner Preview/isolated-staging modes and default-denied at its component entry. This is a discoverability gate, not an authentication or security substitute. Actual interpreter capabilities are structurally restricted regardless of UI mode. No Home tile, second assistant, public runtime, service endpoint or independent project database was added.

The owner describes a supported calculation, sees its input fields, units/ranges and human-readable rules, checks fictional expected examples, deliberately accepts for this session, changes test values and recalculates. Invalid input keeps the entered wording/values and removes the result. Rule changes require a new review. The materials variant can omit the extra-allowance input/rule, changing the actual expression graph and expected result. Discard, stale context and uncertain acceptance cannot silently reuse a ticket. Source changes hide stale output while keeping local test values.

Known goal adapters prepare portions or area/coverage rules; this is finite intent recognition, not general semantic intelligence. The interpreter itself is generic over the finite validated language: a separate numeric comparison/conditional example executes a materially different rule without selecting a title/template handler. Unsupported staff tracking, permissions, live inventory, messaging and similar workflows are refused as calculations. Existing descriptive custom requirements remain unimplemented.

## Versioned rule contract and limits

`privateCalculation.mjs` accepts version1/kind private-calculation with exact owner/business/app/revision scope,1–8 typed inputs,1–8 typed outputs and1–4 expected examples. Numeric inputs have explicit units, reviewed bounds/defaults; boolean inputs have boolean defaults. Numeric outputs declare units and0–6 decimal precision; boolean outputs have strict boolean type. Units are reviewed labels, not automated dimensional checking or professional assurance.

Allowed expressions: numeric/boolean literals, declared input references, add/subtract/multiply/divide/min/max, ceil/abs, numeric comparisons, boolean and/or/not and typed if branches. No output-to-output references/cycles, arbitrary property access, functions, imports, extensions, tools or executable fields. Inputs/outputs have bounded distinct IDs and labels. Unknown fields and malformed structures fail validation.

Resource limits:16,384-character raw JSON entry, conservative16,384-byte data-tree budget,2,048 data nodes, bounded dense arrays, expression depth12,256 expression nodes/evaluation steps across outputs, maximum8 outputs and2,048-byte result payload. Human-readable formulas are capped at2,048 characters each. Numeric values/intermediate results are limited to ±1,000,000,000 units. Internal arithmetic uses six-decimal fixed-point BigInt values; multiplication/division round half away from zero at that precision, then outputs round at their declared precision. Division by zero, non-finite or out-of-range numbers, excessive precision and overflow fail with no partial output. If evaluates the selected branch; other operations evaluate their arguments eagerly.

This is a finite interpreter in the normal JavaScript process. No new OS process sandbox, hard process heap quota or hard wall-clock preemption is claimed. Bounded tree work, bounded integers (including multiplication intermediates), input parsing and output sizes constrain this interpreter's work/allocations. Constructing arbitrary hostile host-language objects before validation is outside that boundary; future external provider text must use the bounded JSON entry. There is no filesystem/process/network/database/secret/provider/tool bridge in the language. Codex's own sandbox is not evidence of a shipping isolation boundary.

## Independently specified examples

| Fictional calculation | Reviewed test inputs | Independent expected output | Actual |
|---|---|---|---|
| Catering portions |100 guests,1 serving/guest,0.6 rolls share|100 total,60 rolls,40 bowls|Matches|
| Catering rounding |31 guests,1.5 servings/guest,0.5 rolls share|47 total,24 rolls,23 bowls|Matches|
| Materials |10m ×4m,2.5m²/unit,0% extra|40m²,16 units|Matches|
| Materials with allowance |7.5m ×3.2m,2.5m²/unit,10% extra|24m²,11 units|Matches|
| Owner-selected rule without allowance |7.5m ×3.2m,2.5m²/unit; no extra-allowance input|24m²,10 units|Matches|
| Separate custom validation/conditional graph |30m ×5m; area>100m²; length>20m|needs_review=true,indicative visits=2|Matches|

The two businesses use independent owner/business/app contexts, different input structures, unit meanings, expression graphs and outputs. Expected values are explicit independent test constants, not copied from runtime outputs. Examples demonstrate arithmetic, not real stock, catering capacity, safety, engineering suitability, quotes or commitments. Both actual private UI component bodies execute review/accept/test/recalculate/error/discard through inert native primitives. This is source/component evidence, not pixels or genuine hosted Auth.

## Original authorities reused; nothing executable persisted

`privateCalculationPilot.mjs` uses opaque, one-use review tickets and private immutable rule copies. It checks the original current App context before/after review, approval and calculation; changed owner/business/app/revision/catalogue/task context, reported revocation, unknown tickets, duplicate acceptance, changed proposals, mismatch with expected examples, discarded and uncertain tickets deny execution. Returned review examples do not alias the immutable accepted specification. Local checks are not proof of real JWT/current server membership; no protected resource is granted by a local ticket.

Only the plain owner request can be appended to the ORIGINAL governed App requirements, via a module:null descriptive screen and workflow text. Its existing finite private save/history, current server member/creator checks, source CAS, independent readback and Undo remain the durable authority. Rules, numeric test data, approval tickets and results are session-only and never enter draft_config, a new table, local persistent storage or published runtime. A real disposable PostgreSQL stage saves/reopens/Undo's descriptive intent and verifies that adding executable fields to the original private specification is refused without changing its revision. No new schema, migration, RPC or grants are required.

Existing Website/App Studio/source records, Customer/Inbox/Work/Prepared quote lifecycles, owner corrections, source freshness, central budget controller and provider/action gates are unchanged. No paid inference/model adapter was activated. Future model proposals need independent bounded schema validation, original current scope and central spending admission; an AI proposal cannot approve itself.

## Verification

Final [CI41294983260](https://github.com/7774cg5t75-cloud/busy-does-it-app/actions/runs/41294983260), job124814011174: **465/465 application checks,70/70 genuine disposable PostgreSQL stages,105 foundation assertions,all25 genuine original Edge checks and both unsigned iOS/Hermes exports passed. All observed process/child exits0;0 blocked/unexecuted.** Beginning/end source commit `efa5204c0274fb7b13c573a8fee309aa8697befd` and tree `c0027ed5b6955580c023a6cffc36e8b94399fcd6` match, sourceStable true and workingTreeChanged false. Downloaded artifact13079820271 SHA256 `1236ea3504ce59929e571c4b63ef82b9359f67c24f20bc013f28b0e25bb73911` independently verified; every application child exit inspected. See adjacent CHECKS JSON.

Local focused pilot, original App project continuation/goal/record/private project regressions, affected syntax,105 foundation assertions, security baseline/security-by-design, guarded deepmerge backport and architecture checks pass exit0. Architecture:1,793 source files,170,986 physical lines,3,957 static relative edges,zero detected cycles. This is scoped feature verification, not another historical audit or independent certification.

Earlier source run41294857472 was cancelled for the development-only visibility gate:62 passed,0 failed,403 unexecuted in the application artifact, with70 PostgreSQL stages passed. It is incomplete, not final success. No new unexpected failing application test was observed locally. Browser launch exited1 before application capture under sandbox restrictions; one attempt, no unsafe fallback or generated imagery. No screenshots/recordings/native interaction acceptance claimed.

Dependency versions/locks unchanged; the reviewed install/backport guard passes. No fresh registry vulnerability audit is claimed. The previously recorded raw seven low affected nodes in one deepmerge family remain an upstream finding with a guarded local mitigation, not an upstream clean audit.

## Readiness and remaining work

Ready for further private development of finite calculators/validations, with the final observed tests above. Accepted rules are deliberately not restored across sessions; only descriptive requirements can be saved. Continue improving owner assumption/rule review and independently specified acceptance cases. Durable executable artifacts would require a separately reviewed immutable artifact/version/owner-acceptance contract, not reuse of a descriptive JSON column as permission.

The public HTML screen-composition compatibility gap remains unresolved. The legacy unselected check-app-builder-v3158 literal-wiring failure also remains unresolved, as documented in the preceding report; neither was falsely treated as fixed or suppressed in this mission. They are separate maintenance items before relevant activation, not reasons to introduce another general audit.

Any future generated-code runtime requires separately designed and demonstrably enforced OS/container/process isolation, no ambient secrets/host filesystem/network/database/tools, strict CPU/memory/time/output limits, immutable reviewed artifacts, independent tenant/operation permissions, cost admission, rollback/recovery and appropriate security assurance. This finite interpreter is not that runtime and does not authorise one. Finite form workflows or new reusable screens also require their own validated data/action contracts.

No hosted SQL/Auth/Edge changes, provider activity, real customer access/communication, publication, bookings, invoices/payments, EAS/signing/OTA/distribution, merges or external spending. PR26 and the existing draft dependency chain stay open. Home/orbs/six areas/build29 preserved. Hosted/JWT/RLS/storage, provider, native and independent release acceptance remain separate gates.


The report-only delivery commit is not represented as another full source run. Its parent functional SHA/tree above remain the exact tested implementation. All five draft PRs26/25/24/23/21 were independently rechecked open/draft/unmerged, with unchanged dependency heads.
