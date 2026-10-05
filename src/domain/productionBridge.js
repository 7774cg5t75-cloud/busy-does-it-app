function readinessItem(id, label, state, detail) {
  const normalized =
    state === "ready"
      ? { label: "Ready", tone: "green" }
      : state === "test"
      ? { label: "Test build", tone: "blue" }
      : state === "blocked"
      ? { label: "Blocked", tone: "amber" }
      : { label: "Set up", tone: "amber" };
  return { id, label, state, detail, ...normalized };
}

function maskPushToken(value = "") {
  const token = String(value || "");
  if (token.length < 18) return token ? "Registered" : "";
  return `${token.slice(0, 10)}…${token.slice(-7)}`;
}

function buildProductionReadiness({
  releaseCoreHealth,
  cloudInitialised,
  ownerSignedIn,
  easProjectId,
  expoGoPreview,
  scheme,
  iosBundleIdentifier,
  androidPackage,
  remotePushStatus,
  calendarOAuthStatus,
  googleCalendarSyncStatus,
  productionWatchStatus,
  easProfilesConfigured,
} = {}) {
  const coreHealthy = !Number(releaseCoreHealth?.highCount || 0);
  const nativeIdentityReady =
    !!scheme && !!iosBundleIdentifier && !!androidPackage;
  const easLinked = !!easProjectId;
  const pushRegistered = remotePushStatus?.state === "registered";
  const calendarBackend = !!calendarOAuthStatus?.configured;
  const calendarConnected =
    calendarOAuthStatus?.connection?.status === "connected";
  const calendarSynced = googleCalendarSyncStatus?.state === "synced";
  const productionWatchReady = productionWatchStatus?.configured === true;

  const items = [
    readinessItem(
      "core",
      "Core lifecycle",
      coreHealthy ? "ready" : "blocked",
      coreHealthy
        ? "Release Core has no high-priority consistency issue."
        : `${releaseCoreHealth?.highCount || 0} high-priority core issue${releaseCoreHealth?.highCount === 1 ? "" : "s"} still need attention.`
    ),
    readinessItem(
      "cloud",
      "Signed-in cloud workspace",
      ownerSignedIn && cloudInitialised ? "ready" : "setup",
      ownerSignedIn && cloudInitialised
        ? "Authenticated business cloud persistence is active."
        : "Sign in and initialise the business cloud before production integrations."
    ),
    readinessItem(
      "identity",
      "Native app identity",
      nativeIdentityReady ? "ready" : "setup",
      nativeIdentityReady
        ? `${iosBundleIdentifier} • ${androidPackage} • ${scheme}://`
        : "Bundle IDs and an app URL scheme are required before native release builds."
    ),
    readinessItem(
      "eas-profiles",
      "EAS build profiles",
      easProfilesConfigured ? "ready" : "setup",
      easProfilesConfigured
        ? "Development, preview and production profiles are committed."
        : "Create eas.json build profiles."
    ),
    readinessItem(
      "eas-link",
      "EAS project link",
      easLinked ? "ready" : "setup",
      easLinked
        ? "An EAS project ID is available to the native runtime."
        : "Run EAS project configuration once with the Expo account to generate the project ID."
    ),
    readinessItem(
      "dev-build",
      "Native development build",
      expoGoPreview ? "test" : "ready",
      expoGoPreview
        ? "Current QR is still Expo Go/Snack. Keep it as a fallback while the first development build is created."
        : "Running outside Expo Go with the native production bridge available."
    ),
    readinessItem(
      "remote-push",
      "Remote push device registration",
      pushRegistered ? "ready" : easLinked && !expoGoPreview ? "setup" : "blocked",
      pushRegistered
        ? `This device is registered: ${maskPushToken(remotePushStatus?.token)}`
        : !easLinked
        ? "Waiting for an EAS project ID."
        : expoGoPreview
        ? "Remote push registration is intentionally deferred to a development build."
        : "Register this signed-in device for remote pushes."
    ),
    readinessItem(
      "google-calendar-backend",
      "Google Calendar OAuth backend",
      calendarBackend ? "ready" : "setup",
      calendarBackend
        ? "Server-side OAuth credentials are available; tokens remain server-only."
        : "Google OAuth credentials still need to be configured for the Calendar bridge."
    ),
    readinessItem(
      "google-calendar-connection",
      "Google Calendar connection",
      calendarConnected ? "ready" : calendarBackend && !expoGoPreview ? "setup" : "blocked",
      calendarConnected
        ? calendarOAuthStatus?.connection?.accountEmail ||
          "Google Calendar connected."
        : expoGoPreview
        ? "The OAuth callback uses busydoesit:// and must be tested in the native development build."
        : "Connect the owner’s Google Calendar when the backend/API setup is ready."
    ),
    readinessItem(
      "google-calendar-sync",
      "Google Calendar booking sync",
      calendarSynced ? "ready" : calendarConnected ? "setup" : "blocked",
      calendarSynced
        ? `Last sync: ${googleCalendarSyncStatus?.lastSyncedAt || "just now"} • ${googleCalendarSyncStatus?.conflictCount || 0} conflict${googleCalendarSyncStatus?.conflictCount === 1 ? "" : "s"}.`
        : calendarConnected
        ? "Run the first server-side booking sync. Google changes require explicit owner reconciliation."
        : "Connect Google Calendar before syncing bookings."
    ),
    readinessItem(
      "production-watch",
      "Server proactive watcher",
      productionWatchReady ? "ready" : "setup",
      productionWatchReady
        ? `Scheduled watcher is configured${productionWatchStatus?.lastDeliveryAt ? ` • last delivery ${productionWatchStatus.lastDeliveryAt}` : ""}.`
        : "The backend watcher or schedule still needs verification."
    ),
  ];

  const readyCount = items.filter((item) => item.state === "ready").length;
  const blockedCount = items.filter((item) => item.state === "blocked").length;
  return {
    items,
    readyCount,
    blockedCount,
    total: items.length,
    headline:
      blockedCount > 0
        ? "Production bridge is partly ready"
        : readyCount === items.length
        ? "Production bridge is ready"
        : "Production bridge setup is progressing",
  };
}

export { buildProductionReadiness, maskPushToken };
