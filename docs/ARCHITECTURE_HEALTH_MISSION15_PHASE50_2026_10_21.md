# Mission15 Phase50 — responsibilities, recovery and fixture reliability

## Production boundaries

Four connected sweeps use existing specialist modules. No production module, store, provider, schema, approval engine or broad orchestration layer was added.

| Responsibility | Before | After |
| --- | --- | --- |
| Older catalogue enquiry | Revision mismatch prevented private quote preparation | Explicit current-facts review retains original request/reference; exact stable ID/option, current published revision and second authenticated read bind acceptance |
| Content dirty state | Text/photos/brief/channels only | Canonical source evidence, format and treatment changes participate in original Keep/Open, status, account-readback dirty indication and Home continuation |
| Quote form loading | Controller mixed price/message/date projection with setters/navigation | Existing privateQuoteCopy exports pure quoteFormFields; root retains customer lookup, state, navigation, original approvals and saves |
| Offline module loading | Nested dependency Babel work consumed outer module VM deadline | Static dependency preparation occurs before parent VM; only source-checked compiled code is reused, with fresh exports/state/IO context per runtime |

AppController **18,152 → 18,142 physical lines; 94 → 94 relative outbound imports; 751,323 → 750,710 bytes**. The useful improvement is a coherent quote-form projection separated from setters, not the ten-line reduction. All existing quote amount/fallback/message and recorded/planned-date semantics remain; no role or write authority moved. No React hook ordering changed.

Static census **1,405 → 1,409 files; 154,711 → 154,775 physical lines; 2,831 → 2,840 static relative edges; zero detected cycles**. New files are four regression scripts. Dense inherited controllers and source hooks remain maintenance risks; metrics exclude runtime/aliased dependencies and do not establish release readiness.

## Source and persistence authority

Original listing reference is customer-supplied selection, not independently verified historical facts. The current original authenticated catalogue/public projection supplies approved facts. Older references require an explicitly labelled owner review. Missing/foreign/duplicate/backwards/expired/cancelled sources and removed options fail without substitution. Newer changes between preview and Use fail before editing. Original enquiry bytes, owner amount/date and other fields remain untouched; only deliberate private wording changes.

No historical description/price was reconstructed from customer prose or private draft history. Current facts are labelled current; previous facts are unavailable through this approved projection. No booking, accepted price, stock or availability is inferred.

Source-only newsletter edits now compare original contentEvidence canonically, including format/treatment/provenance, while ignoring ephemeral source-review status outside that evidence. Legacy callers without source fields retain their original comparison contract. Actual Creator/status/account/Home callers provide current source context. Accepted source changes cannot silently disappear through a clean-editor transition; original private upsert and restoration retain exact source metadata and saved ID.

This is current-client protection, not an old-client retention fence, account write receipt, automatic synchronisation or permanent deletion. Device readback, account record matching, current source and unsaved edits stay separate. No uncertain write is retried.

## Test-loading investigation and limits

Phase49's unsuccessful Home fixture reached the existing **10,000 ms** VM limit while AppController required its dependency graph. The original parent VM timer included synchronous nested Babel transforms. Phase50 collects static import/re-export dependencies during the existing single transform and prepares them before parent evaluation. Every actual module body still executes in its original bounded VM; the exact 10,000 ms timeout, no-IO mocks, actual parent/Home assertions and overall regression-runner timeout remain unchanged.

Compilation cache is process-local, keyed by resolved filename and exact source, with fixed pinned Babel options. It stores code/dependency strings only, not exports, React slots, customer records or permissions. New runtime instances execute modules again in fresh contexts; changed source invalidates compiled code. No disk cache, package installation, skipped assertion or timeout increase.

Focused actual Home check: total5.98 seconds; 437 modules executed, parent controller VM10 ms, timeout10,000 ms. Historical Phase49 successful check6.68 seconds; its earlier failed candidate remains historical evidence. These observations isolate setup from execution; they are not a reproducible performance benchmark, customer time saved, native/device proof or a guarantee against future flakiness.

## Bounded integration follow-up

At frozen Phase50 source GitHub460a2bc5cd51cdd5011b9e5c9c9599e09cd40c62, PR26 differs from actual base3e64352e7e043812b1ba79a0609b64c251a0f4bd in **641 paths**; complete recursive trees were not truncated. No migration paths changed. Phase49's final assessed source had632 paths, followed by five documentation paths and four new Phase50 test paths. Dependency heads remain unchanged; this is inherited linear overlap, not proven textual conflicts.

Phase50 changes client specialist preparation/status and test fixtures only. No Edge, public request schema, catalogue table, snapshot schema or permission contract changed. Reuse the detailed Phase49 INTEGRATION_RISK assessment: review the base then21→23→24→25→26 only under separate integration approval, recheck actual refs/diffs, retain client/Edge/worker/standalone parity, rehearse inherited prepared catalogue schema and authoritative snapshot/RLS/CAS provisioning in separately authorised staging, and validate old/new-client field retention before release.

Older clients can still drop optional private fields through a current-revision whole-payload save; CAS is not capability/version fencing or approval of private content facts. No fake tombstone, secondary ledger or unreviewed migration was introduced.

## Remaining gates

Newsletter images remain unavailable without ownership/permitted-use/consent/revocation and reviewed local-byte contracts. No recipient import, campaign or send. Email requires lawful audience/marketing basis, unsubscribe/suppression, sender verification, costs and trusted approval/receipts.

Hosted membership/authentication/RLS/CAS, mixed-client retention, browser/mail-client/native accessibility, physical-device/OS recovery, publisher source/approval/media/receipt/uncertain outcome/cross-device/cron authority, financial/tax evidence, stacked-PR integration and release remain separately gated. Source tests do not prove production readiness or delivery. Six Home areas and bounded builder foundations remain.
