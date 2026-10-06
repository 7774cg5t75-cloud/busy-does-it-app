const DEFAULT_PLANNING_CAPACITY_HOURS = 7.5;

function normaliseDate(value = "") {
  const text = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function parseClock(value = "") {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) return null;
  return hour * 60 + minute;
}

function serviceDurationHours(services = [], serviceName = "") {
  const row = (Array.isArray(services) ? services : []).find(
    (item) => String(item?.name || "") === String(serviceName || "")
  );
  return Math.max(0.5, Number(row?.durationHours) || 2);
}

function valueForCustomer(customer = null, service = null) {
  return (
    Number(customer?.lastJobValue) ||
    Number(service?.value) ||
    0
  );
}

function overlaps(a, b) {
  if (!a || !b || a.date !== b.date) return false;
  if (
    !Number.isFinite(a.startMinute) ||
    !Number.isFinite(a.endMinute) ||
    !Number.isFinite(b.startMinute) ||
    !Number.isFinite(b.endMinute)
  ) return false;
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}

function workloadState(hours, capacityHours, conflictCount = 0) {
  if (conflictCount > 0 || hours > capacityHours + 0.25) return "Overloaded";
  if (hours === 0) return "Open";
  const ratio = capacityHours > 0 ? hours / capacityHours : 0;
  if (ratio < 0.34) return "Light";
  if (ratio < 0.74) return "Comfortable";
  return "Busy";
}

function loadTone(state) {
  if (state === "Overloaded") return "amber";
  if (state === "Busy") return "blue";
  if (state === "Comfortable") return "green";
  if (state === "Light") return "blue";
  return "green";
}

function routeForAttention(kind = "") {
  if (kind === "quote") return "staleQuotes";
  if (kind === "enquiry") return "customerRecords";
  if (kind === "reminder") return "customerActivity";
  return "workHub";
}

function buildAttentionRows({
  replyActions = {},
  customers = [],
  todayISO = "",
} = {}) {
  const rows = [];
  const customerById = Object.fromEntries(
    (Array.isArray(customers) ? customers : []).map((customer) => [
      customer.id,
      customer,
    ])
  );

  Object.entries(replyActions || {}).forEach(([customerId, action]) => {
    const customer = customerById[customerId];
    if (!customer || !action?.type) return;

    if (
      action.type === "quote" &&
      action?.done &&
      action.details?.quoteStatus === "Sent" &&
      !action.details?.followUpSentAt
    ) {
      const dueDate = normaliseDate(
        action.details?.followUpDueDate ||
          String(action.details?.quoteSentAt || action.completedAt || "").slice(0, 10)
      );
      if (dueDate) {
        rows.push({
          id: `quote-${customerId}-${dueDate}`,
          kind: "quote",
          customerId,
          customerName: customer.name || "Customer",
          service: customer.service || "",
          date: !!todayISO && dueDate < todayISO ? todayISO : dueDate,
          dueDate,
          title: "Quote follow-up",
          body: `${customer.name || "Customer"} • ${customer.service || "service"}`,
          overdue: !!todayISO && dueDate < todayISO,
          value: Number(action.details?.quoteAmount) || 0,
          route: routeForAttention("quote"),
        });
      }
    }

    if (
      action.type === "reminder" &&
      action?.done &&
      action.details?.reminderDate &&
      action.details?.reminderStatus !== "Completed"
    ) {
      const dueDate = normaliseDate(action.details.reminderDate);
      if (dueDate) {
        rows.push({
          id: `reminder-${customerId}-${dueDate}`,
          kind: "reminder",
          customerId,
          customerName: customer.name || "Customer",
          service: customer.service || "",
          date: !!todayISO && dueDate < todayISO ? todayISO : dueDate,
          dueDate,
          title: "Follow-up reminder",
          body: `${customer.name || "Customer"}${action.details?.reminderNote ? ` • ${action.details.reminderNote}` : ""}`,
          overdue: !!todayISO && dueDate < todayISO,
          value: 0,
          route: routeForAttention("reminder"),
        });
      }
    }
  });

  (Array.isArray(customers) ? customers : []).forEach((customer) => {
    if (
      !customer ||
      replyActions?.[customer.id] ||
      customer.enquiryFollowUpOutcomeRecordedAt ||
      customer.enquiryFollowUpSentAt
    ) return;

    const sourceDate = normaliseDate(
      customer.nextEnquiryCheckDate ||
        String(customer.currentEnquiryAt || customer.createdAt || "").slice(0, 10)
    );
    if (!sourceDate) return;

    let dueDate = sourceDate;
    if (!customer.nextEnquiryCheckDate) {
      const date = new Date(`${sourceDate}T12:00:00`);
      if (!Number.isNaN(date.getTime())) {
        date.setDate(date.getDate() + 7);
        dueDate = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, "0"),
          String(date.getDate()).padStart(2, "0"),
        ].join("-");
      }
    }

    rows.push({
      id: `enquiry-${customer.id}-${dueDate}`,
      kind: "enquiry",
      customerId: customer.id,
      customerName: customer.name || "Customer",
      service: customer.service || "",
      date: !!todayISO && dueDate < todayISO ? todayISO : dueDate,
      dueDate,
      title: "Enquiry check-in",
      body: `${customer.name || "Customer"} • ${customer.service || "service"}`,
      overdue: !!todayISO && dueDate < todayISO,
      value: Number(customer.lastJobValue) || 0,
      route: routeForAttention("enquiry"),
    });
  });

  return rows.sort(
    (a, b) =>
      String(a.date).localeCompare(String(b.date)) ||
      String(a.customerName).localeCompare(String(b.customerName))
  );
}

