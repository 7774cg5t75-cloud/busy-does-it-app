# Local C2 guard correction — owner review required

This is local management-runner preparation. It does not change the deployed
function, compiler, renderer, model request, financial controller or Website.
It supplies no default transport, execution command, credential reader or
authority. Engineering fixtures are data, never native verification evidence.
The prior D and C2 approvals must not be reused.

## Historical finding

The retained failed command returned exit 1 and
`STOP_C2_INTENT_PREFLIGHT_NO_SUBMISSION_NO_RETRY`. Its catch discarded the
assertion, exception, stage and execution timestamp. The task-local executor
log contains no matching trace. Therefore the exact historical failing
predicate and actual guard-start UTC are **unestablished**.

The last independent preflight was checked at 2026-11-09T00:38:53.414Z.
The unchanged 38-minute requirement gave an inclusive cutoff of
2026-11-09T00:39:03.237Z. The oldest financial observation gave an inclusive
five-minute cutoff of 2026-11-09T00:39:34.771Z. The first retained later clock
read was 00:39:50 UTC; it is not the guard-start time. A later read-only
diagnostic found all 27 non-clock predicate groups true. This is consistent
with a timing failure, but does not establish its historical cause.

The proven defect is loss of diagnostic evidence. Preparation also left only
9.823 seconds between independent verification and the remaining-time cutoff.
Neither observation justifies extending an authority or relaxing a gate.

## Proposed correction

`sol-c2-submission-review.mjs` records fixed predicate names, actual UTC clock
samples and original deadlines without copying source, identities, arbitrary
exceptions or approvals into diagnostics. It binds the complete named input
file set, file bytes, independent procedure hash and actual observation times.
Data and port references are snapshotted before asynchronous handoffs.

`sol-c2-private-storage.mjs` is an explicitly injected local adapter for the
existing exclusive intent and append-only diagnostic files. It requires a real
0700 directory, exclusive 0600 file creation, file fsync and directory fsync.
No filesystem or path is bound by default. The returned intent hash must match
the exact original-scope bytes supplied by the procedure. Unknown write or
acknowledgement outcomes stop for investigation; they never authorise replay.
The explicitly reviewed local inference-marker path is checked live before
intent creation. Only ENOENT proves absence; files, symlinks and uncertain IO
stop with a named diagnostic. Fresh source records do not replace this fence.

`sol-c2-management-readback.mjs` validates the entire expected artifact before
intent, using the already pinned offline Babel parser as a source-text parser.
It never imports or executes candidate code. After a future separately approved
submission, it checks native acknowledgement, catalogue and getter agreement,
all 115 runtime strings and imports, 43 renderer files, active manifest, JWT,
unchanged database semantics and only the approved function-version transition.
It truthfully distinguishes the two optional build inputs from runtime readback.

The original limits remain 300,000 ms freshness, 2,280,000 ms remaining sequence
time, 3,600,000 ms maximum D duration and 900,000 ms protected readback freshness.
Checks repeat after awaited diagnostics and after intent acknowledgement.
There is no awaited operation between the final timing check and submission.

## Complete the slow preparation before any new D

1. Freeze these local files and the existing managed-tool binding procedure.
   Verify parser availability, dependency pins, complete upload serialization,
   private transfer roundtrip, storage paths and management response schemas.
   Run offline success and fault tests. Do not claim an intent or bind live
   management/provider ports during preparation.
2. Verify unchanged source, renderer, schema, request, recipient and original
   evidence deadlines. Preserve consumed count and smoke evidence. Prepare the
   exact subsequent credential/queue/reviewer handoffs without executing them.
3. Only after separate exact authority, collect genuinely fresh observations:
   slow database inspection first, fast native/public-source metadata last.
   Complete independent review with practical headroom before every unchanged
   cutoff. A planning margin never replaces a hard gate.
4. Issue a new D only under separate authority, for at most 60 minutes and no
   later than the earliest original supporting deadline. Seal through the
   original compiler. Independently verify the resulting bytes. Obtain a new
   exact C2 deployment approval; neither previous approval carries forward.
5. After that future approval, persist safe diagnostics and evaluate the exact
   reviewed inputs at the actual clock. Validate the full readback procedure
   before intent. Claim the existing global exclusive intent once, verify its
   exact hash/durability, recheck time, and submit once through the original
   managed runner. An uncertain intent or submission stops, without retry,
   repair, deletion, termination or rollback.
6. Retain actual native tool receipts and collection times. Use management
   catalogue, source and database readbacks only. The local validator cannot
   manufacture native provenance or prove supplied timestamps are genuine.
   Lock consumption and reproducible ESZIP compilation remain unverified under
   the previously accepted managed-runtime trust basis.
7. Keep credential binding, protected queue, exact-run grant and owner gate
   release separately approved. Refresh genuine C2 evidence before queueing;
   never retimestamp it or swap it after queueing.

No new D, real intent, hosted call, credential access, reservation, inference,
spending, Website change or publication is performed by this correction.
