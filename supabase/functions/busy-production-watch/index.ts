import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers });
}

function injectedKey(name: "SUPABASE_PUBLISHABLE_KEYS" | "SUPABASE_SECRET_KEYS") {
  try {
    const values = JSON.parse(Deno.env.get(name) || "{}");
    return typeof values?.default === "string" ? values.default : "";
  } catch {
    return "";
  }
}

const PUBLISHABLE_KEY =
  injectedKey("SUPABASE_PUBLISHABLE_KEYS") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "";

const SERVER_KEY =
  injectedKey("SUPABASE_SECRET_KEYS") ||
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";

function serverHeaders(extra: Record<string, string> = {}) {
  const result: Record<string, string> = {
    apikey: SERVER_KEY,
    "Content-Type": "application/json",
    ...extra,
  };
  if (SERVER_KEY && !SERVER_KEY.startsWith("sb_secret_")) {
    result.Authorization = `Bearer ${SERVER_KEY}`;
  }
  return result;
}

async function serverRest(path: string, options: RequestInit = {}) {
  if (!SERVER_KEY) throw new Error("Supabase server key is unavailable.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...serverHeaders(), ...(options.headers || {}) },
  });
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Supabase REST returned ${response.status}.`
    );
  }
  return data;
}

async function currentUser(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ") || !PUBLISHABLE_KEY) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: authorization,
    },
  });
  if (!response.ok) return null;
  return await response.json().catch(() => null);
}

async function membership(userId: string, businessId: string) {
  const rows = await serverRest(
    `busy_business_memberships?user_id=eq.${encodeURIComponent(userId)}&business_id=eq.${encodeURIComponent(businessId)}&select=role&limit=1`
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

function londonParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minuteStamp:
      Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute)
      ) / 60000,
  };
}

function bookingMinuteStamp(date: string, time: string) {
  const match = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const clock = String(time || "").match(/^(\d{2}):(\d{2})$/);
  if (!match || !clock) return NaN;

  return (
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(clock[1]),
      Number(clock[2])
    ) / 60000
  );
}

function customerById(payload: any, id: string) {
  return (
    (Array.isArray(payload?.customers) ? payload.customers : []).find(
      (item: any) => item?.id === id
    ) || null
  );
}

function candidateAlerts(payload: any) {
  const now = new Date();
  const london = londonParts(now);
  const actions =
    payload?.replyActions && typeof payload.replyActions === "object"
      ? payload.replyActions
      : {};

  const alerts: any[] = [];

  for (const [customerId, action] of Object.entries(actions) as any[]) {
    const customer = customerById(payload, customerId);
    if (!customer || !action?.done) continue;

    if (action.type === "booking") {
      const status = action.details?.bookingStatus || "Confirmed";
      const date = String(action.details?.bookingDate || "");
      const time = String(action.details?.bookingTime || "09:00");

      if (status !== "Confirmed" || !date) continue;

      if (date < london.date) {
        alerts.push({
          priority: 100,
          key: `overdue-booking-${customerId}-${date}`,
          kind: "overdue-booking",
          title: `${customer.name}'s booking needs an outcome`,
          body: `${customer.service || "Work"} was booked for ${date}. Complete, move or cancel it so BUSY stays accurate.`,
          data: {
            route: "booking",
            kind: "overdue-booking",
            customerId,
          },
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        });
        continue;
      }

      const stamp = bookingMinuteStamp(date, time);
      const minutesUntil = stamp - london.minuteStamp;

      if (
        Number.isFinite(minutesUntil) &&
        minutesUntil >= 45 &&
        minutesUntil <= 75
      ) {
        alerts.push({
          priority: 95,
          key: `booking-soon-${customerId}-${date}-${time}`,
          kind: "booking-soon",
          title: `${customer.name} • job in about an hour`,
          body: `${customer.service || "Customer job"} starts at ${time}.`,
          data: {
            route: "booking",
            kind: "booking-reminder",
            customerId,
          },
          expiresAt: new Date(Date.now() + 3 * 3600000).toISOString(),
        });
      }
    }

    if (action.type === "quote") {
      const status = action.details?.quoteStatus || "Prepared";
      const outcome = action.details?.followUpOutcome || "";
      const sentAt =
        action.details?.quoteSentAt || action.updatedAt || "";
      const sentTime = sentAt ? new Date(sentAt).getTime() : NaN;
      const ageMs = Number.isFinite(sentTime)
        ? Date.now() - sentTime
        : 0;

      if (
        status === "Sent" &&
        !["Accepted", "Declined", "No response"].includes(outcome) &&
        ageMs >= 3 * 86400000
      ) {
        const ageDays = Math.max(
          3,
          Math.floor(ageMs / 86400000)
        );

        alerts.push({
          priority: 80,
          key: `stale-quote-${customerId}-${String(sentAt).slice(0, 10)}`,
          kind: "stale-quote",
          title: `${customer.name}'s quote needs attention`,
          body: `${customer.service || "The quote"} has been quiet for about ${ageDays} days.`,
          data: {
            route: "quote",
            kind: "quote",
            customerId,
          },
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        });
      }
    }
  }

  return alerts
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

