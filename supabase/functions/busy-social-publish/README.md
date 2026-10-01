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
