import React from "react";
import { Text, View } from "react-native";

import * as Core from "../core/runtime";
const { formatUKDate } = Core;

import { styles } from "../theme/styles";
import { Shell, Card, Button, MetricRow, StatusChip } from "../components/ui";

function laneTone(lane = "") {
  if (lane === "Needs attention") return "amber";
  if (lane === "Awaiting customer") return "blue";
  if (lane === "Draft ready") return "green";
  return "blue";
}

function readableDate(value = "") {
  const iso = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? formatUKDate(iso) : "Date not recorded";
}

function CommunicationsHub({ s }) {
  const hub = s.communicationsHub || {};
  const lanes = hub.lanes || {};
  const counts = hub.counts || {};
  const laneRows = [
    ["Needs attention", lanes["Needs attention"] || []],
    ["Awaiting customer", lanes["Awaiting customer"] || []],
    ["Draft ready", lanes["Draft ready"] || []],
    ["Done", lanes.Done || []],
  ];

  return (
    <Shell
      s={s}
      title="Messages & replies"
      subtitle="One view of customer conversations, waiting replies and prepared next steps."
      brandCue="BUSY can prepare replies, but sending still needs approval."
    >
      <Card
        eyebrow="Your conversations"
        title={
          counts.needsAttention
            ? `${counts.needsAttention} conversation${counts.needsAttention === 1 ? "" : "s"} need attention`
            : "No communication emergency is being manufactured"
        }
        body="BUSY joins customer messages, recorded follow-ups, quote communication, review requests and unresolved Inbox items around the customer journey."
        footer="Prepared/simulated wording is kept separate from communication recorded as sent."
        tone={counts.needsAttention ? "amber" : "green"}
      >
        <MetricRow
          left="Needs attention"
          right={String(counts.needsAttention || 0)}
          strong={(counts.needsAttention || 0) > 0}
        />
        <MetricRow
          left="Awaiting customer"
          right={String(counts.awaitingCustomer || 0)}
        />
        <MetricRow
          left="Draft ready"
          right={String(counts.draftReady || 0)}
        />
        <MetricRow left="Done / no action" right={String(counts.done || 0)} />
        <MetricRow
          left="Unmatched incoming"
          right={String(counts.unmatched || 0)}
          strong={(counts.unmatched || 0) > 0}
        />
        <MetricRow
          left="Follow-ups ready now"
          right={String(
            Number(s.followUpEngine?.counts?.replyNow || 0) +
              Number(s.followUpEngine?.counts?.followUpToday || 0)
          )}
          strong={
            Number(s.followUpEngine?.counts?.replyNow || 0) +
              Number(s.followUpEngine?.counts?.followUpToday || 0) >
            0
          }
        />
        <Button
          label="Open V3.33 Follow-up Engine"
          primary={
            Number(s.followUpEngine?.counts?.replyNow || 0) +
              Number(s.followUpEngine?.counts?.followUpToday || 0) >
            0
          }
          onPress={s.openFollowUpEngine}
        />
      </Card>

      {(hub.unmatched || []).length ? (
        <>
          <Text style={styles.sectionLabel}>Needs attention • unmatched</Text>
          {(hub.unmatched || []).map((item) => (
            <Card
              key={item.id}
              eyebrow={item.source || "Incoming"}
              title={item.title}
              body={item.reason}
              footer={item.interpretation?.summary || "BUSY needs one safe customer match before filing this."}
              tone="amber"
            >
              <MetricRow
                left="Message read"
                right={item.interpretation?.label || "Needs context"}
              />
              <Button
                label="Review incoming item"
                primary
                onPress={() => s.openCommunicationInboxItem(item.id)}
              />
            </Card>
          ))}
        </>
      ) : null}

      {laneRows.map(([lane, rows]) =>
        rows.length ? (
          <React.Fragment key={lane}>
            <Text style={styles.sectionLabel}>{lane}</Text>
            {rows.map((thread) => (
              <Card
                key={thread.id}
                eyebrow={thread.service || "Customer conversation"}
                title={thread.customerName}
                body={thread.latestSummary}
                footer={
                  lane === "Awaiting customer"
                    ? "Latest recorded contact is outbound — BUSY suppresses duplicate chasing."
                    : thread.nextAction?.why ||
                      "Open the thread to see the joined conversation and customer journey context."
                }
                tone={laneTone(lane)}
              >
                <View style={{ alignItems: "flex-start", marginBottom: 8 }}>
                  <StatusChip label={lane} tone={laneTone(lane)} />
                </View>
                <MetricRow
                  left="Recorded conversation items"
                  right={String(thread.recordedMessageCount || 0)}
                />
                <MetricRow
                  left="Pending incoming"
                  right={String(thread.pendingInboxCount || 0)}
                  strong={(thread.pendingInboxCount || 0) > 0}
                />
                {thread.latestIncomingInterpretation ? (
                  <MetricRow
                    left="Latest incoming looks like"
                    right={thread.latestIncomingInterpretation.label}
                  />
                ) : null}
                <Button
                  label="Open conversation"
                  primary={lane === "Needs attention"}
                  onPress={() => s.openCommunicationThread(thread.customerId)}
                />
              </Card>
            ))}
          </React.Fragment>
        ) : null
      )}

      {!hub.threads?.length && !hub.unmatched?.length ? (
        <Card
          eyebrow="Nothing waiting"
          title="No customer conversations need surfacing yet"
          body="BUSY will use real saved customer communication as it appears rather than inventing an Inbox."
          tone="green"
        />
      ) : null}

      <Button
        label="Ask BUSY who needs a reply"
        onPress={() => s.askBusyAboutCommunications()}
      />
      <Button label="Incoming items" onPress={s.openBusyInbox} />
      <Button label="Back to Work" onPress={() => s.jump("workHub", "Work")} />
    </Shell>
  );
}

