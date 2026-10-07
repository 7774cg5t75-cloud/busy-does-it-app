function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function buildMiniAppProfileDraft(brandBrain = {}, businessCreationIntelligence = null) {
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
    builderIntelligence: businessCreationIntelligence
      ? {
          schemaVersion: Number(businessCreationIntelligence.schemaVersion || 1),
          source: clean(businessCreationIntelligence.source),
          sharedProfileFingerprint: clean(
            businessCreationIntelligence.sharedProfile?.fingerprint
          ),
          recommendedModules: safeArray(
            businessCreationIntelligence.recommendedAppModules
          ).map((item) => clean(item)).filter(Boolean),
          moduleReasons: safeArray(
            businessCreationIntelligence.recommendations?.app
          ).reduce((result, item) => {
            const key = clean(item?.key);
            if (key) result[key] = clean(item?.reason);
            return result;
          }, {}),
          ownerApprovalRequired:
            businessCreationIntelligence.ownerApprovalRequired !== false,
        }
      : null,
  };
}

function buildMiniAppsView(remote = {}) {
  const app = remote?.app || null;
  const versions = safeArray(remote?.versions);
  const requests = safeArray(remote?.requests);
  const requestLinks = safeArray(remote?.requestLinks);
  const requestCount30 = Math.max(0, Number(remote?.requestCount30 || 0));
  const guestRequestCount30 = Math.max(0, Number(remote?.guestRequestCount30 || 0));
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
  const builderPlan = draftConfig?.builderPlan || activeConfig?.builderPlan || null;
  const offers = safeArray(activeConfig?.offers);
  const loyalty =
    activeConfig?.loyalty && typeof activeConfig.loyalty === "object"
      ? activeConfig.loyalty
      : null;
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

  const planMissingFacts = safeArray(builderPlan?.missingFacts);
  const hasReviewedPlan = !!builderPlan;
  const draftPlanApplied =
    !!draftConfig?.builderPlan &&
    Number(app?.draft_revision || 0) > 0;
  const previewMatchesDraft =
    !!previewVersion &&
    Number(previewVersion?.source_draft_revision || 0) ===
      Number(app?.draft_revision || 0);
  const liveMatchesDraft =
    !!liveVersion &&
    Number(liveVersion?.source_draft_revision || 0) ===
      Number(app?.draft_revision || 0);

  const journeyStage = !builderPlan
    ? "describe"
    : planMissingFacts.length
    ? "answer_questions"
    : !draftPlanApplied
    ? "review_plan"
    : !previewMatchesDraft
    ? "build_preview"
    : !liveMatchesDraft
    ? "approve_go_live"
    : "live";

  const journeyLabel =
    journeyStage === "live"
      ? "Your Business App is live"
      : journeyStage === "approve_go_live"
      ? "Customer preview ready for approval"
      : journeyStage === "build_preview"
      ? "Private app built • prepare the customer preview"
      : journeyStage === "review_plan"
      ? "Review BUSY's app plan"
      : journeyStage === "answer_questions"
      ? "BUSY needs a few details"
      : "Describe the app you want";

  const builderJourney = {
    stage: journeyStage,
    label: journeyLabel,
    complete: journeyStage === "live",
    steps: [
      {
        id: "describe",
        label: "Describe the customer experience",
        status: hasReviewedPlan ? "complete" : "working",
      },
      {
        id: "facts",
        label: "Fill only the missing facts",
        status: !hasReviewedPlan
          ? "waiting"
          : planMissingFacts.length
          ? "working"
          : "complete",
      },
      {
        id: "draft",
        label: "BUSY builds the private app",
        status: draftPlanApplied ? "complete" : hasReviewedPlan && !planMissingFacts.length ? "working" : "waiting",
      },
      {
        id: "preview",
        label: "Review the real customer experience",
        status: previewMatchesDraft ? "complete" : draftPlanApplied ? "working" : "waiting",
      },
      {
        id: "live",
        label: "Owner approves Go Live",
        status: liveMatchesDraft ? "complete" : previewMatchesDraft ? "working" : "waiting",
      },
    ],
  };

  return {
    app,
    versions,
    requests,
    requestLinks,
    requestCount30,
    guestRequestCount30,
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
    builderPlan,
    builderJourney,
    offers,
    loyalty,
    builderPlanMissingFacts: safeArray(builderPlan?.missingFacts),
    builderPlanUnsupported: safeArray(builderPlan?.unsupportedRequests),
    builderPlanModules: safeArray(builderPlan?.modules),
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
    publicWebUrl: clean(app?.public_web_url),
    publicWebStatus: clean(app?.public_web_status) || "not_ready",
    publicWebVersionId: clean(app?.public_web_version_id),
    webReady:
      !!app?.current_live_version_id &&
      clean(app?.public_web_status) === "ready" &&
      clean(app?.public_web_version_id) === clean(app?.current_live_version_id) &&
      /^https:\/\//i.test(clean(app?.public_web_url)),
    guestWebReady:
      !!app?.current_live_version_id &&
      clean(app?.public_web_status) === "ready" &&
      clean(app?.public_web_version_id) === clean(app?.current_live_version_id) &&
      Number(app?.public_web_schema_version || 1) >= 2 &&
      /^https:\/\//i.test(clean(app?.public_web_url)),
    displayName:
      clean(activeConfig?.display?.name) ||
      clean(app?.display_name) ||
      "BUSY Business App",
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
