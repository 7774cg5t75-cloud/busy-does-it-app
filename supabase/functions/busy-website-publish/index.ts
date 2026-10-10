import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {evaluateLaunchPreflight} from "./launchPreflight.mjs";
import {validatedLeadInput,validTransition,buildLeadDigest} from "./leadWorkflow.mjs";
import {isVerifiedDomainTxtAnswer} from "./domainOwnership.mjs";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PREVIEW_BUCKET = "busy-website-preview";
const WORKER_URL = `${SUPABASE_URL}/functions/v1/busy-website-worker`;
const HEALTH_URL = `${SUPABASE_URL}/functions/v1/busy-website-health`;
const PROVIDER_URL = `${SUPABASE_URL}/functions/v1/busy-website-provider`;
const SIGNALS_URL = `${SUPABASE_URL}/functions/v1/busy-website-signals`;
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN") || "";
const CLOUDFLARE_ZONE_ID = Deno.env.get("CLOUDFLARE_SAAS_ZONE_ID") || "";
const CLOUDFLARE_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID") || "";
const BUSY_ROOT_DOMAIN =
  (Deno.env.get("BUSY_WEBSITE_ROOT_DOMAIN") || "busydoesit.co.uk").toLowerCase();
const BUSY_WEBSITE_BASE_DOMAIN =
  (Deno.env.get("BUSY_WEBSITE_BASE_DOMAIN") || BUSY_ROOT_DOMAIN).toLowerCase();
const BUSY_WEBSITE_CNAME_HOST =
  (Deno.env.get("BUSY_WEBSITE_CNAME_HOST") || `sites.${BUSY_ROOT_DOMAIN}`).toLowerCase();
const CLOUDFLARE_CNAME_TARGET =
  (Deno.env.get("CLOUDFLARE_SAAS_CNAME_TARGET") || BUSY_WEBSITE_CNAME_HOST).toLowerCase();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-busy-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

