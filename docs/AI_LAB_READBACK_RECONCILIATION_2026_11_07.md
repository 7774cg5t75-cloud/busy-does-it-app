# AI Lab readback reconciliation — disabled-only acceptance proposal

7 November2026. **The114/116 result is consistent with Supabase's documented download semantics. It does not, by itself, indicate missing deployed application code.** All114 returned runtime files remain exact matches. The literal116-file runtime-readback assumption needs a separately reviewed revision for this disabled candidate; it is not a reason to redeploy version1. Effective configuration and compiled dependency provenance remain unverified.

This is a proposal, not owner acceptance or execution authority. No deployment, repair, overwrite, deletion, rollback, credential operation, handler HTTP request, smoke queue, SQL mutation, budget activation, Website write or paid usage occurred in this reconciliation.

## What the official sources establish

Supabase's [migration guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore#migrating-edge-functions) explicitly says: **“The command will not download import maps nor deno.json files.”** The same statement is preserved in the [official documentation source](https://github.com/supabase/supabase/blob/dc73b346c1f37eaae9e529fae81a4307b78fefe6/apps/docs/content/guides/platform/migrating-within-supabase/backup-restore.mdx#L336-L343), independently checked during this review. The documentation Git blob ID is `75814fd2e028168848479359811f61a116b83e1b`.

Supabase's [Edge Functions architecture guide](https://supabase.com/docs/guides/functions/architecture) describes an ESZIP containing the bundled module graph. The [dependency guide](https://supabase.com/docs/guides/functions/dependencies) recommends per-function `deno.json`, consistent with the submitted path. These sources distinguish source reconstructed from a deployment artifact from the original collection of build inputs.

The documentation located explicitly names `deno.json` and import maps; it does **not** separately name this lockfile. Its absence is consistent with a non-module build input being omitted from a module-source download. That is an inference supported by the artifact format and exact missing-file set, not a claim that Supabase documented this particular lockfile or proved it was honoured.

