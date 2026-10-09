import React from "react";
import { Text, View } from "react-native";

import { styles } from "../theme/styles";
import { Shell, Card, Button, MetricRow, StatusChip } from "../components/ui";

function money(value) {
  return `£${Math.round(Number(value) || 0).toLocaleString("en-GB")}`;
}

function DailyCommandCentre({ s }) {
  const centre = s.dailyCommandCentre || {};
  const changes = Array.isArray(centre.changes) ? centre.changes : [];
  const doNow = Array.isArray(centre.doNow) ? centre.doNow : [];
  const later = Array.isArray(centre.laterToday) ? centre.laterToday : [];
  const watch = Array.isArray(centre.watch) ? centre.watch : [];
  const metrics = centre.metrics || {};

  const renderLane = (title, rows, emptyTitle, emptyBody) => (
    <>
      <Text style={styles.sectionLabel}>{title}</Text>
      {rows.length ? (
        rows.map((item) => (
          <Card
            key={item.id}
            eyebrow={item.eyebrow || title}
            title={item.title}
            body={item.body}
            footer={item.why}
            tone={item.tone || "blue"}
          >
            {item.actionLabel ? (
              <Button
                label={item.actionLabel}
                primary={title === "Do now"}
                onPress={() => s.openDailyCommandItem(item)}
              />
            ) : null}
          </Card>
        ))
      ) : (
        <Card
          eyebrow={title}
          title={emptyTitle}
          body={emptyBody}
          tone="green"
        />
      )}
    </>
  );

  return (
    <Shell
      s={s}
      title="Today’s priorities"
      subtitle="One place for what matters now, what can wait, and what is worth watching."
      brandCue="Your most important tasks come first."
    >
      <Card
        eyebrow="Your day so far"
        title={centre.headline || "BUSY has checked the business"}
        body={
          centre.status === "Action needed"
            ? "BUSY has ranked the current business state and put the most important live item first."
            : "BUSY has checked customer work, capacity, approvals, core health and current risks without manufacturing a task."
        }
        tone={centre.status === "Action needed" ? "amber" : "green"}
      >
        <View style={{ alignItems: "flex-start", marginBottom: 10 }}>
          <StatusChip
            label={centre.status || "Clear"}
            tone={centre.status === "Action needed" ? "amber" : "green"}
          />
        </View>
        <MetricRow
          left="Confirmed next 7 days"
          right={`${metrics.confirmed7Count || 0} • ${money(metrics.confirmed7Value)}`}
          strong={Number(metrics.confirmed7Value || 0) > 0}
        />
        <MetricRow
          left="Today's booked work"
          right={`${metrics.todayBookings || 0} • ${money(metrics.todayBookedValue)}`}
          strong={Number(metrics.todayBookings || 0) > 0}
        />
        <MetricRow
          left="Today's scheduled load"
          right={`${Number(metrics.todayScheduledHours || 0)}h`}
        />
        <MetricRow
          left="Estimated open capacity"
          right={`~${Number(metrics.todayOpenHours || 0)}h`}
        />
        <MetricRow
          left="Prepared approvals"
          right={String(metrics.approvals || 0)}
        />
        <MetricRow
          left="Needs your input"
          right={String(metrics.ownerInput || 0)}
          strong={Number(metrics.ownerInput || 0) > 0}
        />
      </Card>

      <Card
        eyebrow="Since your last briefing"
        title={
          centre.previousCheckpoint
            ? changes.length
              ? `${changes.length} meaningful change${changes.length === 1 ? "" : "s"}`
              : "Nothing material has changed"
            : "BUSY is ready to create a comparison baseline"
        }
        body={
          centre.previousCheckpoint
            ? changes.length
              ? "These are changes in the underlying saved business signals, not AI guesses."
              : "The main workload, obligation and risk signals are materially the same as your last reviewed briefing."
            : "Mark this briefing reviewed once and future visits can show what has materially moved."
        }
        tone={changes.some((item) => item.tone === "amber") ? "amber" : "blue"}
      >
        {changes.map((item) => (
          <MetricRow
            key={item.id}
            left={item.label}
            right={`${item.before} → ${item.after}`}
            strong={item.tone === "amber"}
          />
        ))}
        <Button
          label="Mark this briefing reviewed"
          onPress={s.markDailyCommandReviewed}
        />
      </Card>

      {renderLane(
        "Do now",
        doNow,
        "Nothing urgent is forcing itself to the top",
        "BUSY found no live customer, record, calendar or connection issue important enough to manufacture an urgent task."
      )}

      {renderLane(
        "Later today",
        later,
        "No queued work needs adding here",
        "The current saved records do not create a useful later-today queue."
      )}

      {renderLane(
        "Watch",
        watch,
        "Nothing material needs watching",
        "BUSY has no forward capacity, learning or connection signal strong enough to surface right now."
      )}

      <Card
        eyebrow="Why this order?"
        title="BUSY ranks obligations before opportunities"
        body="Live customer commitments, record integrity and schedule conflicts come first. Warm existing demand comes next. Optional marketing and speculative growth sit behind those unless the saved business evidence says otherwise."
        tone="blue"
      />

      <Button
        label="Ask BUSY for my briefing"
        primary
        onPress={() => {
          s.openTalkToBusy(false);
          setTimeout(() => {
            s.submitBusyCommand({
              text: "Give me my daily briefing: what do I need to do now, what can wait until later today, and what should I watch?",
            });
          }, 80);
        }}
      />
      <Button label="Back to Home" onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { DailyCommandCentre };
