# Account customer/Work inspection — review-only candidate

This is a finite **read**, not a restoration API, mutation, receipt reconciliation or deployed migration. `reader.sql` aborts before DDL unless the deliberate production fuse is separately reviewed. The client is behind the existing hard-disabled `TRUSTED_WORKSPACE_BOOTSTRAP_ENABLED`; no hosted switch was enabled.

## Original authority and supported slice

Uses the supplied private original snapshot/provisioning evidence, the existing Phase58 `busy_snapshot_private.lock_writer`, Phase60 privacy fence, Phase61 owner revision metadata, and original source-controlled Business App migrations v339 → v340 → v342 → v3180 → v3181. The unread-count migration v342 is an actual dependency of the original atomic handoff writer. The original installed invoker `busy_ensure_business` and creator-membership trigger are unchanged; identifier-only initialization privileges remain. Private exact function bodies and Product Master are not copied here.

The original request link proves customer ID and `miniapp-booking-<request UUID>` action ID. The original durable Work row proves the corresponding request/app/customer/action and diary slot. The canonical snapshot stores `customers[]` and the booking action at `replyActions[customerId]`; it does not have a separate action-ID field. This reader checks all relationships, never guesses from names/contact details, and never manufactures the missing record. Only durable confirmed/cancelled Work bookings and schema1 snapshot rows are supported. Draft requests without durable Work, generic customers and all other domains remain unavailable.

Authorization is deliberately conservative: live business **owner**, original link's `linked_by` and Work `confirmed_by` must all be the requesting actor. Other owners, admins and members are denied. This is an implementation policy for this bounded private slice, not a new broad collaboration policy. An explicit reviewed policy is required before extending shared access.

## Transaction and exposure

Trusted identity is `auth.uid()` through the established non-client-callable helper. Its membership lock precedes request/app/link/Work share locks and the original snapshot share lock. Snapshot revision and all three source timestamps are checked under those locks; timestamp strings are compared as PostgreSQL instants with original microsecond precision. The response echoes only strings actually verified. Revocation/update contenders block or fail; out-of-contract writers with conflicting lock order can deadlock/abort, which must stay a denial, never an automatic retry.

The public function is `SECURITY DEFINER`, owned by the original reviewed PostgreSQL owner, with `search_path=pg_catalog,pg_temp` and fully qualified relations/helper. EXECUTE is explicitly revoked from PUBLIC/anon/authenticated/service_role, then granted only to authenticated. The body rechecks owner identity; EXECUTE is not authorization by itself. It does not grant table, column or private-schema access. Actual deployed role inheritance, default grants, view/RPC/helper bypasses and PostgREST exposure still require separately authorized staging verification.

Return allowlist: business/actor/app/request identities; account revision/schema; exact source revisions; one customer's ID/name/service; one booking action's ID/type/status/date/time; one Work ledger ID/slot/timezone/state; `matchesLedger`, `readOnly`, `notOwnReceipt`, `canRestore:false`. No contacts, notes, replies, history, raw stamps, arbitrary arrays or nested extensions. A valid differing snapshot/Work slot is disclosed as a conflict, with diary continuation disabled; malformed/inconsistent/ambiguous records deny.

## Client and rollback

The existing account session obtains narrow current revision metadata, validates every response key and identity, and returns an observation without applying payloads or changing the global local revision. The original request conversation specialist and UI can inspect this bounded account-only context. Diary navigation requires a fresh source+account read, genuine editor epoch, unchanged actor/workspace/view and original dirty-navigation review. Unfinished reply words prevent leaving. No account customer is inserted into local arrays. No unknown outcome is cleared or own receipt reconstructed.

`rollback-readonly.sql` revokes the new reader only. It retains original rows, raw-read fence and legacy-write fence. Never reopen unrestricted reads or full-payload writes to accommodate an old client.

## Reproduction and acceptance

Use the existing approved disposable PG17 Unix-socket runtime and original Phase66 fixture, with fictional rows and private exact provisioning functions supplied outside Git. First run `phase66_postgres.py`, then:

```sh
python3 scripts/testing/account_work_postgres.py --bin-dir <verified-pg17-bin> --socket <private-socket> --baseline-report <fresh-phase66-report.json> --output <local-report.json>
BUSY_ACCOUNT_WORK_SQL_EVIDENCE=<local-report.json> node scripts/check-mission15-account-work-reader.mjs
```

The runner loads the actual original Business App migration dependencies and uses the original atomic handoff writer to establish synthetic associations. It removes only this candidate's exact fuse in memory for local rehearsal. Expected PostgreSQL denials and separate concurrent revision/revocation connections are recorded. No mocks are substituted for those SQL transactions; the fixture's synthetic `auth.uid()` is still **not** genuine Supabase JWT/PostgREST acceptance.

Before even a limited hosted rehearsal: separate owner approval; verify original schema/ACL/roles and migration order; isolated fictional owner/admin/member/co-owner/revoked/foreign JWT identities; exercise effective inherited/default/column grants, exposed views/RPCs and service bypasses; keep unsupported domains/services disabled; validate supported bootstrap/read/write client compatibility, mixed old clients and fail-closed rollback. Broad production cutover remains blocked by unsupported legitimate readers/writers and unverified hosted/device/service acceptance.
