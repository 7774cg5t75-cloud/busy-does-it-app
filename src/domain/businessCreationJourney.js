function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function nextBestQuestion({ shared = {}, brandBrain = {}, miniAppsView = {} } = {}) {
  const missingLabels = new Set(
    safeArray(brandBrain?.missingForWebsite).map((item) => clean(item).toLowerCase())
  );

  const candidates = [
    {
      key: "businessName",
      priority: 100,
      missing: !clean(shared.businessName),
      question: "What is the exact trading name customers should see?",
      helper: "BUSY will use this same name across the website and Business App.",
      answerType: "text",
    },
    {
      key: "businessType",
      priority: 95,
      missing: !clean(shared.businessType),
      question: "How would you describe what the business does in a few words?",
      helper: "For example: exterior cleaning, mobile dog grooming, catering or bookkeeping.",
      answerType: "text",
    },
    {
      key: "services",
      priority: 90,
      missing:
        !safeArray(shared.services).length ||
        missingLabels.has("services") ||
        missingLabels.has("no services are saved"),
      question: "Which services should BUSY use as the public service list?",
      helper: "Services affect the website, Business App recommendations and future marketing.",
      answerType: "navigate_services",
    },
    {
      key: "serviceArea",
      priority: 85,
      missing:
        !clean(shared.serviceArea) ||
        missingLabels.has("service area") ||
        missingLabels.has("service area is unclear"),
      question: "What area does the business serve?",
      helper: "Use plain English, for example: Exeter and surrounding areas, or all of Devon.",
      answerType: "text",
    },
    {
      key: "contact",
      priority: 80,
      missing:
        !(clean(shared.phone) || clean(shared.email)) ||
        missingLabels.has("phone or email") ||
        missingLabels.has("no public contact route is recorded"),
      question: "What public phone number or email should customers use?",
      helper: "BUSY will not publish it until the relevant preview is approved.",
      answerType: "text",
    },
    {
      key: "description",
      priority: 70,
      missing:
        !clean(shared.description) ||
        missingLabels.has("public description"),
      question: "How should BUSY describe the business to a new customer?",
      helper: "A short factual description is enough. BUSY will not invent claims.",
      answerType: "multiline",
    },
    {
      key: "openingHours",
      priority: 55,
      missing: !clean(shared.openingHours),
      question: "Do you want to add public opening or contact hours?",
      helper: "This is useful across the website and Business App, but it is not required to continue.",
      answerType: "text_optional",
    },
  ];

  return (
    candidates
      .filter((item) => item.missing)
      .sort((a, b) => b.priority - a.priority)[0] || null
  );
}

function buildDependencies({
  connectedAccounts = {},
  websitePublishingView = {},
  miniAppsView = {},
} = {}) {
  return [
    {
      id: "website-provider",
      label: "Website delivery",
      blocked: !websitePublishingView?.providerState?.configured,
      requiredFor: "Publishing a hosted website",
      detail: websitePublishingView?.providerState?.configured
        ? "Website delivery provider is configured."
        : "BUSY can still build and review the website; provider setup only blocks final hosting.",
    },
    {
      id: "social-meta",
      label: "Facebook / Instagram",
      blocked: !connectedAccounts?.meta,
      requiredFor: "Publishing to Facebook or Instagram",
      detail: connectedAccounts?.meta
        ? "Meta publishing is connected."
        : "BUSY can prepare social content now and park publishing until Meta is connected.",
    },
    {
      id: "google-business",
      label: "Google Business Profile",
      blocked: !connectedAccounts?.googleBusiness,
      requiredFor: "Publishing to Google Business Profile",
      detail: connectedAccounts?.googleBusiness
        ? "Google Business Profile is connected."
        : "This does not block website, Business App or social draft preparation.",
    },
    {
      id: "business-app-live",
      label: "Business App approval",
      blocked: !miniAppsView?.hasLive,
      requiredFor: "Customer access to the live Business App",
      detail: miniAppsView?.hasLive
        ? "A Business App version is live."
        : "BUSY can prepare the plan and preview without making it public.",
    },
  ];
}

