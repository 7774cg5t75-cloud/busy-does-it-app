import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN") || "";
const CLOUDFLARE_ZONE_ID = Deno.env.get("CLOUDFLARE_SAAS_ZONE_ID") || "";
const CLOUDFLARE_GRAPHQL = "https://api.cloudflare.com/client/v4/graphql";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function clean(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function validRequest(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (authorization === `Bearer ${SERVICE_ROLE_KEY}`) return true;
  const supplied = request.headers.get("x-busy-signals-token") || "";
  if (!supplied) return false;
  const token = await supabase
    .from("busy_internal_config")
    .select("value")
    .eq("key", "website_signals_token")
    .maybeSingle();
  if (token.error || !token.data?.value) return false;
  return supplied === token.data.value;
}

function configured() {
  return !!(CLOUDFLARE_API_TOKEN && CLOUDFLARE_ZONE_ID);
}

function dateWindow(value?: string) {
  const date = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 86400000);
  const now = new Date();
  return {
    metricDate: date,
    start: start.toISOString(),
    end: (end > now ? now : end).toISOString(),
  };
}

async function hostnameMap() {
  const domains = await supabase
    .from("busy_website_domains")
    .select("id,business_id,website_id,hostname,routing_status,ssl_status")
    .eq("routing_provider", "cloudflare_saas")
    .eq("routing_status", "active")
    .eq("ssl_status", "active");
  if (domains.error) throw domains.error;

  const websites = await supabase
    .from("busy_websites")
    .select("id,business_id,default_hostname,delivery_status")
    .eq("delivery_provider", "cloudflare_saas")
    .eq("delivery_status", "active")
    .not("default_hostname", "is", null);
  if (websites.error) throw websites.error;

  const map = new Map<string, any>();
  for (const domain of domains.data || []) {
    map.set(String(domain.hostname).toLowerCase(), {
      businessId: domain.business_id,
      websiteId: domain.website_id,
      domainId: domain.id,
      hostname: domain.hostname,
    });
  }
  for (const website of websites.data || []) {
    map.set(String(website.default_hostname).toLowerCase(), {
      businessId: website.business_id,
      websiteId: website.id,
      domainId: null,
      hostname: website.default_hostname,
    });
  }
  return map;
}

async function cloudflareTraffic(window: any) {
  const query = `
    query BusyWebsiteTraffic($zoneTag: string, $filter: filter) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequestsAdaptiveGroups(
            limit: 10000
            orderBy: [count_DESC]
            filter: $filter
          ) {
            count
            avg { sampleInterval }
            sum { visits edgeResponseBytes }
            dimensions { clientRequestHTTPHost clientRequestPath }
          }
        }
      }
    }
  `;
  const response = await fetch(CLOUDFLARE_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        zoneTag: CLOUDFLARE_ZONE_ID,
        filter: {
          datetime_geq: window.start,
          datetime_lt: window.end,
          requestSource: "eyeball",
        },
      },
    }),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || body?.errors?.length) {
    const detail =
      body?.errors?.map((item: any) => clean(item?.message, 600)).filter(Boolean).join(" • ") ||
      `Cloudflare analytics returned ${response.status}.`;
    throw new Error(detail);
  }
  return body?.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];
}

