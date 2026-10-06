function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function lower(value = "") {
  return clean(value).toLowerCase();
}

function timeValue(value = "") {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function latestByTime(rows = []) {
  return [...rows].sort(
    (a, b) =>
      timeValue(b.createdAt || b.date || b.queuedAt || b.reviewedAt) -
      timeValue(a.createdAt || a.date || a.queuedAt || a.reviewedAt)
  )[0] || null;
}

function inferIncomingMessageIntent(value = "") {
  const text = clean(value);
  const normal = lower(text);

  if (!text) {
    return {
      kind: "unknown",
      label: "Needs context",
      confidence: "Low",
      summary: "There is no usable message text to interpret.",
      suggestedHandling: "Open the source item and confirm what the customer actually said.",
    };
  }

  const negative =
    /\b(no|not interested|leave it|don't|do not|cancel|too expensive|too much)\b/i.test(text);
  const positiveProceed =
    /\b(go ahead|happy to proceed|yes please|sounds good|that works|book it|confirm it|fine by me|let'?s do it)\b/i.test(text);

  if (positiveProceed && !negative) {
    return {
      kind: "acceptance",
      label: "Likely acceptance",
      confidence: "Medium",
      summary: "The wording looks like the customer wants to move forward.",
      suggestedHandling:
        "Confirm the exact agreed next step. If a booking is involved, check the real date and time before changing the record.",
    };
  }

  if (
    /\b(too expensive|too much|price|cost|cheaper|discount|budget|afford|expensive)\b/i.test(
      text
    )
  ) {
    return {
      kind: "price-concern",
      label: "Price / scope concern",
      confidence: "Medium",
      summary: "The message appears to raise a price, budget or scope concern.",
      suggestedHandling:
        "Acknowledge the concern and clarify scope or options. BUSY should not invent or apply a discount automatically.",
    };
  }

  if (
    /\b(reschedule|rearrange|move it|another day|different day|next week|this week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|can't make|cannot make|what time|what day)\b/i.test(
      text
    )
  ) {
    return {
      kind: "scheduling",
      label: "Scheduling request",
      confidence: "Medium",
      summary: "The message appears to be about arranging or changing when work happens.",
      suggestedHandling:
        "Check the live diary and confirm an exact date/time before changing a booking.",
    };
  }

  if (
    /\b(great job|brilliant|amazing|really happy|very happy|looks great|thank you|thanks|lovely job|excellent)\b/i.test(
      text
    )
  ) {
    return {
      kind: "positive-feedback",
      label: "Positive feedback",
      confidence: "Medium",
      summary: "The customer appears pleased with the work or service.",
      suggestedHandling:
        "Thank them. If a completed job exists and no review request is already recorded, BUSY can prepare one for approval.",
    };
  }

  if (
    /\b(no thanks|not interested|don't need|do not need|already sorted|leave it|cancel)\b/i.test(
      text
    )
  ) {
    return {
      kind: "decline",
      label: "Likely decline / stop",
      confidence: "Medium",
      summary: "The wording looks like the customer may not want to continue.",
      suggestedHandling:
        "Confirm the meaning before closing live work. Do not continue chasing if the customer has clearly asked to stop.",
    };
  }

  if (text.includes("?") || /\b(can you|could you|would you|how much|when can|do you|is it)\b/i.test(text)) {
    return {
      kind: "question",
      label: "Customer question",
      confidence: "Medium",
      summary: "The customer appears to be asking for information.",
      suggestedHandling:
        "Answer from the saved customer, quote, booking and service context. Ask only for information that is genuinely missing.",
    };
  }

  return {
    kind: "message",
    label: "General customer message",
    confidence: "Low",
    summary: "The message does not safely fit a stronger deterministic category.",
    suggestedHandling:
      "Review it in the customer journey before replying. BUSY can draft wording, but the owner keeps send authority.",
  };
}

function inboxCustomerId(item = {}) {
  return (
    item.filedCustomerId ||
    item.triage?.matchCustomerId ||
    item.autoEvaluation?.customer?.id ||
    ""
  );
}

function sourceDirection(source = "", stage = "") {
  const name = lower(source);
  const lifecycleStage = lower(stage);
  if (
    lifecycleStage &&
    lifecycleStage !== "enquiry" &&
    lifecycleStage !== "incoming"
  ) {
    return "record";
  }
  if (
    name.includes("customer message") ||
    name.includes("email") ||
    name.includes("phone") ||
    name.includes("whatsapp") ||
    name.includes("sms")
  ) {
    return "incoming";
  }
  return "record";
}

function isRecordedSent(title = "", status = "") {
  return (
    /recorded as sent|approved/i.test(String(title || "")) ||
    /sent/i.test(String(status || ""))
  );
}

function communicationRowsForCustomer({
  customer = {},
  journey = null,
  inboxItems = [],
} = {}) {
  const rows = [];

  safeArray(journey?.communicationHistory).forEach((item) => {
    const title = clean(item.title);
    const status = clean(item.status);
    const preparedOnly = /wording prepared|draft/i.test(title) && !isRecordedSent(title, status);
    const isOutcome = String(item.kind || "").toLowerCase() === "outcome";
    const direction = isOutcome ? "record" : preparedOnly ? "draft" : "outbound";
    rows.push({
      id: `journey-${customer.id}-${item.id || title}-${item.createdAt || item.date || ""}`,
      customerId: customer.id,
      direction,
      kind: item.source || item.kind || "communication",
      title: title || "Customer communication",
      body: clean(item.body),
      status,
      source: item.source || "Customer journey",
      createdAt: item.createdAt || (item.date ? `${item.date}T12:00:00` : ""),
      date: item.date || "",
      actualContact: direction === "outbound" && isRecordedSent(title, status),
      pendingInbox: false,
    });
  });

  safeArray(customer.sourceRecords).forEach((record, index) => {
    const rawText = clean(record.rawText);
    if (!rawText) return;
    const direction = sourceDirection(
      record.sourceConnection || record.source,
      record.stage
    );
    if (direction !== "incoming") return;
    rows.push({
      id: record.id || `source-message-${customer.id}-${index}`,
      customerId: customer.id,
      direction: "incoming",
      kind: "source-message",
      title: `${record.source || record.sourceConnection || "Incoming"}`,
      body: rawText,
      status: record.reconciled ? "Filed into journey" : "Recorded",
      source: record.sourceConnection || record.source || "Incoming",
      createdAt: record.importedAt || (record.eventDate ? `${record.eventDate}T12:00:00` : ""),
      date: record.eventDate || "",
      actualContact: true,
      pendingInbox: false,
      interpretation: inferIncomingMessageIntent(rawText),
    });
  });

  safeArray(inboxItems)
    .filter(
      (item) =>
        item.status === "Pending" &&
        inboxCustomerId(item) === customer.id
    )
    .forEach((item) => {
      const rawText = clean(item.rawText || item.parsed?.note);
      rows.push({
        id: `inbox-${item.id}`,
        inboxItemId: item.id,
        customerId: customer.id,
        direction: "incoming",
        kind: "pending-inbox",
        title: `${item.source || "Incoming message"} • needs review`,
        body: rawText,
        status: item.triage?.lane || "Pending",
        source: item.source || "Incoming",
        createdAt: item.queuedAt || "",
        date: item.parsed?.date || "",
        actualContact: true,
        pendingInbox: true,
        interpretation: inferIncomingMessageIntent(rawText),
      });
    });

  const seen = new Set();
  return rows
    .filter((row) => {
      const key = `${row.direction}|${row.title}|${row.body}|${row.createdAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        timeValue(b.createdAt || b.date) - timeValue(a.createdAt || a.date)
    );
}

function threadLane({
  customer = {},
  journey = null,
  rows = [],
} = {}) {
  const pendingIncoming = rows.filter((row) => row.pendingInbox);
  if (pendingIncoming.length) return "Needs attention";

  if (
    safeArray(journey?.stalledSignals).some((signal) => signal.level === "High")
  ) {
    return "Needs attention";
  }

  const actualOutbound = rows.filter(
    (row) => row.direction === "outbound" && row.actualContact
  );
  const incoming = rows.filter((row) => row.direction === "incoming");
  const lastOutbound = latestByTime(actualOutbound);
  const lastIncoming = latestByTime(incoming);

  if (
    lastOutbound &&
    (!lastIncoming ||
      timeValue(lastOutbound.createdAt || lastOutbound.date) >
        timeValue(lastIncoming.createdAt || lastIncoming.date))
  ) {
    return "Awaiting customer";
  }

  if (
    journey?.nextAction?.actionLabel ||
    rows.some((row) => row.direction === "draft")
  ) {
    return "Draft ready";
  }

  return "Done";
}

function duplicateContactGuard(rows = [], lane = "") {
  const actualOutbound = rows.filter(
    (row) => row.direction === "outbound" && row.actualContact
  );
  const incoming = rows.filter((row) => row.direction === "incoming");
  const lastOutbound = latestByTime(actualOutbound);
  const lastIncoming = latestByTime(incoming);

  if (
    lane === "Awaiting customer" &&
    lastOutbound &&
    (!lastIncoming ||
      timeValue(lastOutbound.createdAt || lastOutbound.date) >
        timeValue(lastIncoming.createdAt || lastIncoming.date))
  ) {
    return {
      blocked: true,
      title: "Wait before chasing again",
      body: `The latest recorded contact is outbound: ${lastOutbound.title}. BUSY should not suggest another chase until a reply, due date or owner decision changes the situation.`,
    };
  }

  return {
    blocked: false,
    title: "No duplicate-contact warning",
    body: "BUSY has not found a newer recorded outbound contact that should suppress the next suggested reply.",
  };
}

function buildThread({
  customer = {},
  journey = null,
  inboxItems = [],
} = {}) {
  const rows = communicationRowsForCustomer({
    customer,
    journey,
    inboxItems,
  });
  const lane = threadLane({ customer, journey, rows });
  const latestIncoming = latestByTime(
    rows.filter((row) => row.direction === "incoming")
  );
  const latestOutbound = latestByTime(
    rows.filter((row) => row.direction === "outbound" && row.actualContact)
  );
  const latestAny = latestByTime(rows);
  const guard = duplicateContactGuard(rows, lane);

  return {
    id: `communication-thread-${customer.id}`,
    customerId: customer.id,
    customerName: customer.name || "Customer",
    service: customer.service || "",
    contactAllowed: customer.contactOk !== false,
    phone: customer.phone || "",
    email: customer.email || "",
    lane,
    latestAt:
      latestAny?.createdAt ||
      latestAny?.date ||
      customer.lastActivityAt ||
      customer.createdAt ||
      "",
    latestSummary:
      latestAny?.body ||
      latestAny?.title ||
      journey?.nextAction?.body ||
      "No recorded customer communication yet.",
    latestIncoming,
    latestOutbound,
    latestIncomingInterpretation:
      latestIncoming?.interpretation || null,
    pendingInboxCount: rows.filter((row) => row.pendingInbox).length,
    recordedMessageCount: rows.length,
    duplicateGuard: guard,
    nextAction: journey?.nextAction || null,
    stalledSignals: safeArray(journey?.stalledSignals),
    messages: rows.slice(0, 30),
  };
}

function unmatchedInboxRows(inboxItems = []) {
  return safeArray(inboxItems)
    .filter(
      (item) =>
        item.status === "Pending" &&
        !inboxCustomerId(item)
    )
    .map((item) => {
      const rawText = clean(item.rawText || item.parsed?.note);
      return {
        id: item.id,
        title: item.parsed?.name || "Customer not safely matched",
        service: item.parsed?.service || "",
        source: item.source || "Incoming",
        queuedAt: item.queuedAt || "",
        reason:
          item.triage?.reason ||
          "BUSY cannot safely attach this incoming information to one customer yet.",
        interpretation: inferIncomingMessageIntent(rawText),
      };
    })
    .sort((a, b) => timeValue(b.queuedAt) - timeValue(a.queuedAt));
}

function buildCommunicationsHub({
  customers = [],
  customerJourneys = [],
  inboxItems = [],
} = {}) {
  const journeyByCustomer = Object.fromEntries(
    safeArray(customerJourneys).map((journey) => [
      journey.customerId,
      journey,
    ])
  );

  const threads = safeArray(customers)
    .map((customer) =>
      buildThread({
        customer,
        journey: journeyByCustomer[customer.id] || null,
        inboxItems,
      })
    )
    .filter(
      (thread) =>
        thread.recordedMessageCount > 0 ||
        thread.pendingInboxCount > 0 ||
        thread.nextAction?.actionLabel ||
        thread.stalledSignals.length > 0
    )
    .sort((a, b) => {
      const laneOrder = {
        "Needs attention": 0,
        "Awaiting customer": 1,
        "Draft ready": 2,
        Done: 3,
      };
      const laneDiff =
        (laneOrder[a.lane] ?? 9) - (laneOrder[b.lane] ?? 9);
      if (laneDiff) return laneDiff;
      return timeValue(b.latestAt) - timeValue(a.latestAt);
    });

  const lanes = {
    "Needs attention": threads.filter((thread) => thread.lane === "Needs attention"),
    "Awaiting customer": threads.filter((thread) => thread.lane === "Awaiting customer"),
    "Draft ready": threads.filter((thread) => thread.lane === "Draft ready"),
    Done: threads.filter((thread) => thread.lane === "Done"),
  };
  const unmatched = unmatchedInboxRows(inboxItems);

  return {
    threads,
    lanes,
    unmatched,
    counts: {
      needsAttention: lanes["Needs attention"].length + unmatched.length,
      awaitingCustomer: lanes["Awaiting customer"].length,
      draftReady: lanes["Draft ready"].length,
      done: lanes.Done.length,
      unmatched: unmatched.length,
      totalThreads: threads.length,
    },
    topThread:
      lanes["Needs attention"][0] ||
      lanes["Draft ready"][0] ||
      lanes["Awaiting customer"][0] ||
      threads[0] ||
      null,
  };
}

export {
  inferIncomingMessageIntent,
  buildCommunicationsHub,
};
