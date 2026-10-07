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
  const providerActivation = remote?.providerActivation || null;
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
    healthChecks.find(
      (item) =>
        item.target_type === "custom_domain" &&
        (!latestDomain || item.domain_id === latestDomain.id)
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

  const providerLabel = providerActivation?.ready
    ? "Cloudflare production delivery active"
    : providerActivation?.applied
    ? "Cloudflare production delivery activating"
    : providerConfig.configured
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

  const pendingPreview =
    !!previewDeployment && previewDeployment.id !== liveDeployment?.id;
  const activeGoLiveJob =
    jobs.find(
      (job) =>
        ["publish", "rollback"].includes(job.action) &&
        ["queued", "processing", "retry_wait"].includes(job.status)
    ) || null;
  const targetDeploymentId =
    activeGoLiveJob?.deployment_id ||
    (pendingPreview ? previewDeployment?.id : liveDeployment?.id) ||
    "";
  const latestTargetJob =
    jobs.find(
      (job) =>
        ["publish", "rollback"].includes(job.action) &&
        (!targetDeploymentId || job.deployment_id === targetDeploymentId)
    ) || null;
  const publishFailed = latestTargetJob?.status === "failed";
  const defaultRouteHealthy =
    defaultAddress?.live && defaultDomainHealth?.status === "healthy";
  const liveAliasHealthy = healthStatus === "healthy";

  const goLiveStage = activeGoLiveJob
    ? "publishing"
    : publishFailed && (!liveDeployment || pendingPreview)
    ? "publish_failed"
    : pendingPreview
    ? "approval_ready"
    : !liveDeployment
    ? previewDeployment
      ? "approval_ready"
      : "not_ready"
    : !defaultAddress
    ? "allocating_address"
    : !defaultAddress.live
    ? deliveryStatus === "degraded"
      ? "route_attention"
      : "verifying_route"
    : !liveAliasHealthy || !defaultRouteHealthy
    ? "verifying_health"
    : "live_healthy";

  const goLiveLabel =
    goLiveStage === "live_healthy"
      ? "Live and healthy"
      : goLiveStage === "verifying_health"
      ? "Live • final health proof running"
      : goLiveStage === "route_attention"
      ? "Live version safe • BUSY address needs attention"
      : goLiveStage === "verifying_route"
      ? "Published • verifying BUSY address"
      : goLiveStage === "allocating_address"
      ? "Published • allocating BUSY address"
      : goLiveStage === "publishing"
      ? "Publishing approved version"
      : goLiveStage === "publish_failed"
      ? "Go Live needs attention"
      : goLiveStage === "approval_ready"
      ? "Preview ready for owner approval"
      : "Build and prepare a hosted preview";

  const goLiveSteps = [
    {
      id: "approval",
      label: "Owner approval",
      status: activeGoLiveJob
        ? "complete"
        : pendingPreview || (!liveDeployment && previewDeployment)
        ? "ready"
        : liveDeployment
        ? "complete"
        : "waiting",
    },
    {
      id: "public_version",
      label: "Approved version published",
      status: activeGoLiveJob
        ? "working"
        : publishFailed && (!liveDeployment || pendingPreview)
        ? "error"
        : pendingPreview
        ? "waiting"
        : liveDeployment
        ? "complete"
        : "waiting",
    },
    {
      id: "busy_address",
      label: "BUSY address allocated",
      status: defaultAddress
        ? "complete"
        : liveDeployment
        ? "working"
        : "waiting",
    },
    {
      id: "route_proof",
      label: "Cloudflare route verified",
      status: defaultAddress?.live
        ? "complete"
        : deliveryStatus === "degraded"
        ? "error"
        : defaultAddress && liveDeployment
        ? "working"
        : "waiting",
    },
    {
      id: "health",
      label: "Exact deployment health proof",
      status:
        liveAliasHealthy && defaultRouteHealthy
          ? "complete"
          : liveDeployment && defaultAddress?.live
          ? "working"
          : "waiting",
    },
  ];

  const latestDomainRecords = safeArray(latestDomain?.required_records);
  const ownershipRecords = latestDomainRecords.filter(
    (record) => clean(record?.purpose) === "ownership"
  );
  const providerDnsRecords = latestDomainRecords.filter(
    (record) => clean(record?.purpose) !== "ownership"
  );
  const domainOwnershipReady =
    !!latestDomain && ["verified", "active"].includes(latestDomain.status);
  const domainProviderReady = !!clean(latestDomain?.provider_hostname_id);
  const providerHostnameActive =
    clean(latestDomain?.provider_status?.hostnameStatus) === "active";
  const domainSslReady = latestDomain?.ssl_status === "active";
  const latestDomainRouteReady =
    latestDomain?.routing_status === "active" && domainSslReady;
  const latestDomainHealthReady =
    customDomainHealth?.status === "healthy" &&
    (!latestDomain || customDomainHealth?.domain_id === latestDomain.id);
  const domainHasError =
    latestDomain?.routing_status === "error" ||
    latestDomain?.ssl_status === "error" ||
    !!clean(latestDomain?.last_error);

  const customDomainStage = !latestDomain
    ? "not_connected"
    : !domainOwnershipReady
    ? "ownership_required"
    : domainHasError
    ? "needs_attention"
    : !domainProviderReady
    ? "provider_queued"
    : !providerHostnameActive || !domainSslReady
    ? "dns_required"
    : !latestDomainRouteReady
    ? "route_verifying"
    : !latestDomainHealthReady
    ? "health_verifying"
    : "live";

  const customDomainLabel =
    customDomainStage === "live"
      ? "Custom domain live and healthy"
      : customDomainStage === "health_verifying"
      ? "Route active • proving the live website"
      : customDomainStage === "route_verifying"
      ? "SSL active • verifying real traffic"
      : customDomainStage === "dns_required"
      ? "Add the DNS records below"
      : customDomainStage === "provider_queued"
      ? "Ownership verified • BUSY is preparing Cloudflare"
      : customDomainStage === "needs_attention"
      ? "Custom domain needs attention"
      : customDomainStage === "ownership_required"
      ? "Verify that you own this domain"
      : "Connect a domain you already own";

  const customDomainSteps = [
    {
      id: "ownership",
      label: "Domain ownership",
      status: domainOwnershipReady ? "complete" : latestDomain ? "working" : "waiting",
    },
    {
      id: "provider",
      label: "Cloudflare hostname",
      status: domainProviderReady
        ? "complete"
        : domainOwnershipReady
        ? domainHasError
          ? "error"
          : "working"
        : "waiting",
    },
    {
      id: "dns",
      label: "DNS traffic route",
      status: providerHostnameActive
        ? "complete"
        : domainProviderReady
        ? domainHasError
          ? "error"
          : "working"
        : "waiting",
    },
    {
      id: "ssl",
      label: "SSL / HTTPS",
      status: domainSslReady
        ? "complete"
        : domainProviderReady
        ? domainHasError
          ? "error"
          : "working"
        : "waiting",
    },
    {
      id: "health",
      label: "Exact website health proof",
      status: latestDomainHealthReady
        ? "complete"
        : latestDomainRouteReady
        ? "working"
        : "waiting",
    },
  ];

  const activeCustomDomain =
    domains.find(
      (domain) =>
        domain.status === "active" &&
        domain.routing_status === "active" &&
        domain.ssl_status === "active"
    ) || null;

  const customDomainPublicAddress = activeCustomDomain
    ? {
        url: `https://${activeCustomDomain.hostname}`,
        label: activeCustomDomain.hostname,
        source: "custom_domain",
      }
    : null;

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
    providerActivation,
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
    primaryPublicAddress:
      customDomainPublicAddress ||
      (defaultAddress?.live
        ? { url: defaultAddress.url, label: defaultAddress.hostname, source: "busy_domain" }
        : clean(website?.live_url)
        ? { url: clean(website.live_url), label: "Hosted live version", source: "storage_alias" }
        : null),
    canRollback: previouslyPublished.length > 0 && !activeJob,
    canCheckHealth: !!liveDeployment && !activeJob,
    canProvisionDomain:
      !!latestDomain &&
      domainOwnershipReady &&
      !latestDomainRouteReady,
    canOpenCustomDomain: !!customDomainPublicAddress,
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
      rootRoutesExcluded: !!providerPlatform?.rootRoutesExcluded,
      fallbackOriginStatus: clean(providerPlatform?.fallbackOriginStatus) || "not_connected",
      fallbackOrigin: clean(providerPlatform?.fallbackOrigin),
      activation: providerActivation,
      activationStatus:
        clean(providerActivation?.status) ||
        (providerConfig.bootstrapReady ? "activation_required" : "credentials_required"),
      activationReady: !!providerActivation?.ready,
      activationApplied: !!providerActivation?.applied,
      activationAttempted: !!providerActivation?.attempted,
      activationCheckedAt: providerActivation?.checkedAt || null,
    },
    goLiveJourney: {
      stage: goLiveStage,
      label: goLiveLabel,
      complete: goLiveStage === "live_healthy",
      needsAttention: ["publish_failed", "route_attention"].includes(goLiveStage),
      steps: goLiveSteps,
      primaryPublicAddress:
        defaultAddress?.live
          ? defaultAddress.url
          : clean(website?.live_url),
    },
    defaultAddressState: {
      address: defaultAddress,
      status:
        defaultAddress?.live
          ? "Live"
          : defaultAddress
          ? deliveryStatus === "reserved"
            ? liveDeployment
              ? "Queued for route proof"
              : "Reserved"
            : deliveryStatus === "provisioning"
            ? "Checking live route"
            : deliveryStatus === "degraded"
            ? "Route check needs attention"
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
      ownership: domainOwnershipReady
        ? "Verified"
        : latestDomain
        ? "Waiting for verification"
        : "Not connected",
      routing: latestDomainRouteReady
        ? "Active"
        : latestDomain?.routing_status === "error"
        ? "Routing error"
        : latestDomain?.routing_status === "validating"
        ? "Provider ready • validating real route"
        : latestDomain?.routing_status === "pending"
        ? "Routing pending"
        : "Not configured",
      ssl: domainSslReady
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
      requiredRecords: latestDomainRecords,
      recordsToAdd:
        customDomainStage === "live"
          ? []
          : domainOwnershipReady
          ? providerDnsRecords
          : ownershipRecords,
      providerStatus: latestDomain?.provider_status || {},
      routingActive: latestDomainRouteReady,
      publicAddress: customDomainPublicAddress,
      journey: {
        stage: customDomainStage,
        label: customDomainLabel,
        complete: customDomainStage === "live",
        needsAttention: customDomainStage === "needs_attention",
        steps: customDomainSteps,
        lastError: clean(latestDomain?.last_error),
      },
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
