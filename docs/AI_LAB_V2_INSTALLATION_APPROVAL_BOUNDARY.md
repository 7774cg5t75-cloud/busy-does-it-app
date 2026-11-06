# AI Lab v2 readiness: unchanged foundation and separate installation approval

This document refreshes the installation boundary for the expressive v2 creative-document mission. **No hosted installation is authorised by the current mission.** The reviewed SQL remains fused and unchanged. The v2 integration, fictional source setup, credentials, deployment and first inference are separate decisions; none follows implicitly from foundation installation.

## Exact target and source

| Item | Reviewed value |
| --- | --- |
| Project | Busy Does It AI Lab, `sbvkrvksnruiclcvclbd` |
| Organisation | `wrjfgasxtlznzfzmfrif` |
| Region | Ireland, `eu-west-1`; owner acceptance applies to this fictional-data laboratory only |
| Plan and engine | Free, PostgreSQL 17 |
| Current source continuity | Mission 19 functional `f42028950b573ceee874994e5414763423abc5d4`, tree `5c5cc5af6656306cf979f4cf70892f89e2f16691`; report descendant `c6e2b2860798f06f1825168b81c267823a8a08c2` |
| Requirements | Verified corrected private Master V22.85; original document and extraction stay outside Git |
| Application scope | Original 28 public foundation tables, six private AI-budget tables, 69 original public foundation functions and five service-only AI functions |
| Managed migration name | `mission18_ai_lab_foundation` |

The exact object names are in the unchanged [manifest](sql-proposals/ai-lab-runner-foundation/manifest.json). Counts alone are insufficient: independent readback must match the complete object sets, function signatures, ownership and access contracts. The native `public.rls_auto_enable()` event-trigger function is additional to the 69 + 5 application functions.

The unrelated staging project `pnjdlogwegnqbsfpcofw`, production and Slow Roast have no authority under this packet. No data or credential is transferred from them.

## Artifacts remain byte-pinned

| Artifact | SHA-256 |
| --- | --- |
| [Runner-compatible fused installation](sql-proposals/ai-lab-runner-foundation/install.sql) | `b825989b37e2fef0f874ccdb03405a6650f8dc6ddfe27f94086952cc1cec225d` |
| Installation derivative, removing only the exact outer review fuse | `231b7eecdab788f3829d93c4f1995ce111a6b2b4a953644bdc6d0f785b6a5987` |
| [Fused retaining rollback](sql-proposals/ai-lab-runner-foundation/rollback-retain.sql) | `409b93dd82ccb587f5b6ea813bcc952589fe0255d12e13df030ec531fdc959d4` |
| Retaining-rollback derivative, separate future approval only | `54dc2f25136b3f0f930ec685582e876d3367822511d865967245379d167ebea5` |
| Older authored-transaction installation, preserved but not selected | `3ebf79cdcc5614d7be3573e0ecad68ae93ec8e5c3bf751fa2c0c6cbac5a9030b` |
| Older retaining rollback, preserved | `b5a43ecac26215bde42e5d537423d98e605cadca2dc784661b8bcc2414f7a079` |
| Native RLS-hook function definition | `b21d88816c445d14cef5032c3cd4abaebc1db2001fcb3435022ab6b496182ca4` |

The pure generator verifies that the runner-compatible adaptation changes only the outer transaction ownership and the installation/rollback review fuse. The old approval does not authorise the new runner-compatible bytes. No product-master or creative-document change requires changing these SQL artifacts.

## Runner contract and its evidence limits

