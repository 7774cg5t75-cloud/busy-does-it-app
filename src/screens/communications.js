import React from "react";
import { Text, View } from "react-native";

import * as Core from "../core/runtime";
const { formatUKDate } = Core;

import { styles } from "../theme/styles";
import { Shell, Card, Button, Field, Details, MetricRow, StatusChip } from "../components/ui";

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
  const [search,setSearch]=React.useState("");
  const [selectedLane,setSelectedLane]=React.useState("All");
  const query=search.trim().toLocaleLowerCase("en");
  const matches=thread=>!query||[thread.customerName,thread.service,thread.phone,thread.email].some(value=>String(value||"").toLocaleLowerCase("en").includes(query));
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
            : "Your recorded conversations"
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
          label="Review follow-up suggestions"
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

      <View style={styles.workspacePanel}>
       <Text accessibilityRole="header" style={styles.workspacePanelTitle}>Find a customer conversation</Text>
       <Field label="Find a conversation" value={search} onChangeText={setSearch} placeholder="Customer, contact or service"/>
       <View style={styles.choiceGrid}>{["All",...laneRows.map(([name])=>name)].map(name=><View key={name} style={styles.choiceCell}><Button compact selected={selectedLane===name} label={(selectedLane===name?"✓ ":"")+name} onPress={()=>setSelectedLane(name)}/></View>)}</View>
       <Text style={styles.workspaceMeta}>Filters affect joined conversations only. Unmatched incoming items and the totals above stay visible for review.</Text>
       {query||selectedLane!=="All"?<Button label="Clear conversation filters" onPress={()=>{setSearch("");setSelectedLane("All");}}/>:null}
       {!laneRows.some(([name,rows])=>(selectedLane==="All"||selectedLane===name)&&rows.some(matches))?<Text accessibilityLiveRegion="polite" style={styles.helper}>No joined conversations match this view. No records were removed.</Text>:null}
      </View>
      {laneRows.filter(([name])=>selectedLane==="All"||selectedLane===name).map(([lane, allRows]) => {
        const rows=allRows.filter(matches);return rows.length ? (
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
        ) : null;
      })}

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
  const live=React.useRef(s);live.current=s;
  const customerId=customer?.id,threadId=thread?.id,businessId=s.cloudWorkspace?.businessId,role=s.cloudWorkspace?.role,ownerId=s.ownerSession?.userId,view=s.screen;
  const malformedMessages=thread?.messages!=null&&(!Array.isArray(thread.messages)||thread.messages.some(item=>!item||typeof item!=="object"));
  const wrongBusiness=[customer?.businessId,customer?.business_id,thread?.businessId,thread?.business_id].some(id=>id&&id!==businessId);
  const foreignMessage=(Array.isArray(thread?.messages)?thread.messages:[]).some(item=>item?.customerId&&item.customerId!==customerId);
  const current=()=>live.current.selectedCommunicationThread===thread&&live.current.selectedCustomer===customer&&
    thread?.id===threadId&&thread?.customerId===customerId&&customer?.id===customerId&&
    live.current.cloudWorkspace?.businessId===businessId&&live.current.cloudWorkspace?.role===role&&live.current.ownerSession?.userId===ownerId&&
    live.current.ownerWorkspaceScope===s.ownerWorkspaceScope&&live.current.screen===view;
  const navigate=run=>{if(current())return run();return false;};
  if (!thread || !customer || thread.customerId!==customerId || wrongBusiness || foreignMessage || malformedMessages) {
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

  // Copy before chronological presentation; the domain retains its newest-first source.
  const orderedMessages=[...(thread.messages||[])].map((item,index)=>({item,index,time:Date.parse(item.createdAt||item.date||"")}))
    .sort((a,b)=>Number.isFinite(a.time)&&Number.isFinite(b.time)?a.time-b.time||a.index-b.index:Number.isFinite(a.time)?-1:Number.isFinite(b.time)?1:a.index-b.index).map(row=>row.item);
  const guard = thread.duplicateGuard || {};
  const incoming = thread.latestIncomingInterpretation || null;
  const followUp = s.selectedFollowUpCandidate || null;

  return (
    <Shell
      s={s}
      title={thread.customerName}
      subtitle="Customer conversation + journey context in one place."
      brandCue="Understand the context. Review the next step. You approve customer-facing communication."
    >
      <View style={styles.navigationSelection}><Text accessibilityRole="header" style={styles.workspacePanelTitle}>{thread.customerName||customer.name}</Text><Text style={styles.workspaceMeta}>{thread.service||"Service not recorded"}</Text><Text style={styles.workspaceMeta}>Recorded communication, prepared wording and private records have separate labels below. Outbound records are not provider delivery receipts.</Text></View>
      <Details label="Conversation references"><MetricRow left="Customer reference" right={customerId}/><MetricRow left="Conversation reference" right={threadId}/></Details>
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
          eyebrow="BUSY interpretation • review before using"
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
          eyebrow="Suggested follow-up • review required"
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
              onPress={() => navigate(()=>s.draftFollowUpCandidate(customerId))}
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
              onPress={() => navigate(()=>s.openCustomerJourneyNext(thread.nextAction))}
            />
          ) : null}
        </Card>
      ) : null}

      <Text style={styles.sectionLabel}>Conversation history</Text>
      <Text style={styles.workspaceMeta}>Oldest recorded dates first; undated records follow. This is the currently available history, not proof of every communication outside Busy.</Text>
      {orderedMessages.length ? (
        orderedMessages.map((item) => (
          <View key={item.id} style={styles.workflowCard}>
            <View style={styles.workflowHeader}>
              <View style={styles.workflowIdentity}>
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
                label={item.status || "Status not recorded"}
                tone={item.pendingInbox ? "amber" : item.direction === "outbound" ? "green" : "blue"}
              />
            </View>
            <Text style={styles.workspaceMeta}>{"Recorded source/channel: "+(item.source||"Not recorded")}</Text>
            <Text style={styles.workspaceMeta}>{item.direction==="draft"?"Prepared wording · not sent":item.direction==="outbound"?"Recorded outbound activity · not a delivery receipt":item.direction==="incoming"?"Recorded incoming information":"Saved record or private note · not a customer message"}</Text>
            <Text style={styles.activitySummary}>{readableDate(item.createdAt || item.date)}</Text>
            {item.body ? (
              <Text selectable style={styles.conversationBody}>{item.body}</Text>
            ) : null}
            {item.pendingInbox && item.inboxItemId ? (
              <Button
                label="Review this incoming item"
                onPress={() => navigate(()=>s.openCommunicationInboxItem(item.inboxItemId))}
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
        onPress={() => navigate(()=>s.draftCustomerReply(customerId))}
      />
      <Button
        label="Ask BUSY about this conversation"
        onPress={() => navigate(()=>s.askBusyAboutCommunication(customerId))}
      />
      <Button label="Open full customer journey" onPress={() => navigate(()=>s.openCustomer(customerId))} />
      <Button label="Back to Communications" onPress={s.openCommunicationsHub} />
    </Shell>
  );
}

export { CommunicationsHub, CommunicationThread };
