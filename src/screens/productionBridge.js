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

      <Card
        eyebrow="Security boundary"
        title="Native identifiers on device • provider secrets and refresh tokens on server"
        body="Push device rows are owner-scoped with RLS. Google Calendar OAuth state/tokens are server-only. The mobile app receives connection status and an OAuth URL, never the Google client secret or refresh token."
        tone="green"
      />

      <Button label="Release Core health" onPress={() => s.go("releaseCore")} />
      <Button label="Proactive BUSY" onPress={() => s.go("proactiveBusyCentre")} />
      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { ProductionBridge };
