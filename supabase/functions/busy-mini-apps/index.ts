import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MINI_APP_PUBLIC_BUCKET = "busy-mini-app-public";
const MINI_APP_LINK_URL = `${SUPABASE_URL}/functions/v1/busy-mini-app-link`;
const MINI_APP_GUEST_URL = `${SUPABASE_URL}/functions/v1/busy-mini-app-guest`;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_APP_PLANNER_MODEL = "gpt-6-luna";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-busy-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clean(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function slugify(value: unknown) {
  return (
    clean(value, 120)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "business"
  );
}

function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc: Record<string, unknown>, key) => {
        acc[key] = canonical(value[key]);
        return acc;
      }, {});
  }
  return value;
}

async function sha256(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(canonical(value)));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((item) => item.toString(16).padStart(2, "0")).join("");
}

async function requireUser(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Sign in before using BUSY Apps.");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) throw new Error("Your BUSY sign-in has expired.");
  return data.user;
}

async function membership(
  userId: string,
  businessId = "",
  requireWrite = false
) {
  let query = supabase
    .from("busy_business_memberships")
    .select("business_id,role,created_at")
    .eq("user_id", userId);
  if (businessId) query = query.eq("business_id", businessId);

  const { data, error } = await query.limit(20);
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  rows.sort((a: any, b: any) => {
    const rank = (role: string) =>
      role === "owner" ? 0 : role === "admin" ? 1 : 2;
    return rank(a.role) - rank(b.role);
  });
  const row = rows[0];
  if (!row?.business_id) {
    throw new Error("This account is not a member of that BUSY business.");
  }
  if (requireWrite && !["owner", "admin"].includes(row.role)) {
    throw new Error("Owner or admin access is required to change a BUSY Mini App.");
  }
  return row as { business_id: string; role: string };
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function validExpoPushToken(value: unknown) {
  const token = clean(value, 260);
  return token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken[");
}

async function notificationStatus(userId: string) {
  const result = await supabase
    .from("busy_push_devices")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("active", true);
  if (result.error) throw result.error;
  return { activeDeviceCount: Number(result.count || 0) };
}

async function registerNotificationDevice(userId: string, body: any) {
  const expoPushToken = clean(body?.expoPushToken, 260);
  if (!validExpoPushToken(expoPushToken)) {
    throw new Error("BUSY did not receive a valid Expo push token.");
  }
  const platform = ["ios", "android"].includes(clean(body?.platform, 20))
    ? clean(body?.platform, 20)
    : "unknown";
  const now = new Date().toISOString();
  const existing = await supabase
    .from("busy_push_devices")
    .select("id,business_id")
    .eq("user_id", userId)
    .eq("expo_push_token", expoPushToken)
    .maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data?.id) {
    const updated = await supabase
      .from("busy_push_devices")
      .update({
        platform,
        app_version: clean(body?.appVersion, 40),
        device_label: clean(body?.deviceLabel, 120) || `${platform} BUSY device`,
        active: true,
        last_seen_at: now,
        updated_at: now,
      })
      .eq("id", existing.data.id)
      .select("id")
      .single();
    if (updated.error) throw updated.error;
  } else {
    const inserted = await supabase
      .from("busy_push_devices")
      .insert({
        user_id: userId,
        business_id: null,
        expo_push_token: expoPushToken,
        platform,
        app_version: clean(body?.appVersion, 40),
        device_label: clean(body?.deviceLabel, 120) || `${platform} BUSY device`,
        active: true,
        last_seen_at: now,
        updated_at: now,
      });
    if (inserted.error) throw inserted.error;
  }
  return await notificationStatus(userId);
}

async function disableNotificationDevice(userId: string, body: any) {
  const expoPushToken = clean(body?.expoPushToken, 260);
  if (!validExpoPushToken(expoPushToken)) {
    throw new Error("BUSY could not identify this notification device.");
  }
  const updated = await supabase
    .from("busy_push_devices")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("expo_push_token", expoPushToken);
  if (updated.error) throw updated.error;
  return await notificationStatus(userId);
}

async function bumpUnread(requestId: string, side: "business" | "customer") {
  const result = await supabase.rpc("busy_mini_app_bump_unread", {
    p_request_id: requestId,
    p_side: side,
  });
  if (result.error) throw result.error;
  return Array.isArray(result.data) ? result.data[0] || null : result.data;
}

async function appNotificationSummary(miniAppId: string) {
  const app = await supabase
    .from("busy_mini_apps")
    .select("id,public_slug,display_name,business_id")
    .eq("id", miniAppId)
    .maybeSingle();
  if (app.error) throw app.error;
  return app.data || null;
}

async function businessNotificationUsers(businessId: string) {
  const members = await supabase
    .from("busy_business_memberships")
    .select("user_id,role")
    .eq("business_id", businessId)
    .in("role", ["owner", "admin"]);
  if (members.error) throw members.error;
  return [...new Set((members.data || []).map((row: any) => row.user_id).filter(Boolean))];
}

async function dispatchMiniAppPush({
  userIds = [],
  businessId,
  notificationKey,
  title,
  body,
  data = {},
}: any) {
  const ids = [...new Set(safeArray(userIds).map((value) => clean(value, 80)).filter(Boolean))];
  if (!ids.length || !businessId || !notificationKey) return { sent: 0 };
  let sent = 0;

  for (const userId of ids.slice(0, 20)) {
    const claimed = await supabase
      .from("busy_push_deliveries")
      .insert({
        user_id: userId,
        business_id: businessId,
        notification_key: notificationKey,
        notification_kind: "mini_app_request",
        route_data: data,
        provider_receipts: [],
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (claimed.error) {
      if (claimed.error.code === "23505") continue;
      console.error("BUSY Mini App push claim failed", claimed.error.message);
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
    const tokens = [...new Set((devices.data || []).map((row: any) => clean(row.expo_push_token, 260)).filter(validExpoPushToken))];
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
        body: JSON.stringify(tokens.map((to) => ({
          to,
          sound: "default",
          title: clean(title, 180),
          body: clean(body, 500),
          data,
        }))),
      });
      const payload: any = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.errors?.[0]?.message || "Expo push rejected the notification.");
      await supabase
        .from("busy_push_deliveries")
        .update({ provider_receipts: payload?.data || [] })
        .eq("id", claimed.data.id);
      sent += tokens.length;
    } catch (error) {
      console.error("BUSY Mini App push failed", error instanceof Error ? error.message : error);
      await supabase.from("busy_push_deliveries").delete().eq("id", claimed.data.id);
    }
  }
  return { sent };
}

async function notifyBusinessOfMiniAppRequest(requestRow: any, title: string, body: string, keySuffix: string) {
  try {
    const app = await appNotificationSummary(requestRow.mini_app_id);
    const users = await businessNotificationUsers(requestRow.business_id);
    return await dispatchMiniAppPush({
      userIds: users,
      businessId: requestRow.business_id,
      notificationKey: `miniapp:${requestRow.id}:${keySuffix}`,
      title,
      body,
      data: {
        route: "mini_app_request",
        role: "business",
        requestId: requestRow.id,
        slug: app?.public_slug || "",
        businessId: requestRow.business_id,
      },
    });
  } catch (error) {
    console.error("BUSY business Mini App notification failed", error instanceof Error ? error.message : error);
    return { sent: 0 };
  }
}

async function notifyCustomerOfMiniAppRequest(requestRow: any, title: string, body: string, keySuffix: string) {
  try {
    if (!requestRow.consumer_user_id) return { sent: 0 };
    const app = await appNotificationSummary(requestRow.mini_app_id);
    return await dispatchMiniAppPush({
      userIds: [requestRow.consumer_user_id],
      businessId: requestRow.business_id,
      notificationKey: `miniapp:${requestRow.id}:${keySuffix}`,
      title,
      body,
      data: {
        route: "mini_app_request",
        role: "customer",
        requestId: requestRow.id,
        slug: app?.public_slug || "",
        businessId: requestRow.business_id,
      },
    });
  } catch (error) {
    console.error("BUSY customer Mini App notification failed", error instanceof Error ? error.message : error);
    return { sent: 0 };
  }
}

async function requestConversationPage(requestRow: any, body: any) {
  const before = clean(body?.before, 80);
  const limit = Math.max(10, Math.min(50, Number(body?.limit) || 30));
  let messageQuery = supabase
    .from("busy_mini_app_request_messages")
    .select("id,request_id,sender_user_id,sender_role,body,created_at")
    .eq("request_id", requestRow.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) messageQuery = messageQuery.lt("created_at", before);

  const [messages, events, app] = await Promise.all([
    messageQuery,
    supabase
      .from("busy_mini_app_request_events")
      .select("id,event_type,created_at")
      .eq("request_id", requestRow.id)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("busy_mini_apps")
      .select("id,public_slug,display_name,category")
      .eq("id", requestRow.mini_app_id)
      .maybeSingle(),
  ]);
  if (messages.error) throw messages.error;
  if (events.error) throw events.error;
  if (app.error) throw app.error;
  const rows = messages.data || [];
  return {
    request: requestRow,
    app: app.data || null,
    messages: rows,
    events: events.data || [],
    nextBefore: rows.length >= limit ? rows[rows.length - 1]?.created_at || "" : "",
  };
}

async function customerRequestDetail(userId: string, body: any) {
  const requestId = clean(body?.requestId, 80);
  const request = await supabase
    .from("busy_mini_app_requests")
    .select("*")
    .eq("id", requestId)
    .eq("consumer_user_id", userId)
    .maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) throw new Error("That BUSY Apps request is not available.");
  const readAt = new Date().toISOString();
  const updated = await supabase
    .from("busy_mini_app_requests")
    .update({ customer_unread_count: 0, last_customer_read_at: readAt })
    .eq("id", requestId)
    .eq("consumer_user_id", userId)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  const detail = await requestConversationPage(updated.data, body);
  return {
    ...detail,
    loyaltyProgress: await loyaltyForRequest(updated.data),
  };
}

async function ownerRequestDetail(businessId: string, body: any) {
  const requestId = clean(body?.requestId, 80);
  const request = await supabase
    .from("busy_mini_app_requests")
    .select("*")
    .eq("id", requestId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) throw new Error("Mini App request not found.");
  const readAt = new Date().toISOString();
  const updated = await supabase
    .from("busy_mini_app_requests")
    .update({ business_unread_count: 0, last_business_read_at: readAt })
    .eq("id", requestId)
    .eq("business_id", businessId)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  const detail = await requestConversationPage(updated.data, body);
  return {
    ...detail,
    loyaltyProgress: await loyaltyForRequest(updated.data),
  };
}

function publicAsset(value: any) {
  if (!value || typeof value !== "object") return null;
  const uri = clean(value.uri, 2000);
  return {
    key: clean(value.key, 180),
    source: clean(value.source, 120),
    service: clean(value.service, 240),
    storagePath: clean(value.storagePath, 1200),
    uri: /^https:\/\//i.test(uri) ? uri : "",
  };
}

function sanitizePublicProfile(input: any) {
  const profile = input && typeof input === "object" ? input : {};
  const contact =
    profile.contact && typeof profile.contact === "object"
      ? profile.contact
      : {};
  const assets =
    profile.assets && typeof profile.assets === "object"
      ? profile.assets
      : {};

  return {
    businessName: clean(
      profile.businessName || profile.displayName,
      240
    ),
    businessType: clean(
      profile.businessType || profile.category,
      240
    ),
    tagline: clean(profile.tagline, 400),
    description: clean(profile.description, 1800),
    about: clean(profile.about, 2500),
    differentiators: clean(profile.differentiators, 1800),
    serviceArea: clean(profile.serviceArea, 500),
    contact: {
      phone: clean(contact.phone || profile.phone, 120),
      email: clean(contact.email || profile.email, 240),
      openingHours: clean(
        contact.openingHours || profile.openingHours,
        700
      ),
      social:
        contact.social && typeof contact.social === "object"
          ? {
              facebook: clean(contact.social.facebook, 1000),
              instagram: clean(contact.social.instagram, 1000),
            }
          : {},
    },
    services: safeArray(profile.services)
      .slice(0, 50)
      .map((item: any) => ({
        id: clean(item?.id, 120) || slugify(item?.name),
        name: clean(item?.name || item?.title, 240),
        description: clean(item?.description || item?.body, 1200),
      }))
      .filter((item: any) => item.name),
    assets: {
      hero: publicAsset(assets.hero || profile.heroAsset),
      gallery: safeArray(assets.gallery || profile.photos)
        .slice(0, 24)
        .map(publicAsset)
        .filter(Boolean),
    },
    theme:
      profile.theme && typeof profile.theme === "object"
        ? {
            mood: clean(profile.theme.mood, 120),
            primary: clean(profile.theme.primary, 80),
            secondary: clean(profile.theme.secondary, 80),
          }
        : {},
  };
}

async function moduleCatalog() {
  const result = await supabase
    .from("busy_mini_app_module_catalog")
    .select(
      "module_key,title,description,status,module_version,capabilities,default_enabled,sort_order"
    )
    .order("sort_order", { ascending: true });
  if (result.error) throw result.error;
  return result.data || [];
}

async function publicProfileForBusiness(businessId: string) {
  const result = await supabase
    .from("busy_public_business_profiles")
    .select(
      "business_id,public_slug,display_name,status,revision,profile,updated_at"
    )
    .eq("business_id", businessId)
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data || null;
}

function moduleDefaultEnabled(module: any, profile: any) {
  const key = module?.module_key;
  if (module?.status !== "available") return false;
  if (key === "business_profile") return true;
  if (key === "services") return safeArray(profile?.services).length > 0;
  if (key === "gallery")
    return safeArray(profile?.assets?.gallery).length > 0;
  if (key === "contact")
    return !!(profile?.contact?.phone || profile?.contact?.email);
  if (key === "enquiry") return true;
  if (key === "booking_request")
    return safeArray(profile?.services).length > 0;
  return !!module?.default_enabled;
}

