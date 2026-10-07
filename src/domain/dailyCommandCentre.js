function count(value) {
  return Math.max(0, Number(value) || 0);
}

function money(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueById(rows = []) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row?.id || seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function currentSnapshot({
  todayISO = "",
  executiveBriefing = {},
  workCalendarIntelligence = {},
  operationalContinuity = {},
  releaseCoreHealth = {},
  autopilotApprovalItems = [],
  autopilotNeedsInputItems = [],
  inboxNeedsAttentionItems = [],
  dueReminderEntries = [],
  dueQuoteEntries = [],
  staleEnquiryEntries = [],
  activeWorkGoal = null,
  workGoalRemainingJobs = 0,
  workGoalFilled = false,
  businessMemoryChanges = [],
  miniAppUnreadRequests = [],
} = {}) {
  const today = workCalendarIntelligence?.byDate?.[todayISO] || {};
  return {
    capturedAt: new Date().toISOString(),
    todayISO,
    confirmed7Count: count(executiveBriefing?.confirmed7?.count),
    confirmed7Value: money(executiveBriefing?.confirmed7?.value),
    todayBookings: count(today?.bookings?.length),
    todayBookedValue: money(today?.bookedValue),
    todayScheduledHours: Number(today?.scheduledHours || 0),
    todayOpenHours: Number(today?.estimatedOpenHours || 0),
    todayConflicts: count(today?.conflictCount),
    inboxAttention: count(inboxNeedsAttentionItems.length),
    dueReminders: count(dueReminderEntries.length),
    dueQuotes: count(dueQuoteEntries.length),
    quietEnquiries: count(staleEnquiryEntries.length),
    approvals: count(autopilotApprovalItems.length),
    ownerInput: count(autopilotNeedsInputItems.length),
    coreHigh: count(releaseCoreHealth?.highCount),
    continuityHigh: count(operationalContinuity?.highCount),
    continuityReview: count(operationalContinuity?.reviewCount),
    workGoalRemaining:
      activeWorkGoal && !workGoalFilled ? count(workGoalRemainingJobs) : 0,
    memoryChanges: count(businessMemoryChanges.length),
    miniAppUnreadMessages: safeArray(miniAppUnreadRequests).reduce(
      (total, item) => total + count(item?.business_unread_count),
      0
    ),
  };
}

function compareSnapshot(previous = null, current = {}) {
  if (!previous || typeof previous !== "object") return [];

  const rows = [];
  const add = (id, label, before, after, positiveWhenUp = null, suffix = "") => {
    if (Number(before || 0) === Number(after || 0)) return;
    const delta = Number(after || 0) - Number(before || 0);
    let tone = "blue";
    if (positiveWhenUp === true) tone = delta > 0 ? "green" : "amber";
    if (positiveWhenUp === false) tone = delta > 0 ? "amber" : "green";
    rows.push({
      id,
      label,
      before: Number(before || 0),
      after: Number(after || 0),
      delta,
      tone,
      summary: `${label}: ${before || 0}${suffix} → ${after || 0}${suffix}`,
    });
  };

  add(
    "confirmed7-value",
    "Confirmed 7-day value",
    previous.confirmed7Value,
    current.confirmed7Value,
    true,
    ""
  );
  add(
    "confirmed7-count",
    "Confirmed 7-day bookings",
    previous.confirmed7Count,
    current.confirmed7Count,
    true
  );
  add(
    "today-bookings",
    "Today's bookings",
    previous.todayBookings,
    current.todayBookings,
    null
  );
  add(
    "inbox",
    "Inbox items needing attention",
    previous.inboxAttention,
    current.inboxAttention,
    false
  );
  add(
    "quotes",
    "Quote follow-ups due",
    previous.dueQuotes,
    current.dueQuotes,
    false
  );
  add(
    "reminders",
    "Reminders due",
    previous.dueReminders,
    current.dueReminders,
    false
  );
  add(
    "quiet-enquiries",
    "Quiet enquiries",
    previous.quietEnquiries,
    current.quietEnquiries,
    false
  );
  add(
    "approvals",
    "Prepared approvals",
    previous.approvals,
    current.approvals,
    false
  );
  add(
    "owner-input",
    "Items needing owner input",
    previous.ownerInput,
    current.ownerInput,
    false
  );
  add(
    "calendar-conflicts",
    "Today's schedule overlaps",
    previous.todayConflicts,
    current.todayConflicts,
    false
  );
  add(
    "core-high",
    "High-priority core issues",
    previous.coreHigh,
    current.coreHigh,
    false
  );
  add(
    "continuity-high",
    "High-priority continuity issues",
    previous.continuityHigh,
    current.continuityHigh,
    false
  );
  add(
    "mini-app-unread",
    "Unread BUSY Apps messages",
    previous.miniAppUnreadMessages,
    current.miniAppUnreadMessages,
    false
  );
  add(
    "work-goal",
    "Work-goal bookings still needed",
    previous.workGoalRemaining,
    current.workGoalRemaining,
    false
  );

  return rows.slice(0, 8);
}

function buildDailyCommandCentre({
  todayISO = "",
  executiveBriefing = {},
  workCalendarIntelligence = {},
  operationalContinuity = {},
  releaseCoreHealth = {},
  autopilotApprovalItems = [],
  autopilotNeedsInputItems = [],
  inboxNeedsAttentionItems = [],
  dueReminderEntries = [],
  dueQuoteEntries = [],
  staleEnquiryEntries = [],
  activeWorkGoal = null,
  workGoalRemainingJobs = 0,
  workGoalFilled = false,
  businessMemoryChanges = [],
  proactiveNotices = [],
  miniAppUnreadRequests = [],
  previousCheckpoint = null,
} = {}) {
  const snapshot = currentSnapshot({
    todayISO,
    executiveBriefing,
    workCalendarIntelligence,
    operationalContinuity,
    releaseCoreHealth,
    autopilotApprovalItems,
    autopilotNeedsInputItems,
    inboxNeedsAttentionItems,
    dueReminderEntries,
    dueQuoteEntries,
    staleEnquiryEntries,
    activeWorkGoal,
    workGoalRemainingJobs,
    workGoalFilled,
    businessMemoryChanges,
    miniAppUnreadRequests,
  });

  const today = workCalendarIntelligence?.byDate?.[todayISO] || {};
  const futureDays = Object.values(workCalendarIntelligence?.byDate || {})
    .filter((day) => day?.date && day.date >= todayISO)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const doNow = [];

  if (count(releaseCoreHealth?.highCount)) {
    doNow.push({
      id: "core-health",
      lane: "do-now",
      eyebrow: "Protect the records",
      title: "Resolve the high-priority core-data issue",
      body: `${count(releaseCoreHealth.highCount)} high-priority consistency issue${count(releaseCoreHealth.highCount) === 1 ? "" : "s"} could distort the diary, pipeline or learning if left unresolved.`,
      why: "BUSY ranks trustworthy records ahead of optimisation and marketing.",
      tone: "amber",
      actionLabel: "Review core health",
      action: { kind: "route", route: "releaseCore" },
    });
  }

  if (count(today?.conflictCount)) {
    doNow.push({
      id: "today-conflict",
      lane: "do-now",
      eyebrow: "Protect today's diary",
      title: `${count(today.conflictCount)} potential schedule overlap${count(today.conflictCount) === 1 ? "" : "s"} today`,
      body: "BUSY found timed items that overlap. It has not moved anything automatically.",
      why: "A clash in today's live work can affect customers immediately.",
      tone: "amber",
      actionLabel: "Open today",
      action: { kind: "calendar-day", date: todayISO },
    });
  }

  if (count(operationalContinuity?.highCount)) {
    doNow.push({
      id: "continuity-high",
      lane: "do-now",
      eyebrow: "Connection safety",
      title: operationalContinuity?.headline || "A critical connection needs attention",
      body: "BUSY can keep working, but this issue is important enough to review before relying on the affected connection.",
      why: "High-severity continuity issues can make provider results uncertain.",
      tone: "amber",
      actionLabel: "Open Continuity Centre",
      action: { kind: "route", route: "operationalContinuity" },
    });
  }

  const miniAppUnread = safeArray(miniAppUnreadRequests)
    .filter((item) => count(item?.business_unread_count) > 0)
    .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  if (miniAppUnread.length) {
    const request = miniAppUnread[0];
    const unread = count(request.business_unread_count);
    doNow.push({
      id: `mini-app-unread-${request.id}`,
      lane: "do-now",
      eyebrow: "BUSY Apps conversation",
      title: `${unread} unread customer update${unread === 1 ? "" : "s"}`,
      body: request.request_type === "booking_request"
        ? `${request.contact_name || "A customer"} is waiting in a booking-request conversation.`
        : `${request.contact_name || "A customer"} has new activity on an enquiry.`,
      why: "A customer has actively replied through BUSY Apps, so this is live customer work rather than optional marketing.",
      tone: "amber",
      actionLabel: "Open conversation",
      action: { kind: "mini-app-request", requestId: request.id },
    });
  }

  const priority = executiveBriefing?.priority || {};
  if (priority.kind && priority.kind !== "clear") {
    doNow.push({
      id: `executive-${priority.kind}`,
      lane: "do-now",
      eyebrow: "Top business priority",
      title: priority.title || "Review the current priority",
      body: priority.body || "BUSY has identified the most important live business item.",
      why: "This comes from the Executive Briefing's record-backed priority order.",
      tone: "amber",
      actionLabel: priority.actionLabel || "Handle priority",
      action: { kind: "executive-priority" },
    });
  }

  if (!doNow.length && count(inboxNeedsAttentionItems.length)) {
    doNow.push({
      id: "inbox-attention",
      lane: "do-now",
      eyebrow: "Incoming information",
      title: `${count(inboxNeedsAttentionItems.length)} Inbox item${count(inboxNeedsAttentionItems.length) === 1 ? "" : "s"} need owner judgement`,
      body: "BUSY has not filed uncertain incoming information into customer records automatically.",
      why: "Uncertain incoming records are safer to resolve before creating new work.",
      tone: "amber",
      actionLabel: "Open BUSY Inbox",
      action: { kind: "open-inbox" },
    });
  }

  const laterToday = [];

  safeArray(today?.bookings).slice(0, 3).forEach((booking) => {
    laterToday.push({
      id: `booking-${booking.customerId}-${todayISO}`,
      lane: "later",
      eyebrow: "Booked work",
      title: `${booking.time || "Time not set"} • ${booking.customerName || "Customer"}`,
      body: `${booking.service || "Service"}${Number(booking.value) > 0 ? ` • £${booking.value}` : ""} • about ${Number(booking.durationHours || 2)}h`,
      why: "Confirmed customer work outranks optional marketing.",
      tone: "green",
      actionLabel: "Open booking",
      action: { kind: "customer-action", customerId: booking.customerId },
    });
  });

  safeArray(dueReminderEntries).slice(0, 2).forEach((item) => {
    laterToday.push({
      id: `reminder-${item.id}`,
      lane: "later",
      eyebrow: "Promised follow-up",
      title: `Follow up with ${item.customer?.name || "customer"}`,
      body: item.customer?.service || "Customer reminder is due.",
      why: "BUSY keeps existing promises ahead of generating colder demand.",
      tone: "blue",
      actionLabel: "Open reminder",
      action: { kind: "customer-action", customerId: item.id },
    });
  });

  safeArray(dueQuoteEntries).slice(0, 2).forEach((item) => {
    laterToday.push({
      id: `quote-${item.id}`,
      lane: "later",
      eyebrow: "Warm opportunity",
      title: `Chase ${item.customer?.name || "customer"}'s quote`,
      body: `${item.customer?.service || "Quote"} has been waiting ${count(item.age)} day${count(item.age) === 1 ? "" : "s"}.`,
      why: "Existing buying intent is usually more valuable than creating cold demand.",
      tone: "blue",
      actionLabel: "Open quote",
      action: { kind: "customer-action", customerId: item.id },
    });
  });

  if (count(autopilotApprovalItems.length)) {
    laterToday.push({
      id: "prepared-approvals",
      lane: "later",
      eyebrow: "Prepared for you",
      title: `${count(autopilotApprovalItems.length)} prepared item${count(autopilotApprovalItems.length) === 1 ? "" : "s"} are ready`,
      body: "BUSY has done the preparation but is still waiting at the existing approval boundary.",
      why: "Prepared work is useful once live customer obligations are under control.",
      tone: "green",
      actionLabel: "Open Approval Inbox",
      action: { kind: "route", route: "autopilotCentre" },
    });
  }

  if (activeWorkGoal && !workGoalFilled && count(workGoalRemainingJobs)) {
    laterToday.push({
      id: "work-goal",
      lane: "later",
      eyebrow: "Capacity goal",
      title: `Fill ${activeWorkGoal.label || "the current work gap"}`,
      body: `${count(workGoalRemainingJobs)} booking${count(workGoalRemainingJobs) === 1 ? "" : "s"} still needed to cover the saved goal.`,
      why: "BUSY only promotes demand generation after current obligations are visible.",
      tone: "blue",
      actionLabel: "Open best next move",
      action: { kind: "route", route: "bestMove" },
    });
  }

  const watch = [];

  const nextOverloaded = futureDays.find(
    (day) => day.date > todayISO && day.state === "Overloaded"
  );
  if (nextOverloaded) {
    watch.push({
      id: `overloaded-${nextOverloaded.date}`,
      lane: "watch",
      eyebrow: "Capacity watch",
      title: `${nextOverloaded.date} looks overloaded`,
      body: `${Number(nextOverloaded.scheduledHours || 0)}h scheduled • ${count(nextOverloaded.conflictCount)} potential overlap${count(nextOverloaded.conflictCount) === 1 ? "" : "s"}.`,
      why: "BUSY is flagging the day early rather than waiting for it to become today's problem.",
      tone: "amber",
      actionLabel: "Open that day",
      action: { kind: "calendar-day", date: nextOverloaded.date },
    });
  }

  const nextGap = workCalendarIntelligence?.nextGap;
  if (nextGap?.date && nextGap?.fillCandidate) {
    watch.push({
      id: `gap-${nextGap.date}`,
      lane: "watch",
      eyebrow: "Possible capacity",
      title: `${nextGap.date} has a sensible-looking gap`,
      body: `${nextGap.fillCandidate.customerName} • ${nextGap.fillCandidate.service} could fit the estimated ${Number(nextGap.estimatedOpenHours || 0)}h open capacity.`,
      why: "This is a planning suggestion from saved duration and repeat-customer evidence, not a guaranteed booking slot.",
      tone: "green",
      actionLabel: "Review the day",
      action: { kind: "calendar-day", date: nextGap.date },
    });
  }

  if (count(operationalContinuity?.reviewCount)) {
    watch.push({
      id: "continuity-review",
      lane: "watch",
      eyebrow: "Connection watch",
      title: "A connection is working with limits",
      body: operationalContinuity?.headline || "BUSY can keep working while a connection recovers.",
      why: "The affected integration is isolated, so this is a watch item unless it becomes high severity.",
      tone: "blue",
      actionLabel: "Open Continuity Centre",
      action: { kind: "route", route: "operationalContinuity" },
    });
  }

  safeArray(businessMemoryChanges).slice(0, 2).forEach((change, index) => {
    const title =
      typeof change === "string"
        ? change
        : change?.title || change?.summary || "Business Memory changed";
    watch.push({
      id: `memory-change-${index}`,
      lane: "watch",
      eyebrow: "Business Brain learned",
      title,
      body: "A recorded outcome changed how BUSY ranks an optional recommendation.",
      why: "Learning changes ranking, not factual customer records.",
      tone: "blue",
      actionLabel: "Open Business Memory",
      action: { kind: "route", route: "businessMemory" },
    });
  });

  safeArray(proactiveNotices).slice(0, 2).forEach((notice) => {
    watch.push({
      id: `notice-${notice.id || notice.title}`,
      lane: "watch",
      eyebrow: notice.category || "BUSY noticed",
      title: notice.title || "Something is worth watching",
      body: notice.body || "",
      why: "This is a proactive signal, not an automatic instruction.",
      tone: notice.tone || "blue",
      actionLabel: "Open watchlist",
      action: { kind: "route", route: "proactiveWatch" },
    });
  });

  const changes = compareSnapshot(previousCheckpoint, snapshot);
  const noUrgent = doNow.length === 0;
  const headline = noUrgent
    ? "Nothing urgent is forcing itself to the top"
    : doNow[0].title;

  return {
    todayISO,
    headline,
    status: noUrgent ? "Clear" : "Action needed",
    currentSnapshot: snapshot,
    previousCheckpoint,
    changes,
    doNow: uniqueById(doNow).slice(0, 4),
    laterToday: uniqueById(laterToday).slice(0, 6),
    watch: uniqueById(watch).slice(0, 6),
    metrics: {
      confirmed7Count: snapshot.confirmed7Count,
      confirmed7Value: snapshot.confirmed7Value,
      todayBookings: snapshot.todayBookings,
      todayBookedValue: snapshot.todayBookedValue,
      todayScheduledHours: snapshot.todayScheduledHours,
      todayOpenHours: snapshot.todayOpenHours,
      approvals: snapshot.approvals,
      ownerInput: snapshot.ownerInput,
    },
  };
}

export { buildDailyCommandCentre };
