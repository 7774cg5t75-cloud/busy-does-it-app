const OPERATOR_RECORD_CHANGE_INTENTS = new Set([
  "create_booking",
  "edit_booking",
  "cancel_booking",
  "complete_job",
  "add_customer_note",
  "set_reminder",
]);

const OPERATOR_ANSWER_INTENTS = new Set([
  "business_summary",
  "business_changes",
  "business_memory",
  "business_outlook",
  "next_best_action",
  "daily_briefing",
  "calendar_day_summary",
  "calendar_gap",
  "calendar_fit_job",
  "unknown",
]);

function normaliseOperatorName(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchOperatorCustomer(customers = [], name = "") {
  const rows = Array.isArray(customers) ? customers : [];
  const needle = normaliseOperatorName(name);
  if (!needle) {
    return { customer: null, ambiguous: false, matches: [], reason: "missing-name" };
  }

  const exact = rows.filter(
    (customer) => normaliseOperatorName(customer?.name) === needle
  );
  if (exact.length === 1) {
    return { customer: exact[0], ambiguous: false, matches: exact, reason: "exact" };
  }
  if (exact.length > 1) {
    return { customer: null, ambiguous: true, matches: exact, reason: "duplicate-exact" };
  }

  const starts = rows.filter((customer) =>
    normaliseOperatorName(customer?.name).startsWith(needle)
  );
  if (starts.length === 1) {
    return { customer: starts[0], ambiguous: false, matches: starts, reason: "starts-with" };
  }
  if (starts.length > 1) {
    return { customer: null, ambiguous: true, matches: starts, reason: "ambiguous-first-name" };
  }

  const contains = rows.filter((customer) =>
    normaliseOperatorName(customer?.name).includes(needle)
  );
  if (contains.length === 1) {
    return { customer: contains[0], ambiguous: false, matches: contains, reason: "contains" };
  }
  return {
    customer: null,
    ambiguous: contains.length > 1,
    matches: contains,
    reason: contains.length > 1 ? "ambiguous-partial" : "not-found",
  };
}

function openOperatorBooking(replyActions = {}, customerId = "") {
  const action = replyActions?.[customerId] || null;
  if (
    action?.type !== "booking" ||
    !action?.done ||
    ["Cancelled", "Completed"].includes(action?.details?.bookingStatus || "Confirmed")
  ) {
    return null;
  }
  return action;
}

function operatorRequiresConfirmation(intent = "") {
  return OPERATOR_RECORD_CHANGE_INTENTS.has(String(intent || ""));
}

function operatorIsAnswerOnly(intent = "") {
  return OPERATOR_ANSWER_INTENTS.has(String(intent || ""));
}

function displayValue(value) {
  const number = Number(value);
  return number > 0 ? `£${number}` : "Not recorded";
}

function arrow(before, after) {
  const left = String(before || "Not set");
  const right = String(after || "Not set");
  return left === right ? right : `${left} → ${right}`;
}

function buildOperatorClientPreview({
  command = {},
  customer = null,
  replyActions = {},
} = {}) {
  const intent = String(command?.intent || "");
  const action = customer?.id ? replyActions?.[customer.id] || null : null;
  const rows = [];

  if (customer?.name) rows.push({ label: "Customer", value: customer.name });

  if (intent === "create_booking") {
    rows.push({ label: "Date", value: command.date || "Not set" });
    rows.push({ label: "Time", value: command.time || "Not set" });
    if (Number(command.value) > 0) {
      rows.push({ label: "Value", value: displayValue(command.value) });
    }
  }

  if (intent === "edit_booking") {
    const current = openOperatorBooking(replyActions, customer?.id);
    if (current) {
      if (command.date) {
        rows.push({
          label: "Date",
          value: arrow(current.details?.bookingDate || "", command.date),
        });
      }
      if (command.time) {
        rows.push({
          label: "Time",
          value: arrow(current.details?.bookingTime || "", command.time),
        });
      }
      if (Number(command.value) > 0) {
        rows.push({
          label: "Value",
          value: arrow(
            displayValue(current.details?.jobValue || current.details?.sourceQuoteAmount || 0),
            displayValue(command.value)
          ),
        });
      }
    }
  }

  if (intent === "cancel_booking") {
    const current = openOperatorBooking(replyActions, customer?.id);
    if (current) {
      rows.push({
        label: "Booking",
        value: `${current.details?.bookingDate || "Date not set"} • ${current.details?.bookingTime || "time not set"}`,
      });
      rows.push({
        label: "Status",
        value: `${current.details?.bookingStatus || "Confirmed"} → Cancelled`,
      });
    }
  }

  if (intent === "complete_job") {
    const current = openOperatorBooking(replyActions, customer?.id);
    if (current) {
      rows.push({
        label: "Booking",
        value: `${current.details?.bookingDate || "Date not set"} • ${current.details?.bookingTime || "time not set"}`,
      });
      rows.push({
        label: "Status",
        value: `${current.details?.bookingStatus || "Confirmed"} → Completed`,
      });
      if (Number(command.value) > 0) {
        rows.push({ label: "Completed value", value: displayValue(command.value) });
      }
    }
  }

  if (intent === "add_customer_note" && command.note) {
    rows.push({ label: "Add note", value: String(command.note).slice(0, 280) });
  }

  if (intent === "set_reminder") {
    const before =
      action?.type === "reminder" ? action.details?.reminderDate || "" : "";
    rows.push({
      label: "Follow-up date",
      value: arrow(before, command.date || ""),
    });
    if (command.note) {
      rows.push({ label: "Reminder note", value: String(command.note).slice(0, 220) });
    }
  }

  const serverRows = (Array.isArray(command?.previewRows) ? command.previewRows : [])
    .filter((row) => row?.label && row?.value)
    .map((row) => ({
      label: String(row.label).slice(0, 120),
      value: String(row.value).slice(0, 300),
    }));

  const merged = [...rows];
  serverRows.forEach((row) => {
    if (
      !merged.some(
        (existing) =>
          existing.label.toLowerCase() === row.label.toLowerCase() &&
          existing.value === row.value
      )
    ) {
      merged.push(row);
    }
  });
  return merged.slice(0, 8);
}

function validateOperatorCommand({
  command = {},
  customers = [],
  replyActions = {},
} = {}) {
  const intent = String(command?.intent || "");
  const needsCustomer = [
    "customer_lookup",
    "create_booking",
    "edit_booking",
    "cancel_booking",
    "complete_job",
    "add_customer_note",
    "set_reminder",
  ].includes(intent);

  const match = needsCustomer
    ? matchOperatorCustomer(customers, command?.customerName || "")
    : { customer: null, ambiguous: false, matches: [], reason: "not-required" };

  if (needsCustomer && !match.customer) {
    return {
      ok: false,
      customer: null,
      reason: match.ambiguous ? "ambiguous-customer" : "missing-customer",
      message: match.ambiguous
        ? "BUSY needs the full customer name because more than one saved customer matches."
        : "BUSY needs one unambiguous saved customer before it can do that.",
    };
  }

  const customer = match.customer;
  const booking = customer
    ? openOperatorBooking(replyActions, customer.id)
    : null;

  if (["edit_booking", "cancel_booking", "complete_job"].includes(intent) && !booking) {
    return {
      ok: false,
      customer,
      booking: null,
      reason: "no-open-booking",
      message: `BUSY could not find an open confirmed booking for ${customer?.name || "that customer"}.`,
    };
  }

  if (intent === "create_booking" && (!command?.date || !command?.time)) {
    return {
      ok: false,
      customer,
      reason: !command?.date ? "missing-date" : "missing-time",
      message: !command?.date
        ? "BUSY needs a booking date before it can confirm that booking."
        : "BUSY needs a booking time before it can confirm that booking.",
    };
  }

  if (
    intent === "edit_booking" &&
    !command?.date &&
    !command?.time &&
    !(Number(command?.value) > 0)
  ) {
    return {
      ok: false,
      customer,
      booking,
      reason: "no-booking-change",
      message: "BUSY needs the new date, time or value before it can change that booking.",
    };
  }

  if (intent === "add_customer_note" && !String(command?.note || "").trim()) {
    return {
      ok: false,
      customer,
      reason: "missing-note",
      message: "BUSY needs the note you want added to the customer record.",
    };
  }

  if (intent === "set_reminder") {
    if (!command?.date) {
      return {
        ok: false,
        customer,
        reason: "missing-reminder-date",
        message: "BUSY needs a date for that follow-up reminder.",
      };
    }
    const existing = replyActions?.[customer.id] || null;
    const activeNonReminder = existing && existing.type !== "reminder";
    if (activeNonReminder) {
      return {
        ok: false,
        customer,
        reason: "active-customer-action",
        message:
          "BUSY will not overwrite that customer's saved quote or booking record with a reminder. Open the customer first and use the existing follow-up controls.",
      };
    }
  }

  return {
    ok: true,
    customer,
    booking,
    reason: "ok",
    message: "",
  };
}

export {
  OPERATOR_RECORD_CHANGE_INTENTS,
  OPERATOR_ANSWER_INTENTS,
  normaliseOperatorName,
  matchOperatorCustomer,
  openOperatorBooking,
  operatorRequiresConfirmation,
  operatorIsAnswerOnly,
  buildOperatorClientPreview,
  validateOperatorCommand,
};