function buildConfig(
  profile: any,
  catalog: any[],
  profileRevision = 0,
  previousConfig: any = null
) {
  const previousModules = new Map(
    safeArray(previousConfig?.modules).map((item: any) => [
      item.key,
      item,
    ])
  );

  const modules = catalog.map((module: any) => {
    const previous = previousModules.get(module.module_key) as any;
    const enabled =
      module.module_key === "business_profile"
        ? true
        : module.status !== "available"
        ? false
        : previous && typeof previous.enabled === "boolean"
        ? previous.enabled
        : moduleDefaultEnabled(module, profile);

    return {
      key: module.module_key,
      title: module.title,
      status: module.status,
      version: Number(module.module_version) || 1,
      enabled,
      capabilities:
        module.capabilities && typeof module.capabilities === "object"
          ? module.capabilities
          : {},
      settings:
        module.module_key === "booking_request"
          ? {
              mode: "request_only",
              businessConfirmationRequired: true,
            }
          : {},
    };
  });

  return {
    schemaVersion: 1,
    surface: "busy_mini_app",
    sourceProfileRevision: Math.max(0, Number(profileRevision) || 0),
    display: {
      name: clean(profile?.businessName, 240),
      category: clean(profile?.businessType, 240),
      tagline: clean(profile?.tagline, 400),
    },
    publicProfile: profile,
    modules,
    navigation: modules
      .filter((item: any) => item.enabled)
      .map((item: any) => item.key),
  };
}

const appPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "modules",
    "missingFacts",
    "offers",
    "loyalty",
    "unsupportedRequests",
    "confidence",
  ],
  properties: {
    summary: { type: "string" },
    modules: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "enabled", "reason"],
        properties: {
          key: { type: "string" },
          enabled: { type: "boolean" },
          reason: { type: "string" },
        },
      },
    },
    missingFacts: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "question"],
        properties: {
          key: { type: "string" },
          question: { type: "string" },
        },
      },
    },
    offers: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "body", "terms", "startDate", "endDate"],
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          terms: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
      },
    },
    loyalty: {
      type: "object",
      additionalProperties: false,
      required: ["enabled", "programName", "targetStamps", "reward", "terms"],
      properties: {
        enabled: { type: "boolean" },
        programName: { type: "string" },
        targetStamps: { type: "number", minimum: 0, maximum: 20 },
        reward: { type: "string" },
        terms: { type: "string" },
      },
    },
    unsupportedRequests: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["request", "reason"],
        properties: {
          request: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    confidence: { type: "string", enum: ["High", "Medium", "Low"] },
  },
};

function safeIsoDate(value: unknown) {
  const date = clean(value, 20);
  return /^20\d{2}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function safeOffer(value: any) {
  return {
    title: clean(value?.title, 180),
    body: clean(value?.body, 900),
    terms: clean(value?.terms, 500),
    startDate: safeIsoDate(value?.startDate),
    endDate: safeIsoDate(value?.endDate),
  };
}

function safeLoyalty(value: any) {
  const target = Math.max(0, Math.min(20, Number(value?.targetStamps) || 0));
  return {
    enabled: value?.enabled === true,
    programName: clean(value?.programName, 180),
    targetStamps: target,
    reward: clean(value?.reward, 500),
    terms: clean(value?.terms, 500),
  };
}

function loyaltyReady(value: any) {
  const loyalty = safeLoyalty(value);
  return (
    loyalty.enabled &&
    loyalty.targetStamps >= 2 &&
    loyalty.targetStamps <= 20 &&
    !!loyalty.reward
  );
}

function cleanFactAnswers(value: any) {
  const source = value && typeof value === "object" ? value : {};
  return Object.entries(source)
    .slice(0, 12)
    .reduce((acc: Record<string, string>, [key, answer]) => {
      const safeKey = clean(key, 80);
      const safeAnswer = clean(answer, 2000);
      if (safeKey && safeAnswer) acc[safeKey] = safeAnswer;
      return acc;
    }, {});
}

function applyFactAnswersToProfile(profile: any, answers: Record<string, string>) {
  const next = JSON.parse(JSON.stringify(profile || {}));
  const serviceAnswer = clean(answers?.services, 2000);
  if (serviceAnswer && !safeArray(next.services).length) {
    next.services = serviceAnswer
      .split(/[\n,;]+/)
      .map((name: string) => clean(name, 240))
      .filter(Boolean)
      .slice(0, 20)
      .map((name: string) => ({
        id: slugify(name),
        name,
        description: "",
      }));
  }

  const contactAnswer = clean(answers?.contact, 800);
  if (contactAnswer) {
    next.contact = next.contact || {};
    if (!next.contact.email) {
      const email = contactAnswer.match(/[^\s@]+@[^\s@]+\.[^\s@]+/i)?.[0] || "";
      if (email) next.contact.email = clean(email, 240);
    }
    if (!next.contact.phone) {
      const phone = contactAnswer.match(/(?:\+?\d[\d\s().-]{6,}\d)/)?.[0] || "";
      if (phone) next.contact.phone = clean(phone, 120);
    }
  }
  return next;
}

function ownerRequestWithAnswers(ownerRequest: string, answers: Record<string, string>) {
  const rows = Object.entries(answers || {})
    .map(([key, value]) => `${key}: ${value}`)
    .filter(Boolean);
  return rows.length
    ? `${ownerRequest}\n\nOwner answers to BUSY follow-up questions:\n${rows.join("\n")}`
    : ownerRequest;
}

function fallbackAppPlan(
  ownerRequest: string,
  profile: any,
  catalog: any[],
  existingConfig: any = null
) {
  const text = ownerRequest.toLowerCase();
  const available = new Set(
    catalog
      .filter((item: any) => item.status === "available")
      .map((item: any) => item.module_key)
  );
  const existingOffers = safeArray(existingConfig?.offers)
    .map(safeOffer)
    .filter((item: any) => item.title && item.body);
  const existingLoyalty = safeLoyalty(existingConfig?.loyalty || {});
  const existingEnabled = new Set(
    safeArray(existingConfig?.modules)
      .filter((item: any) => item?.enabled)
      .map((item: any) => clean(item?.key, 80))
  );

  const wants = (words: string[]) =>
    words.some((word) => text.includes(word));
  const explicitlyRemoves = (words: string[]) =>
    words.some(
      (word) =>
        text.includes(`remove ${word}`) ||
        text.includes(`without ${word}`) ||
        text.includes(`no ${word}`) ||
        text.includes(`don't want ${word}`) ||
        text.includes(`do not want ${word}`)
    );

  const moduleFlags: Record<string, boolean> = {
    business_profile: true,
    services:
      !explicitlyRemoves(["services", "service list"]) &&
      (existingEnabled.has("services") ||
        safeArray(profile?.services).length > 0 ||
        wants(["service", "what we do", "price list"])),
    gallery:
      !explicitlyRemoves(["gallery", "photos", "pictures"]) &&
      (existingEnabled.has("gallery") ||
        safeArray(profile?.assets?.gallery).length > 0 ||
        wants(["gallery", "photo", "picture", "portfolio", "before and after"])),
    contact:
      !explicitlyRemoves(["contact", "contact details"]) &&
      (existingEnabled.has("contact") ||
        !!(profile?.contact?.phone || profile?.contact?.email) ||
        wants(["contact", "call", "email", "get in touch"])),
    enquiry:
      !explicitlyRemoves(["enquiries", "enquiry", "quote requests"]) &&
      (existingEnabled.has("enquiry") ||
        wants(["enquir", "quote", "estimate", "message", "contact"]) ||
        !existingConfig),
    booking_request:
      !explicitlyRemoves(["booking", "bookings", "booking requests"]) &&
      (existingEnabled.has("booking_request") ||
        wants([
          "book",
          "appointment",
          "schedule",
          "reserve",
          "date",
          "slot",
        ])),
    offers:
      !explicitlyRemoves(["offers", "offer", "promotions"]) &&
      existingOffers.length > 0 &&
      (existingEnabled.has("offers") ||
        wants(["offer", "deal", "discount", "promotion", "promo"])),
    loyalty:
      !explicitlyRemoves(["loyalty", "stamp card", "stamps"]) &&
      loyaltyReady(existingLoyalty) &&
      (existingEnabled.has("loyalty") ||
        wants(["loyalty", "stamp card", "stamps", "visits", "reward"])),
  };

  const moduleReasons: Record<string, string> = {
    business_profile: "Every BUSY business app needs the approved business identity.",
    services: safeArray(profile?.services).length
      ? "BUSY already knows the business services."
      : "You asked customers to see services.",
    gallery: safeArray(profile?.assets?.gallery).length
      ? "Approved business imagery is already available."
      : "You asked for visual work examples.",
    contact: "Customers need a clear route to contact the business.",
    enquiry: "A structured enquiry keeps customer interest inside the BUSY workflow.",
    booking_request:
      "Customers can request a service/date, while the business still confirms the booking.",
    offers: "An already approved offer can be shown publicly.",
    loyalty:
      "Customers can track simple owner-recorded stamps toward one clearly defined reward.",
  };

  const missingFacts: any[] = [];
  if (moduleFlags.services && !safeArray(profile?.services).length) {
    missingFacts.push({
      key: "services",
      question: "Which services should customers see in the app?",
    });
  }
  if (
    moduleFlags.contact &&
    !profile?.contact?.phone &&
    !profile?.contact?.email
  ) {
    missingFacts.push({
      key: "contact",
      question: "What phone number or email should customers use?",
    });
  }
  if (
    wants(["gallery", "photo", "picture", "portfolio", "before and after"]) &&
    !safeArray(profile?.assets?.gallery).length
  ) {
    missingFacts.push({
      key: "gallery",
      question: "Which approved photos should BUSY use for the app gallery?",
    });
  }
  if (
    wants(["offer", "deal", "discount", "promotion", "promo"]) &&
    !existingOffers.length
  ) {
    missingFacts.push({
      key: "offers",
      question:
        "What exact offer should customers see? Include the wording, terms and optional start/end dates if you want them.",
    });
  }
  if (
    wants(["loyalty", "stamp card", "stamps", "visits", "reward"]) &&
    !loyaltyReady(existingLoyalty)
  ) {
    missingFacts.push({
      key: "loyalty",
      question:
        "How many stamps or visits should earn what reward? For example: 6 visits earns a free wash.",
    });
  }

  const unsupportedRequests: any[] = [];
  if (wants(["payment", "pay online", "take payment", "card payment", "deposit"])) {
    unsupportedRequests.push({
      request: "Payments",
      reason: "Payments remain a planned controlled module and are not enabled by this builder yet.",
    });
  }

  return {
    summary:
      ownerRequest ||
      "Build a simple customer-facing app from the business information BUSY already knows.",
    modules: catalog.map((item: any) => ({
      key: item.module_key,
      enabled:
        item.status === "available" &&
        !!moduleFlags[item.module_key],
      reason:
        item.status === "available"
          ? moduleReasons[item.module_key] || "Not needed for this app request."
          : "This module is planned but is not available yet.",
    })),
    missingFacts,
    offers: existingOffers,
    loyalty: existingLoyalty,
    unsupportedRequests,
    confidence: ownerRequest ? "Medium" : "Low",
    planner: "deterministic_fallback",
  };
}

function sanitiseAppPlan(
  plan: any,
  catalog: any[],
  fallback: any,
  ownerRequest = "",
  existingOffers: any[] = [],
  existingLoyalty: any = null
) {
  const catalogByKey = new Map(
    catalog.map((item: any) => [item.module_key, item])
  );
  const requestedModules = new Map(
    safeArray(plan?.modules).map((item: any) => [clean(item?.key, 80), item])
  );

  const modules = catalog.map((catalogItem: any) => {
    const requested: any = requestedModules.get(catalogItem.module_key);
    const enabled =
      catalogItem.module_key === "business_profile"
        ? true
        : catalogItem.status === "available" && requested?.enabled === true;
    return {
      key: catalogItem.module_key,
      enabled,
      reason:
        clean(requested?.reason, 500) ||
        clean(
          fallback?.modules?.find(
            (item: any) => item.key === catalogItem.module_key
          )?.reason,
          500
        ) ||
        (enabled ? "Included for this app." : "Not needed for this app."),
    };
  });

  const ownerRequestLower = clean(ownerRequest, 3000).toLowerCase();
  const existingOfferKeys = new Set(
    safeArray(existingOffers)
      .map(safeOffer)
      .filter((item: any) => item.title && item.body)
      .map(
        (item: any) =>
          `${item.title.toLowerCase()}|${item.body.toLowerCase()}|${item.terms.toLowerCase()}|${item.startDate}|${item.endDate}`
      )
  );
  const offers = safeArray(plan?.offers)
    .map(safeOffer)
    .filter((item: any) => item.title && item.body)
    .filter((item: any) => {
      const key = `${item.title.toLowerCase()}|${item.body.toLowerCase()}|${item.terms.toLowerCase()}|${item.startDate}|${item.endDate}`;
      if (existingOfferKeys.has(key)) return true;
      const parts = [item.title, item.body, item.terms]
        .map((value) => clean(value, 900).toLowerCase())
        .filter(Boolean);
      return (
        ownerRequestLower &&
        parts.length >= 2 &&
        parts.every((part) => ownerRequestLower.includes(part))
      );
    })
    .slice(0, 4);

  // Offers must contain explicit content. BUSY never publishes an empty or
  // invented promotion merely because the owner mentioned "offers".
  const offerModule = modules.find((item: any) => item.key === "offers");
  if (offerModule && !offers.length) offerModule.enabled = false;

  const requestedLoyalty = safeLoyalty(plan?.loyalty || {});
  const savedLoyalty = safeLoyalty(existingLoyalty || {});
  const loyaltyRewardSupported =
    requestedLoyalty.reward &&
    (
      (loyaltyReady(savedLoyalty) &&
        requestedLoyalty.targetStamps === savedLoyalty.targetStamps &&
        requestedLoyalty.reward.toLowerCase() === savedLoyalty.reward.toLowerCase()) ||
      (
        ownerRequestLower.includes(String(requestedLoyalty.targetStamps)) &&
        ownerRequestLower.includes(requestedLoyalty.reward.toLowerCase())
      )
    );
  const loyalty =
    requestedLoyalty.enabled &&
    requestedLoyalty.targetStamps >= 2 &&
    requestedLoyalty.targetStamps <= 20 &&
    loyaltyRewardSupported
      ? requestedLoyalty
      : savedLoyalty;

  const loyaltyModule = modules.find((item: any) => item.key === "loyalty");
  if (loyaltyModule) {
    loyaltyModule.enabled =
      loyaltyReady(loyalty) &&
      (
        requestedModules.get("loyalty")?.enabled === true ||
        fallback?.modules?.find((item: any) => item.key === "loyalty")?.enabled === true
      );
  }

  const unsupportedRequests = safeArray(plan?.unsupportedRequests)
    .map((item: any) => ({
      request: clean(item?.request, 180),
      reason: clean(item?.reason, 600),
    }))
    .filter((item: any) => item.request && item.reason)
    .slice(0, 6);

  // Any model attempt to enable a planned/unknown module is surfaced as an
  // unsupported request rather than silently expanding the trusted platform.
  for (const [key, requested] of requestedModules.entries()) {
    const catalogItem: any = catalogByKey.get(key);
    if (
      requested?.enabled === true &&
      (!catalogItem || catalogItem.status !== "available")
    ) {
      unsupportedRequests.push({
        request: clean(catalogItem?.title || key, 180),
        reason: catalogItem
          ? "This reusable module is planned but is not available yet."
          : "That capability is outside the current tested BUSY module catalogue.",
      });
    }
  }

  const resolvedKeys = new Set<string>();
  if (offers.length) resolvedKeys.add("offers");
  if (loyaltyReady(loyalty)) resolvedKeys.add("loyalty");
  const missingFacts = safeArray(plan?.missingFacts)
    .map((item: any) => ({
      key: clean(item?.key, 80),
      question: clean(item?.question, 500),
    }))
    .filter(
      (item: any) =>
        item.key &&
        item.question &&
        !resolvedKeys.has(item.key)
    )
    .slice(0, 8);

  return {
    version: 2,
    summary: clean(plan?.summary, 900) || fallback.summary,
    modules,
    missingFacts,
    offers,
    loyalty,
    unsupportedRequests: unsupportedRequests.slice(0, 6),
    confidence: ["High", "Medium", "Low"].includes(plan?.confidence)
      ? plan.confidence
      : fallback.confidence,
    planner: clean(plan?.planner, 80) || "ai",
  };
}

async function aiAppPlan(
  ownerRequest: string,
  profile: any,
  catalog: any[],
  existingConfig: any = null
) {
  const fallback = fallbackAppPlan(
    ownerRequest,
    profile,
    catalog,
    existingConfig
  );
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey || !ownerRequest) return fallback;

  const catalogueSummary = catalog.map((item: any) => ({
    key: item.module_key,
    title: item.title,
    status: item.status,
    description: item.description,
  }));
  const businessFacts = {
    businessName: profile?.businessName || "",
    businessType: profile?.businessType || "",
    serviceArea: profile?.serviceArea || "",
    serviceCount: safeArray(profile?.services).length,
    serviceNames: safeArray(profile?.services)
      .slice(0, 20)
      .map((item: any) => item.name),
    hasPhone: !!profile?.contact?.phone,
    hasEmail: !!profile?.contact?.email,
    approvedGalleryCount: safeArray(profile?.assets?.gallery).length,
    existingApprovedOffers: safeArray(existingConfig?.offers)
      .map(safeOffer)
      .filter((item: any) => item.title && item.body),
    existingLoyalty: safeLoyalty(existingConfig?.loyalty || {}),
    existingEnabledModules: safeArray(existingConfig?.modules)
      .filter((item: any) => item?.enabled)
      .map((item: any) => clean(item?.key, 80)),
  };

  const prompt = `You are the controlled BUSY DOES IT business-app planner.

Owner request:
"${ownerRequest}"

Recorded business facts:
${JSON.stringify(businessFacts)}

Trusted module catalogue:
${JSON.stringify(catalogueSummary)}

Return a conservative app plan. Rules:
- Only recommend modules in the supplied catalogue.
- business_profile must always be enabled.
- Never enable a module whose status is not "available".
- If an existing app draft is present, preserve existingEnabledModules unless the owner explicitly asks to remove/change one. Treat short edit requests as incremental rather than as permission to rebuild the whole app from scratch.
- Reuse recorded business facts; never invent services, contact details, photos, prices, offers, discounts, terms, opening hours or business claims.
- Enable enquiry when the owner wants leads, messages, quotes or contact forms.
- Enable booking_request when the owner wants customers to request dates/services. It remains request-only; never imply automatic booking confirmation.
- Enable gallery only when approved images exist or the owner explicitly asks for it. If requested but no approved images exist, add one targeted missingFacts question.
- Enable contact only when contact details exist or the owner asks for contact; if requested but missing, ask one targeted question.
- Enable services when recorded services exist or the owner explicitly asks for services; ask one targeted question when needed.
- Offers may be enabled ONLY when a specific offer is already recorded or the owner's current request itself states the actual offer. Do not invent a discount. If the owner asks for offers generically, ask for the exact offer instead. startDate/endDate are optional ISO YYYY-MM-DD fields; leave them empty unless explicitly supported.
- Loyalty is now an available simple stamp/visit module. Enable it only when the owner has supplied a target between 2 and 20 and an explicit reward, or an existingLoyalty program already contains them. It is owner-recorded progress, not an automatic points economy. If details are missing, ask ONE targeted missingFacts question and keep loyalty disabled.
- Payments remain planned. If requested, keep payments disabled and put it in unsupportedRequests with a plain-English reason.
- missingFacts should contain only information materially needed for requested modules; avoid a giant questionnaire.
- Explain why each module is included/excluded in short owner-friendly language.
- offers must contain only offer wording explicitly supported by the owner request or existingApprovedOffers.
- loyalty.reward and loyalty.targetStamps must be directly supported by the owner request or existingLoyalty. Never invent a reward.
- For any NEW offer, copy the offer title/body/terms exactly from phrases present in the owner's current request; do not paraphrase or expand them. If the exact offer cannot be represented without adding words or assumptions, leave offers empty and ask a missingFacts question instead.
`;

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          Deno.env.get("OPENAI_APP_PLANNER_MODEL") ||
          DEFAULT_APP_PLANNER_MODEL,
        reasoning: { effort: "low" },
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "busy_business_app_plan",
            strict: true,
            schema: appPlanSchema,
          },
        },
        max_output_tokens: 1800,
        store: false,
      }),
    });
    const payload: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error("Planner unavailable.");
    const outputText =
      typeof payload?.output_text === "string"
        ? payload.output_text
        : Array.isArray(payload?.output)
        ? payload.output
            .flatMap((item: any) =>
              Array.isArray(item?.content) ? item.content : []
            )
            .filter((item: any) => item?.type === "output_text")
            .map((item: any) => item.text || "")
            .join("")
        : "";
    const parsed = outputText ? JSON.parse(outputText) : null;
    return sanitiseAppPlan(
      { ...parsed, planner: "ai" },
      catalog,
      fallback,
      ownerRequest,
      businessFacts.existingApprovedOffers,
      businessFacts.existingLoyalty
    );
  } catch {
    return fallback;
  }
}

