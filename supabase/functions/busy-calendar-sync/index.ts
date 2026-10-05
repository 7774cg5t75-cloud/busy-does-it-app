import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
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
  const headers: Record<string, string> = {
    apikey: SERVER_KEY,
    "Content-Type": "application/json",
    ...extra,
  };
  if (SERVER_KEY && !SERVER_KEY.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${SERVER_KEY}`;
  }
  return headers;
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
    headers: { apikey: PUBLISHABLE_KEY, Authorization: authorization },
  });
  if (!response.ok) return null;
  return await response.json().catch(() => null);
}

async function assertMembership(userId: string, businessId: string) {
  const rows = await serverRest(
    `busy_business_memberships?user_id=eq.${encodeURIComponent(userId)}&business_id=eq.${encodeURIComponent(businessId)}&select=role&limit=1`
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

function cleanBooking(value: any) {
  return {
    customerId: String(value?.customerId || "").slice(0, 180),
    customerName: String(value?.customerName || "Customer").slice(0, 240),
    service: String(value?.service || "Service").slice(0, 240),
    date: String(value?.date || "").slice(0, 20),
    time: String(value?.time || "").slice(0, 20),
    value: Math.max(0, Number(value?.value) || 0),
    durationHours: Math.max(0.5, Math.min(24, Number(value?.durationHours) || 2)),
    address: String(value?.address || "").slice(0, 500),
    startAt: String(value?.startAt || "").slice(0, 60),
    endAt: String(value?.endAt || "").slice(0, 60),
    fingerprint: String(value?.fingerprint || "").slice(0, 2000),
  };
}

function eventPayload(booking: any, businessId: string) {
  return {
    summary: `${booking.customerName} • ${booking.service}`,
    location: booking.address || undefined,
    description: `[BUSY DOES IT]\nCustomer: ${booking.customerName}\nService: ${booking.service}${booking.value ? `\nRecorded value: £${booking.value}` : ""}`,
    start: { dateTime: booking.startAt, timeZone: "Europe/London" },
    end: { dateTime: booking.endAt, timeZone: "Europe/London" },
    extendedProperties: {
      private: {
        busyBusinessId: businessId,
        busyCustomerId: booking.customerId,
      },
    },
  };
}

function eventTimes(event: any) {
  return {
    startAt: String(event?.start?.dateTime || ""),
    endAt: String(event?.end?.dateTime || ""),
    updatedAt: String(event?.updated || ""),
  };
}

function londonDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "", label: "" };
  }
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
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    label: `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`,
  };
}

function sameInstant(a: string, b: string) {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 60000;
}

async function getConnection(userId: string, businessId: string) {
  const rows = await serverRest(
    `busy_calendar_connections?user_id=eq.${encodeURIComponent(userId)}&business_id=eq.${encodeURIComponent(businessId)}&provider=eq.google_calendar&select=*&limit=1`
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function updateConnection(id: string, patch: any) {
  const rows = await serverRest(
    `busy_calendar_connections?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    }
  );
  return Array.isArray(rows) ? rows[0] || null : rows;
}

async function accessTokenFor(connection: any) {
  const expires = connection?.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;

  if (connection?.access_token && expires > Date.now() + 90000) {
    return connection.access_token;
  }

  if (!connection?.refresh_token || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google Calendar authorization needs reconnecting.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    await updateConnection(connection.id, {
      status: "needs_reconnect",
      last_error:
        payload?.error_description || payload?.error || "Google token refresh failed.",
      last_checked_at: new Date().toISOString(),
    });
    throw new Error(
      payload?.error_description || payload?.error || "Google token refresh failed."
    );
  }

  const expiresAt = new Date(
    Date.now() + Math.max(60, Number(payload.expires_in) || 3600) * 1000
  ).toISOString();

  await updateConnection(connection.id, {
    status: "connected",
    access_token: payload.access_token,
    token_expires_at: expiresAt,
    last_error: null,
    last_checked_at: new Date().toISOString(),
  });

  return payload.access_token;
}

