# AI Lab foundation: separately reviewed runner-owned migration

**Proposal only. No hosted execution is authorised by Mission 18.** The earlier
approved artifacts remain byte-identical in `../ai-lab-foundation/` and retain
their historical approval and stop decision. Their approval does not cover this
new migration.

Target: **Busy Does It AI Lab**, `sbvkrvksnruiclcvclbd`, organisation
`wrjfgasxtlznzfzmfrif`, Ireland `eu-west-1`, Free, PostgreSQL 17. No other project
is an acceptable substitute. Ireland acceptance applies to the fictional lab.

## Confirmed failure mechanism and minimal correction

The old package owns `BEGIN`/`COMMIT`. A migration runner also owns a transaction
and appends native migration history. An embedded `COMMIT` can commit application
DDL before history is written; later history failure cannot undo that commit.
The previous synthetic counterexample correctly demonstrated this risk.

[Supabase's current troubleshooting guidance](https://supabase.com/kb/troubleshooting/partial-migrations-and-schema-inconsistencies-from-embedded-transactions-13ae82)
explicitly recommends removing authored transaction controls so the runner owns
atomicity. The [managed migration endpoint documentation](https://supabase.com/docs/guides/integrations/supabase-for-platforms#make-database-changes)
states that it records native migration history and rolls back failed migrations.

This proposal mechanically removes **one outer BEGIN and one final COMMIT** and
changes the outer review fuse to require new approval. The generator reverses
these edits and demands exact equality with the hash-pinned old source. Every
inner statement is unchanged: canonical definitions, security assertions, native
RLS hook restriction, five-second lock timeout, 120-second statement timeout,
default-off AI policy and zero budget. There is no second foundation or ledger.

The same transformation prepares a separately fused retaining rollback. It is
not an automatic error recovery step and needs its own approval. Failed migration
transactions should roll back; an uncertain acknowledgement requires inspection.

## Runner authority and limits of evidence

Proposed hosted runner: the existing Supabase `apply_migration` operation, which
forwards the **entire query** and name to
`POST /v1/projects/{ref}/database/migrations`.
[Pinned public MCP source](https://github.com/supabase/mcp/blob/7e5037bd31d765c67f657d536e28c41f32953072/packages/mcp-server-supabase/src/platform/api-platform.ts#L259)
confirms this forwarding and success/error check. It does not expose the private
managed backend or return an independently verified installation receipt.

[Pinned public CLI source](https://github.com/supabase/cli/blob/4cc97fa9fdb66a1ab91984e81333c047ae889549/apps/cli/src/command-internal/migration-apply.ts#L494)
corroborates the supported design: compatible SQL plus the native history insert
share one batch. Authored transaction boundaries follow a different path and
history is recorded afterwards. The CLI is **not claimed to be the hosted API's
implementation**. Neither a documentation promise nor a local rehearsal is a
hosted execution result.

Native `supabase_migrations` bootstrap can precede the application transaction in
the public CLI. An empty native history schema/table left by runner bootstrap is
different from a partially installed application. Preflight and post-failure
inspection must report native bookkeeping separately. This package does not
create, repair, delete or overwrite migration history.

The local PostgreSQL rehearsal wraps the complete derivative and native history
insert in **one runner-owned transaction**. It proves rollback of all application
DDL, hook ACLs and default privileges for middle/late failures, history constraint
failures, duplicate history and deferred commit-time history failure. It tests
real PostgreSQL semantics with a native configuration approximation, not a
simulated assertion about the private backend. Existing original foundation tests
continue to cover original Studio saving and budget non-replay.

## Files and hashes

| Artifact | SHA-256 |
|---|---|
| New fused install | `b825989b37e2fef0f874ccdb03405a6650f8dc6ddfe27f94086952cc1cec225d` |
| New outer-fuse-only derivative | `231b7eecdab788f3829d93c4f1995ce111a6b2b4a953644bdc6d0f785b6a5987` |
| New fused retaining rollback | `409b93dd82ccb587f5b6ea813bcc952589fe0255d12e13df030ec531fdc959d4` |
| New rollback derivative | `54dc2f25136b3f0f930ec685582e876d3367822511d865967245379d167ebea5` |
| Unchanged previously approved install | `3ebf79cdcc5614d7be3573e0ecad68ae93ec8e5c3bf751fa2c0c6cbac5a9030b` |
| Unchanged previously approved retaining rollback | `b5a43ecac26215bde42e5d537423d98e605cadca2dc784661b8bcc2414f7a079` |

The full source/target manifest is `manifest.json`. The pure generator has no
connection or executor. It never writes an unfused execution file to Git.

## Future installation sequence, only after new exact owner approval

1. Freeze functional commit/tree and successful disposable evidence. Refresh
   independent project/org/Free/region/health, PostgreSQL 17 and empty application
   state checks using the AI Lab-specific connection. Inspect Auth, migrations,
   Edge Functions, native hook definition/owner/event/ACL and default privileges.
   Reuse the original read-only preflight. No synthetic records are implied.
2. Verify that the current managed migration contract still provides one complete
   migration/history transaction, and that the available tool sends one complete
   query. If that guarantee is unavailable or contradictory, stop. Native history
   bootstrap metadata must be inventoried; do not repair a partial history.
3. Independently hash the new fused artifact. Remove **only** its new outer fuse
   in memory after approval; verify the exact derivative hash. Preserve every
   inner guard and timeout. Do not add transaction controls or split the payload.
4. Submit exactly once to the fixed project, with migration name
   `mission18_ai_lab_foundation`. Record the execution acknowledgement without
   treating it as proof. Do not create a direct-connection workaround or expose
   credentials.
5. Independently run the original read-only post-install verification and
   `read-only-migration-receipt.sql`. Verify exact 28 canonical public tables,
   six private tables, 69 original public functions plus five service-only AI
   functions, owner/grants/RLS/FORCE RLS/default restrictions, unchanged native
   hook definition/event, disabled policy and zero hard limit. No Auth users,
   accounts, allocations, tariffs, operations, events or provider activity.
6. Read back the native receipt version/name and statements. Bind it to the exact
   approved source/derivative and current catalogue; a name alone is insufficient.
   Parsing/format differences must be independently reviewed, never silently
   accepted as byte identity. Record receipt and verification hashes privately or
   as non-sensitive technical evidence.

## Failure or unknown acknowledgement

Never automatically replay. Perform only independent read-only inspection of
history, canonical/private catalogue, hook ACL/defaults and policy. Classify:

* Exact receipt + exact complete secure state: completed; preserve the lost-ack
  event and independent evidence.
* No receipt + unchanged preflight application/security baseline: not installed;
  native runner bookkeeping may exist and must be reported. A fresh decision is
  needed before any later execution.
* Receipt mismatch, partial objects, unexpected grants/data, or unavailable
  readback: **unknown / investigation required**. No retry, repair, rollback,
  destructive cleanup or activation is implied.

Any retaining rollback remains separately approved, data-preserving and keeps
finish/context/receipt access for liabilities. No provider credential access,
Auth provisioning, Edge deployment, publication or model inference is included.
