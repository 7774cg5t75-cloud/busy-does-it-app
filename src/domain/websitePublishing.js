import { buildSeoAudit } from "./websiteManagement";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function buildWebsitePublishingView({
  remote = {},
  websiteDraft = null,
} = {}) {
  const website = remote?.website || null;
  const deployments = safeArray(remote?.deployments);
  const domains = safeArray(remote?.domains);
  const jobs = safeArray(remote?.jobs);
  const healthChecks = safeArray(remote?.healthChecks);
  const analytics = remote?.analytics || {
    days: 30,
    pageViews: 0,
    uniqueVisitors: 0,
    enquiries: 0,
    status: "foundation",
  };
  const publicProfile = remote?.publicProfile || null;
  const queue = remote?.queue || null;

  const latestDeployment = deployments[0] || null;
  const previewDeployment =
    deployments.find(
      (item) =>
        item.id === website?.current_preview_deployment_id ||
        item.state === "preview_ready"
    ) || null;
  const liveDeployment =
    deployments.find(
      (item) =>
        item.id === website?.current_live_deployment_id ||
        item.state === "live"
    ) || null;

  const previouslyPublished = deployments.filter(
    (item) =>
      !!item.published_at &&
      !!item.public_storage_path &&
      item.id !== liveDeployment?.id
  );

  const activeJob =
    jobs.find((job) =>
      ["queued", "processing", "retry_wait"].includes(job.status)
    ) || null;
  const failedJob = jobs.find((job) => job.status === "failed") || null;

  const latestDomain = domains[0] || null;
  const verifiedDomain =
    domains.find((domain) =>
      ["verified", "active"].includes(domain.status)
    ) || null;
  const routedDomain =
    domains.find(
      (domain) =>
        domain.routing_status === "active" &&
        domain.ssl_status === "active"
    ) || null;

  const latestHealth =
    healthChecks.find((item) => item.target_type === "live_alias") || null;
  const customDomainHealth =
    healthChecks.find((item) => item.target_type === "custom_domain") || null;

  const draftGeneration = Number(websiteDraft?.generation || 0);
  const hostedGeneration = Number(
    previewDeployment?.source_generation ||
      liveDeployment?.source_generation ||
      latestDeployment?.source_generation ||
      0
  );
  const draftChangedSinceHosted =
    !!websiteDraft &&
    !!latestDeployment &&
    draftGeneration > hostedGeneration;

  const publicStatus = liveDeployment
    ? draftChangedSinceHosted
      ? "Live • update available"
      : "Live"
    : previewDeployment
    ? "Preview ready"
    : activeJob
    ? activeJob.action === "prepare"
      ? "Preparing hosted preview"
      : activeJob.action === "publish"
      ? "Publishing"
      : "Restoring version"
    : failedJob
    ? "Needs attention"
    : websiteDraft
    ? "Draft only"
    : "No website draft";

  const seoAudit = buildSeoAudit(websiteDraft || {});
  const changeSummary =
    previewDeployment?.change_summary || {
      headline: previewDeployment?.change_label || "",
      items: [],
      counts: { added: 0, removed: 0, changed: 0 },
    };

  const healthStatus =
    website?.health_status ||
    latestHealth?.status ||
    (liveDeployment ? "not_checked" : "not_live");

  const healthLabel =
    healthStatus === "healthy"
      ? "Healthy"
      : healthStatus === "degraded"
      ? "Needs attention"
      : healthStatus === "down"
      ? "Down"
      : liveDeployment
      ? "Not checked yet"
      : "Not live";

  return {
    website,
    deployments,
    domains,
    jobs,
    queue,
    healthChecks,
    analytics,
    publicProfile,
    latestDeployment,
    previewDeployment,
    liveDeployment,
    previouslyPublished,
    activeJob,
    failedJob,
    latestDomain,
    verifiedDomain,
    routedDomain,
    latestHealth,
    customDomainHealth,
    publicStatus,
    healthStatus,
    healthLabel,
    seoAudit,
    changeSummary,
    draftChangedSinceHosted,
    pageCount: Number(
      previewDeployment?.page_count ||
        liveDeployment?.page_count ||
        websiteDraft?.pages?.length ||
        1
    ),
    canPrepare:
      !!websiteDraft &&
      !activeJob &&
      (!previewDeployment || draftChangedSinceHosted),
    canOpenPreview: !!previewDeployment,
    canPublish:
      !!previewDeployment &&
      previewDeployment.state === "preview_ready" &&
      previewDeployment.id !== liveDeployment?.id &&
      !activeJob,
    canOpenLive: !!clean(website?.live_url),
    canRollback: previouslyPublished.length > 0 && !activeJob,
    canCheckHealth: !!liveDeployment && !activeJob,
    queueHealth: {
      length: Number(queue?.queue_length || 0),
      oldestSeconds:
        queue?.oldest_msg_age_sec === null ||
        queue?.oldest_msg_age_sec === undefined
          ? null
          : Number(queue.oldest_msg_age_sec || 0),
      totalMessages: Number(queue?.total_messages || 0),
      status:
        Number(queue?.queue_length || 0) === 0
          ? "Clear"
          : Number(queue?.oldest_msg_age_sec || 0) > 300
          ? "Backlog needs attention"
          : "Processing",
    },
    domainState: {
      count: domains.length,
      latest: latestDomain,
      verified: verifiedDomain,
      routed: routedDomain,
      ownership:
        latestDomain?.status === "active" || latestDomain?.status === "verified"
          ? "Verified"
          : latestDomain
          ? "Waiting for verification"
          : "Not connected",
      routing:
        routedDomain
          ? "Active"
          : latestDomain?.routing_status === "error"
          ? "Routing error"
          : latestDomain?.routing_status === "pending" ||
            latestDomain?.routing_status === "validating"
          ? "Routing pending"
          : "Not configured",
      ssl:
        latestDomain?.ssl_status === "active"
          ? "Active"
          : latestDomain?.ssl_status === "error"
          ? "SSL error"
          : latestDomain
          ? "Not active"
          : "Not configured",
      routingActive: !!routedDomain,
    },
    analyticsView: {
      period: "Last 30 days",
      pageViews: Number(analytics?.pageViews || 0),
      uniqueVisitors: Number(analytics?.uniqueVisitors || 0),
      enquiries: Number(analytics?.enquiries || 0),
      status: clean(analytics?.status) || "foundation",
      collecting: ["collecting", "active"].includes(clean(analytics?.status)),
    },
  };
}

export { buildWebsitePublishingView };
