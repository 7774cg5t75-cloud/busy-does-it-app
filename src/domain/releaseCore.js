import {
  dateToISO,
  normalizePhone,
  normalizeEmail,
} from "../core/runtime";

function releaseGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function customerDuplicateGroups(customers = []) {
  const rows = Array.isArray(customers) ? customers : [];
  const groups = [];
  const seen = new Set();

  const addGroup = (type, key, matches) => {
    if (!key || matches.length < 2) return;
    const signature = `${type}:${key}:${matches.map((item) => item.id).sort().join("|")}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    groups.push({
      id: `duplicate-${type}-${key}`,
      type,
      key,
      customers: matches.map((item) => ({
        id: item.id,
        name: item.name || "Customer",
        phone: item.phone || "",
        email: item.email || "",
        service: item.service || "",
      })),
    });
  };

  const phones = new Map();
  const emails = new Map();
  rows.forEach((customer) => {
    const phone = normalizePhone(customer?.phone || "");
    const email = normalizeEmail(customer?.email || "");
    if (phone) phones.set(phone, [...(phones.get(phone) || []), customer]);
    if (email) emails.set(email, [...(emails.get(email) || []), customer]);
  });

  phones.forEach((matches, key) => addGroup("phone", key, matches));
  emails.forEach((matches, key) => addGroup("email", key, matches));

  return groups;
}

function buildReleaseCoreHealth({
  customers = [],
  replyActions = {},
  inboxItems = [],
  diaryConflicts = [],
  proactiveScheduledMap = {},
  cloudConflict = null,
  todayISO = dateToISO(new Date()),
} = {}) {
  const customerById = Object.fromEntries(
    (Array.isArray(customers) ? customers : []).map((item) => [item.id, item])
  );
  const issues = [];
  const duplicateGroups = customerDuplicateGroups(customers);

  duplicateGroups.forEach((group) => {
    issues.push({
      id: group.id,
      kind: "duplicate-customer",
      severity: "Review",
      title: "Possible duplicate customer",
      body: `${group.customers.map((item) => item.name).join(" / ")} share the same ${group.type}. Keep one customer history wherever possible.`,
      customerId: group.customers[0]?.id || "",
    });
  });

  Object.entries(replyActions || {}).forEach(([customerId, action]) => {
    const customer = customerById[customerId];
    if (!customer) {
      issues.push({
        id: `orphan-action-${customerId}`,
        kind: "orphan-action",
        severity: "High",
        title: "Customer action has no customer record",
        body: "A saved quote/booking/follow-up points to a customer that no longer exists.",
        customerId,
      });
      return;
    }

    if (action?.type === "booking" && action?.done) {
      const status = action.details?.bookingStatus || "Confirmed";
      const bookingDate = action.details?.bookingDate || "";
      if (!bookingDate || Number.isNaN(new Date(`${bookingDate}T12:00:00`).getTime())) {
        issues.push({
          id: `booking-date-${customerId}`,
          kind: "booking-date",
          severity: "High",
          title: `Booking date needs fixing • ${customer.name}`,
          body: "This booking is marked as saved but does not have a valid calendar date.",
          customerId,
        });
      } else if (
        status === "Confirmed" &&
        bookingDate < todayISO
      ) {
        issues.push({
          id: `overdue-booking-${customerId}`,
          kind: "overdue-booking",
          severity: "High",
          title: `Past booking needs an outcome • ${customer.name}`,
          body: `${customer.service || "Work"} was booked for ${bookingDate}. Complete, move or cancel it so the diary stays trustworthy.`,
          customerId,
        });
      }

      if (status === "Completed" && bookingDate) {
        const jobs = Array.isArray(customer.history) ? customer.history : [];
        const matchingJob = jobs.some(
          (item) =>
            item?.kind === "job" &&
            item.date === bookingDate &&
            (!item.service || !customer.service || item.service === customer.service)
        );
        if (!matchingJob) {
          issues.push({
            id: `completed-job-history-${customerId}`,
            kind: "completed-job-history",
            severity: "High",
            title: `Completed booking missing job history • ${customer.name}`,
            body: "The booking says Completed but no matching completed-job history row is saved.",
            customerId,
          });
        }
      }
    }
  });

  (Array.isArray(inboxItems) ? inboxItems : []).forEach((item) => {
    if (
      item?.status === "Filed" &&
      item.filedCustomerId &&
      !customerById[item.filedCustomerId]
    ) {
      issues.push({
        id: `orphan-inbox-${item.id}`,
        kind: "orphan-inbox",
        severity: "High",
        title: "Filed Inbox item points to a missing customer",
        body: "The source record says it was filed, but the linked customer record is no longer present.",
        sourceId: item.id,
      });
    }
  });

  (Array.isArray(diaryConflicts) ? diaryConflicts : []).forEach((conflict) => {
    issues.push({
      id: conflict.id || `diary-${conflict.customerId}`,
      kind: "diary-conflict",
      severity: "High",
      title: `Diary conflict • ${conflict.customerName || "Customer"}`,
      body: "BUSY and the connected device calendar currently disagree about the booking time.",
      customerId: conflict.customerId || "",
    });
  });

  if (cloudConflict) {
    issues.push({
      id: "cloud-conflict",
      kind: "cloud-conflict",
      severity: "High",
      title: "Cloud copy needs reconciliation",
      body: "This device and the cloud workspace have competing revisions. Review before treating either copy as authoritative.",
    });
  }

  const scheduledRows = Object.values(proactiveScheduledMap || {});
  const staleScheduled = scheduledRows.filter(
    (item) =>
      item?.triggerAt &&
      new Date(item.triggerAt).getTime() < Date.now() - 5 * 60 * 1000
  ).length;
  if (staleScheduled) {
    issues.push({
      id: "stale-notifications",
      kind: "stale-notifications",
      severity: "Review",
      title: "Old local reminders need refreshing",
      body: `${staleScheduled} scheduled reminder${staleScheduled === 1 ? "" : "s"} are now in the past and should be rebuilt from the current business state.`,
    });
  }

  const highCount = issues.filter((item) => item.severity === "High").length;
  const reviewCount = issues.filter((item) => item.severity === "Review").length;
  const status =
    highCount > 0 ? "Needs attention" : reviewCount > 0 ? "Review" : "Healthy";

  return {
    status,
    highCount,
    reviewCount,
    issueCount: issues.length,
    duplicateGroups,
    issues,
    checks: {
      customerLinks: !issues.some((item) =>
        ["orphan-action", "orphan-inbox"].includes(item.kind)
      ),
      bookingLifecycle: !issues.some((item) =>
        ["booking-date", "overdue-booking", "completed-job-history"].includes(item.kind)
      ),
      duplicateCustomers: duplicateGroups.length === 0,
      diary: !(Array.isArray(diaryConflicts) && diaryConflicts.length),
      cloud: !cloudConflict,
      reminders: staleScheduled === 0,
    },
  };
}

function buildHomeCommandCentre({
  executiveBriefing = {},
  autopilotApprovalItems = [],
  autopilotNeedsInputItems = [],
  proactiveNotificationsEnabled = false,
  proactiveScheduledMap = {},
  diaryConnection = {},
  diaryConflicts = [],
  strongestBusinessMemoryPattern = null,
  releaseCoreHealth = null,
} = {}) {
  const priority = executiveBriefing?.priority || {};
  const confirmed7 = executiveBriefing?.confirmed7 || {};
  const risks = Array.isArray(executiveBriefing?.risks)
    ? executiveBriefing.risks
    : [];

  return {
    greeting: releaseGreeting(),
    priority,
    confirmed7,
    riskCount: risks.length,
    approvalCount: autopilotApprovalItems.length,
    inputCount: autopilotNeedsInputItems.length,
    reminderCount: Object.keys(proactiveScheduledMap || {}).length,
    notificationsOn: !!proactiveNotificationsEnabled,
    diaryConnected: diaryConnection?.status === "connected",
    diaryName: diaryConnection?.title || "",
    diaryConflictCount: Array.isArray(diaryConflicts) ? diaryConflicts.length : 0,
    memoryLabel:
      strongestBusinessMemoryPattern?.stage?.label || "Too early to tell",
    coreStatus: releaseCoreHealth?.status || "Healthy",
    coreIssueCount: releaseCoreHealth?.issueCount || 0,
  };
}

export {
  releaseGreeting,
  customerDuplicateGroups,
  buildReleaseCoreHealth,
  buildHomeCommandCentre,
};
