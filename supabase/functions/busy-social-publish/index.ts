import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const BUCKET = "busy-social-media";
const WORKSPACE = "prototype";
const META_GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v24.0";
const META_LOGIN_CONFIG_ID = "1310417644415943";
const LIVE_PUBLISHING_ENABLED =
  String(Deno.env.get("BUSY_LIVE_PUBLISHING") || "").toLowerCase() === "enabled";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function html(status: number, title: string, body: string) {
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px;max-width:600px;margin:auto"><h1>${title}</h1><p>${body}</p><p>You can close this page and return to BUSY.</p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function cleanText(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function providerLabel(provider: string) {
  return provider === "meta" ? "Facebook / Instagram" : "Google Business";
}

function callbackUrl(provider: string) {
  if (provider === "meta") {
    return `${SUPABASE_URL}/functions/v1/busy-social-publish/callback/meta`;
  }
  return `${SUPABASE_URL}/functions/v1/busy-social-publish?action=callback&provider=${provider}`;
}

function base64UrlBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function verifyMetaSignedRequest(value: string) {
  const secret = Deno.env.get("META_APP_SECRET") || "";
  if (!secret) throw new Error("Meta app secret is not configured.");
  const [signaturePart, payloadPart] = value.split(".", 2);
  if (!signaturePart || !payloadPart) throw new Error("Invalid Meta signed request.");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadPart))
  );
  const received = base64UrlBytes(signaturePart);
  if (expected.length !== received.length) throw new Error("Invalid Meta signed request.");

  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected[i] ^ received[i];
  if (mismatch !== 0) throw new Error("Invalid Meta signed request.");

  return JSON.parse(new TextDecoder().decode(base64UrlBytes(payloadPart)));
}

async function removeMetaConnection() {
  const connection = await supabase
    .from("busy_social_connections")
    .delete()
    .eq("workspace_key", WORKSPACE)
    .eq("provider", "meta");
  if (connection.error) throw connection.error;

  const states = await supabase
    .from("busy_social_oauth_states")
    .delete()
    .eq("workspace_key", WORKSPACE)
    .eq("provider", "meta");
  if (states.error) throw states.error;
}

function requirePrototypeCaller(request: Request) {
  const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
  const allowed = Object.values(publishableKeys).filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
  const supplied = request.headers.get("apikey") || "";
  if (!supplied || !allowed.includes(supplied)) {
    throw new Error("Unauthorised BUSY prototype request.");
  }
}

