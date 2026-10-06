import React from "react";
import { Text, View } from "react-native";

import * as Core from "../core/runtime";
const { formatUKDate } = Core;

import { styles } from "../theme/styles";
import { Shell, Card, Button, MetricRow, StatusChip } from "../components/ui";

function toneForLane(lane = "") {
  if (lane === "Reply now") return "amber";
  if (lane === "Follow up today") return "green";
  if (lane === "Waiting") return "blue";
  if (lane === "Do not contact") return "amber";
  return "blue";
}

function readableDate(value = "") {
  const iso = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? formatUKDate(iso) : "Not set";
}

function FollowUpEngine({ s }) {
  const engine = s.followUpEngine || {};
  const counts = engine.counts || {};
  const ready = engine.readyToPrepare || [];
  const waiting = engine.waitingReview || [];
  const recovery = engine.recoveryOpportunities || [];
  const top = engine.topCandidate || null;

  return (
    <Shell
      s={s}
      title="Follow-up Engine"
      subtitle="Who genuinely needs contact, who should be left alone, and what BUSY can prepare next."
      brandCue="V3.33 • Prioritise first • prepare safely • no unrestricted sending."
    >
      <Card
        eyebrow="Communications Bridge"
        title={
          counts.replyNow || counts.followUpToday
            ? `${Number(counts.replyNow || 0) + Number(counts.followUpToday || 0)} customer conversation${Number(counts.replyNow || 0) + Number(counts.followUpToday || 0) === 1 ? "" : "s"} worth acting on`
            : "No chase is being manufactured"
        }
        body="BUSY ranks real saved conversation state and customer-journey evidence, then deliberately separates action from waiting."
        footer="A prepared message is still not a sent message."
        tone={counts.replyNow ? "amber" : counts.followUpToday ? "green" : "blue"}
      >
        <MetricRow left="Reply now" right={String(counts.replyNow || 0)} strong={(counts.replyNow || 0) > 0} />
        <MetricRow left="Follow up today" right={String(counts.followUpToday || 0)} strong={(counts.followUpToday || 0) > 0} />
        <MetricRow left="Waiting on customer" right={String(counts.waiting || 0)} />
        <MetricRow left="Ready to prepare" right={String(counts.readyToPrepare || 0)} />
        <MetricRow left="Recovery opportunities" right={String(counts.recovery || 0)} />
      </Card>

      {top ? (
        <Card
          eyebrow="Best communication move"
          title={top.customerName}
          body={top.title}
          footer={top.reason}
          tone={toneForLane(top.lane)}
        >
          <View style={{ alignItems: "flex-start", marginBottom: 8 }}>
            <StatusChip label={top.lane} tone={toneForLane(top.lane)} />
          </View>
          <MetricRow left="Service" right={top.service || "Not recorded"} />
          <MetricRow left="Suggested route" right={top.preferredChannel} />
          <MetricRow left="Transport state" right={top.transportState} />
          <Button
            label="Open conversation"
            primary
            onPress={() => s.openCommunicationThread(top.customerId)}
          />
        </Card>
      ) : null}

      {ready.length ? (
        <>
          <Text style={styles.sectionLabel}>Ready to prepare</Text>
          {ready.map((item) => (
            <Card
              key={item.id}
              eyebrow={item.service || "Customer follow-up"}
              title={item.customerName}
              body={item.title}
              footer={item.reason}
              tone={toneForLane(item.lane)}
            >
              <MetricRow left="Priority" right={item.lane} strong />
              <MetricRow left="Suggested route" right={item.preferredChannel} />
              <MetricRow left="Last contact" right={readableDate(item.lastContactDate)} />
              <Button
                label="Draft with BUSY"
                primary
                onPress={() => s.draftFollowUpCandidate(item.customerId)}
              />
              <Button
                label="Open conversation"
                onPress={() => s.openCommunicationThread(item.customerId)}
              />
            </Card>
          ))}
        </>
      ) : null}

      {recovery.length ? (
        <>
          <Text style={styles.sectionLabel}>Opportunity recovery</Text>
          <Card
            eyebrow="Warm demand before cold marketing"
            title={`${recovery.length} existing opportunit${recovery.length === 1 ? "y" : "ies"} worth reviewing`}
            body="These are existing enquiries or quotes where the saved journey supports a communication step. BUSY does not treat every old lead as recoverable."
            footer="Real customer obligations and warm existing demand stay ahead of optional advertising."
            tone="green"
          />
        </>
      ) : null}

      {waiting.length ? (
        <>
          <Text style={styles.sectionLabel}>Waiting — do not over-chase</Text>
          {waiting.slice(0, 8).map((item) => (
            <Card
              key={item.id}
              eyebrow={item.service || "Customer conversation"}
              title={item.customerName}
              body={item.reason}
              footer={
                item.nextReviewDate
                  ? `Next sensible review: ${readableDate(item.nextReviewDate)}`
                  : "Wait for new information or an owner decision."
              }
              tone={item.dueForReview ? "amber" : "blue"}
            >
              <MetricRow
                left="Next review"
                right={readableDate(item.nextReviewDate)}
                strong={!!item.dueForReview}
              />
              <Button
                label="Open conversation"
                onPress={() => s.openCommunicationThread(item.customerId)}
              />
            </Card>
          ))}
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Provider bridge</Text>
      <Card
        eyebrow="Future real sending"
        title={engine.providerBridge?.status || "Provider-ready model only"}
        body={engine.providerBridge?.note || "BUSY models communication state without pretending a provider send happened."}
        footer="Email/SMS/WhatsApp can later attach behind this approval model without replacing the customer journey."
        tone="blue"
      >
        <MetricRow left="Email reachable" right={String(engine.providerBridge?.emailReachable || 0)} />
        <MetricRow left="Phone / messaging reachable" right={String(engine.providerBridge?.phoneReachable || 0)} />
        <MetricRow left="No saved contact route" right={String(engine.providerBridge?.noSavedRoute || 0)} />
        <MetricRow left="Real sending" right="Still owner-controlled / not enabled here" />
      </Card>

      <Button label="Ask BUSY who I should chase today" onPress={() => s.askBusyAboutFollowUps()} />
      <Button label="Communications Hub" onPress={s.openCommunicationsHub} />
      <Button label="Back to Work" onPress={() => s.jump("workHub", "Work")} />
    </Shell>
  );
}

export { FollowUpEngine };
