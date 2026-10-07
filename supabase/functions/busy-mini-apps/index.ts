import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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
      catalog,
      publicProfile: profile,
    };
  }

  const [versions, requests] = await Promise.all([
    supabase
      .from("busy_mini_app_versions")
      .select(
        "id,version_no,source_profile_revision,source_draft_revision,config_hash,state,change_label,change_summary,created_at,prepared_at,published_at"
      )
      .eq("mini_app_id", app.id)
      .order("version_no", { ascending: false })
      .limit(12),
    supabase
      .from("busy_mini_app_requests")
      .select(
        "id,version_id,module_key,request_type,status,payload,created_at,updated_at"
      )
      .eq("mini_app_id", app.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (versions.error) throw versions.error;
  if (requests.error) throw requests.error;
  return {
    app,
    versions: versions.data || [],
    requests: requests.data || [],
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
  if (!app) throw new Error("Build the Mini App draft first.");

  const module = catalog.find(
    (item: any) => item.module_key === moduleKey
  );
  if (!module) throw new Error("That Mini App module is not supported.");
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
  if (!app) throw new Error("Build the Mini App draft first.");
  const config = app.draft_config || {};
  if (!safeArray(config?.modules).some((item: any) => item.enabled)) {
    throw new Error("Enable at least one Mini App module.");
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

async function publishVersion(
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
  if (!versionId) throw new Error("Prepare a Mini App preview first.");

  const version = await supabase
    .from("busy_mini_app_versions")
    .select("*")
    .eq("id", versionId)
    .eq("mini_app_id", app.id)
    .maybeSingle();
  if (version.error) throw version.error;
  if (!version.data) throw new Error("That Mini App version was not found.");

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
      last_error: null,
      updated_at: now,
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;

  return { app: updated.data, version: live.data };
}

async function rollbackVersion(
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
      updated_at: now,
    })
    .eq("id", app.id)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  return { app: updated.data, version: promoted.data };
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

  const q = clean(queryText, 100).replace(/[%_,()]/g, " ");
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

async function appDetail(slug: string) {
  const app = await supabase
    .from("busy_mini_apps")
    .select("*")
    .eq("public_slug", slug)
    .eq("status", "live")
    .eq("discoverable", true)
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
  if (!version.data) throw new Error("Live Mini App version not found.");

  return {
    app: {
      id: app.data.id,
      slug: app.data.public_slug,
      name: app.data.display_name,
      category: app.data.category,
      tagline: app.data.tagline,
    },
    version: version.data,
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
  const detail = await appDetail(slug);
  const modules = safeArray(detail.version?.config?.modules);
  const moduleKey =
    requestType === "booking_request" ? "booking_request" : "enquiry";
  const module = modules.find((item: any) => item.key === moduleKey);
  if (!module?.enabled) {
    throw new Error("That action is not enabled in this Mini App.");
  }

  const payload = body?.payload && typeof body.payload === "object"
    ? body.payload
    : {};
  const serialized = JSON.stringify(payload);
  if (serialized.length > 20_000) {
    throw new Error("That request is too large.");
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

  const inserted = await supabase
    .from("busy_mini_app_requests")
    .insert({
      business_id: detail.version.config?.businessId || body?.businessId || null,
      mini_app_id: detail.app.id,
      version_id: detail.version.id,
      consumer_user_id: userId,
      module_key: moduleKey,
      request_type: requestType,
      payload,
      idempotency_key: requestId || null,
    })
    .select("*")
    .single();

  if (inserted.error) {
    // business_id cannot come from the consumer. Resolve from the app row.
    const appRow = await supabase
      .from("busy_mini_apps")
      .select("business_id")
      .eq("id", detail.app.id)
      .single();
    if (appRow.error) throw appRow.error;
    const retried = await supabase
      .from("busy_mini_app_requests")
      .insert({
        business_id: appRow.data.business_id,
        mini_app_id: detail.app.id,
        version_id: detail.version.id,
        consumer_user_id: userId,
        module_key: moduleKey,
        request_type: requestType,
        payload,
        idempotency_key: requestId || null,
      })
      .select("*")
      .single();
    if (retried.error) throw retried.error;
    return { reused: false, request: retried.data };
  }

  return { reused: false, request: inserted.data };
}

async function updateRequestStatus(
  businessId: string,
  body: any
) {
  const requestId = clean(body?.requestId, 80);
  const status = clean(body?.status, 40);
  if (!["reviewing", "accepted", "declined", "closed"].includes(status)) {
    throw new Error("Unsupported request status.");
  }
  const updated = await supabase
    .from("busy_mini_app_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("business_id", businessId)
    .select("*")
    .single();
  if (updated.error) throw updated.error;
  return updated.data;
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
        ...(await appDetail(clean(body?.slug, 100))),
      });
    }
    if (action === "submit_request") {
      return json(200, {
        ok: true,
        ...(await submitRequest(user.id, body, requestId)),
      });
    }

    const writeActions = new Set([
      "build_draft",
      "set_module",
      "prepare_preview",
      "publish",
      "rollback",
      "set_discoverable",
      "update_request_status",
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
        ...(await publishVersion(resolvedBusinessId, body)),
        status: await ownerStatus(resolvedBusinessId),
      });
    }
    if (action === "rollback") {
      return json(200, {
        ok: true,
        ...(await rollbackVersion(resolvedBusinessId, body)),
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
    if (action === "update_request_status") {
      return json(200, {
        ok: true,
        request: await updateRequestStatus(resolvedBusinessId, body),
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
