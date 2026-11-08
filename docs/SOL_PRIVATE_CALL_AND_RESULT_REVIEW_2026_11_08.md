# One Sol caller and private result — local ports only

Functional preparation is frozen at `12711991cd6e2a6afe92c7f98667e0a7e2b9b134`, tree `c10e9b97ff3f91ea2d22dc366889ee13280782c8`. Source is local/unpushed; no external action is approved. Any later private active artifact has its own different hashes and approval boundary.

This is preparation for a future separately approved D run. It is **not a bound workflow, queued job, native sign-in or inference approval**. No owner recipient keypair or live credential was created or read.

## Small existing-authority composition

`scripts/lib/sol-private-call.mjs` supplies a one-purpose caller port. Before credentials it requires the existing protected runtime to validate and consume the exact native owner-reviewed run/attempt/source/deployment grant. It does not implement a second approval framework, account, business store or spending ledger. No default transport, CLI, environment reader or executable workflow is provided.

The consumed B3 source runtime intentionally hides its JWT and accepts only its original source-write approval. It cannot be passed a replacement D approval. This caller therefore uses the **same original native Supabase Auth password/sign-in and user-verification endpoints/semantics**, without reusing B3 permission, source writers, service key, refresh or onboarding. Its future permission must explicitly cover at most one native sign-in and one native user read in addition to one Edge invocation.

The only accepted native credentials are the existing Lab publishable key and fictional owner's password from the protected runtime. The caller never reads an OpenAI key, server/service key or database credential. Password, bearer and refresh data are never logged or persisted. The native owner must match the exact fictional owner, confirmed email identity, ordinary authenticated/non-anonymous role and no deletion/ban/SSO/super-admin state.

After that verification, the sole function request is:

```text
POST https://sbvkrvksnruiclcvclbd.supabase.co/functions/v1/busy-creative-document-pilot
apikey: existing Lab publishable binding
Authorization: current native owner bearer, private in memory
body: {"version":2,"operationId":"the exact approved private operation"}
```

The validated scalar grant is pinned before asynchronous work; caller mutation cannot replace its operation or recipient. The grant binds exact protected run, actor, attempt1, source commit, request/manifest digests, original operation/nonce, the independently verified C2 function ID/version, public result-recipient digest, expiry and£0.25 maximum. Current C1/version1 is rejected. The fixed route has no configurable project, provider endpoint, action, write or fallback. Native requests have10s bounds; the single function request has a150s bound and2,000,000-byte body maximum. Redirects, cookies and retries are disabled. Original server authentication, current membership/source, reservation/readback, dispatch/settlement and unknown-liability authorities remain mandatory.

No result is called successful AI work merely because HTTP200 returns. Actual model calls and paid cost remain **unknown** to this caller until the genuine original receipt is independently reconciled.

## Private export without new hosted storage

`scripts/lib/sol-private-result.mjs` uses standard Node cryptography: RSA-OAEP with SHA-256 wraps a fresh AES-256 key; AES-256-GCM encrypts/authenticates the bounded private outcome. Recipient RSA keys must be3072–4096bits and supplied as public SPKI only. Private PEM inputs are rejected by the sender. Binding includes only public technical identities/digests, not raw owner/business/operation/nonce values. No key-generation or file-storage facility exists in this module.

The complete received Edge response bytes—including invalid, inferior, non-JSON and non200 responses—are retained byte-for-byte inside the encrypted envelope with status, content type and raw-body digest. Known password, native bearer and publishable-key reflection in body/content type causes a safe stop; such values are never persisted, even encrypted. Auth responses/tokens are never export inputs. Oversized, timed-out, redirected or lost responses retain encrypted uncertainty metadata and require original-ledger inspection, never a replacement call.

The protected writer receives **ciphertext only**. A sanitized public receipt contains request counts/status, unknown-cost markers and public cryptographic digests. It contains no plaintext proposal, raw native scope, password or token. If encrypted persistence acknowledgement is lost, the caller does not call the function or writer again; it returns an inspect-only result and the in-memory ciphertext for authorized recovery.

Encryption provides confidentiality and recipient/binding integrity. It does **not prove who produced the plaintext**: anyone with a public recipient key can encrypt. Genuine origin must be established independently from the native GitHub run/artifact digest, exact source and C2 readback, then the original central operation/provider receipt. Neither a ciphertext envelope nor HTTP200 may substitute for those authorities.

## Exact remaining binding and owner decisions

1. No full paid-call workflow is added now. After count, verified cost basis, original financial configuration and C2 are ready, compose this port into the existing protected native-review pattern, freeze all source/marker/grant hashes and review one exact attempt. It remains **unbound**, so no actual run or approval JSON is fabricated today.
2. Separately approve creation of one owner-private result-recipient keypair and secure retention of its private key under0600 outside Git. Only its public key/digest belongs in the future public request marker. No real owner keypair is generated by this mission. An iPhone owner can later approve Codex's owner-private creation/recovery procedure rather than paste or manage a private key in chat.
3. Separately approve any future protected-run credential mappings. The one-call job needs only the preserved Lab publishable key and owner password; no OpenAI/server key is supplied to that job. This is fresh D authentication authority, never consumed B3/smoke permission.
4. Freeze one conditional D grant with maximum one sign-in, one user verification and one exact C2 invocation;£0.25 maximum, no retry, source save or publication. Complete native deployment/readback checks precede the protected claim.
5. Only encrypted result/intent/sanitized receipt may be uploaded under the reviewed bounded retention policy. Download and verify the actual native artifact, then decrypt only in the approved owner-private workspace. The private key never enters GitHub or logs. No public preview/storage or new database is needed.
6. Independently reconcile the original central operation/provider receipt, source hashes and output. Use the existing renderer/Studio to prepare private actual-model mobile/desktop comparisons. An incomplete/invalid result remains evidence and consumes its one attempt. Keep/save and publication remain separate owner approvals.

## Actual local verification

`scripts/check-sol-private-call.mjs`: **32 passed, zero failed**. It uses only synthetic transports and three ephemeral in-memory engineering RSA keypairs (two recipient fixtures plus one deliberately weak negative fixture). **Zero owner recipient keypairs** were created or stored. Tests cover byte-exact decryption, recipient/binding mismatch and tampering; private/weak-key refusal; exact three-request native/caller sequence; credential and private-scope non-disclosure; old C1/expired/foreign/retry/save grants; lost claim; native-owner revocation; invalid output retention; credential reflection; response bounds/redirects/body deadline/stuck cancellation; one-use replay denial and uncertain encrypted persistence. No actual Auth, Edge, provider, database, credential or paid operation was accessed.
