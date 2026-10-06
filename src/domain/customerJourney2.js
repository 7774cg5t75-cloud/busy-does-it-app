function isoDate(value = "") {
  const text = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function isoTime(value = "") {
  const text = String(value || "");
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return parsed;
  const date = isoDate(text);
  return date ? Date.parse(`${date}T12:00:00`) : 0;
}

function daysBetween(fromValue = "", toISO = "") {
  const from = isoDate(fromValue);
  const to = isoDate(toISO);
  if (!from || !to) return null;
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

function addMonths(dateISO, months) {
  const date = isoDate(dateISO);
  const amount = Number(months);
  if (!date || !Number.isFinite(amount) || amount <= 0) return "";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setMonth(parsed.getMonth() + amount);
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
}

function repeatDueDate(customer = {}, services = [], verticalId = "") {
  if (!customer?.lastServiceDate) return "";
  const service = (Array.isArray(services) ? services : []).find(
    (item) => item?.name === customer?.service
  );
  const explicit = Number(service?.repeatMonths);
  const fallback =
    verticalId === "exterior-cleaning" ? 12 : 0;
  const months = Number.isFinite(explicit) && explicit > 0 ? explicit : fallback;
  return months > 0 ? addMonths(customer.lastServiceDate, months) : "";
}

function money(value) {
  return Math.max(0, Number(value) || 0);
}

function actionStatus(action = null) {
  if (!action) return "";
  if (!action.done) return "In progress";
  if (action.type === "quote") return action.details?.quoteStatus || "Prepared";
  if (action.type === "booking") return action.details?.bookingStatus || "Confirmed";
  if (action.type === "reminder") return action.details?.reminderStatus || "Scheduled";
  return "Saved";
}

function actionLabel(action = null) {
  if (!action) return "";
  if (action.type === "quote") return "Quote";
  if (action.type === "booking") return "Booking";
  if (action.type === "reminder") return "Follow-up reminder";
  return "Customer action";
}

function timelineRow({
  id,
  kind = "activity",
  date = "",
  createdAt = "",
  title = "",
  body = "",
  value = 0,
  status = "",
  source = "",
} = {}) {
  return {
    id: String(id || `journey-${kind}-${date || createdAt || Math.random()}`),
    kind,
    date: isoDate(date || createdAt),
    createdAt: createdAt || (date ? `${date}T12:00:00` : ""),
    title,
    body,
    value: money(value),
    status,
    source,
  };
}

function buildJourneyTimeline(customer = {}, action = null) {
  const rows = [];

  const enquiryAt = customer.currentEnquiryAt || (!customer.lastServiceDate ? customer.createdAt : "");
  if (enquiryAt) {
    rows.push(
      timelineRow({
        id: `enquiry-${customer.id}`,
        kind: "enquiry",
        createdAt: enquiryAt,
        title: "Enquiry received",
        body: customer.service || "Customer enquiry",
        status: customer.lifecycleStatus || "Enquiry",
        source: "customer",
      })
    );
  }

  (Array.isArray(customer.sourceRecords) ? customer.sourceRecords : []).forEach(
    (record, index) => {
      rows.push(
        timelineRow({
          id: record.id || `source-${customer.id}-${index}`,
          kind: "source",
          date: record.date || record.createdAt,
          createdAt: record.createdAt || "",
          title: record.reconciled ? "Source record reconciled" : "Source record captured",
          body:
            record.summary ||
            record.note ||
            record.source ||
            "Captured source information",
          status: record.reconciled ? "Reconciled" : "Captured",
          source: "source-record",
        })
      );
    }
  );

  (Array.isArray(customer.activity) ? customer.activity : []).forEach((item, index) => {
    rows.push(
      timelineRow({
        id: item.id || `activity-${customer.id}-${index}`,
        kind: item.kind || "activity",
        date: item.date,
        createdAt: item.createdAt,
        title: item.title || "Customer update",
        body: item.note || "",
        value: item.value,
        status: "",
        source: "activity",
      })
    );
  });

  const history = Array.isArray(customer.history) ? customer.history : [];
  history.forEach((job, index) => {
    rows.push(
      timelineRow({
        id: job.id || `job-${customer.id}-${index}`,
        kind: "job",
        date: job.date,
        createdAt: job.completedAt || "",
        title: `${job.service || customer.service || "Job"} completed`,
        body: job.note || "",
        value: job.value,
        status: "Completed",
        source: "job",
      })
    );

    if (job.reviewRequestSentAt) {
      rows.push(
        timelineRow({
          id: `review-send-${job.id || index}`,
          kind: "communication",
          createdAt: job.reviewRequestSentAt,
          title: "Review request recorded as sent",
          body: job.reviewRequestDraft || "",
          status: job.reviewRequestOutcomeRecordedAt
            ? job.reviewRequestOutcome || "Outcome recorded"
            : "Awaiting outcome",
          source: "review-request",
        })
      );
    }
    if (job.reviewRequestOutcomeRecordedAt) {
      rows.push(
        timelineRow({
          id: `review-outcome-${job.id || index}`,
          kind: "outcome",
          createdAt: job.reviewRequestOutcomeRecordedAt,
          title: "Review outcome recorded",
          body: job.reviewRequestOutcome || "",
          status: "Recorded",
          source: "review-request",
        })
      );
    }
    if (job.postOutcomeRecordedAt) {
      rows.push(
        timelineRow({
          id: `post-outcome-${job.id || index}`,
          kind: "outcome",
          createdAt: job.postOutcomeRecordedAt,
          title: "Social outcome recorded",
          body: job.postOutcome || "",
          value: job.postOutcomeValue,
          status: "Recorded",
          source: "social",
        })
      );
    }
  });

  if (customer.lastServiceDate && !history.some(
    (job) => job.date === customer.lastServiceDate && (job.service || customer.service) === customer.service
  )) {
    rows.push(
      timelineRow({
        id: `baseline-job-${customer.id}`,
        kind: "job",
        date: customer.lastServiceDate,
        title: `${customer.service || "Job"} completed`,
        body: "Previously recorded job",
        value: customer.lastJobValue,
        status: "Completed",
        source: "baseline",
      })
    );
  }

  if (action) {
    const createdAt = action.createdAt || action.completedAt || "";
    rows.push(
      timelineRow({
        id: `current-action-${customer.id}`,
        kind: action.type || "action",
        date:
          action.type === "booking"
            ? action.details?.bookingDate
            : action.type === "reminder"
            ? action.details?.reminderDate
            : action.details?.quoteSentAt,
        createdAt,
        title: actionLabel(action),
        body: action.details?.summary || action.task || "",
        value:
          action.type === "quote"
            ? action.details?.quoteAmount
            : action.type === "booking"
            ? action.details?.jobValue || action.details?.sourceQuoteAmount
            : 0,
        status: actionStatus(action),
        source: "current-action",
      })
    );

    if (action.type === "quote" && action.details?.followUpSentAt) {
      rows.push(
        timelineRow({
          id: `quote-follow-up-${customer.id}`,
          kind: "communication",
          createdAt: action.details.followUpSentAt,
          title: "Quote follow-up recorded as sent",
          body: action.details.followUpMessage || "",
          value: action.details?.quoteAmount,
          status: action.details?.followUpOutcomeRecordedAt
            ? action.details?.followUpOutcome || "Outcome recorded"
            : "Awaiting outcome",
          source: "quote-follow-up",
        })
      );
    }
    if (action.type === "quote" && action.details?.followUpOutcomeRecordedAt) {
      rows.push(
        timelineRow({
          id: `quote-follow-up-outcome-${customer.id}`,
          kind: "outcome",
          createdAt: action.details.followUpOutcomeRecordedAt,
          title: "Quote follow-up outcome recorded",
          body: action.details?.followUpOutcome || "",
          value: action.details?.quoteAmount,
          status: "Recorded",
          source: "quote-follow-up",
        })
      );
    }
  }

  if (customer.enquiryFollowUpSentAt) {
    rows.push(
      timelineRow({
        id: `enquiry-follow-up-${customer.id}`,
        kind: "communication",
        createdAt: customer.enquiryFollowUpSentAt,
        title: "Enquiry follow-up recorded as sent",
        body: customer.enquiryFollowUpDraft || "",
        status: customer.enquiryFollowUpOutcomeRecordedAt
          ? customer.enquiryFollowUpOutcome || "Outcome recorded"
          : "Awaiting outcome",
        source: "enquiry-follow-up",
      })
    );
  }
  if (customer.enquiryFollowUpOutcomeRecordedAt) {
    rows.push(
      timelineRow({
        id: `enquiry-follow-up-outcome-${customer.id}`,
        kind: "outcome",
        createdAt: customer.enquiryFollowUpOutcomeRecordedAt,
        title: "Enquiry follow-up outcome recorded",
        body: customer.enquiryFollowUpOutcome || "",
        status: "Recorded",
        source: "enquiry-follow-up",
      })
    );
  }

  const seen = new Set();
  return rows
    .filter((row) => {
      const key = `${row.id}|${row.title}|${row.createdAt || row.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const timeDiff = isoTime(b.createdAt || b.date) - isoTime(a.createdAt || a.date);
      if (timeDiff) return timeDiff;
      return String(b.id).localeCompare(String(a.id));
    });
}

function buildCommunicationHistory(customer = {}, action = null, timeline = []) {
  const rows = timeline.filter((row) =>
    ["communication", "quote", "reminder"].includes(row.kind) ||
    /follow-up|review request|quote/i.test(row.title || "")
  );

  if (action?.type === "quote" && action.details?.message) {
    rows.push(
      timelineRow({
        id: `quote-message-${customer.id}`,
        kind: "communication",
        createdAt: action.details?.quoteSentAt || action.completedAt || action.createdAt,
        title: action.details?.quoteStatus === "Sent" ? "Quote recorded as sent" : "Quote wording prepared",
        body: action.details.message,
        value: action.details?.quoteAmount,
        status: action.details?.quoteStatus || (action.done ? "Prepared" : "In progress"),
        source: "quote",
      })
    );
  }

  const seen = new Set();
  return rows
    .filter((row) => {
      const key = `${row.title}|${row.createdAt || row.date}|${row.body}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => isoTime(b.createdAt || b.date) - isoTime(a.createdAt || a.date))
    .slice(0, 20);
}

function latestJob(customer = {}) {
  return [...(Array.isArray(customer.history) ? customer.history : [])]
    .filter((item) => item?.kind === "job" || item?.date)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0] || null;
}

function buildStalledSignals({
  customer = {},
  action = null,
  todayISO = "",
  repeatDue = "",
} = {}) {
  const signals = [];
  const enquiryAt = customer.currentEnquiryAt || (!customer.lastServiceDate ? customer.createdAt : "");
  const enquiryAge = daysBetween(enquiryAt, todayISO);

  if (
    enquiryAt &&
    !action &&
    !customer.enquiryFollowUpSentAt &&
    Number(enquiryAge) >= 7
  ) {
    signals.push({
      id: "quiet-enquiry",
      level: "High",
      title: "Enquiry has no recorded next step",
      body: `${enquiryAge} days since the enquiry was recorded.`,
    });
  }

  if (customer.enquiryFollowUpSentAt && !customer.enquiryFollowUpOutcomeRecordedAt) {
    const age = daysBetween(customer.enquiryFollowUpSentAt, todayISO);
    if (Number(age) >= 7) {
      signals.push({
        id: "enquiry-follow-up-outcome",
        level: "Review",
        title: "Enquiry follow-up outcome is still unknown",
        body: `${age} days since the follow-up was recorded as sent.`,
      });
    }
  }

  if (action?.type === "quote" && action.details?.quoteStatus === "Sent") {
    const sentAt = action.details?.quoteSentAt || action.completedAt;
    const age = daysBetween(sentAt, todayISO);
    if (!action.details?.followUpSentAt && Number(age) >= 7) {
      signals.push({
        id: "quiet-quote",
        level: "High",
        title: "Sent quote needs a follow-up",
        body: `${age} days since the quote was recorded as sent.`,
      });
    }
    if (action.details?.followUpSentAt && !action.details?.followUpOutcomeRecordedAt) {
      const followAge = daysBetween(action.details.followUpSentAt, todayISO);
      if (Number(followAge) >= 7) {
        signals.push({
          id: "quote-follow-up-outcome",
          level: "Review",
          title: "Quote follow-up outcome is still unknown",
          body: `${followAge} days since the follow-up was recorded as sent.`,
        });
      }
    }
  }

  if (
    action?.type === "booking" &&
    action.done &&
    (action.details?.bookingStatus || "Confirmed") === "Confirmed" &&
    isoDate(action.details?.bookingDate) &&
    action.details.bookingDate < todayISO
  ) {
    signals.push({
      id: "past-booking",
      level: "High",
      title: "Past booking still has no outcome",
      body: `Booking date was ${action.details.bookingDate}.`,
    });
  }

  const job = latestJob(customer);
  if (
    job &&
    customer.contactOk !== false &&
    !job.reviewRequestSentAt &&
    Number(daysBetween(job.date, todayISO)) >= 1
  ) {
    signals.push({
      id: "review-opportunity",
      level: "Review",
      title: "Completed job has no review request recorded",
      body: "A review request can be prepared from the saved completed job.",
    });
  }

  if (repeatDue && repeatDue <= todayISO && customer.contactOk !== false) {
    signals.push({
      id: "repeat-due",
      level: "Review",
      title: "Repeat timing is due",
      body: "This customer's recorded service interval has come around again.",
    });
  }

  return signals;
}

function buildNextAction({
  customer = {},
  action = null,
  todayISO = "",
  repeatDue = "",
} = {}) {
  const status = actionStatus(action);
  const job = latestJob(customer);

  if (customer.contactOk === false) {
    return {
      kind: "none",
      title: "No outbound customer contact",
      body: "This record is marked do not contact. BUSY can still keep the internal history up to date.",
      why: "The customer's contact preference outranks follow-up opportunities.",
      actionLabel: "",
      action: null,
    };
  }

  if (action && !action.done) {
    return {
      kind: action.type || "action",
      title: `Finish the ${actionLabel(action).toLowerCase()}`,
      body: action.details?.summary || action.task || "This customer action is still in progress.",
      why: "BUSY finishes the live customer action before starting a second competing action.",
      actionLabel: `Open ${actionLabel(action).toLowerCase()}`,
      action: { kind: "customer-action", customerId: customer.id },
    };
  }

  if (action?.type === "quote" && status === "Sent") {
    if (action.details?.followUpSentAt && !action.details?.followUpOutcomeRecordedAt) {
      return {
        kind: "quote-outcome",
        title: "Record what happened after the quote follow-up",
        body: "The follow-up is already recorded as sent, but BUSY does not yet know the outcome.",
        why: "Recording the outcome prevents duplicate chasing and improves Business Memory.",
        actionLabel: "Record quote outcome",
        action: { kind: "quote-outcome", customerId: customer.id },
      };
    }
    return {
      kind: "quote-follow-up",
      title: "Review the sent quote",
      body: action.details?.followUpDueDate && action.details.followUpDueDate > todayISO
        ? `Follow-up is due ${action.details.followUpDueDate}.`
        : "The quote is still open and ready for the normal follow-up flow.",
      why: "Warm existing buying intent outranks starting unrelated outreach.",
      actionLabel: "Prepare quote follow-up",
      action: { kind: "quote-follow-up", customerId: customer.id },
    };
  }

  if (
    action?.type === "booking" &&
    status === "Confirmed"
  ) {
    return {
      kind: "booking",
      title:
        action.details?.bookingDate && action.details.bookingDate < todayISO
          ? "Resolve the past booking"
          : "The booking is already in hand",
      body: `${action.details?.bookingDate || "Date not set"} • ${action.details?.bookingTime || "time not set"}`,
      why:
        action.details?.bookingDate && action.details.bookingDate < todayISO
          ? "BUSY needs the real job outcome before suggesting follow-on work."
          : "Confirmed work is the live next commitment for this customer.",
      actionLabel: "Open booking",
      action: { kind: "customer-action", customerId: customer.id },
    };
  }

  if (
    customer.enquiryFollowUpSentAt &&
    !customer.enquiryFollowUpOutcomeRecordedAt
  ) {
    return {
      kind: "enquiry-outcome",
      title: "Record the enquiry follow-up outcome",
      body: "The follow-up is already recorded as sent and is waiting for a real outcome.",
      why: "Knowing what happened prevents repeat contact and improves future recommendations.",
      actionLabel: "Record enquiry outcome",
      action: { kind: "enquiry-outcome", customerId: customer.id },
    };
  }

  const enquiryAt = customer.currentEnquiryAt || (!customer.lastServiceDate ? customer.createdAt : "");
  if (enquiryAt && !action) {
    const age = daysBetween(enquiryAt, todayISO);
    if (Number(age) >= 7) {
      return {
        kind: "enquiry-follow-up",
        title: "Revisit this enquiry",
        body: `${age} days have passed without a saved customer action.`,
        why: "This is an existing enquiry, so BUSY prefers a low-pressure check-in over colder marketing.",
        actionLabel: "Prepare enquiry follow-up",
        action: { kind: "enquiry-follow-up", customerId: customer.id },
      };
    }
    return {
      kind: "new-enquiry",
      title: "Choose the real next step",
      body: "The enquiry is saved but no quote, booking or reminder is currently open.",
      why: "BUSY will not guess whether the real conversation needs a quote, booking or follow-up.",
      actionLabel: "",
      action: null,
    };
  }

  if (job && !job.reviewRequestSentAt) {
    return {
      kind: "review-request",
      title: "Prepare a review request",
      body: `${job.service || customer.service || "The job"} is recorded as completed.`,
      why: "The completed work is the strongest existing proof opportunity before creating new demand.",
      actionLabel: "Prepare review request",
      action: { kind: "review-request", customerId: customer.id, jobId: job.id || "" },
    };
  }

  if (job?.reviewRequestSentAt && !job.reviewRequestOutcomeRecordedAt) {
    return {
      kind: "review-outcome",
      title: "Record the review-request outcome",
      body: "The request is already recorded as sent, but the outcome is still unknown.",
      why: "BUSY learns more from the real outcome than from sending another request.",
      actionLabel: "Record review outcome",
      action: { kind: "review-outcome", customerId: customer.id, jobId: job.id || "" },
    };
  }

  if (repeatDue && repeatDue <= todayISO) {
    return {
      kind: "repeat",
      title: "Repeat timing is due",
      body: `${customer.service || "This service"} is back inside its saved repeat window.`,
      why: "This is existing customer history, not cold prospecting.",
      actionLabel: "Review repeat opportunity",
      action: { kind: "repeat", customerId: customer.id },
    };
  }

  return {
    kind: "none",
    title: "Nothing needs forcing right now",
    body: repeatDue
      ? `The next saved repeat window is ${repeatDue}.`
      : "BUSY has no open customer action or evidence-backed follow-up due.",
    why: "BUSY does not manufacture customer contact just to create activity.",
    actionLabel: "",
    action: null,
  };
}

function buildCustomerJourney2({
  customer = null,
  action = null,
  services = [],
  verticalId = "",
  todayISO = "",
} = {}) {
  if (!customer) return null;

  const timeline = buildJourneyTimeline(customer, action);
  const communicationHistory = buildCommunicationHistory(customer, action, timeline);
  const jobs = timeline.filter((row) => row.kind === "job");
  const completedValue = jobs.reduce((sum, row) => sum + money(row.value), 0);
  const repeatDue = repeatDueDate(customer, services, verticalId);
  const stalledSignals = buildStalledSignals({
    customer,
    action,
    todayISO,
    repeatDue,
  });
  const nextAction = buildNextAction({
    customer,
    action,
    todayISO,
    repeatDue,
  });
  const currentStatus = actionStatus(action);
  const lastTimeline = timeline[0] || null;

  return {
    customerId: customer.id || "",
    customerName: customer.name || "",
    service: customer.service || "",
    contactAllowed: customer.contactOk !== false,
    lifecycleStatus:
      customer.lifecycleStatus ||
      (action ? currentStatus || actionLabel(action) : customer.lastServiceDate ? "Previous customer" : "Enquiry"),
    relationship: {
      completedJobs: jobs.length,
      completedValue: Math.round(completedValue),
      latestJobDate:
        jobs.find((row) => row.date)?.date || customer.lastServiceDate || "",
      repeatDueDate: repeatDue,
      sourceRecordCount: Array.isArray(customer.sourceRecords)
        ? customer.sourceRecords.length
        : 0,
      communicationCount: communicationHistory.length,
    },
    currentAction: action
      ? {
          type: action.type || "",
          label: actionLabel(action),
          status: currentStatus,
          done: !!action.done,
          summary: action.details?.summary || action.task || "",
          date:
            action.type === "booking"
              ? action.details?.bookingDate || ""
              : action.type === "reminder"
              ? action.details?.reminderDate || ""
              : isoDate(action.details?.quoteSentAt || ""),
          time: action.details?.bookingTime || "",
          value:
            action.type === "quote"
              ? money(action.details?.quoteAmount)
              : action.type === "booking"
              ? money(action.details?.jobValue || action.details?.sourceQuoteAmount)
              : 0,
        }
      : null,
    latestEvent: lastTimeline
      ? {
          title: lastTimeline.title,
          date: lastTimeline.date,
          status: lastTimeline.status,
        }
      : null,
    stalledSignals,
    nextAction,
    timeline: timeline.slice(0, 30),
    communicationHistory,
  };
}

export { buildCustomerJourney2 };
