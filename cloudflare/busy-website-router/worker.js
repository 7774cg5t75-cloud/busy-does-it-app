const DEFAULT_ROOT_DOMAIN = "busydoesit.co.uk";
const DEFAULT_ORIGIN_URL =
  "https://qgkmuiipicazmcxxmoxv.supabase.co/functions/v1/busy-website-origin";

function cleanHostname(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/:\d+$/, "");
}

function bypassPlatformHostname(hostname, rootDomain) {
  return (
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === `origin.${rootDomain}` ||
    hostname === `sites.${rootDomain}`
  );
}

function cacheable(response) {
  if (!response || response.status !== 200) return false;
  const type = response.headers.get("content-type") || "";
  return (
    type.startsWith("text/html") ||
    type.startsWith("text/css") ||
    type.startsWith("application/javascript") ||
    type.startsWith("image/")
  );
}

function withEdgeHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-BUSY-Edge", "cloudflare-worker");
  headers.set("Vary", "Accept-Encoding");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const method = request.method.toUpperCase();
    if (!["GET", "HEAD"].includes(method)) {
      return new Response("Method not allowed.", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const incoming = new URL(request.url);
    const hostname = cleanHostname(incoming.hostname);
    const rootDomain = cleanHostname(env.BUSY_ROOT_DOMAIN || DEFAULT_ROOT_DOMAIN);

    // BUSY's own root/marketing hostnames stay free to use a separate origin.
    if (bypassPlatformHostname(hostname, rootDomain)) {
      return fetch(request);
    }

    const originUrl = String(env.BUSY_ORIGIN_URL || DEFAULT_ORIGIN_URL).trim();
    const cacheUrl = new URL("https://busy-edge-cache.invalid/");
    cacheUrl.hostname = "busy-edge-cache.invalid";
    cacheUrl.pathname =
      "/" +
      encodeURIComponent(hostname) +
      "/" +
      incoming.pathname.replace(/^\//, "");
    const cacheKey = new Request(cacheUrl.toString(), {
      method: "GET",
      headers: { Accept: request.headers.get("Accept") || "*/*" },
    });

    if (method === "GET") {
      const cached = await caches.default.match(cacheKey);
      if (cached) {
        const hitHeaders = new Headers(cached.headers);
        hitHeaders.set("X-BUSY-Edge-Cache", "HIT");
        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: hitHeaders,
        });
      }
    }

    const target = new URL(originUrl);
    target.searchParams.set("host", hostname);
    target.searchParams.set("path", incoming.pathname || "/");

    const upstream = await fetch(target.toString(), {
      method,
      headers: {
        Accept: request.headers.get("Accept") || "text/html,*/*;q=0.8",
        "X-BUSY-Original-Host": hostname,
        "X-BUSY-Original-Path": incoming.pathname || "/",
        "User-Agent": "BUSY-Cloudflare-Router/3.46",
      },
      cf: {
        cacheEverything: false,
      },
    });

    const response = withEdgeHeaders(upstream);
    response.headers.set("X-BUSY-Edge-Cache", "MISS");

    if (method === "GET" && cacheable(response)) {
      const stored = response.clone();
      stored.headers.set(
        "Cache-Control",
        response.headers.get("Cache-Control") ||
          "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
      );
      ctx.waitUntil(caches.default.put(cacheKey, stored));
    }

    return response;
  },
};
