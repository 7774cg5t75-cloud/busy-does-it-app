# Central AI cost control — review-only activation candidate

No hosted execution is authorised. Designated project: `pnjdlogwegnqbsfpcofw`; production `qgkmuiipicazmcxxmoxv` is explicitly refused by the new gateway. Complete original Master V22.66 remains private.

The existing daily voice/conversation quotas and standalone entitlement ledger remain intact. None supplies a general AI money-reservation contract. This package provides that one central contract using original business/membership/profile/snapshot/App authorities, without a second business or customer database or changes to subscription plans.

## Installation and retention

1. Independently verify the designated staging identity and current schema; review authentic-schema compatibility and the existing whole-app package first. This is an extension, not a standalone replacement or captured production DDL.
2. Review the manifest-bound `install.sql`, four service-only RPCs, schema ownership and private-table grants. The installer requires `postgres` and a fresh `busy_ai_private` namespace. The leading review fuse stays in Git. Removing it is only authorised in disposable local rehearsal material today.
3. Install the exact reviewed SQL atomically only after separate approval. All new tables force RLS, expose no direct table/sequence authority to mobile/service callers, and default to no accounts/tariffs and a disabled zero-ceiling policy. Only fixed service functions can select authorised context or mutate reservations. Client IDs never substitute for a server-verified actor.
4. A separately reviewed trusted provisioning operation must supply actual verified subscription entitlement references, monthly/feature/expensive allowances, concurrency limits and immutable tariff/currency/FX evidence. Local tests deliberately use fictional records; they are not valid hosted subscription evidence. No provisioning API/webhook or plan purchase is activated here.
5. The gateway source additionally requires its exact server offline-only flag and staging URL. Do not set that flag, deploy or enable SQL policy without separate approval. No live model adapter or provider key is wired, even with the offline flag. Future billable calls require provider-specific verified usage, bounded execution, real price evidence and central admission.
6. `rollback-retain.sql` has a separate review fuse. It turns off policy, revokes admission/dispatch and retains all records, liabilities, locked pricing and audit events. Service-only source inspection and finite settlement remain available for trusted reconciliation. It does not release unknown charges, erase old records or alter original customer/builder data.

## Enforcement and limits

Reservations use integer GBP micro-units, current UTC monthly entitlements, conservative FX/uncertainty margins and source/membership locks. Global policy and account rows serialize admission across processes; feature and expensive-service allowances cannot borrow from one another. Sixty attempts per business per UTC day and one dispatch per operation bound the current route. Current account and tariff restrictions are checked again at dispatch. New requests cannot recycle another request's private nonce for cleanup. Provider receipt reuse/conflicting settlement is rejected. Unknown dispatched work remains reserved until authoritative reconciliation; expiry alone is not proof of non-execution.

Settlement from held tariff/usage is conservative accounting, not independently verified provider invoices or customer charges. A cost/token-envelope overrun records the liability, blocks the account and kills new admission rather than hiding the excess. Future real-provider integration must verify usage/receipts outside the model, reconcile billing discrepancies, meter all paid routes and operationally review overrun recovery. The global lock and retained uncertainty may temporarily limit availability; safety is preferred to unbounded spending.

The HTTP path bounds streamed input to 4KB/3 seconds, owner goals to240 characters, structured output to16KB and simulation to5 seconds. SDK network requests have10-second abort deadlines. Unsupported destinations/tools/code, stale source revisions, forged actor fields and invalid proposals never become writes. These controls do not replace deployment-level unauthenticated ingress/abuse protection or genuine hosted JWT acceptance.

## Dependency findings and affected paths

Zod3.25.76 is required by the installed Expo CLI57.0.32. Its devtools/MCP extension schemas validate plugin descriptions and output; oversized untrusted collections reaching that toolchain remain an availability risk. Deepmerge4.3.1 is used by `@expo/config` for build configuration merging; unsafe prototype-bearing configuration remains a risk. These are not imports used by the new Edge gateway: it uses bounded JSON and the original finite validators rather than handing model data to Expo configuration or Zod. This reduces exposure on this route, not the severity or existence of the advisories.

Do not expose devtools/MCP ports or accept generated third-party configuration without independent review. Existing root lock/dependency advisories remain unresolved; no forced Zod-major/Expo downgrade or finding suppression is applied. Compatible remediation and relevant release-risk review are still required. No new dependency or lockfile change is introduced.

## Evidence and remaining gates

`check-ai-budget-postgres.mjs` installs the actual source package over original connected contracts in a disposable local PostgreSQL database, uses explicit synthetic Auth shims and fictional entitlements/tariffs, and exercises multiple independent connections. It is not hosted Auth/JWT/PostgREST, real billed model use, native visual acceptance or production readiness. The existing full application regressions and security checks remain separate.

Before hosted activation: exact schema identity/dependency verification; permission/ownership review; approved fiction-only Auth provisioning; disabled/offline gateway deployment approval; verified subscription/tariff provenance; source-bound rollback; ingress/rate-control configuration; real two-owner JWT/CAS/expiry tests; provider/cost reconciliation and operational recovery design. Costs depend on approved hosting/provider plans and have not been measured with real inference; this mission uses no paid provider or cloud build. No broad owner manual testing is requested.