async function getConnection(provider: string) {
  const { data, error } = await supabase
    .from("busy_social_connections")
    .select("*")
    .eq("workspace_key", WORKSPACE)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertConnection(provider: string, patch: Record<string, unknown>) {
  const existing = await getConnection(provider);
  const row = {
    workspace_key: WORKSPACE,
    provider,
    ...(existing || {}),
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("busy_social_connections")
    .upsert(row, { onConflict: "workspace_key,provider" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function credentialStatus() {
  return {
    meta: {
      configured: !!Deno.env.get("META_APP_ID") && !!Deno.env.get("META_APP_SECRET"),
      appIdPresent: !!Deno.env.get("META_APP_ID"),
    },
    google_business: {
      configured: !!Deno.env.get("GOOGLE_CLIENT_ID") && !!Deno.env.get("GOOGLE_CLIENT_SECRET"),
      clientIdPresent: !!Deno.env.get("GOOGLE_CLIENT_ID"),
    },
    livePublishingEnabled: LIVE_PUBLISHING_ENABLED,
  };
}

async function connectionSummary(provider: string) {
  const row = await getConnection(provider);
  if (!row) {
    return {
      provider,
      label: providerLabel(provider),
      status: "not_connected",
      assets: [],
    };
  }
  return {
    provider,
    label: providerLabel(provider),
    status: row.status,
    providerAccountName: row.provider_account_name || "",
    pageId: row.page_id || "",
    pageName: row.page_name || "",
    instagramUserId: row.instagram_user_id || "",
    instagramUsername: row.instagram_username || "",
    googleAccountName: row.google_account_name || "",
    googleLocationName: row.google_location_name || "",
    googleLocationTitle: row.google_location_title || "",
    tokenExpiresAt: row.token_expires_at || null,
    lastError: row.last_error || "",
    lastCheckedAt: row.last_checked_at || null,
    connectedAt: row.connected_at || null,
    assets: Array.isArray(row.assets) ? row.assets.map((asset: any) => ({
      id: asset.id || asset.pageId || asset.locationName || asset.name || "",
      name: asset.name || asset.title || asset.pageName || "",
      provider: row.provider,
      pageId: asset.pageId || "",
      instagramUserId: asset.instagramUserId || "",
      instagramUsername: asset.instagramUsername || "",
      locationName: asset.locationName || "",
      accountName: asset.accountName || "",
    })) : [],
  };
}

async function createOAuthState(provider: string) {
  const state = crypto.randomUUID() + crypto.randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error } = await supabase.from("busy_social_oauth_states").insert({
    state,
    workspace_key: WORKSPACE,
    provider,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return state;
}

async function consumeOAuthState(provider: string, state: string) {
  const { data, error } = await supabase
    .from("busy_social_oauth_states")
    .select("*")
    .eq("state", state)
    .eq("workspace_key", WORKSPACE)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error("OAuth connection session expired. Start the connection again in BUSY.");
  }
  await supabase.from("busy_social_oauth_states").delete().eq("state", state);
}

async function beginOAuth(provider: string) {
  const state = await createOAuthState(provider);

  if (provider === "meta") {
    const appId = Deno.env.get("META_APP_ID");
    const appSecret = Deno.env.get("META_APP_SECRET");
    if (!appId || !appSecret) throw new Error("Meta developer credentials are not configured yet.");
    const url = new URL(`https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("redirect_uri", callbackUrl("meta"));
    url.searchParams.set("state", state);
    url.searchParams.set("config_id", META_LOGIN_CONFIG_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("override_default_response_type", "true");
    return { authUrl: url.toString(), provider };
  }

  if (provider === "google_business") {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("Google OAuth credentials are not configured yet.");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", callbackUrl("google_business"));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "https://www.googleapis.com/auth/business.manage");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    return { authUrl: url.toString(), provider };
  }

  throw new Error("Unknown social provider.");
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error_description ||
      payload?.message ||
      `Provider request failed with ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

async function handleMetaCallback(code: string) {
  const appId = Deno.env.get("META_APP_ID") || "";
  const appSecret = Deno.env.get("META_APP_SECRET") || "";
  const redirectUri = callbackUrl("meta");

  const exchange = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
  exchange.searchParams.set("client_id", appId);
  exchange.searchParams.set("client_secret", appSecret);
  exchange.searchParams.set("redirect_uri", redirectUri);
  exchange.searchParams.set("code", code);
  const shortToken = await fetchJson(exchange.toString());

  const longUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
  longUrl.searchParams.set("grant_type", "fb_exchange_token");
  longUrl.searchParams.set("client_id", appId);
  longUrl.searchParams.set("client_secret", appSecret);
  longUrl.searchParams.set("fb_exchange_token", shortToken.access_token);
  const longToken = await fetchJson(longUrl.toString());
  const userToken = longToken.access_token || shortToken.access_token;

  const pagesUrl = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/me/accounts`);
  pagesUrl.searchParams.set(
    "fields",
    "id,name,access_token,tasks,instagram_business_account{id,username}"
  );
  pagesUrl.searchParams.set("access_token", userToken);
  const pages = await fetchJson(pagesUrl.toString());
  const assets = (Array.isArray(pages.data) ? pages.data : []).map((page: any) => ({
    id: page.id,
    name: page.name || "Facebook Page",
    pageId: page.id,
    pageName: page.name || "",
    pageAccessToken: page.access_token || "",
    instagramUserId: page.instagram_business_account?.id || "",
    instagramUsername: page.instagram_business_account?.username || "",
    tasks: page.tasks || [],
  }));

  const expiresIn = Number(longToken.expires_in || shortToken.expires_in || 0);
  const common = {
    access_token: userToken,
    token_expires_at: expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null,
    assets,
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ],
    last_error: null,
    last_checked_at: new Date().toISOString(),
  };

  if (assets.length === 1) {
    const asset = assets[0];
    await upsertConnection("meta", {
      ...common,
      status: "connected",
      provider_account_id: asset.pageId,
      provider_account_name: asset.pageName,
      page_id: asset.pageId,
      page_name: asset.pageName,
      instagram_user_id: asset.instagramUserId,
      instagram_username: asset.instagramUsername,
      refresh_token: asset.pageAccessToken,
      connected_at: new Date().toISOString(),
    });
    return;
  }

  await upsertConnection("meta", {
    ...common,
    status: assets.length ? "needs_selection" : "needs_attention",
    last_error: assets.length ? null : "No Facebook Pages were available to this login.",
  });
}

async function googleAccessToken(connection: any) {
  if (
    connection?.access_token &&
    (!connection.token_expires_at ||
      new Date(connection.token_expires_at).getTime() > Date.now() + 60_000)
  ) {
    return connection.access_token;
  }
  if (!connection?.refresh_token) throw new Error("Google connection needs consent again.");

  const body = new URLSearchParams({
    client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
    client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
    refresh_token: connection.refresh_token,
    grant_type: "refresh_token",
  });
  const payload = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const expiresAt = payload.expires_in
    ? new Date(Date.now() + Number(payload.expires_in) * 1000).toISOString()
    : null;
  await upsertConnection("google_business", {
    access_token: payload.access_token,
    token_expires_at: expiresAt,
    last_checked_at: new Date().toISOString(),
    last_error: null,
  });
  return payload.access_token;
}

async function handleGoogleCallback(code: string) {
  const body = new URLSearchParams({
    code,
    client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
    client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
    redirect_uri: callbackUrl("google_business"),
    grant_type: "authorization_code",
  });
  const token = await fetchJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const headers = { Authorization: `Bearer ${token.access_token}` };
  const accounts = await fetchJson(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers }
  );

  const assets: any[] = [];
  for (const account of Array.isArray(accounts.accounts) ? accounts.accounts.slice(0, 20) : []) {
    const url = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`
    );
    url.searchParams.set("readMask", "name,title,storeCode");
    url.searchParams.set("pageSize", "100");
    try {
      const locations = await fetchJson(url.toString(), { headers });
      for (const location of Array.isArray(locations.locations) ? locations.locations : []) {
        assets.push({
          id: location.name,
          name: location.title || location.storeCode || "Google Business location",
          accountName: account.name,
          accountLabel: account.accountName || "",
          locationName: location.name,
          locationTitle: location.title || "",
        });
      }
    } catch {
      // Some accessible accounts may not expose locations; continue to the next.
    }
  }

  const expiresAt = token.expires_in
    ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString()
    : null;
  const common = {
    access_token: token.access_token,
    refresh_token: token.refresh_token || null,
    token_expires_at: expiresAt,
    assets,
    scopes: ["https://www.googleapis.com/auth/business.manage"],
    last_checked_at: new Date().toISOString(),
    last_error: null,
  };

  if (assets.length === 1) {
    const asset = assets[0];
    await upsertConnection("google_business", {
      ...common,
      status: "connected",
      provider_account_id: asset.accountName,
      provider_account_name: asset.accountLabel,
      google_account_name: asset.accountName,
      google_location_name: asset.locationName,
      google_location_title: asset.locationTitle,
      connected_at: new Date().toISOString(),
    });
    return;
  }

  await upsertConnection("google_business", {
    ...common,
    status: assets.length ? "needs_selection" : "needs_attention",
    last_error: assets.length
      ? null
      : "No Google Business Profile locations were available to this login.",
  });
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i);
  if (!match) throw new Error("Unsupported image payload.");
  const contentType = match[1].toLowerCase();
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return { bytes, contentType, extension };
}

async function uploadMedia(clientDraftId: string, photos: any[]) {
  const saved: any[] = [];
  for (let i = 0; i < photos.length; i += 1) {
    const photo = photos[i] || {};
    if (photo.storagePath) {
      saved.push({
        id: photo.id || `photo-${i + 1}`,
        storagePath: photo.storagePath,
        contentType: photo.contentType || "image/jpeg",
      });
      continue;
    }
    const dataUrl = cleanText(photo.dataUrl, 25_000_000);
    if (!dataUrl) throw new Error("A selected photo could not be uploaded.");
    const decoded = decodeDataUrl(dataUrl);
    const path = `${WORKSPACE}/${clientDraftId}/${String(i + 1).padStart(2, "0")}-${crypto.randomUUID()}.${decoded.extension}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, decoded.bytes, {
      contentType: decoded.contentType,
      upsert: false,
    });
    if (error) throw error;
    saved.push({
      id: photo.id || `photo-${i + 1}`,
      storagePath: path,
      contentType: decoded.contentType,
    });
  }
  return saved;
}

async function signedMedia(media: any[], expiresIn = 7200) {
  const output: any[] = [];
  for (const item of media) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(item.storagePath, expiresIn);
    if (error || !data?.signedUrl) throw error || new Error("Could not sign social image.");
    output.push({ ...item, signedUrl: data.signedUrl });
  }
  return output;
}

async function upsertPost(payload: any, status: string, ownerApproved: boolean) {
  const clientDraftId = cleanText(payload.clientDraftId, 180);
  if (!clientDraftId) throw new Error("Missing social draft ID.");
  const caption = cleanText(payload.caption, 5000);
  if (!caption) throw new Error("Post caption is empty.");
  const channels = (Array.isArray(payload.channels) ? payload.channels : [])
    .filter((channel: string) =>
      ["Facebook", "Instagram", "Google Business"].includes(channel)
    );
  const photos = Array.isArray(payload.photos) ? payload.photos.slice(0, 6) : [];
  let media = Array.isArray(payload.media) ? payload.media : [];
  if (photos.length) media = await uploadMedia(clientDraftId, photos);
  if (!media.length) throw new Error("At least one post photo is required.");

  const row = {
    workspace_key: WORKSPACE,
    client_draft_id: clientDraftId,
    source_customer_id: cleanText(payload.sourceCustomerId, 180),
    source_job_id: cleanText(payload.sourceJobId, 180),
    source_label: cleanText(payload.sourceLabel, 300),
    service: cleanText(payload.service, 240),
    caption,
    channels,
    media,
    status,
    owner_approved: ownerApproved,
    scheduled_for: payload.scheduledFor || null,
    last_error: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("busy_social_posts")
    .upsert(row, { onConflict: "workspace_key,client_draft_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function publishFacebook(connection: any, caption: string, urls: string[]) {
  if (!connection?.page_id || !connection?.refresh_token) {
    throw new Error("Facebook Page connection is incomplete.");
  }
  const pageToken = connection.refresh_token;
  if (urls.length === 1) {
    const body = new URLSearchParams({
      url: urls[0],
      caption,
      access_token: pageToken,
    });
    return await fetchJson(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${connection.page_id}/photos`,
      { method: "POST", body }
    );
  }

  const mediaIds: string[] = [];
  for (const url of urls) {
    const body = new URLSearchParams({
      url,
      published: "false",
      access_token: pageToken,
    });
    const uploaded = await fetchJson(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${connection.page_id}/photos`,
      { method: "POST", body }
    );
    mediaIds.push(uploaded.id);
  }
  const body = new URLSearchParams({
    message: caption,
    access_token: pageToken,
  });
  mediaIds.forEach((id, index) => {
    body.set(`attached_media[${index}]`, JSON.stringify({ media_fbid: id }));
  });
  return await fetchJson(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${connection.page_id}/feed`,
    { method: "POST", body }
  );
}

async function waitForInstagramContainer(id: string, token: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/${id}`);
    url.searchParams.set("fields", "status_code");
    url.searchParams.set("access_token", token);
    const status = await fetchJson(url.toString());
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(`Instagram media container status: ${status.status_code}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

async function publishInstagram(connection: any, caption: string, urls: string[]) {
  const igId = connection?.instagram_user_id;
  const token = connection?.refresh_token;
  if (!igId || !token) throw new Error("Instagram professional account is not connected.");

  let creationId = "";
  if (urls.length === 1) {
    const body = new URLSearchParams({
      image_url: urls[0],
      caption,
      access_token: token,
    });
    const created = await fetchJson(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${igId}/media`,
      { method: "POST", body }
    );
    creationId = created.id;
  } else {
    const childIds: string[] = [];
    for (const url of urls) {
      const body = new URLSearchParams({
        image_url: url,
        is_carousel_item: "true",
        access_token: token,
      });
      const child = await fetchJson(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/${igId}/media`,
        { method: "POST", body }
      );
      childIds.push(child.id);
    }
    const body = new URLSearchParams({
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption,
      access_token: token,
    });
    const created = await fetchJson(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${igId}/media`,
      { method: "POST", body }
    );
    creationId = created.id;
  }

  await waitForInstagramContainer(creationId, token);
  const body = new URLSearchParams({
    creation_id: creationId,
    access_token: token,
  });
  return await fetchJson(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${igId}/media_publish`,
    { method: "POST", body }
  );
}

async function publishGoogleBusiness(connection: any, caption: string, urls: string[]) {
  if (!connection?.google_location_name) {
    throw new Error("Google Business location is not selected.");
  }
  const token = await googleAccessToken(connection);
  return await fetchJson(
    `https://mybusiness.googleapis.com/v4/${connection.google_location_name}/localPosts`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        languageCode: "en-GB",
        summary: caption,
        topicType: "STANDARD",
        media: urls.map((url) => ({
          mediaFormat: "PHOTO",
          sourceUrl: url,
        })),
      }),
    }
  );
}

async function assertChannelsConnected(channels: string[]) {
  const selected = Array.isArray(channels) ? channels : [];
  if (selected.includes("Facebook") || selected.includes("Instagram")) {
    const meta = await getConnection("meta");
    if (!meta || meta.status !== "connected") {
      throw new Error("Facebook / Instagram is not connected.");
    }
    if (selected.includes("Instagram") && !meta.instagram_user_id) {
      throw new Error("The selected Meta connection does not include an Instagram professional account.");
    }
  }

  if (selected.includes("Google Business")) {
    const google = await getConnection("google_business");
    if (!google || google.status !== "connected" || !google.google_location_name) {
      throw new Error("Google Business is not connected to a selected location.");
    }
  }
}

async function publishPost(post: any) {
  if (!LIVE_PUBLISHING_ENABLED) {
    throw new Error("Live publishing is server-disabled until provider credentials and owner authentication are ready.");
  }
  if (!post.owner_approved) throw new Error("Owner approval is required before publishing.");

  const media = await signedMedia(post.media || [], 7200);
  const urls = media.map((item) => item.signedUrl);
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const channel of post.channels || []) {
    try {
      if (channel === "Facebook") {
        const connection = await getConnection("meta");
        if (!connection || connection.status !== "connected") throw new Error("Facebook is not connected.");
        results[channel] = await publishFacebook(connection, post.caption, urls);
      } else if (channel === "Instagram") {
        const connection = await getConnection("meta");
        if (!connection || connection.status !== "connected") throw new Error("Instagram is not connected.");
        results[channel] = await publishInstagram(connection, post.caption, urls);
      } else if (channel === "Google Business") {
        const connection = await getConnection("google_business");
        if (!connection || connection.status !== "connected") throw new Error("Google Business is not connected.");
        results[channel] = await publishGoogleBusiness(connection, post.caption, urls);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results[channel] = { error: message };
      errors.push(`${channel}: ${message}`);
    }
  }

  const successful = Object.values(results).filter(
    (value: any) => value && !value.error
  ).length;
  const total = (post.channels || []).length;
  const status = successful === total
    ? "Published"
    : successful > 0
    ? "Partial failure"
    : "Failed";
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("busy_social_posts")
    .update({
      status,
      provider_results: results,
      last_error: errors.join(" • ") || null,
      published_at: successful ? now : null,
      retry_count: Number(post.retry_count || 0) + (errors.length ? 1 : 0),
      updated_at: now,
    })
    .eq("id", post.id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function processDuePosts() {
  if (!LIVE_PUBLISHING_ENABLED) {
    return { processed: 0, disabled: true };
  }
  const { data, error } = await supabase
    .from("busy_social_posts")
    .select("*")
    .eq("workspace_key", WORKSPACE)
    .eq("status", "Scheduled")
    .eq("owner_approved", true)
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(10);
  if (error) throw error;

  let processed = 0;
  for (const post of data || []) {
    await supabase
      .from("busy_social_posts")
      .update({ status: "Publishing", updated_at: new Date().toISOString() })
      .eq("id", post.id)
      .eq("status", "Scheduled");
    try {
      await publishPost({ ...post, status: "Publishing" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await supabase
        .from("busy_social_posts")
        .update({
          status: "Failed",
          last_error: message,
          retry_count: Number(post.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);
    }
    processed += 1;
  }
  return { processed, disabled: false };
}

async function listQueue() {
  const { data, error } = await supabase
    .from("busy_social_posts")
    .select("id,client_draft_id,source_customer_id,source_job_id,source_label,service,caption,channels,media,status,owner_approved,scheduled_for,provider_results,retry_count,last_error,published_at,created_at,updated_at")
    .eq("workspace_key", WORKSPACE)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

async function selectAsset(provider: string, assetId: string) {
  const connection = await getConnection(provider);
  if (!connection) throw new Error("Start the provider connection first.");
  const assets = Array.isArray(connection.assets) ? connection.assets : [];
  const asset = assets.find((item: any) =>
    String(item.id || item.pageId || item.locationName) === assetId
  );
  if (!asset) throw new Error("That provider asset is no longer available.");

  if (provider === "meta") {
    return await upsertConnection(provider, {
      status: "connected",
      provider_account_id: asset.pageId,
      provider_account_name: asset.pageName,
      page_id: asset.pageId,
      page_name: asset.pageName,
      instagram_user_id: asset.instagramUserId || "",
      instagram_username: asset.instagramUsername || "",
      refresh_token: asset.pageAccessToken || "",
      connected_at: new Date().toISOString(),
      last_error: null,
    });
  }

  return await upsertConnection(provider, {
    status: "connected",
    provider_account_id: asset.accountName,
    provider_account_name: asset.accountLabel || "",
    google_account_name: asset.accountName,
    google_location_name: asset.locationName,
    google_location_title: asset.locationTitle || asset.name || "",
    connected_at: new Date().toISOString(),
    last_error: null,
  });
}

async function disconnectProvider(provider: string) {
  return await upsertConnection(provider, {
    status: "disconnected",
    provider_account_id: null,
    provider_account_name: null,
    page_id: null,
    page_name: null,
    instagram_user_id: null,
    instagram_username: null,
    google_account_name: null,
    google_location_name: null,
    google_location_title: null,
    access_token: null,
    refresh_token: null,
    token_expires_at: null,
    assets: [],
    last_error: null,
    connected_at: null,
    last_checked_at: new Date().toISOString(),
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const callbackProvider =
      pathParts.at(-2) === "callback" ? cleanText(pathParts.at(-1), 40) : "";

    if (request.method === "POST" && url.searchParams.get("action") === "deauthorize") {
      const form = await request.formData();
      const signedRequest = cleanText(form.get("signed_request"), 10000);
      if (!signedRequest) return json(400, { error: "Missing signed_request." });
      await verifyMetaSignedRequest(signedRequest);
      await removeMetaConnection();
      return json(200, { success: true });
    }

    if (request.method === "POST" && url.searchParams.get("action") === "data_delete") {
      const form = await request.formData();
      const signedRequest = cleanText(form.get("signed_request"), 10000);
      if (!signedRequest) return json(400, { error: "Missing signed_request." });
      await verifyMetaSignedRequest(signedRequest);
      await removeMetaConnection();
      const confirmationCode = crypto.randomUUID();
      return json(200, {
        url: `${SUPABASE_URL}/functions/v1/busy-social-publish?action=data_deletion_status&code=${confirmationCode}`,
        confirmation_code: confirmationCode,
      });
    }

    if (request.method === "GET" && url.searchParams.get("action") === "data_deletion_status") {
      return html(200, "BUSY data deletion complete", "Meta connection data was deleted.");
    }

    if (
      request.method === "GET" &&
      (callbackProvider || url.searchParams.get("action") === "callback")
    ) {
      const provider =
        callbackProvider || cleanText(url.searchParams.get("provider"), 40);
      const state = cleanText(url.searchParams.get("state"), 300);
      const code = cleanText(url.searchParams.get("code"), 5000);
      const errorText = cleanText(url.searchParams.get("error_description") || url.searchParams.get("error"), 1000);
      if (errorText) return html(400, "Connection cancelled", errorText);
      if (!provider || !state || !code) return html(400, "Connection failed", "The provider did not return a complete authorization response.");
      await consumeOAuthState(provider, state);
      if (provider === "meta") await handleMetaCallback(code);
      else if (provider === "google_business") await handleGoogleCallback(code);
      else throw new Error("Unknown provider.");
      return html(200, "Connected to BUSY", `${providerLabel(provider)} authorization completed successfully.`);
    }

    if (request.method !== "POST") return json(405, { error: "POST required" });
    requirePrototypeCaller(request);
    const body = await request.json();
    const action = cleanText(body?.action, 80);

    if (action === "status") {
      const [credentials, meta, google, queue] = await Promise.all([
        credentialStatus(),
        connectionSummary("meta"),
        connectionSummary("google_business"),
        listQueue(),
      ]);
      return json(200, { credentials, connections: { meta, google_business: google }, queue });
    }

    if (action === "begin_oauth") {
      const provider = cleanText(body?.provider, 40);
      return json(200, await beginOAuth(provider));
    }

    if (action === "select_asset") {
      const provider = cleanText(body?.provider, 40);
      const assetId = cleanText(body?.assetId, 500);
      await selectAsset(provider, assetId);
      return json(200, { ok: true, connection: await connectionSummary(provider) });
    }

    if (action === "disconnect") {
      const provider = cleanText(body?.provider, 40);
      await disconnectProvider(provider);
      return json(200, { ok: true, connection: await connectionSummary(provider) });
    }

    if (action === "save_draft") {
      const post = await upsertPost(body, "Draft", false);
      return json(200, { ok: true, post });
    }

    if (action === "schedule") {
      if (!body?.ownerApproved) throw new Error("Owner approval is required before scheduling.");
      if (!body?.scheduledFor) throw new Error("Choose a schedule time.");
      const channels = (Array.isArray(body?.channels) ? body.channels : [])
        .filter((channel: string) =>
          ["Facebook", "Instagram", "Google Business"].includes(channel)
        );
      if (LIVE_PUBLISHING_ENABLED) await assertChannelsConnected(channels);
      const post = await upsertPost(
        body,
        LIVE_PUBLISHING_ENABLED ? "Scheduled" : "Held for setup",
        LIVE_PUBLISHING_ENABLED
      );
      return json(200, {
        ok: true,
        post,
        heldForSetup: !LIVE_PUBLISHING_ENABLED,
      });
    }

    if (action === "publish_now") {
      if (!body?.ownerApproved) throw new Error("Owner approval is required before publishing.");
      const channels = (Array.isArray(body?.channels) ? body.channels : [])
        .filter((channel: string) =>
          ["Facebook", "Instagram", "Google Business"].includes(channel)
        );
      if (LIVE_PUBLISHING_ENABLED) await assertChannelsConnected(channels);
      const post = await upsertPost(body, "Publishing", true);
      if (!LIVE_PUBLISHING_ENABLED) {
        await supabase
          .from("busy_social_posts")
          .update({
            status: "Ready to publish",
            last_error: "Live publishing is server-disabled until provider credentials and owner authentication are ready.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);
        return json(409, {
          error: "Live publishing is built but server-disabled until the provider connection and final safety switch are configured.",
          post: { ...post, status: "Ready to publish" },
        });
      }
      return json(200, { ok: true, post: await publishPost(post) });
    }

    if (action === "process_due") {
      return json(200, await processDuePosts());
    }

    return json(400, { error: "Unknown action." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social publishing request failed.";
    console.error("BUSY social publish error:", message);
    return json(400, { error: message });
  }
});
