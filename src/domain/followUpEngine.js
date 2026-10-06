function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value = "") {
  return String(value || "").trim();
}

function timeValue(value = "") {
  const parsed = Date.parse(String(value || ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isoDate(value = "") {
  const text = clean(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = timeValue(text);
  return parsed ? new Date(parsed).toISOString().slice(0, 10) : "";
}

function addDays(dateISO = "", days = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return "";
  const date = new Date(`${dateISO}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromISO = "", toISO = "") {
  if (!fromISO || !toISO) return null;
  const from = timeValue(`${fromISO}T12:00:00Z`);
  const to = timeValue(`${toISO}T12:00:00Z`);
  if (!from || !to) return null;
  return Math.floor((to - from) / 86400000);
}

function latestAt(thread = {}) {
  return (
    thread.latestIncoming?.createdAt ||
    thread.latestIncoming?.date ||
    thread.latestOutbound?.createdAt ||
    thread.latestOutbound?.date ||
    thread.latestAt ||
    ""
  );
}

function nextReviewCadenceDays(thread = {}) {
  const kind = clean(thread.nextAction?.kind);
  if (kind === "quote-follow-up" || kind === "quote-outcome") return 5;
  if (kind === "review-request" || kind === "review-outcome") return 7;
  if (kind === "enquiry-follow-up" || kind === "enquiry-outcome") return 3;
  return 3;
}

function preferredChannel(thread = {}) {
  if (thread.email && thread.phone) return "Email or phone";
  if (thread.email) return "Email";
  if (thread.phone) return "Phone / messaging";
  return "No contact route saved";
}

function candidateForThread(thread = {}, todayISO = "") {
  const guardBlocked = !!thread.duplicateGuard?.blocked;
  const contactAllowed = thread.contactAllowed !== false;
  const latestIncomingAt = timeValue(
    thread.latestIncoming?.createdAt || thread.latestIncoming?.date
  );
  const latestOutboundAt = timeValue(
    thread.latestOutbound?.createdAt || thread.latestOutbound?.date
  );
  const hasNewerIncoming =
    !!latestIncomingAt && (!latestOutboundAt || latestIncomingAt > latestOutboundAt);
  const pendingIncoming = Number(thread.pendingInboxCount || 0) > 0;
  const actionKind = clean(thread.nextAction?.kind);
  const lastContactDate = isoDate(latestAt(thread));
  const lastOutboundDate = isoDate(
    thread.latestOutbound?.createdAt || thread.latestOutbound?.date
  );
  const cadenceDays = nextReviewCadenceDays(thread);
  const nextReviewDate = lastOutboundDate
    ? addDays(lastOutboundDate, cadenceDays)
    : "";
  const ageDays = lastContactDate ? daysBetween(lastContactDate, todayISO) : null;

  let lane = "No chase";
  let score = 10;
  let title = "No communication needs forcing";
  let reason =
    thread.nextAction?.why ||
    "The saved journey does not currently justify another customer message.";
  let draftable = false;

  if (!contactAllowed) {
    lane = "Do not contact";
    score = 0;
    title = "Contact preference blocks follow-up";
    reason = "This customer record is marked do not contact, so BUSY will not prepare outbound chasing.";
  } else if (pendingIncoming || hasNewerIncoming) {
    lane = "Reply now";
    score = 100 + Math.min(Number(thread.pendingInboxCount || 0), 5);
    title = pendingIncoming ? "Incoming customer message needs review" : "Customer has replied";
    reason =
      thread.latestIncomingInterpretation?.summary ||
      "There is newer incoming communication than the latest recorded outbound contact.";
    draftable = !guardBlocked;
  } else if (
    !guardBlocked &&
    (thread.lane === "Needs attention" || thread.lane === "Draft ready")
  ) {
    lane = "Follow up today";
    score = thread.lane === "Needs attention" ? 88 : 76;
    title = thread.nextAction?.title || "Follow-up is ready to review";
    reason =
      thread.nextAction?.why ||
      "The customer journey supports a communication step and no duplicate-contact block is active.";
    draftable = true;
  } else if (guardBlocked || thread.lane === "Awaiting customer") {
    lane = "Waiting";
    score = 45;
    title = "Wait for the customer";
    reason =
      thread.duplicateGuard?.body ||
      "The latest recorded real contact is outbound, so another chase is suppressed for now.";
  }

  const recovery =
    ["enquiry-follow-up", "quote-follow-up", "enquiry-outcome", "quote-outcome"].includes(
      actionKind
    ) && ["Reply now", "Follow up today"].includes(lane);

  const transportState =
    lane === "Do not contact"
      ? "Blocked by preference"
      : lane === "Waiting"
      ? "Waiting for reply / review date"
      : draftable
      ? "Preparation only — not sent"
      : "No send planned";

  return {
    id: `follow-up-${thread.customerId}`,
    customerId: thread.customerId,
    customerName: thread.customerName || "Customer",
    service: thread.service || "",
    lane,
    score,
    title,
    reason,
    draftable,
    recovery,
    actionKind,
    preferredChannel: preferredChannel(thread),
    transportState,
    lastContactDate,
    ageDays,
    nextReviewDate,
    cadenceDays,
    latestIncomingInterpretation: thread.latestIncomingInterpretation || null,
    nextAction: thread.nextAction || null,
    duplicateContactBlocked: guardBlocked,
    contactAllowed,
    hasEmail: !!thread.email,
    hasPhone: !!thread.phone,
  };
}

function buildFollowUpEngine({ communicationsHub = {}, todayISO = "" } = {}) {
  const today = /^\d{4}-\d{2}-\d{2}$/.test(todayISO)
    ? todayISO
    : new Date().toISOString().slice(0, 10);

  const candidates = safeArray(communicationsHub.threads)
    .map((thread) => candidateForThread(thread, today))
    .sort((a, b) => {
      const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
      if (scoreDiff) return scoreDiff;
      return clean(a.customerName).localeCompare(clean(b.customerName));
    });

  const lanes = {
    "Reply now": candidates.filter((item) => item.lane === "Reply now"),
    "Follow up today": candidates.filter((item) => item.lane === "Follow up today"),
    Waiting: candidates.filter((item) => item.lane === "Waiting"),
    "No chase": candidates.filter((item) => item.lane === "No chase"),
    "Do not contact": candidates.filter((item) => item.lane === "Do not contact"),
  };

  const readyToPrepare = candidates.filter((item) => item.draftable).slice(0, 8);
  const recoveryOpportunities = candidates.filter((item) => item.recovery).slice(0, 8);
  const waitingReview = lanes.Waiting
    .map((item) => ({
      ...item,
      dueForReview:
        !!item.nextReviewDate && item.nextReviewDate <= today,
    }))
    .sort((a, b) =>
      clean(a.nextReviewDate || "9999-12-31").localeCompare(
        clean(b.nextReviewDate || "9999-12-31")
      )
    );

  return {
    today,
    candidates,
    lanes,
    readyToPrepare,
    recoveryOpportunities,
    waitingReview,
    topCandidate:
      lanes["Reply now"][0] ||
      lanes["Follow up today"][0] ||
      waitingReview[0] ||
      candidates[0] ||
      null,
    counts: {
      replyNow: lanes["Reply now"].length,
      followUpToday: lanes["Follow up today"].length,
      waiting: lanes.Waiting.length,
      noChase: lanes["No chase"].length,
      doNotContact: lanes["Do not contact"].length,
      readyToPrepare: readyToPrepare.length,
      recovery: recoveryOpportunities.length,
    },
    providerBridge: {
      emailReachable: candidates.filter((item) => item.hasEmail && item.contactAllowed).length,
      phoneReachable: candidates.filter((item) => item.hasPhone && item.contactAllowed).length,
      noSavedRoute: candidates.filter(
        (item) => !item.hasEmail && !item.hasPhone && item.contactAllowed
      ).length,
      realSendingEnabled: false,
      status: "Provider-ready model only",
      note:
        "V3.33 models channel choice and delivery state without granting SMS, email or WhatsApp send authority.",
    },
  };
}

export { buildFollowUpEngine };
