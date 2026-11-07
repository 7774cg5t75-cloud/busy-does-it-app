# Revised creative-pilot testing budget — proposal only

7 November 2026. This replaces the **proposed** £0.10 experiment ceiling in the earlier D packet. It is neither spending approval nor runtime configuration. No provider/account/counting request, credential access, activation, hosted write, deployment or publication is authorised. The frozen C inventory and all original SQL/receipts remain unchanged.

## Proposed approval scopes

| Separate decision | Maximum all-in exposure | Bounded scope |
| --- | ---: | --- |
| First Astra experiment | **£1** | One exact `gpt-6-astra` request, after account, tariff, token, source and central-admission verification |
| Initial Sol-versus-Astra comparison | **£3 cumulative** | At most two inference requests total: one Astra and one `gpt-6.1-sol`, each separately exact-run approved; includes the first Astra experiment |

These are ceilings, not spending targets or an allowance to use up. **The proposal is not £1 plus another £3.** Reuse the first Astra result as that comparison arm when its exact source, renderer, schema, goal, reasoning setting and token bounds match. An invalid/incomplete/inferior paid Astra result consumes its one attempt and remains evidence; no replacement call is implied. Unallocated funds do not authorise retries, fallback, correction calls or additional generations. A changed comparison needs a fresh reviewed scope, with earlier cost/liability retained.

No separate Sol per-request execution ceiling is assigned yet. Its exact approval must name the independently calculated maximum for the final request; that maximum plus all Astra cost/liability must fit the £3 aggregate. Do not authorise the entire remaining aggregate as a spending target. Concurrent limit1; tools0, retries0, fallback0, automatic saves0, publication0.

The two-request limit refers to **inference**. Any account-metadata or token-count requests need their own enumerated, bounded authority; they are not implicitly allowed by this budget proposal. Include any verified cost of those preflights within the same all-in ceiling rather than assuming they are free. None was sent in this mission.

## Verified public model and price evidence

