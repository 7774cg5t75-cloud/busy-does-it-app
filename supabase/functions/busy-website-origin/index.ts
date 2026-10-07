import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const PUBLIC_BUCKET = "busy-website-public";
const BUSY_ROOT_DOMAIN =
  (Deno.env.get("BUSY_WEBSITE_ROOT_DOMAIN") || "busydoesit.co.uk").toLowerCase();

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function clean(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normaliseHostname(value: unknown) {
  return clean(value, 300)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function validHostname(value: string) {
  return (
    value.length >= 3 &&
    value.length <= 253 &&
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      value
    )
  );
}

function objectPathFor(rawPath: string) {
  let path = clean(rawPath, 1200) || "/";
  try {
    path = decodeURIComponent(path);
  } catch {
    throw new Error("Invalid website path.");
  }
  path = path.split("?")[0].split("#")[0].replace(/\\/g, "/");
  if (path.includes("\0") || path.split("/").some((part) => part === "..")) {
    throw new Error("Invalid website path.");
  }
  path = path.replace(/^\/+/, "").replace(/\/{2,}/g, "/");

  if (!path) return "index.html";
  if (path.endsWith("/")) return `${path}index.html`;
  const last = path.split("/").pop() || "";
  if (/\.[a-z0-9]{1,10}$/i.test(last)) return path;
  return `${path}/index.html`;
}

function responseHeaders(contentType = "text/html; charset=utf-8") {
  const html = /^text\/html/i.test(contentType);
  return {
    "Content-Type": contentType,
    "Cache-Control": html
      ? "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
      : "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    ...(html
      ? {
          "Content-Security-Policy":
            "default-src 'self' https: data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
        }
      : {}),
  };
}

function plain(status: number, message: string) {
  return new Response(message, {
    status,
    headers: {
      ...responseHeaders("text/plain; charset=utf-8"),
      "Cache-Control": status === 404 ? "public, max-age=30, s-maxage=60" : "no-store",
    },
  });
}

async function websiteForHost(hostname: string) {
  if (
    hostname === BUSY_ROOT_DOMAIN ||
    hostname === `www.${BUSY_ROOT_DOMAIN}` ||
    hostname === `origin.${BUSY_ROOT_DOMAIN}` ||
    hostname === `sites.${BUSY_ROOT_DOMAIN}`
  ) {
    return null;
  }

  const defaultSite = await supabase
    .from("busy_websites")
    .select(
      "id,business_id,current_live_deployment_id,default_hostname,delivery_status,status"
    )
    .eq("default_hostname", hostname)
    .maybeSingle();
  if (defaultSite.error) throw defaultSite.error;
  if (defaultSite.data?.id && defaultSite.data.current_live_deployment_id) {
    return defaultSite.data;
  }

  const domain = await supabase
    .from("busy_website_domains")
    .select(
      "id,business_id,website_id,status,routing_status,ssl_status,routing_provider,provider_hostname_id"
    )
    .eq("hostname", hostname)
    .maybeSingle();
  if (domain.error) throw domain.error;
  if (!domain.data?.website_id) return null;
  if (!["verified", "active"].includes(domain.data.status)) return null;
  if (!["pending", "validating", "active"].includes(domain.data.routing_status)) {
    return null;
  }
  if (
    domain.data.routing_provider !== "cloudflare_saas" ||
    !domain.data.provider_hostname_id
  ) {
    return null;
  }

  const website = await supabase
    .from("busy_websites")
    .select(
      "id,business_id,current_live_deployment_id,default_hostname,delivery_status,status"
    )
    .eq("id", domain.data.website_id)
    .eq("business_id", domain.data.business_id)
    .maybeSingle();
  if (website.error) throw website.error;
  if (!website.data?.id || !website.data.current_live_deployment_id) return null;
  return website.data;
}

async function serveWebsite(
  hostname: string,
  requestPath: string,
  method: "GET" | "HEAD"
) {
  const website = await websiteForHost(hostname);
  if (!website) {
    return plain(404, "BUSY website not found.");
  }

  const objectPath = objectPathFor(requestPath);
  const storagePath = `${website.business_id}/${website.id}/live/${objectPath}`;
  const publicUrl = supabase.storage
    .from(PUBLIC_BUCKET)
    .getPublicUrl(storagePath).data.publicUrl;

  const upstream = await fetch(publicUrl, {
    method: method === "HEAD" ? "HEAD" : "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "BUSY-Website-Origin/3.46",
      Accept: "text/html,image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });

  if (!upstream.ok) {
    if (upstream.status === 404) return plain(404, "Page not found.");
    return plain(502, "BUSY could not load this published website.");
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  const headers = new Headers(responseHeaders(contentType));
  headers.set(
    "X-BUSY-Deployment",
    clean(website.current_live_deployment_id, 80)
  );
  headers.set("X-BUSY-Website", clean(website.id, 80));

  const etag = upstream.headers.get("etag");
  if (etag) headers.set("ETag", etag);
  const lastModified = upstream.headers.get("last-modified");
  if (lastModified) headers.set("Last-Modified", lastModified);

  return new Response(method === "HEAD" ? null : upstream.body, {
    status: 200,
    headers,
  });
}

Deno.serve(async (request: Request) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    return plain(405, "GET or HEAD required.");
  }

  try {
    const url = new URL(request.url);
    const hostname = normaliseHostname(
      request.headers.get("x-busy-original-host") ||
        url.searchParams.get("host") ||
        ""
    );
    if (!validHostname(hostname)) {
      return plain(400, "A valid website hostname is required.");
    }

    const requestPath =
      clean(request.headers.get("x-busy-original-path"), 1200) ||
      clean(url.searchParams.get("path"), 1200) ||
      "/";

    return await serveWebsite(
      hostname,
      requestPath,
      request.method === "HEAD" ? "HEAD" : "GET"
    );
  } catch (error) {
    console.error(
      "BUSY website origin error",
      error instanceof Error ? error.message : error
    );
    return plain(500, "BUSY could not resolve this website.");
  }
});
