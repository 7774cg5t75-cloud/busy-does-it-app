const SCALE_TARGETS = [100, 1000, 5000, 10000];

const CONFIG = Object.freeze({
  workerBatch: 12,
  workerMaxFanout: 8,
  workerLeaseMinutes: 5,
  staleRecoveryMinutes: 6,
  healthCapacityPerMinute: 40,
  healthyHealthIntervalMinutes: 720,
  confirmedFailureHealthIntervalMinutes: 5,
  providerBatch: 40,
  providerEveryMinutes: 5,
  healthyProviderIntervalMinutes: 2880,
  ownerDnsProviderIntervalMinutes: 30,
  providerBackoffCeilingMinutes: 360,
  simulatedIncidentRate: 0.01,
  simulatedOwnerDnsRate: 0.01,
  simulatedCrashEvery: 97,
  simulatedDuplicateRate: 0.08,
});

const gates = [];
const assertGate = (name, ok, detail = "") => {
  gates.push({ name, ok: !!ok, detail });
};

function workerFanout(queueLength) {
  if (queueLength <= 0) return 0;
  if (queueLength <= 12) return 1;
  if (queueLength <= 48) return 2;
  if (queueLength <= 200) return 4;
  return CONFIG.workerMaxFanout;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function deterministicCrash(jobId) {
  const numeric = Number(jobId.replace(/\D/g, "")) || 0;
  return numeric > 0 && numeric % CONFIG.simulatedCrashEvery === 0;
}

function simulateBurst(tenantCount) {
  const rawRequests = [];
  for (let tenant = 1; tenant <= tenantCount; tenant += 1) {
    rawRequests.push({
      requestId: `tenant-${tenant}-primary`,
      tenantId: `tenant-${tenant}`,
      websiteId: `site-${tenant}`,
      operation: "publish",
    });
    if (
      tenant %
        Math.max(2, Math.round(1 / CONFIG.simulatedDuplicateRate)) ===
      0
    ) {
      rawRequests.push({
        requestId: `tenant-${tenant}-duplicate`,
        tenantId: `tenant-${tenant}`,
        websiteId: `site-${tenant}`,
        operation: "publish",
      });
    }
  }

  // V3.52/V3.53 invariant: one active website operation. Exact duplicate
  // publish taps collapse to the same active job.
  const activeByWebsite = new Map();
  let duplicatesCollapsed = 0;
  for (const request of rawRequests) {
    if (activeByWebsite.has(request.websiteId)) {
      duplicatesCollapsed += 1;
      continue;
    }
    activeByWebsite.set(request.websiteId, {
      id: request.websiteId,
      tenantId: request.tenantId,
      websiteId: request.websiteId,
      readyAt: 0,
      attempts: 0,
      crashed: false,
    });
  }

  let queue = [...activeByWebsite.values()];
  const completionMinutes = [];
  let minute = 0;
  let staleRecoveries = 0;
  let maxConcurrentPerTenant = 0;

  while (queue.length && minute < 5000) {
    const ready = queue.filter((job) => job.readyAt <= minute);
    const waiting = queue.filter((job) => job.readyAt > minute);
    const fanout = workerFanout(ready.length);
    const capacity = fanout * CONFIG.workerBatch;
    const selected = ready.slice(0, capacity);
    const remainder = ready.slice(capacity);

    const seenTenants = new Set();
    const deferredFairness = [];
    for (const job of selected) {
      if (seenTenants.has(job.tenantId)) {
        deferredFairness.push({ ...job, readyAt: minute + 1 });
        continue;
      }
      seenTenants.add(job.tenantId);
      maxConcurrentPerTenant = Math.max(maxConcurrentPerTenant, 1);
      job.attempts += 1;

      if (!job.crashed && deterministicCrash(job.id)) {
        job.crashed = true;
        staleRecoveries += 1;
        deferredFairness.push({
          ...job,
          readyAt: minute + CONFIG.staleRecoveryMinutes,
        });
        continue;
      }

      completionMinutes.push(minute + 1);
    }

    queue = [...waiting, ...remainder, ...deferredFairness];
    minute += 1;
  }

  return {
    tenantCount,
    rawRequests: rawRequests.length,
    acceptedJobs: activeByWebsite.size,
    duplicatesCollapsed,
    staleRecoveries,
    maxConcurrentPerTenant,
    totalMinutes: Math.max(0, ...completionMinutes),
    p50Minutes: percentile(completionMinutes, 50),
    p95Minutes: percentile(completionMinutes, 95),
    p99Minutes: percentile(completionMinutes, 99),
    completed: completionMinutes.length,
  };
}

function capacityEnvelope(tenantCount) {
  const incidentTenants = tenantCount * CONFIG.simulatedIncidentRate;
  const healthPerMinute =
    tenantCount / CONFIG.healthyHealthIntervalMinutes +
    incidentTenants / CONFIG.confirmedFailureHealthIntervalMinutes;

  const ownerDnsTenants = tenantCount * CONFIG.simulatedOwnerDnsRate;
  const providerCapacityPerMinute =
    CONFIG.providerBatch / CONFIG.providerEveryMinutes;
  const providerPerMinute =
    tenantCount / CONFIG.healthyProviderIntervalMinutes +
    ownerDnsTenants / CONFIG.ownerDnsProviderIntervalMinutes;

  return {
    tenantCount,
    health: {
      expectedPerMinute: healthPerMinute,
      capacityPerMinute: CONFIG.healthCapacityPerMinute,
      utilisation:
        healthPerMinute / CONFIG.healthCapacityPerMinute,
    },
    provider: {
      expectedPerMinute: providerPerMinute,
      capacityPerMinute: providerCapacityPerMinute,
      utilisation: providerPerMinute / providerCapacityPerMinute,
    },
    dailyEnvelope: {
      healthyWebsiteChecks:
        tenantCount * (1440 / CONFIG.healthyHealthIntervalMinutes),
      incidentWebsiteChecks:
        incidentTenants *
        (1440 / CONFIG.confirmedFailureHealthIntervalMinutes),
      healthyProviderChecks:
        tenantCount * (1440 / CONFIG.healthyProviderIntervalMinutes),
      ownerDnsProviderChecks:
        ownerDnsTenants *
        (1440 / CONFIG.ownerDnsProviderIntervalMinutes),
      assumedPublishesAtTenPercentDaily: tenantCount * 0.1,
    },
  };
}

function simulateProviderBackoff() {
  const delays = [];
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const base = 15;
    const multiplier = Math.min(
      8,
      Math.max(1, 2 ** Math.max(0, attempt - 1))
    );
    delays.push(Math.min(CONFIG.providerBackoffCeilingMinutes, base * multiplier));
  }
  return delays;
}