Public documents were rechecked at16:32–16:35UTC. The official catalogue lists `gpt-6-astra` and `gpt-6.1-sol`, Responses/Structured Outputs,1,050,000context and128,000maximum output tokens. API Free tier is unsupported; this has no bearing on the Lab's Supabase Free plan. **Busy's actual provider-account/project grant, tier, endpoint permissions, rate limits and billing eligibility remain unverified.** This environment has no provider credential binding or authenticated account-metadata route; no secret was accessed or key requested. Public catalogue availability and earlier owner-reported credits are not account acceptance. [Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), [Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

Published Standard short-context USD per million tokens:

| Model | Input | Output | Cached input | 30m cache write | 12h cache write |
| --- | ---: | ---: | ---: | ---: | ---: |
| Astra | $10 | $50 | $1 | $12.50 | $25 |
| Sol | $2 | $10 | $0.10 | $2.50 | $5 |

Regional processing adds10%. The proposed route remains global Standard without requested caching; no cache discount, Fast/Ultrafast substitution or regional change is assumed. A conservative planning scenario below nevertheless covers the highest listed cache-write input rate and regional uplift. [Official pricing](https://developers.openai.com/api/docs/pricing).

The newer successfully retrieved official FX table is **ECB6November2026**: EUR/USD1.1165 and EUR/GBP0.83415, giving derived **£1=$1.33848828148**. This supersedes the earlier5November BoE reference for this calculation. ECB reference rates are not transaction rates; account invoice/card conversion and fees are still unknown. [ECB table](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html).

UK standard VAT is20%. Actual supplier VAT, reverse-charge treatment, billing entity/country, tax registration and any already-paid tax attributable to credits must be verified securely. Do not infer tax treatment from Ireland hosting or assume exemption; avoid counting prepaid tax twice. [GOV.UK rates](https://www.gov.uk/vat-rates), [overseas services](https://www.gov.uk/vat-on-services-from-abroad), [OpenAI billing/tax guidance](https://help.openai.com/en/articles/9038389-updating-billing-information-tax-id-and-vat-id).

## Token and cost planning envelope

Evaluate **up to8,000 complete input tokens and12,000 total output tokens per model** as the initial quality-oriented candidate. This is a proposed engineering bound, not an implemented or counted request. Select and record the same explicit reasoning setting for both arms in the final packet; a shared setting does not guarantee equal internal computation. Do not silently alter reasoning or omit source/schema to fit.

The illustrations use all input at the highest12h cache-write rate,10% regional uplift,20% VAT and an **assumed3% FX fee**, with no fixed charge. These are deliberately labelled assumptions, not verified account charges or an all-in admission guarantee. Decimal calculations are rounded upward per operation:

| Complete input / total output | Astra ordinary USD | Astra planning GBP | Sol planning GBP | Sum of rounded operation amounts |
| --- | ---: | ---: | ---: | ---: |
| 8,000 /8,000 | $0.48 | £0.609464 | £0.121893 | £0.731357 |
| **8,000 /12,000** | **$0.68** | **£0.812619** | **£0.162524** | **£0.975143** |
| 8,000 /16,000 | $0.88 | £1.015773 | £0.203155 | £1.218928 |
| 8,000 /25,000 | $1.33 | £1.472871 | £0.294575 | £1.767446 |

Thus8k/12k has plausible headroom under£1 Astra and£3 aggregate, while8k/16k Astra does not fit£1 under this scenario. Fixed fees, actual FX/tax/processing terms and original tariff-unit rounding may increase admission. The original controller must reserve its genuine conservative maximum, never these illustrative totals as if they were verified tariffs. Stop if the verified all-in maximum exceeds either approved ceiling; review a complete alternative rather than truncate or change pricing silently.

Output includes reasoning, visible text and non-visible formatting; reasoning usage is not charged twice. Official guidance suggests25k initial output/reasoning room in general, but that is neither a mandatory minimum nor proof that this three-page task needs it. A cap can be consumed before visible content.12k useful three-page fit is unproven and incomplete output remains a valid, non-retriable outcome. [Reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning).

The existing actual-source preparation measured5,558input bytes,8,996strict-schema bytes and15,286wire bytes. **Bytes are not compatible token counts.** Count the complete final model/input/instructions/schema projection independently for each model, bind the count receipt to exact hashes and fresh source, and retain allowance for any provider protocol overhead. The larger limits/model/reasoning setting change wire/envelope identities: old4k/£0.10 hashes and approvals are not reusable. Counting itself requires separately approved provider access; none was performed. [Compatible count endpoint](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens/methods/count).

Preserve the original external-input privacy gate: raw contacts, credentials and B3 execution permits are excluded, but the current private wire still contains native owner/business/Website identifiers. Review that exact disclosure before **any** external model/counting request. A minimised replacement projection would need new contract tests and hashes; do not silently substitute one or expose the private request in Git/logs/chat.

## Installed compatibility blocker and smallest required preparation

Fresh read-only inspection at**16:33:34UTC** confirms the original Lab tariff constraint `max_input <=8000`, **`max_output <=4000`**. Existing v2 runtime is still4kinput/4koutput/£0.10; hosted-source preparation is Sol-only. **More financial headroom does not raise these enforced caps.** No runtime or SQL limit was changed in this mission.

Before a12k-output execution proposal, prepare and test a narrow preserving compatibility change through the same authorities:

| Existing source/authority | Required future review |
| --- | --- |
| Original `busy_ai_private.tariffs` constraint | Separately hash-pinned forward migration for the reviewed output bound; preserve all tables, tariffs, reservations, receipts, RLS/ACLs and original installation bytes/history |
| `websiteIntelligenceProviderProjection.mjs` / `websiteCreativeDocumentReview.mjs` | New server-owned v2 bounds/metadata and fresh sealed request identities |
| `creativeDocumentExecution.mjs` | Exact new approval/token/cost checks; review96KiB response bound and60second deadline against larger output |
| `creativeLedger.mjs` | Per-operation ceiling, output/input tariff coverage, reservation and independent readback under reviewed v2 limits |
| Shared `creativeExecutionEngine.mjs` | Replace v2's hardcoded post-settlement4k/£0.10 checks with sealed protocol limits while retaining legacy Home/v3 bounds; no arbitrary caller limits |
| Actual-source/Quiet Light preparation and tests | Reviewed per-model requests, same facts/goal, new digests; review64KiB structured-document bound, output size, timeout and incomplete cases |

Merely changing an adapter would leave the shared engine rejecting a charged result. Reuse the existing adapter, renderer, Studio and budget ledger; no replacement system is needed. Do not lower a later database constraint by deleting tariffs, receipts or liability history. Any migration, deployment or activation needs its own exact reviewed approval; none is requested or executed by this proposal.

The current frozen disabled C packet remains113files, inventory `b770746a20cb100372d4d8a90f3e75ebe186e28ec497007060baea1dd3909bee`, canonical packet `377c42baddbdb3362d9ef7a5d3dbb6724f40b34e0f83d90193d98af485170505`. Budget revision does not activate it. Any future code change requires new functional source/tree, dependency inventory and approval identities.

## Original central-budget admission and settlement

The £3 aggregate must be enforced by original platform/account/Website-feature ceilings in the isolated Lab, with concurrent limit1, plus immutable exact-run approvals enumerating at most the two operation IDs. A monthly cap alone is not a lifetime experiment or request-count limit. Keep both approvals within one original accounting period; stop at month rollover and review outstanding liabilities rather than gaining another£3 allowance.

All settled attempts count actual cost; reserved/dispatched/unknown attempts retain their complete maximum liability. Include refused/invalid/inferior paid results and prior Astra spend in the same aggregate. Never release unknown liability to make room for Sol. Do not dispatch the second arm until the first operation has an independently resolved receipt and enough remaining approved headroom.

Reserve each operation immediately before its one dispatch, not both in advance; original reservation freshness is30seconds. Independently read original admission/operation state, current membership/source, immutable tariff and exact token/cost bounds. Preserve finish/readback authority even if review fails or membership changes. On response, reconcile actual input/output/cache/reasoning usage with the immutable all-in tariff and service-only settlement/readback; do not describe local synthetic usage as real provider billing. Lost acknowledgements trigger read-only investigation, never automatic replay.

Only a later separately approved original account/entitlement/tariff/policy setup can install those limits. No direct table writes, fake paid entitlements or parallel spending database. Supabase/OpenAI project alerts are not the authoritative per-request financial ceiling.

## Execution gates and comparison acceptance

Before presenting a concrete dispatch approval, independently verify:

1. Intended provider account/project model grants, endpoint/tier/rate eligibility and isolated server-only credential configuration through an approved secure route. Do not copy staging keys or request secrets in chat.
2. Fresh actual Quiet Light source/membership; complete services/story/protected action; exact same three-page image-free task, source facts, renderer, approved creative freedoms and quality standard for both models.
3. Completed compatibility work, genuine PG/PostgREST denial/concurrency/unknown-outcome tests and source-bound request/schema/count/tariff identities for both models. No count or original financial admission evidence may be invented.
4. Current applicable all-in GBP rates/FX/tax/fees, original controller entitlement and aggregate/perevent ceilings; at most one immutable operation per arm, exact short expiry and independent reservation readback.
5. Explicit owner authorisation for the specific request and maximum exposure, separately from migration, deployment, credentials and activation. The current instruction authorises preparation only.

Blind complete mobile/desktop renders where practical, using the original renderer and identical source. Assess factual validity, technical correctness, visual individuality, typography, mobile composition, copy quality, owner corrections and cost separately. Preserve inferior/invalid results and all actual costs; no automatic winner, save, publication or Gold Standard promotion. Equal professional quality applies to free previews, Grow and Pro. One pair is exploratory, not proof of reliable superiority or validated subscription economics.

## Fresh checks and preserved state

Fresh local executions: original central-budget **20/20 real loopback PostgREST/PostgreSQL17 cases** passed, cleanup completed; actual-source baseline **23/23** and v2 bridge **17/17** passed. These prove preserved current caps/authorities, **not** the unimplemented£1/£3 or12k-output path. Central tests use synthetic local JWTs, entitlements, tariffs and usage receipts, never a real provider. No new full531-check CI result is claimed for this documentation-only revision; its existing functional0888 receipt remains preserved.

[Technical proposal evidence](evidence/real-source-preview-pilot/revised-budget-proposal.json) records the read-only state, calculation assumptions and fresh test counts. It is not loaded by the runtime and grants no authority.

A new local three-page baseline/portable export was built on clean source `b59ace495b67f3166795390aca7be8424ab52e83`, using the verified private hosted export and original renderer. It retains that export's15:19observation provenance; it is not a fresh authenticated hosted read or a new browser screenshot set. Prior genuine full-resolution browser evidence remains intact. No layout, stored draft or owner wording changed.

Read-only Lab verification: policy disabled, monthly limit0, accounts/tariffs/periods/operations/events0, reserved0/spent0. Staging, production and Slow Roast were untouched. No new native sign-in, B3 execution, hosted writes, provider/count calls, paid usage or publication. Corrected V22.85 plus the owner's approved V22.86 Section98 policy remain the available authority; the complete V22.86 original is still unavailable here.

**Next useful preparation:** the bounded v2 token/cost compatibility change and exact account/count/tariff evidence, alongside the existing independent disabled-deployment review. Then present a fresh execution packet under the proposed£1/£3 ceilings. Approval of this budget concept alone must not change the live zero-spending state.