function buildPropagationPlan({
  businessCreationIntelligence = {},
  websiteDraft = null,
  miniAppsView = null,
} = {}) {
  const alignment = safeArray(businessCreationIntelligence?.alignment);
  const sharedFingerprint = clean(
    businessCreationIntelligence?.sharedProfile?.fingerprint
  );
  const websiteFingerprint = clean(
    websiteDraft?.sharedBusinessProfile?.fingerprint
  );
  const appFingerprint = clean(
    miniAppsView?.activeConfig?.publicProfile?.builderIntelligence
      ?.sharedProfileFingerprint ||
      miniAppsView?.draftConfig?.publicProfile?.builderIntelligence
        ?.sharedProfileFingerprint
  );

  const targets = [
    {
      id: "website",
      label: "Website",
      needsRefresh:
        !!websiteDraft &&
        !!sharedFingerprint &&
        !!websiteFingerprint &&
        websiteFingerprint !== sharedFingerprint,
      detail: !websiteDraft
        ? "No website draft yet."
        : websiteFingerprint && websiteFingerprint !== sharedFingerprint
        ? "Shared business facts changed since this website draft was prepared."
        : "Website is aligned with the current shared profile.",
    },
    {
      id: "business-app",
      label: "Business App",
      needsRefresh:
        !!miniAppsView?.hasDraft &&
        !!sharedFingerprint &&
        !!appFingerprint &&
        appFingerprint !== sharedFingerprint,
      detail: !miniAppsView?.hasDraft
        ? "No Business App draft yet."
        : appFingerprint && appFingerprint !== sharedFingerprint
        ? "Shared business facts changed since this app draft was prepared."
        : "Business App is aligned with the current shared profile.",
    },
    {
      id: "social",
      label: "Social direction",
      needsRefresh: false,
      detail: "Social content remains draft-only until the owner prepares or approves a post.",
    },
  ];

  return {
    targets,
    needsPropagation:
      alignment.length > 0 || targets.some((item) => item.needsRefresh),
    alignment,
  };
}

function buildBusinessCreationJourney({
  businessCreationIntelligence = {},
  brandBrain = {},
  websiteDraft = null,
  websitePublishingView = {},
  miniAppsView = null,
  connectedAccounts = {},
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
  const nextQuestion = nextBestQuestion({ shared, brandBrain, miniAppsView });
  const dependencies = buildDependencies({
    connectedAccounts,
    websitePublishingView,
    miniAppsView,
  });
  const propagation = buildPropagationPlan({
    businessCreationIntelligence,
    websiteDraft,
    miniAppsView,
  });

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
      label: "Ask only the next useful question",
      status: nextQuestion ? "working" : "complete",
      detail: nextQuestion
        ? nextQuestion.question
        : "No important business-profile question is blocking preparation.",
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
      label: "Review the complete launch pack",
      status: websitePrepared || appPrepared || socialPrepared ? "working" : "waiting",
      detail: "Public actions remain separated behind their existing approval gates.",
    },
  ];

  const readyCount = steps.filter((step) => step.status === "complete").length;
  const blockedDependencies = dependencies.filter((item) => item.blocked);

  return {
    version: "3.58",
    ownerBrief: clean(ownerBrief),
    hasIdentity,
    hasServices,
    hasContact,
    missing,
    nextQuestion,
    steps,
    readyCount,
    totalSteps: steps.length,
    dependencies,
    blockedDependencies,
    propagation,
    launchPack: {
      website: {
        prepared: websitePrepared,
        status: websitePrepared ? "Private draft ready" : "Not prepared",
      },
      businessApp: {
        prepared: appPrepared,
        status: miniAppsView?.hasLive
          ? "Live"
          : miniAppsView?.hasPreview
          ? "Preview ready"
          : appPrepared
          ? "Private plan/draft ready"
          : "Not prepared",
      },
      social: {
        prepared: socialPrepared,
        status: socialPrepared ? "Creation brief ready" : "Not prepared",
      },
    },
    headline:
      propagation.needsPropagation
        ? "BUSY has coordinated updates to review"
        : readyCount >= 5
        ? "Your business launch pack is nearly ready"
        : nextQuestion
        ? "BUSY knows the next useful question"
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
