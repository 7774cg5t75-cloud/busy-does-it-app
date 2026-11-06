# Approval B — original canonical fictional owner/business setup

**Review only. Nothing in this directory creates a native Auth user, connects to
a database or authorises execution.** The installed foundation must not be rerun.
The exact target is Busy Does It AI Lab `sbvkrvksnruiclcvclbd`, organisation
`wrjfgasxtlznzfzmfrif`, Free, accepted Ireland `eu-west-1`, PostgreSQL17.
Staging, production, Slow Roast and all other projects are excluded.

## Two necessary approval checkpoints

**B1: native Auth owner.** Separately approve one fictional confirmed laboratory
owner, proposed `quiet-light-owner@busy-ai-lab.invalid`. Use the supported native
Auth administrative Create User path with confirmed email and no invitation,
confirmation, recovery or other email. The owner-controlled secure administrative
route must be verified before use. Do not paste passwords, service keys or tokens
into chat, create SQL Auth stubs, forge JWTs or modify Auth settings to make the
procedure work. Preserve the actual native UUID and a safe independent readback
of its exact email, confirmed status, nonanonymous role and email identity.

**B2: bound canonical data.** Only after B1 produces a genuine native identity can
the exact business setup be bound to that UUID. This folder deliberately contains
an **unbound fused template**, not a made-up Auth identity. UUID syntax and known
fixture-prefix rejection are input checks, never proof of native provenance.
Independent current native Auth readback and the SQL's own checks remain required.

The binder emits new exact fused SQL, SHA-256, outer-fuse-only execution SHA-256
and a manifest binding the native readback. **The owner must approve that exact
new B2 artifact and execution hash before hosted submission.** B1 approval, an
unbound template hash, a synthetic test response or foundation Approval A cannot
be reused as approval for it. No output is labelled hosted-execution-ready.

## Smallest original-authority change

The eventual B2 migration inserts exactly one row into `public.busy_businesses`
named **Quiet Light Studio**, using the original generated UUID default and the
genuine native Auth owner as `created_by`; it inserts exactly one corresponding
`public.busy_business_memberships` row with role `owner`. No new onboarding
function, table, store, policy, grant, Auth row or AI ledger is introduced.

The original `busy_connected_initialize_v1` needs an existing owner membership;
it does not create one. The installed closure denies direct service-role DML.
Use the separately reviewed postgres setup transaction instead of granting new
permissions or bypassing the canonical relationships. Subsequent profile, story,
Website and source operations remain under their existing original authority
and their separately approved scope; they are not hidden in these two inserts.

The SQL verifies the sole installed native foundation receipt
`20261106221950 / mission18_ai_lab_foundation`, its single exact statement hash
`231b7eecdab788f3829d93c4f1995ce111a6b2b4a953644bdc6d0f785b6a5987`, original
28-public/six-private/74-function closure, native RLS hook/event, relevant API
boundaries, table ownership/RLS and disabled/zero/empty AI policy and ledger.
All business-bearing public tables must be empty; the nine original static module
registry rows remain. Exactly one current confirmed nonanonymous native email
owner must match; deleted, banned, SSO and super-admin identities are refused.
Only explicit non-secret native Auth columns are selected. No password hashes,
token columns or identity payloads are read or emitted.

## Runner, locks and one submission

Use the same independently reviewed Supabase managed migration path as A, with
one entire approved B2 query and name `ai_lab_quiet_light_owner_setup_v1`. The
managed runner owns the complete data-plus-native-history transaction. The
artifact contains **no authored outer BEGIN or COMMIT** and must not be split.
Do not use an unverified multi-statement write endpoint or add transaction
controls to the managed query.

Retain the exact outer fuse until separately approved B2. Remove only that fuse
and verify the resulting hash. The pure derivative helper independently
reconstructs all bytes from the original generator and bound UUID before removal;
modified SQL or an unbound token is rejected. There is no connection/execution
option in the preparation script.

Five-second lock and120-second statement timeouts remain. Short SHARE locks on
`auth.users` and `auth.identities` protect identity binding, and SHARE ROW
EXCLUSIVE locks on the two canonical tables serialize the fresh-only pair.
Required native Auth read/lock privileges must be reconfirmed; no permission
change is an authorised workaround. Contention or any mismatch stops the whole
transaction. No retry/fallback, partial insertion or ON CONFLICT overwrite is
provided. The generated business UUID is observed after execution, never invented
as an account identity or reused from offline fixtures.

## Safe preparation and checks

Rebuild and test the unbound proposal locally:

```sh
node scripts/prepare-ai-lab-fictional-setup.mjs
node scripts/check-ai-lab-fictional-setup.mjs
```

After separately approved B1 and fresh independent native readback, prepare a
new **fused** B2 packet in a new private directory:

```sh
node scripts/prepare-ai-lab-fictional-setup.mjs --native-readback /private/native-owner-technical-readback.json --new-output /private/new-reviewed-b2-proposal
```

The `/private/` paths are illustrative placeholders, not an approved backup or
secret-storage location. The operator must select an authorised private location.
The technical JSON accepts only exact target, native foundation receipt,
minimal owner attributes and counts/timestamps. Credential fields and unknown
properties are refused. The output directory must not already exist; files are
exclusive mode0600 under mode0700 and no execution derivative is written.

Offline tests use clearly synthetic Auth records and receipt fixtures in an
isolated disposable database. They prove PostgreSQL permissions, denial,
concurrency and rollback semantics for the proposal, not real native Auth
provisioning, hosted login, email non-delivery or provider availability.

## Independent verification and uncertain acknowledgement

`read-only-verify.sql` returns counts, minimal fictional-scope identity and
canonical relationship metadata, disabled AI policy and native history hashes.
It selects no secret columns and does not return unrelated record contents.
Also retain the original complete ACL/RLS/default/hook post-install checks.

After eventual execution, require exactly one additional native B2 migration
receipt whose complete stored statement hashes to the approved B2 derivative,
exactly one correctly linked business/membership pair, unchanged native Auth
identity and schema/ACL/security state, no profile/source write from B2, and no
AI account, period, tariff, operation or event. The original A receipt must remain
unchanged. A successful tool acknowledgement alone is not enough.

If acknowledgement is lost or an error occurs, perform **read-only** inspection.
Matching complete B2 history and exact secure state establish completion; no B2
receipt plus unchanged canonical state means not completed. Partial, conflicting
or unavailable evidence is uncertain and requires investigation. Never
automatically submit again, repair, erase history or recreate the Auth owner.

No rollback is authorised. B1 Auth creation and B2 data setup are separate
transactions: if B2 fails, preserve the Auth identity and report the partial
progress. The runner must roll back the B2 pair when any statement or native
history write fails. Do not delete the owner/business, cascade data, reset a
database or apply the separate foundation retaining rollback as a shortcut.

Provider configuration/deployment, model counting/inference, spending and
publication remain separate decisions. AI policy stays disabled and limit zero.
The next product evidence remains the genuine same-source Quiet Light creative
comparison, not another generic layout collection or an automatic Gold Standard.