The selected path remains the existing Supabase managed `apply_migration`, which sends the complete query and migration name to `POST /v1/projects/{ref}/database/migrations`. Supabase's [embedded-transaction guidance](https://supabase.com/kb/troubleshooting/partial-migrations-and-schema-inconsistencies-from-embedded-transactions-13ae82) explains why authored `BEGIN`/`COMMIT` must not prematurely commit the runner's transaction. Its [managed-migration documentation](https://supabase.com/docs/guides/integrations/supabase-for-platforms#make-database-changes) documents history recording and rollback on failure. Pinned MCP/CLI source corroboration is recorded in the unchanged manifest.

These are documented platform contracts and local PostgreSQL evidence. They are not an inspection of the private managed backend, a hosted installation rehearsal or proof that a future execution succeeded. The current contract and available runner must be reconfirmed before any approved execution. If the complete application SQL and history insertion cannot be established as one transaction, stop; do not switch to statement-by-statement execution, SQL Editor fragments or an improvised runner.

Native migration-history bootstrap may precede the application transaction. Inspect any `supabase_migrations` schema/table independently and distinguish an empty runner-created native history structure from a partial application installation. This package neither creates nor repairs the native migration-history authority.

## Required immediate read-only preflight

The mission's fresh read-only project observations belong in the final evidence report. They do not replace a new preflight **immediately before** any separately approved execution. Use only the Lab-specific authorised connection and retain non-sensitive metadata:

1. Independently confirm project, organisation, Free plan, accepted region, healthy state and PostgreSQL 17. Do not infer identity from a locally supplied project reference alone.
2. Run the unchanged [read-only preflight](sql-proposals/ai-lab-foundation/read-only-preflight.sql). Require `postgres` installer privileges, genuine native `auth.users`/`auth.uid()` contracts, no Auth users, no application relations or unexpected routines, no `busy_*` private schemas and no partial installation. Native platform/extension objects are expected.
3. Independently verify no migrations or deployed Edge Functions. Reconcile any unexpected native-history bootstrap before proceeding; do not delete or repair it under this approval.
4. Confirm `extensions.pgcrypto` 1.3, original role properties and privileges, automatic RLS hook definition/owner/search path, enabled `ensure_rls` event and expected tags. Require the exact pinned hook definition hash above.
5. Confirm automatic new-table API DML exposure remains disabled through global and public `postgres` default ACLs; inventory current ACLs and defaults for the post-install comparison.
6. Confirm no concurrent installer or other writer is being introduced to this fresh Lab. Respect the inner five-second lock timeout and 120-second statement timeout. Contention or unexpected state is a stop condition, not permission to raise limits or weaken checks.
7. Freeze the exact functional source commit/tree and fresh successful disposable evidence used for approval. Reconfirm the runner's current whole-migration/history transaction and acknowledgement contract.

The reviewed hook change revokes direct `EXECUTE` from `PUBLIC`, `anon`, `authenticated` and `service_role`. It does not alter, replace or disable the hook definition/event. Independent post-install checks must prove that preservation. No new hosted probe table, canary, Auth user or fixture record is authorised merely to test it.

## Future installation sequence, after separate exact approval

1. Match all target, preflight, runner and frozen-source conditions. Independently hash the fused file from the reviewed source.
2. Mechanically remove only the specific outer installation review-fuse statement in memory, independently hash the resulting bytes and require the exact approved derivative above. Keep every internal guard, timeout and SQL statement. Do not commit an unfused artifact.
3. Submit the complete derivative **once**, to the exact Lab through the selected managed migration runner with name `mission18_ai_lab_foundation`. Do not wrap the derivative in authored transaction controls or split it into separate executions. Do not automatically retry.
4. Record the acknowledgement truthfully, then obtain independent read-only application/security and native-history evidence. A successful tool acknowledgement alone is not installation verification.
5. Run the unchanged [post-install readback](sql-proposals/ai-lab-foundation/read-only-post-install.sql) only after the required objects exist, plus the [native migration receipt readback](sql-proposals/ai-lab-runner-foundation/read-only-migration-receipt.sql). Compare the native receipt's name, version, statement count and complete stored statements against the exact submitted derivative. A name-only match or differently formatted statement hash is not automatically byte-equivalent; review any runner statement-splitting/formatting difference explicitly.

The post-install decision must verify:

- Exact 28 public and six private table sets; original 69 public foundation functions and five service-only AI functions; expected owners, signatures, grants, RLS, FORCE RLS, schema privileges, column privileges and default restrictions.
- Native hook definition/hash, owner and enabled event unchanged; only the reviewed direct-EXECUTE restriction applied. Preserve native Auth/extension identities and behaviour.
- Private AI policy disabled with monthly hard limit zero. No Auth users, AI accounts, periods/allocations, tariffs, operations or events introduced. Canonical static registry entries included in the original foundation are not fictional business provisioning.
- All five AI RPCs remain service-only, including original context, finish and independent operation receipt reader. API roles have no direct private-schema/table/column access. Original authenticated RPC permissions and owner/member enforcement retain their canonical boundaries.
- Native migration history identifies the same complete installation; no unapproved migrations, provider activity, account setup, Edge deployment or publication occurred.

## Failure, uncertain acknowledgement and retaining rollback

On any error, timeout, connection loss or uncertain acknowledgement, **do not replay**. Independently inspect the native receipt, full application/private catalogue, hook ACL/defaults and policy state read-only:

- Exact complete receipt plus exact verified secure state: report installation completed; retain the lost/uncertain acknowledgement in evidence.
- No receipt plus unchanged application/security baseline: report not installed. Report any runner-created native-history bootstrap separately. A later execution still needs a fresh decision and preflight.
- Partial or inconsistent objects, receipt mismatch, unexpected grants/data or unavailable readback: report unknown/blocked. No repair, cleanup, retry, rollback, fixture setup or activation is implied.

The retaining rollback remains separately fused and requires separate owner approval. It revokes mutation authority and disables AI policy while preserving tables, records, receipts, reservations and liability history. Original finish/context and service-only independent receipt reading remain available. It is not a destructive reset, and installation approval does not authorise executing it.

## Fresh verification during this readiness mission

| Check | Actual local result |
| --- | --- |
| `node scripts/check-ai-lab-runner-foundation.mjs` | 7 passed, 0 failed; exact generation/hashes, scope, fuses, inner guards, nontransactional-command denial and retaining rollback checked; zero hosted/provider calls |
| `node scripts/check-ai-lab-foundation.mjs` | 2 passed, 0 failed; original fixed-target proposal and read-only evidence/preflight contracts checked; no connection/execution |
| Guarded disposable PostgreSQL precheck | Environment-blocked before any fixture mutation: Unix-socket connect to `/workspace/pg17-disposable/socket` returned `Operation not permitted`; no local PG rehearsal pass is claimed from that attempt |

Historical PostgreSQL/CI receipts remain historical until freshly rerun through an authorised nonproduction facility. The final mission report must record its own executed counts and exact source commit/tree. Static passes do not establish hosted installation or visual website acceptance.

## Exact next owner decision

After reviewing the fresh hosted evidence and frozen verification, the next request is **installation only**:

> Approve one runner-compatible original foundation installation exclusively in Busy Does It AI Lab `sbvkrvksnruiclcvclbd`, organisation `wrjfgasxtlznzfzmfrif`, Ireland `eu-west-1`, Free, PostgreSQL 17, using fused SHA-256 `b825989b37e2fef0f874ccdb03405a6650f8dc6ddfe27f94086952cc1cec225d` and exact outer-fuse-only derivative `231b7eecdab788f3829d93c4f1995ce111a6b2b4a953644bdc6d0f785b6a5987`, conditional on fresh identity/state/runner preflight and independent post-install security/native-receipt verification. No automatic retry and no retaining rollback execution are authorised.

The current mission has not supplied that approval. Later fictional Auth/business/Website setup must receive its own approval and generate fresh actual Lab source identities/revisions; offline source digests cannot impersonate them. Disabled Lab-specific deployment and owner-controlled Lab credentials are separate. One real v2 Quiet Light request, its exact source/wire digests, model/tariff/token limits, central reservation/readback, one-use approval and maximum £0.10 exposure require a later explicit decision. The public gateway remains offline-only. No inference, saving, publication or Gold Standard approval is implied; the reference collection remains three candidates and zero approved designs.
