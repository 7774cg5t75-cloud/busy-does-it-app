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

function OperationalContinuity({ s }) {
  const continuity = s.operationalContinuity || {
    status: "All clear",
    headline: "Core work can continue without a connection bottleneck",
    highCount: 0,
    reviewCount: 0,
    optionalIssueCount: 0,
    recoveryQueue: [],
    continueNow: [],
    connectionRows: [],
    nativeBlockedCount: 0,
  };

  const openRoute = (row) => {
    if (!row?.route) return;
    if (row.route === "workHub") {
      s.jump("workHub", "Work");
      return;
    }
    s.go(row.route);
  };

  return (
    <Shell
      s={s}
      title="Continuity Centre"
      subtitle="BUSY keeps the business usable when one connection or provider has a problem."
      brandCue="No dead ends • protect live work • recover connections separately."
    >
      <Card
        eyebrow="V3.27 • Operational continuity"
        title={continuity.headline}
        body={
          continuity.status === "All clear"
            ? "No current connection issue is forcing the business to stop. Optional services can still be added or tested independently."
            : "BUSY separates the affected connection from the rest of the business, so a provider problem does not turn into a whole-app problem."
        }
        footer="A degraded integration never grants BUSY permission to guess, duplicate sends or overwrite an important booking."
        tone={
          continuity.highCount
            ? "amber"
            : continuity.reviewCount
            ? "blue"
            : "green"
        }
      >
        <MetricRow left="Operational state" right={continuity.status} strong />
        <MetricRow
          left="Important recovery items"
          right={String((continuity.highCount || 0) + (continuity.reviewCount || 0))}
          strong={(continuity.highCount || 0) > 0}
        />
        <MetricRow
          left="Optional connection notes"
          right={String(continuity.optionalIssueCount || 0)}
        />
        <MetricRow
          left="Native release gates pending"
          right={String(continuity.nativeBlockedCount || 0)}
        />
      </Card>

      <Text style={styles.sectionLabel}>What still works now</Text>
      {(continuity.continueNow || []).map((item) => (
        <Card
          key={item.id}
          eyebrow="Keep moving"
          title={item.title}
          body={item.body}
          tone="green"
        >
          <Button
            label={item.actionLabel || "Open"}
            onPress={() => openRoute(item)}
          />
        </Card>
      ))}

      <Text style={styles.sectionLabel}>Connection health</Text>
      {(continuity.connectionRows || []).map((row) => {
        const attention = ["Conflict", "Limited", "Needs retry"].includes(row.state);
        return (
          <View key={row.id} style={styles.releaseCheckRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.releaseCheckLabel}>{row.label}</Text>
              <Text style={styles.productionReadinessDetail}>
                {row.essential ? "Core resilience" : "Optional / connected extra"}
              </Text>
            </View>
            <StatusChip
              label={row.state}
              tone={attention ? "amber" : row.state === "Connected" || row.state === "Usable" || row.state === "Ready" ? "green" : "blue"}
            />
          </View>
        );
      })}

      {(continuity.recoveryQueue || []).length ? (
        <>
          <Text style={styles.sectionLabel}>Recovery queue</Text>
          {(continuity.recoveryQueue || []).map((item) => (
            <Card
              key={item.id}
              eyebrow={item.optional ? "Optional connection" : item.severity === "High" ? "Needs owner judgement" : "Recovery"}
              title={item.title}
              body={item.body}
              tone={item.severity === "High" ? "amber" : "blue"}
            >
              <MetricRow left="Area" right={item.area || "BUSY"} />
              <Button
                label={item.actionLabel || "Review"}
                primary={item.severity === "High"}
                onPress={() => openRoute(item)}
              />
            </Card>
          ))}
        </>
      ) : (
        <Card
          eyebrow="Recovery queue"
          title="Nothing is waiting for recovery"
          body="BUSY has no current core-data, cloud, publishing or calendar recovery item to put in front of you."
          tone="green"
        />
      )}

      <Card
        eyebrow="Safety rule"
        title="A connection failure should shrink capability, not corrupt the business"
        body="BUSY keeps customer records, planning and draft preparation separate from provider delivery. If a result is uncertain, it stops and asks for a retry or owner decision instead of pretending it succeeded."
        tone="blue"
      />

      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
      <Button label="Release Core" onPress={() => s.go("releaseCore")} />
      <Button label="Production Bridge" onPress={() => s.go("productionBridge")} />
    </Shell>
  );
}

export { OperationalContinuity };
