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

function money(value) {
  return `£${Math.round(Number(value) || 0).toLocaleString("en-GB")}`;
}

function ExecutiveBriefing({ s }) {
  const b = s.executiveBriefing || {};
  const priority = b.priority || {};
  const risks = Array.isArray(b.risks) ? b.risks : [];
  const loadRows = Array.isArray(b.loadRows) ? b.loadRows : [];
  const outlook = b.outlook || {};
  const weekly = b.weeklyReview || {};
  const warm = b.warmQuotes || {};
  const repeat = b.repeatPotential || {};

  return (
    <Shell
      s={s}
      title="Executive Briefing"
      subtitle="What is happening now, what the saved pipeline suggests next, and what actually needs attention."
      brandCue="Confirmed work stays separate from forecast ranges. BUSY shows confidence instead of pretending certainty."
    >
      <Card
        eyebrow="V3.22 • Today"
        title={priority.title || "BUSY has checked the business"}
        body={priority.body || "No material recorded issue is forcing itself to the top."}
        footer="One priority first • full evidence underneath"
        tone={priority.kind === "clear" ? "green" : "amber"}
      >
        <MetricRow
          left="Confirmed next 7 days"
          right={`${b.confirmed7?.count || 0} booking${b.confirmed7?.count === 1 ? "" : "s"} • ${money(b.confirmed7?.value)}`}
          strong={(b.confirmed7?.value || 0) > 0}
        />
        <MetricRow
          left="Confirmed next 30 days"
          right={`${b.confirmed30?.count || 0} booking${b.confirmed30?.count === 1 ? "" : "s"} • ${money(b.confirmed30?.value)}`}
          strong={(b.confirmed30?.value || 0) > 0}
        />
        <MetricRow
          left="Prepared approvals"
          right={String(s.autopilotApprovalItems?.length || 0)}
        />
        <MetricRow
          left="Needs owner input"
          right={String(s.autopilotNeedsInputItems?.length || 0)}
          strong={(s.autopilotNeedsInputItems?.length || 0) > 0}
        />
        <Button
          label={priority.actionLabel || "Review priority"}
          primary
          onPress={s.openExecutivePriority}
        />
      </Card>

      <Card
        eyebrow="30-day forward view"
        title={
          outlook.low === outlook.high
            ? `${money(outlook.low)} confirmed outlook`
            : `${money(outlook.low)}–${money(outlook.high)} current outlook`
        }
        body="The range adds evidence-weighted warm quote and repeat-work potential to confirmed bookings. It is a planning range, not a revenue promise."
        footer={`Variable-pipeline confidence: ${outlook.confidence || "Low"} • ${outlook.evidenceSample || 0} recorded quote/repeat outcomes behind the confidence check`}
        tone={outlook.confidence === "High" ? "green" : outlook.confidence === "Medium" ? "blue" : "amber"}
      >
        <MetricRow left="Confirmed" right={money(b.confirmed30?.value)} strong />
        <MetricRow
          left={`Warm quotes • ${warm.count || 0}`}
          right={
            warm.totalValue
              ? `${money(warm.low)}–${money(warm.high)} from ${money(warm.totalValue)} open quote value`
              : "No sent/accepted quote value"
          }
        />
        <MetricRow
          left={`Repeat potential • ${repeat.count || 0}`}
          right={
            repeat.poolValue
              ? `${money(repeat.low)}–${money(repeat.high)} from ${money(repeat.poolValue)} due-customer value`
              : "No due repeat-value pool"
          }
        />
        <MetricRow left="Quote evidence" right={`${warm.confidence || "Too early to tell"} • sample ${warm.sample || 0}`} />
        <MetricRow left="Repeat evidence" right={`${repeat.confidence || "Too early to tell"} • sample ${repeat.sample || 0}`} />
      </Card>

      <Card
        eyebrow="Scenario view"
        title="What changes if nothing else happens?"
        body="Scenarios deliberately separate the hard floor from evidence-weighted possibilities."
        tone="blue"
      >
        <MetricRow left="No more work comes in" right={money(b.scenarios?.noMoreWork)} strong />
        <MetricRow left="Warm quote midpoint" right={money(b.scenarios?.warmMid)} />
        <MetricRow left="Warm + repeat midpoint" right={money(b.scenarios?.fullMid)} />
      </Card>

      <Text style={styles.sectionLabel}>Next 7 days • scheduled load</Text>
      {loadRows.map((row) => (
        <View key={row.date} style={styles.activityCard}>
          <View style={styles.activityTopRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.activityName}>{row.label}</Text>
              <Text style={styles.activityService}>
                {row.count
                  ? `${row.count} confirmed booking${row.count === 1 ? "" : "s"} • about ${row.hours}h scheduled`
                  : "No confirmed booking saved"}
              </Text>
            </View>
            <StatusChip
              label={row.state}
              tone={row.state === "Quiet" ? "amber" : row.state === "Busy" ? "green" : "blue"}
            />
          </View>
          <Text style={styles.activitySummary}>
            {row.value ? `Recorded booked value: ${money(row.value)}` : "Recorded booked value: £0"}
          </Text>
        </View>
      ))}

      <Card
        eyebrow="Risk radar"
        title={risks.length ? `${risks.length} thing${risks.length === 1 ? "" : "s"} worth watching` : "No material saved risk is standing out"}
        body="This radar only uses risks visible in the saved records. It does not invent market conditions or future cancellations."
        tone={risks.some((item) => item.level === "High") ? "amber" : "blue"}
      >
        {risks.length ? (
          risks.map((item) => (
            <MetricRow
              key={item.id}
              left={item.label}
              right={`${item.level} • ${item.detail}`}
              strong={item.level === "High"}
            />
          ))
        ) : (
          <MetricRow left="Current risk signal" right="No material saved issue" strong />
        )}
      </Card>

      <Card
        eyebrow="Weekly review"
        title="What the last 7 days added to the business"
        body="This is record-based performance, not a blended vanity score."
        tone="green"
      >
        <MetricRow left="Completed jobs" right={String(weekly.completedJobs || 0)} />
        <MetricRow left="Completed value" right={money(weekly.completedValue)} strong={(weekly.completedValue || 0) > 0} />
        <MetricRow left="Quote outcomes recorded" right={String(weekly.quoteOutcomes || 0)} />
        <MetricRow left="Quotes accepted" right={String(weekly.quoteWins || 0)} />
        <MetricRow left="Reviews recorded as left" right={String(weekly.reviews || 0)} />
        <MetricRow left="Social outcomes marked booking" right={String(weekly.socialBookings || 0)} />
        <MetricRow left="Business Memory changes" right={String(weekly.memoryChanges || 0)} />
      </Card>

      <Card
        eyebrow="Forecast boundary"
        title="BUSY knows the difference between booked and possible"
        body="Confirmed bookings are factual saved commitments. Quote and repeat ranges are planning estimates based on recorded outcomes and deliberately widen when the evidence is weak."
        tone="green"
      />

      <Button label="Ask BUSY about this outlook" primary onPress={s.askBusyAboutOutlook} />
      <Button label="Open Business Memory" onPress={() => s.go("businessMemory")} />
      <Button label="Open weekly Work plan" onPress={() => s.jump("workHub", "Work")} />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { ExecutiveBriefing };
