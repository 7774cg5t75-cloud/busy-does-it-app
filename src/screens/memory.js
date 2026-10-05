import React from "react";
import { Text, View } from "react-native";

import * as Core from "../core/runtime";
const { formatPercent, formatUKDate } = Core;
import { styles } from "../theme/styles";
import {
  Shell,
  Card,
  Button,
  MetricRow,
  StatusChip,
} from "../components/ui";

function BusinessMemory({ s }) {
  const patterns = s.businessMemoryPatterns || [];
  const insights = s.businessMemoryInsights || [];
  const changes = s.businessMemoryChanges || [];
  const usefulCount = patterns.filter((item) =>
    ["Useful evidence", "Strong evidence"].includes(item.stage?.label)
  ).length;
  const strongCount = patterns.filter(
    (item) => item.stage?.label === "Strong evidence"
  ).length;

  return (
    <Shell
      s={s}
      title="Business Memory"
      subtitle="What BUSY has learned from this business over time — with the sample, confidence and ranking effect visible."
      brandCue="Facts stay facts. Patterns need evidence. Owner rules still outrank learning."
    >
      <Card
        eyebrow="V3.21 • Long-term learning"
        title={
          s.strongestBusinessMemoryPattern
            ? "BUSY is building a business-specific operating memory"
            : "BUSY is collecting evidence cautiously"
        }
        body={
          s.strongestBusinessMemoryPattern
            ? `${s.strongestBusinessMemoryPattern.title} currently has the clearest usable outcome evidence. BUSY lets that evidence move rankings gradually, never override live customer obligations or owner rules.`
            : "There is not enough repeated outcome data for a strong business-specific conclusion yet. BUSY will keep recording without pretending certainty."
        }
        footer={
          s.businessMemoryLastReviewAt
            ? `Memory last updated: ${new Date(s.businessMemoryLastReviewAt).toLocaleString("en-GB")}`
            : "No saved memory review yet"
        }
        tone={strongCount ? "green" : usefulCount ? "blue" : "amber"}
      >
        <MetricRow left="Outcome patterns tracked" right={String(patterns.length)} />
        <MetricRow left="Useful evidence" right={String(usefulCount)} strong={usefulCount > 0} />
        <MetricRow left="Strong evidence" right={String(strongCount)} strong={strongCount > 0} />
        <MetricRow left="Recent evidence changes" right={String(changes.length)} strong={changes.length > 0} />
        <MetricRow left="Saved memory snapshots" right={String(s.businessMemoryHistory?.length || 0)} />
      </Card>

      <Card
        eyebrow="BUSY learned this month"
        title="Recent outcomes feeding the memory"
        body="These are recorded outcomes from roughly the last 30 days. A blank month does not become a negative conclusion."
        tone="blue"
      >
        {(s.businessMemoryRecentRows || []).map((row) => (
          <MetricRow
            key={row.key}
            left={row.label}
            right={row.sample ? `${row.sample} recorded • ${row.successes} ${row.successLabel}` : "No recorded outcomes"}
            strong={row.successes > 0}
          />
        ))}
      </Card>

      {changes.length ? (
        <Card
          eyebrow="What changed in BUSY’s thinking"
          title="New evidence has moved the memory"
          body="These are changes since the previous distinct evidence snapshot — not invented narrative."
          tone="green"
        >
          {changes.slice(0, 6).map((item) => (
            <MetricRow
              key={item.key}
              left={item.title}
              right={
                `${item.direction} • ${item.sampleDelta >= 0 ? "+" : ""}${item.sampleDelta} outcome${Math.abs(item.sampleDelta) === 1 ? "" : "s"}${item.adjustmentDelta ? ` • ranking ${item.adjustmentDelta > 0 ? "+" : ""}${item.adjustmentDelta}` : ""}`
              }
              strong={item.adjustmentDelta !== 0}
            />
          ))}
          <Button label="Ask BUSY why it changed its mind" primary onPress={s.askBusyWhyLearningChanged} />
        </Card>
      ) : (
        <Card
          eyebrow="Recommendation stability"
          title="No material evidence shift since the previous memory"
          body="BUSY has not found a new recorded outcome that justifies changing its long-term view. It will not manufacture a learning update just to look active."
          tone="blue"
        >
          <Button label="Ask BUSY what it currently knows" onPress={s.askBusyWhyLearningChanged} />
        </Card>
      )}

      <Text style={styles.sectionLabel}>Outcome memory</Text>
      {patterns.map((item) => (
        <Card
          key={item.key}
          eyebrow={item.stage?.label || "Too early to tell"}
          title={item.title}
          body={item.learnedBecause}
          footer={
            item.lastUpdated
              ? `Last evidence: ${formatUKDate(String(item.lastUpdated).slice(0, 10))} • ${item.direction}`
              : "No dated evidence yet"
          }
          tone={item.stage?.tone || "blue"}
        >
          <MetricRow left="Recorded outcomes" right={String(item.sample)} />
          <MetricRow left={item.outcomeLabel} right={String(item.successes)} />
          <MetricRow
            left="Observed rate"
            right={item.observedRate === null ? "Not enough data" : formatPercent(item.observedRate)}
          />
          <MetricRow left="Confidence stage" right={item.stage?.label || "Too early to tell"} strong={item.stage?.weight >= 0.8} />
          <MetricRow
            left="Ranking effect"
            right={`${item.memoryAdjustment > 0 ? "+" : ""}${item.memoryAdjustment}`}
            strong={item.memoryAdjustment !== 0}
          />
        </Card>
      ))}

      <Text style={styles.sectionLabel}>Service memory</Text>
      {(s.completedServiceMemory || []).length ? (
        s.completedServiceMemory.slice(0, 8).map((item) => (
          <View key={item.service} style={styles.activityCard}>
            <View style={styles.activityTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.activityName}>{item.service}</Text>
                <Text style={styles.activityService}>{item.stage?.label || "Too early to tell"}</Text>
              </View>
              <StatusChip label={item.sample + " jobs"} tone={item.sample >= 6 ? "green" : "blue"} />
            </View>
            <Text style={styles.activitySummary}>
              {item.averageValue
                ? `Average recorded completed-job value: £${item.averageValue}`
                : "No usable recorded job value yet"}
            </Text>
          </View>
        ))
      ) : (
        <Card eyebrow="No completed-job memory yet" title="BUSY needs real completed jobs first" tone="blue" />
      )}

      <Text style={styles.sectionLabel}>Quote-value memory</Text>
      {(s.quoteValueBandMemory || []).map((item) => (
        <Card
          key={item.id}
          eyebrow={item.stage?.label || "Too early to tell"}
          title={item.label}
          body={
            item.sample
              ? `${item.successes} accepted from ${item.sample} recorded quote-follow-up outcome${item.sample === 1 ? "" : "s"}.`
              : "No recorded outcomes in this value band yet."
          }
          tone={item.stage?.weight >= 0.8 ? "green" : "blue"}
        >
          <MetricRow
            left="Observed acceptance"
            right={item.observedRate === null ? "Not enough data" : formatPercent(item.observedRate)}
          />
        </Card>
      ))}

      <Text style={styles.sectionLabel}>Social destination memory</Text>
      {(s.socialChannelMemory || []).map((item) => (
        <Card
          key={item.channel}
          eyebrow={item.stage?.label || "Too early to tell"}
          title={item.channel}
          body={
            item.sample
              ? `${item.successes} booking outcome${item.successes === 1 ? "" : "s"} from ${item.sample} recorded attributed result${item.sample === 1 ? "" : "s"}.`
              : "No recorded attributed outcomes yet."
          }
          tone={item.stage?.weight >= 0.8 ? "green" : "blue"}
        >
          <MetricRow
            left="Observed booking rate"
            right={item.observedRate === null ? "Not enough data" : formatPercent(item.observedRate)}
          />
        </Card>
      ))}

      {(s.repeatIntervalMemory || []).length ? (
        <>
          <Text style={styles.sectionLabel}>Repeat timing memory</Text>
          {s.repeatIntervalMemory.slice(0, 6).map((item) => (
            <Card
              key={item.service}
              eyebrow={item.stage?.label || "Too early to tell"}
              title={item.service}
              body={`Recorded repeat intervals average about ${item.averageMonths} months across ${item.sample} interval${item.sample === 1 ? "" : "s"}.`}
              tone={item.stage?.weight >= 0.8 ? "green" : "blue"}
            />
          ))}
        </>
      ) : null}

      <Card
        eyebrow="Learning boundary"
        title="BUSY can change its recommendation, not your rules"
        body="Outcome memory can gently raise or lower optional recommendation types as evidence grows. It cannot hide a waiting customer, override a confirmed booking, rewrite an owner rule or convert correlation into a guaranteed claim."
        tone="green"
      />

      <Button label="Business Brain" onPress={() => s.go("businessBrain")} />
      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { BusinessMemory };