The published [MCP implementation](https://github.com/supabase/mcp/blob/6b2fca972b5264474949fd738f02537082f5c898/packages/mcp-server-supabase/src/platform/api-platform.ts) requests reconstructed multipart source and returns named file parts. The [official CLI implementation](https://github.com/supabase/cli/blob/4cc97fa9fdb66a1ab91984e81333c047ae889549/apps/cli/src/shared/functions/download.ts) supports raw ESZIP content negotiation separately. These are public implementation references, not inspection of Supabase's private backend or proof of its deployed implementation version.

## Preserved exact identity

| Evidence | Unchanged value |
| --- | --- |
| Project / function | `sbvkrvksnruiclcvclbd` / `busy-creative-document-pilot` |
| Native function ID / version | `434c07a2-b755-4a9a-bf4d-78691cf9deb7` / `1` |
| Platform JWT verification | `true` |
| Native-reported ESZIP SHA256 | `3f591808c69d14bc04a97a4d193e9c3b4fd4249cc1b78d56860b257affc47808` |
| Frozen functional source / tree | `a4557d164ae03a93eb5aa310749a32e89c14ca40` / `7d92ff206eddbc59c3e45ba55a3ab74cabb3dfbe` |
| Original C packet | `bd86dffd15057c36420f3b990028b69fe901f60cb2260cf0b73c4acea35b6df1` |
| Submitted116-file inventory | `ad3669fea24ec30dc76702159e11eb4953a956100a59f084266f722c1b1dc471` |
| Returned114-file inventory | `303e8be2e6a84233a4ffb453fbd85378a246cb0096eeead30e9e61754699854d` |

A fresh authorised management listing confirmed the same version/JWT/bundle metadata. The preserved private source readback, captured upload, all116 submitted hashes and all114 returned hashes were rechecked against frozen Git without modifying the originals. No raw ESZIP was downloaded or independently hashed; the bundle hash above is native management metadata. The original [deployment result](AI_LAB_APPROVAL_C_DEPLOYMENT_RESULT_2026_11_07.md) and its stopped verification remain intact.

The returned application code retains `enabled=false`, `executionEnabled=false`, `execution=null` and the disabled guard before application environment reads. There are no changed or extra runtime files. The two unreturned build inputs remain the original nested `deno.json` and `supabase/connected-staging.deno.lock`, with their unchanged approved hashes in the prior result.

## Available proof and residual risk

The authorised MCP getter exposes reconstructed source only; its schema has no raw-bundle/content-negotiation parameter. No separate authenticated raw-download or build-receipt tool is available. This runtime has no established management-CLI identity. No credential files were searched, credentials requested, private endpoint probed without authentication, or unsupported parameter/route workaround attempted.

A supported raw-bundle reader could permit offline inspection of the effective dependency snapshot, package integrities and resolver settings. It might still not retain the original configuration-file bytes. An authoritative build receipt could provide equivalent evidence. Neither was available here, so **actual nested-config/lock consumption and compiled transitive identity are not established**.

The existing SDK import occurs before the handler's disabled branch. The branch controls the reviewed application path, but is not proof of third-party module-initialization integrity. Boot/import behaviour and actual gateway/handler responses remain untested. These limits must be accepted explicitly for any bounded disabled smoke; they cannot be dismissed because the handler is disabled.

## Proposed revised acceptance — only this disabled version

The owner may separately accept this precise evidence basis:116 build inputs were submitted and hashed; all114 retrievable application modules match; native version1, JWTtrue and the reported bundle hash agree; documented reconstruction explains why literal build-file recovery is not a suitable runtime-source count requirement. Keep `complete116FileReadbackVerified=false` and all configuration/dependency uncertainties visible.

That acceptance would identify this disabled deployment for preparing a separately approved smoke. It would not authorise a request, queue, redeployment, provider credential, source write or spending. A different version, bundle hash, source map, JWT setting or execution flag invalidates it. The consumed deployment approval remains consumed.

Copyable proposed acceptance wording:

```text
I accept the revised readback basis only for disabled busy-creative-document-pilot version1 on AI Lab sbvkrvksnruiclcvclbd.

Function ID:434c07a2-b755-4a9a-bf4d-78691cf9deb7
Native-reported ESZIP SHA256:3f591808c69d14bc04a97a4d193e9c3b4fd4249cc1b78d56860b257affc47808
Submitted116-file digest:ad3669fea24ec30dc76702159e11eb4953a956100a59f084266f722c1b1dc471
Verified114-runtime-file digest:303e8be2e6a84233a4ffb453fbd85378a246cb0096eeead30e9e61754699854d

Keep JWT verification enabled and execution false/false/null. I acknowledge that effective configuration, lock consumption and compiled dependency initialization remain unverified. Do not mark full116 readback or active AI readiness passed.

This accepts only the limited disabled-deployment evidence. It authorises no smoke queue/request, deployment, credentials, provider activation/call, budget change, Website write, publication or spending. Keep the stronger active-execution gates.
```

## Smallest separately approved smoke

Reuse the existing protected workflow/factory; no new framework or code change is needed. **The proposed test makes three HTTP requests to the disabled Lab function; “no-call” means no provider/model inference, not zero HTTP. None is authorised now.**

| Order | Exact request scope | Required result |
| --- | --- | --- |
|1|POST `{}` with no bearer, API key or cookie|401|
|2|POST `{}` with only the existing literal synthetic-invalid bearer|401|
|3|POST `{}` with only the existing Lab publishable key in `apikey`|503, exact `Creative document pilot disabled`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`|

Proposed maximum additional paid cost is£0, using the existing Free Lab and standard public-repository GitHub runner. Fresh plan/cost checks must precede a queue; stop for an upgrade, paid runner or nonzero charge.

Maximum three sequential requests, ten-second deadline and4KiB response cap each, redirects refused, no retries/fallback. Read the existing publishable binding only before request3; no new secret, owner password, native sign-in, server key or provider key. Do not log keys or request/response contents. An unexpected status, timeout, lost acknowledgement or receipt uncertainty stops for read-only inspection. A third401 must not lead to JWT weakening, alternate credentials or sign-in.

Before queuing, obtain explicit limited acceptance and separately approved queue scope, then fresh version1/JWT/bundle, source/zero-policy and protected-Environment evidence. Prepare the exact existing marker-only proposal against the then-current parent; keep the six-file handoff digest `d48a25ba7c34631d31294fe3a254c5cb48ba54cff953e20e63133d8adb23ab55` and original116-input map. Its existing verification field can bind a **new limited acceptance receipt**, without relabelling the original stop as a complete pass.

Queue one protected attempt only after exact queue approval and leave its gate waiting. Then independently verify run/actor/commit/attempt and obtain a separate short-lived exact-run execution approval. The owner supplies the existing non-secret native review comment and releases the GitHub Environment gate. GitHub metadata access must work before key access; failure has no credential fallback. Existing intent/history controls prevent ordinary replay; their fsynced intent remains runner-local, not a distributed intent service.

Required read-only control-plane/approval checks accompany these three function requests; no database writes or budget operations are included. Independently verify unchanged source, identity/security and zero ledger afterwards. The job binds a prior deployment attestation; it does not fetch raw ESZIP itself. Current Environment protections and hosted caller behaviour are not newly verified by this document. No marker, nonce, approval record, job or expiry has been generated.

## Active execution stays separately gated

Before any active deployment/inference, establish effective build/configuration and resolved dependency versions/integrities through supported bundle/build evidence or an explicitly reviewed equivalent. Literal recovery of non-runtime files is not the goal; independently justified effective identity is. Retain original authenticated owner/membership, source freshness/CAS, protected wording, one-use review, exact counted request/schema, verified model/tariff/all-in cost, central reservation/readback, settlement/unknown-liability and original Studio-only save authorities. This disabled acceptance cannot satisfy those gates or be reused for changed active code.

Fresh local checks passed19/19 deployment-inventory cases and46/46 protected-smoke cases; all transports are synthetic, with zero handler requests, credentials, provider calls or writes. Existing full CI and hosted database preservation evidence are retained, not claimed as rerun. [Assessment metadata](evidence/ai-lab-readback-reconciliation-20261107/assessment.json) records the exact scope and false approval flags.

Only documentation/evidence changes accompany this reconciliation. Version1, the original input/readback artifacts, Website, credentials and hosted state remain untouched. The£0.25 Sol/£1 Astra/£3 combined ceilings remain proposals. Equal free/paid Website quality, original ownership/Studio controls and three candidates/zero approved Gold Standards remain unchanged. No missing private master original was reconstructed.
