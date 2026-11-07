# Phase64 first-Enquiry subset — review and disposable rehearsal only

`first-enquiry.sql` retains a deliberate transaction-aborting production fuse. It is not a tracked Supabase migration and must not be applied to either hosted database. The local Phase64 runner strips only the exact known fuse in a synthetic, guarded disposable database. No client or service rollout switch is enabled.

## Original semantics and supported subset

Source: original `AppController.saveQuickCapture`, `openInboxItem`, `fileSafeInboxItem` and `runtime.addDaysFromISO`; original table/provisioning evidence from Phases58–59. This candidate is **manual owner-reviewed first Enquiry from an already recorded Pending Inbox item**. It is not Safe Autopilot, existing-customer matching, forced-new, a standalone request conversion or initial source registration.

It requires the original customer collection and intake history to be absent/empty, no previous Filed Inbox item, exactly one Pending source, unchanged full source hash, current schema1/revision, live owner membership and no colliding Work action identity. The source must have text, an attributed source name, no screenshots/vision/AI analysis and no known non-Enquiry stage. Unsupported inputs fail closed. Missing customer history is not permission to restore a deleted record; retained filing/intake evidence denies reuse. No resurrection/idempotency guarantee beyond these exact current-source and CAS constraints is claimed.

Finite capture keys: customerId, enquiryId, sourceRecordId, intakeId, activityId, sourceHash, name, phone, email, address, service, eventDate, eventTime, note, confidence. All are required strings. Empty optional strings are not updates to other records. Unknown keys, caller-supplied stage/consent/financial fields and arbitrary paths are refused. The actor is server-derived; expected schema is fixed1. Date/time are explicitly owner-recorded UTC context, not authenticated external-event evidence or an appointment. This time convention needs client presentation review before cutover.

Stable IDs must be supplied from the original review and retained for exact receipt verification; there is no silent client-ID replacement. The server constructs only the original Enquiry customer/sourceRecords/activity/lifecycle/intakeLog fields and patches the existing Inbox item's fixed Filed fields. Unknown root and Inbox extensions are preserved, never returned. Other customers are deliberately unsupported by this FIRST-filing subset; no original matching policy is bypassed. Other Work actions, website content and unknown fields remain untouched.

Original `contactOk:true` new-customer default is preserved as the application's contact preference. It is **not** verified customer consent, marketing eligibility, provider authority, message delivery or permission to contact anyone. No private reply, booking, quote, payment, completed work or customer communication is created. The receipt returns only exact business/actor/operation/IDs/revision/schema/stage, not raw records or arbitrary JSON.

## Deliberate limitations and integration gap

The RPC is executed only by direct synthetic PostgreSQL tests. **It is not wired to the production Quick Capture account path.** Secure `saveQuickCapture` still denies filing and preserves capture fields. A client cannot invent the source hash, treat a local source stamp as authenticated account evidence, or upload the complete Pending item to satisfy this prerequisite.

Before wiring, provide a narrow owner-only Pending-source review projection and original capture review ticket bound to exact actor/business/source/revision, corrected fields, typing/view/scope and stable IDs. Recheck before one-use submission. Require exact committed receipt, preserve unsaved capture on known failure/uncertainty and reconcile by observation without replay. A truly empty new account also needs a separately reviewed finite owner-supplied source-registration contract. Discovery currently requires an existing eligible private saved reply; first filing alone does not create one. A first-reply creation operation/projection is also required for the entire requested capture→filing→first reply→recovery sequence.

Do not enable this RPC/fences merely because SQL and original-parent field parity tests pass. Migration ordering, genuine JWT/PostgREST, effective/default/inherited privileges, source visibility, role revocation, realistic data size/locking, service consumers, browser/device review and fail-closed rollback need separately approved staging. Existing matching, forced-new, unknown source types, media, import/restore and financial stages stay denied.

`rollback-readonly.sql` revokes this finite operation, retains data and both original raw-read/full-write fences. It never restores destructive legacy access. Production/release authority remains separate.
