function normaliseText(value) {
  return String(value || "").trim();
}

function includesAny(value, terms = []) {
  const text = normaliseText(value).toLowerCase();
  return terms.some((term) => text.includes(String(term).toLowerCase()));
}

function buildOperationalContinuity({
  releaseCoreHealth = {},
  cloudSyncStatus = "",
  cloudSyncError = "",
  cloudConflict = null,
  socialPublishingError = "",
  connectedAccounts = {},
  diaryConnection = {},
  diarySyncStatus = "idle",
  diaryConflicts = [],
  calendarOAuthStatus = {},
  googleCalendarSyncStatus = {},
  googleCalendarConflicts = [],
  remotePushStatus = {},
  productionReadiness = {},
} = {}) {
  const issues = [];

  const addIssue = ({
    id,
    severity = "Review",
    area,
    title,
    body,
    route,
    actionLabel,
    optional = false,
  }) => {
    issues.push({
      id,
      severity,
      area,
      title,
      body,
      route,
      actionLabel,
      optional,
    });
  };

  const coreHigh = Number(releaseCoreHealth?.highCount || 0);
  const coreReview = Number(releaseCoreHealth?.reviewCount || 0);
  if (coreHigh > 0) {
    addIssue({
      id: "release-core-high",
      severity: "High",
      area: "Core records",
      title: "Core business records need attention",
      body: `${coreHigh} high-priority consistency issue${coreHigh === 1 ? "" : "s"} could distort the diary, pipeline or learning until reviewed.`,
      route: "releaseCore",
      actionLabel: "Review core health",
    });
  } else if (coreReview > 0) {
    addIssue({
      id: "release-core-review",
      severity: "Review",
      area: "Core records",
      title: "A few core records are worth reviewing",
      body: `${coreReview} lower-priority consistency item${coreReview === 1 ? "" : "s"} are visible. BUSY can keep working, but cleaning them up improves confidence.`,
      route: "releaseCore",
      actionLabel: "Review core health",
    });
  }

  const cloudStatus = normaliseText(cloudSyncStatus);
  if (cloudConflict) {
    addIssue({
      id: "cloud-conflict",
      severity: "High",
      area: "Cloud backup",
      title: "Cloud revisions disagree",
      body: "BUSY has stopped cloud writes because this device and the cloud copy disagree. Local records remain visible, but reconcile the copy before relying on sync.",
      route: "businessData",
      actionLabel: "Review cloud copy",
    });
  } else if (
    cloudSyncError ||
    includesAny(cloudStatus, [
      "unavailable",
      "needs attention",
      "local only",
      "restore needs attention",
    ])
  ) {
    addIssue({
      id: "cloud-sync",
      severity: "Review",
      area: "Cloud backup",
      title: "Cloud backup is currently limited",
      body:
        normaliseText(cloudSyncError) ||
        `Current cloud state: ${cloudStatus || "not confirmed"}. BUSY can keep working from the protected local cache while you recover sync.`,
      route: "businessData",
      actionLabel: "Open business data",
    });
  }

  const hasSocialConnection =
    !!connectedAccounts?.meta || !!connectedAccounts?.googleBusiness;
  if (hasSocialConnection && normaliseText(socialPublishingError)) {
    addIssue({
      id: "social-publishing",
      severity: "Review",
      area: "Social publishing",
      title: "A connected publishing service needs recovery",
      body: `${normaliseText(socialPublishingError)} Drafting, editing and scheduling preparation can continue without publishing anything twice.`,
      route: "socialMedia",
      actionLabel: "Open Social Media",
    });
  }

  const deviceDiaryConflicts = Array.isArray(diaryConflicts)
    ? diaryConflicts.length
    : 0;
  if (deviceDiaryConflicts > 0) {
    addIssue({
      id: "device-diary-conflict",
      severity: "High",
      area: "Device diary",
      title: "BUSY and the device diary disagree",
      body: `${deviceDiaryConflicts} booking conflict${deviceDiaryConflicts === 1 ? "" : "s"} need an explicit owner choice before BUSY changes an important booking time.`,
      route: "proactiveBusyCentre",
      actionLabel: "Resolve diary conflict",
    });
  } else if (
    diaryConnection?.status === "connected" &&
    ["error", "unavailable", "permission-denied"].includes(
      normaliseText(diarySyncStatus).toLowerCase()
    )
  ) {
    addIssue({
      id: "device-diary-sync",
      severity: "Review",
      area: "Device diary",
      title: "Device diary sync is temporarily unavailable",
      body: "BUSY work records still remain usable. Reconnect or retry the diary when convenient rather than blocking customer work.",
      route: "proactiveBusyCentre",
      actionLabel: "Open diary controls",
    });
  }

  const googleConnected =
    calendarOAuthStatus?.connection?.status === "connected";
  const googleConflicts = Array.isArray(googleCalendarConflicts)
    ? googleCalendarConflicts.length
    : Number(googleCalendarSyncStatus?.conflictCount || 0);
  if (googleConnected && googleConflicts > 0) {
    addIssue({
      id: "google-calendar-conflict",
      severity: "High",
      area: "Google Calendar",
      title: "Google Calendar has a booking conflict",
      body: `${googleConflicts} mapped booking${googleConflicts === 1 ? "" : "s"} disagree with BUSY. Nothing is silently overwritten; the owner chooses which time wins.`,
      route: "productionBridge",
      actionLabel: "Review Google Calendar",
    });
  } else if (
    googleConnected &&
    normaliseText(googleCalendarSyncStatus?.state).toLowerCase() === "error"
  ) {
    addIssue({
      id: "google-calendar-sync",
      severity: "Review",
      area: "Google Calendar",
      title: "Google Calendar sync needs another try",
      body:
        normaliseText(googleCalendarSyncStatus?.message) ||
        "BUSY records remain authoritative while the provider connection recovers.",
      route: "productionBridge",
      actionLabel: "Open calendar connection",
    });
  } else if (normaliseText(calendarOAuthStatus?.error)) {
    addIssue({
      id: "google-calendar-oauth",
      severity: "Review",
      area: "Google Calendar",
      title: "Google Calendar connection is not ready",
      body: normaliseText(calendarOAuthStatus?.error),
      route: "productionBridge",
      actionLabel: "Open Production Bridge",
      optional: true,
    });
  }

  if (normaliseText(remotePushStatus?.state).toLowerCase() === "error") {
    addIssue({
      id: "remote-push",
      severity: "Review",
      area: "Remote notifications",
      title: "Remote notification delivery needs recovery",
      body:
        normaliseText(remotePushStatus?.message) ||
        "BUSY can still be opened normally; remote push delivery is the affected extra.",
      route: "productionBridge",
      actionLabel: "Open push status",
      optional: true,
    });
  }

  const severityRank = { High: 3, Review: 2, Info: 1 };
  issues.sort(
    (a, b) =>
      (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
  );

  const highCount = issues.filter(
    (item) => item.severity === "High" && !item.optional
  ).length;
  const reviewCount = issues.filter(
    (item) => item.severity === "Review" && !item.optional
  ).length;
  const optionalIssueCount = issues.filter((item) => item.optional).length;

  const status =
    highCount > 0
      ? "Needs attention"
      : reviewCount > 0
      ? "Working with limits"
      : "All clear";

  const headline =
    status === "Needs attention"
      ? "BUSY can keep working, but one important area needs owner judgement"
      : status === "Working with limits"
      ? "BUSY can keep working while a connection recovers"
      : "Core work can continue without a connection bottleneck";

  const continueNow = [
    {
      id: "customer-work",
      title: "Customer records and live work",
      body: "Enquiries, quotes, bookings, job outcomes and customer history remain the source of truth inside BUSY.",
      route: "workHub",
      actionLabel: "Open Work",
    },
    {
      id: "business-intelligence",
      title: "Business Brain and forward planning",
      body: "Saved outcomes can still drive Business Memory, the Executive Briefing and next-best-action ranking.",
      route: "executiveBriefing",
      actionLabel: "Open briefing",
    },
    {
      id: "social-preparation",
      title: "Prepare social content safely",
      body: hasSocialConnection
        ? "BUSY can keep drafting and editing content even if a provider connection needs recovery. Publishing still keeps its explicit approval boundary."
        : "BUSY can draft and save social content before a provider is connected. Nothing is published automatically.",
      route: "socialMedia",
      actionLabel: "Open Social Media",
    },
    {
      id: "operator",
      title: "Talk to BUSY",
      body: "Voice/text planning, customer lookup and safe preparation can continue from the saved business state without granting extra authority.",
      route: "talkToBusy",
      actionLabel: "Talk to BUSY",
    },
  ];

  const nativeBlockedCount = Math.max(
    0,
    Number(productionReadiness?.blockedCount || 0)
  );

  const connectionRows = [
    {
      id: "cloud",
      label: "Cloud backup",
      state: cloudConflict
        ? "Conflict"
        : cloudSyncError ||
          includesAny(cloudStatus, ["unavailable", "needs attention", "local only"])
        ? "Limited"
        : "Usable",
      essential: true,
    },
    {
      id: "social",
      label: "Social publishing",
      state: !hasSocialConnection
        ? "Optional / not connected"
        : socialPublishingError
        ? "Needs retry"
        : "Connected",
      essential: false,
    },
    {
      id: "device-diary",
      label: "Device diary",
      state:
        diaryConnection?.status !== "connected"
          ? "Optional / not connected"
          : deviceDiaryConflicts
          ? "Conflict"
          : ["error", "unavailable", "permission-denied"].includes(
              normaliseText(diarySyncStatus).toLowerCase()
            )
          ? "Needs retry"
          : "Connected",
      essential: false,
    },
    {
      id: "google-calendar",
      label: "Google Calendar",
      state: !googleConnected
        ? "Optional / not connected"
        : googleConflicts
        ? "Conflict"
        : normaliseText(googleCalendarSyncStatus?.state).toLowerCase() === "error"
        ? "Needs retry"
        : "Connected",
      essential: false,
    },
    {
      id: "native",
      label: "Native release gates",
      state: nativeBlockedCount
        ? `${nativeBlockedCount} still pending`
        : "Ready",
      essential: false,
    },
  ];

  return {
    status,
    headline,
    highCount,
    reviewCount,
    optionalIssueCount,
    issueCount: issues.length,
    issues,
    recoveryQueue: issues,
    continueNow,
    connectionRows,
    nativeBlockedCount,
    hasSocialConnection,
    canKeepWorking: true,
  };
}

export { buildOperationalContinuity };