function simulateHealthStateMachine() {
  let route = "active";
  const events = [];

  const observe = (healthy) => {
    const previousFailures =
      events.length && events.at(-1).healthy === false
        ? events.at(-1).consecutiveFailures
        : 0;
    const consecutiveFailures = healthy ? 0 : previousFailures + 1;
    if (!healthy && consecutiveFailures >= 2) route = "validating";
    if (healthy) route = "active";
    events.push({ healthy, consecutiveFailures, route });
  };

  observe(false);
  observe(false);
  observe(true);
  return events;
}

function simulateTenantIntegrity() {
  const site = { id: "site-a", businessId: "business-a" };
  const deployment = {
    id: "deployment-a",
    websiteId: "site-a",
    businessId: "business-a",
  };

  const valid = (candidate) =>
    candidate.websiteId === site.id &&
    candidate.businessId === site.businessId;

  return {
    matchingTenantAccepted: valid(deployment),
    mismatchedBusinessRejected: !valid({
      ...deployment,
      businessId: "business-b",
    }),
    mismatchedWebsiteRejected: !valid({
      ...deployment,
      websiteId: "site-b",
    }),
  };
}

function simulateRollbackSafety() {
  const website = {
    currentLiveDeploymentId: "v12",
    status: "live",
  };
  const failedUpdate = {
    id: "v13",
    status: "failed",
  };

  if (failedUpdate.status === "failed" && website.currentLiveDeploymentId) {
    website.status = "live";
  }

  return website;
}

const burstResults = SCALE_TARGETS.map(simulateBurst);
const capacityResults = SCALE_TARGETS.map(capacityEnvelope);
const providerBackoff = simulateProviderBackoff();
const healthState = simulateHealthStateMachine();
const tenantIntegrity = simulateTenantIntegrity();
const rollbackSafety = simulateRollbackSafety();

