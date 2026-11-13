# BUSY Social Publishing Edge Function

V3.5 server-side publishing layer.

It owns:

- provider connection health for Meta and Google Business Profile
- OAuth start/callback state
- Facebook Page / Instagram Professional account selection
- Google Business account/location selection
- private Supabase Storage uploads for selected post photos
- cloud-backed social drafts
- scheduled queue records
- immediate publishing
- due-post processing
- provider IDs, failures and retry metadata

## Safety switch

Real external publishing requires `BUSY_LIVE_PUBLISHING=enabled` on the server. The function deliberately leaves this off by default.

Provider secrets remain server-side:

- `META_APP_ID`
- `META_APP_SECRET`
- optional `META_GRAPH_VERSION` (defaults to v24.0)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BUSY_LIVE_PUBLISHING=enabled` only when live publishing is deliberately approved

The current single-owner prototype still uses the Supabase publishable key to identify app requests. That is not strong enough for a multi-user production publishing product, so live publishing should remain disabled until proper BUSY user authentication is added.

## Scheduler

Postgres Cron calls this function once per minute with `action=process_due`. Only rows already marked `owner_approved=true`, status `Scheduled`, and due at the current time can be picked up.

The function creates fresh signed URLs for private media at publish time rather than exposing a public media bucket.

### Offline revision-claim hardening (Mission 15 Phase 35)

The existing prototype publisher now requires a returned conditional database claim before a scanned Scheduled row or a failed-channel retry enters provider execution. The claim matches existing workspace, row, status, owner approval and `updated_at`; no schema change. Provider-result writes match the claimed revision/status. A scheduler exception remains Publishing with an explicit unconfirmed-outcome message rather than opening an automatic retry path. Existing successful channel receipts are retained.

This is source-level hardening, not activation or a new distributed exactly-once guarantee. The original prototype workspace/owner-auth architecture remains unsuitable as evidence of general multi-business publishing authority. Existing draft upsert/upload, deletion/storage ordering, cross-device reviewed-source approval, revision timestamp semantics and provider acknowledgement ambiguity require further trusted-contract review before rollout. In particular, an upsert racing a publishing claim is not corrected by this narrow claim change. Do not repeat an unknown provider operation. Any rollout needs the existing separately approved hosted/auth/provider validation; no migration, deployment, real scheduling or provider call was performed here.

### Phase 36 cancellation revision and production authority review

Cancellation now conditionally updates the exact row/workspace/status/`updated_at` revision read by the original handler. A supplied `expectedUpdatedAt` must also match that original server value. Current clients retain a distinct `cloudUpdatedAt` from authenticated post responses/queue reads and send it when available; a local edit timestamp is not substituted. Legacy clients without this field retain only the handler's read-to-update check. No new schema or provider call is required. Roll out server support before relying on this optional client precondition; an older server ignores unknown fields. Hosted contention/auth and cross-device acceptance remain separately required.

The following are explicit **requirements for a future reviewed production implementation**, not deployed features or migrations:

| Boundary | Existing limitation | Required trusted contract before production rollout |
| --- | --- | --- |
| Business authority | Fixed `prototype` workspace and configured owner-email check | Bind post/connection/media/settings rows to a real business/workspace FK; derive authorised membership and current role from verified auth server-side. Never accept a body business ID as permission. Review RLS, grants and service-role paths against genuine membership, including revocation. |
| Source and review | Client draft ID/caption plus timestamp; generic upsert can race a Publishing claim | Durable monotonic source revision and exact approved caption/channel/media/schedule digest; authenticated compare-and-swap on every mutation. New insert must not reset existing publication history. Review schema/RLS/migration and compatibility first. |
| Provider execution | Original conditional claims reduce known races, but uncertain provider results remain | Durable original attempt/claim identity and bounded reconciliation policy; retain channel-specific receipts and failures. Retry only demonstrably failed destinations; provider idempotency must be proven where available. No exactly-once promise or blind resend after unknown outcomes. |
| Media authority | New uploads already use random immutable paths, but supplied storage paths/media are reused | Resolve approved asset IDs through authenticated business/draft ownership, version and revocation checks, not arbitrary request paths. Preserve exact channel media review and public projection; audit orphan retention/cleanup. |
| Deletion and storage | Storage removal precedes row deletion; concurrent references may exist | Reviewed conditional database deletion/claim and authorised media-reference lifecycle, with safe cleanup/retention and reconcilable partial failures. Do not remove assets still referenced by current publishing work. |
| Scheduling/cancellation | Narrow conditional transitions, no general distributed transaction | Source-bound approval and revision checks across scheduling, cancellation and due processing; distinguish cancellation requested/confirmed/already executing and unknown results. Preserve original receipts. |
| Worker access | Prototype `process_due` bypasses owner login behind original prototype caller check | Dedicated restricted server/cron authority, bounded work/rate/cost policy and observable replay controls. A public/publishable API key is not a production scheduler secret. |
| Readback and rollout | Status owner response does not prove a business identity to newer private review | Return server-derived business scope/revision/attempt evidence after authorised reads. Reconcile private records without overwriting newer words or treating a queue status as delivery. Stage compatible server/client changes, then separately approve hosted RLS/auth/provider tests. |

No new distributed ledger, migration, RLS policy, hosted mutation, deployment, live scheduling, paid provider or financial operation was introduced by this review. Existing prototype provider functionality remains gated; these source changes do not make it generally tenant-safe.