async function googleRequest(
  token: string,
  path: string,
  options: RequestInit = {}
) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error: any = new Error(
      data?.error?.message || `Google Calendar returned ${response.status}.`
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

async function upsertLink(
  userId: string,
  businessId: string,
  booking: any,
  event: any,
  status = "active"
) {
  const times = eventTimes(event);
  const rows = await serverRest(
    "busy_calendar_event_links?on_conflict=user_id,business_id,provider,customer_id",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        user_id: userId,
        business_id: businessId,
        provider: "google_calendar",
        customer_id: booking.customerId,
        event_id: event.id,
        calendar_id: "primary",
        busy_fingerprint: booking.fingerprint,
        busy_start_at: booking.startAt,
        busy_end_at: booking.endAt,
        google_start_at: times.startAt || booking.startAt,
        google_end_at: times.endAt || booking.endAt,
        google_updated_at: times.updatedAt || null,
        status,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    }
  );
  return Array.isArray(rows) ? rows[0] || null : rows;
}

async function patchLink(id: string, patch: any) {
  await serverRest(
    `busy_calendar_event_links?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        ...patch,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json(405, { error: "POST required." });

  const user = await currentUser(req);
  if (!user?.id) return json(401, { error: "Authenticated BUSY owner required." });

  const body: any = await req.json().catch(() => ({}));
  const businessId = String(body?.businessId || "");
  const membership = await assertMembership(user.id, businessId);
  if (!membership) {
    return json(403, { error: "This user is not a member of that BUSY business." });
  }

  const connection = await getConnection(user.id, businessId);
  if (!connection || connection.status !== "connected") {
    return json(409, { error: "Google Calendar is not connected for this BUSY business." });
  }

  const token = await accessTokenFor(connection);
  const action = String(body?.action || "");

  if (action === "sync") {
    const bookings = (Array.isArray(body?.bookings) ? body.bookings : [])
      .slice(0, 100)
      .map(cleanBooking)
      .filter((item: any) => item.customerId && item.startAt && item.endAt);

    const cancelledIds = new Set(
      (Array.isArray(body?.cancelledCustomerIds)
        ? body.cancelledCustomerIds
        : []
      )
        .map((value: any) => String(value || ""))
        .filter(Boolean)
    );

    const linkRows = await serverRest(
      `busy_calendar_event_links?user_id=eq.${encodeURIComponent(user.id)}&business_id=eq.${encodeURIComponent(businessId)}&provider=eq.google_calendar&select=*`
    );
    const links = Array.isArray(linkRows) ? linkRows : [];
    const byCustomer = new Map(
      links.map((row: any) => [row.customer_id, row])
    );
    const ownEventIds = new Set(
      links.map((row: any) => row.event_id).filter(Boolean)
    );

    const conflicts: any[] = [];
    let created = 0;
    let updated = 0;

    for (const customerId of cancelledIds) {
      const link: any = byCustomer.get(customerId);
      if (!link?.event_id || link.status === "cancelled") continue;

      try {
        await googleRequest(
          token,
          `/calendars/primary/events/${encodeURIComponent(link.event_id)}`,
          { method: "DELETE" }
        );
      } catch (error) {
        if (error?.status !== 404 && error?.status !== 410) throw error;
      }
      await patchLink(link.id, { status: "cancelled" });
    }

    for (const booking of bookings) {
      const link: any = byCustomer.get(booking.customerId);

      if (!link || link.status === "cancelled") {
        const event = await googleRequest(
          token,
          "/calendars/primary/events",
          {
            method: "POST",
            body: JSON.stringify(eventPayload(booking, businessId)),
          }
        );
        await upsertLink(user.id, businessId, booking, event, "active");
        ownEventIds.add(event.id);
        created += 1;
        continue;
      }

      let event: any = null;
      try {
        event = await googleRequest(
          token,
          `/calendars/primary/events/${encodeURIComponent(link.event_id)}`
        );
      } catch (error) {
        if (error?.status === 404 || error?.status === 410) {
          event = await googleRequest(
            token,
            "/calendars/primary/events",
            {
              method: "POST",
              body: JSON.stringify(eventPayload(booking, businessId)),
            }
          );
          await upsertLink(user.id, businessId, booking, event, "active");
          ownEventIds.add(event.id);
          created += 1;
          continue;
        }
        throw error;
      }

      const actual = eventTimes(event);
      const googleMoved =
        !!link.google_start_at &&
        (!sameInstant(actual.startAt, link.google_start_at) ||
          !sameInstant(actual.endAt, link.google_end_at));

      const busyChanged =
        String(link.busy_fingerprint || "") !== booking.fingerprint;

      const googleMatchesBusy =
        sameInstant(actual.startAt, booking.startAt) &&
        sameInstant(actual.endAt, booking.endAt);

      if (googleMoved && !googleMatchesBusy) {
        conflicts.push({
          customerId: booking.customerId,
          customerName: booking.customerName,
          service: booking.service,
          eventId: event.id,
          busyDate: booking.date,
          busyTime: booking.time,
          busyStartAt: booking.startAt,
          busyEndAt: booking.endAt,
          googleStartAt: actual.startAt,
          googleEndAt: actual.endAt,
          googleLabel: actual.startAt
            ? new Date(actual.startAt).toLocaleString("en-GB", {
                timeZone: "Europe/London",
              })
            : "time unavailable",
          googleUpdatedAt: actual.updatedAt,
          busyChanged,
        });
        continue;
      }

      if (busyChanged && !googleMatchesBusy) {
        const patched = await googleRequest(
          token,
          `/calendars/primary/events/${encodeURIComponent(event.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify(eventPayload(booking, businessId)),
          }
        );
        await upsertLink(user.id, businessId, booking, patched, "active");
        updated += 1;
      } else {
        await upsertLink(user.id, businessId, booking, event, "active");
      }
    }

    const rangeStart = String(
      body?.rangeStart || new Date().toISOString()
    );
    const rangeEnd = String(
      body?.rangeEnd || new Date(Date.now() + 7 * 86400000).toISOString()
    );

    const params = new URLSearchParams({
      timeMin: rangeStart,
      timeMax: rangeEnd,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "100",
    });

    const calendar = await googleRequest(
      token,
      `/calendars/primary/events?${params.toString()}`
    );

    const externalEvents = (
      Array.isArray(calendar?.items) ? calendar.items : []
    )
      .filter((event: any) => {
        const busyId =
          event?.extendedProperties?.private?.busyBusinessId;
        return !ownEventIds.has(event.id) && busyId !== businessId;
      })
      .map((event: any) => {
        const allDayDate = String(event?.start?.date || "");
        const startValue = String(event?.start?.dateTime || "");
        const endValue = String(event?.end?.dateTime || "");
        const start = new Date(startValue || allDayDate || "");
        const end = new Date(endValue || event?.end?.date || "");
        const london = startValue
          ? londonDateTime(startValue)
          : { date: allDayDate, time: "", label: allDayDate };
        return {
          id: event.id,
          title: String(
            event.summary || "Google Calendar commitment"
          ).slice(0, 240),
          date: london.date,
          time: london.time,
          durationHours:
            Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
              ? 0
              : Math.max(
                  0,
                  Math.round(
                    ((end.getTime() - start.getTime()) / 3600000) * 10
                  ) / 10
                ),
          source: "google_calendar",
        };
      })
      .filter((item: any) => item.date);

    await updateConnection(connection.id, {
      last_checked_at: new Date().toISOString(),
      last_error: null,
      status: "connected",
    });

    return json(200, {
      syncedAt: new Date().toISOString(),
      created,
      updated,
      conflicts,
      externalEvents,
    });
  }

  if (action === "resolve") {
    const customerId = String(body?.customerId || "");
    const booking = cleanBooking(body?.booking || {});
    const direction = String(body?.direction || "");

    if (!customerId || booking.customerId !== customerId) {
      return json(400, {
        error: "A valid booking/customer pair is required.",
      });
    }

    const rows = await serverRest(
      `busy_calendar_event_links?user_id=eq.${encodeURIComponent(user.id)}&business_id=eq.${encodeURIComponent(businessId)}&provider=eq.google_calendar&customer_id=eq.${encodeURIComponent(customerId)}&select=*&limit=1`
    );
    const link = Array.isArray(rows) ? rows[0] || null : null;

    if (!link?.event_id) {
      return json(404, {
        error: "Calendar event mapping was not found.",
      });
    }

    if (direction === "keep_busy") {
      const event = await googleRequest(
        token,
        `/calendars/primary/events/${encodeURIComponent(link.event_id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(eventPayload(booking, businessId)),
        }
      );
      await upsertLink(user.id, businessId, booking, event, "active");
      return json(200, { resolved: true, direction });
    }

    if (direction === "use_google") {
      const event = await googleRequest(
        token,
        `/calendars/primary/events/${encodeURIComponent(link.event_id)}`
      );
      await upsertLink(user.id, businessId, booking, event, "active");
      return json(200, { resolved: true, direction });
    }

    return json(400, { error: "Unsupported conflict resolution." });
  }

  return json(400, { error: "Unsupported calendar sync action." });
});
