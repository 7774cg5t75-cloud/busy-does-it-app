import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function publishableKey() {
  try {
    const values = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    if (typeof values?.default === "string") return values.default;
  } catch {}
  return Deno.env.get("SUPABASE_ANON_KEY") || "";
}

async function currentUser(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  const key = publishableKey();
  if (!authorization.startsWith("Bearer ") || !key) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: key, Authorization: authorization },
  });
  if (!response.ok) return null;
  return await response.json().catch(() => null);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "POST required." });

  const user = await currentUser(req);
  if (!user?.id) return json(401, { error: "Authenticated BUSY owner required." });

  const authorization = req.headers.get("Authorization") || "";
  const key = publishableKey();
  const body: any = await req.json().catch(() => ({}));
  const action = String(body?.action || "");
  const businessId = String(body?.businessId || "");

  if (action !== "test") {
    return json(400, { error: "V3.25 only exposes the authenticated owner test action." });
  }

  const filters = [
    `user_id=eq.${encodeURIComponent(user.id)}`,
    "active=eq.true",
    "select=expo_push_token,business_id",
  ];
  if (businessId) {
    filters.splice(1, 0, `business_id=eq.${encodeURIComponent(businessId)}`);
  }
  const devicesResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/busy_push_devices?${filters.join("&")}`,
    {
      headers: {
        apikey: key,
        Authorization: authorization,
      },
    }
  );
  const devices: any[] = await devicesResponse.json().catch(() => []);
  if (!devicesResponse.ok) {
    return json(500, { error: "BUSY could not read the owner push-device registry." });
  }

  const tokens = [...new Set(
    (Array.isArray(devices) ? devices : [])
      .map((item) => String(item?.expo_push_token || ""))
      .filter((token) => token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
  )];
  if (!tokens.length) {
    return json(200, {
      sent: 0,
      message: "No active Expo push token is registered for this owner/business.",
    });
  }

  const messages = tokens.map((to) => ({
    to,
    sound: "default",
    title: "BUSY production push test",
    body: "Remote push reached this device from the BUSY backend. Tap to open the Executive Briefing.",
    data: {
      route: String(body?.route || "executive"),
      kind: "remote-production-test",
    },
  }));

  const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });
  const expoPayload: any = await expoResponse.json().catch(() => ({}));
  if (!expoResponse.ok) {
    return json(502, {
      error: expoPayload?.errors?.[0]?.message || "Expo push service rejected the test.",
    });
  }

  return json(200, {
    sent: tokens.length,
    tickets: expoPayload?.data || [],
  });
});
