# Security-first connected staging review — 30 October 2026

Authority: explicit owner V22.60 Section72 instructions. Genuine V22.60 original unavailable; earlier genuine V22.59 reopened and checksum verified. This is an internal adversarial source review, not independent release certification.

| Boundary / attacker | Independent enforcement exercised | Remaining acceptance |
| --- | --- | --- |
| Authenticated malicious tenant / guessed IDs | Original server Auth identity, finite SQL membership/creator locks, canonical customer/source checks, CAS and raw-table denial | Real hosted JWT/PostgREST, revoked sessions and fresh clients |
| Poisoned existing public schema | Refuse views/materialized views/foreign relations/sequences, unexpected non-extension public routines and existing private schemas before installation | Refresh hosted inventory and exact postgres installer identity |
| Excessive grants / future privileged functions | Exact RPC overload allowlist; revoke raw table/column access and schema CREATE; close global and per-public-schema postgres defaults; postflight owner/search-path/RLS assertions | Independently verify effective ACL after separately approved install |
| Interrupted install / rollback | One transaction including final closure; induced failure after closure leaves original privileges/schema unchanged; retaining lockdown preserves records/readers | Hosted operational backups/recovery and independent assurance |
| Customer/website/imported prompt injection | Original enquiry preparation remains review-only; exact finite transport rejects protected tool names; renderer escapes script text; media insertion rejects untrusted URLs/paths | Actual model red-teaming under separately approved cost limits; broader provider integrations remain closed |
| Expired or replaced client session | Memory-only expiry capped at one hour; unknown expiry fifteen minutes; generation invalidation and late-result rejection; trusted server rechecks unchanged | First-release secure persistence/refresh choice and real expiry/revocation acceptance; client expiry is not server JWT revocation |
| Signing/build dependency compromise | Official locked node-forge1.4.2 patch, integrity/HTTPS package checks and redacted source secret scan; no lifecycle scripts or credentials changed | Unresolved Zod/Expo tooling advisory and independent supply-chain assurance |
| False durable-save claim | Unsupported inherited local Website combined-instruction and Undo shortcuts are explicitly gated in connected staging; supported finite controls remain available | Finite account-backed multi-step editing/Undo still needs implementation |

## Concrete findings and disposition

1. **Fixed:** per-schema default REVOKE did not remove global PUBLIC function execution. The hostile-future-routine test reproduced this. Both global and schema-local defaults for the exact postgres installer are now restricted. This affects that role's future objects across schemas; it does not revoke existing Auth/Storage objects or modify other creators' defaults. Explicitly include this consequence in activation approval.
2. **Fixed:** the old fresh-table check overlooked pre-existing views/routines and private schemas. Unreviewed entry points are now refused instead of being silently retained next to new private tables.
3. **Fixed:** client public-schema CREATE and future table/sequence defaults were not explicitly closed. Exact ownership/preflight/postflight checks and hostile-default rehearsal now cover them.
4. **Fixed:** the staging client did not enforce its own access-token lifetime. Bounded in-memory expiry, request deadline/abort and stale-session rejection are implemented without persisting refresh credentials. Server identity/membership remains the authority.
5. **Fixed:** upstream node-forge RSA signature-verification advisory GHSA-86w9-cpqp-85rv affected1.4.0; the compatible original dependency range now locks and runs1.4.2. No certificates, provisioning, OTA or signed builds were changed.
6. **Open, release gate:** registry audit still reports Zod GHSA-mrhx-c7xc-m3w5 (oversized-collection memory exhaustion), propagated through Expo CLI/Expo, and low-severity deepmerge prototype-poisoning findings. The post-patch audit reports3 high/5 low affected dependency nodes, not eight distinct exploits. Zod's advertised fix crosses the original v3 dependency contract; no forced major replacement or audit suppression was used. Do not expose development tooling to untrusted inputs or treat the mobile/build release as security-accepted. The selected Edge source has no Zod imports; this is not proof of unrestricted transitive runtime safety.
7. **Open:** durable hosted rate-limit/quota validation, real Auth session controls, deployment runtime acceptance, authentic production-schema compatibility and independent release assurance remain outstanding. Staging-only snapshot CREATE is explicitly a compatibility foundation, not captured production DDL.

## Activation decision

The exact SQL candidate is suitable for **separate approval of fictional, isolated, fresh-staging SQL installation only**, subject to current metadata/postgres-installer verification and independent review of the compatibility/default-privilege consequences. It is not approval to deploy gateways, create users, activate switches or run mutation acceptance. The code's activation flag stays false.

No public/customer/provider activation or release is recommended while the above affected-path gates remain unresolved. Continue safe source work and separately controlled fictional staging verification. No claim of comprehensive security, model robustness, hosted functionality or native acceptance is made.

## Reconciliation with authentic V22.62

The subsequent owner-supplied original was opened and verified; see AGENTS.md and CODEX_MASTER_ACCESS.md for checksum/counts. All76 added paragraphs were reviewed against retained V22.59 content. Sections72.11–72.13 reinforce existing controls while requiring practical risk-based assurance, not an arbitrary consultancy-fee gate. This internal review and free automated checks are not professional independent testing. An initial private crypto/provider inventory records source observations and explicitly unknown deployed algorithms, key rotation, backups and provider support; no cryptographic change or quantum-security claim is made. The implementation/test checkpoint remains unchanged by these documentation-only updates.