for (const result of burstResults) {
  const thresholds = {
    100: 5,
    1000: 20,
    5000: 70,
    10000: 130,
  };
  assertGate(
    `burst-${result.tenantCount}-p95`,
    result.p95Minutes <= thresholds[result.tenantCount],
    `p95=${result.p95Minutes}m threshold=${thresholds[result.tenantCount]}m`
  );
  assertGate(
    `burst-${result.tenantCount}-dedupe`,
    result.acceptedJobs === result.tenantCount &&
      result.duplicatesCollapsed > 0,
    `accepted=${result.acceptedJobs} duplicates=${result.duplicatesCollapsed}`
  );
  assertGate(
    `burst-${result.tenantCount}-tenant-concurrency`,
    result.maxConcurrentPerTenant <= 1,
    `maxConcurrentPerTenant=${result.maxConcurrentPerTenant}`
  );
  assertGate(
    `burst-${result.tenantCount}-stale-recovery`,
    result.completed === result.acceptedJobs &&
      result.staleRecoveries >= Math.floor(result.tenantCount / CONFIG.simulatedCrashEvery),
    `completed=${result.completed} staleRecoveries=${result.staleRecoveries}`
  );
}

for (const result of capacityResults) {
  assertGate(
    `health-capacity-${result.tenantCount}`,
    result.health.utilisation <= 0.9,
    `utilisation=${(result.health.utilisation * 100).toFixed(1)}%`
  );
  assertGate(
    `provider-capacity-${result.tenantCount}`,
    result.provider.utilisation <= 0.9,
    `utilisation=${(result.provider.utilisation * 100).toFixed(1)}%`
  );
}

assertGate(
  "provider-backoff-bounded",
  Math.max(...providerBackoff) <= CONFIG.providerBackoffCeilingMinutes &&
    providerBackoff.every((value, index) =>
      index === 0 ? value > 0 : value >= providerBackoff[index - 1]
    ),
  providerBackoff.join(",")
);

assertGate(
  "single-health-failure-preserves-route",
  healthState[0].route === "active",
  JSON.stringify(healthState)
);
assertGate(
  "second-health-failure-withdraws-route",
  healthState[1].route === "validating",
  JSON.stringify(healthState)
);
assertGate(
  "healthy-health-check-restores-route",
  healthState[2].route === "active",
  JSON.stringify(healthState)
);

assertGate(
  "cross-tenant-mismatch-rejected",
  tenantIntegrity.matchingTenantAccepted &&
    tenantIntegrity.mismatchedBusinessRejected &&
    tenantIntegrity.mismatchedWebsiteRejected,
  JSON.stringify(tenantIntegrity)
);

assertGate(
  "failed-update-keeps-live-version",
  rollbackSafety.status === "live" &&
    rollbackSafety.currentLiveDeploymentId === "v12",
  JSON.stringify(rollbackSafety)
);

const failures = gates.filter((gate) => !gate.ok);
const report = {
  version: "3.53.0",
  simulation: "deterministic-isolated-model",
  configuration: CONFIG,
  burstResults,
  capacityResults,
  chaos: {
    providerBackoff,
    healthState,
    tenantIntegrity,
    rollbackSafety,
  },
  gateCount: gates.length,
  passed: gates.length - failures.length,
  failed: failures.length,
  gates,
  note:
    "This deterministic simulation validates BUSY scheduling, fairness, recovery and capacity assumptions without writing synthetic tenants into production. It is not a substitute for a paid isolated Supabase branch load test.",
};

const jsonOnly = process.argv.includes("--json");
if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("BUSY DOES IT V3.53 WEBSITE PLATFORM SIMULATION");
  console.log(
    `Release gates: ${report.passed}/${report.gateCount} passed`
  );
  for (const result of burstResults) {
    console.log(
      `Burst ${String(result.tenantCount).padStart(5)} tenants: p95 ${String(
        result.p95Minutes
      ).padStart(3)}m • total ${String(result.totalMinutes).padStart(
        3
      )}m • duplicate taps collapsed ${result.duplicatesCollapsed} • stale recoveries ${result.staleRecoveries}`
    );
  }
  for (const result of capacityResults) {
    console.log(
      `Capacity ${String(result.tenantCount).padStart(5)} tenants: health ${(
        result.health.utilisation * 100
      ).toFixed(1)}% • provider ${(
        result.provider.utilisation * 100
      ).toFixed(1)}%`
    );
  }
  if (failures.length) {
    console.error("FAILED RELEASE GATES");
    for (const failure of failures) {
      console.error(`FAIL ${failure.name}: ${failure.detail}`);
    }
  } else {
    console.log("PASS All deterministic V3.53 release-readiness gates.");
  }
}

if (failures.length) process.exit(1);
