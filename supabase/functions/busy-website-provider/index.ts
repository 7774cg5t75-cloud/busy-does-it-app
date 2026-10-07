import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
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
const CLOUDFLARE_FALLBACK_ORIGIN =
  (Deno.env.get("CLOUDFLARE_FALLBACK_ORIGIN") || `origin.${BUSY_ROOT_DOMAIN}`).toLowerCase();
const CLOUDFLARE_ROUTER_SCRIPT =
  Deno.env.get("CLOUDFLARE_ROUTER_SCRIPT") || "busy-website-router";
const BUSY_WEBSITE_ORIGIN_URL =
  `${SUPABASE_URL}/functions/v1/busy-website-origin`;
const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";
const DNS_JSON_URL = "https://cloudflare-dns.com/dns-query";

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

function isoMs(value: unknown) {
  const parsed = Date.parse(clean(value, 120));
  return Number.isFinite(parsed) ? parsed : 0;
}

function providerRecovery(domain: any) {
  const recovery = domain?.provider_status?.recovery;
  return recovery && typeof recovery === "object" ? recovery : {};
}

function recoveryDue(domain: any) {
  const nextRetryAt = isoMs(providerRecovery(domain)?.nextRetryAt);
  return !nextRetryAt || nextRetryAt <= Date.now();
}

function providerFailureClass(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("permission") ||
    lower.includes("authentication") ||
    lower.includes("api token")
  ) {
    return {
      category: "operator_attention",
      status: "operator_attention",
      ownerMessage:
        "BUSY website delivery needs an internal Cloudflare permission check. Your existing live website has not been changed.",
      delayMinutes: 60,
    };
  }
  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return {
      category: "rate_limited",
      status: "retrying",
      ownerMessage:
        "Cloudflare is temporarily rate-limiting checks. BUSY will retry automatically.",
      delayMinutes: 15,
    };
  }
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("network") ||
    lower.includes("fetch") ||
    /http 5\d\d/.test(lower)
  ) {
    return {
      category: "provider_temporary",
      status: "retrying",
      ownerMessage:
        "The delivery provider is temporarily unavailable. BUSY will retry automatically.",
      delayMinutes: 10,
    };
  }
  return {
    category: "provider_retry",
    status: "retrying",
    ownerMessage:
      "BUSY could not complete this delivery check yet. It will retry automatically.",
    delayMinutes: 15,
  };
}

function recoveryDelayMinutes(base: number, attempt: number) {
  const multiplier = Math.min(8, Math.max(1, 2 ** Math.max(0, attempt - 1)));
  return Math.min(360, base * multiplier);
}

async function recordProviderFailure(domain: any, error: unknown) {
  const now = new Date();
  const message =
    error instanceof Error ? error.message : "Domain provider sync failed.";
  const previous = providerRecovery(domain);
  const attempt = Math.max(0, Number(previous?.attemptCount || 0)) + 1;
  const failure = providerFailureClass(message);
  const delayMinutes = recoveryDelayMinutes(failure.delayMinutes, attempt);
  const nextRetryAt = new Date(now.getTime() + delayMinutes * 60000).toISOString();
  const providerStatus = {
    ...(domain?.provider_status || {}),
    recovery: {
      status: failure.status,
      category: failure.category,
      attemptCount: attempt,
      firstFailedAt: clean(previous?.firstFailedAt, 120) || now.toISOString(),
      lastAttemptAt: now.toISOString(),
      nextRetryAt,
      ownerMessage: failure.ownerMessage,
      technicalMessage: clean(message, 1200),
    },
  };

  const updated = await supabase
    .from("busy_website_domains")
    .update({
      provider_status: providerStatus,
      last_checked_at: now.toISOString(),
      last_error: clean(message, 2000),
      updated_at: now.toISOString(),
    })
    .eq("id", domain.id);
  if (updated.error) throw updated.error;

  return providerStatus.recovery;
}

function providerConfig() {
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
    baseDomainSource: Deno.env.get("BUSY_WEBSITE_BASE_DOMAIN") ? "environment" : "busy_default",
    cnameHost: BUSY_WEBSITE_CNAME_HOST,
    fallbackOrigin: CLOUDFLARE_FALLBACK_ORIGIN,
    routerScript: CLOUDFLARE_ROUTER_SCRIPT,
    routingTarget: CLOUDFLARE_CNAME_TARGET || "",
  };
}