function cleanText(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function slugify(value: unknown) {
  return cleanText(value, 120)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "business";
}

function normalizeHostname(value: unknown) {
  let hostname = cleanText(value, 260).toLowerCase();
  hostname = hostname.replace(/^https?:\/\//, "").split("/")[0].replace(/\.$/, "");
  return hostname;
}

function validHostname(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
    value
  );
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function comparable(value: any): any {
  if (Array.isArray(value)) return value.map(comparable);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc: Record<string, unknown>, key) => {
        if (["html", "updatedAt", "generatedAt"].includes(key)) return acc;
        acc[key] = comparable(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function same(a: unknown, b: unknown) {
  return JSON.stringify(comparable(a)) === JSON.stringify(comparable(b));
}

function summarizeDraftChanges(previousDraft: any, nextDraft: any) {
  if (!previousDraft) {
    return {
      headline: "Initial website release",
      items: [{ type: "added", label: "Initial website", detail: "First hosted website version." }],
      counts: { added: 1, removed: 0, changed: 0 },
    };
  }

  const items: Array<Record<string, string>> = [];
  const counts = { added: 0, removed: 0, changed: 0 };
  const add = (type: "added" | "removed" | "changed", label: string, detail: string) => {
    items.push({ type, label, detail });
    counts[type] += 1;
  };

  const before = new Map(safeArray(previousDraft?.sections).map((section: any) => [section?.id, section]));
  const after = new Map(safeArray(nextDraft?.sections).map((section: any) => [section?.id, section]));
  const ids = new Set([...before.keys(), ...after.keys()]);

  ids.forEach((id: any) => {
    const prior: any = before.get(id);
    const next: any = after.get(id);
    if (!prior && next) {
      add("added", `Added ${cleanText(next?.title || id, 160)}`, "New website section.");
      return;
    }
    if (prior && !next) {
      add("removed", `Removed ${cleanText(prior?.title || id, 160)}`, "Website section removed.");
      return;
    }
    if (!!prior?.enabled !== !!next?.enabled) {
      add(
        next?.enabled === false ? "removed" : "added",
        `${next?.enabled === false ? "Hidden" : "Restored"} ${cleanText(next?.title || id, 160)}`,
        "Section visibility changed."
      );
      return;
    }
    if (!same(prior, next)) {
      add("changed", `Updated ${cleanText(next?.title || id, 160)}`, "Section content or presentation changed.");
    }
  });

  if (!same(previousDraft?.theme, nextDraft?.theme)) {
    add("changed", "Updated visual style", "Theme, spacing or hero presentation changed.");
  }
  if (!same(previousDraft?.seo, nextDraft?.seo)) {
    add("changed", "Updated SEO basics", "Titles, descriptions or page metadata changed.");
  }
  if (!same(previousDraft?.pages, nextDraft?.pages)) {
    add(
      "changed",
      "Updated page structure",
      `${safeArray(nextDraft?.pages).length || 1} page${(safeArray(nextDraft?.pages).length || 1) === 1 ? "" : "s"} in this version.`
    );
  }

  if (!items.length) {
    items.push({
      type: "changed",
      label: "Rebuilt from current business data",
      detail: "No material public-facing difference was detected.",
    });
  }

  const headline =
    items.length === 1
      ? items[0].label
      : `${items[0].label}${items.length > 1 ? ` + ${items.length - 1} more` : ""}`;

  return { headline, items, counts };
}

function publicProfileFromDraft(draft: any) {
  const sections = safeArray(draft?.sections);
  const contact: any = sections.find((section: any) => section?.id === "contact") || {};
  const services: any = sections.find((section: any) => section?.id === "services") || {};
  const hero: any = sections.find((section: any) => section?.id === "hero") || {};
  const gallery: any = sections.find((section: any) => section?.id === "gallery") || {};

  return {
    schemaVersion: 1,
    businessName: cleanText(draft?.businessName, 240),
    businessType: cleanText(draft?.businessType, 240),
    serviceArea: cleanText(draft?.serviceArea, 500),
    slug: cleanText(draft?.slug, 100),
    theme: draft?.theme || {},
    contact: {
      phone: cleanText(contact?.phone, 120),
      email: cleanText(contact?.email, 240),
      openingHours: cleanText(contact?.openingHours, 600),
      social: contact?.social && typeof contact.social === "object" ? contact.social : {},
    },
    services: safeArray(services?.items).map((item: any) => ({
      id: cleanText(item?.id, 120),
      name: cleanText(item?.title, 240),
      description: cleanText(item?.body, 1200),
    })),
    assets: {
      hero: hero?.asset || null,
      gallery: safeArray(gallery?.items).slice(0, 24),
    },
    pages: safeArray(draft?.pages).map((page: any) => ({
      id: cleanText(page?.id, 80),
      path: cleanText(page?.path, 240),
      title: cleanText(page?.title, 160),
    })),
  };
}

async function syncPublicProfile({
  businessId,
  websiteId,
  deploymentId,
  userId,
  draft,
  revision,
  status,
}: {
  businessId: string;
  websiteId: string;
  deploymentId: string;
  userId: string;
  draft: any;
  revision: number;
  status: "draft" | "preview_ready" | "live" | "disabled";
}) {
  const profile = publicProfileFromDraft(draft);
  const result = await supabase
    .from("busy_public_business_profiles")
    .upsert(
      {
        business_id: businessId,
        source_website_id: websiteId,
        source_deployment_id: deploymentId,
        public_slug: `${cleanText(draft?.slug, 60) || "business"}-${businessId.replaceAll("-", "").slice(0, 8)}`.slice(0, 80),
        display_name: cleanText(draft?.businessName, 240),
        status,
        revision: Math.max(1, Number(revision) || 1),
        profile,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" }
    );
  if (result.error) throw result.error;
}

async function requireUser(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Sign in before managing a website.");
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
    const rank = (role: string) => (role === "owner" ? 0 : role === "admin" ? 1 : 2);
    return rank(a.role) - rank(b.role);
  });
  const row = rows[0];
  if (!row?.business_id) throw new Error("This account is not a member of that BUSY business.");
  if (requireWrite && !["owner", "admin"].includes(row.role)) {
    throw new Error("Owner or admin access is required for website publishing.");
  }
  return row as { business_id: string; role: string };
}

async function ensureWebsite(
  businessId: string,
  userId: string,
  source: any = {}
) {
  const existing = await supabase
    .from("busy_websites")
    .select("*")
    .eq("business_id", businessId)
    .eq("site_key", "main")
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const base = slugify(source?.slug || source?.businessName || "business");
  const suffix = businessId.replaceAll("-", "").slice(0, 8);
  const publicSlug = `${base}-${suffix}`.slice(0, 80);

  const created = await supabase
    .from("busy_websites")
    .insert({
      business_id: businessId,
      site_key: "main",
      public_slug: publicSlug,
      status: "draft",
      hosting_provider: "supabase_storage_cdn",
      created_by: userId,
    })
    .select("*")
    .single();

  if (!created.error) return created.data;

  if (created.error.code === "23505") {
    const raced = await supabase
      .from("busy_websites")
      .select("*")
      .eq("business_id", businessId)
      .eq("site_key", "main")
      .maybeSingle();
    if (raced.error) throw raced.error;
    if (raced.data) return raced.data;
  }

  throw created.error;
}

async function websiteForBusiness(businessId: string) {
  const result = await supabase
    .from("busy_websites")
    .select("*")
    .eq("business_id", businessId)
    .eq("site_key", "main")
    .maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

function websiteProviderConfig() {
  return {
    provider: "cloudflare_saas",
    configured: !!(CLOUDFLARE_API_TOKEN && CLOUDFLARE_ZONE_ID),
    bootstrapReady: !!(
      CLOUDFLARE_API_TOKEN &&
      CLOUDFLARE_ZONE_ID &&
      CLOUDFLARE_ACCOUNT_ID
    ),
    hasApiToken: !!CLOUDFLARE_API_TOKEN,
    hasZoneId: !!CLOUDFLARE_ZONE_ID,
    hasAccountId: !!CLOUDFLARE_ACCOUNT_ID,
    hasCnameTarget: !!CLOUDFLARE_CNAME_TARGET,
    rootDomain: BUSY_ROOT_DOMAIN,
    baseDomainConfigured: !!BUSY_WEBSITE_BASE_DOMAIN,
    baseDomain: BUSY_WEBSITE_BASE_DOMAIN || "",
    cnameHost: BUSY_WEBSITE_CNAME_HOST,
    baseDomainSource: Deno.env.get("BUSY_WEBSITE_BASE_DOMAIN") ? "environment" : "busy_default",
  };
}

async function internalWebsiteRequest(
  url: string,
  body: Record<string, unknown>
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `BUSY internal website service returned ${response.status}.`);
  }
  return data;
}

async function websiteProviderStatus() {
  try {
    const result = await internalWebsiteRequest(PROVIDER_URL, { action: "status" });
    return {
      config: result?.config || websiteProviderConfig(),
      preflight: result?.preflight || null,
      platform: result?.provider || null,
      activation: result?.activation || null,
      reachable: true,
    };
  } catch (error) {
    return {
      config: websiteProviderConfig(),
      preflight: null,
      platform: null,
      activation: null,
      reachable: false,
      error:
        error instanceof Error
          ? error.message
          : "BUSY website provider status is unavailable.",
    };
  }
}

async function queueMetrics() {
  const result = await supabase.rpc("busy_website_publish_queue_metrics");
  if (result.error) return null;
  return Array.isArray(result.data) ? result.data[0] || null : result.data;
}

async function websiteStatus(businessId: string) {
  const website = await websiteForBusiness(businessId);
  if (!website) {
    const providerStatus = await websiteProviderStatus();
    return {
      website: null,
      deployments: [],
      domains: [],
      jobs: [],
      queue: await queueMetrics(),
      healthChecks: [],
      analytics: { days: 30, pageViews: 0, uniqueVisitors: 0, enquiries: 0, requests: 0, visits: 0, edgeBytes: 0, status: "foundation" },
      usage: { days: 30, deployments: 0, publishedVersions: 0, artifactBytes: 0, requests: 0, visits: 0, edgeBytes: 0, healthChecks: 0, activeCustomDomains: 0 },
      signalRuns: [],
      enquiryAttributions: [],
      publicProfile: null,
      providerConfig: providerStatus.config,
      providerPreflight: providerStatus.preflight,
      providerPlatform: providerStatus.platform,
      providerActivation: providerStatus.activation || null,
      providerStatusReachable: providerStatus.reachable,
      providerStatusError: providerStatus.error || null,
    };
  }

  const [deployments, domains, jobs, queue, healthChecks, analyticsRows, publicProfile, usageRows, signalRuns, enquiryAttributions, providerStatus] = await Promise.all([
    supabase
      .from("busy_website_deployments")
      .select(
        "id,version_no,source_generation,state,content_hash,change_label,change_summary,page_count,manifest,preview_storage_path,public_storage_path,public_url,artifact_bytes,last_error,created_at,prepared_at,published_at"
      )
      .eq("website_id", website.id)
      .order("version_no", { ascending: false })
      .limit(12),
    supabase
      .from("busy_website_domains")
      .select("*")
      .eq("website_id", website.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("busy_website_publish_jobs")
      .select(
        "id,deployment_id,action,status,attempt_count,max_attempts,lease_expires_at,last_error,requested_at,started_at,completed_at"
      )
      .eq("website_id", website.id)
      .order("requested_at", { ascending: false })
      .limit(12),
    queueMetrics(),
    supabase
      .from("busy_website_health_checks")
      .select("id,deployment_id,domain_id,target_type,checked_url,status,http_status,response_ms,expected_deployment_id,observed_deployment_id,last_error,checked_at")
      .eq("website_id", website.id)
      .order("checked_at", { ascending: false })
      .limit(12),
    supabase
      .from("busy_website_analytics_daily")
.select("metric_date,page_path,page_views,unique_visitors,enquiries,requests,visits,edge_bytes,sample_interval,provider_meta,source")
      .eq("website_id", website.id)
      .gte("metric_date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
      .order("metric_date", { ascending: false }),
    supabase
      .from("busy_public_business_profiles")
      .select("business_id,source_website_id,source_deployment_id,public_slug,display_name,status,revision,profile,updated_at")
      .eq("business_id", businessId)
      .maybeSingle(),
    supabase
      .from("busy_website_usage_daily")
      .select("usage_date,deployments_created,versions_published,artifact_bytes,requests,visits,edge_bytes,health_checks,active_custom_domains,source")
      .eq("website_id", website.id)
      .gte("usage_date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
      .order("usage_date", { ascending: false }),
    supabase
      .from("busy_website_signal_runs")
      .select("provider,signal_type,status,rows_written,detail,last_error,started_at,completed_at")
      .eq("website_id", website.id)
      .order("started_at", { ascending: false })
      .limit(12),
    supabase
      .from("busy_website_enquiry_attributions")
      .select("id,domain_id,occurred_at,page_path,source,referrer_host,campaign_source,campaign_medium,campaign_name,external_event_id,metadata")
      .eq("website_id", website.id)
      .gte("occurred_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .order("occurred_at", { ascending: false })
      .limit(50),
    websiteProviderStatus(),
  ]);

  if (deployments.error) throw deployments.error;
  if (domains.error) throw domains.error;
  if (jobs.error) throw jobs.error;
  if (healthChecks.error) throw healthChecks.error;
  if (analyticsRows.error) throw analyticsRows.error;
  if (publicProfile.error) throw publicProfile.error;
  if (usageRows.error) throw usageRows.error;
  if (signalRuns.error) throw signalRuns.error;
  if (enquiryAttributions.error) throw enquiryAttributions.error;

  const analytics = (analyticsRows.data || []).reduce(
    (acc: any, row: any) => {
      acc.pageViews += Number(row.page_views || 0);
      acc.uniqueVisitors += Number(row.unique_visitors || 0);
      acc.enquiries += Number(row.enquiries || 0);
      acc.requests += Number(row.requests || 0);
      acc.visits += Number(row.visits || 0);
      acc.edgeBytes += Number(row.edge_bytes || 0);
      if (row.source === "cloudflare_http") acc.providerRows += 1;
      return acc;
    },
    {
      days: 30,
      pageViews: 0,
      uniqueVisitors: 0,
      enquiries: 0,
      requests: 0,
      visits: 0,
      edgeBytes: 0,
      providerRows: 0,
      status: website.analytics_status || "foundation",
      lastSyncAt: website.analytics_last_sync_at || null,
    }
  );

  const usage = (usageRows.data || []).reduce(
    (acc: any, row: any) => {
      acc.deployments += Number(row.deployments_created || 0);
      acc.publishedVersions += Number(row.versions_published || 0);
      acc.artifactBytes += Number(row.artifact_bytes || 0);
      acc.requests += Number(row.requests || 0);
      acc.visits += Number(row.visits || 0);
      acc.edgeBytes += Number(row.edge_bytes || 0);
      acc.healthChecks += Number(row.health_checks || 0);
      acc.activeCustomDomains = Math.max(
        acc.activeCustomDomains,
        Number(row.active_custom_domains || 0)
      );
      return acc;
    },
    {
      days: 30,
      deployments: 0,
      publishedVersions: 0,
      artifactBytes: 0,
      requests: 0,
      visits: 0,
      edgeBytes: 0,
      healthChecks: 0,
      activeCustomDomains: 0,
    }
  );

  return {
    website,
    deployments: deployments.data || [],
    domains: domains.data || [],
    jobs: jobs.data || [],
    queue,
    healthChecks: healthChecks.data || [],
    analytics,
    usage,
    signalRuns: signalRuns.data || [],
    enquiryAttributions: enquiryAttributions.data || [],
    publicProfile: publicProfile.data || null,
    providerConfig: providerStatus.config || websiteProviderConfig(),
    providerPreflight: providerStatus.preflight || null,
    providerPlatform: providerStatus.platform || null,
    providerActivation: providerStatus.activation || null,
    providerStatusReachable: providerStatus.reachable !== false,
    providerStatusError: providerStatus.error || null,
  };
}

async function enqueueJob({
  businessId,
  websiteId,
  deploymentId,
  action,
  userId,
  idempotencyKey,
  payload = {},
}: {
  businessId: string;
  websiteId: string;
  deploymentId: string;
  action: "prepare" | "publish" | "rollback";
  userId: string;
  idempotencyKey: string;
  payload?: Record<string, unknown>;
}) {
  const active = await supabase
    .from("busy_website_publish_jobs")
    .select("*")
    .eq("website_id", websiteId)
    .in("status", ["queued", "processing", "retry_wait"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active.error) throw active.error;
  if (active.data) {
    if (
      active.data.deployment_id === deploymentId &&
      active.data.action === action
    ) {
      return active.data;
    }
    throw new Error(
      "BUSY is already processing another website operation. It will finish that safely before starting this one."
    );
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60000).toISOString();
  const recent = await supabase
    .from("busy_website_publish_jobs")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("requested_at", oneHourAgo);
  if (recent.error) throw recent.error;
  if (Number(recent.count || 0) >= 30) {
    throw new Error(
      "BUSY has temporarily paused new website operations for this business because unusually high publishing activity was detected. Existing live content is unaffected."
    );
  }

  const existing = await supabase
    .from("busy_website_publish_jobs")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const created = await supabase
    .from("busy_website_publish_jobs")
    .insert({
      business_id: businessId,
      website_id: websiteId,
      deployment_id: deploymentId,
      action,
      status: "queued",
      idempotency_key: idempotencyKey,
      payload,
      requested_by: userId,
    })
    .select("*")
    .single();
  if (created.error) {
    if (created.error.code === "23505") {
      const raced = await supabase
        .from("busy_website_publish_jobs")
        .select("*")
        .eq("website_id", websiteId)
        .in("status", ["queued", "processing", "retry_wait"])
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (raced.error) throw raced.error;
      if (raced.data) {
        if (
          raced.data.deployment_id === deploymentId &&
          raced.data.action === action
        ) {
          return raced.data;
        }
        throw new Error(
          "BUSY is already processing another website operation. Try again after that operation finishes."
        );
      }
    }
    throw created.error;
  }

  const queued = await supabase.rpc("busy_enqueue_website_publish_job", {
    p_job_id: created.data.id,
  });
  if (queued.error) {
    await supabase
      .from("busy_website_publish_jobs")
      .update({
        status: "failed",
        last_error: queued.error.message,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", created.data.id);
    throw queued.error;
  }

  await wakeWorker();
  return created.data;
}

async function wakeWorker() {
  const claim = await supabase.rpc("busy_should_wake_website_worker", {
    p_min_gap_seconds: 5,
  });
  if (claim.error || claim.data !== true) return false;

  const promise = fetch(WORKER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 5 }),
  }).catch(() => null);

  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) {
    runtime.waitUntil(promise);
  } else {
    await promise;
  }
  return true;
}

async function prepare(
  userId: string,
  businessId: string,
  body: any,
  requestId: string
) {
  const input = body?.websiteDraft;
  if (!input || typeof input !== "object") {
    throw new Error("Build a website draft before preparing a hosted version.");
  }

  const sourceDraft = { ...input };
  delete sourceDraft.html;

  const website = await ensureWebsite(businessId, userId, sourceDraft);
  let previousLiveDraft: any = null;
  if (website.current_live_deployment_id) {
    const live = await supabase
      .from("busy_website_deployments")
      .select("source_draft")
      .eq("id", website.current_live_deployment_id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (live.error) throw live.error;
    previousLiveDraft = live.data?.source_draft || null;
  }
  const changeSummary = summarizeDraftChanges(previousLiveDraft, sourceDraft);
  const serialized = JSON.stringify(sourceDraft);
  if (!serialized || serialized.length > 1_000_000) {
    throw new Error("The website draft is too large to prepare safely.");
  }

  const contentHash = await sha256(serialized);
  const existing = await supabase
    .from("busy_website_deployments")
    .select("*")
    .eq("website_id", website.id)
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (existing.error) throw existing.error;

  let deployment = existing.data;
  if (!deployment) {
    const allocated = await supabase.rpc("busy_allocate_website_version", {
      p_website_id: website.id,
    });
    if (allocated.error) throw allocated.error;

    const inserted = await supabase
      .from("busy_website_deployments")
      .insert({
        business_id: businessId,
        website_id: website.id,
        version_no: Number(allocated.data) || 1,
        source_generation: Math.max(1, Number(sourceDraft.generation) || 1),
        content_hash: contentHash,
        state: "queued",
        source_draft: sourceDraft,
        change_label: cleanText(changeSummary.headline, 240) || "Website update",
        change_summary: changeSummary,
        page_count: Math.max(1, safeArray(sourceDraft.pages).length || 1),
        created_by: userId,
      })
      .select("*")
      .single();
    if (inserted.error) {
      if (inserted.error.code === "23505") {
        const raced = await supabase
          .from("busy_website_deployments")
          .select("*")
          .eq("website_id", website.id)
          .eq("content_hash", contentHash)
          .maybeSingle();
        if (raced.error) throw raced.error;
        if (!raced.data) throw inserted.error;
        deployment = raced.data;
      } else {
        throw inserted.error;
      }
    } else {
      deployment = inserted.data;
    }
  }

  await syncPublicProfile({
    businessId,
    websiteId: website.id,
    deploymentId: deployment.id,
    userId,
    draft: sourceDraft,
    revision: Number(deployment.version_no) || 1,
    status: deployment.state === "live" ? "live" : deployment.state === "preview_ready" ? "preview_ready" : "draft",
  });

  if (["preview_ready", "live"].includes(deployment.state)) {
    return {
      ok: true,
      reused: true,
      website,
      deployment,
      status: await websiteStatus(businessId),
    };
  }

  await supabase
    .from("busy_website_deployments")
    .update({ state: "queued", last_error: null })
    .eq("id", deployment.id);

  await supabase
    .from("busy_websites")
    .update({
      status: website.current_live_deployment_id ? "update_pending" : "queued",
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", website.id);

  const job = await enqueueJob({
    businessId,
    websiteId: website.id,
    deploymentId: deployment.id,
    action: "prepare",
    userId,
    idempotencyKey: requestId || `prepare:${deployment.id}:${Date.now()}`,
    payload: { sourceGeneration: deployment.source_generation },
  });

  return { ok: true, reused: false, website, deployment, job };
}

async function launchPreflight(businessId: string, deploymentId: string) {
  if (!deploymentId) return evaluateLaunchPreflight();
  const website=await websiteForBusiness(businessId);
  if (!website?.id) return evaluateLaunchPreflight();
  const result=await supabase
    .from("busy_website_deployments")
    .select("id,website_id,business_id,state,preview_storage_path,content_hash")
    .eq("id",deploymentId)
    .eq("business_id",businessId)
    .eq("website_id",website.id)
    .maybeSingle();
  if(result.error)throw result.error;
  return evaluateLaunchPreflight({website,deployment:result.data});
}

async function publish(
  userId: string,
  businessId: string,
  body: any,
  requestId: string
) {
  if (body?.ownerApproved !== true) {
    throw new Error("Owner approval is required before a website can go live.");
  }

  const deploymentId = cleanText(body?.deploymentId, 80);
  if (!deploymentId) throw new Error("Choose a prepared website version first.");
  const deployment = await supabase
    .from("busy_website_deployments")
    .select("*")
    .eq("id", deploymentId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (deployment.error) throw deployment.error;
  if (!deployment.data) throw new Error("That website version does not belong to this business.");
  const website=await websiteForBusiness(businessId);
  const preflight=evaluateLaunchPreflight({website,deployment:deployment.data});
  if(preflight.alreadyLive) {
    return {ok:true,reused:true,deployment:deployment.data};
  }
  if(!preflight.canApprove) {
    throw new Error(preflight.issues[0]||
      "The selected hosted version is not ready for a safe Go Live approval.");
  }

  await supabase
    .from("busy_websites")
    .update({
      status: "update_pending",
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deployment.data.website_id);

  const job = await enqueueJob({
    businessId,
    websiteId: deployment.data.website_id,
    deploymentId,
    action: "publish",
    userId,
    idempotencyKey: requestId || `publish:${deploymentId}:${Date.now()}`,
    payload: { ownerApproved: true },
  });
  return { ok: true, job, deployment: deployment.data };
}

async function rollback(
  userId: string,
  businessId: string,
  body: any,
  requestId: string
) {
  if (body?.ownerApproved !== true) {
    throw new Error("Owner approval is required before changing the live website.");
  }
  const deploymentId = cleanText(body?.deploymentId, 80);
  const deployment = await supabase
    .from("busy_website_deployments")
    .select("*")
    .eq("id", deploymentId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (deployment.error) throw deployment.error;
  if (!deployment.data?.published_at || !deployment.data.public_storage_path) {
    throw new Error("Only a previously published website version can be restored.");
  }
  const mainWebsite=await websiteForBusiness(businessId);
  if(!mainWebsite?.id||deployment.data.website_id!==mainWebsite.id) {
    throw new Error("Only this business's main website can be restored.");
  }

  const job = await enqueueJob({
    businessId,
    websiteId: deployment.data.website_id,
    deploymentId,
    action: "rollback",
    userId,
    idempotencyKey: requestId || `rollback:${deploymentId}:${Date.now()}`,
    payload: { ownerApproved: true },
  });
  return { ok: true, job, deployment: deployment.data };
}

async function previewUrl(businessId: string, deploymentId: string) {
  const deployment = await supabase
    .from("busy_website_deployments")
    .select("id,business_id,state,preview_storage_path")
    .eq("id", deploymentId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (deployment.error) throw deployment.error;
  if (!deployment.data?.preview_storage_path) {
    throw new Error("That deployment does not have a hosted preview yet.");
  }
  const signed = await supabase.storage
    .from(PREVIEW_BUCKET)
    .createSignedUrl(deployment.data.preview_storage_path, 3600);
  if (signed.error) throw signed.error;
  return {
    previewUrl: signed.data.signedUrl,
    expiresInSeconds: 3600,
  };
}

async function requestDomain(
  userId: string,
  businessId: string,
  body: any
) {
  const hostname = normalizeHostname(body?.hostname);
  if (!validHostname(hostname)) throw new Error("Enter a valid custom domain, such as example.co.uk.");
  if (
    hostname === BUSY_ROOT_DOMAIN ||
    hostname.endsWith(`.${BUSY_ROOT_DOMAIN}`)
  ) {
    throw new Error(
      "BUSY platform hostnames are reserved. Connect a domain owned by this business instead."
    );
  }

  const website =
    (await websiteForBusiness(businessId)) ||
    (await ensureWebsite(businessId, userId, body?.websiteDraft || {}));

  const existing = await supabase
    .from("busy_website_domains")
    .select("*")
    .eq("hostname", hostname)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data && existing.data.business_id !== businessId) {
    throw new Error("That domain is already attached to another BUSY business.");
  }
  if (existing.data) return existing.data;

  const domainCapacity = await supabase
    .from("busy_website_domains")
    .select("id")
    .eq("website_id", website.id)
    .neq("status", "disabled")
    .limit(6);
  if (domainCapacity.error) throw domainCapacity.error;
  if ((domainCapacity.data || []).length >= 5) {
    throw new Error(
      "This BUSY website already has the maximum number of active or pending custom domains. Remove or disable an old domain before adding another."
    );
  }

  const token = crypto.randomUUID();
  const inserted = await supabase
    .from("busy_website_domains")
    .insert({
      business_id: businessId,
      website_id: website.id,
      hostname,
      verification_token: token,
      required_records: [
        {
          purpose: "ownership",
          type: "TXT",
          name: `_busy-verify.${hostname}`,
          value: token,
        },
      ],
      created_by: userId,
    })
    .select("*")
    .single();
  if (inserted.error) throw inserted.error;
  return inserted.data;
}

async function verifyDomain(businessId: string, domainId: string) {
  const domain = await supabase
    .from("busy_website_domains")
    .select("*")
    .eq("id", domainId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (domain.error) throw domain.error;
  if (!domain.data) throw new Error("Domain record not found.");

  const verificationName = `_busy-verify.${domain.data.hostname}`;
  const response = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
      verificationName
    )}&type=TXT`,
    { headers: { Accept: "application/dns-json" },signal:AbortSignal.timeout(10000) }
  );
  if(!response.ok)throw Error("Domain ownership check is temporarily unavailable. Your records were not changed.");
  const payload: any = await response.json().catch(() => ({}));
  const found = isVerifiedDomainTxtAnswer(payload,{
    hostname:domain.data.hostname,token:domain.data.verification_token
  });

  if (!found) {
    return {
      verified: false,
      domain: domain.data,
      verificationName,
      verificationValue: domain.data.verification_token,
    };
  }

  const updated = await supabase
    .from("busy_website_domains")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", domainId)
    .select("*")
    .single();
  if (updated.error) throw updated.error;

  return {
    verified: true,
    domain: updated.data,
    verificationName,
    verificationValue: domain.data.verification_token,
  };
}


async function provisionDomainProvider(
  businessId: string,
  domainId: string
) {
  const domain = await supabase
    .from("busy_website_domains")
    .select("id,business_id,status")
    .eq("id", domainId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (domain.error) throw domain.error;
  if (!domain.data) throw new Error("Domain record not found.");
  if (!["verified", "active"].includes(domain.data.status)) {
    throw new Error("Verify domain ownership before preparing external routing.");
  }
  return await internalWebsiteRequest(PROVIDER_URL, {
    action: "provision_domain",
    domainId,
  });
}

async function continueVerifiedDomainActivation(
  businessId: string,
  domainId: string
) {
  try {
    return {
      attempted: true,
      provider: await provisionDomainProvider(businessId, domainId),
      error: "",
    };
  } catch (error) {
    // Ownership verification is an independent fact. Do not turn a temporary
    // provider problem into a false "verification failed" result; the
    // scheduled provider reconciler can safely continue from here.
    return {
      attempted: true,
      provider: null,
      error:
        error instanceof Error
          ? error.message
          : "BUSY could not continue custom-domain activation yet.",
    };
  }
}

async function refreshWebsiteSignals(businessId: string) {
  const website = await websiteForBusiness(businessId);
  if (!website?.id) throw new Error("Build the website before refreshing website signals.");
  return await internalWebsiteRequest(SIGNALS_URL, {
    action: "sync_analytics",
  });
}

async function runHealthCheck(businessId: string) {
  const website = await websiteForBusiness(businessId);
  if (!website?.id || !website?.current_live_deployment_id) {
    throw new Error("Publish a website version before running a live-site health check.");
  }

  const response = await fetch(HEALTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ websiteId: website.id, limit: 1 }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || "BUSY could not complete the live-site health check.");
  }
  return data;
}

async function safeRecovery(businessId: string) {
  const website = await websiteForBusiness(businessId);
  if (!website?.id || !website?.current_live_deployment_id) {
    throw new Error("Publish a website version before running hosting recovery.");
  }

  const actions: any[] = [];

  try {
    const platform = await internalWebsiteRequest(PROVIDER_URL, {
      action: "reconcile_platform",
    });
    actions.push({
      area: "platform",
      ok: true,
      status: platform?.activation?.status || "checked",
    });
  } catch (error) {
    actions.push({
      area: "platform",
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "BUSY platform routing check failed.",
    });
  }

  const domain = await supabase
    .from("busy_website_domains")
    .select("id,status,routing_status,ssl_status")
    .eq("business_id", businessId)
    .eq("website_id", website.id)
    .in("status", ["verified", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (domain.error) throw domain.error;

  if (domain.data?.id) {
    try {
      const provider = await internalWebsiteRequest(PROVIDER_URL, {
        action: "provision_domain",
        domainId: domain.data.id,
      });
      actions.push({
        area: "custom_domain",
        ok: true,
        readyForHealthCheck: !!provider?.readyForHealthCheck,
      });
    } catch (error) {
      actions.push({
        area: "custom_domain",
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "BUSY custom-domain recovery could not complete yet.",
      });
    }
  }

  try {
    const health = await runHealthCheck(businessId);
    actions.push({
      area: "health",
      ok: true,
      checked: Number(health?.checked || 0),
    });
  } catch (error) {
    actions.push({
      area: "health",
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "BUSY live-site recovery check failed.",
    });
  }

  return {
    ok: actions.some((item) => item.ok),
    actions,
  };
}

/** V3.78 owner-scoped manual lead workflow; NOT a public website form.
 * All calls pass the existing authenticated business owner/admin membership.
 * There is no AI processing and no message is sent to the customer.
 */
async function listWebsiteLeads(businessId:string){
  const result=await supabase.from("busy_website_leads")
    .select("id,name,contact_method,contact_value,service_requested,notes,status,created_at")
    .eq("business_id",businessId).order("created_at",{ascending:false}).limit(25);
  if(result.error)throw result.error;
  return buildLeadDigest(result.data);
}
async function addWebsiteLead(userId:string,businessId:string,body:any){
  const checked=validatedLeadInput(body);
  if(!checked.ok)throw new Error(checked.error);
  const website=await websiteForBusiness(businessId);
  const values={...checked.record,created_by:userId,business_id:businessId,
    website_id:website?.id||null};
  const inserted=await supabase.from("busy_website_leads")
    .insert(values).select("id").single();
  if(inserted.error){
    if(inserted.error.code!=="23505")throw inserted.error;
    const duplicate=await supabase.from("busy_website_leads")
      .select("id").eq("business_id",businessId)
      .eq("request_key",checked.record.request_key).maybeSingle();
    if(duplicate.error||!duplicate.data?.id)
      throw new Error("Could not verify duplicate lead request.");
    return {created:false,reused:true};
  }
  return {created:true,reused:false};
}
async function updateWebsiteLead(businessId:string,body:any){
  const id=cleanText(body?.id,80);
  const expected=cleanText(body?.expectedStatus,20);
  const next=cleanText(body?.nextStatus,20);
  if(!/^[0-9a-f-]{36}$/i.test(id)||!validTransition(expected,next))
    throw new Error("Invalid lead transition. Refresh your lead list.");
  const update=await supabase.from("busy_website_leads")
    .update({status:next,updated_at:new Date().toISOString()})
    .eq("business_id",businessId).eq("id",id).eq("status",expected)
    .select("id,status");
  if(update.error)throw update.error;
  if(!Array.isArray(update.data)||update.data.length!==1)
    throw new Error("The lead changed or no longer exists. Refresh before trying again.");
  return {updated:true,status:next,customerContactSent:false};
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "POST required" });

  try {
    const user = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const action = cleanText(body?.action, 80);
    const requestedBusinessId = cleanText(body?.businessId, 80);
    const writeActions = new Set([
      "prepare",
      "publish",
      "launch_preflight",
      "lead_list",
      "lead_add",
      "lead_update",
      "rollback",
      "request_domain",
      "verify_domain",
      "provision_domain",
      "recover",
      "refresh_signals",
    ]);
    const member = await membership(
      user.id,
      requestedBusinessId,
      writeActions.has(action)
    );
    const businessId = member.business_id;
    const requestId =
      cleanText(request.headers.get("x-busy-request-id"), 180) ||
      cleanText(body?.idempotencyKey, 180);

    if(action==="lead_list"){
      return json(200,{ok:true,leads:await listWebsiteLeads(businessId)});
    }
    if(action==="lead_add"){
      return json(200,{ok:true,
        result:await addWebsiteLead(user.id,businessId,body)});
    }
    if(action==="lead_update"){
      return json(200,{ok:true,
        result:await updateWebsiteLead(businessId,body)});
    }
    if (action === "status") {
      return json(200, {
        ok: true,
        businessId,
        role: member.role,
        ...(await websiteStatus(businessId)),
      });
    }
    if (action === "prepare") {
      return json(200, await prepare(user.id, businessId, body, requestId));
    }
    if (action === "preview_url") {
      const deploymentId = cleanText(body?.deploymentId, 80);
      return json(200, {
        ok: true,
        ...(await previewUrl(businessId, deploymentId)),
      });
    }
    if (action === "launch_preflight") {
      return json(200,{
        ok:true,
        preflight:await launchPreflight(businessId,cleanText(body?.deploymentId,80))
      });
    }
    if (action === "publish") {
      return json(200, await publish(user.id, businessId, body, requestId));
    }
    if (action === "rollback") {
      return json(200, await rollback(user.id, businessId, body, requestId));
    }
    if (action === "request_domain") {
      const domain = await requestDomain(user.id, businessId, body);
      return json(200, {
        ok: true,
        domain,
        verificationName: `_busy-verify.${domain.hostname}`,
        verificationValue: domain.verification_token,
      });
    }
    if (action === "verify_domain") {
      const domainId = cleanText(body?.domainId, 80);
      const verification = await verifyDomain(businessId, domainId);
      const activation = verification.verified
        ? await continueVerifiedDomainActivation(businessId, domainId)
        : { attempted: false, provider: null, error: "" };
      return json(200, {
        ok: true,
        ...verification,
        activation,
        status: await websiteStatus(businessId),
      });
    }
    if (action === "provision_domain") {
      const domainId = cleanText(body?.domainId, 80);
      return json(200, {
        ok: true,
        provider: await provisionDomainProvider(businessId, domainId),
        status: await websiteStatus(businessId),
      });
    }
    if (action === "recover") {
      return json(200, {
        ok: true,
        recovery: await safeRecovery(businessId),
        status: await websiteStatus(businessId),
      });
    }
    if (action === "refresh_signals") {
      return json(200, {
        ok: true,
        signals: await refreshWebsiteSignals(businessId),
        status: await websiteStatus(businessId),
      });
    }
    if (action === "health_check") {
      return json(200, {
        ok: true,
        health: await runHealthCheck(businessId),
        status: await websiteStatus(businessId),
      });
    }

    return json(400, { error: "Unknown website publishing action." });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : "Website publishing request failed.",
    });
  }
});
