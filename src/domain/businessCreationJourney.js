function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function buildBusinessCreationJourney({
  businessCreationIntelligence = {},
  brandBrain = {},
  websiteDraft = null,
  miniAppsView = null,
  socialBrief = "",
  ownerBrief = "",
} = {}) {
  const shared = businessCreationIntelligence?.sharedProfile || {};
  const missing = safeArray(brandBrain?.missingForWebsite);
  const hasIdentity = !!clean(shared.businessName) && !!clean(shared.businessType);
  const hasServices = safeArray(shared.services).length > 0;
  const hasContact = !!(clean(shared.phone) || clean(shared.email));
  const websitePrepared = !!websiteDraft;
  const appPrepared = !!(miniAppsView?.hasDraft || miniAppsView?.builderPlan);
  const socialPrepared = !!clean(socialBrief);
  const briefReady = !!clean(ownerBrief);

  const steps = [
    {
      id: "understand",
      label: "Understand the business",
      status: hasIdentity && hasServices ? "complete" : "working",
      detail: hasIdentity && hasServices
        ? "BUSY has the core identity and services."
        : "BUSY still needs the core business identity or services.",
    },
    {
      id: "fill-gaps",
      label: "Fill only important gaps",
      status: missing.length ? "working" : "complete",
      detail: missing.length
        ? `${missing.length} public-business detail${missing.length === 1 ? "" : "s"} still need attention.`
        : "The shared public profile has no blocking website gaps.",
    },
    {
      id: "website",
      label: "Prepare website",
      status: websitePrepared ? "complete" : briefReady ? "ready" : "waiting",
      detail: websitePrepared
        ? "A private website draft exists."
        : "BUSY can prepare a private website from the shared profile.",
    },
    {
      id: "app",
      label: "Prepare Business App",
      status: appPrepared ? "complete" : briefReady ? "ready" : "waiting",
      detail: appPrepared
        ? "A Business App plan or draft exists."
        : "BUSY can turn the same brief into a controlled app plan.",
    },
    {
      id: "social",
      label: "Prepare social direction",
      status: socialPrepared ? "complete" : briefReady ? "ready" : "waiting",
      detail: socialPrepared
        ? "A social creation brief is ready."
        : "BUSY can reuse the same business story as the social starting brief.",
    },
    {
      id: "approve",
      label: "Owner reviews before anything goes live",
      status: websitePrepared || appPrepared || socialPrepared ? "working" : "waiting",
      detail: "Website, Business App and social publishing keep their existing approval gates.",
    },
  ];

  const readyCount = steps.filter((step) => step.status === "complete").length;
  return {
    version: "3.57",
    ownerBrief: clean(ownerBrief),
    hasIdentity,
    hasServices,
    hasContact,
    missing,
    steps,
    readyCount,
    totalSteps: steps.length,
    headline:
      readyCount >= 5
        ? "Your business launch pack is nearly ready"
        : briefReady
        ? "BUSY is ready to prepare the business"
        : "Tell BUSY what this business should become",
    recommendedAppModules: safeArray(
      businessCreationIntelligence?.recommendedAppModules
    ),
    recommendedWebsiteSections: safeArray(
      businessCreationIntelligence?.recommendedWebsiteSections
    ),
    ownerApprovalRequired:
      businessCreationIntelligence?.ownerApprovalRequired !== false,
  };
}

export { buildBusinessCreationJourney };