async function sendExpo(tokens: string[], alert: any) {
  const messages = tokens.map((to) => ({
    to,
    sound: "default",
    title: alert.title,
    body: alert.body,
    data: alert.data,
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  const payload: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload?.errors?.[0]?.message ||
        "Expo push delivery failed."
    );
  }

  return Array.isArray(payload?.data)
    ? payload.data
    : [];
}

async function runWatch(
  targetBusinessId = "",
  targetUserId = ""
) {
  const deviceRows = await serverRest(
    `busy_push_devices?active=eq.true&select=user_id,business_id,expo_push_token${targetBusinessId ? `&business_id=eq.${encodeURIComponent(targetBusinessId)}` : ""}${targetUserId ? `&user_id=eq.${encodeURIComponent(targetUserId)}` : ""}`
  );

  const devices = Array.isArray(deviceRows)
    ? deviceRows
    : [];

  const groups = new Map<string, any>();

  for (const device of devices) {
    if (
      !device.business_id ||
      !device.user_id ||
      !device.expo_push_token
    ) {
      continue;
    }

    const key = `${device.user_id}|${device.business_id}`;
    const group =
      groups.get(key) || {
        userId: device.user_id,
        businessId: device.business_id,
        tokens: [],
      };

    group.tokens.push(device.expo_push_token);
    groups.set(key, group);
  }

  let sent = 0;
  let checked = 0;

  for (const group of groups.values()) {
    checked += 1;

    const snapshots = await serverRest(
      `busy_business_snapshots?business_id=eq.${encodeURIComponent(group.businessId)}&select=payload,updated_at&limit=1`
    );

    const snapshot = Array.isArray(snapshots)
      ? snapshots[0] || null
      : null;

    if (!snapshot?.payload) continue;

    const alerts = candidateAlerts(snapshot.payload);

    for (const alert of alerts) {
      const existing = await serverRest(
        `busy_push_deliveries?user_id=eq.${encodeURIComponent(group.userId)}&business_id=eq.${encodeURIComponent(group.businessId)}&notification_key=eq.${encodeURIComponent(alert.key)}&select=id&limit=1`
      );

      if (
        Array.isArray(existing) &&
        existing.length
      ) {
        continue;
      }

      const uniqueTokens = [
        ...new Set(group.tokens),
      ].filter(
        (token: string) =>
          token.startsWith("ExponentPushToken[") ||
          token.startsWith("ExpoPushToken[")
      );

      if (!uniqueTokens.length) continue;

      const tickets = await sendExpo(
        uniqueTokens,
        alert
      );

      const invalidTokens: string[] = [];

      tickets.forEach((ticket: any, index: number) => {
        if (
          ticket?.status === "error" &&
          ticket?.details?.error === "DeviceNotRegistered"
        ) {
          invalidTokens.push(uniqueTokens[index]);
        }
      });

      for (const token of invalidTokens) {
        await serverRest(
          `busy_push_devices?user_id=eq.${encodeURIComponent(group.userId)}&expo_push_token=eq.${encodeURIComponent(token)}`,
          {
            method: "PATCH",
            headers: {
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              active: false,
              updated_at: new Date().toISOString(),
            }),
          }
        ).catch(() => {});
      }

      await serverRest("busy_push_deliveries", {
        method: "POST",
        headers: {
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          user_id: group.userId,
          business_id: group.businessId,
          notification_key: alert.key,
          notification_kind: alert.kind,
          route_data: alert.data,
          provider_receipts: tickets,
          sent_at: new Date().toISOString(),
          expires_at: alert.expiresAt,
        }),
      });

      sent += 1;

      // Keep the watcher useful rather than noisy: max one new alert
      // per owner/business per 15-minute run.
      break;
    }
  }

  return { checked, sent };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return json(405, { error: "POST required." });
  }

  const body: any = await req.json().catch(() => ({}));
  const action = String(body?.action || "");

  if (action === "cron") {
    const configRows = await serverRest(
      "busy_internal_config?key=eq.production_watch_token&select=value&limit=1"
    );
    const config = Array.isArray(configRows)
      ? configRows[0] || null
      : null;

    const supplied = String(body?.cronToken || "");

    if (!config?.value || supplied !== config.value) {
      return json(401, {
        error: "Invalid production watcher token.",
      });
    }

    const result = await runWatch();

    return json(200, {
      ...result,
      source: "cron",
    });
  }

  const user = await currentUser(req);

  if (!user?.id) {
    return json(401, {
      error: "Authenticated BUSY owner required.",
    });
  }

  const businessId = String(body?.businessId || "");

  if (!(await membership(user.id, businessId))) {
    return json(403, {
      error: "This user is not a member of that BUSY business.",
    });
  }

  if (action === "status") {
    const deliveries = await serverRest(
      `busy_push_deliveries?user_id=eq.${encodeURIComponent(user.id)}&business_id=eq.${encodeURIComponent(businessId)}&select=sent_at&order=sent_at.desc&limit=50`
    );

    const rows = Array.isArray(deliveries)
      ? deliveries
      : [];

    return json(200, {
      configured: true,
      schedule: "Every 15 minutes • server-side",
      deliveryCount: rows.length,
      lastDeliveryAt: rows[0]?.sent_at || "",
      message:
        "Production watcher is active and deduplicates each business event before sending.",
    });
  }

  if (action === "run_now") {
    const result = await runWatch(
      businessId,
      user.id
    );

    return json(200, {
      ...result,
      source: "owner",
    });
  }

  return json(400, {
    error: "Unsupported production watcher action.",
  });
});
