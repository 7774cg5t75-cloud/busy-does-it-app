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

  const activeJob = jobs.find((job) =>
    ["queued", "processing", "retry_wait"].includes(job.status)
  ) || null;

  const failedJob = jobs.find((job) => job.status === "failed") || null;
  const latestDomain = domains[0] || null;
  const verifiedDomain =
    domains.find((domain) =>
      ["verified", "active"].includes(domain.status)
    ) || null;

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

  return {
    website,
    deployments,
    domains,
    jobs,
    queue,
    latestDeployment,
    previewDeployment,
    liveDeployment,
    previouslyPublished,
    activeJob,
    failedJob,
    latestDomain,
    verifiedDomain,
    publicStatus,
    draftChangedSinceHosted,
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
      routingActive: domains.some(
        (domain) =>
          domain.status === "active" &&
          domain.ssl_status === "active" &&
          domain.routing_provider !== "unassigned"
      ),
    },
  };
}

export { buildWebsitePublishingView };
