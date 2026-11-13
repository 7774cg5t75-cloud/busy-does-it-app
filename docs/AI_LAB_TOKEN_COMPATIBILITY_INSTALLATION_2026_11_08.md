# AI Lab token compatibility installed — 8 November 2026

The exact owner-approved `ai_lab_creative_output_12000_v1` migration was submitted once through the original Supabase managed migration runner and independently verified as installed. Approval is consumed and cannot be reused. No retry, repair or rollback occurred.

## Exact target, source and installed receipt

- Project: Busy Does It AI Lab, `sbvkrvksnruiclcvclbd`; organisation `wrjfgasxtlznzfzmfrif`; Ireland `eu-west-1`; PostgreSQL 17.11.
- Reviewed source commit `de6aa17b231f5e80e21732163d75b0f414f22d43`, tree `4c8bfe0966659c9b73fe76e31643f91e88d04511`. Its predecessor documentation and frozen functional source remain intact.
- Original fused installation SHA-256: `920e52c9bf0e527ef4ba4ed1bb554497c6aaa5af4c57dfc65e9eb3a1e2ca08e8`, 25,425 bytes.
- Removed only the approved outer fuse: line 5, byte offset 464, 114 bytes including its LF. Private execution derivative is 25,311 bytes, SHA-256 `901a4a22978d3cf42446874cc0fcd8896e8f6c14a38957fe97e35700932cace1`. The original reviewed public SQL/manifest/rollback files are unchanged.
- Native migration: **`20261108082851 / ai_lab_creative_output_12000_v1`**.
- Independently read native receipt contains exactly one stored SQL statement with the exact derivative SHA-256. All three prior native receipts, stored hashes and versions remain unchanged.
- Managed acknowledgement: `success:true`; submission count **1**.

Fresh official Supabase-for-Platforms source documentation reconfirmed the selected `POST /v1/projects/{ref}/database/migrations` route automatically creates native migration history and rolls changes back if the schema migration fails. Existing reviewed pinned runner source and disposable immediate/deferred history-failure evidence were rechecked locally; this is documented platform authority rather than inspection of Supabase's private backend. No embedded transaction boundaries or split execution were introduced. Five-second lock and 120-second statement timeouts and every internal fail-closed guard remained intact.

## Independently verified result

The only application catalogue change is the validated `busy_ai_private.tariffs.tariffs_max_output_check` definition:

```sql
CHECK (((max_output >= 1) AND (max_output <= 12000)))
```

The validated input constraint remains:

```sql
CHECK (((max_input >= 1) AND (max_input <= 8000)))
```

Fresh post-install verification passed **25 checks, zero mismatches**. These are hosted metadata/preservation assertions, not a newly executed application regression suite.

- All **34 table-data fingerprints** match before and after: 28 canonical public tables and six private AI-budget tables.
- Complete catalogue comparison matches after excluding only the authorised output constraint. Columns, schemas, other constraints, indexes, triggers, policies, sequences, default privileges, table/function ACLs, ownership and native hook/event are unchanged.
- All **108 expected original/B3-corrected function bodies** match. RLS/FORCE RLS and service-only context/reserve/dispatch/finish/independent receipt-reader boundaries remain intact.
- Native Auth identity, sessions, fictional business and owner membership match before/after. No sign-in or user modification occurred.
- Quiet Light Studio's exact original profile, Website and history hashes are unchanged. Profile revision 1, snapshot revision 5, Website generation 4, private Home/Services/Contact, protected owner content, Undo 3 and Redo 0 are preserved. Status remains Draft / Not published.
- AI policy remains **disabled**, monthly hard limit **0**. Accounts, tariffs, periods, operations and events remain empty; spent and reserved liability remain zero.
- Disabled creative function remains version 1 with JWT verification enabled and unchanged native ESZIP identity. No deployment or HTTP smoke replay occurred.
- Immediate pre-submission and post-install activity checks found zero competing/non-idle client operations, idle transactions, prepared transactions or ungranted locks.

Original private fused/execution SQL, exclusive one-submission intent, managed acknowledgement and full before/after evidence are retained under owner-private 0700/0600 controls outside Git. The accompanying public receipt contains technical metadata, counts and booleans only, without native owner/business identities, customer content or credentials.

## Boundaries and remaining pilot gates

Additional paid cost and provider calls are **zero**. No budget activation, tariff/allocation creation, credential configuration, provider/model call, Website write, publication or access to staging, production or Slow Roast occurred.

The independently fused retaining rollback remains available and **unexecuted**; separate exact approval is required. Its refusal to lower the limit while retained higher-output tariffs exist remains intact. No original receipts or liability history may be deleted to facilitate rollback.

The disabled smoke approval remains consumed. This migration approval is now also consumed. Neither authorises active AI or another installation.

Before the first separately approved Sol request, effective active-build provenance, intended model/account access, complete compatible token counting and all-in GBP tariff/admission evidence remain necessary. The original central controller, fresh reservation plus independent readback, settlement and unknown-outcome liability retention remain authoritative. Proposed ceilings remain Sol £0.25, Astra £1 and comparison £3; all remain unactivated.

No new application, browser or full database test run was needed for this exact pre-reviewed installation. Existing disposable compatibility evidence is 23 passed / 0 failed and remains labelled historical. Current evidence is the actual single hosted installation and independent before/after verification.
