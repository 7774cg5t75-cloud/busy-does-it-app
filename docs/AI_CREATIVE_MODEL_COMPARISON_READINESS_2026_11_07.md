# Real creative comparison: model and cost readiness

**Budget/FX continuity update:** the previous£0.10 planning scenario below is historical. See the [revised£1 Astra /£3 cumulative comparison proposal](AI_CREATIVE_PILOT_REVISED_BUDGET_2026_11_07.md), with rechecked pricing, newer6November ECB reference FX and explicit account/tax/token/compatibility gates. Original findings/hashes are retained unchanged; no runtime activation or spend is authorised.

Checked 7 November 2026. This is public-document research and a proposed evaluation protocol, not an execution approval. No provider metadata, token-count or inference request was sent; no account, credential, tariff, reservation or hosted record was changed.

The current official catalogue identifies **`gpt-6.1-sol`** and **`gpt-6-astra`** as OpenAI API models. These IDs were checked directly; their presence in Codex's model selector was not used as evidence. Both list Responses and Structured Outputs, text output and image input. Both support reasoning effort `low`, `medium`, `high`, `xhigh` and `max`; both list a 1,050,000-token context and 128,000-token maximum output. Those model capacities do not enlarge Busy’s proposed pilot limits. [Sol model](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra).

## Availability is still an account gate

Both model pages mark the **OpenAI API Free tier unsupported** and list Build/Launch/Grow tiers. This is unrelated to the Supabase AI Lab's Free infrastructure plan. Public model pages cannot establish the intended OpenAI organisation/project's tier, model grants, rate limits, key scope/expiry or current billing eligibility. Available credits and a restricted key do not independently prove those conditions.

Before any later provider request, the owner must securely establish the intended Lab-specific provider account/project and current model permission, or separately authorise an appropriately scoped server-side account check. Retain non-secret evidence with its time, model, provider project and reviewer. Do not request keys in chat, inspect existing secrets, copy staging credentials or issue a model request as an access probe. Until that evidence exists, account availability remains **unverified** and dispatch must fail closed.

## Published prices and the proposed ceiling

Official standard, short-context global USD prices per million tokens, checked on the date above:

| API model | Input | Output | Cached input | 30-minute cache write | 12-hour cache write |
| --- | ---: | ---: | ---: | ---: | ---: |
| `gpt-6.1-sol` | $2 | $10 | $0.10 | $2.50 | $5 |
| `gpt-6-astra` | $10 | $50 | $1 | $12.50 | $25 |

