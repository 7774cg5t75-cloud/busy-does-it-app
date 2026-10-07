import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CLOUDFLARE_API_TOKEN = Deno.env.get("CLOUDFLARE_API_TOKEN") || "";
const CLOUDFLARE_ZONE_ID = Deno.env.get("CLOUDFLARE_SAAS_ZONE_ID") || "";
const CLOUDFLARE_CNAME_TARGET = Deno.env.get("CLOUDFLARE_SAAS_CNAME_TARGET") || "";
const BUSY_WEBSITE_BASE_DOMAIN = Deno.env.get("BUSY_WEBSITE_BASE_DOMAIN") || "";
const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";

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

function providerConfig() {
  return {
    provider: "cloudflare_saas",
    configured: !!(
      CLOUDFLARE_API_TOKEN &&
      CLOUDFLARE_ZONE_ID &&
      CLOUDFLARE_CNAME_TARGET
    ),
    hasApiToken: !!CLOUDFLARE_API_TOKEN,
    hasZoneId: !!CLOUDFLARE_ZONE_ID,
    hasCnameTarget: !!CLOUDFLARE_CNAME_TARGET,
    baseDomainConfigured: !!BUSY_WEBSITE_BASE_DOMAIN,
    baseDomain: BUSY_WEBSITE_BASE_DOMAIN || "",
    routingTarget: CLOUDFLARE_CNAME_TARGET || "",
  };
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
    if (record?.txt_name && record?.txt_value) {
      add({
        purpose: "ssl_certificate_validation",
        type: "TXT",
        name: clean(record.txt_name, 500),
        value: clean(record.txt_value, 2000),
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

  const update: any = {
    routing_provider: "cloudflare_saas",
    provider_hostname_id: clean(result?.id, 200) || domain.provider_hostname_id,
    routing_target: CLOUDFLARE_CNAME_TARGET || domain.routing_target,
    routing_status:
      domain.routing_status === "active" && state.hostnameStatus === "active"
        ? "active"
        : state.routingStatus,
    ssl_status: state.sslStatus,
    required_records: requiredRecords(domain, result),
    provider_status: {
      provider: "cloudflare_saas",
      hostnameStatus: state.hostnameStatus,
      sslStatus: state.sslProviderStatus,
      verificationErrors: providerErrors,
      syncedAt: now,
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

    // Cloudflare notes that validation records can be absent from the initial
    // POST response. A follow-up GET is therefore the canonical source.
    if (result?.id) {
      try {
        result = await providerDetails(result.id);
      } catch {
        // Keep the creation response; the scheduled sync will retry details.
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
  if (!domain.provider_hostname_id) return null;
  const result = await providerDetails(domain.provider_hostname_id);
  return await saveProviderState(domain, result);
}

async function syncDomains(limit = 40) {
  const config = providerConfig();
  if (!config.configured) {
    return { configured: false, config, synced: 0, results: [] };
  }

  const domains = await supabase
    .from("busy_website_domains")
    .select("*")
    .eq("routing_provider", "cloudflare_saas")
    .not("provider_hostname_id", "is", null)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(Math.min(100, Math.max(1, limit)));
  if (domains.error) throw domains.error;

  const results: any[] = [];
  for (const domain of domains.data || []) {
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
      results.push({ domainId: domain.id, ok: false, error: message });
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

  return { configured: true, config, synced: results.length, results };
}

async function reserveDefaultHostnames() {
  const config = providerConfig();
  if (!config.baseDomainConfigured) {
    return { configured: false, reserved: 0 };
  }
  const websites = await supabase
    .from("busy_websites")
    .select("id,business_id,public_slug,default_hostname,default_url")
    .is("default_hostname", null)
    .limit(100);
  if (websites.error) throw websites.error;

  let reserved = 0;
  for (const website of websites.data || []) {
    const businessSuffix = String(website.business_id).replaceAll("-", "").slice(0, 8);
    const slug = clean(website.public_slug, 55).replace(/[^a-z0-9-]/gi, "-").replace(/^-+|-+$/g, "");
    const hostname = `${slug || "business"}-${businessSuffix}.${BUSY_WEBSITE_BASE_DOMAIN}`.toLowerCase();
    const updated = await supabase
      .from("busy_websites")
      .update({
        default_hostname: hostname,
        default_url: `https://${hostname}`,
        delivery_provider: "cloudflare_saas",
        delivery_status: "reserved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", website.id)
      .is("default_hostname", null);
    if (!updated.error) reserved += 1;
  }
  return { configured: true, reserved };
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
      return json(200, { ok: true, config: providerConfig() });
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
      return json(200, { ok: true, ...(await reserveDefaultHostnames()) });
    }
    return json(400, { error: "Unknown website provider action." });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Website provider operation failed.",
    });
  }
});
