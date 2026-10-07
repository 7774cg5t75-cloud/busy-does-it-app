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
    requests: 0,
    visits: 0,
    edgeBytes: 0,
    status: "foundation",
  };
  const usage = remote?.usage || {
    days: 30,
    deployments: 0,
    publishedVersions: 0,
    artifactBytes: 0,
    requests: 0,
    visits: 0,
    edgeBytes: 0,
    healthChecks: 0,
    activeCustomDomains: 0,
  };
  const signalRuns = safeArray(remote?.signalRuns);
  const enquiryAttributions = safeArray(remote?.enquiryAttributions);
  const providerConfig = remote?.providerConfig || {
    provider: "cloudflare_saas",
    configured: false,
    hasApiToken: false,
    hasZoneId: false,
    hasCnameTarget: false,
    rootDomain: "busydoesit.co.uk",
    baseDomainConfigured: true,
    baseDomain: "busydoesit.co.uk",
    cnameHost: "sites.busydoesit.co.uk",
    hasAccountId: false,
    bootstrapReady: false,
  };
  const providerPreflight = remote?.providerPreflight || null;
  const providerPlatform = remote?.providerPlatform || null;
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
  const defaultDomainHealth =
    healthChecks.find((item) => item.target_type === "default_domain") || null;
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

  const providerLabel = providerConfig.configured
    ? "Cloudflare for SaaS connected"
    : "Cloudflare setup required";

  const deliveryStatus = clean(website?.delivery_status) || "not_configured";
  const defaultAddress =
    website?.default_hostname
      ? {
          hostname: website.default_hostname,
          url: website.default_url || `https://${website.default_hostname}`,
          status: deliveryStatus,
          live: deliveryStatus === "active",
        }
      : null;

  const lastDomainSignal =
    signalRuns.find((run) => run.signal_type === "domain_sync") || null;
  const lastAnalyticsSignal =
    signalRuns.find((run) => run.signal_type === "analytics_sync") || null;

  return {
    website,
    deployments,
    domains,
    jobs,
    queue,
    healthChecks,
    analytics,
    usage,
    signalRuns,
    enquiryAttributions,
    providerConfig,
    providerPreflight,
    providerPlatform,
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
    defaultDomainHealth,
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
    canOpenDefaultAddress: !!defaultAddress?.live,
    canRollback: previouslyPublished.length > 0 && !activeJob,
    canCheckHealth: !!liveDeployment && !activeJob,
    canProvisionDomain:
      !!latestDomain &&
      ["verified", "active"].includes(latestDomain.status) &&
      !["active"].includes(latestDomain.routing_status),
    providerState: {
      provider: providerConfig.provider || "cloudflare_saas",
      configured: !!providerConfig.configured,
      label: providerLabel,
      baseDomainConfigured: !!providerConfig.baseDomainConfigured,
      baseDomain: clean(providerConfig.baseDomain),
      tokenReady: !!providerConfig.hasApiToken,
      zoneReady: !!providerConfig.hasZoneId,
      targetReady: !!providerConfig.hasCnameTarget,
      accountReady: !!providerConfig.hasAccountId,
      bootstrapReady: !!providerConfig.bootstrapReady,
      cnameHost: clean(providerConfig.cnameHost) || "sites.busydoesit.co.uk",
      lastDomainSignal,
      lastAnalyticsSignal,
      rootDomain: clean(providerConfig.rootDomain) || "busydoesit.co.uk",
      preflight: providerPreflight,
      rootOnCloudflare: !!providerPreflight?.rootOnCloudflare,
      baseDomainRoutable: !!providerPreflight?.baseDomainRoutable,
      activationStatus: clean(providerPreflight?.status) || "not_checked",
      checkedAt: providerPreflight?.checkedAt || null,
      nameservers: safeArray(providerPreflight?.rootNameservers),
      statusReachable: remote?.providerStatusReachable !== false,
      statusError: clean(remote?.providerStatusError),
      routerScriptReady: !!providerPlatform?.routerScriptReady,
      routerRouteReady: !!providerPlatform?.routerRouteReady,
      fallbackOriginStatus: clean(providerPlatform?.fallbackOriginStatus) || "not_connected",
      fallbackOrigin: clean(providerPlatform?.fallbackOrigin),
    },
    defaultAddressState: {
      address: defaultAddress,
      status:
        defaultAddress?.live
          ? "Live"
          : defaultAddress
          ? deliveryStatus === "reserved"
            ? "Reserved"
            : deliveryStatus === "provisioning"
            ? "Provisioning"
            : deliveryStatus === "degraded"
            ? "Needs attention"
            : deliveryStatus === "error"
            ? "Delivery error"
            : "Not live"
          : providerConfig.baseDomainConfigured
          ? providerPreflight?.rootOnCloudflare
            ? "Waiting for delivery routing"
            : "Waiting for Cloudflare nameservers"
          : "BUSY platform domain not configured",
    },
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
          ? latestDomain.routing_status === "validating"
            ? "Provider ready • validating real route"
            : "Routing pending"
          : "Not configured",
      ssl:
        latestDomain?.ssl_status === "active"
          ? "Active"
          : latestDomain?.ssl_status === "error"
          ? "SSL error"
          : latestDomain?.ssl_status === "provisioning"
          ? "Provisioning"
          : latestDomain
          ? "Not active"
          : "Not configured",
      provider: clean(latestDomain?.routing_provider) || "unassigned",
      providerHostnameId: clean(latestDomain?.provider_hostname_id),
      requiredRecords: safeArray(latestDomain?.required_records),
      providerStatus: latestDomain?.provider_status || {},
      routingActive: !!routedDomain,
    },
    analyticsView: {
      period: "Last 30 days",
      pageViews: Number(analytics?.pageViews || 0),
      uniqueVisitors: Number(analytics?.uniqueVisitors || 0),
      enquiries: Number(analytics?.enquiries || 0),
      requests: Number(analytics?.requests || 0),
      visits: Number(analytics?.visits || 0),
      edgeBytes: Number(analytics?.edgeBytes || 0),
      providerRows: Number(analytics?.providerRows || 0),
      lastSyncAt: analytics?.lastSyncAt || null,
      status: clean(analytics?.status) || "foundation",
      collecting:
        Number(analytics?.providerRows || 0) > 0 ||
        ["collecting", "active"].includes(clean(analytics?.status)),
    },
    usageView: {
      period: "Last 30 days",
      deployments: Number(usage?.deployments || 0),
      publishedVersions: Number(usage?.publishedVersions || 0),
      artifactBytes: Number(usage?.artifactBytes || 0),
      requests: Number(usage?.requests || 0),
      visits: Number(usage?.visits || 0),
      edgeBytes: Number(usage?.edgeBytes || 0),
      healthChecks: Number(usage?.healthChecks || 0),
      activeCustomDomains: Number(usage?.activeCustomDomains || 0),
    },
    enquiryView: {
      count: enquiryAttributions.length,
      latest: enquiryAttributions[0] || null,
      hasRealAttribution: enquiryAttributions.length > 0,
    },
  };
}

export { buildWebsitePublishingView };
