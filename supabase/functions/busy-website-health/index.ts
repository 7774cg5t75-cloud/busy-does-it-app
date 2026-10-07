import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

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

  const supplied = request.headers.get("x-busy-health-token") || "";
  if (!supplied) return false;
  const token = await supabase
    .from("busy_internal_config")
    .select("value")
    .eq("key", "website_health_token")
    .maybeSingle();
  if (token.error || !token.data?.value) return false;
  return supplied === token.data.value;
}

async function fetchWithDeadline(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "BUSY-Website-Health/3.46",
        Accept: "text/html,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      responseMs: Date.now() - started,
      text: text.slice(0, 500000),
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      responseMs: Date.now() - started,
      text: "",
      error: error instanceof Error ? error.message : "Website health request failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function deploymentMarker(html: string) {
  const match = html.match(
    /<meta\s+name=["']busy-deployment["']\s+content=["']([0-9a-f-]{36})["']/i
  );
  return match?.[1] || "";
}

async function knownDeployment(marker: string, websiteId: string) {
  if (!marker) return null;
  const result = await supabase
    .from("busy_website_deployments")
    .select("id")
    .eq("id", marker)
    .eq("website_id", websiteId)
    .maybeSingle();
  if (result.error) return null;
  return result.data?.id || null;
}

async function recordCheck({
  website,
  domain = null,
  targetType,
  url,
}: {
  website: any;
  domain?: any;
  targetType: "live_alias" | "default_domain" | "custom_domain";
  url: string;
}) {
  const result = await fetchWithDeadline(url);
  const marker = deploymentMarker(result.text);
  const expected = clean(website.current_live_deployment_id, 80);
  const observed = await knownDeployment(marker, website.id);

  let status: "healthy" | "degraded" | "down" = "down";
  let error = result.error;
  if (result.ok && observed === expected) {
    status = "healthy";
  } else if (result.ok) {
    status = "degraded";
    error = marker
      ? `Expected deployment ${expected}; observed ${marker}.`
      : "Site responded but did not expose a BUSY deployment marker.";
  } else if (!error) {
    error = `Site returned HTTP ${result.status || "error"}.`;
  }

  const inserted = await supabase
    .from("busy_website_health_checks")
    .insert({
      business_id: website.business_id,
      website_id: website.id,
      deployment_id: website.current_live_deployment_id,
      domain_id: domain?.id || null,
      target_type: targetType,
      checked_url: url,
      status,
      http_status: result.status || null,
      response_ms: Math.max(0, Number(result.responseMs) || 0),
      expected_deployment_id: website.current_live_deployment_id,
      observed_deployment_id: observed,
      last_error: error || null,
    });
  if (inserted.error) throw inserted.error;

  return {
    status,
    httpStatus: result.status || null,
    responseMs: result.responseMs,
    observedDeploymentId: observed,
    error: error || "",
  };
}

async function checkWebsite(website: any) {
  const checkedAt = new Date().toISOString();
  const liveUrl = clean(website.live_url, 4000);
  if (!liveUrl) {
    await supabase
      .from("busy_websites")
      .update({
        health_status: "down",
        last_health_check_at: checkedAt,
        last_error: "Live website has no recorded public URL.",
      })
      .eq("id", website.id);
    return { websiteId: website.id, status: "down", reason: "missing_live_url" };
  }

  const live = await recordCheck({
    website,
    targetType: "live_alias",
    url: liveUrl,
  });

  const domains = await supabase
    .from("busy_website_domains")
    .select("*")
    .eq("website_id", website.id)
    .eq("ssl_status", "active")
    .in("routing_status", ["validating", "active"]);
  if (domains.error) throw domains.error;

  const domainResults = [];
  for (const domain of domains.data || []) {
    domainResults.push(
      await recordCheck({
        website,
        domain,
        targetType: "custom_domain",
        url: `https://${domain.hostname}/`,
      })
    );
    const domainResult = domainResults.at(-1);
    const domainUpdate: Record<string, unknown> = {
      last_checked_at: checkedAt,
      last_error:
        domainResult?.status === "healthy"
          ? null
          : domainResult?.error || "Domain health check failed.",
      updated_at: checkedAt,
    };
    if (domainResult?.status === "healthy") {
      domainUpdate.routing_status = "active";
      domainUpdate.status = "active";
      domainUpdate.activated_at = domain.activated_at || checkedAt;
    }
    await supabase
      .from("busy_website_domains")
      .update(domainUpdate)
      .eq("id", domain.id);
  }

  let defaultResult: any = null;
  if (
    website.default_url &&
    ["provisioning", "active"].includes(clean(website.delivery_status, 80))
  ) {
    defaultResult = await recordCheck({
      website,
      targetType: "default_domain",
      url: website.default_url,
    });
  }

  const update: Record<string, unknown> = {
    health_status: live.status,
    last_health_check_at: checkedAt,
    last_observed_deployment_id: live.observedDeploymentId,
    updated_at: checkedAt,
  };
  if (live.status === "healthy") {
    update.last_healthy_at = checkedAt;
    update.last_error = null;
  } else {
    update.last_error = live.error || "Live website health check failed.";
  }
  if (defaultResult?.status === "healthy") {
    update.delivery_status = "active";
    update.delivery_provider = "cloudflare_saas";
  } else if (
    website.default_url &&
    website.delivery_status === "provisioning" &&
    defaultResult
  ) {
    update.delivery_status = "degraded";
  }

  const saved = await supabase
    .from("busy_websites")
    .update(update)
    .eq("id", website.id);
  if (saved.error) throw saved.error;

  return {
    websiteId: website.id,
    status: live.status,
    live,
    domains: domainResults,
    defaultDomain: defaultResult,
  };
}

async function websitesToCheck(websiteId: string, limit: number) {
  let query = supabase
    .from("busy_websites")
    .select("*")
    .not("current_live_deployment_id", "is", null);

  if (websiteId) {
    query = query.eq("id", websiteId);
  } else {
    query = query
      .order("last_health_check_at", {
        ascending: true,
        nullsFirst: true,
      })
      .limit(limit);
  }

  const result = websiteId ? await query.limit(1) : await query;
  if (result.error) throw result.error;
  return result.data || [];
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json(405, { error: "POST required" });
  if (!(await validRequest(request))) {
    return json(401, { error: "Internal BUSY website-health authentication required." });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const websiteId = clean(body?.websiteId, 80);
    const limit = Math.min(40, Math.max(1, Number(body?.limit) || 20));
    const websites = await websitesToCheck(websiteId, limit);
    const results = [];

    // Small concurrent groups keep scheduled checks bounded without making
    // thousands of sites wait on one serial HTTP chain.
    for (let offset = 0; offset < websites.length; offset += 8) {
      const group = websites.slice(offset, offset + 8);
      results.push(...(await Promise.all(group.map(checkWebsite))));
    }

    await supabase.rpc("busy_prune_website_health_checks");

    return json(200, {
      ok: true,
      checked: results.length,
      results,
    });
  } catch (error) {
    return json(500, {
      error:
        error instanceof Error
          ? error.message
          : "BUSY website health check failed.",
    });
  }
});
