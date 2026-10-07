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

async function fetchWithDeadline(url: string, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "BUSY-Website-Health/3.53",
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

async function failureStreak(
  websiteId: string,
  targetType: "live_alias" | "default_domain" | "custom_domain",
  domainId = ""
) {
  let query = supabase
    .from("busy_website_health_checks")
    .select("status,checked_at")
    .eq("website_id", websiteId)
    .eq("target_type", targetType)
    .order("checked_at", { ascending: false })
    .limit(4);
  if (domainId) query = query.eq("domain_id", domainId);
  const result = await query;
  if (result.error) return 1;
  let failures = 0;
  for (const row of result.data || []) {
    if (row.status === "healthy") break;
    failures += 1;
  }
  return failures;
}

function healthFailureClass(result: any) {
  if (result?.status === "degraded") {
    return {
      category: "deployment_mismatch",
      ownerMessage:
        "The address responded, but it is not serving the approved BUSY website version yet. BUSY is rechecking the route.",
    };
  }
  if ([525, 526].includes(Number(result?.httpStatus || 0))) {
    return {
      category: "ssl_handshake",
      ownerMessage:
        "HTTPS is not completing correctly yet. BUSY will keep checking the certificate and route.",
    };
  }
  if (!Number(result?.httpStatus || 0)) {
    return {
      category: "dns_or_network",
      ownerMessage:
        "The public address could not be reached. BUSY is checking whether DNS or the delivery network is still updating.",
    };
  }
  if (Number(result?.httpStatus || 0) >= 500) {
    return {
      category: "upstream_unavailable",
      ownerMessage:
        "The website delivery path is temporarily unavailable. BUSY will retry automatically.",
    };
  }
  if (Number(result?.httpStatus || 0) === 404) {
    return {
      category: "route_or_origin",
      ownerMessage:
        "The address is reachable but the website route is not serving the approved version yet. BUSY is rechecking it.",
    };
  }
  return {
    category: "http_failure",
    ownerMessage:
      "The public website check did not pass. BUSY will retry automatically before asking you to do anything.",
  };
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
        next_health_check_at: new Date(Date.now() + 5 * 60000).toISOString(),
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
  const liveFailureStreak =
    live.status === "healthy"
      ? 0
      : await failureStreak(website.id, "live_alias");

  const domains = await supabase
    .from("busy_website_domains")
    .select("*")
    .eq("website_id", website.id)
    .eq("ssl_status", "active")
    .in("routing_status", ["validating", "active"]);
  if (domains.error) throw domains.error;

  const domainRows = domains.data || [];
  const defaultEligible =
    !!website.default_url &&
    ["reserved", "provisioning", "active", "degraded"].includes(
      clean(website.delivery_status, 80)
    );

  // After the immutable live alias has been checked, independent public
  // addresses are probed concurrently. This bounds wall-clock time when a
  // tenant has both a BUSY address and one or more custom domains.
  const routeChecks = await Promise.all([
    defaultEligible
      ? recordCheck({
          website,
          targetType: "default_domain",
          url: website.default_url,
        })
      : Promise.resolve(null),
    ...domainRows.map((domain: any) =>
      recordCheck({
        website,
        domain,
        targetType: "custom_domain",
        url: `https://${domain.hostname}/`,
      })
    ),
  ]);

  const defaultResult: any = routeChecks[0];
  const domainResults = routeChecks.slice(1);
  let maxDomainFailureStreak = 0;

  for (let index = 0; index < domainRows.length; index += 1) {
    const domain = domainRows[index];
    const domainResult: any = domainResults[index];
    const streak =
      domainResult?.status === "healthy"
        ? 0
        : await failureStreak(website.id, "custom_domain", domain.id);
    maxDomainFailureStreak = Math.max(maxDomainFailureStreak, streak);
    const failure = healthFailureClass(domainResult);
    const existingProviderStatus =
      domain.provider_status && typeof domain.provider_status === "object"
        ? domain.provider_status
        : {};
    const existingDeliveryRecovery =
      existingProviderStatus?.deliveryRecovery &&
      typeof existingProviderStatus.deliveryRecovery === "object"
        ? existingProviderStatus.deliveryRecovery
        : {};

    const domainUpdate: Record<string, unknown> = {
      last_checked_at: checkedAt,
      provider_status: {
        ...existingProviderStatus,
        deliveryRecovery:
          domainResult?.status === "healthy"
            ? {
                status: "healthy",
                category: "healthy",
                consecutiveFailures: 0,
                firstDetectedAt: null,
                lastCheckedAt: checkedAt,
                ownerMessage:
                  "BUSY has proved this custom domain is serving the approved website.",
              }
            : {
                status: streak >= 2 ? "retrying" : "observing_transient",
                category: failure.category,
                consecutiveFailures: streak,
                firstDetectedAt:
                  clean(existingDeliveryRecovery?.firstDetectedAt, 120) ||
                  checkedAt,
                lastCheckedAt: checkedAt,
                ownerMessage:
                  streak >= 2
                    ? failure.ownerMessage
                    : "BUSY saw one failed check and is confirming it before changing the live status.",
                technicalMessage: clean(domainResult?.error, 1200),
              },
      },
      last_error:
        domainResult?.status === "healthy" || streak < 2
          ? null
          : domainResult?.error || "Domain health check failed.",
      updated_at: checkedAt,
    };
    if (domainResult?.status === "healthy") {
      domainUpdate.routing_status = "active";
      domainUpdate.status = "active";
      domainUpdate.activated_at = domain.activated_at || checkedAt;
    } else if (streak >= 2) {
      domainUpdate.routing_status = "validating";
    }
    await supabase
      .from("busy_website_domains")
      .update(domainUpdate)
      .eq("id", domain.id);
  }

  let defaultFailureStreak = 0;
  if (defaultResult?.status && defaultResult.status !== "healthy") {
    defaultFailureStreak = await failureStreak(
      website.id,
      "default_domain"
    );
  }

  const preserveKnownGoodLive =
    live.status !== "healthy" &&
    website.health_status === "healthy" &&
    liveFailureStreak < 2;
  const anyTransientFailure =
    live.status !== "healthy" ||
    (!!defaultResult && defaultResult.status !== "healthy") ||
    domainResults.some((item: any) => item?.status !== "healthy");
  const anyConfirmedFailure =
    liveFailureStreak >= 2 ||
    defaultFailureStreak >= 2 ||
    maxDomainFailureStreak >= 2;
  const nextHealthMinutes = anyConfirmedFailure
    ? 5
    : anyTransientFailure
    ? 3
    : 720;

  const update: Record<string, unknown> = {
    health_status: preserveKnownGoodLive ? "healthy" : live.status,
    last_health_check_at: checkedAt,
    next_health_check_at: new Date(
      Date.now() + nextHealthMinutes * 60000
    ).toISOString(),
    last_observed_deployment_id: live.observedDeploymentId,
    updated_at: checkedAt,
  };
  if (live.status === "healthy") {
    update.last_healthy_at = checkedAt;
    update.last_error = null;
  } else if (preserveKnownGoodLive) {
    // The evidence row records the failed check, but one transient result does
    // not turn a proven live deployment into an owner-facing outage.
    update.last_error = null;
  } else {
    update.last_error = live.error || "Live website health check failed.";
  }
  if (defaultResult?.status === "healthy") {
    update.delivery_status = "active";
    update.delivery_provider = "cloudflare_saas";
  } else if (
    website.default_url &&
    defaultResult &&
    (
      ["reserved", "provisioning", "degraded"].includes(
        clean(website.delivery_status, 80)
      ) ||
      (
        clean(website.delivery_status, 80) === "active" &&
        defaultFailureStreak >= 2
      )
    )
  ) {
    // An active BUSY address needs two consecutive failures before it is
    // withdrawn as the preferred route. New/unproven addresses remain strict.
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
    recovery: {
      liveFailureStreak,
      defaultFailureStreak,
      maxDomainFailureStreak,
      nextHealthMinutes,
      liveTransientPreserved: preserveKnownGoodLive,
    },
  };
}

async function websitesToCheck(websiteId: string, limit: number) {
  const base = () =>
    supabase
      .from("busy_websites")
      .select("*")
      .not("current_live_deployment_id", "is", null);

  if (websiteId) {
    const result = await base().eq("id", websiteId).limit(1);
    if (result.error) throw result.error;
    return result.data || [];
  }

  const dueNow = new Date().toISOString();
  const dueFilter =
    `next_health_check_at.is.null,next_health_check_at.lte.${dueNow}`;
  const urgentLimit = Math.min(limit, Math.max(4, Math.ceil(limit / 2)));

  const urgent = await base()
    .neq("health_status", "healthy")
    .or(dueFilter)
    .order("next_health_check_at", { ascending: true, nullsFirst: true })
    .order("last_health_check_at", { ascending: true, nullsFirst: true })
    .limit(urgentLimit);
  if (urgent.error) throw urgent.error;

  const selected = [...(urgent.data || [])];
  const selectedIds = new Set(selected.map((item: any) => item.id));
  const remaining = Math.max(0, limit - selected.length);

  if (remaining) {
    const healthy = await base()
      .eq("health_status", "healthy")
      .or(dueFilter)
      .order("next_health_check_at", { ascending: true, nullsFirst: true })
      .order("last_health_check_at", { ascending: true, nullsFirst: true })
      .limit(remaining + selected.length);
    if (healthy.error) throw healthy.error;
    for (const website of healthy.data || []) {
      if (selectedIds.has(website.id)) continue;
      selected.push(website);
      selectedIds.add(website.id);
      if (selected.length >= limit) break;
    }
  }

  return selected;
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

    // Ten-site groups keep the one-minute scheduler bounded while spreading
    // checks continuously instead of creating a five-minute traffic spike.
    for (let offset = 0; offset < websites.length; offset += 10) {
      const group = websites.slice(offset, offset + 10);
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