async function dnsAnswers(name: string, type: "NS" | "CNAME" | "A" | "AAAA") {
  const response = await fetch(
    `${DNS_JSON_URL}?name=${encodeURIComponent(name)}&type=${type}`,
    {
      headers: {
        Accept: "application/dns-json",
        "User-Agent": "BUSY-Website-Provider/3.48",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`DNS preflight returned HTTP ${response.status}.`);
  }
  const payload: any = await response.json().catch(() => ({}));
  return Array.isArray(payload?.Answer) ? payload.Answer : [];
}

function cleanDnsValue(value: unknown) {
  return clean(value, 1000).replace(/\.$/, "").toLowerCase();
}

async function platformPreflight() {
  const checkedAt = new Date().toISOString();
  const result: any = {
    rootDomain: BUSY_ROOT_DOMAIN,
    baseDomain: BUSY_WEBSITE_BASE_DOMAIN,
    cnameHost: BUSY_WEBSITE_CNAME_HOST,
    checkedAt,
    rootNameservers: [],
    rootOnCloudflare: false,
    baseDomainAnswers: [],
    baseDomainRoutable: false,
    status: "waiting_for_nameservers",
    lastError: null,
  };

  try {
    const ns = await dnsAnswers(BUSY_ROOT_DOMAIN, "NS");
    result.rootNameservers = ns
      .map((answer: any) => cleanDnsValue(answer?.data))
      .filter(Boolean);
    result.rootOnCloudflare =
      result.rootNameservers.filter((value: string) =>
        /\.ns\.cloudflare\.com$/i.test(value)
      ).length >= 2;

    if (!result.rootOnCloudflare) {
      result.status = "waiting_for_nameservers";
      return result;
    }

    const [cname, a, aaaa] = await Promise.all([
      dnsAnswers(BUSY_WEBSITE_CNAME_HOST, "CNAME"),
      dnsAnswers(BUSY_WEBSITE_CNAME_HOST, "A"),
      dnsAnswers(BUSY_WEBSITE_CNAME_HOST, "AAAA"),
    ]);
    result.baseDomainAnswers = [...cname, ...a, ...aaaa]
      .map((answer: any) => cleanDnsValue(answer?.data))
      .filter(Boolean);
    result.baseDomainRoutable = result.baseDomainAnswers.length > 0;

    const config = providerConfig();
    if (!config.configured) {
      result.status = result.baseDomainRoutable
        ? "cloudflare_saas_credentials_required"
        : "cloudflare_saas_setup_required";
      return result;
    }

    result.status = result.baseDomainRoutable
      ? "ready_for_customer_domains"
      : "routing_target_dns_required";
    return result;
  } catch (error) {
    result.status = "preflight_error";
    result.lastError =
      error instanceof Error ? error.message : "BUSY platform DNS preflight failed.";
    return result;
  }
}

async function validRequest(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (authorization === `Bearer ${SERVICE_ROLE_KEY}`) return true;

  const supplied = request.headers.get("x-busy-provider-token") || "";
  if (!supplied) return false;
  const token = await supabase
    .from("busy_internal_config")
    .select("value")
    .eq("key", "website_provider_token")
    .maybeSingle();
  if (token.error || !token.data?.value) return false;
  return supplied === token.data.value;
}

async function cfRequest(path: string, options: RequestInit = {}) {
  if (!providerConfig().configured) {
    throw new Error("Cloudflare for SaaS is not configured in BUSY server secrets.");
  }
  const response = await fetch(`${CLOUDFLARE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    const detail =
      body?.errors?.map((item: any) => clean(item?.message, 500)).filter(Boolean).join(" • ") ||
      `Cloudflare API returned ${response.status}.`;
    throw new Error(detail);
  }
  return body?.result;
}

async function cfAccountRequest(path: string, options: RequestInit = {}) {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("Cloudflare account id and API token are required for Worker deployment.");
  }
  const response = await fetch(`${CLOUDFLARE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      ...(options.headers || {}),
    },
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    const detail =
      body?.errors?.map((item: any) => clean(item?.message, 500)).filter(Boolean).join(" • ") ||
      `Cloudflare API returned ${response.status}.`;
    throw new Error(detail);
  }
  return body?.result;
}

async function ensureDnsRecord(
  type: "AAAA" | "CNAME",
  name: string,
  content: string,
  proxied = true
) {
  const query = await cfRequest(
    `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/dns_records?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`
  );
  const existing = Array.isArray(query) ? query[0] || null : null;
  const payload = {
    type,
    name,
    content,
    proxied,
    ttl: 1,
  };
  if (existing?.id) {
    if (
      clean(existing.content, 500).toLowerCase() === content.toLowerCase() &&
      !!existing.proxied === proxied
    ) {
      return existing;
    }
    return await cfRequest(
      `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/dns_records/${encodeURIComponent(existing.id)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  }
  return await cfRequest(
    `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/dns_records`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

function routerWorkerSource() {
  return [
    'const DEFAULT_ROOT_DOMAIN = "busydoesit.co.uk";',
    'const DEFAULT_ORIGIN_URL = "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-origin";',
    'function cleanHost(value){return String(value||"").trim().toLowerCase().replace(/\\.$/,"").replace(/:\\d+$/,"");}',
    'function reservedRoot(host,root){return host===root||host==="www."+root;}',
    'function cacheable(response){if(!response||response.status!==200)return false;const t=response.headers.get("content-type")||"";return t.startsWith("text/html")||t.startsWith("text/css")||t.startsWith("application/javascript")||t.startsWith("image/");}',
    'export default {async fetch(request,env,ctx){',
    'const method=request.method.toUpperCase();if(method!=="GET"&&method!=="HEAD")return new Response("Method not allowed.",{status:405,headers:{Allow:"GET, HEAD"}});',
    'const incoming=new URL(request.url);const host=cleanHost(incoming.hostname);const root=cleanHost(env.BUSY_ROOT_DOMAIN||DEFAULT_ROOT_DOMAIN);const health=String(request.headers.get("User-Agent")||"").startsWith("BUSY-Website-Health/");',
    'if(reservedRoot(host,root))return new Response("BUSY DOES IT",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8"}});',
    'const origin=String(env.BUSY_ORIGIN_URL||DEFAULT_ORIGIN_URL).trim();',
    'const keyUrl=new URL("https://busy-edge-cache.invalid/");keyUrl.pathname="/"+encodeURIComponent(host)+incoming.pathname;',
    'const key=new Request(keyUrl.toString(),{method:"GET",headers:{Accept:request.headers.get("Accept")||"*/*"}});',
    'if(method==="GET"&&!health){const cached=await caches.default.match(key);if(cached){const h=new Headers(cached.headers);h.set("X-BUSY-Edge-Cache","HIT");return new Response(cached.body,{status:cached.status,statusText:cached.statusText,headers:h});}}',
    'const target=new URL(origin);target.searchParams.set("host",host);target.searchParams.set("path",incoming.pathname||"/");',
    'const upstream=await fetch(target.toString(),{method,headers:{Accept:request.headers.get("Accept")||"text/html,*/*;q=0.8","X-BUSY-Original-Host":host,"X-BUSY-Original-Path":incoming.pathname||"/","User-Agent":"BUSY-Cloudflare-Router/3.47"},cf:{cacheEverything:false}});',
    'const headers=new Headers(upstream.headers);headers.set("X-BUSY-Edge","cloudflare-worker");headers.set("X-BUSY-Edge-Cache","MISS");headers.set("Vary","Accept-Encoding");',
    'const response=new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers});',
    'if(method==="GET"&&!health&&cacheable(response)){ctx.waitUntil(caches.default.put(key,response.clone()));}',
    'return response;}};'
  ].join("\n");
}

async function uploadRouterWorker() {
  if (!providerConfig().bootstrapReady) {
    throw new Error("Cloudflare account id, zone id and restricted API token are required before deploying the BUSY router.");
  }
  const form = new FormData();
  form.append(
    "metadata",
    JSON.stringify({
      main_module: "worker.js",
      compatibility_date: "2026-10-07",
      bindings: [
        { type: "plain_text", name: "BUSY_ROOT_DOMAIN", text: BUSY_ROOT_DOMAIN },
        { type: "plain_text", name: "BUSY_ORIGIN_URL", text: BUSY_WEBSITE_ORIGIN_URL },
      ],
    })
  );
  form.append(
    "worker.js",
    new Blob([routerWorkerSource()], { type: "application/javascript+module" }),
    "worker.js"
  );

  return await cfAccountRequest(
    `/accounts/${encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)}/workers/scripts/${encodeURIComponent(CLOUDFLARE_ROUTER_SCRIPT)}`,
    { method: "PUT", body: form }
  );
}

async function ensureWorkerRoute(
  pattern: string,
  script: string | null
) {
  const routes = await cfRequest(
    `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/workers/routes`
  );
  const list = Array.isArray(routes) ? routes : [];
  const existing = list.find(
    (route: any) => clean(route?.pattern, 300) === pattern
  );
  const existingScript = clean(existing?.script, 200);

  if (existing?.id) {
    if ((script || "") === existingScript) return existing;
    throw new Error(
      `Cloudflare route ${pattern} already exists with a different Worker assignment. BUSY will not overwrite it automatically.`
    );
  }

  const body: Record<string, unknown> = { pattern };
  if (script) body.script = script;
  return await cfRequest(
    `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/workers/routes`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

async function ensureWorkerRoutes() {
  // More-specific root/www exclusions are created first so BUSY's own
  // marketing hostnames do not enter the SaaS router. Cloudflare documents
  // no-script routes as the supported way to negate a broader Worker route.
  const root = await ensureWorkerRoute(`${BUSY_ROOT_DOMAIN}/*`, null);
  const www = await ensureWorkerRoute(`www.${BUSY_ROOT_DOMAIN}/*`, null);
  const wildcard = await ensureWorkerRoute("*/*", CLOUDFLARE_ROUTER_SCRIPT);
  return { root, www, wildcard };
}

async function ensureFallbackOrigin() {
  return await cfRequest(
    `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/custom_hostnames/fallback_origin`,
    {
      method: "PUT",
      body: JSON.stringify({ origin: CLOUDFLARE_FALLBACK_ORIGIN }),
    }
  );
}

async function inspectPlatformProvider() {
  const config = providerConfig();
  if (!config.configured) {
    return {
      configured: false,
      routerScriptReady: false,
      routerRouteReady: false,
      fallbackOriginStatus: "not_connected",
    };
  }

  let fallback: any = null;
  let routes: any[] = [];
  try {
    fallback = await cfRequest(
      `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/custom_hostnames/fallback_origin`
    );
  } catch {}
  try {
    const result = await cfRequest(
      `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/workers/routes`
    );
    routes = Array.isArray(result) ? result : [];
  } catch {}

  let routerScriptReady = false;
  if (CLOUDFLARE_ACCOUNT_ID) {
    try {
      const scripts = await cfAccountRequest(
        `/accounts/${encodeURIComponent(CLOUDFLARE_ACCOUNT_ID)}/workers/scripts`,
        { method: "GET" }
      );
      routerScriptReady = (Array.isArray(scripts) ? scripts : []).some(
        (script: any) =>
          clean(script?.id || script?.name, 200) === CLOUDFLARE_ROUTER_SCRIPT
      );
    } catch {}
  }

  const routeFor = (pattern: string) =>
    routes.find((route: any) => clean(route?.pattern, 300) === pattern) || null;
  const wildcardRoute = routeFor("*/*");
  const rootRoute = routeFor(`${BUSY_ROOT_DOMAIN}/*`);
  const wwwRoute = routeFor(`www.${BUSY_ROOT_DOMAIN}/*`);

  return {
    configured: true,
    routerScriptReady,
    routerRouteReady:
      clean(wildcardRoute?.script, 200) === CLOUDFLARE_ROUTER_SCRIPT,
    rootRoutesExcluded:
      !!rootRoute &&
      !clean(rootRoute?.script, 200) &&
      !!wwwRoute &&
      !clean(wwwRoute?.script, 200),
    fallbackOriginStatus: clean(fallback?.status, 100) || "not_configured",
    fallbackOrigin: clean(fallback?.origin, 300) || "",
  };
}

async function bootstrapPlatform() {
  const config = providerConfig();
  const before = await platformPreflight();
  if (!before.rootOnCloudflare) {
    throw new Error("busydoesit.co.uk nameservers must be active on Cloudflare before BUSY bootstraps website delivery.");
  }
  if (!config.bootstrapReady) {
    return {
      configured: false,
      config,
      preflight: before,
      missing: {
        apiToken: !config.hasApiToken,
        zoneId: !config.hasZoneId,
        accountId: !config.hasAccountId,
      },
    };
  }

  const fallbackDns = await ensureDnsRecord(
    "AAAA",
    CLOUDFLARE_FALLBACK_ORIGIN,
    "100::",
    true
  );
  const cnameDns = await ensureDnsRecord(
    "CNAME",
    BUSY_WEBSITE_CNAME_HOST,
    CLOUDFLARE_FALLBACK_ORIGIN,
    true
  );
  const wildcardDns = await ensureDnsRecord(
    "CNAME",
    `*.${BUSY_ROOT_DOMAIN}`,
    BUSY_WEBSITE_CNAME_HOST,
    true
  );
  const fallback = await ensureFallbackOrigin();
  const worker = await uploadRouterWorker();
  const routes = await ensureWorkerRoutes();

  return {
    configured: true,
    config,
    preflight: await platformPreflight(),
    provider: await inspectPlatformProvider(),
    dns: {
      fallback: fallbackDns,
      cnameTarget: cnameDns,
      wildcard: wildcardDns,
    },
    fallback,
    worker: {
      id: clean(worker?.id, 200) || CLOUDFLARE_ROUTER_SCRIPT,
      routes,
    },
  };
}

function platformActivationState(config: any, preflight: any, provider: any) {
  const fallbackStatus = clean(provider?.fallbackOriginStatus, 100);
  const fallbackConfigured =
    !!fallbackStatus &&
    fallbackStatus !== "not_connected" &&
    !/(failed|error|inactive|deletion)/i.test(fallbackStatus);
  const infrastructureApplied =
    !!provider?.routerScriptReady &&
    !!provider?.routerRouteReady &&
    !!provider?.rootRoutesExcluded &&
    fallbackConfigured &&
    !!preflight?.baseDomainRoutable;
  const ready =
    !!config?.bootstrapReady &&
    !!preflight?.rootOnCloudflare &&
    infrastructureApplied &&
    fallbackStatus === "active";

  let status = "activation_required";
  if (!config?.bootstrapReady) status = "credentials_required";
  else if (!preflight?.rootOnCloudflare) status = "waiting_for_nameservers";
  else if (ready) status = "ready";
  else if (infrastructureApplied) status = "activating";

  return {
    status,
    ready,
    applied: infrastructureApplied,
    credentialsReady: !!config?.bootstrapReady,
    nameserversReady: !!preflight?.rootOnCloudflare,
    routingDnsReady: !!preflight?.baseDomainRoutable,
    fallbackOriginReady: fallbackStatus === "active",
    fallbackOriginConfigured: fallbackConfigured,
    workerReady: !!provider?.routerScriptReady,
    workerRouteReady: !!provider?.routerRouteReady,
    rootRoutesExcluded: !!provider?.rootRoutesExcluded,
    checkedAt: new Date().toISOString(),
  };
}

async function reconcilePlatformActivation() {
  const config = providerConfig();
  const preflight = await platformPreflight();
  const provider = await inspectPlatformProvider();
  const before = platformActivationState(config, preflight, provider);

  if (!config.bootstrapReady || !preflight.rootOnCloudflare || before.applied) {
    console.log(
      "BUSY_WEBSITE_PLATFORM_ACTIVATION",
      JSON.stringify({
        status: before.status,
        ready: before.ready,
        applied: before.applied,
        attempted: false,
        credentialsReady: before.credentialsReady,
        nameserversReady: before.nameserversReady,
        routingDnsReady: before.routingDnsReady,
        fallbackOriginReady: before.fallbackOriginReady,
        workerReady: before.workerReady,
        workerRouteReady: before.workerRouteReady,
        rootRoutesExcluded: before.rootRoutesExcluded,
      })
    );
    return {
      ...before,
      attempted: false,
      preflight,
      provider,
    };
  }

  try {
    const bootstrap = await bootstrapPlatform();
    const nextPreflight = bootstrap?.preflight || (await platformPreflight());
    const nextProvider = bootstrap?.provider || (await inspectPlatformProvider());
    const after = platformActivationState(config, nextPreflight, nextProvider);

    console.log(
      "BUSY_WEBSITE_PLATFORM_ACTIVATION",
      JSON.stringify({
        status: after.status,
        ready: after.ready,
        applied: after.applied,
        attempted: true,
        credentialsReady: after.credentialsReady,
        nameserversReady: after.nameserversReady,
        routingDnsReady: after.routingDnsReady,
        fallbackOriginReady: after.fallbackOriginReady,
        workerReady: after.workerReady,
        workerRouteReady: after.workerRouteReady,
        rootRoutesExcluded: after.rootRoutesExcluded,
      })
    );

    return {
      ...after,
      attempted: true,
      preflight: nextPreflight,
      provider: nextProvider,
    };
  } catch (error) {
    console.error(
      "BUSY_WEBSITE_PLATFORM_ACTIVATION_ERROR",
      error instanceof Error ? error.message : "Cloudflare platform activation failed."
    );
    throw error;
  }
}

function errorStatus(value: string) {
  return /(blocked|failed|timed_out|expired|inactive|deletion)/i.test(value);
}

function mapProviderState(result: any) {
  const hostnameStatus = clean(result?.status, 100) || "pending";
  const sslProviderStatus = clean(result?.ssl?.status, 120) || "pending_validation";
  return {
    hostnameStatus,
    sslProviderStatus,
    routingStatus:
      hostnameStatus === "active" ? "validating" : errorStatus(hostnameStatus) ? "error" : "pending",
    sslStatus:
      sslProviderStatus === "active"
        ? "active"
        : errorStatus(sslProviderStatus)
        ? "error"
        : "provisioning",
  };
}

function requiredRecords(domain: any, result: any) {
  const records: any[] = [];
  const add = (record: any) => {
    if (!record?.type || !record?.name || !record?.value) return;
    const key = `${record.type}:${record.name}:${record.value}`;
    if (!records.some((item) => item.key === key)) records.push({ ...record, key });
  };

  // Retain BUSY's explicit pre-validation ownership record.
  for (const record of Array.isArray(domain?.required_records) ? domain.required_records : []) {
    add(record);
  }

  const ownership = result?.ownership_verification || {};
  if (ownership?.name && ownership?.value) {
    add({
      purpose: "cloudflare_hostname_ownership",
      type: clean(ownership.type, 20).toUpperCase() || "TXT",
      name: clean(ownership.name, 500),
      value: clean(ownership.value, 2000),
    });
  }

  for (const record of Array.isArray(result?.ssl?.validation_records)
    ? result.ssl.validation_records
    : []) {
    const txtValue = clean(record?.txt_value || record?.txt_record, 2000);
    if (record?.txt_name && txtValue) {
      add({
        purpose: "ssl_certificate_validation",
        type: "TXT",
        name: clean(record.txt_name, 500),
        value: txtValue,
      });
    }
    if (record?.cname && record?.cname_target) {
      add({
        purpose: "ssl_certificate_validation",
        type: "CNAME",
        name: clean(record.cname, 500),
        value: clean(record.cname_target, 2000),
      });
    }
  }

  if (CLOUDFLARE_CNAME_TARGET) {
    add({
      purpose: "traffic_routing",
      type: "CNAME",
      name: domain.hostname,
      value: CLOUDFLARE_CNAME_TARGET,
    });
  }
  return records.map(({ key, ...record }) => record);
}

async function loadDomain(domainId: string) {
  const domain = await supabase
    .from("busy_website_domains")
    .select("*")
    .eq("id", domainId)
    .maybeSingle();
  if (domain.error) throw domain.error;
  if (!domain.data) throw new Error("BUSY website domain not found.");
  return domain.data;
}

async function saveProviderState(domain: any, result: any) {
  const state = mapProviderState(result);
  const now = new Date().toISOString();
  const providerErrors = [
    ...(Array.isArray(result?.verification_errors) ? result.verification_errors : []),
    ...(Array.isArray(result?.ssl?.validation_errors)
      ? result.ssl.validation_errors.map((item: any) => item?.message || item)
      : []),
  ]
    .map((item) => clean(item, 800))
    .filter(Boolean);
  const records = requiredRecords(domain, result);
  const fullyProviderReady =
    state.hostnameStatus === "active" && state.sslProviderStatus === "active";
  const ownerDnsAction =
    !fullyProviderReady &&
    records.some((record: any) =>
      ["cloudflare_hostname_ownership", "ssl_certificate_validation", "traffic_routing"].includes(
        clean(record?.purpose, 80)
      )
    );
  const nextRetryAt = new Date(
    Date.now() + (ownerDnsAction ? 30 : fullyProviderReady ? 60 : 10) * 60000
  ).toISOString();

  const update: any = {
    routing_provider: "cloudflare_saas",
    provider_hostname_id: clean(result?.id, 200) || domain.provider_hostname_id,
    routing_target: CLOUDFLARE_CNAME_TARGET || domain.routing_target,
    routing_status:
      domain.routing_status === "active" && state.hostnameStatus === "active"
        ? "active"
        : state.routingStatus,
    ssl_status: state.sslStatus,
    required_records: records,
    provider_status: {
      ...(domain?.provider_status || {}),
      provider: "cloudflare_saas",
      hostnameStatus: state.hostnameStatus,
      sslStatus: state.sslProviderStatus,
      verificationErrors: providerErrors,
      syncedAt: now,
      recovery: {
        status: fullyProviderReady
          ? "provider_ready"
          : ownerDnsAction
          ? "owner_dns_action"
          : "checking",
        category: fullyProviderReady
          ? "healthy"
          : ownerDnsAction
          ? "dns_or_validation"
          : "provider_pending",
        attemptCount: 0,
        firstFailedAt: null,
        lastAttemptAt: now,
        nextRetryAt,
        ownerMessage: fullyProviderReady
          ? "Cloudflare hostname and SSL are ready. BUSY is verifying the real website route."
          : ownerDnsAction
          ? "BUSY is waiting for the required DNS records shown in the app."
          : "BUSY is continuing the Cloudflare setup automatically.",
        technicalMessage: providerErrors.join(" • ").slice(0, 1200),
      },
    },
    last_checked_at: now,
    last_error: providerErrors.length ? providerErrors.join(" • ").slice(0, 2000) : null,
    updated_at: now,
  };
  if (!domain.provider_created_at) update.provider_created_at = now;

  if (state.hostnameStatus === "active" && state.sslProviderStatus === "active") {
    // We still wait for the BUSY health checker to prove the customer's DNS
    // actually reaches the expected BUSY deployment before routing_status=active.
    update.status = domain.status === "active" ? "active" : "verified";
  }

  const saved = await supabase
    .from("busy_website_domains")
    .update(update)
    .eq("id", domain.id)
    .select("*")
    .single();
  if (saved.error) throw saved.error;
  return saved.data;
}

async function providerDetails(providerHostnameId: string) {
  return await cfRequest(
    `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/custom_hostnames/${encodeURIComponent(
      providerHostnameId
    )}`
  );
}

async function findProviderHostname(hostname: string) {
  const result = await cfRequest(
    `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/custom_hostnames?hostname=${encodeURIComponent(
      hostname
    )}&per_page=5`
  );
  const rows = Array.isArray(result) ? result : [];
  return (
    rows.find(
      (item: any) =>
        clean(item?.hostname, 300).toLowerCase() === hostname.toLowerCase()
    ) || null
  );
}

async function provisionDomain(domainId: string) {
  const config = providerConfig();
  const domain = await loadDomain(domainId);
  if (!["verified", "active"].includes(domain.status)) {
    throw new Error("Verify BUSY domain ownership before preparing external routing.");
  }
  if (!config.configured) {
    return { configured: false, config, domain };
  }

  let result: any = null;
  if (domain.provider_hostname_id) {
    result = await providerDetails(domain.provider_hostname_id);
  } else {
    // Recover idempotently if Cloudflare already has the hostname but BUSY did
    // not persist the provider id because a previous request was interrupted.
    result = await findProviderHostname(domain.hostname);

    if (!result) {
      result = await cfRequest(
        `/zones/${encodeURIComponent(CLOUDFLARE_ZONE_ID)}/custom_hostnames`,
        {
          method: "POST",
          body: JSON.stringify({
            hostname: domain.hostname,
            ssl: {
              method: "txt",
              type: "dv",
              settings: { min_tls_version: "1.2" },
            },
          }),
        }
      );
    }

    // Cloudflare can omit later validation details from the creation response.
    // Fetch the canonical hostname state whenever we have an id.
    if (result?.id) {
      try {
        result = await providerDetails(result.id);
      } catch {
        // Keep the previous result; scheduled reconciliation will retry safely.
      }
    }
  }

  const saved = await saveProviderState(domain, result || {});
  return {
    configured: true,
    config,
    domain: saved,
    readyForHealthCheck:
      saved.provider_status?.hostnameStatus === "active" &&
      saved.ssl_status === "active",
  };
}

async function syncDomain(domain: any) {
  if (!domain.provider_hostname_id) {
    const provisioned = await provisionDomain(domain.id);
    return provisioned?.domain || null;
  }
  const result = await providerDetails(domain.provider_hostname_id);
  return await saveProviderState(domain, result);
}

async function syncDomains(limit = 40) {
  const activation = await reconcilePlatformActivation();
  const config = providerConfig();
  const preflight = activation.preflight || (await platformPreflight());
  if (!config.configured) {
    return {
      configured: false,
      config,
      preflight,
      provider: activation.provider || (await inspectPlatformProvider()),
      activation,
      synced: 0,
      results: [],
    };
  }

  const domains = await supabase
    .from("busy_website_domains")
    .select("*")
    .in("status", ["verified", "active"])
    .in("routing_provider", ["unassigned", "cloudflare_saas"])
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(Math.min(100, Math.max(1, limit)));
  if (domains.error) throw domains.error;

  const results: any[] = [];
  let skippedBackoff = 0;
  for (const domain of domains.data || []) {
    if (!recoveryDue(domain)) {
      skippedBackoff += 1;
      results.push({
        domainId: domain.id,
        ok: true,
        skipped: "backoff",
        recovery: providerRecovery(domain),
      });
      continue;
    }

    const run = await supabase
      .from("busy_website_signal_runs")
      .insert({
        business_id: domain.business_id,
        website_id: domain.website_id,
        provider: "cloudflare_saas",
        signal_type: "domain_sync",
        status: "started",
      })
      .select("id")
      .single();
    try {
      const saved = await syncDomain(domain);
      results.push({ domainId: domain.id, ok: true, status: saved?.provider_status || {} });
      if (run.data?.id) {
        await supabase
          .from("busy_website_signal_runs")
          .update({
            status: "succeeded",
            rows_written: saved ? 1 : 0,
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.data.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Domain provider sync failed.";
      const recovery = await recordProviderFailure(domain, error);
      results.push({
        domainId: domain.id,
        ok: false,
        error: message,
        recovery,
      });
      if (run.data?.id) {
        await supabase
          .from("busy_website_signal_runs")
          .update({
            status: "failed",
            last_error: message,
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.data.id);
      }
    }
  }

  return {
    configured: true,
    config,
    preflight,
    provider: activation.provider || (await inspectPlatformProvider()),
    activation,
    synced: results.filter((item) => !item.skipped).length,
    skippedBackoff,
    results,
  };
}

async function reserveDefaultHostnames(websiteId = "") {
  const config = providerConfig();
  if (!config.baseDomainConfigured) {
    return { configured: false, reserved: 0, promoted: 0 };
  }

  let websiteQuery = supabase
    .from("busy_websites")
    .select("id,business_id,public_slug,default_hostname,default_url,delivery_status,current_live_deployment_id")
    .is("default_hostname", null);
  if (websiteId) websiteQuery = websiteQuery.eq("id", websiteId);
  const websites = await websiteQuery.limit(websiteId ? 1 : 100);
  if (websites.error) throw websites.error;

  let reserved = 0;
  let promoted = 0;
  for (const website of websites.data || []) {
    const businessSuffix = String(website.business_id).replaceAll("-", "").slice(0, 8);
    const slug = clean(website.public_slug, 55).replace(/[^a-z0-9-]/gi, "-").replace(/^-+|-+$/g, "");
    const safeSlug = (slug || "business").slice(0, 42);
    const hostname = `site-${safeSlug}-${businessSuffix}.${BUSY_WEBSITE_BASE_DOMAIN}`.toLowerCase();
    const deliveryStatus = website.current_live_deployment_id ? "provisioning" : "reserved";
    const updated = await supabase
      .from("busy_websites")
      .update({
        default_hostname: hostname,
        default_url: `https://${hostname}`,
        delivery_provider: "cloudflare_saas",
        delivery_status: deliveryStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", website.id)
      .is("default_hostname", null);
    if (!updated.error) {
      reserved += 1;
      if (deliveryStatus === "provisioning") promoted += 1;
    }
  }

  // V3.47 could reserve the address before a first publication, but nothing
  // promoted an already-reserved address once the site later became live.
  // Reconcile that state here so scheduled provider sync self-heals it.
  let readyQuery = supabase
    .from("busy_websites")
    .select("id")
    .not("current_live_deployment_id", "is", null)
    .not("default_hostname", "is", null)
    .eq("delivery_status", "reserved");
  if (websiteId) readyQuery = readyQuery.eq("id", websiteId);
  const ready = await readyQuery.limit(websiteId ? 1 : 100);
  if (ready.error) throw ready.error;

  for (const website of ready.data || []) {
    const updated = await supabase
      .from("busy_websites")
      .update({
        delivery_provider: "cloudflare_saas",
        delivery_status: "provisioning",
        updated_at: new Date().toISOString(),
      })
      .eq("id", website.id)
      .eq("delivery_status", "reserved");
    if (!updated.error) promoted += 1;
  }

  return { configured: true, reserved, promoted };
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json(405, { error: "POST required" });
  if (!(await validRequest(request))) {
    return json(401, { error: "Internal BUSY website-provider authentication required." });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = clean(body?.action, 80) || "status";
    if (action === "status") {
      const config = providerConfig();
      const preflight = await platformPreflight();
      const provider = await inspectPlatformProvider();
      return json(200, {
        ok: true,
        config,
        preflight,
        provider,
        activation: platformActivationState(config, preflight, provider),
      });
    }
    if (action === "bootstrap_platform") {
      const bootstrapped = await bootstrapPlatform();
      const config = providerConfig();
      const preflight = bootstrapped?.preflight || (await platformPreflight());
      const provider = bootstrapped?.provider || (await inspectPlatformProvider());
      return json(200, {
        ok: true,
        ...bootstrapped,
        activation: platformActivationState(config, preflight, provider),
      });
    }
    if (action === "reconcile_platform") {
      return json(200, { ok: true, activation: await reconcilePlatformActivation() });
    }
    if (action === "provision_domain") {
      const domainId = clean(body?.domainId, 80);
      if (!domainId) throw new Error("Domain id required.");
      return json(200, { ok: true, ...(await provisionDomain(domainId)) });
    }
    if (action === "sync_domains") {
      const synced = await syncDomains(Math.min(100, Math.max(1, Number(body?.limit) || 40)));
      const defaults = await reserveDefaultHostnames();
      return json(200, {
        ok: true,
        ...synced,
        defaultHostnames: defaults,
      });
    }
    if (action === "reserve_default_hostnames") {
      const websiteId = clean(body?.websiteId, 80);
      return json(200, {
        ok: true,
        ...(await reserveDefaultHostnames(websiteId)),
      });
    }
    return json(400, { error: "Unknown website provider action." });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Website provider operation failed.",
    });
  }
});
