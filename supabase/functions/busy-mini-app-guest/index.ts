import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-busy-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function clean(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeEmail(value: unknown) {
  return clean(value, 240).toLowerCase();
}

function normalizePhone(value: unknown) {
  const raw = clean(value, 80);
  const plus = raw.startsWith("+") ? "+" : "";
  const digits = raw.replace(/\D/g, "").slice(0, 18);
  return digits ? `${plus}${digits}` : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 240;
}

function validPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 18;
}

function randomToken(byteLength = 24) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function sha256Text(value: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...digest].map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function hmacText(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SERVICE_ROLE_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
  );
  return [...signature].map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function fingerprintFor(req: Request) {
  const rawIp =
    clean(req.headers.get("cf-connecting-ip"), 120) ||
    clean(req.headers.get("x-real-ip"), 120) ||
    clean(req.headers.get("x-forwarded-for"), 400).split(",")[0].trim() ||
    "unknown";
  const userAgent = clean(req.headers.get("user-agent"), 320) || "unknown";
  return await hmacText(`guest-fingerprint|${rawIp}|${userAgent}`);
}

async function contactHash(email: string, phone: string) {
  return await hmacText(
    `guest-contact|${email || "-"}|${phone || "-"}`
  );
}

function requestTypeValue(value: unknown) {
  const type = clean(value, 40);
  if (!["enquiry", "booking_request"].includes(type)) {
    throw new Error("Choose an enquiry or booking request.");
  }
  return type;
}

