import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const APP_REDIRECT_URI = "busydoesit://oauth/google-calendar";
const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/busy-calendar-oauth`;
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function serverHeaders() {
  const headers: Record<string, string> = {
    apikey: SERVER_KEY,
    "Content-Type": "application/json",
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
    headers: {
      ...serverHeaders(),
      ...(options.headers || {}),
    },
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

async function assertMembership(userId: string, businessId: string) {
  if (!userId || !businessId) return null;
  const rows = await serverRest(
    `busy_business_memberships?user_id=eq.${encodeURIComponent(
      userId
    )}&business_id=eq.${encodeURIComponent(
      businessId
    )}&select=role&limit=1`
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

function redirect(status: string, extra = "") {
  const suffix = extra ? `&message=${encodeURIComponent(extra.slice(0, 300))}` : "";
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${APP_REDIRECT_URI}?status=${encodeURIComponent(status)}${suffix}`,
      "Cache-Control": "no-store",
    },
  });
}

async function handleCallback(url: URL) {
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const oauthError = url.searchParams.get("error") || "";
  if (oauthError) return redirect("error", oauthError);
  if (!code || !state) return redirect("error", "Missing Google authorization response.");

  try {
    const states = await serverRest(
      `busy_calendar_oauth_states?state=eq.${encodeURIComponent(
        state
      )}&select=state,user_id,business_id,expires_at&limit=1`
    );
    const oauthState = Array.isArray(states) ? states[0] : null;
    if (!oauthState) return redirect("error", "OAuth state is missing or already used.");
    if (new Date(oauthState.expires_at).getTime() <= Date.now()) {
      await serverRest(
        `busy_calendar_oauth_states?state=eq.${encodeURIComponent(state)}`,
        { method: "DELETE" }
      ).catch(() => {});
      return redirect("error", "OAuth state expired. Start the connection again.");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: CALLBACK_URL,
      }),
    });
    const tokenPayload: any = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenPayload?.access_token) {
      throw new Error(
        tokenPayload?.error_description ||
          tokenPayload?.error ||
          "Google token exchange failed."
      );
    }

    const existingRows = await serverRest(
      `busy_calendar_connections?user_id=eq.${encodeURIComponent(
        oauthState.user_id
      )}&business_id=eq.${encodeURIComponent(
        oauthState.business_id
      )}&provider=eq.google_calendar&select=refresh_token&limit=1`
    );
    const existing = Array.isArray(existingRows) ? existingRows[0] : null;
    const refreshToken = tokenPayload.refresh_token || existing?.refresh_token || "";

    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenPayload.access_token}` } }
    );
    const userInfo: any = await userInfoResponse.json().catch(() => ({}));

    const calendarCheck = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1",
      { headers: { Authorization: `Bearer ${tokenPayload.access_token}` } }
    );
    const calendarPayload: any = await calendarCheck.json().catch(() => ({}));
    const calendarReady = calendarCheck.ok;
    const status = calendarReady ? "connected" : "needs_calendar_api";
    const lastError = calendarReady
      ? null
      : calendarPayload?.error?.message ||
        "Google Calendar API is not available to this OAuth client yet.";

    const expiresAt = new Date(
      Date.now() + Math.max(60, Number(tokenPayload.expires_in) || 3600) * 1000
    ).toISOString();

    await serverRest(
      "busy_calendar_connections?on_conflict=user_id,business_id,provider",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          user_id: oauthState.user_id,
          business_id: oauthState.business_id,
          provider: "google_calendar",
          status,
          provider_account_id: userInfo?.id || null,
          provider_account_email: userInfo?.email || null,
          calendar_id: "primary",
          access_token: tokenPayload.access_token,
          refresh_token: refreshToken || null,
          token_expires_at: expiresAt,
          scopes: String(tokenPayload.scope || GOOGLE_SCOPES.join(" ")).split(" "),
          last_error: lastError,
          connected_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      }
    );

    await serverRest(
      `busy_calendar_oauth_states?state=eq.${encodeURIComponent(state)}`,
      { method: "DELETE" }
    ).catch(() => {});

    return redirect(calendarReady ? "connected" : "needs_calendar_api", lastError || "");
  } catch (error) {
    await serverRest(
      `busy_calendar_oauth_states?state=eq.${encodeURIComponent(state)}`,
      { method: "DELETE" }
    ).catch(() => {});
    return redirect("error", error?.message || "Google Calendar connection failed.");
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  if (req.method === "GET" && (url.searchParams.get("code") || url.searchParams.get("error"))) {
    return handleCallback(url);
  }

  if (req.method !== "POST") return json(405, { error: "POST required." });

  const user = await currentUser(req);
  if (!user?.id) return json(401, { error: "Authenticated BUSY owner required." });

  const body: any = await req.json().catch(() => ({}));
  const action = String(body?.action || "");
  const businessId = String(body?.businessId || "");
  const membership = await assertMembership(user.id, businessId);
  if (!membership) return json(403, { error: "This user is not a member of that BUSY business." });

  const configured = !!GOOGLE_CLIENT_ID && !!GOOGLE_CLIENT_SECRET;

  if (action === "status") {
    const rows = await serverRest(
      `busy_calendar_connections?user_id=eq.${encodeURIComponent(
        user.id
      )}&business_id=eq.${encodeURIComponent(
        businessId
      )}&provider=eq.google_calendar&select=status,provider_account_email,calendar_id,scopes,last_error,connected_at,last_checked_at&limit=1`
    );
    const row = Array.isArray(rows) ? rows[0] || null : null;
    return json(200, {
      configured,
      callbackUrl: CALLBACK_URL,
      connection: row
        ? {
            status: row.status,
            accountEmail: row.provider_account_email || "",
            calendarId: row.calendar_id || "primary",
            scopes: Array.isArray(row.scopes) ? row.scopes : [],
            lastError: row.last_error || "",
            connectedAt: row.connected_at || "",
            lastCheckedAt: row.last_checked_at || "",
          }
        : null,
    });
  }

  if (action === "start") {
    if (!configured) {
      return json(503, {
        configured: false,
        error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured.",
        callbackUrl: CALLBACK_URL,
      });
    }

    const state = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    await serverRest("busy_calendar_oauth_states", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        state,
        user_id: user.id,
        business_id: businessId,
        provider: "google_calendar",
        app_redirect_uri: APP_REDIRECT_URI,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }),
    });

    const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    google.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    google.searchParams.set("redirect_uri", CALLBACK_URL);
    google.searchParams.set("response_type", "code");
    google.searchParams.set("access_type", "offline");
    google.searchParams.set("prompt", "consent");
    google.searchParams.set("include_granted_scopes", "true");
    google.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
    google.searchParams.set("state", state);

    return json(200, {
      configured: true,
      url: google.toString(),
      callbackUrl: CALLBACK_URL,
      appRedirectUri: APP_REDIRECT_URI,
    });
  }

  if (action === "disconnect") {
    await serverRest(
      `busy_calendar_connections?user_id=eq.${encodeURIComponent(
        user.id
      )}&business_id=eq.${encodeURIComponent(
        businessId
      )}&provider=eq.google_calendar`,
      { method: "DELETE" }
    );
    return json(200, { disconnected: true });
  }

  return json(400, { error: "Unsupported calendar OAuth action." });
});