async function planBusinessApp(
  businessId: string,
  body: any
) {
  const [catalog, storedProfile, app] = await Promise.all([
    moduleCatalog(),
    publicProfileForBusiness(businessId),
    appForBusiness(businessId),
  ]);
  const supplied = sanitizePublicProfile(body?.profileDraft || {});
  const answers = cleanFactAnswers(body?.factAnswers || {});
  const sourceProfile = supplied.businessName
    ? supplied
    : sanitizePublicProfile(storedProfile?.profile || {});
  const profile = applyFactAnswersToProfile(sourceProfile, answers);
  if (!profile.businessName) {
    throw new Error(
      "BUSY needs the approved business name before planning the app."
    );
  }
  const ownerRequest = clean(body?.ownerRequest, 3000);
  if (!ownerRequest) {
    throw new Error(
      "Tell BUSY what you want customers to be able to do in your app."
    );
  }
  const planned = await aiAppPlan(
    ownerRequestWithAnswers(ownerRequest, answers),
    profile,
    catalog,
    app?.draft_config || null
  );
  return {
    ...planned,
    ownerRequest,
    factAnswers: answers,
  };
}

async function applyBusinessAppPlan(
  userId: string,
  businessId: string,
  body: any
) {
  const [catalog, storedProfile, existingApp] = await Promise.all([
    moduleCatalog(),
    publicProfileForBusiness(businessId),
    appForBusiness(businessId),
  ]);
  const supplied = sanitizePublicProfile(body?.profileDraft || {});
  const answers = cleanFactAnswers(body?.factAnswers || {});
  const sourceProfile = supplied.businessName
    ? supplied
    : sanitizePublicProfile(storedProfile?.profile || {});
  const profile = applyFactAnswersToProfile(sourceProfile, answers);
  if (!profile.businessName) {
    throw new Error(
      "BUSY needs an approved public business name before building the app."
    );
  }

  const ownerRequest = clean(body?.ownerRequest, 3000);
  const planningRequest = ownerRequestWithAnswers(ownerRequest, answers);
  const fallback = fallbackAppPlan(
    planningRequest,
    profile,
    catalog,
    existingApp?.draft_config || null
  );
  const plan = sanitiseAppPlan(
    body?.plan || {},
    catalog,
    fallback,
    planningRequest,
    safeArray(existingApp?.draft_config?.offers),
    existingApp?.draft_config?.loyalty || null
  );
  const app = existingApp || (await ensureApp(businessId, userId, profile));
  const base = buildConfig(
    profile,
    catalog,
    Number(storedProfile?.revision || 0),
    app.draft_config
  );
  const planByKey = new Map(
    plan.modules.map((item: any) => [item.key, item])
  );
  const modules = safeArray(base.modules).map((item: any) => {
    const planned: any = planByKey.get(item.key);
    const enabled =
      item.key === "business_profile"
        ? true
        : item.status === "available" && planned?.enabled === true;
    return {
      ...item,
      enabled:
        item.key === "loyalty"
          ? enabled && loyaltyReady(plan.loyalty)
          : enabled,
    };
  });
  const config = {
    ...base,
    schemaVersion: 3,
    surface: "busy_business_app",
    builderPlan: {
      ...plan,
      ownerRequest,
      factAnswers: answers,
      generatedAt: new Date().toISOString(),
    },
    offers: plan.offers,
    loyalty: plan.loyalty,
    modules,
    navigation: modules
      .filter((item: any) => item.enabled)
      .map((item: any) => item.key),
  };

  const updated = await supabase
    .from("busy_mini_apps")
    .update({
      display_name: profile.businessName,
      category: profile.businessType,
      tagline: profile.tagline,
      status: app.current_live_version_id ? "update_pending" : "draft",
      draft_revision: Number(app.draft_revision || 1) + 1,
      draft_profile_revision: Number(storedProfile?.revision || 0),
      draft_config: config,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  return { app: updated.data, plan };
}

function changeSummary(previous: any, next: any) {
  const items: any[] = [];
  const add = (type: string, label: string) =>
    items.push({ type, label: clean(label, 240) });

  if (!previous) {
    add("added", "Created first BUSY Mini App");
  } else {
    if (clean(previous?.display?.name) !== clean(next?.display?.name)) {
      add("changed", "Business/app name");
    }
    if (
      clean(previous?.display?.tagline) !==
      clean(next?.display?.tagline)
    ) {
      add("changed", "Tagline");
    }
    const before = new Map(
      safeArray(previous?.modules).map((item: any) => [
        item.key,
        !!item.enabled,
      ])
    );
    for (const item of safeArray(next?.modules)) {
      const old = before.get(item.key);
      if (old === undefined && item.enabled) {
        add("added", item.title || item.key);
      } else if (old !== item.enabled) {
        add(
          item.enabled ? "added" : "removed",
          item.title || item.key
        );
      }
    }
  }

  const counts = {
    added: items.filter((item) => item.type === "added").length,
    removed: items.filter((item) => item.type === "removed").length,
    changed: items.filter((item) => item.type === "changed").length,
  };

  return {
    headline:
      items.length === 0
        ? "No material Mini App change"
        : items.length === 1
        ? items[0].label
        : `${items.length} Mini App changes`,
    items,
    counts,
  };
}

async function appForBusiness(businessId: string) {
  const result = await supabase
    .from("busy_mini_apps")
    .select("*")
    .eq("business_id", businessId)
    .eq("app_key", "main")
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data || null;
}

async function ensureApp(
  businessId: string,
  userId: string,
  profile: any
) {
  const existing = await appForBusiness(businessId);
  if (existing) return existing;

  const base = slugify(profile?.businessName || "business");
  const suffix = businessId.replaceAll("-", "").slice(0, 8);
  const publicSlug = `${base}-${suffix}`.slice(0, 80);
  const created = await supabase
    .from("busy_mini_apps")
    .insert({
      business_id: businessId,
      app_key: "main",
      public_slug: publicSlug,
      display_name: clean(profile?.businessName, 240),
      category: clean(profile?.businessType, 240),
      tagline: clean(profile?.tagline, 400),
      created_by: userId,
    })
    .select("*")
    .single();
  if (!created.error) return created.data;

  if (created.error.code === "23505") {
    const raced = await appForBusiness(businessId);
    if (raced) return raced;
  }
  throw created.error;
}

async function ownerStatus(businessId: string) {
  const [app, catalog, profile] = await Promise.all([
    appForBusiness(businessId),
    moduleCatalog(),
    publicProfileForBusiness(businessId),
  ]);
  if (!app) {
    return {
      app: null,
      versions: [],
      requests: [],
      requestLinks: [],
      requestCount30: 0,
      guestRequestCount30: 0,
      entrySummary: [],
      catalog,
      publicProfile: profile,
    };
  }

  const entrySince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [versions, requests, requestLinks, entrySummary, requestCount30, guestRequestCount30] = await Promise.all([
    supabase
      .from("busy_mini_app_versions")
      .select(
        "id,version_no,source_profile_revision,source_draft_revision,config_hash,state,change_label,change_summary,public_web_storage_path,public_web_artifact_bytes,public_web_published_at,created_at,prepared_at,published_at"
      )
      .eq("mini_app_id", app.id)
      .order("version_no", { ascending: false })
      .limit(12),
    supabase
      .from("busy_mini_app_requests")
      .select(
        "id,version_id,module_key,request_type,status,payload,consumer_user_id,contact_name,contact_email,contact_phone,service_name,preferred_date_text,request_origin,identity_assurance,guest_proof_verified_at,business_unread_count,customer_unread_count,last_business_read_at,last_customer_read_at,created_at,updated_at"
      )
      .eq("mini_app_id", app.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("busy_mini_app_request_links")
      .select("request_id,customer_record_id,action_record_id,bridge_state,linked_at,updated_at,metadata")
      .eq("business_id", businessId)
      .order("linked_at", { ascending: false })
      .limit(100),
    supabase.rpc("busy_mini_app_entry_summary", {
      p_business_id: businessId,
      p_mini_app_id: app.id,
      p_since: entrySince,
    }),
    supabase
      .from("busy_mini_app_requests")
      .select("id", { count: "exact", head: true })
      .eq("mini_app_id", app.id)
      .gte("created_at", entrySince),
    supabase
      .from("busy_mini_app_requests")
      .select("id", { count: "exact", head: true })
      .eq("mini_app_id", app.id)
      .eq("request_origin", "guest_web")
      .gte("created_at", entrySince),
  ]);
  if (versions.error) throw versions.error;
  if (requests.error) throw requests.error;
  if (requestLinks.error) throw requestLinks.error;
  if (entrySummary.error) throw entrySummary.error;
  if (requestCount30.error) throw requestCount30.error;
  if (guestRequestCount30.error) throw guestRequestCount30.error;
  return {
    app,
    versions: versions.data || [],
    requests: requests.data || [],
    requestLinks: requestLinks.data || [],
    entrySummary: entrySummary.data || [],
    requestCount30: Number(requestCount30.count || 0),
    guestRequestCount30: Number(guestRequestCount30.count || 0),
    catalog,
    publicProfile: profile,
  };
}

async function buildDraft(
  userId: string,
  businessId: string,
  body: any
) {
  const catalog = await moduleCatalog();
  const storedProfile = await publicProfileForBusiness(businessId);
  const supplied = sanitizePublicProfile(body?.profileDraft || {});
  const profile =
    supplied.businessName
      ? supplied
      : sanitizePublicProfile(storedProfile?.profile || {});

  if (!profile.businessName) {
    throw new Error(
      "BUSY needs an approved public business name before building a Mini App."
    );
  }

  const app = await ensureApp(businessId, userId, profile);
  const config = buildConfig(
    profile,
    catalog,
    Number(storedProfile?.revision || 0),
    app.draft_config
  );
  const updated = await supabase
    .from("busy_mini_apps")
    .update({
      display_name: profile.businessName,
      category: profile.businessType,
      tagline: profile.tagline,
      status: app.current_live_version_id ? "update_pending" : "draft",
      draft_revision: Number(app.draft_revision || 1) + 1,
      draft_profile_revision: Number(storedProfile?.revision || 0),
      draft_config: config,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  return {
    app: updated.data,
    source: storedProfile ? "shared_public_profile_plus_owner_draft" : "owner_public_draft",
  };
}

async function setModule(
  businessId: string,
  moduleKey: string,
  enabled: boolean
) {
  const [app, catalog] = await Promise.all([
    appForBusiness(businessId),
    moduleCatalog(),
  ]);
  if (!app) throw new Error("Build the Business App draft first.");

  const module = catalog.find(
    (item: any) => item.module_key === moduleKey
  );
  if (!module) throw new Error("That Business App module is not supported.");
  if (module.status !== "available" && enabled) {
    throw new Error(`${module.title} is planned but is not available yet.`);
  }
  if (moduleKey === "business_profile" && !enabled) {
    throw new Error("The Business profile module is required.");
  }

  const config = {
    ...(app.draft_config || {}),
    modules: safeArray(app.draft_config?.modules).map((item: any) =>
      item.key === moduleKey ? { ...item, enabled } : item
    ),
  };
  config.navigation = safeArray(config.modules)
    .filter((item: any) => item.enabled)
    .map((item: any) => item.key);

  const updated = await supabase
    .from("busy_mini_apps")
    .update({
      draft_config: config,
      draft_revision: Number(app.draft_revision || 1) + 1,
      status: app.current_live_version_id ? "update_pending" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  return updated.data;
}

async function preparePreview(
  userId: string,
  businessId: string
) {
  const app = await appForBusiness(businessId);
  if (!app) throw new Error("Build the Business App draft first.");
  const config = app.draft_config || {};
  if (!safeArray(config?.modules).some((item: any) => item.enabled)) {
    throw new Error("Enable at least one Business App module.");
  }

  const hash = await sha256(config);
  const existing = await supabase
    .from("busy_mini_app_versions")
    .select("*")
    .eq("mini_app_id", app.id)
    .eq("config_hash", hash)
    .maybeSingle();
  if (existing.error) throw existing.error;

  let version = existing.data;
  if (!version) {
    let previous: any = null;
    if (app.current_live_version_id) {
      const live = await supabase
        .from("busy_mini_app_versions")
        .select("config")
        .eq("id", app.current_live_version_id)
        .maybeSingle();
      if (live.error) throw live.error;
      previous = live.data?.config || null;
    }

    const allocated = await supabase.rpc(
      "busy_allocate_mini_app_version",
      { p_mini_app_id: app.id }
    );
    if (allocated.error) throw allocated.error;
    const changes = changeSummary(previous, config);
    const inserted = await supabase
      .from("busy_mini_app_versions")
      .insert({
        business_id: businessId,
        mini_app_id: app.id,
        version_no: Number(allocated.data) || 1,
        source_profile_revision: Number(app.draft_profile_revision || 0),
        source_draft_revision: Number(app.draft_revision || 1),
        config,
        config_hash: hash,
        state: "preview_ready",
        change_label: changes.headline,
        change_summary: changes,
        created_by: userId,
      })
      .select("*")
      .single();
    if (inserted.error) {
      if (inserted.error.code === "23505") {
        const raced = await supabase
          .from("busy_mini_app_versions")
          .select("*")
          .eq("mini_app_id", app.id)
          .eq("config_hash", hash)
          .maybeSingle();
        if (raced.error || !raced.data) throw inserted.error;
        version = raced.data;
      } else {
        throw inserted.error;
      }
    } else {
      version = inserted.data;
    }
  }

  const saved = await supabase
    .from("busy_mini_apps")
    .update({
      current_preview_version_id: version.id,
      status: app.current_live_version_id ? "update_pending" : "preview_ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (saved.error) throw saved.error;

  return {
    reused: !!existing.data,
    app: saved.data,
    version,
  };
}

async function syncSharedPublicProfile(
  userId: string,
  businessId: string,
  version: any,
  status: "live" | "draft" = "live"
) {
  const profile = sanitizePublicProfile(version?.config?.publicProfile || {});
  if (!profile.businessName) return null;

  const existing = await publicProfileForBusiness(businessId);
  const nextRevision = Math.max(
    Number(existing?.revision || 0) + 1,
    Number(version?.source_profile_revision || 0) + 1,
    1
  );

  if (existing) {
    const updated = await supabase
      .from("busy_public_business_profiles")
      .update({
        display_name: profile.businessName,
        status,
        revision: nextRevision,
        profile,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", businessId)
      .select("*")
      .single();
    if (updated.error) throw updated.error;
    return updated.data;
  }

  const inserted = await supabase
    .from("busy_public_business_profiles")
    .insert({
      business_id: businessId,
      public_slug: `${slugify(profile.businessName)}-${businessId.replaceAll("-", "").slice(0, 8)}`.slice(0, 80),
      display_name: profile.businessName,
      status,
      revision: nextRevision,
      profile,
      updated_by: userId,
    })
    .select("*")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data;
}

function escapeHtml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeHttps(value: unknown) {
  const url = clean(value, 2000);
  return /^https:\/\//i.test(url) ? url : "";
}

function safeCssColor(value: unknown, fallback: string) {
  const color = clean(value, 30);
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : fallback;
}

function publicMiniAppWebHtml(app: any, version: any) {
  const config = version?.config || {};
  const profile = sanitizePublicProfile(config?.publicProfile || {});
  const display = config?.display || {};
  const enabled = new Set(
    safeArray(config?.modules)
      .filter((item: any) => item?.enabled)
      .map((item: any) => clean(item?.key, 80))
  );

  const name = clean(display?.name || profile.businessName || app?.display_name, 240) || "Business";
  const category = clean(display?.category || profile.businessType || app?.category, 240);
  const tagline = clean(display?.tagline || profile.tagline || app?.tagline, 500);
  const description = clean(profile.description || profile.about, 2500);
  const about = clean(profile.about || profile.description, 2500);
  const serviceArea = clean(profile.serviceArea, 500);
  const services = safeArray(profile.services).slice(0, 50);
  const gallery = safeArray(profile?.assets?.gallery)
    .map((asset: any) => ({ ...asset, uri: safeHttps(asset?.uri) }))
    .filter((asset: any) => asset.uri)
    .slice(0, 18);
  const hero = safeHttps(profile?.assets?.hero?.uri);
  const phone = clean(profile?.contact?.phone, 120);
  const email = clean(profile?.contact?.email, 240);
  const openingHours = clean(profile?.contact?.openingHours, 700);
  const facebook = safeHttps(profile?.contact?.social?.facebook);
  const instagram = safeHttps(profile?.contact?.social?.instagram);
  const primary = safeCssColor(profile?.theme?.primary, "#245fd6");
  const secondary = safeCssColor(profile?.theme?.secondary, "#eef4ff");
  const slug = clean(app?.public_slug, 100);
  const actionUrl = (intent: string) =>
    `${MINI_APP_LINK_URL}?slug=${encodeURIComponent(slug)}&source=web&intent=${encodeURIComponent(intent)}`;

  const servicesHtml = enabled.has("services")
    ? services.length
      ? `<section id="services"><div class="wrap"><p class="eyebrow">Services</p><h2>What we do</h2><div class="grid">${services
          .map((service: any) => `<article><h3>${escapeHtml(service?.name || "Service")}</h3>${clean(service?.description, 1500) ? `<p>${escapeHtml(service.description)}</p>` : ""}</article>`)
          .join("")}</div></div></section>`
      : `<section id="services"><div class="wrap"><p class="eyebrow">Services</p><h2>Services</h2><p>No public services are listed yet.</p></div></section>`
    : "";

  const galleryHtml = enabled.has("gallery") && gallery.length
    ? `<section id="gallery"><div class="wrap"><p class="eyebrow">Gallery</p><h2>Recent work</h2><div class="gallery">${gallery
        .map((asset: any) => `<img loading="lazy" src="${escapeHtml(asset.uri)}" alt="${escapeHtml(name)}" />`)
        .join("")}</div></div></section>`
    : "";

  const contactItems = [
    phone ? `<a class="contact" href="tel:${escapeHtml(phone.replace(/[^+0-9]/g, ""))}">Call ${escapeHtml(phone)}</a>` : "",
    email ? `<a class="contact" href="mailto:${escapeHtml(email)}">Email ${escapeHtml(email)}</a>` : "",
    facebook ? `<a class="contact" href="${escapeHtml(facebook)}" rel="noopener noreferrer">Facebook</a>` : "",
    instagram ? `<a class="contact" href="${escapeHtml(instagram)}" rel="noopener noreferrer">Instagram</a>` : "",
  ].filter(Boolean).join("");

  const contactHtml = enabled.has("contact") && (contactItems || openingHours)
    ? `<section id="contact"><div class="wrap"><p class="eyebrow">Contact</p><h2>Get in touch</h2>${openingHours ? `<p>${escapeHtml(openingHours)}</p>` : ""}<div class="contacts">${contactItems}</div></div></section>`
    : "";

  const serviceListHtml = services
    .map(
      (service: any) =>
        `<option value="${escapeHtml(service?.name || "")}"></option>`
    )
    .join("");

  const guestForms: string[] = [];
  if (enabled.has("enquiry")) {
    guestForms.push(`
      <form class="request-form" data-request-type="enquiry" novalidate>
        <h3>Send an enquiry</h3>
        <p class="form-note">No BUSY account needed. BUSY performs a short one-time browser check before sending.</p>
        <div class="form-grid">
          <label><span>Name</span><input name="name" maxlength="160" autocomplete="name" required></label>
          <label><span>Email</span><input name="email" type="email" maxlength="240" autocomplete="email" placeholder="you@example.com"></label>
          <label><span>Phone</span><input name="phone" type="tel" maxlength="80" autocomplete="tel" placeholder="Phone number"></label>
        </div>
        <label><span>Service (optional)</span><input name="service" maxlength="240" list="busy-service-list" placeholder="What is this about?"></label>
        <label><span>Message</span><textarea name="message" maxlength="5000" rows="5" required placeholder="What would you like to ask?"></textarea></label>
        <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        <p class="trust-note">Use either email or phone so the business can respond. Contact details are supplied by you; the one-time check verifies the browser request, not ownership of the contact details.</p>
        <button class="button request-submit" type="submit">Send enquiry</button>
        <p class="form-status" aria-live="polite"></p>
      </form>`);
  }
  if (enabled.has("booking_request")) {
    guestForms.push(`
      <form class="request-form" data-request-type="booking_request" novalidate>
        <h3>Request a booking</h3>
        <p class="form-note">Tell the business what you need. This is a request only — no diary slot is confirmed until the business accepts it.</p>
        <div class="form-grid">
          <label><span>Name</span><input name="name" maxlength="160" autocomplete="name" required></label>
          <label><span>Email</span><input name="email" type="email" maxlength="240" autocomplete="email" placeholder="you@example.com"></label>
          <label><span>Phone</span><input name="phone" type="tel" maxlength="80" autocomplete="tel" placeholder="Phone number"></label>
        </div>
        <label><span>Service</span><input name="service" maxlength="240" list="busy-service-list" required placeholder="Which service do you want?"></label>
        <label><span>Preferred date or time</span><input name="preferredDate" maxlength="240" placeholder="e.g. Friday afternoon"></label>
        <label><span>Anything else?</span><textarea name="note" maxlength="3000" rows="4" placeholder="Anything the business should know"></textarea></label>
        <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
        <p class="trust-note">Use either email or phone so the business can respond. Contact details are supplied by you; the one-time check verifies the browser request, not ownership of the contact details.</p>
        <button class="button request-submit" type="submit">Send booking request</button>
        <p class="form-status" aria-live="polite"></p>
      </form>`);
  }

  const actionHtml = guestForms.length
    ? `<section id="actions"><div class="wrap action-box">
        <p class="eyebrow">Contact this business</p>
        <h2>Send a request without installing BUSY</h2>
        <p>Choose the form you need. BUSY uses a short-lived browser challenge and rate limits to reduce automated spam, while the business still receives the request in its normal BUSY workflow.</p>
        <datalist id="busy-service-list">${serviceListHtml}</datalist>
        <div class="request-stack">${guestForms.join("")}</div>
        <div id="guest-receipt" class="receipt" hidden>
          <p class="eyebrow">Request receipt</p>
          <h3 id="guest-receipt-title">Request sent</h3>
          <p id="guest-receipt-copy"></p>
          <div class="actions">
            <button id="guest-status-refresh" class="button secondary" type="button">Check latest status</button>
            <a class="button secondary" href="${escapeHtml(actionUrl("open"))}">Open this business in BUSY</a>
          </div>
          <p class="trust-note">This receipt is stored only in this browser. Keep the page or return on the same browser to check the latest request status.</p>
        </div>
      </div></section>`
    : "";

  const approvedOffers = safeArray(config?.offers)
    .map(safeOffer)
    .filter((item: any) => item.title && item.body)
    .slice(0, 4);
  const offersHtml = enabled.has("offers")
    ? approvedOffers.length
      ? `<section id="offers"><div class="wrap"><p class="eyebrow">Offers</p><h2>Current offers</h2><div class="grid" id="busy-offer-grid">${approvedOffers
          .map(
            (offer: any) =>
              `<article class="busy-offer" data-start="${escapeHtml(
                offer.startDate
              )}" data-end="${escapeHtml(offer.endDate)}"><h3>${escapeHtml(
                offer.title
              )}</h3><p>${escapeHtml(offer.body)}</p>${
                offer.terms
                  ? `<p class="muted">${escapeHtml(offer.terms)}</p>`
                  : ""
              }${
                offer.startDate || offer.endDate
                  ? `<p class="muted">${escapeHtml(
                      [
                        offer.startDate ? `Starts ${offer.startDate}` : "",
                        offer.endDate ? `Ends ${offer.endDate}` : "",
                      ]
                        .filter(Boolean)
                        .join(" • ")
                    )}</p>`
                  : ""
              }</article>`
          )
          .join("")}</div><p id="busy-no-active-offers" class="muted" hidden>No offer is active today.</p><script>(function(){var today=new Date().toISOString().slice(0,10);var cards=[].slice.call(document.querySelectorAll(".busy-offer"));var shown=0;cards.forEach(function(card){var start=card.getAttribute("data-start")||"";var end=card.getAttribute("data-end")||"";var active=(!start||today>=start)&&(!end||today<=end);card.hidden=!active;if(active)shown+=1;});var empty=document.getElementById("busy-no-active-offers");if(empty)empty.hidden=shown>0;})();</script></div></section>`
      : `<section id="offers"><div class="wrap"><p class="eyebrow">Offers</p><h2>Offers</h2><p>No approved public offer is currently published.</p></div></section>`
    : "";

  const loyalty = safeLoyalty(config?.loyalty || {});
  const loyaltyHtml =
    enabled.has("loyalty") && loyaltyReady(loyalty)
      ? `<section id="loyalty"><div class="wrap"><p class="eyebrow">Loyalty</p><h2>${escapeHtml(
          loyalty.programName || "Loyalty rewards"
        )}</h2><p>Collect ${loyalty.targetStamps} stamps or visits to earn: <strong>${escapeHtml(
          loyalty.reward
        )}</strong>.</p>${
          loyalty.terms
            ? `<p class="muted">${escapeHtml(loyalty.terms)}</p>`
            : ""
        }<p class="muted">Open this business in BUSY to see your signed-in loyalty progress. The business records stamps after eligible visits or jobs.</p></div></section>`
      : "";

  const heroHtml = hero ? `<img class="hero-image" src="${escapeHtml(hero)}" alt="${escapeHtml(name)}" />` : "";
  const aboutHtml = enabled.has("business_profile")
    ? `<section id="about"><div class="wrap"><p class="eyebrow">About</p><h2>${escapeHtml(name)}</h2>${about ? `<p>${escapeHtml(about)}</p>` : ""}${serviceArea ? `<p class="muted">Service area: ${escapeHtml(serviceArea)}</p>` : ""}</div></section>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="${escapeHtml(primary)}">
  <meta name="description" content="${escapeHtml(tagline || description || name)}">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' https: data:; connect-src https://qgkmuiipicazmcxxmoxv.supabase.co; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'; object-src 'none'">
  <meta name="busy-mini-app-version" content="${escapeHtml(String(version?.id || ""))}">
  <title>${escapeHtml(name)} • BUSY DOES IT</title>
  <style>
    :root{--brand:${primary};--soft:${secondary};--ink:#172033;--muted:#637083;--line:#e3e8f0;--card:#fff}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f6f8fb;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55}
    .wrap{max-width:760px;margin:0 auto;padding:34px 20px}.hero{background:linear-gradient(160deg,var(--soft),#fff);padding-top:max(28px,env(safe-area-inset-top))}.brand{font-size:12px;font-weight:850;letter-spacing:.12em}.eyebrow{font-size:13px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--brand);margin:0 0 8px}
    h1{font-size:clamp(2.2rem,10vw,4rem);line-height:1.02;margin:12px 0}h2{font-size:clamp(1.7rem,7vw,2.5rem);line-height:1.12;margin:8px 0 14px}h3{margin:0 0 8px}.lead{font-size:1.08rem}.muted{color:var(--muted)}
    .hero-image{width:100%;max-height:430px;object-fit:cover;border-radius:24px;margin-top:22px;box-shadow:0 18px 40px rgba(19,31,55,.12)}section{background:#fff;border-top:1px solid var(--line)}section:nth-of-type(even){background:#fafbfd}
    .grid{display:grid;gap:14px}.grid article{border:1px solid var(--line);border-radius:18px;padding:18px;background:var(--card)}.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.gallery img{width:100%;height:170px;object-fit:cover;border-radius:15px}
    .contacts,.actions{display:flex;gap:10px;flex-wrap:wrap}.contact,.button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 17px;border-radius:14px;text-decoration:none;font-weight:750}.contact{border:1px solid var(--line);color:var(--ink);background:#fff}.button{background:var(--brand);color:#fff}.button.secondary{background:#fff;color:var(--brand);border:2px solid var(--brand)}
    .hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.browse-note{display:inline-block;margin-top:12px;padding:8px 11px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:13px;color:var(--muted)}.action-box{padding-top:40px;padding-bottom:44px}.request-stack{display:grid;gap:18px;margin-top:22px}.request-form{border:1px solid var(--line);background:#fff;border-radius:20px;padding:20px;box-shadow:0 10px 30px rgba(19,31,55,.06)}.request-form label{display:block;margin:13px 0;font-weight:700}.request-form label span{display:block;margin-bottom:6px;font-size:14px}.request-form input,.request-form textarea{width:100%;border:1px solid #cfd7e3;border-radius:12px;padding:13px 12px;font:inherit;color:var(--ink);background:#fff}.request-form input:focus,.request-form textarea:focus{outline:3px solid color-mix(in srgb,var(--brand) 18%,transparent);border-color:var(--brand)}.form-grid{display:grid;gap:0}.form-note,.trust-note,.form-status{color:var(--muted);font-size:14px}.form-status{min-height:22px;margin-bottom:0}.form-status.error{color:#a12f2f}.form-status.success{color:#187348;font-weight:700}.request-submit{border:0;cursor:pointer}.request-submit[disabled]{opacity:.58;cursor:wait}.hp{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}.receipt{margin-top:22px;border:1px solid #b9dfc8;background:#f2fbf5;border-radius:20px;padding:20px}.receipt[hidden]{display:none}.receipt-status{font-weight:750}.spinner{display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;vertical-align:-2px;margin-right:7px;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}footer{padding:28px 20px 42px;text-align:center;color:var(--muted);font-size:13px}
    @media(min-width:620px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gallery{grid-template-columns:repeat(3,minmax(0,1fr))}.gallery img{height:210px}.wrap{padding:50px 28px}.form-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px}}
  </style>
</head>
<body>
  <header class="hero"><div class="wrap"><div class="brand">BUSY DOES IT</div>${category ? `<p class="eyebrow" style="margin-top:22px">${escapeHtml(category)}</p>` : ""}<h1>${escapeHtml(name)}</h1>${tagline ? `<p class="lead">${escapeHtml(tagline)}</p>` : description ? `<p class="lead">${escapeHtml(description)}</p>` : ""}${serviceArea ? `<p class="muted">${escapeHtml(serviceArea)}</p>` : ""}${heroHtml}<div class="hero-actions"><a class="button" href="${escapeHtml(actionUrl("open"))}">Open in BUSY DOES IT</a></div><span class="browse-note">No app or sign-in needed to browse</span></div></header>
  ${aboutHtml}
  ${servicesHtml}
  ${galleryHtml}
  ${offersHtml}
  ${loyaltyHtml}
  ${contactHtml}
  ${actionHtml}
  <footer>Powered by <strong>BUSY DOES IT</strong> • Public information from the business's approved live Mini App.</footer>
  <script>
    (function () {
      "use strict";
      var BUSY_GUEST_URL = ${JSON.stringify(MINI_APP_GUEST_URL)};
      var BUSY_SLUG = ${JSON.stringify(slug)};
      var STORAGE_KEY = "busy-mini-app-guest:" + BUSY_SLUG;
      var query = new URLSearchParams(window.location.search || "");
      var ENTRY_SOURCE = ["qr","share","web"].indexOf(query.get("entry")) >= 0
        ? query.get("entry")
        : "web";

      function requestId(prefix) {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
          return prefix + "-" + window.crypto.randomUUID();
        }
        return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 12);
      }

      async function post(action, payload) {
        var response = await fetch(BUSY_GUEST_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-busy-request-id": requestId("guest")
          },
          body: JSON.stringify(Object.assign({ action: action }, payload || {}))
        });
        var data = await response.json().catch(function () { return {}; });
        if (!response.ok || data.ok === false) {
          throw new Error(data.error || "BUSY could not complete that request.");
        }
        return data;
      }

      async function digestHex(value) {
        var bytes = new TextEncoder().encode(value);
        var digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
        return Array.from(digest).map(function (item) {
          return item.toString(16).padStart(2, "0");
        }).join("");
      }

      async function solveProof(challenge) {
        if (!window.crypto || !window.crypto.subtle) {
          throw new Error("This browser cannot complete BUSY's guest verification.");
        }
        var prefix = "0".repeat(Math.max(2, Math.min(5, Number(challenge.difficulty || 3))));
        for (var solution = 0; solution <= 2000000; solution += 1) {
          var digest = await digestHex(
            challenge.seed + ":" + challenge.token + ":" + solution
          );
          if (digest.indexOf(prefix) === 0) return solution;
          if (solution > 0 && solution % 250 === 0) {
            await new Promise(function (resolve) { setTimeout(resolve, 0); });
          }
        }
        throw new Error("BUSY could not complete the guest verification. Please try again.");
      }

      function setFormStatus(form, message, tone, busy) {
        var status = form.querySelector(".form-status");
        var button = form.querySelector(".request-submit");
        if (status) {
          status.className = "form-status" + (tone ? " " + tone : "");
          status.textContent = message || "";
        }
        if (button) {
          button.disabled = !!busy;
        }
      }

      function safeReceipt() {
        try {
          var raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return null;
          var parsed = JSON.parse(raw);
          return parsed && parsed.requestId && parsed.guestAccessToken ? parsed : null;
        } catch (_) {
          return null;
        }
      }

      function saveReceipt(value) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
        } catch (_) {}
      }

      function statusCopy(request) {
        if (!request) return "";
        if (request.bookingConfirmed) {
          return "BUSY shows this booking as confirmed by the business.";
        }
        if (request.status === "reviewing") {
          return "The business is reviewing your request.";
        }
        if (request.status === "accepted") {
          return request.type === "booking_request"
            ? "The business has accepted the request. A booking is only confirmed when BUSY records the confirmed booking."
            : "The business has accepted your enquiry.";
        }
        if (request.status === "declined") {
          return "The business has declined this request.";
        }
        if (request.status === "closed") {
          return "This request is now closed.";
        }
        return request.type === "booking_request"
          ? "Your booking request has been sent. It is not a confirmed appointment yet."
          : "Your enquiry has been sent to the business.";
      }

      function showReceipt(receipt, request) {
        var box = document.getElementById("guest-receipt");
        var title = document.getElementById("guest-receipt-title");
        var copy = document.getElementById("guest-receipt-copy");
        if (!box || !receipt) return;
        box.hidden = false;
        if (title) {
          title.textContent =
            request && request.type === "booking_request"
              ? "Booking request received"
              : "Enquiry received";
        }
        if (copy) {
          var reference = receipt.requestId ? " Reference " + receipt.requestId.slice(0, 8) + "." : "";
          copy.textContent = statusCopy(request || receipt.request || null) + reference;
        }
      }

      async function refreshReceipt() {
        var receipt = safeReceipt();
        if (!receipt) return;
        var button = document.getElementById("guest-status-refresh");
        if (button) {
          button.disabled = true;
          button.textContent = "Checking…";
        }
        try {
          var data = await post("status", {
            requestId: receipt.requestId,
            guestAccessToken: receipt.guestAccessToken
          });
          receipt.request = data.request || receipt.request || null;
          saveReceipt(receipt);
          showReceipt(receipt, data.request || receipt.request || null);
        } catch (error) {
          var copy = document.getElementById("guest-receipt-copy");
          if (copy) copy.textContent = error.message || "BUSY could not check this receipt.";
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Check latest status";
          }
        }
      }

      Array.from(document.querySelectorAll(".request-form")).forEach(function (form) {
        form.addEventListener("submit", async function (event) {
          event.preventDefault();
          if (!form.reportValidity()) return;

          var formData = new FormData(form);
          var email = String(formData.get("email") || "").trim();
          var phone = String(formData.get("phone") || "").trim();
          if (!email && !phone) {
            setFormStatus(form, "Add an email address or phone number so the business can respond.", "error", false);
            return;
          }

          var requestType = String(form.getAttribute("data-request-type") || "");
          var payload = {
            name: String(formData.get("name") || "").trim(),
            email: email,
            phone: phone,
            service: String(formData.get("service") || "").trim(),
            preferredDate: String(formData.get("preferredDate") || "").trim(),
            note: String(formData.get("note") || "").trim(),
            message: String(formData.get("message") || "").trim()
          };

          setFormStatus(form, "Securing your request…", "", true);
          try {
            var challengeData = await post("challenge", {
              slug: BUSY_SLUG,
              requestType: requestType,
              source: ENTRY_SOURCE
            });
            var challenge = challengeData.challenge || {};
            var solution = await solveProof(challenge);
            setFormStatus(form, "Sending securely to the business…", "", true);

            var result = await post("submit", {
              slug: BUSY_SLUG,
              challengeId: challenge.challengeId,
              token: challenge.token,
              solution: solution,
              idempotencyKey: requestId("request"),
              website: String(formData.get("website") || ""),
              payload: payload
            });

            var receipt = {
              requestId: result.request && result.request.id ? result.request.id : "",
              guestAccessToken: result.guestAccessToken || "",
              request: result.request || null
            };
            if (!receipt.requestId || !receipt.guestAccessToken) {
              throw new Error("BUSY saved the request but could not create a browser receipt.");
            }
            saveReceipt(receipt);
            showReceipt(receipt, result.request || null);
            setFormStatus(
              form,
              requestType === "booking_request"
                ? "Booking request sent. This is not a confirmed appointment yet."
                : "Enquiry sent to the business.",
              "success",
              false
            );
            form.reset();
          } catch (error) {
            setFormStatus(
              form,
              error && error.message ? error.message : "BUSY could not send this request.",
              "error",
              false
            );
          }
        });
      });

      var refreshButton = document.getElementById("guest-status-refresh");
      if (refreshButton) refreshButton.addEventListener("click", refreshReceipt);

      var existing = safeReceipt();
      if (existing) {
        showReceipt(existing, existing.request || null);
        refreshReceipt();
      }
    })();
  </script>
</body>
</html>`;
}

async function ensureMiniAppPublicBucket() {
  const existing = await supabase.storage.getBucket(MINI_APP_PUBLIC_BUCKET);
  if (!existing.error && existing.data) return;
  const created = await supabase.storage.createBucket(MINI_APP_PUBLIC_BUCKET, {
    public: true,
    allowedMimeTypes: ["text/html"],
    fileSizeLimit: 2_000_000,
  });
  if (created.error && !/already exists|duplicate/i.test(created.error.message || "")) {
    throw created.error;
  }
}

async function uploadMiniAppHtml(path: string, html: string, cacheControl: string) {
  const result = await supabase.storage
    .from(MINI_APP_PUBLIC_BUCKET)
    .upload(path, new Blob([html], { type: "text/html" }), {
      contentType: "text/html",
      cacheControl,
      upsert: true,
    });
  if (result.error) throw result.error;
}

async function publishMiniAppWebArtifact(app: any, version: any) {
  await ensureMiniAppPublicBucket();
  const html = publicMiniAppWebHtml(app, version);
  const bytes = new TextEncoder().encode(html).byteLength;
  if (bytes > 1_500_000) throw new Error("The public Mini App web artifact is unexpectedly large.");

  const versionPath = `${app.business_id}/${app.id}/versions/${version.id}/index.html`;
  const livePath = `${app.business_id}/${app.id}/live/index.html`;
  await uploadMiniAppHtml(versionPath, html, "31536000");
  await uploadMiniAppHtml(livePath, html, "60");

  const liveUrl = supabase.storage
    .from(MINI_APP_PUBLIC_BUCKET)
    .getPublicUrl(livePath).data.publicUrl;
  const artifact = await supabase
    .from("busy_mini_app_versions")
    .update({
      public_web_storage_path: versionPath,
      public_web_artifact_bytes: bytes,
      public_web_published_at: new Date().toISOString(),
    })
    .eq("id", version.id)
    .eq("mini_app_id", app.id);
  if (artifact.error) throw artifact.error;

  return { liveUrl, versionPath, livePath, bytes };
}

async function publishVersion(
  userId: string,
  businessId: string,
  body: any
) {
  if (body?.ownerApproved !== true) {
    throw new Error("Owner approval is required before a Mini App becomes public.");
  }

  const app = await appForBusiness(businessId);
  if (!app) throw new Error("Build the Mini App first.");
  const versionId = clean(
    body?.versionId || app.current_preview_version_id,
    80
  );
  if (!versionId) throw new Error("Prepare a Business App preview first.");

  const version = await supabase
    .from("busy_mini_app_versions")
    .select("*")
    .eq("id", versionId)
    .eq("mini_app_id", app.id)
    .maybeSingle();
  if (version.error) throw version.error;
  if (!version.data) throw new Error("That Business App version was not found.");

  const webArtifact = await publishMiniAppWebArtifact(app, version.data);
  const now = new Date().toISOString();
  if (
    app.current_live_version_id &&
    app.current_live_version_id !== versionId
  ) {
    const old = await supabase
      .from("busy_mini_app_versions")
      .update({ state: "superseded" })
      .eq("id", app.current_live_version_id)
      .eq("mini_app_id", app.id);
    if (old.error) throw old.error;
  }

  const live = await supabase
    .from("busy_mini_app_versions")
    .update({
      state: "live",
      published_at: version.data.published_at || now,
    })
    .eq("id", versionId)
    .select("*")
    .single();
  if (live.error) throw live.error;

  const updated = await supabase
    .from("busy_mini_apps")
    .update({
      status: "live",
      current_preview_version_id: versionId,
      current_live_version_id: versionId,
      discoverable: body?.discoverable === true,
      public_web_url: webArtifact.liveUrl,
      public_web_version_id: versionId,
      public_web_status: "ready",
      public_web_schema_version: 3,
      public_web_updated_at: now,
      public_web_last_error: null,
      last_error: null,
      updated_at: now,
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;

  const publicProfile = await syncSharedPublicProfile(
    userId,
    businessId,
    live.data,
    "live"
  );

  return { app: updated.data, version: live.data, publicProfile };
}

async function rollbackVersion(
  userId: string,
  businessId: string,
  body: any
) {
  if (body?.ownerApproved !== true) {
    throw new Error("Owner approval is required before changing the live Mini App.");
  }
  const app = await appForBusiness(businessId);
  if (!app) throw new Error("Mini App not found.");

  const versionId = clean(body?.versionId, 80);
  const target = await supabase
    .from("busy_mini_app_versions")
    .select("*")
    .eq("id", versionId)
    .eq("mini_app_id", app.id)
    .not("published_at", "is", null)
    .maybeSingle();
  if (target.error) throw target.error;
  if (!target.data) throw new Error("That version has never been published.");

  const webArtifact = await publishMiniAppWebArtifact(app, target.data);
  const now = new Date().toISOString();
  if (app.current_live_version_id && app.current_live_version_id !== versionId) {
    await supabase
      .from("busy_mini_app_versions")
      .update({ state: "superseded" })
      .eq("id", app.current_live_version_id);
  }
  const promoted = await supabase
    .from("busy_mini_app_versions")
    .update({ state: "live" })
    .eq("id", versionId)
    .select("*")
    .single();
  if (promoted.error) throw promoted.error;

  const updated = await supabase
    .from("busy_mini_apps")
    .update({
      status: "live",
      current_live_version_id: versionId,
      current_preview_version_id: versionId,
      public_web_url: webArtifact.liveUrl,
      public_web_version_id: versionId,
      public_web_status: "ready",
      public_web_schema_version: 2,
      public_web_updated_at: now,
      public_web_last_error: null,
      updated_at: now,
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  const publicProfile = await syncSharedPublicProfile(
    userId,
    businessId,
    promoted.data,
    "live"
  );
  return { app: updated.data, version: promoted.data, publicProfile };
}

async function setDiscoverable(
  businessId: string,
  body: any
) {
  if (body?.ownerApproved !== true) {
    throw new Error("Owner approval is required before changing marketplace visibility.");
  }
  const app = await appForBusiness(businessId);
  if (!app?.current_live_version_id || app.status !== "live") {
    throw new Error("Publish a live Mini App before listing it in BUSY Apps.");
  }
  const updated = await supabase
    .from("busy_mini_apps")
    .update({
      discoverable: body?.discoverable === true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  return updated.data;
}

async function directorySearch(queryText = "") {
  let query = supabase
    .from("busy_mini_apps")
    .select(
      "id,business_id,public_slug,display_name,category,tagline,current_live_version_id,updated_at"
    )
    .eq("status", "live")
    .eq("discoverable", true)
    .order("display_name", { ascending: true })
    .limit(30);

  const q = clean(queryText, 100).replace(/[^a-z0-9 '&-]/gi, " ");
  if (q) {
    query = query.or(
      `display_name.ilike.%${q}%,category.ilike.%${q}%,tagline.ilike.%${q}%`
    );
  }

  const apps = await query;
  if (apps.error) throw apps.error;
  const rows = apps.data || [];
  if (!rows.length) return [];

  const businessIds = [...new Set(rows.map((item: any) => item.business_id))];
  const profiles = await supabase
    .from("busy_public_business_profiles")
    .select("business_id,display_name,status,revision,profile")
    .in("business_id", businessIds);
  if (profiles.error) throw profiles.error;
  const profileMap = new Map(
    (profiles.data || []).map((item: any) => [item.business_id, item])
  );

  return rows.map((app: any) => {
    const profile = profileMap.get(app.business_id) as any;
    const publicProfile = sanitizePublicProfile(profile?.profile || {});
    return {
      id: app.id,
      slug: app.public_slug,
      name: app.display_name,
      category: app.category,
      tagline: app.tagline,
      hero: publicProfile?.assets?.hero || null,
      serviceArea: publicProfile?.serviceArea || "",
      serviceCount: safeArray(publicProfile?.services).length,
      updatedAt: app.updated_at,
    };
  });
}

async function trackConsumerApp(
  userId: string,
  miniAppId: string,
  { action = false } = {}
) {
  if (!userId || !miniAppId) return;
  const now = new Date().toISOString();
  const existing = await supabase
    .from("busy_mini_app_consumer_apps")
    .select("id,first_opened_at,favorite")
    .eq("consumer_user_id", userId)
    .eq("mini_app_id", miniAppId)
    .maybeSingle();
  if (existing.error) throw existing.error;

  if (existing.data) {
    const updated = await supabase
      .from("busy_mini_app_consumer_apps")
      .update({
        last_opened_at: now,
        ...(action ? { last_action_at: now } : {}),
        updated_at: now,
      })
      .eq("id", existing.data.id);
    if (updated.error) throw updated.error;
    return;
  }

  const inserted = await supabase
    .from("busy_mini_app_consumer_apps")
    .insert({
      consumer_user_id: userId,
      mini_app_id: miniAppId,
      first_opened_at: now,
      last_opened_at: now,
      last_action_at: action ? now : null,
    });
  if (inserted.error && inserted.error.code !== "23505") throw inserted.error;
}

async function myBusyApps(userId: string) {
  const rows = await supabase
    .from("busy_mini_app_consumer_apps")
    .select("mini_app_id,first_opened_at,last_opened_at,last_action_at,favorite")
    .eq("consumer_user_id", userId)
    .order("favorite", { ascending: false })
    .order("last_opened_at", { ascending: false })
    .limit(50);
  if (rows.error) throw rows.error;
  const history = rows.data || [];
  if (!history.length) return [];

  const ids = history.map((item: any) => item.mini_app_id);
  const apps = await supabase
    .from("busy_mini_apps")
    .select("id,public_slug,display_name,category,tagline,status,discoverable,current_live_version_id")
    .in("id", ids);
  if (apps.error) throw apps.error;
  const map = new Map((apps.data || []).map((item: any) => [item.id, item]));

  return history
    .map((item: any) => {
      const app = map.get(item.mini_app_id) as any;
      if (!app?.current_live_version_id || app.status !== "live") return null;
      return {
        id: app.id,
        slug: app.public_slug,
        name: app.display_name,
        category: app.category,
        tagline: app.tagline,
        discoverable: !!app.discoverable,
        favorite: !!item.favorite,
        firstOpenedAt: item.first_opened_at,
        lastOpenedAt: item.last_opened_at,
        lastActionAt: item.last_action_at,
      };
    })
    .filter(Boolean);
}

async function myMiniAppRequests(userId: string) {
  const requests = await supabase
    .from("busy_mini_app_requests")
    .select("id,mini_app_id,request_type,status,contact_name,service_name,preferred_date_text,payload,customer_unread_count,last_customer_read_at,created_at,updated_at")
    .eq("consumer_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (requests.error) throw requests.error;
  const rows = requests.data || [];
  if (!rows.length) return [];

  const ids = [...new Set(rows.map((item: any) => item.mini_app_id))];
  const apps = await supabase
    .from("busy_mini_apps")
    .select("id,public_slug,display_name,category")
    .in("id", ids);
  if (apps.error) throw apps.error;
  const map = new Map((apps.data || []).map((item: any) => [item.id, item]));

  return rows.map((item: any) => {
    const app = map.get(item.mini_app_id) as any;
    return {
      ...item,
      app: app
        ? {
            slug: app.public_slug,
            name: app.display_name,
            category: app.category,
          }
        : null,
    };
  });
}


async function setConsumerFavorite(
  userId: string,
  slug: string,
  favorite: boolean
) {
  const app = await supabase
    .from("busy_mini_apps")
    .select("id,status,current_live_version_id")
    .eq("public_slug", slug)
    .maybeSingle();
  if (app.error) throw app.error;
  if (!app.data?.id || app.data.status !== "live" || !app.data.current_live_version_id) {
    throw new Error("That BUSY Mini App is not currently live.");
  }
  await trackConsumerApp(userId, app.data.id);
  const updated = await supabase
    .from("busy_mini_app_consumer_apps")
    .update({
      favorite,
      updated_at: new Date().toISOString(),
    })
    .eq("consumer_user_id", userId)
    .eq("mini_app_id", app.data.id);
  if (updated.error) throw updated.error;
  return { favorite };
}

const MINI_APP_ENTRY_SOURCES = new Set([
  "qr",
  "share",
  "web",
  "deep_link",
  "marketplace",
  "my_apps",
  "notification",
  "owner_test",
  "unknown",
]);

function miniAppEntrySource(value: unknown) {
  const source = clean(value, 40).toLowerCase();
  return MINI_APP_ENTRY_SOURCES.has(source) ? source : "unknown";
}

async function recordMiniAppEntry(app: any, _userId: string, source: string) {
  if (!app?.id || !app?.business_id) return;
  const recorded = await supabase.rpc("busy_mini_app_record_entry", {
    p_business_id: app.business_id,
    p_mini_app_id: app.id,
    p_source: miniAppEntrySource(source),
    p_stage: "app_open",
  });
  if (recorded.error) {
    console.error("BUSY Mini App entry attribution failed", recorded.error.message);
  }
}

async function loyaltyProgressFor(
  miniAppId: string,
  consumerUserId: string,
  config: any
) {
  const enabled = safeArray(config?.modules).some(
    (item: any) => item?.key === "loyalty" && item?.enabled
  );
  const loyalty = safeLoyalty(config?.loyalty || {});
  if (!enabled || !loyaltyReady(loyalty) || !consumerUserId) {
    return null;
  }

  const progress = await supabase
    .from("busy_mini_app_loyalty_progress")
    .select("stamps,last_awarded_at,updated_at")
    .eq("mini_app_id", miniAppId)
    .eq("consumer_user_id", consumerUserId)
    .maybeSingle();
  if (progress.error) throw progress.error;
  const stamps = Math.max(0, Number(progress.data?.stamps || 0));
  return {
    ...loyalty,
    stamps,
    remaining: Math.max(0, loyalty.targetStamps - stamps),
    rewardReached: stamps >= loyalty.targetStamps,
    lastAwardedAt: progress.data?.last_awarded_at || null,
  };
}

async function liveConfigForMiniApp(miniAppId: string) {
  const app = await supabase
    .from("busy_mini_apps")
    .select("id,business_id,current_live_version_id")
    .eq("id", miniAppId)
    .maybeSingle();
  if (app.error) throw app.error;
  if (!app.data?.current_live_version_id) return { app: app.data || null, config: null };
  const version = await supabase
    .from("busy_mini_app_versions")
    .select("config")
    .eq("id", app.data.current_live_version_id)
    .eq("mini_app_id", miniAppId)
    .maybeSingle();
  if (version.error) throw version.error;
  return { app: app.data, config: version.data?.config || null };
}

async function loyaltyForRequest(request: any) {
  if (!request?.mini_app_id || !request?.consumer_user_id) return null;
  const live = await liveConfigForMiniApp(request.mini_app_id);
  return await loyaltyProgressFor(
    request.mini_app_id,
    request.consumer_user_id,
    live.config
  );
}

async function appDetail(
  slug: string,
  userId = "",
  entrySource = "unknown",
  trackEntry = true
) {
  const app = await supabase
    .from("busy_mini_apps")
    .select("*")
    .eq("public_slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (app.error) throw app.error;
  if (!app.data?.current_live_version_id) {
    throw new Error("That BUSY Mini App is not currently available.");
  }
  const version = await supabase
    .from("busy_mini_app_versions")
    .select("id,version_no,config,published_at")
    .eq("id", app.data.current_live_version_id)
    .maybeSingle();
  if (version.error) throw version.error;
  if (!version.data) throw new Error("Live Business App version not found.");

  if (userId) await trackConsumerApp(userId, app.data.id);
  if (trackEntry) await recordMiniAppEntry(app.data, userId, entrySource);
  let favorite = false;
  if (userId) {
    const consumer = await supabase
      .from("busy_mini_app_consumer_apps")
      .select("favorite")
      .eq("consumer_user_id", userId)
      .eq("mini_app_id", app.data.id)
      .maybeSingle();
    if (consumer.error) throw consumer.error;
    favorite = !!consumer.data?.favorite;
  }

  const loyaltyProgress = userId
    ? await loyaltyProgressFor(app.data.id, userId, version.data.config)
    : null;

  return {
    app: {
      id: app.data.id,
      slug: app.data.public_slug,
      name: app.data.display_name,
      category: app.data.category,
      tagline: app.data.tagline,
      discoverable: !!app.data.discoverable,
      favorite,
    },
    version: version.data,
    loyaltyProgress,
  };
}

async function submitRequest(
  userId: string,
  body: any,
  requestId: string
) {
  const slug = clean(body?.slug, 100);
  const requestType = clean(body?.requestType, 40);
  if (!["booking_request", "enquiry"].includes(requestType)) {
    throw new Error("Unsupported Mini App request type.");
  }
  const detail = await appDetail(slug, userId, "unknown", false);
  const modules = safeArray(detail.version?.config?.modules);
  const moduleKey =
    requestType === "booking_request" ? "booking_request" : "enquiry";
  const module = modules.find((item: any) => item.key === moduleKey);
  if (!module?.enabled) {
    throw new Error("That action is not enabled in this Mini App.");
  }

  const rawPayload =
    body?.payload && typeof body.payload === "object" ? body.payload : {};
  const contactName = clean(rawPayload?.name || rawPayload?.contactName, 160);
  const contactEmail = clean(rawPayload?.email || rawPayload?.contactEmail, 240);
  const contactPhone = clean(rawPayload?.phone || rawPayload?.contactPhone, 80);
  const serviceName = clean(rawPayload?.service, 240);
  const preferredDateText = clean(rawPayload?.preferredDate, 240);
  const payload =
    requestType === "booking_request"
      ? {
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          service: serviceName,
          preferredDate: preferredDateText,
          note: clean(rawPayload?.note, 3000),
        }
      : {
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          service: serviceName,
          message: clean(rawPayload?.message, 5000),
        };

  if (!contactName) {
    throw new Error("Add your name before sending this request.");
  }
  if (!contactEmail && !contactPhone) {
    throw new Error("Add an email address or phone number so the business can respond.");
  }
  if (requestType === "booking_request" && !serviceName) {
    throw new Error("Choose or enter the service you want to request.");
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await supabase
    .from("busy_mini_app_requests")
    .select("id", { count: "exact", head: true })
    .eq("mini_app_id", detail.app.id)
    .eq("consumer_user_id", userId)
    .gte("created_at", since);
  if (recent.error) throw recent.error;
  if (Number(recent.count || 0) >= 10) {
    throw new Error("Too many Mini App requests. Try again later.");
  }

  if (requestId) {
    const existing = await supabase
      .from("busy_mini_app_requests")
      .select("*")
      .eq("mini_app_id", detail.app.id)
      .eq("consumer_user_id", userId)
      .eq("idempotency_key", requestId)
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return { reused: true, request: existing.data };
  }

  const appRow = await supabase
    .from("busy_mini_apps")
    .select("business_id")
    .eq("id", detail.app.id)
    .single();
  if (appRow.error) throw appRow.error;

  const inserted = await supabase
    .from("busy_mini_app_requests")
    .insert({
      business_id: appRow.data.business_id,
      mini_app_id: detail.app.id,
      version_id: detail.version.id,
      consumer_user_id: userId,
      module_key: moduleKey,
      request_type: requestType,
      payload,
      contact_name: contactName,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      service_name: serviceName || null,
      preferred_date_text: preferredDateText || null,
      request_origin: "signed_in",
      identity_assurance: "signed_in_account",
      business_unread_count: 1,
      customer_unread_count: 0,
      idempotency_key: requestId || null,
    })
    .select("*")
    .single();
  if (inserted.error) {
    if (inserted.error.code === "23505" && requestId) {
      const raced = await supabase
        .from("busy_mini_app_requests")
        .select("*")
        .eq("mini_app_id", detail.app.id)
        .eq("consumer_user_id", userId)
        .eq("idempotency_key", requestId)
        .maybeSingle();
      if (raced.error) throw raced.error;
      if (raced.data) return { reused: true, request: raced.data };
    }
    throw inserted.error;
  }

  const event = await supabase
    .from("busy_mini_app_request_events")
    .insert({
      business_id: appRow.data.business_id,
      request_id: inserted.data.id,
      actor_user_id: userId,
      event_type: "received",
      detail: { requestType, source: "busy_mini_app" },
    });
  if (event.error) throw event.error;

  await trackConsumerApp(userId, detail.app.id, { action: true });
  await notifyBusinessOfMiniAppRequest(
    inserted.data,
    requestType === "booking_request" ? "BUSY Apps • New booking request" : "BUSY Apps • New enquiry",
    "A customer sent a new request through your BUSY Mini App.",
    "received"
  );
  return { reused: false, request: inserted.data };
}

async function sendRequestMessage(userId: string, businessId: string, body: any, idempotencyKey: string) {
  const requestId = clean(body?.requestId, 80);
  const messageBody = clean(body?.message, 3000);
  if (!requestId || !messageBody) throw new Error("Choose a request and enter a message first.");
  const request = await supabase.from("busy_mini_app_requests").select("id,business_id,mini_app_id,consumer_user_id,request_origin,status").eq("id", requestId).eq("business_id", businessId).maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) throw new Error("Mini App request not found.");
  if (request.data.request_origin === "guest_web" || !request.data.consumer_user_id) {
    throw new Error("Guest web requests do not have a BUSY chat recipient. Use the customer's supplied contact details for replies.");
  }
  if (["declined", "closed"].includes(request.data.status)) throw new Error("That Mini App request is closed for new messages.");
  if (idempotencyKey) {
    const existing = await supabase.from("busy_mini_app_request_messages").select("*").eq("request_id", requestId).eq("sender_user_id", userId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return { reused: true, message: existing.data };
  }
  const now = new Date().toISOString();
  const inserted = await supabase.from("busy_mini_app_request_messages").insert({ business_id: businessId, request_id: requestId, mini_app_id: request.data.mini_app_id, sender_user_id: userId, sender_role: "business", body: messageBody, idempotency_key: idempotencyKey || null, created_at: now }).select("*").single();
  if (inserted.error) {
    if (inserted.error.code === "23505" && idempotencyKey) {
      const raced = await supabase.from("busy_mini_app_request_messages").select("*").eq("request_id", requestId).eq("sender_user_id", userId).eq("idempotency_key", idempotencyKey).maybeSingle();
      if (raced.error) throw raced.error;
      if (raced.data) return { reused: true, message: raced.data };
    }
    throw inserted.error;
  }
  const movedToReviewing = request.data.status === "received";
  await supabase.from("busy_mini_app_requests").update({ status: movedToReviewing ? "reviewing" : request.data.status, updated_at: now }).eq("id", requestId).eq("business_id", businessId);
  if (movedToReviewing) {
    await supabase.from("busy_mini_app_request_events").insert({
      business_id: businessId,
      request_id: requestId,
      actor_user_id: userId,
      event_type: "reviewing",
      detail: { source: "business_message" },
    });
  }
  await bumpUnread(requestId, "customer");
  await notifyCustomerOfMiniAppRequest(
    request.data,
    "BUSY Apps • New reply",
    "The business replied to your BUSY Apps request.",
    `message:${inserted.data.id}`
  );
  return { reused: false, message: inserted.data };
}

async function replyRequestMessage(userId: string, body: any, idempotencyKey: string) {
  const requestId = clean(body?.requestId, 80);
  const messageBody = clean(body?.message, 3000);
  if (!requestId || !messageBody) throw new Error("Choose a request and enter a reply first.");
  const request = await supabase.from("busy_mini_app_requests").select("id,business_id,mini_app_id,status").eq("id", requestId).eq("consumer_user_id", userId).maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) throw new Error("That Mini App request is not available.");
  if (["declined", "closed"].includes(request.data.status)) throw new Error("That Mini App request is closed for new messages.");
  if (idempotencyKey) {
    const existing = await supabase.from("busy_mini_app_request_messages").select("*").eq("request_id", requestId).eq("sender_user_id", userId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return { reused: true, message: existing.data };
  }
  const now = new Date().toISOString();
  const inserted = await supabase.from("busy_mini_app_request_messages").insert({ business_id: request.data.business_id, request_id: requestId, mini_app_id: request.data.mini_app_id, sender_user_id: userId, sender_role: "customer", body: messageBody, idempotency_key: idempotencyKey || null, created_at: now }).select("*").single();
  if (inserted.error) {
    if (inserted.error.code === "23505" && idempotencyKey) {
      const raced = await supabase.from("busy_mini_app_request_messages").select("*").eq("request_id", requestId).eq("sender_user_id", userId).eq("idempotency_key", idempotencyKey).maybeSingle();
      if (raced.error) throw raced.error;
      if (raced.data) return { reused: true, message: raced.data };
    }
    throw inserted.error;
  }
  await supabase.from("busy_mini_app_requests").update({ updated_at: now }).eq("id", requestId).eq("consumer_user_id", userId);
  await bumpUnread(requestId, "business");
  await trackConsumerApp(userId, request.data.mini_app_id, { action: true });
  await notifyBusinessOfMiniAppRequest(
    request.data,
    "BUSY Apps • Customer replied",
    "A customer replied to a BUSY Apps conversation.",
    `message:${inserted.data.id}`
  );
  return { reused: false, message: inserted.data };
}

async function updateRequestStatus(
  userId: string,
  businessId: string,
  body: any
) {
  const requestId = clean(body?.requestId, 80);
  const status = clean(body?.status, 40);
  if (!["reviewing", "accepted", "declined", "closed"].includes(status)) {
    throw new Error("Unsupported request status.");
  }
  const current = await supabase
    .from("busy_mini_app_requests")
    .select("id,business_id,mini_app_id,consumer_user_id,request_origin,status")
    .eq("id", requestId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (current.error) throw current.error;
  if (!current.data) throw new Error("Mini App request not found.");
  if (current.data.status === status) return current.data;

  const now = new Date().toISOString();
  const updated = await supabase
    .from("busy_mini_app_requests")
    .update({ status, updated_at: now })
    .eq("id", requestId)
    .eq("business_id", businessId)
    .select("*")
    .single();
  if (updated.error) throw updated.error;

  const event = await supabase.from("busy_mini_app_request_events").insert({
    business_id: businessId,
    request_id: requestId,
    actor_user_id: userId,
    event_type: status,
    detail: { source: "business_review" },
  });
  if (event.error) throw event.error;

  if (current.data.consumer_user_id) {
    await bumpUnread(requestId, "customer");
    const statusText = status === "accepted"
      ? "Your request has been accepted."
      : status === "declined"
      ? "The business updated your request as declined."
      : status === "closed"
      ? "The business closed this request."
      : "The business is reviewing your request.";
    await notifyCustomerOfMiniAppRequest(
      updated.data,
      "BUSY Apps • Request update",
      statusText,
      `status:${status}`
    );
  }
  return updated.data;
}

async function awardLoyaltyStamp(
  userId: string,
  businessId: string,
  body: any,
  idempotencyKey: string
) {
  const requestId = clean(body?.requestId, 80);
  if (!requestId) throw new Error("Choose a customer request first.");

  const request = await supabase
    .from("busy_mini_app_requests")
    .select("id,business_id,mini_app_id,consumer_user_id")
    .eq("id", requestId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) throw new Error("Business App request not found.");
  if (!request.data.consumer_user_id) {
    throw new Error(
      "Loyalty progress needs a signed-in BUSY customer. Guest web requests cannot be given an account stamp."
    );
  }

  const live = await liveConfigForMiniApp(request.data.mini_app_id);
  const moduleEnabled = safeArray(live.config?.modules).some(
    (item: any) => item?.key === "loyalty" && item?.enabled
  );
  const loyalty = safeLoyalty(live.config?.loyalty || {});
  if (!moduleEnabled || !loyaltyReady(loyalty)) {
    throw new Error(
      "Publish an active Loyalty programme in this Business App before recording stamps."
    );
  }

  const awarded = await supabase.rpc(
    "busy_award_mini_app_loyalty_stamp",
    {
      p_business_id: businessId,
      p_mini_app_id: request.data.mini_app_id,
      p_consumer_user_id: request.data.consumer_user_id,
      p_request_id: requestId,
      p_awarded_by: userId,
      p_idempotency_key: clean(idempotencyKey, 180) || crypto.randomUUID(),
      p_target_stamps: loyalty.targetStamps,
      p_reason: clean(body?.reason, 500) || "Owner recorded loyalty stamp",
    }
  );
  if (awarded.error) throw awarded.error;

  return {
    loyaltyProgress: {
      ...loyalty,
      stamps: Math.max(0, Number(awarded.data?.stamps || 0)),
      remaining: Math.max(
        0,
        loyalty.targetStamps - Number(awarded.data?.stamps || 0)
      ),
      rewardReached: awarded.data?.rewardReached === true,
      reused: awarded.data?.reused === true,
      alreadyComplete: awarded.data?.alreadyComplete === true,
    },
  };
}

async function requestBridgePlan(
  businessId: string,
  requestId: string
) {
  const request = await supabase
    .from("busy_mini_app_requests")
    .select("*")
    .eq("id", requestId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) throw new Error("Mini App request not found.");

  const linked = await supabase
    .from("busy_mini_app_request_links")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (linked.error) throw linked.error;

  const row = request.data;
  return {
    request: row,
    existingLink: linked.data || null,
    customerCandidate: {
      idHint: `miniapp-${row.id}`,
      name: clean(row.contact_name, 160),
      email: clean(row.contact_email, 240),
      phone: clean(row.contact_phone, 80),
      service: clean(row.service_name, 240) || "General enquiry",
      source: "BUSY Mini App",
      note:
        row.request_type === "booking_request"
          ? clean(row.payload?.note, 3000)
          : clean(row.payload?.message, 5000),
    },
    actionCandidate:
      row.request_type === "booking_request"
        ? {
            type: "booking",
            bookingStatus: "Draft",
            preferredDateText: clean(row.preferred_date_text, 240),
            service: clean(row.service_name, 240),
            note: clean(row.payload?.note, 3000),
          }
        : {
            type: "enquiry",
            service: clean(row.service_name, 240),
            note: clean(row.payload?.message, 5000),
          },
  };
}

async function markRequestLinked(
  userId: string,
  businessId: string,
  body: any
) {
  const requestId = clean(body?.requestId, 80);
  const customerRecordId = clean(body?.customerRecordId, 160);
  const actionRecordId = clean(body?.actionRecordId, 160);
  const bridgeState = clean(body?.bridgeState, 40) || "linked";
  if (!requestId || !customerRecordId) {
    throw new Error("Request and customer record IDs are required.");
  }
  if (!["linked","enquiry_linked","booking_draft","booking_confirmed","closed"].includes(bridgeState)) {
    throw new Error("Unsupported BUSY bridge state.");
  }

  const request = await supabase
    .from("busy_mini_app_requests")
    .select("id,request_type,mini_app_id,consumer_user_id,status")
    .eq("id", requestId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (request.error) throw request.error;
  if (!request.data) throw new Error("Mini App request not found.");

  const linked = await supabase
    .from("busy_mini_app_request_links")
    .upsert(
      {
        business_id: businessId,
        request_id: requestId,
        customer_record_id: customerRecordId,
        action_record_id: actionRecordId || null,
        bridge_state: bridgeState,
        linked_by: userId,
        updated_at: new Date().toISOString(),
        metadata:
          body?.metadata && typeof body.metadata === "object"
            ? body.metadata
            : {},
      },
      { onConflict: "request_id" }
    )
    .select("*")
    .single();
  if (linked.error) throw linked.error;

  const eventType =
    bridgeState === "booking_draft"
      ? "booking_draft"
      : bridgeState === "booking_confirmed"
      ? "booking_confirmed"
      : "linked_customer";
  const event = await supabase
    .from("busy_mini_app_request_events")
    .insert({
      business_id: businessId,
      request_id: requestId,
      actor_user_id: userId,
      event_type: eventType,
      detail: {
        customerRecordId,
        actionRecordId: actionRecordId || null,
      },
    });
  if (event.error) throw event.error;

  const nextStatus =
    bridgeState === "booking_confirmed"
      ? "accepted"
      : bridgeState === "closed"
      ? "closed"
      : "reviewing";
  await supabase
    .from("busy_mini_app_requests")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (
    request.data.consumer_user_id &&
    request.data.status !== nextStatus &&
    ["accepted", "closed"].includes(nextStatus)
  ) {
    await bumpUnread(requestId, "customer");
    await notifyCustomerOfMiniAppRequest(
      { ...request.data, business_id: businessId },
      "BUSY Apps • Booking update",
      nextStatus === "accepted" ? "Your BUSY Apps booking request has been confirmed." : "Your BUSY Apps request has been closed.",
      `status:${nextStatus}`
    );
  }

  return linked.data;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json(405, { error: "POST required" });
  }

  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const action = clean(body?.action, 80);
    const businessId = clean(body?.businessId, 80);
    const requestId =
      clean(request.headers.get("x-busy-request-id"), 180) ||
      clean(body?.idempotencyKey, 180);

    if (action === "directory_search") {
      return json(200, {
        ok: true,
        apps: await directorySearch(body?.query),
      });
    }
    if (action === "app_detail") {
      return json(200, {
        ok: true,
        ...(await appDetail(
          clean(body?.slug, 100),
          user.id,
          miniAppEntrySource(body?.source),
          true
        )),
      });
    }
    if (action === "my_apps") {
      return json(200, {
        ok: true,
        apps: await myBusyApps(user.id),
        requests: await myMiniAppRequests(user.id),
        notification: await notificationStatus(user.id),
      });
    }
    if (action === "notification_status") {
      return json(200, { ok: true, notification: await notificationStatus(user.id) });
    }
    if (action === "register_notification_device") {
      return json(200, { ok: true, notification: await registerNotificationDevice(user.id, body) });
    }
    if (action === "disable_notification_device") {
      return json(200, { ok: true, notification: await disableNotificationDevice(user.id, body) });
    }
    if (action === "customer_request_detail") {
      return json(200, { ok: true, detail: await customerRequestDetail(user.id, body) });
    }
    if (action === "set_favorite") {
      return json(200, {
        ok: true,
        ...(await setConsumerFavorite(
          user.id,
          clean(body?.slug, 100),
          body?.favorite === true
        )),
        apps: await myBusyApps(user.id),
      });
    }
    if (action === "submit_request") {
      return json(200, {
        ok: true,
        ...(await submitRequest(user.id, body, requestId)),
      });
    }
    if (action === "reply_request_message") {
      return json(200, {
        ok: true,
        ...(await replyRequestMessage(user.id, body, requestId)),
      });
    }

    const writeActions = new Set([
      "build_draft",
      "plan_app",
      "apply_app_plan",
      "set_module",
      "prepare_preview",
      "publish",
      "rollback",
      "set_discoverable",
      "update_request_status",
      "award_loyalty_stamp",
      "mark_request_linked",
      "send_request_message",
      "owner_request_detail",
    ]);
    const member = await membership(
      user.id,
      businessId,
      writeActions.has(action)
    );
    const resolvedBusinessId = member.business_id;

    if (action === "owner_status") {
      return json(200, {
        ok: true,
        businessId: resolvedBusinessId,
        role: member.role,
        ...(await ownerStatus(resolvedBusinessId)),
      });
    }
    if (action === "build_draft") {
      return json(200, {
        ok: true,
        ...(await buildDraft(user.id, resolvedBusinessId, body)),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "plan_app") {
      return json(200, {
        ok: true,
        plan: await planBusinessApp(resolvedBusinessId, body),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "apply_app_plan") {
      return json(200, {
        ok: true,
        ...(await applyBusinessAppPlan(
          user.id,
          resolvedBusinessId,
          body
        )),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "set_module") {
      const app = await setModule(
        resolvedBusinessId,
        clean(body?.moduleKey, 80),
        body?.enabled === true
      );
      return json(200, {
        ok: true,
        app,
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "prepare_preview") {
      return json(200, {
        ok: true,
        ...(await preparePreview(user.id, resolvedBusinessId)),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "publish") {
      return json(200, {
        ok: true,
        ...(await publishVersion(user.id, resolvedBusinessId, body)),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "rollback") {
      return json(200, {
        ok: true,
        ...(await rollbackVersion(user.id, resolvedBusinessId, body)),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "set_discoverable") {
      return json(200, {
        ok: true,
        app: await setDiscoverable(resolvedBusinessId, body),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "send_request_message") {
      return json(200, {
        ok: true,
        ...(await sendRequestMessage(user.id, resolvedBusinessId, body, requestId)),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "owner_request_detail") {
      return json(200, {
        ok: true,
        detail: await ownerRequestDetail(resolvedBusinessId, body),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "request_bridge_plan") {
      return json(200, {
        ok: true,
        plan: await requestBridgePlan(
          resolvedBusinessId,
          clean(body?.requestId, 80)
        ),
      });
    }
    if (action === "award_loyalty_stamp") {
      return json(200, {
        ok: true,
        ...(await awardLoyaltyStamp(
          user.id,
          resolvedBusinessId,
          body,
          requestId
        )),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "mark_request_linked") {
      return json(200, {
        ok: true,
        link: await markRequestLinked(
          user.id,
          resolvedBusinessId,
          body
        ),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "update_request_status") {
      return json(200, {
        ok: true,
        request: await updateRequestStatus(
          user.id,
          resolvedBusinessId,
          body
        ),
        status: await ownerStatus(resolvedBusinessId),
      });
    }

    return json(400, { error: "Unknown BUSY Apps action." });
  } catch (error) {
    return json(400, {
      error:
        error instanceof Error
          ? error.message
          : "BUSY Apps request failed.",
    });
  }
});