async function syncAnalytics(metricDate?: string) {
  if (!configured()) {
    return {
      configured: false,
      provider: "cloudflare_saas",
      rowsWritten: 0,
      reason: "Cloudflare analytics secrets are not configured.",
    };
  }

  const window = dateWindow(metricDate);
  const known = await hostnameMap();
  if (!known.size) {
    return {
      configured: true,
      provider: "cloudflare_saas",
      metricDate: window.metricDate,
      rowsWritten: 0,
      reason: "No active Cloudflare-routed BUSY hostnames yet.",
    };
  }

  const groups = await cloudflareTraffic(window);
  const aggregate = new Map<string, any>();
  for (const group of Array.isArray(groups) ? groups : []) {
    const hostname = clean(group?.dimensions?.clientRequestHTTPHost, 500).toLowerCase();
    const site = known.get(hostname);
    if (!site) continue;
    const path = clean(group?.dimensions?.clientRequestPath, 1000) || "/";
    const key = `${site.websiteId}|${path}`;
    const prior = aggregate.get(key) || {
      ...site,
      pagePath: path,
      requests: 0,
      visits: 0,
      edgeBytes: 0,
      weightedSample: 0,
      sampleWeight: 0,
    };
    const count = Math.max(0, Number(group?.count) || 0);
    const sample = Math.max(0, Number(group?.avg?.sampleInterval) || 0);
    prior.requests += count;
    prior.visits += Math.max(0, Number(group?.sum?.visits) || 0);
    prior.edgeBytes += Math.max(0, Number(group?.sum?.edgeResponseBytes) || 0);
    prior.weightedSample += sample * Math.max(count, 1);
    prior.sampleWeight += Math.max(count, 1);
    aggregate.set(key, prior);
  }

  let rowsWritten = 0;
  const touchedWebsites = new Set<string>();
  for (const row of aggregate.values()) {
    const upsert = await supabase
      .from("busy_website_analytics_daily")
      .upsert(
        {
          business_id: row.businessId,
          website_id: row.websiteId,
          metric_date: window.metricDate,
          page_path: row.pagePath,
          source: "cloudflare_http",
          requests: Math.round(row.requests),
          visits: Math.round(row.visits),
          edge_bytes: Math.round(row.edgeBytes),
          sample_interval:
            row.sampleWeight > 0 ? row.weightedSample / row.sampleWeight : null,
          provider_meta: {
            provider: "cloudflare_saas",
            hostname: row.hostname,
            syncedAt: new Date().toISOString(),
            groupLimit: 10000,
            possiblePartialResult: Array.isArray(groups) && groups.length >= 10000,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "website_id,metric_date,page_path,source" }
      );
    if (upsert.error) throw upsert.error;
    rowsWritten += 1;
    touchedWebsites.add(row.websiteId);
  }

  for (const websiteId of touchedWebsites) {
    await supabase
      .from("busy_websites")
      .update({
        analytics_provider: "cloudflare_http",
        analytics_status: "active",
        analytics_last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", websiteId);
  }

  await supabase
    .from("busy_website_domains")
    .update({ last_analytics_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("routing_provider", "cloudflare_saas")
    .eq("routing_status", "active")
    .eq("ssl_status", "active");

  await supabase.rpc("busy_refresh_website_usage_daily", {
    p_usage_date: window.metricDate,
  });

  return {
    configured: true,
    provider: "cloudflare_saas",
    metricDate: window.metricDate,
    hostnamesKnown: known.size,
    groupsRead: Array.isArray(groups) ? groups.length : 0,
    rowsWritten,
    possiblePartialResult: Array.isArray(groups) && groups.length >= 10000,
  };
}

async function writeRuns(result: any) {
  const websites = await supabase
    .from("busy_websites")
    .select("id,business_id")
    .eq("analytics_provider", "cloudflare_http");
  if (websites.error) return;

  const status = result.configured
    ? result.possiblePartialResult
      ? "failed"
      : "succeeded"
    : "skipped";
  for (const website of websites.data || []) {
    await supabase.from("busy_website_signal_runs").insert({
      business_id: website.business_id,
      website_id: website.id,
      provider: "cloudflare_saas",
      signal_type: "analytics_sync",
      status,
      rows_written: Number(result.rowsWritten || 0),
      detail: {
        metricDate: result.metricDate || null,
        groupsRead: Number(result.groupsRead || 0),
        possiblePartialResult: !!result.possiblePartialResult,
      },
      last_error: result.possiblePartialResult
        ? "Cloudflare group result reached the V3.38 safety limit; time-sharded continuation is required."
        : null,
      completed_at: new Date().toISOString(),
    });
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json(405, { error: "POST required" });
  if (!(await validRequest(request))) {
    return json(401, { error: "Internal BUSY website-signals authentication required." });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = clean(body?.action, 80) || "status";
    if (action === "status") {
      return json(200, {
        ok: true,
        provider: "cloudflare_saas",
        configured: configured(),
        hasApiToken: !!CLOUDFLARE_API_TOKEN,
        hasZoneId: !!CLOUDFLARE_ZONE_ID,
      });
    }
    if (action === "sync_analytics") {
      const result = await syncAnalytics(clean(body?.metricDate, 20));
      await writeRuns(result);
      return json(200, { ok: true, ...result });
    }
    if (action === "refresh_usage") {
      const metricDate = clean(body?.metricDate, 20) || new Date().toISOString().slice(0, 10);
      const rolled = await supabase.rpc("busy_refresh_website_usage_daily", {
        p_usage_date: metricDate,
      });
      if (rolled.error) throw rolled.error;
      return json(200, {
        ok: true,
        metricDate,
        rowsWritten: Number(rolled.data || 0),
      });
    }
    return json(400, { error: "Unknown website signals action." });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Website signal sync failed.",
    });
  }
});
