import React from "react";
import { Text, TextInput, View } from "react-native";

import { styles } from "../theme/styles";
import {
  Shell,
  Card,
  Button,
  Choice,
  ToggleRow,
  MetricRow,
  StatusChip,
} from "../components/ui";

function ProactiveBusyCentre({ s }) {
  const scheduled = Object.entries(s.proactiveScheduledMap || {})
    .map(([key, item]) => ({ key, ...item }))
    .sort((a, b) => String(a.triggerAt || "").localeCompare(String(b.triggerAt || "")));

  return (
    <Shell
      s={s}
      title="Proactive BUSY"
      subtitle="BUSY can bring the important things to you at the right time, without turning every opportunity into an interruption."
      brandCue="Customer obligations first. Quiet hours respected. No notification grants permission to send, publish or spend."
    >
      <Card
        eyebrow="V3.23 • Notifications"
        title={
          s.proactiveNotificationsEnabled
            ? "Proactive reminders are on"
            : "Turn on proactive reminders when you want them"
        }
        body={
          s.proactiveNotificationsEnabled
            ? `BUSY currently has ${scheduled.length} local reminder${scheduled.length === 1 ? "" : "s"} scheduled from the latest saved business state.`
            : "BUSY will ask the device for notification permission, then schedule only the morning briefing, genuine job reminders and the highest-value due items."
        }
        footer={`Permission: ${s.proactiveNotificationPermission}`}
        tone={s.proactiveNotificationsEnabled ? "green" : "blue"}
      >
        {s.proactiveNotificationsEnabled ? (
          <>
            <Button label="Refresh reminder schedule" primary onPress={() => s.refreshProactiveNotifications({ force: true })} />
            <Button label="Send me a test in 10 seconds" onPress={s.testProactiveNotification} />
            <Button label="Turn proactive reminders off" onPress={s.disableProactiveNotifications} />
          </>
        ) : (
          <Button label="Enable proactive reminders" primary onPress={s.enableProactiveNotifications} />
        )}
      </Card>

      <Card
        eyebrow="Interruption rules"
        title="Quiet when it can be • immediate only when it matters"
        body="Morning briefings and optional reminders move outside quiet hours. BUSY still keeps the underlying item visible in the app if a notification is suppressed."
        tone="blue"
      >
        <ToggleRow
          title="Quiet hours"
          body={s.proactiveQuietHoursEnabled ? `${s.proactiveQuietStart}–${s.proactiveQuietEnd}` : "Disabled"}
          value={s.proactiveQuietHoursEnabled}
          onValueChange={s.setProactiveQuietHoursEnabled}
        />
        <Text style={styles.proactiveFieldLabel}>Morning briefing time</Text>
        <TextInput
          value={s.proactiveMorningTime}
          onChangeText={s.setProactiveMorningTime}
          placeholder="08:00"
          placeholderTextColor="#8A94A4"
          style={styles.proactiveCompactInput}
        />
        <Text style={styles.proactiveFieldLabel}>Quiet from</Text>
        <TextInput
          value={s.proactiveQuietStart}
          onChangeText={s.setProactiveQuietStart}
          placeholder="20:00"
          placeholderTextColor="#8A94A4"
          style={styles.proactiveCompactInput}
        />
        <Text style={styles.proactiveFieldLabel}>Quiet until</Text>
        <TextInput
          value={s.proactiveQuietEnd}
          onChangeText={s.setProactiveQuietEnd}
          placeholder="07:00"
          placeholderTextColor="#8A94A4"
          style={styles.proactiveCompactInput}
        />
        <Text style={styles.proactiveFieldLabel}>Job reminder lead time</Text>
        <View style={styles.proactiveChoiceRow}>
          {[30, 60, 120].map((minutes) => (
            <Choice
              key={minutes}
              label={minutes === 60 ? "1 hour" : minutes === 120 ? "2 hours" : "30 min"}
              selected={Number(s.proactiveJobReminderMinutes) === minutes}
              onPress={() => s.setProactiveJobReminderMinutes(minutes)}
            />
          ))}
        </View>
      </Card>

      <Text style={styles.sectionLabel}>What BUSY plans to remind you about</Text>
      {(s.proactiveNotificationCandidates || []).length ? (
        s.proactiveNotificationCandidates.map((item) => (
          <Card
            key={item.key}
            eyebrow="Planned reminder"
            title={item.title}
            body={item.body}
            footer={new Date(item.triggerAt).toLocaleString("en-GB")}
            tone={item.priority >= 90 ? "green" : "blue"}
          >
            <Button
              label="Remind me in 1 hour instead"
              onPress={() => s.remindProactiveItemLater(item, 60)}
            />
          </Card>
        ))
      ) : (
        <Card
          eyebrow="No reminders scheduled from current records"
          title="BUSY is not forcing activity"
          body="Enable notifications or add a genuine time-sensitive booking/obligation and BUSY will build a small, prioritised schedule."
          tone="blue"
        />
      )}

      <Card
        eyebrow="Connected diary"
        title={
          s.diaryConnection?.status === "connected"
            ? s.diaryConnection.title || "Device calendar connected"
            : "Connect a device calendar"
        }
        body={
          s.diaryConnection?.status === "connected"
            ? `BUSY can create/update its confirmed bookings in this calendar and read other calendar commitments locally for the Forward View. External calendar changes are never silently applied to BUSY bookings.`
            : "Choose a writable calendar on this device. If your Google Calendar account is already added to the phone, its calendar can appear here as a selectable calendar."
        }
        footer={
          s.diaryConnection?.lastSyncAt
            ? `Last sync: ${new Date(s.diaryConnection.lastSyncAt).toLocaleString("en-GB")}`
            : "Calendar contents stay on-device in this V3.23 bridge"
        }
        tone={s.diaryConnection?.status === "connected" ? "green" : "blue"}
      >
        {s.diaryConnection?.status === "connected" ? (
          <>
            <MetricRow left="Source" right={s.diaryConnection.source || "Device calendar"} />
            <MetricRow left="BUSY events mapped" right={String(Object.keys(s.diaryEventMap || {}).length)} />
            <MetricRow left="Other commitments next 7d" right={String(s.diaryExternalEvents?.length || 0)} />
            <MetricRow left="Conflicts needing review" right={String(s.diaryConflicts?.length || 0)} strong={(s.diaryConflicts?.length || 0) > 0} />
            <Button label={s.diarySyncStatus === "syncing" ? "Syncing…" : "Sync diary now"} primary disabled={s.diarySyncStatus === "syncing"} onPress={s.syncDiaryNow} />
            <Button label="Choose a different calendar" onPress={s.loadDeviceCalendars} />
            <Button label="Disconnect diary" onPress={s.disconnectDiary} />
          </>
        ) : (
          <Button label="Find calendars on this device" primary onPress={s.loadDeviceCalendars} />
        )}
      </Card>

      {s.diaryCalendars?.length ? (
        <>
          <Text style={styles.sectionLabel}>Available calendars</Text>
          {s.diaryCalendars.map((calendar) => (
            <Choice
              key={calendar.id}
              label={calendar.title}
              sub={calendar.source}
              selected={s.diaryConnection?.calendarId === calendar.id}
              onPress={() => s.selectDiaryCalendar(calendar)}
            />
          ))}
        </>
      ) : null}

      {s.diaryConflicts?.length ? (
        <>
          <Text style={styles.sectionLabel}>Diary changes need your decision</Text>
          {s.diaryConflicts.map((conflict) => (
            <Card
              key={conflict.id}
              eyebrow="Calendar changed"
              title={conflict.customerName}
              body={`BUSY has ${conflict.busyDate} at ${conflict.busyTime || "time not set"}, while the connected calendar now says ${conflict.calendarDate} at ${conflict.calendarTime || "time not set"}.`}
              footer="BUSY will not guess which is correct"
              tone="amber"
            >
              <Button label="Keep BUSY booking time" primary onPress={() => s.keepBusyDiaryTime(conflict)} />
              <Button label="Use calendar time in BUSY" onPress={() => s.useCalendarDiaryTime(conflict)} />
            </Card>
          ))}
        </>
      ) : null}

      {s.diaryExternalEvents?.length ? (
        <>
          <Text style={styles.sectionLabel}>Other calendar commitments • next 7 days</Text>
          {s.diaryExternalEvents.slice(0, 8).map((event) => (
            <View key={event.id} style={styles.activityCard}>
              <Text style={styles.activityName}>{event.title}</Text>
              <Text style={styles.activityService}>
                {event.date} {event.time ? `• ${event.time}` : ""} {event.durationHours ? `• about ${event.durationHours}h` : ""}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      <Card
        eyebrow="Deep-link boundary"
        title="A reminder opens the exact work — it does not execute it"
        body="Tapping a booking reminder opens that booking. A quote alert opens its follow-up review. Approval alerts open the Approval Inbox. Customer sends, public posts, spend and important booking changes still require explicit owner action."
        tone="green"
      />

      {s.proactiveNotificationLog?.length ? (
        <Card
          eyebrow="Recent proactive activity"
          title="Notification + diary activity log"
          tone="blue"
        >
          {s.proactiveNotificationLog.slice(0, 6).map((item) => (
            <MetricRow
              key={item.id}
              left={item.title}
              right={new Date(item.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            />
          ))}
        </Card>
      ) : null}

      <Button label="Executive Briefing" onPress={() => s.go("executiveBriefing")} />
      <Button label="Back to Home" primary onPress={() => s.jump("home", "Home")} />
    </Shell>
  );
}

export { ProactiveBusyCentre };
