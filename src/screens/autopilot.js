import React from "react";
import { Text, TextInput, View } from "react-native";

import { styles } from "../theme/styles";
import {
  Shell,
  Card,
  Button,
  Choice,
  MetricRow,
  StatusChip,
} from "../components/ui";

function AutopilotCentre({ s }) {
  return (
    <Shell
      s={s}
      title="Controlled Autopilot"
      subtitle="BUSY prepares safe work ahead of you and collects the decisions that genuinely need an owner."
      brandCue="Preparation can be automatic. Customer contact, public publishing, spend and important booking changes remain owner-controlled."
    >
      <Card
        eyebrow="V3.20 • Authority"
        title={s.autopilotModeLabel}
        body={
          s.autopilotMode === "trusted"
            ? "BUSY prepares work and may use the existing high-confidence safe-filing evaluator for reversible internal record filing. External actions still wait for you."
            : s.autopilotMode === "off"
            ? "BUSY watches and recommends only. No Autopilot preparation is performed."
            : "BUSY automatically prepares drafts, customer shortlists and review-ready next steps. Nothing is sent, published or paid for."
        }
        footer="You can change this at any time"
        tone={s.autopilotMode === "off" ? "blue" : s.autopilotMode === "trusted" ? "amber" : "green"}
      >
        <Choice
          label="Off"
          sub="Watch and recommend only."
          selected={s.autopilotMode === "off"}
          onPress={() => s.changeAutopilotMode("off")}
        />
        <Choice
          label="Prepare for me"
          sub="Recommended. Prepare safe internal work, then ask before consequential actions."
          selected={s.autopilotMode === "prepare"}
          onPress={() => s.changeAutopilotMode("prepare")}
        />
        <Choice
          label="Trusted internal actions"
          sub="Also allow the existing high-confidence safe-filing path for internal records. Still no autonomous sends, posts or spend."
          selected={s.autopilotMode === "trusted"}
          onPress={() => s.changeAutopilotMode("trusted")}
        />
        <Button
          label="Run safe preparation now"
          onPress={() => s.runAutopilotPreparation({ force: true })}
        />
      </Card>

      <Card
        eyebrow="Approval Inbox"
        title={
          s.autopilotApprovalItems.length
            ? `${s.autopilotApprovalItems.length} prepared item${s.autopilotApprovalItems.length === 1 ? "" : "s"} ready`
            : "No prepared approval is waiting"
        }
        body="Opening an item takes you into its existing review/approval flow. This inbox never sends a customer message, publishes a post or spends money by itself."
        tone={s.autopilotApprovalItems.length ? "green" : "blue"}
      >
        <MetricRow left="Ready for approval" right={String(s.autopilotApprovalItems.length)} strong={s.autopilotApprovalItems.length > 0} />
        <MetricRow left="Needs your input" right={String(s.autopilotNeedsInputItems.length)} strong={s.autopilotNeedsInputItems.length > 0} />
        <MetricRow left="Paid actions prepared" right="0" strong />
      </Card>

      {s.autopilotApprovalItems.map((item, index) => (
        <Card
          key={item.id}
          eyebrow={`#${index + 1} • Ready for approval`}
          title={item.title}
          body={item.body}
          footer={`${item.confidence} confidence • ${item.externalAction} still needs owner approval`}
          tone="green"
        >
          <MetricRow left="Why BUSY prepared it" right={item.reason} />
          {item.value ? <MetricRow left="Recorded value" right={`£${item.value}`} /> : null}
          <Button
            label={item.actionLabel || "Review"}
            primary={index === 0}
            onPress={() => s.openAutopilotApproval(item)}
          />
          <Button
            label="Not now • hide for 24 hours"
            onPress={() => s.snoozeAutopilotItem(item.id)}
          />
        </Card>
      ))}

      {s.autopilotNeedsInputItems.length ? (
        <View style={styles.dashboardHeader}>
          <StatusChip label="Needs your input" tone="amber" />
          <Text style={styles.dashboardHint}>
            BUSY deliberately stopped here because confidence, an owner rule or a real-world outcome requires judgment.
          </Text>
        </View>
      ) : null}

      {s.autopilotNeedsInputItems.map((item) => (
        <Card
          key={item.id}
          eyebrow="Needs your input"
          title={item.title}
          body={item.body}
          footer={item.reason}
          tone="amber"
        >
          <Button
            label={item.actionLabel || "Review"}
            primary
            onPress={() => s.openAutopilotNeedsInput(item)}
          />
          <Button
            label="Not now • hide for 24 hours"
            onPress={() => s.snoozeAutopilotItem(item.id)}
          />
        </Card>
      ))}

      <Card
        eyebrow="Owner rules"
        title="Tell BUSY the rules in normal English"
        body="Owner rules are durable and outrank recommendation learning. BUSY uses the ones it can enforce safely and surfaces a conflict rather than silently ignoring a rule."
        tone="blue"
      >
        <TextInput
          value={s.autopilotRuleDraft}
          onChangeText={s.setAutopilotRuleDraft}
          placeholder="e.g. Never contact customers more than twice about the same work."
          placeholderTextColor="#8A94A4"
          multiline
          style={styles.autopilotRuleInput}
        />
        <Button
          label="Add owner rule"
          primary
          disabled={!s.autopilotRuleDraft.trim()}
          onPress={s.saveAutopilotRule}
        />
        <Text style={styles.autopilotRuleExamples}>
          Examples: “Don’t suggest paid advertising until free options are tried first.” • “Never contact customers more than twice.” • “Prepare review requests automatically after completed jobs.”
        </Text>
      </Card>

      {s.autopilotRules.map((rule) => (
        <View key={rule.id} style={styles.autopilotRuleCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.autopilotRuleText}>{rule.text}</Text>
            <Text style={styles.autopilotRuleMeta}>Owner-set • {rule.scope || "General"}</Text>
          </View>
          <Button label="Remove" onPress={() => s.removeAutopilotRule(rule.id)} />
        </View>
      ))}

      <Card
        eyebrow="Hard safety boundaries"
        title="Autopilot cannot promote itself past the owner"
        body="No owner rule can grant blanket authority to send customer messages, publish publicly, spend advertising money, delete records or silently change important bookings."
        tone="green"
      >
        <MetricRow left="Customer sends" right="Explicit approval" strong />
        <MetricRow left="Public publishing" right="Explicit approval" strong />
        <MetricRow left="Advertising spend" right="Explicit approval" strong />
        <MetricRow
          left="Paid recommendation rule"
          right={s.autopilotPaidBlockedByRule ? "Free options first" : "No extra block"}
          strong={s.autopilotPaidBlockedByRule}
        />
        <MetricRow
          left="Customer contact limit"
          right={s.autopilotContactLimit ? `Max ${s.autopilotContactLimit} recorded contacts` : "No extra limit"}
          strong={!!s.autopilotContactLimit}
        />
        <MetricRow left="Booking changes" right="Explicit approval" strong />
        <MetricRow
          left="Safe internal filing"
          right={s.autopilotMode === "trusted" ? "High-confidence only" : "Not expanded"}
        />
      </Card>

      {s.autopilotPreparedLog?.length ? (
        <Card
          eyebrow="Recent preparation"
          title="BUSY activity log"
          body="This log records safe preparation checks, not customer-facing actions."
          tone="blue"
        >
          {s.autopilotPreparedLog.slice(0, 5).map((item) => (
            <MetricRow
              key={item.id}
              left={new Date(item.checkedAt).toLocaleString("en-GB")}
              right={`${item.prepared} ready • ${item.needsInput} input`}
            />
          ))}
        </Card>
      ) : null}

      {Object.keys(s.autopilotSnoozed || {}).length ? (
        <Button label="Show hidden Autopilot items again" onPress={s.restoreAutopilotItems} />
      ) : null}
      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { AutopilotCentre };