async function liveApp(slug: string) {
  const app = await supabase
    .from("busy_mini_apps")
    .select(
      "id,business_id,public_slug,display_name,category,status,current_live_version_id"
    )
    .eq("public_slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (app.error) throw app.error;
  if (!app.data?.id || !app.data.current_live_version_id) {
    throw new Error("That BUSY Mini App is not currently live.");
  }

  const version = await supabase
    .from("busy_mini_app_versions")
    .select("id,version_no,config")
    .eq("id", app.data.current_live_version_id)
    .eq("mini_app_id", app.data.id)
    .maybeSingle();
  if (version.error) throw version.error;
  if (!version.data?.id) {
    throw new Error("The live Mini App version is not available.");
  }

  return { app: app.data, version: version.data };
}

function requireEnabledModule(version: any, requestType: string) {
  const moduleKey =
    requestType === "booking_request" ? "booking_request" : "enquiry";
  const module = safeArray(version?.config?.modules).find(
    (item: any) => item?.key === moduleKey
  );
  if (!module?.enabled) {
    throw new Error("That customer action is not enabled for this Mini App.");
  }
  return moduleKey;
}

async function recordEntry(app: any, source: string, stage: string) {
  const recorded = await supabase.rpc("busy_mini_app_record_entry", {
    p_business_id: app.business_id,
    p_mini_app_id: app.id,
    p_source: source,
    p_stage: stage,
  });
  if (recorded.error) {
    console.error("BUSY guest entry counter failed", recorded.error.message);
  }
}

async function createChallenge(req: Request, body: any) {
  const slug = clean(body?.slug, 100);
  const requestType = requestTypeValue(body?.requestType);
  if (!slug) throw new Error("This customer link is incomplete.");

  const { app, version } = await liveApp(slug);
  requireEnabledModule(version, requestType);

  const fingerprint = await fingerprintFor(req);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const [browserCount, appCount] = await Promise.all([
    supabase
      .from("busy_mini_app_guest_challenges")
      .select("id", { count: "exact", head: true })
      .eq("fingerprint_hash", fingerprint)
      .gte("created_at", since),
    supabase
      .from("busy_mini_app_guest_challenges")
      .select("id", { count: "exact", head: true })
      .eq("mini_app_id", app.id)
      .gte("created_at", since),
  ]);
  if (browserCount.error) throw browserCount.error;
  if (appCount.error) throw appCount.error;
  if (Number(browserCount.count || 0) >= 30) {
    throw new Error("Too many verification attempts from this browser. Try again later.");
  }
  if (Number(appCount.count || 0) >= 1000) {
    throw new Error("This Mini App is receiving unusually high request traffic. Try again shortly.");
  }

  const token = randomToken(24);
  const seed = randomToken(18);
  const difficulty = 3;
  const tokenHash = await sha256Text(token);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const inserted = await supabase
    .from("busy_mini_app_guest_challenges")
    .insert({
      business_id: app.business_id,
      mini_app_id: app.id,
      version_id: version.id,
      request_type: requestType,
      token_hash: tokenHash,
      fingerprint_hash: fingerprint,
      pow_seed: seed,
      pow_difficulty: difficulty,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (inserted.error) throw inserted.error;

  await recordEntry(app, "web", "action_intent");

  return {
    challengeId: inserted.data.id,
    token,
    seed,
    difficulty,
    expiresAt,
    businessName: app.display_name || "Business",
    requestType,
  };
}

async function validProof(
  seed: string,
  token: string,
  solutionValue: unknown,
  difficulty: number
) {
  const solution = Number(solutionValue);
  if (
    !Number.isInteger(solution) ||
    solution < 0 ||
    solution > 2_000_000
  ) {
    return false;
  }
  const digest = await sha256Text(`${seed}:${token}:${solution}`);
  return digest.startsWith("0".repeat(Math.max(2, Math.min(5, difficulty))));
}

function sanitizePayload(requestType: string, raw: any) {
  const source = raw && typeof raw === "object" ? raw : {};
  const name = clean(source.name || source.contactName, 160);
  const email = normalizeEmail(source.email || source.contactEmail);
  const phone = normalizePhone(source.phone || source.contactPhone);
  const service = clean(source.service, 240);
  const preferredDate = clean(source.preferredDate, 240);
  const message = clean(source.message, 5000);
  const note = clean(source.note, 3000);

  if (!name) throw new Error("Add your name before sending this request.");
  if (!email && !phone) {
    throw new Error("Add an email address or phone number so the business can respond.");
  }
  if (email && !validEmail(email)) {
    throw new Error("Enter a valid email address.");
  }
  if (phone && !validPhone(phone)) {
    throw new Error("Enter a valid phone number.");
  }
  if (requestType === "booking_request" && !service) {
    throw new Error("Choose or enter the service you want to request.");
  }
  if (requestType === "enquiry" && !message) {
    throw new Error("Add a message before sending your enquiry.");
  }

  const payload =
    requestType === "booking_request"
      ? {
          name,
          email,
          phone,
          service,
          preferredDate,
          note,
        }
      : {
          name,
          email,
          phone,
          service,
          message,
        };

  return {
    payload,
    name,
    email,
    phone,
    service,
    preferredDate,
  };
}

function validExpoPushToken(value: unknown) {
  const token = clean(value, 260);
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

async function notifyBusiness(requestRow: any) {
  try {
    const members = await supabase
      .from("busy_business_memberships")
      .select("user_id")
      .eq("business_id", requestRow.business_id)
      .in("role", ["owner", "admin"]);
    if (members.error) throw members.error;
    const userIds = [
      ...new Set((members.data || []).map((row: any) => clean(row.user_id, 80)).filter(Boolean)),
    ].slice(0, 20);

    for (const userId of userIds) {
      const notificationKey = `miniapp:${requestRow.id}:guest-received`;
      const claimed = await supabase
        .from("busy_push_deliveries")
        .insert({
          user_id: userId,
          business_id: requestRow.business_id,
          notification_key: notificationKey,
          notification_kind: "mini_app_request",
          route_data: {
            route: "mini_app_request",
            role: "business",
            requestId: requestRow.id,
            slug: requestRow.public_slug || "",
            businessId: requestRow.business_id,
          },
          provider_receipts: [],
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();

      if (claimed.error) {
        if (claimed.error.code === "23505") continue;
        continue;
      }

      const devices = await supabase
        .from("busy_push_devices")
        .select("expo_push_token")
        .eq("user_id", userId)
        .eq("active", true)
        .limit(8);
      if (devices.error) {
        await supabase.from("busy_push_deliveries").delete().eq("id", claimed.data.id);
        continue;
      }

      const tokens = [
        ...new Set(
          (devices.data || [])
            .map((row: any) => clean(row.expo_push_token, 260))
            .filter(validExpoPushToken)
        ),
      ];
      if (!tokens.length) {
        await supabase.from("busy_push_deliveries").delete().eq("id", claimed.data.id);
        continue;
      }

      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            tokens.map((to) => ({
              to,
              sound: "default",
              title:
                requestRow.request_type === "booking_request"
                  ? "BUSY Apps • New web booking request"
                  : "BUSY Apps • New web enquiry",
              body: "A customer sent a guest request through your public BUSY Mini App.",
              data: {
                route: "mini_app_request",
                role: "business",
                requestId: requestRow.id,
                slug: requestRow.public_slug || "",
                businessId: requestRow.business_id,
              },
            }))
          ),
        });
        const payload: any = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error("Expo rejected the notification.");
        await supabase
          .from("busy_push_deliveries")
          .update({ provider_receipts: payload?.data || [] })
          .eq("id", claimed.data.id);
      } catch {
        await supabase.from("busy_push_deliveries").delete().eq("id", claimed.data.id);
      }
    }
  } catch (error) {
    console.error(
      "BUSY guest request notification failed",
      error instanceof Error ? error.message : error
    );
  }
}

async function submitGuestRequest(req: Request, body: any) {
  const challengeId = clean(body?.challengeId, 80);
  const token = clean(body?.token, 300);
  const idempotencyKey = clean(
    body?.idempotencyKey || req.headers.get("x-busy-request-id"),
    180
  );
  const honeypot = clean(body?.website || body?.companyWebsite, 200);
  if (honeypot) throw new Error("This request could not be verified.");
  if (!challengeId || !token) {
    throw new Error("Start the guest verification again.");
  }

  const challenge = await supabase
    .from("busy_mini_app_guest_challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();
  if (challenge.error) throw challenge.error;
  if (!challenge.data) throw new Error("Guest verification expired. Try again.");

  const tokenHash = await sha256Text(token);
  if (tokenHash !== challenge.data.token_hash) {
    throw new Error("Guest verification does not match this request.");
  }

  const fingerprint = await fingerprintFor(req);
  if (fingerprint !== challenge.data.fingerprint_hash) {
    throw new Error("Guest verification must be completed in the same browser.");
  }

  const ageMs = Date.now() - new Date(challenge.data.created_at).getTime();
  if (ageMs < 650) {
    throw new Error("Please wait a moment and try sending again.");
  }
  if (new Date(challenge.data.expires_at).getTime() <= Date.now()) {
    throw new Error("Guest verification expired. Try again.");
  }

  const proofOk = await validProof(
    challenge.data.pow_seed,
    token,
    body?.solution,
    Number(challenge.data.pow_difficulty || 3)
  );
  if (!proofOk) {
    throw new Error("BUSY could not verify this browser request.");
  }

  const { app, version } = await liveApp(
    clean(body?.slug, 100) || clean(body?.publicSlug, 100)
  );
  if (
    app.id !== challenge.data.mini_app_id ||
    version.id !== challenge.data.version_id
  ) {
    throw new Error("The Mini App changed while you were filling this in. Refresh and try again.");
  }
  const requestType = requestTypeValue(challenge.data.request_type);
  requireEnabledModule(version, requestType);

  const safe = sanitizePayload(requestType, body?.payload);
  const cHash = await contactHash(safe.email, safe.phone);
  const guestAccessToken = await hmacText(
    `guest-access|${challengeId}|${token}`
  );
  const guestAccessHash = await sha256Text(guestAccessToken);

  const created = await supabase.rpc("busy_mini_app_create_guest_request", {
    p_challenge_id: challengeId,
    p_fingerprint_hash: fingerprint,
    p_contact_hash: cHash,
    p_guest_access_hash: guestAccessHash,
    p_idempotency_key: idempotencyKey || null,
    p_payload: safe.payload,
    p_contact_name: safe.name,
    p_contact_email: safe.email || null,
    p_contact_phone: safe.phone || null,
    p_service_name: safe.service || null,
    p_preferred_date_text: safe.preferredDate || null,
  });
  if (created.error) throw created.error;

  const requestId = String(created.data || "");
  const requestRow = await supabase
    .from("busy_mini_app_requests")
    .select("id,business_id,mini_app_id,request_type,status,created_at,updated_at")
    .eq("id", requestId)
    .eq("mini_app_id", app.id)
    .maybeSingle();
  if (requestRow.error) throw requestRow.error;
  if (!requestRow.data) throw new Error("BUSY could not confirm the saved guest request.");

  await notifyBusiness({ ...requestRow.data, public_slug: app.public_slug });

  return {
    request: {
      id: requestRow.data.id,
      type: requestRow.data.request_type,
      status: requestRow.data.status,
      createdAt: requestRow.data.created_at,
      businessName: app.display_name || "Business",
    },
    guestAccessToken,
    assurance: "guest_browser_challenge",
    contactVerification: "self_reported",
  };
}

async function guestStatus(body: any) {
  const requestId = clean(body?.requestId, 80);
  const accessToken = clean(body?.guestAccessToken, 300);
  if (!requestId || !accessToken) {
    throw new Error("This browser does not have a guest request receipt.");
  }
  const accessHash = await sha256Text(accessToken);

  const request = await supabase
    .from("busy_mini_app_requests")
    .select(
      "id,business_id,mini_app_id,request_type,status,contact_name,service_name,preferred_date_text,request_origin,identity_assurance,guest_access_hash,created_at,updated_at"
    )
    .eq("id", requestId)
    .eq("request_origin", "guest_web")
    .eq("guest_access_hash", accessHash)
    .maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) throw new Error("That guest request receipt is not available.");

  const [app, link] = await Promise.all([
    supabase
      .from("busy_mini_apps")
      .select("display_name,public_slug")
      .eq("id", request.data.mini_app_id)
      .maybeSingle(),
    supabase
      .from("busy_mini_app_request_links")
      .select("bridge_state,updated_at")
      .eq("request_id", requestId)
      .maybeSingle(),
  ]);
  if (app.error) throw app.error;
  if (link.error) throw link.error;

  return {
    request: {
      id: request.data.id,
      type: request.data.request_type,
      status: request.data.status,
      contactName: request.data.contact_name || "",
      serviceName: request.data.service_name || "",
      preferredDate: request.data.preferred_date_text || "",
      createdAt: request.data.created_at,
      updatedAt: request.data.updated_at,
      businessName: app.data?.display_name || "Business",
      businessSlug: app.data?.public_slug || "",
      bookingConfirmed: link.data?.bridge_state === "booking_confirmed",
    },
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "POST required." });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = clean(body?.action, 40);

    if (action === "challenge") {
      return json(200, {
        ok: true,
        challenge: await createChallenge(req, body),
      });
    }
    if (action === "submit") {
      return json(200, {
        ok: true,
        ...(await submitGuestRequest(req, body)),
      });
    }
    if (action === "status") {
      return json(200, {
        ok: true,
        ...(await guestStatus(body)),
      });
    }

    return json(400, { error: "Unsupported guest Mini App action." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Guest Mini App request failed.";
    console.error("BUSY guest Mini App error", message);
    return json(400, { error: message });
  }
});
