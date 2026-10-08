import React from "react";
import { Text, View } from "react-native";

import { styles } from "../theme/styles";
import {
  Shell,
  Card,
  Button,
  MetricRow,
  StatusChip,
} from "../components/ui";

function ProductionBridge({ s }) {
  const readiness = s.productionReadiness || { items: [], readyCount: 0, total: 0 };
  const runtime = s.productionBridgeRuntime || {};
  const push = s.remotePushStatus || {};
  const calendar = s.calendarOAuthStatus || {};
  const calendarConnected = calendar.connection?.status === "connected";
  const googleSync = s.googleCalendarSyncStatus || {};
  const googleConflicts = Array.isArray(s.googleCalendarConflicts)
    ? s.googleCalendarConflicts
    : [];
  const watch = s.productionWatchStatus || {};

  return (
    <Shell
      s={s}
      title="Production Bridge"
      subtitle="Replace prototype-only plumbing with the native build, remote push and server-side calendar foundation BUSY will actually release with."
      brandCue="Expo Go stays as a fast fallback. Production capability gets its own explicit readiness gates."
    >
      <Card
        eyebrow="V3.25 • Readiness"
        title={readiness.headline || "Production bridge status"}
        body={`${readiness.readyCount || 0} of ${readiness.total || 0} production gates are currently ready. A gate only turns green when the underlying capability is genuinely configured.`}
        footer="This checklist is derived from app/runtime/backend state, not a manual tick-box list."
        tone={(readiness.blockedCount || 0) ? "amber" : "green"}
      >
        <MetricRow left="Ready" right={String(readiness.readyCount || 0)} strong />
        <MetricRow left="Still blocked" right={String(readiness.blockedCount || 0)} strong={(readiness.blockedCount || 0) > 0} />
        <Button
          label={s.productionBridgeAction === "refresh" ? "Refreshing…" : "Refresh production checks"}
          primary
          disabled={s.productionBridgeAction === "refresh"}
          onPress={s.refreshProductionBridge}
        />
      </Card>

      <Text style={styles.sectionLabel}>Production gates</Text>
      {(readiness.items || []).map((item) => (
        <View key={item.id} style={styles.releaseCheckRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.releaseCheckLabel}>{item.label}</Text>
            <Text style={styles.productionReadinessDetail}>{item.detail}</Text>
          </View>
          <StatusChip label={item.label === "Native development build" && item.state === "test" ? "Expo Go" : item.label && item.state === "ready" ? "Ready" : item.state === "blocked" ? "Blocked" : item.state === "test" ? "Test build" : "Set up"} tone={item.tone || "blue"} />
        </View>
      ))}

      <Card
        eyebrow="Native build foundation"
        title={runtime.easProjectId ? "EAS project is linked" : "Build profiles are ready • EAS project link remains"}
        body="V3.25 commits development, preview and production build profiles, native app identifiers and the busydoesit:// callback scheme. The one account-bound step we cannot fabricate is the EAS project ID."
        footer={runtime.expoGoPreview ? "Current session: Expo Go/Snack fallback" : "Current session: native build"}
        tone={runtime.easProjectId ? "green" : "blue"}
      >
        <MetricRow left="iOS bundle" right={runtime.iosBundleIdentifier || "Not configured"} />
        <MetricRow left="Android package" right={runtime.androidPackage || "Not configured"} />
        <MetricRow left="App scheme" right={runtime.scheme ? `${runtime.scheme}://` : "Not configured"} />
        <MetricRow left="EAS project ID" right={runtime.easProjectId ? "Available" : "Needs one-time EAS link"} strong={!!runtime.easProjectId} />
      </Card>

      <Card
        eyebrow="Remote notifications"
        title={
          push.state === "registered"
            ? "This device is registered for production push"
            : "Remote push registry is ready for the development build"
        }
        body={
          runtime.expoGoPreview
            ? "Local notifications continue to work in the current test flow. Expo push-token registration is held back until the native development build has a real EAS project ID."
            : push.message || "Register this signed-in device, then BUSY can send a server-triggered test notification."
        }
        footer={push.token ? `Device token: ${s.maskPushToken(push.token)}` : push.message || "No production push token on this runtime"}
        tone={push.state === "registered" ? "green" : "blue"}
      >
        <MetricRow left="Active devices for owner" right={String(push.deviceCount || 0)} />
        {push.state === "registered" ? (
          <>
            <Button
              label={s.remotePushAction === "test" ? "Sending…" : "Send remote push test"}
              primary
              disabled={!!s.remotePushAction}
              onPress={s.sendRemotePushTest}
            />
            <Button
              label={s.remotePushAction === "deactivate" ? "Deactivating…" : "Deactivate this device"}
              disabled={!!s.remotePushAction}
              onPress={s.deactivateRemotePushDevice}
            />
          </>
        ) : (
          <Button
            label={
              runtime.expoGoPreview
                ? "Development build required"
                : runtime.easProjectId
                ? "Register this device"
                : "EAS project link required"
            }
            primary={!runtime.expoGoPreview && !!runtime.easProjectId}
            disabled={runtime.expoGoPreview || !runtime.easProjectId || !!s.remotePushAction}
            onPress={s.registerRemotePushDevice}
          />
        )}
      </Card>

      <Card
        eyebrow="Google Calendar • server OAuth"
        title={
          calendarConnected
            ? "Google Calendar is connected"
            : calendar.configured
            ? "OAuth backend is configured"
            : "Calendar OAuth foundation is waiting for credentials"
        }
        body={
          calendarConnected
            ? `${calendar.connection?.accountEmail || "Google account"} is connected server-side. Access/refresh tokens remain in the server-only calendar connection table.`
            : calendar.configured
            ? "BUSY can create a signed OAuth state and exchange the Google authorization code server-side. The native development build is the correct place to test the busydoesit:// callback."
            : calendar.error || "Google OAuth client credentials are not available to the calendar function yet."
        }
        footer={calendar.callbackUrl ? `Google redirect URI: ${calendar.callbackUrl}` : "Tokens are never stored in the mobile client"}
        tone={calendarConnected ? "green" : calendar.configured ? "blue" : "amber"}
      >
        {calendarConnected ? (
          <>
            <MetricRow left="Account" right={calendar.connection?.accountEmail || "Connected"} />
            <MetricRow left="Calendar API" right={calendar.connection?.status === "connected" ? "Ready" : calendar.connection?.status || "Needs check"} strong={calendar.connection?.status === "connected"} />
            <Button label="Disconnect Google Calendar" onPress={s.disconnectGoogleCalendarOAuth} />
          </>
        ) : (
          <Button
            label={
              runtime.expoGoPreview
                ? "Connect from development build"
                : calendar.configured
                ? "Connect Google Calendar"
                : "Backend setup required"
            }
            primary={!runtime.expoGoPreview && !!calendar.configured}
            disabled={runtime.expoGoPreview || !calendar.configured || !!s.productionBridgeAction}
            onPress={s.startGoogleCalendarOAuth}
          />
        )}
      </Card>

      {calendarConnected ? (
        <Card
          eyebrow="V3.26 • Real booking sync"
          title={
            googleSync.state === "synced"
              ? "BUSY and Google Calendar are aligned"
              : googleSync.state === "needs_review"
              ? "Google changed a booking"
              : "Sync BUSY bookings into Google Calendar"
          }
          body={
            googleSync.message ||
            "Confirmed BUSY bookings can now be created/updated server-side in Google Calendar. Other Google events feed the Forward View without becoming customer records."
          }
          footer={
            googleSync.lastSyncedAt
              ? `Last sync: ${new Date(googleSync.lastSyncedAt).toLocaleString("en-GB")}`
              : "No real Google booking sync has run yet"
          }
          tone={
            googleConflicts.length
              ? "amber"
              : googleSync.state === "synced"
              ? "green"
              : "blue"
          }
        >
          <MetricRow left="Created this sync" right={String(googleSync.created || 0)} />
          <MetricRow left="Updated this sync" right={String(googleSync.updated || 0)} />
          <MetricRow left="External commitments" right={String(s.googleCalendarExternalEvents?.length || 0)} />
          <MetricRow left="Conflicts needing owner" right={String(googleConflicts.length)} strong={googleConflicts.length > 0} />
          <Button
            label={s.productionBridgeAction === "google-sync" ? "Syncing…" : "Sync Google Calendar now"}
            primary
            disabled={!!s.productionBridgeAction}
            onPress={s.syncGoogleCalendarNow}
          />
        </Card>
      ) : null}

      {googleConflicts.length ? (
        <>
          <Text style={styles.sectionLabel}>Google Calendar changes need your decision</Text>
          {googleConflicts.map((conflict) => (
            <Card
              key={conflict.customerId}
              eyebrow="Calendar conflict"
              title={conflict.customerName || "Customer booking"}
              body={`BUSY: ${conflict.busyDate || ""} ${conflict.busyTime || ""} • Google: ${conflict.googleLabel || conflict.googleStartAt || ""}. BUSY will not silently choose.`}
              footer="One explicit owner choice becomes the new shared baseline"
              tone="amber"
            >
              <Button
                label="Keep BUSY time"
                primary
                disabled={!!s.productionBridgeAction}
                onPress={() => s.keepBusyGoogleCalendarTime(conflict)}
              />
              <Button
                label="Use Google time in BUSY"
                disabled={!!s.productionBridgeAction}
                onPress={() => s.useGoogleCalendarTime(conflict)}
              />
            </Card>
          ))}
        </>
      ) : null}

      <Card
        eyebrow="Server proactive watcher"
        title={
          watch.configured
            ? "Background business watch is scheduled"
            : "Background watcher needs attention"
        }
        body={
          watch.configured
            ? "The Supabase watcher can inspect saved business state independently of the phone and deduplicate trusted remote alerts for approaching bookings, unresolved past bookings and stale sent quotes."
            : watch.message || "The production watcher schedule has not been verified yet."
        }
        footer={watch.schedule || "No schedule reported"}
        tone={watch.configured ? "green" : "amber"}
      >
        <MetricRow left="Recorded remote deliveries" right={String(watch.deliveryCount || 0)} />
        <MetricRow
          left="Last delivery"
          right={watch.lastDeliveryAt ? new Date(watch.lastDeliveryAt).toLocaleString("en-GB") : "None yet"}
        />
        <Button label="Refresh watcher status" onPress={s.refreshProductionWatchStatus} />
      </Card>

      <Card
        eyebrow="Security boundary"
        title="Native identifiers on device • provider secrets and refresh tokens on server"
        body="Push device rows are owner-scoped with RLS. Google Calendar OAuth state/tokens are server-only. The mobile app receives connection status and an OAuth URL, never the Google client secret or refresh token."
        tone="green"
      />

      <Card
        eyebrow="V3.69 • restricted founder administration"
        title="Founder-only platform reporting"
        body="A private aggregated dashboard for subscriber-system foundations, usage and technical exceptions across BUSY. Access is checked using a fresh server-side founder role, not this device or business ownership."
        footer="Ordinary customer accounts cannot read platform data. Founder activation is a separate, verified administrator action."
        tone="blue"
      >
        <Button label="Verify founder access & open dashboard" onPress={() => s.go("founderOperations")} />
      </Card>

      <Button label="Release Core health" onPress={() => s.go("releaseCore")} />
      <Button label="Proactive BUSY" onPress={() => s.go("proactiveBusyCentre")} />
      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { ProductionBridge };
