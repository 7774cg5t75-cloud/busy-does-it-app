# First-party AI Lab dependency provenance — review only, 8 November 2026

## Current result

A small **local, hard-disabled** candidate removes the only external SDK from the isolated creative pilot's executable graph. It does not change the original Website Builder, renderer, native Auth identities, SQL authorities, central ledger, provider adapter, current hosted function or general gateway.

`labAuthorityHttp.mjs` supplies only the fixed AI Lab's native `GET /auth/v1/user` and the existing five central AI RPC POST routes. It preserves genuine native token verification and original owner/member/source checks in the unchanged bootstrap and SQL. It has no sign-in, password, refresh, administration, model, environment-reader or publication port. Its service binding is supplied only after the existing disabled guard. It uses standard bounded HTTP semantics already employed by B3; legacy native server JWT and modern server-key header handling are both covered with synthetic credentials.

The port enforces JSON/request/response bounds, an independent 32KiB Auth response bound, a maximum ten-second whole-response deadline, exact response origin, no redirects/cookies, no retries/fallback, a fixed RPC allowlist, ordinary non-anonymous identity and constant safe errors. The central SQL controller remains the authority for admission, dispatch, finish and receipt readback. A transport failure is never permission to repeat a reservation or model request.

The deployment inventory now rejects **all** non-relative runtime imports: npm, JSR, remote URLs, Node builtins and bare aliases. Only explicit `./` and `../` JavaScript/TypeScript module paths are accepted. Computed imports, path escapes, symlinks, JSON runtime imports, hidden configuration, stale renderer bindings and JWT weakening remain denied.

## Exact current local candidate

The functional preparation is frozen at commit `cd0f54bc1e0b0bf63d060389c2600a9c310f01da`, tree `d1d63c987f2be91ac5ede12744bec0092129fa6b`, preserving parent `0ab1bfbefe98135dfaa194d48ce6282596ff4c3f`. This is a hard-disabled local candidate, not the source currently running remotely or an executable active-deployment approval packet. A later exact private execution manifest changes the reviewed artifact and requires new hashes and separate approval.

| Identity | Value |
|---|---|
| Complete submitted inventory |116 files; `c597433dbfb56060972e1377fa6bebe95151a9d6f1fae035f910a36baeffaf71`|
| Complete first-party runtime inventory |114 files; `8c688005772f71eb6a81b35fae34a7bef5da1eeb8d59fa9ac1b1c0489e33f034`|
| External runtime imports |zero|
| Original renderer closure |43 files; `4c55a4d33388e54fba7ea7bd0baa829dac23d83bde60b2676584ec27aaadf172`|
| New HTTP port | `d4163e640d37dccd342341da23972d0eb90a481680594642aea20fb454a44919` |
| Hard-disabled entrypoint | `dcf03bf892c748264abfffd15dbe5a72571eb58a50da63508ff1f0aeef51d48b` |

The unchanged `deno.json` and shared lock are still hash-bound **build-input metadata** in the submitted inventory. Their download/consumption is not represented as runtime readback. No runtime import depends on their external package resolution, so a future complete readback of the first-party module graph can establish executable dependency identity without claiming those files were returned or that an npm dependency snapshot was verified.

The current entry still reads the literal original `disabledCreativeDocumentExecution`, with `enabled=false`, `executionEnabled=false`, `execution=null`. No environment flag or caller body can enable it. A live source-bound server manifest is a separately reviewed future artifact with its own different hashes, not authority inferred from this candidate.

## Supported read-only route and present limitation

Published official CLI source supports an authenticated **raw ESZIP** function-body download using `Accept: */*`, separately from source reconstruction. The installed MCP getter explicitly requests `Accept: multipart/form-data` and its exposed schema has no raw-bundle or content-negotiation parameter. No approved management-CLI identity/raw-reader is available in this workspace. No credentials were searched, requested, read or used to work around that limit.