function CommunicationThread({ s }) {
  const thread = s.selectedCommunicationThread;
  const customer = s.selectedCustomer;
  if (!thread || !customer) {
    return (
      <Shell
        s={s}
        title="Conversation unavailable"
        subtitle="BUSY could not safely reopen that customer conversation."
      >
        <Button label="Back to messages" primary onPress={s.openCommunicationsHub} />
      </Shell>
    );
  }

  const guard = thread.duplicateGuard || {};
  const incoming = thread.latestIncomingInterpretation || null;
  const followUp = s.selectedFollowUpCandidate || null;

  return (
    <Shell
      s={s}
      title={thread.customerName}
      subtitle="Customer conversation + journey context in one place."
      brandCue="V3.33 • Understand → prioritise → prepare. You still approve customer-facing communication."
    >
      <Card
        eyebrow="Conversation state"
        title={thread.lane}
        body={thread.latestSummary}
        footer={
          thread.contactAllowed
            ? "Contact allowed on this customer record"
            : "Do not contact — outbound suggestions are blocked"
        }
        tone={laneTone(thread.lane)}
      >
        <MetricRow left="Service" right={thread.service || "Not recorded"} />
        <MetricRow
          left="Recorded conversation items"
          right={String(thread.recordedMessageCount || 0)}
        />
        <MetricRow
          left="Pending incoming"
          right={String(thread.pendingInboxCount || 0)}
          strong={(thread.pendingInboxCount || 0) > 0}
        />
        <MetricRow
          left="Phone"
          right={thread.phone ? "Available" : "Not recorded"}
        />
        <MetricRow
          left="Email"
          right={thread.email ? "Available" : "Not recorded"}
        />
      </Card>

      {incoming ? (
        <Card
          eyebrow="Latest incoming • BUSY read"
          title={incoming.label}
          body={incoming.summary}
          footer={incoming.suggestedHandling}
          tone={incoming.kind === "decline" || incoming.kind === "price-concern" ? "amber" : "blue"}
        >
          <MetricRow left="Interpretation confidence" right={incoming.confidence} />
        </Card>
      ) : null}

      {followUp ? (
        <Card
          eyebrow="V3.33 • Follow-up decision"
          title={followUp.title}
          body={followUp.reason}
          footer={
            followUp.nextReviewDate
              ? `Next sensible review: ${readableDate(followUp.nextReviewDate)}`
              : "BUSY is using the saved conversation and journey state, not a generic chase timer."
          }
          tone={followUp.lane === "Reply now" ? "amber" : followUp.lane === "Follow up today" ? "green" : "blue"}
        >
          <MetricRow left="Decision" right={followUp.lane} strong={followUp.draftable} />
          <MetricRow left="Suggested route" right={followUp.preferredChannel} />
          <MetricRow left="Transport state" right={followUp.transportState} />
          {followUp.draftable ? (
            <Button
              label="Draft this follow-up with BUSY"
              primary
              onPress={() => s.draftFollowUpCandidate(thread.customerId)}
            />
          ) : null}
        </Card>
      ) : null}

      <Card
        eyebrow="Duplicate-contact protection"
        title={guard.title || "Communication check"}
        body={guard.body || "BUSY has checked the latest recorded inbound and outbound communication."}
        footer={
          guard.blocked
            ? "Another chase is deliberately suppressed until the situation changes."
            : "This safeguard checks recorded communication, not messages that exist outside BUSY."
        }
        tone={guard.blocked ? "amber" : "green"}
      />

      {thread.nextAction ? (
        <Card
          eyebrow="Customer journey says next"
          title={thread.nextAction.title}
          body={thread.nextAction.body}
          footer={thread.nextAction.why}
          tone={thread.stalledSignals?.length ? "amber" : "green"}
        >
          {thread.nextAction.actionLabel ? (
            <Button
              label={thread.nextAction.actionLabel}
              onPress={() => s.openCustomerJourneyNext(thread.nextAction)}
            />
          ) : null}
        </Card>
      ) : null}

      <Text style={styles.sectionLabel}>Conversation history</Text>
      {(thread.messages || []).length ? (
        thread.messages.map((item) => (
          <View key={item.id} style={styles.customerTimelineCard}>
            <View style={styles.activityTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.customerTimelineLabel}>
                  {item.direction === "incoming"
                    ? "INCOMING"
                    : item.direction === "outbound"
                    ? "OUTBOUND"
                    : item.direction === "draft"
                    ? "DRAFT / PREPARED"
                    : "RECORD"}
                </Text>
                <Text style={styles.activityName}>{item.title}</Text>
              </View>
              <StatusChip
                label={item.status || item.source || "Recorded"}
                tone={item.pendingInbox ? "amber" : item.direction === "outbound" ? "green" : "blue"}
              />
            </View>
            <Text style={styles.activitySummary}>
              {readableDate(item.createdAt || item.date)}
            </Text>
            {item.body ? (
              <Text style={styles.customerHistoryNote}>{item.body}</Text>
            ) : null}
            {item.pendingInbox && item.inboxItemId ? (
              <Button
                label="Review this incoming item"
                onPress={() => s.openCommunicationInboxItem(item.inboxItemId)}
              />
            ) : null}
          </View>
        ))
      ) : (
        <Card
          eyebrow="Conversation"
          title="No recorded messages yet"
          body="The customer journey exists, but no customer-facing communication has been captured in BUSY yet."
          tone="blue"
        />
      )}

      <Button
        label="Draft a reply with BUSY"
        primary={!guard.blocked && thread.contactAllowed}
        disabled={guard.blocked || !thread.contactAllowed}
        onPress={() => s.draftCustomerReply(thread.customerId)}
      />
      <Button
        label="Ask BUSY about this conversation"
        onPress={() => s.askBusyAboutCommunication(thread.customerId)}
      />
      <Button label="Open full customer journey" onPress={() => s.openCustomer(thread.customerId)} />
      <Button label="Back to Communications" onPress={s.openCommunicationsHub} />
    </Shell>
  );
}

export { CommunicationsHub, CommunicationThread };
