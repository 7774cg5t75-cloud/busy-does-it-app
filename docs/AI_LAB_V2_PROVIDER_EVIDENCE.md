# AI Lab v2 pilot — public provider evidence and remaining admission gates

Public documentation reviewed on **6 November 2026, 20:51 UTC**. This record contains no credentials, customer information, provider response or execution approval. It does not modify the reviewed SQL, a tariff, a reservation, a server switch or the existing 1,000-output Home-v3 pilot.

**Status: proposed provider, not dispatch-ready.** The public model and prices below are independently documented. Access for the intended Busy Does It OpenAI account/project, a Lab-specific credential binding, an applicable all-in GBP tariff and a compatible exact complete-request token count are not established by those public documents. No Models, Responses, token-count or other provider API endpoint was called during this review.

## Public model evidence

The official [GPT-6.1 Sol model reference](https://developers.openai.com/api/docs/models/gpt-6.1-sol) currently lists `gpt-6.1-sol`, Responses support, Structured Outputs and `reasoning.effort: low`. Its published context/output limits exceed this pilot's proposed limits. Its API rate-limit table marks the Free tier unsupported; OpenAI account eligibility must therefore be verified independently. A Free Supabase project has no bearing on OpenAI API eligibility. The reviewed snapshot listing shows the model alias, not a separately verified dated snapshot.

Keep `gpt-6.1-sol` as a **proposed identifier**, with exact requested and returned model identities retained. Public listing, an account credit balance, a successful synthetic transport or a secret name does not establish that the intended account can run this model with the required restricted credential. No account-specific availability claim is made.

## Public tariff evidence and bounded arithmetic

The official [API pricing page](https://developers.openai.com/api/docs/pricing) currently lists these **Standard, short-context USD rates per million tokens** for `gpt-6.1-sol`:

| Token category | USD per million |
| --- | ---: |
| Ordinary input | 2.00 |
| Cached input read | 0.10 |
| 30-minute cache write | 2.50 |
| 12-hour cache write | 5.00 |
| Output | 10.00 |

The same page distinguishes Standard, Flex/Batch, Fast and Ultrafast processing; Fast is twice Standard and Ultrafast six times Standard. It documents a 10% uplift for applicable regional/FedRAMP processing. Use the reviewed fixed endpoint and Standard service configuration; neither a returned proposal nor a client property may choose a different tier. Do not assume that Ireland hosting selects a regional OpenAI endpoint or tariff. The proposed 4,000-input request is below the model's long-context surcharge threshold. No tool fees are included because the pilot permits no tools.

For **at most 4,000 complete input and 4,000 total output tokens**:

| Illustrative upper-bound calculation | USD |
| --- | ---: |
| All input at ordinary input rate, plus full output | 0.048 |
| All input conservatively at highest listed Standard cache-write rate, plus full output | 0.060 |
| Previous conservative bound with a hypothetical applicable 10% regional uplift | 0.066 |

These calculations are not account quotations, measured inference costs, GBP reservations or promises of a usable output. Do not rely on a cache discount. Confirm the actual cache/processing policy or conservatively admit its highest applicable cost through the **original central controller**.

The effective GBP conversion, tax treatment, fees and other account liabilities remain unverified. A valid admission must cover all applicable exposure, round conservatively and be independently read back at **no more than £0.10**. For example, if `U` is the supported USD maximum, `F` is the independently established GBP-per-USD ceiling and `A` covers all remaining taxes/fees in GBP, require `U × F + A ≤ £0.10`; this record supplies neither `F` nor `A`. The project's spending alerts and credit balance are not a hard per-request spending control. No tariff or entitlement is registered by this evidence review.

OpenAI's [billing-information guidance](https://help.openai.com/en/articles/9038389-updating-billing-information-tax-id-and-vat-id) makes API billing preferences and applicable tax dependent on the billed organisation. It does not supply this project's GBP conversion or establish a tax exemption. Only non-secret account evidence needed for admission should be retained; do not copy payment details or tax identifiers into review artifacts.

## Complete input counting and the output limit

The official [token-counting guide](https://developers.openai.com/api/docs/guides/token-counting) distinguishes local plain-text tokenization from the exact model input count. Request formatting, tools and schemas can add tokens absent from a local text count. Its supported exact method uses the same Responses input, including instructions and structured-output schema, through the [input-token-count API reference](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens/methods/count), `POST /v1/responses/input_tokens`.

No such endpoint was called. The reviewed pages do not establish a zero-charge entitlement for this account, so do not describe a future count request as approved or free. Any separately authorised count must use only the exact approved synthetic payload, server-owned credentials and the intended model, with provenance retained against the frozen request digest. Changing the source, instructions, schema or model invalidates that count. A compatible independently justified conservative bound is another possible admission method; raw UTF-8 bytes or `characters / 4` are not exact model-token evidence.

The official [reasoning-model guide](https://developers.openai.com/api/docs/guides/reasoning) explains that `max_output_tokens` covers visible output, hidden reasoning and non-visible formatting. Reasoning is billed as output; returned `usage.output_tokens` and its details must be reconciled, rather than counting only the JSON text. The model can hit the cap before producing usable visible output. Its general recommendation to allow substantially more room for initial reasoning experiments is not authority to enlarge this pilot.

Consequently **4,000 total output tokens is a deliberate constrained experiment**, not 4,000 JSON tokens plus free reasoning. An offline three-page document that fits a local visible-text count cannot prove that a real model will finish within this bound. Preserve incomplete, refused, malformed, unchanged and inferior results and their real usage; no retry, fallback, automatic continuation or silent truncation is permitted. A larger allowance requires a new reviewed proposal, compatible original budget authority and separate approval.

## Structured-output compatibility

The official [Structured Outputs guide](https://developers.openai.com/api/docs/guides/structured-outputs) documents local definitions/recursive references and numeric/array bounds for supported base models. Strict schemas require a root object, all properties required and `additionalProperties: false` throughout. Its published ceilings include 5,000 object properties, ten nesting levels, 120,000 total schema-string characters and 1,000 enum values. Unsupported composition keywords include `allOf`, `not`, dependencies and `if`/`then`/`else`; fine-tuned models have additional restrictions.

This supports reviewing the existing recursive declarative grammar; it is not proof that a specific request has been accepted by the provider. Check the final projected schema against the documented subset and retain original independent source/factual/owner-lock validation after parsing. Schema compliance cannot verify claims, ensure good design, grant image rights or authorise saving. Refusals and incomplete responses must fail safely before original Studio review. The model must receive no executable HTML, CSS, JavaScript, tools or publication authority through this contract.

## Evidence still required before a live approval request

1. Independently verified installed original Lab foundation, then separately authorised fictional native Auth/business/Website source setup and a disabled, Lab-specific server deployment. The existing staging credential is not transferred or inspected.
2. Intended provider account/project eligibility, model access, permitted server-only credential configuration and current account tariff evidence. No key is requested in chat or placed in client/repository/artifacts.
3. A frozen three-page synthetic source, compatible full-request token evidence, exact source/schema/request digests and an explicit response cap of 4,000 **total** output tokens. Keep offline fit evidence distinct from real model evidence.
4. Applicable cache/tier/FX/tax/fee ceiling, a new immutable original tariff revision and original entitlement/admission that cover at most £0.10. Independently confirm the exact fresh original reservation and service-only readback immediately before dispatch.
5. Separate owner approval naming the model, exact source/request identity, one-use operation/nonce and maximum £0.10. No current mission instruction grants it. Server-only approval, current membership/source checks and durable at-most-once dispatch remain mandatory.
6. One real response/receipt, returned model, actual input/total-output usage and independently confirmed finish/receipt readback. Unknown acknowledgement or settlement retains liability and requires inspection, never replay. Original Studio review is the only save authority; automatic save and publication remain prohibited.

A real first request can establish feasibility and supply one inspectable creative candidate. Public documentation and offline fixtures cannot establish real account access, exact live usage, professional visual quality or model superiority. Compare the eventual deterministic and genuine-model candidates using identical approved facts and the same original renderer, with blind labels where practical. Three reference candidates and **zero approved Gold Standards** remain unchanged.
