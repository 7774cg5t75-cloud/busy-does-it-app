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

function ReleaseCore({ s }) {
  const health = s.releaseCoreHealth || {
    status: "Healthy",
    issueCount: 0,
    highCount: 0,
    reviewCount: 0,
    issues: [],
    checks: {},
  };
  const checks = [
    ["Customer links", health.checks?.customerLinks],
    ["Booking lifecycle", health.checks?.bookingLifecycle],
    ["Duplicate customers", health.checks?.duplicateCustomers],
    ["Connected diary", health.checks?.diary],
    ["Cloud revision", health.checks?.cloud],
    ["Reminder schedule", health.checks?.reminders],
  ];

  return (
    <Shell
      s={s}
      title="Release Core"
      subtitle="A practical consistency check across the customer lifecycle, cloud, diary and reminders."
      brandCue="Fix broken records before adding more automation."
    >
      <Card
        eyebrow="V3.24 • Core health"
        title={
          health.status === "Healthy"
            ? "Core records look internally consistent"
            : health.status === "Needs attention"
            ? "A few core records need fixing"
            : "A few items are worth reviewing"
        }
        body={
          health.status === "Healthy"
            ? "No obvious duplicate-contact, orphan-link, unresolved past-booking, diary-conflict or stale-reminder issue is visible in the current saved state."
            : "BUSY has found inconsistencies that can distort the diary, pipeline, Business Memory or proactive reminders."
        }
        footer="This is a deterministic consistency check — not an AI guess."
        tone={health.highCount ? "amber" : health.reviewCount ? "blue" : "green"}
      >
        <MetricRow left="High-priority inconsistencies" right={String(health.highCount || 0)} strong={(health.highCount || 0) > 0} />
        <MetricRow left="Review items" right={String(health.reviewCount || 0)} />
        <MetricRow left="Total core issues" right={String(health.issueCount || 0)} />
      </Card>

      <Text style={styles.sectionLabel}>Release checks</Text>
      {checks.map(([label, ok]) => (
        <View key={label} style={styles.releaseCheckRow}>
          <Text style={styles.releaseCheckLabel}>{label}</Text>
          <StatusChip label={ok ? "Pass" : "Review"} tone={ok ? "green" : "amber"} />
        </View>
      ))}

      {health.issues?.length ? (
        <>
          <Text style={styles.sectionLabel}>Needs attention</Text>
          {health.issues.map((issue) => (
            <Card
              key={issue.id}
              eyebrow={issue.severity === "High" ? "Core inconsistency" : "Review"}
              title={issue.title}
              body={issue.body}
              tone={issue.severity === "High" ? "amber" : "blue"}
            >
              <Button
                label="Review this"
                primary={issue.severity === "High"}
                onPress={() => s.openReleaseCoreIssue(issue)}
              />
            </Card>
          ))}
        </>
      ) : (
        <Card
          eyebrow="All clear"
          title="No release-core issue is visible in the current records"
          body="That does not replace real device testing, but it means the saved lifecycle links currently pass BUSY’s deterministic consistency checks."
          tone="green"
        />
      )}

      <Card
        eyebrow="Lifecycle"
        title="One customer • one history"
        body="V3.24 now blocks an obvious duplicate phone record during manual customer creation. A new enquiry from an existing phone number reopens that customer’s lifecycle instead of creating another customer."
        tone="green"
      />

      <Card
        eyebrow="Architecture"
        title="Release logic has started moving out of AppController"
        body="Deterministic lifecycle/release checks and Home command-centre selection now live in a domain module instead of adding another large decision block to the controller."
        footer="Next refactors can move forecasting, notifications and diary orchestration the same way."
        tone="blue"
      />

      <Button label="Open Home" primary onPress={() => s.jump("home", "Home")} />
      <Button label="Open Work" onPress={() => s.jump("workHub", "Work")} />
      <Button label="Settings" onPress={() => s.go("settings")} />
    </Shell>
  );
}

export { ReleaseCore };