function buildFillCandidates({
  eligibleCustomers = [],
  services = [],
} = {}) {
  return (Array.isArray(eligibleCustomers) ? eligibleCustomers : [])
    .map((customer) => {
      const service = (Array.isArray(services) ? services : []).find(
        (item) => item?.name === customer?.service
      );
      return {
        customerId: customer?.id || "",
        customerName: customer?.name || "Customer",
        service: customer?.service || "Service",
        durationHours: serviceDurationHours(services, customer?.service),
        value: valueForCustomer(customer, service),
        lastServiceDate: customer?.lastServiceDate || "",
      };
    })
    .filter((item) => item.customerId)
    .sort(
      (a, b) =>
        String(a.lastServiceDate || "").localeCompare(String(b.lastServiceDate || "")) ||
        Number(b.value || 0) - Number(a.value || 0)
    );
}

function buildWorkCalendarIntelligence({
  todayISO = "",
  bookings = [],
  externalEvents = [],
  replyActions = {},
  customers = [],
  services = [],
  eligibleCustomers = [],
  plannedSlots = [],
  capacityHours = DEFAULT_PLANNING_CAPACITY_HOURS,
} = {}) {
  const safeCapacity = Math.max(4, Number(capacityHours) || DEFAULT_PLANNING_CAPACITY_HOURS);
  const attentionRows = buildAttentionRows({
    replyActions,
    customers,
    todayISO,
  });
  const fillCandidates = buildFillCandidates({ eligibleCustomers, services });
  const byDate = {};

  const ensure = (date) => {
    const iso = normaliseDate(date);
    if (!iso) return null;
    if (!byDate[iso]) {
      byDate[iso] = {
        date: iso,
        bookings: [],
        externalEvents: [],
        attention: [],
        plannedSlots: [],
        bookingHours: 0,
        externalHours: 0,
        scheduledHours: 0,
        estimatedOpenHours: safeCapacity,
        bookedValue: 0,
        conflictCount: 0,
        state: "Open",
        tone: "green",
        fillCandidate: null,
        summary: "",
      };
    }
    return byDate[iso];
  };

  (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
    const day = ensure(booking?.date);
    if (!day) return;
    const durationHours = Math.max(
      0.5,
      Number(booking?.durationHours) ||
        serviceDurationHours(services, booking?.service)
    );
    const startMinute = parseClock(booking?.time);
    day.bookings.push({
      ...booking,
      durationHours,
      startMinute,
      endMinute:
        Number.isFinite(startMinute) ? startMinute + durationHours * 60 : null,
    });
    day.bookingHours += durationHours;
    day.bookedValue += Number(booking?.value) || 0;
  });

  (Array.isArray(externalEvents) ? externalEvents : []).forEach((event) => {
    const day = ensure(event?.date);
    if (!day) return;
    const durationHours = Math.max(0, Number(event?.durationHours) || 0);
    const startMinute = parseClock(event?.time);
    day.externalEvents.push({
      ...event,
      durationHours,
      startMinute,
      endMinute:
        Number.isFinite(startMinute) && durationHours > 0
          ? startMinute + durationHours * 60
          : null,
    });
    day.externalHours += durationHours;
  });

  attentionRows.forEach((item) => {
    const day = ensure(item.date);
    if (day) day.attention.push(item);
  });

  (Array.isArray(plannedSlots) ? plannedSlots : []).forEach((slot) => {
    const day = ensure(slot?.date);
    if (day) day.plannedSlots.push(slot);
  });

  Object.values(byDate).forEach((day) => {
    const timedRows = [
      ...day.bookings.map((item) => ({ ...item, source: "BUSY" })),
      ...day.externalEvents.map((item) => ({ ...item, source: "External" })),
    ].filter(
      (item) =>
        Number.isFinite(item.startMinute) && Number.isFinite(item.endMinute)
    );

    const conflicts = [];
    for (let i = 0; i < timedRows.length; i += 1) {
      for (let j = i + 1; j < timedRows.length; j += 1) {
        if (overlaps(timedRows[i], timedRows[j])) {
          conflicts.push({
            id: `${day.date}-${i}-${j}`,
            left: timedRows[i],
            right: timedRows[j],
          });
        }
      }
    }

    day.bookingHours = Math.round(day.bookingHours * 10) / 10;
    day.externalHours = Math.round(day.externalHours * 10) / 10;
    day.scheduledHours =
      Math.round((day.bookingHours + day.externalHours) * 10) / 10;
    day.estimatedOpenHours =
      Math.round(Math.max(0, safeCapacity - day.scheduledHours) * 10) / 10;
    day.bookedValue = Math.round(day.bookedValue);
    day.conflictCount = conflicts.length;
    day.conflicts = conflicts;
    day.state = workloadState(
      day.scheduledHours,
      safeCapacity,
      day.conflictCount
    );
    day.tone = loadTone(day.state);

    if (["Open", "Light"].includes(day.state)) {
      day.fillCandidate =
        fillCandidates.find(
          (candidate) =>
            candidate.durationHours <= Math.max(0.5, day.estimatedOpenHours)
        ) || null;
    }

    const parts = [];
    if (day.bookings.length) {
      parts.push(
        `${day.bookings.length} booked job${day.bookings.length === 1 ? "" : "s"}`
      );
    }
    if (day.externalEvents.length) {
      parts.push(
        `${day.externalEvents.length} external commitment${day.externalEvents.length === 1 ? "" : "s"}`
      );
    }
    if (day.attention.length) {
      parts.push(
        `${day.attention.length} follow-up${day.attention.length === 1 ? "" : "s"} due`
      );
    }
    if (!parts.length) parts.push("No saved work or follow-ups");
    day.summary = parts.join(" • ");
  });

  const allDates = Object.keys(byDate).sort();
  const futureDates = allDates.filter((date) => !todayISO || date >= todayISO);
  const futureRows = futureDates.map((date) => byDate[date]);
  const overloadedDays = futureRows.filter((day) => day.state === "Overloaded");
  const openDays = futureRows.filter((day) => ["Open", "Light"].includes(day.state));
  const attentionDue = attentionRows.filter(
    (item) => !todayISO || item.date <= todayISO
  );

  const nextGap = openDays.find(
    (day) =>
      day.fillCandidate &&
      (!todayISO || day.date >= todayISO)
  ) || null;

  return {
    capacityHours: safeCapacity,
    byDate,
    attentionRows,
    fillCandidates,
    overloadedDays,
    openDays,
    attentionDue,
    nextGap,
    counts: {
      overloadedDays: overloadedDays.length,
      openDays: openDays.length,
      attentionDue: attentionDue.length,
    },
  };
}

export {
  DEFAULT_PLANNING_CAPACITY_HOURS,
  buildWorkCalendarIntelligence,
};
