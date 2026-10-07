function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function buildMiniAppProfileDraft(brandBrain = {}) {
  const brief = brandBrain?.websiteBrief || {};
  return {
    businessName: clean(brief.businessName),
    businessType: clean(brief.businessType),
    tagline: clean(brief.tagline),
    description: clean(brief.description),
    about: clean(brief.about),
    differentiators: clean(brief.differentiators),
    serviceArea: clean(brief.serviceArea),
    contact: {
      phone: clean(brief.phone),
      email: clean(brief.email),
      openingHours: clean(brief.openingHours),
      social: {
        facebook: clean(brief.social?.facebook),
        instagram: clean(brief.social?.instagram),
      },
    },
    services: safeArray(brief.services).map((service) => ({
      id: clean(service.id),
      name: clean(service.name),
      description: clean(service.description),
    })),
    assets: {
      hero: brief.heroAsset || null,
      gallery: safeArray(brief.photos).slice(0, 24),
    },
    theme: {
      mood: clean(brief.visualStyle),
      primary: clean(brief.colours?.[0]),
      secondary: clean(brief.colours?.[1]),
    },
  };
}

function buildMiniAppsView(remote = {}) {
  const app = remote?.app || null;
  const versions = safeArray(remote?.versions);
  const requests = safeArray(remote?.requests);
  const requestLinks = safeArray(remote?.requestLinks);
  const entrySummary = safeArray(remote?.entrySummary);
  const catalog = safeArray(remote?.catalog);
  const draftConfig = app?.draft_config || null;

  const previewVersion =
    versions.find((item) => item.id === app?.current_preview_version_id) ||
    versions.find((item) => item.state === "preview_ready") ||
    null;
  const liveVersion =
    versions.find((item) => item.id === app?.current_live_version_id) ||
    versions.find((item) => item.state === "live") ||
    null;

  const activeConfig =
    previewVersion?.config ||
    draftConfig ||
    liveVersion?.config ||
    null;

  const modules = safeArray(activeConfig?.modules);
  const availableModules = catalog.filter((item) => item.status === "available");
  const plannedModules = catalog.filter((item) => item.status === "planned");
  const enabledModules = modules.filter((item) => item.enabled);
  const actionableModules = enabledModules.filter(
    (item) => item.capabilities?.customer_action
  );

  const linkByRequest = new Map(
    requestLinks.map((item) => [item.request_id, item])
  );
  const linkedRequests = requests.filter((item) => linkByRequest.has(item.id));
  const unlinkedRequests = requests.filter((item) => !linkByRequest.has(item.id));
  const pendingRequests = requests.filter((item) =>
    ["received", "reviewing"].includes(item.status)
  );
  const acceptedRequests = requests.filter((item) => item.status === "accepted");
  const unreadRequests = requests.filter(
    (item) => Number(item.business_unread_count || 0) > 0
  );
  const businessUnreadTotal = unreadRequests.reduce(
    (total, item) => total + Math.max(0, Number(item.business_unread_count || 0)),
    0
  );

  const entryCounts = entrySummary.reduce(
    (counts, row) => {
      const source = clean(row?.source) || "unknown";
      const stage = clean(row?.stage) || "app_open";
      const value = Math.max(0, Number(row?.event_count || 0));
      counts.total += value;
      counts.bySource[source] = (counts.bySource[source] || 0) + value;
      counts.byStage[stage] = (counts.byStage[stage] || 0) + value;
      return counts;
    },
    { total: 0, bySource: {}, byStage: {} }
  );

  const statusLabel = !app
    ? "Not built"
    : app.status === "live"
    ? app.discoverable
      ? "Live • listed in BUSY Apps"
      : "Live • unlisted"
    : app.status === "update_pending"
    ? "Live • draft update available"
    : app.status === "preview_ready"
    ? "Preview ready"
    : app.status === "failed"
    ? "Needs attention"
    : "Draft";

  return {
    app,
    versions,
    requests,
    requestLinks,
    entrySummary,
    entryCounts,
    linkedRequests,
    unreadRequests,
    businessUnreadTotal,
    unlinkedRequests,
    linkByRequest,
    catalog,
    previewVersion,
    liveVersion,
    draftConfig,
    activeConfig,
    modules,
    availableModules,
    plannedModules,
    enabledModules,
    actionableModules,
    pendingRequests,
    acceptedRequests,
    unlinkedPendingRequests: pendingRequests.filter(
      (item) => !linkByRequest.has(item.id)
    ),
    statusLabel,
    hasDraft: !!draftConfig,
    hasPreview: !!previewVersion,
    hasLive: !!liveVersion,
    isDiscoverable: !!app?.discoverable,
    canPrepare:
      !!app &&
      !!draftConfig &&
      Number(app.draft_revision || 0) >
        Number(previewVersion?.source_draft_revision || 0),
    canPublish:
      !!previewVersion &&
      previewVersion.id !== liveVersion?.id &&
      previewVersion.state === "preview_ready",
    canToggleModules: !!app && !!draftConfig,
    publicSlug: clean(app?.public_slug),
    displayName:
      clean(activeConfig?.display?.name) ||
      clean(app?.display_name) ||
      "BUSY Mini App",
    category:
      clean(activeConfig?.display?.category) ||
      clean(app?.category),
    tagline:
      clean(activeConfig?.display?.tagline) ||
      clean(app?.tagline),
    changeSummary:
      previewVersion?.change_summary || {
        headline: previewVersion?.change_label || "",
        items: [],
        counts: { added: 0, removed: 0, changed: 0 },
      },
  };
}

function miniAppModuleLabel(key = "") {
  const labels = {
    business_profile: "Business profile",
    services: "Services",
    gallery: "Gallery",
    contact: "Contact",
    enquiry: "Enquiry",
    booking_request: "Booking request",
    offers: "Offers",
    loyalty: "Loyalty",
    payments: "Payments",
  };
  return labels[key] || key;
}

export {
  buildMiniAppProfileDraft,
  buildMiniAppsView,
  miniAppModuleLabel,
};