Current official architecture documentation describes ESZIP as the complete bundled module graph. Current dependency documentation recommends function-local `deno.json`. The documented omission of configuration/import maps from downloaded source remains normal platform behavior. The original C1 native hash and114 exact runtime matches remain valid **limited disabled evidence**; they do not acquire stronger active acceptance merely because the401/401/503 smoke passed.

Pinned official source references inspected during this work:

- CLI: `supabase/cli@4cc97fa9fdb66a1ab91984e81333c047ae889549`, `apps/cli/src/shared/functions/download.ts`, raw download negotiation near lines783–811.
- MCP: `supabase/mcp@6b2fca972b5264474949fd738f02537082f5c898`, `packages/mcp-server-supabase/src/platform/api-platform.ts`, reconstructed multipart source near lines589 onward.
- Current Supabase documentation source: `apps/docs/content/guides/functions/architecture.mdx` and `dependencies.mdx`.

No raw ESZIP was retrieved or independently hashed in this mission.

## Proposed equivalent safe acceptance — owner decision still required

For the **next separately approved Lab-only artifact**, propose the following source-equivalence basis instead of silently waiving an unverified external dependency graph:

1. Freeze and review every first-party executable byte and static import edge; assert zero external/bare/Node/dynamic-computed dependencies. Bind exact source, renderer, runtime inventory and private execution-manifest identities.
2. Submit only the reviewed artifact with JWT enabled through the supported managed runner, under separate exact deployment approval. Keep deployment and inference approvals separate.
3. Independently read the actual new function/version/native ESZIP metadata. Retrieve **every runtime module of that exact new artifact**, require byte-for-byte matches with no changed, extra or missing runtime files, and revalidate all import edges. The current candidate has114 runtime files; that is an observed inventory, not a permanent ceiling for a later exact private manifest.
4. Treat unchanged unused configuration/lock files as submission evidence, not returned executable modules. Do not claim full116-file runtime readback, actual lock consumption or reproducible binary equivalence.
5. Explicitly retain normal trust in Supabase's managed compiler/runtime and faithful bundle-source reconstruction. This basis proves reviewed source/dependency equivalence, not an independently reproduced ESZIP or inspection of Supabase's private build service.
6. Keep all independent native owner/source, cost/tariff/token, one-use approval, reservation/readback, settlement/unknown-liability and original Studio gates. No successful model schema or one result establishes creative superiority.

Suggested review wording:

> I accept first-party runtime-source equivalence as the dependency-provenance basis only for a separately reviewed, exact AI Lab pilot artifact with zero external runtime imports and independently verified complete runtime-source readback, function/version/native ESZIP metadata and JWT enforcement. I acknowledge the remaining normal managed-compiler/runtime and reconstruction trust. This does not approve deployment, credentials, budget activation or inference; it does not promote the existing C1 limited acceptance or claim missing build-input readback.

This local work resolves the avoidable external-package provenance dependency by removing it from the candidate, rather than pretending the existing downloaded build inputs were complete. **Future hosted verification and explicit acceptance remain required.**

## Actual bounded verification

- New synthetic authority transport: **18 passed, zero failed**.
- Deployment inventory/safety checks: **23 passed, zero failed**.
- Existing original creative-document execution: **55 passed, zero failed**.
- Existing revised Sol/Astra execution: **33 passed, zero failed**; original execution bootstrap passed.
- Existing protected-smoke unit suite: **46 passed, zero failed** in an isolated copy of125 byte-matched public source files with no marker. The real checkout's consumed marker and every gate were preserved; no real job or HTTP request ran.
- Genuine cached Deno check: **one entrypoint passed** with `--no-config --deny-import`; no external module resolution or provider access.
- New authority-port test registered once in the existing regression catalogue; no separate test framework.

Intermediate evidence remains honest: the original smoke unit check in the real checkout refused its expected absent-marker assertion because the actual consumed marker remains present. It was not weakened or deleted. The first Deno check exposed a JavaScript options-inference issue, fixed with explicit JSDoc; the identical offline check then passed.

All credentials were synthetic. No Lab calls, hosted deployment, secret configuration, native sign-in, paid or free provider request, policy activation, Website write, publication or other-project access occurred in this workstream.
