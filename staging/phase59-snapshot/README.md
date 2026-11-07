# Phase59 disposable SQL verification

Run only against an explicitly created, dedicated local PostgreSQL cluster, with TCP disabled and a mode0700 Unix-socket directory. No hosted URL is accepted. `phase59_postgres.py` checks the server data directory matches the socket directory's sibling `data`, requires an explicit reset flag and uses only `busy_phase58_disposable`. It resets that synthetic database; never point it at another cluster. Roles are cluster-wide, so use a dedicated cluster.

```
python3 scripts/testing/phase59_postgres.py \
  --bin-dir /tmp/phase59-pg/root/usr/lib/postgresql/17/bin \
  --socket /tmp/phase59-pg/socket \
  --original-functions /PRIVATE/exact-functions.sql \
  --output .test-artifacts/phase59-postgres.json \
  --allow-disposable-reset
```

The private functions input must contain the owner-supplied exact observed provisioning and creator-trigger definitions plus reviewed test grants/trigger attachment. It is kept outside Git and omitted from public output. The public provisioning harness reconstructs relevant reported table RLS; it is not a complete hosted schema export. Mock `auth.uid` is a synthetic local fixture, never proof of Supabase JWT validation.

The runner loads the unchanged Phase58 original loss demonstration and candidate writer; proves the repository fence's abort fuse; creates an ephemeral fuse-removed copy in memory for **this explicitly approved local rehearsal only**; executes prepared assertions and further negative/preservation/bootstrap/privacy/transaction tests; and checks fail-closed rollback. Expected denials have nonzero child exits recorded as expected, never hidden. The public abort fuse remains intact.

Provisioning functions retain original invoker/definer modes. No broad initialization grant is introduced. Existing-business provisioning does not repair a missing row. Ordinary member SELECT exposes owner-private JSON under the reconstructed original policy: that is a tested open privacy gap, not a successful privacy fix.

Two real local connections exercise revocation winning before a writer, and a writer holding authority until commit before revocation. Genuine JWT/PostgREST, hosted privilege inheritance, complete service writer inventory, two-device application cutover, broader supported operations and real rollback acceptance remain separately gated. Local tests do not activate or prove hosted enforcement.