These are Standard prices, not Flex/Batch, Fast or Ultrafast. Regional processing can add 10%. The pilot must not assume a cache discount or omit an applicable cache-write charge. The existing v2 admission contract requires highest-applicable all-in rates and cache-write/FX/tax/fee evidence even though its requested configuration is global, without explicit caching. [Official pricing](https://developers.openai.com/api/docs/pricing).

Arithmetic at **4,000 input and 4,000 total billed output tokens**:

| Model | Ordinary uncached USD | Highest listed cache-write USD | Previous column plus 10% regional uplift |
| --- | ---: | ---: | ---: |
| Sol | $0.048 | $0.060 | $0.066 |
| Astra | $0.240 | $0.300 | $0.330 |

For transparent scale only, the latest Bank of England table successfully retrieved in this review showed **5 November 2026, £1 = $1.3476**. It yields approximately **£0.03562 Sol / £0.17809 Astra** for the ordinary column, before fees, tax or processing differences. The Bank explicitly warns that its reference rates are not guaranteed transaction rates. The requested 6 November page was unavailable through the documentation tool; the November HMRC rate page returned 403. No newer rate is invented. [Retrieved Bank of England table](https://www.bankofengland.co.uk/boeapps/database/Rates.asp?rateview=L), [Bank exchange-rate guidance](https://www.bankofengland.co.uk/statistics/exchange-rates).

These conversions are **not an admitted GBP tariff**. The real account's invoice currency, effective FX, conversion/card fees, applicable tax, processing/cache terms and any minimum/fixed charge remain unverified. Record and register a conservative, current all-in GBP tariff through the original central authority before admission. A project spending alert is not a hard ceiling.

**Practical first proposal:** one separately approved `gpt-6.1-sol` request, global Standard, explicit low reasoning effort, 4,000 complete-input tokens maximum, 4,000 total output tokens maximum and £0.10 all-in exposure maximum. Sol has useful arithmetic headroom under the reference scenario; it is not yet admitted or proven to produce a complete three-page design. Preserve the original durable reservation, readback, at-most-one dispatch, settlement and unknown-liability controls.

**Astra is a later, separately priced comparison.** Its full 4,000/4,000 ordinary reference cost already exceeds £0.10 before tax or fees. Do not route it through Sol's tariff, admit only an expected output while allowing a larger maximum, silently reduce the design task or truncate a three-page result to fit. A meaningful Astra request needs its own verified account/tariff/token evidence and either an independently proved smaller complete response or a separately approved higher ceiling. The current one-request £0.10 proposal does not authorise two model calls.

## Token fit and response safety

The official count endpoint is `POST /v1/responses/input_tokens`. Its reference accepts the model, instructions, input and text output configuration including the strict JSON schema. A future count must cover the **complete immutable request projection**, including schema and all approved source context. Bind the count receipt to that exact projection/model and current source; a changed model, schema or input invalidates it. No count endpoint was called in this mission. A UTF-8 byte length, character heuristic or successful offline fixture is not an exact compatible token count. [Counting guide](https://developers.openai.com/api/docs/guides/token-counting), [Count API reference](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens/methods/count).

`max_output_tokens` includes reasoning, visible text and non-visible formatting tokens. The reasoning guide warns that a cap can be reached before visible output and still incur charges; its general initial recommendation is substantially above 4,000. Consequently, a complete three-page v2 document fitting the pilot's total output allowance remains unproven. Refusal, incomplete output, invalid structure, no-op and inferior design are retained experimental outcomes, never implicit permission to retry or increase the cap. [Reasoning cost and output guidance](https://developers.openai.com/api/docs/guides/reasoning).

Use strict Structured Outputs, a closed supported schema and the original independent validator. Schema compliance does not establish source truth or design quality. Retain original source/owner locks, approved actions, finite renderer compilation, accessibility validation and original Studio review. The model cannot supply executable code, tools, publishing authority or a save approval. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Sol-versus-Astra comparison design

1. Freeze the genuinely saved three-page Quiet Light source and current revisions/hashes after authorised read-only verification. Reuse its exact approved facts, service descriptions, story, protected wording/actions and image-free boundary. Keep the Business Brain canonical facts separate from creative suggestions.
2. Freeze the original renderer, creative v2 capabilities, fonts/assets, request goal and strict schema. Prepare one deterministic recommendation from that same source. Label any manually authored v2 fixture as engineering evidence; never call it a model result.
3. After separate exact approval for each model, change only the provider model and independently required model-specific wire/count/tariff bindings. Record reasoning effort and limits explicitly. Do not claim that a shared effort label guarantees equal internal compute. Do not grant a second request because the first was invalid or disappointing.
4. Validate actual received documents and preserve their complete provenance/usage result. Render successful proposals locally through the same original renderer without hosted save. Capture every page at identical mobile/desktop viewports, browser/font environment and screenshot settings; preserve original full-resolution files and hashes.
5. Use a private, stable mapping from candidate origin to neutral labels. Show reviewers complete sites and navigation with candidate origin hidden where practical. Separate source-richness changes from design changes. Reveal the mapping after recorded assessment; do not select an automatic winner.
6. Record specific strengths, weaknesses and required corrections for whole-page coherence, typography, mobile composition, originality, business fit, grounded writing, useful navigation and owner pride. Assess technical/factual validity separately. Record repeated sections and unnecessary pages; colour/name changes alone do not establish individuality. Gold Standard acceptance still requires explicit owner acceptance of exact reviewed evidence.
7. Report per candidate: request count; actual provider input/output/cache/reasoning usage; provider receipt and authoritative central settlement; GBP charged/admitted/unknown liability; local planning/rendering/validation/capture elapsed times; manual corrections and additional calls. An unknown settlement remains a liability, not zero cost. Record invalid and inferior attempts in the cost total.
8. For repeated, separately approved evaluations, compute actual generation cost per acceptable completed website as **all attempted generation/correction spend divided by accepted completed sites**. Also report owner/reviewer correction time and any genuinely incurred infrastructure/assets cost separately. With zero accepted sites the ratio is undefined, not free. A single request is exploratory evidence, not a reliable cross-business superiority or subscription-economics result.

No current live Sol/Astra output, model-superiority result or actual generation cost is claimed. No reference is promoted to an approved Gold Standard, no paid entitlement is activated and no stored Website draft is changed by this research.

## Actual hosted-source preparation bridge

The local `prepare-hosted-creative-pilot.mjs` command now accepts the independently verified private read-only source envelope, validates its PostgreSQL byte/hash evidence and feeds the actual saved draft into the original v2 request preparation/projection. It does not substitute the older fixture context. Its deterministic recommendation uses that same source and the same goal, remains an unsaved proposal and renders through the original renderer. The live candidate remains `null` until a separately authorised genuine provider result and independent settlement exist.

The first actual-source preparation measured **5,558 input bytes, 8,996 schema bytes and 15,286 complete-wire bytes**. Its canonical digests are input `972b5fe173ed4d5f3955d23d460302b6efb91207f551e40d767f5d0c5158100f`, schema `c5958b3b5448a012123016f8e18e9425e368a14f4a75461fddb0e48e85e04545`, and complete wire `f0215190447f9a239e5f0bf0e1e925cbf7e46c81025c0eed3eeac1b774f6f7b9`. These are **byte measurements, not token counts**; neither the 4,000-token complete-input fit nor a complete three-page 4,000-total-output result is established.

The original projection removes raw contact values and carries no credentials or B3 execution permit. Its original response scope does contain native owner/business/Website identifiers. The exact private projected input therefore needs explicit external-input review in Approval D; public screenshots and reports must omit those identifiers. The proposed permission to suggest copy/brand changes is not an execution or save approval, and the protected story/action rewrite list remains empty. Serialised preparation files are evidence only: live execution must recreate the original sealed request from a fresh authenticated source, obtain original central admission and independently reconcile real usage.
