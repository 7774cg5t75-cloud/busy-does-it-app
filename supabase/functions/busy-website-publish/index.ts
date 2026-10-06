import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PREVIEW_BUCKET = "busy-website-preview";
const WORKER_URL = `${SUPABASE_URL}/functions/v1/busy-website-worker`;

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

async function queueMetrics() {
  const result = await supabase.rpc("busy_website_publish_queue_metrics");
  if (result.error) return null;
  return Array.isArray(result.data) ? result.data[0] || null : result.data;
}

async function websiteStatus(businessId: string) {
  const website = await websiteForBusiness(businessId);
  if (!website) {
    return {
      website: null,
      deployments: [],
      domains: [],
      jobs: [],
      queue: await queueMetrics(),
    };
  }

  const [deployments, domains, jobs, queue] = await Promise.all([
    supabase
      .from("busy_website_deployments")
      .select(
        "id,version_no,source_generation,state,content_hash,manifest,preview_storage_path,public_storage_path,public_url,artifact_bytes,last_error,created_at,prepared_at,published_at"
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
        "id,deployment_id,action,status,attempt_count,max_attempts,last_error,requested_at,started_at,completed_at"
      )
      .eq("website_id", website.id)
      .order("requested_at", { ascending: false })
      .limit(12),
    queueMetrics(),
  ]);

  if (deployments.error) throw deployments.error;
  if (domains.error) throw domains.error;
  if (jobs.error) throw jobs.error;

  return {
    website,
    deployments: deployments.data || [],
    domains: domains.data || [],
    jobs: jobs.data || [],
    queue,
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
    .eq("deployment_id", deploymentId)
    .eq("action", action)
    .in("status", ["queued", "processing", "retry_wait"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (active.error) throw active.error;
  if (active.data) return active.data;

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
        .eq("deployment_id", deploymentId)
        .eq("action", action)
        .in("status", ["queued", "processing", "retry_wait"])
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (raced.error) throw raced.error;
      if (raced.data) return raced.data;
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

  wakeWorker();
  return created.data;
}

function wakeWorker() {
  const promise = fetch(WORKER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit: 5 }),
  }).catch(() => null);

  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(promise);
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
  const serialized = JSON.stringify(sourceDraft);
  if (!serialized || serialized.length > 1_000_000) {
    throw new Error("The website draft is too large to prepare safely.");
  }

  const website = await ensureWebsite(businessId, userId, sourceDraft);
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
  if (deployment.data.state === "live") {
    return { ok: true, reused: true, deployment: deployment.data };
  }
  if (deployment.data.state !== "preview_ready") {
    throw new Error("Preview the prepared website version before publishing it.");
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

  const token = crypto.randomUUID();
  const inserted = await supabase
    .from("busy_website_domains")
    .insert({
      business_id: businessId,
      website_id: website.id,
      hostname,
      verification_token: token,
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
    { headers: { Accept: "application/dns-json" } }
  );
  const payload: any = await response.json().catch(() => ({}));
  const answers = Array.isArray(payload?.Answer) ? payload.Answer : [];
  const found = answers.some((answer: any) => {
    const value = cleanText(answer?.data, 1000)
      .replace(/^"/, "")
      .replace(/"$/, "")
      .replace(/"\s+"/g, "");
    return value.includes(domain.data.verification_token);
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
      "rollback",
      "request_domain",
      "verify_domain",
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
      return json(200, {
        ok: true,
        ...(await verifyDomain(businessId, domainId)),
      });
    }

    return json(400, { error: "Unknown website publishing action." });
  } catch (error) {
    return json(400, {
      error: error instanceof Error ? error.message : "Website publishing request failed.",
    });
  }
});
