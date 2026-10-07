# V3.53 Website Release Readiness

V3.53 proves the website platform's **scheduling and recovery assumptions** without inserting synthetic customers into the production BUSY database.

## Release target

The deterministic simulator exercises 100, 1,000, 5,000 and 10,000 synthetic tenants. It covers:

- burst publishing and duplicate taps;
- one active website operation per tenant;
- atomic worker leases and stale-worker recovery;
- tenant-fair worker batches;
- Cloudflare/provider retry backoff;
- single-failure versus confirmed-failure health behaviour;
- cross-tenant identity mismatches;
- failed-update rollback safety;
- health/provider scheduler capacity; and
- a provider/health/publishing operation envelope for later cost modelling.

The simulator runs in the Production foundation workflow. A future version cannot silently weaken one of these assumptions without failing CI.

## Deterministic burst results

The CI simulator injects duplicate taps and one stale-worker crash for roughly every 97 jobs. The modeled p95 completion times are:

| Synthetic tenants | Duplicate taps collapsed | Stale jobs recovered | p95 completion | Total drain time |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 8 | 1 | 2 min | 9 min |
| 1,000 | 83 | 10 | 11 min | 18 min |
| 5,000 | 416 | 51 | 50 min | 60 min |
| 10,000 | 833 | 103 | 100 min | 113 min |

These are queue-model results, not real Edge/network latency measurements. They prove the release assumptions remain internally consistent and that crash recovery does not lose accepted work.

## Capacity model

The model deliberately assumes a non-zero incident load rather than an all-healthy fleet:

| Tenants | Health work/min | Health capacity used | Provider work/min | Provider capacity used |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 0.34 | 0.8% | 0.07 | 0.9% |
| 1,000 | 3.39 | 8.5% | 0.68 | 8.5% |
| 5,000 | 16.94 | 42.4% | 3.40 | 42.5% |
| 10,000 | 33.89 | 84.7% | 6.81 | 85.1% |

Assumptions: 1% of sites are in a confirmed-health-failure state, 1% of domains are waiting on owner DNS, healthy website checks are spread over 12 hours, healthy Cloudflare provider reconciliation is spread over 48 hours, the health scheduler can select 40 sites per minute, and provider reconciliation can select 40 domains every five minutes.

These are **capacity assumptions**, not promises of customer traffic or a monetary bill.

## Daily workload envelope

At 10,000 tenants the deterministic model expects approximately:

- 20,000 scheduled healthy-site checks/day;
- 28,800 extra health checks/day if 1% of sites are in confirmed failure;
- 5,000 healthy provider reconciliations/day;
- 4,800 extra provider checks/day if 1% of domains are awaiting DNS; and
- 1,000 publish operations/day if 10% of businesses publish on a given day.

This gives BUSY a measurable workload envelope for Supabase/Cloudflare cost and capacity monitoring without inventing a £ figure before real staging measurements exist.

## Burst handling

V3.53 adds a backlog-sensitive worker scheduler. The minute scheduler fans out between zero and eight worker invocations according to queue depth, with up to 12 jobs offered to each worker. Immediate user-triggered wakes are coalesced to avoid creating one Edge invocation per button tap during a burst.

Atomic leases and the V3.52 one-operation-per-website rule remain the source of truth, so extra worker concurrency cannot make two workers mutate the same website job.

## Live release-readiness snapshot

`busy_website_release_readiness()` is service-role-only. It reports whether the worker, health, provider and retention schedulers are active and includes current queue/retry pressure. Normal authenticated app users cannot call it.

The snapshot is deliberately separate from the deterministic simulator: current production pressure can be healthy while a design is still unscalable, and a scalable design can be idle because there are no live tenants yet.

## What this does not claim

This is not a paid, real-network load test against a cloned Supabase project. Creating an isolated Supabase branch has a separate platform cost and requires explicit cost confirmation. Until that is approved, V3.53 uses deterministic isolated simulation plus live non-destructive production smoke checks.

A paid staging run should eventually be used to measure real database latency, Edge cold/warm runtimes, storage throughput, network/provider latency and monetary cost under synthetic load before App Store launch.
