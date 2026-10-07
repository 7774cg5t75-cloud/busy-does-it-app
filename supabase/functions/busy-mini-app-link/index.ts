import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const allowedSources = new Set([
  "qr",
  "share",
  "deep_link",
  "marketplace",
  "my_apps",
  "notification",
  "owner_test",
  "unknown",
]);

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sourceValue(value: unknown) {
  const source = clean(value, 40).toLowerCase();
  return allowedSources.has(source) ? source : "deep_link";
}

function escapeHtml(value: unknown) {
  return clean(value, 1000)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function page(status: number, body: string) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return page(405, "<!doctype html><title>BUSY DOES IT</title><p>GET required.</p>");
  }

  const url = new URL(req.url);
  const slug = clean(url.searchParams.get("slug"), 100);
  const source = sourceValue(url.searchParams.get("source"));
  if (!slug) {
    return page(
      400,
      "<!doctype html><title>BUSY DOES IT</title><p>This BUSY Apps link is incomplete.</p>"
    );
  }

  const app = await supabase
    .from("busy_mini_apps")
    .select("id,business_id,public_slug,display_name,category,status,current_live_version_id")
    .eq("public_slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (app.error || !app.data?.id || !app.data.current_live_version_id) {
    return page(
      404,
      "<!doctype html><title>BUSY DOES IT</title><main><h1>BUSY DOES IT</h1><p>This Mini App is not currently available.</p></main>"
    );
  }

  const userAgent = clean(req.headers.get("user-agent"), 500);
  const inserted = await supabase.from("busy_mini_app_entry_events").insert({
    business_id: app.data.business_id,
    mini_app_id: app.data.id,
    consumer_user_id: null,
    source,
    stage: "landing",
    user_agent: userAgent || null,
  });
  if (inserted.error) {
    console.error("BUSY Mini App landing attribution failed", inserted.error.message);
  }

  const encodedSlug = encodeURIComponent(app.data.public_slug);
  const encodedSource = encodeURIComponent(source);
  const deepLink = `busydoesit://apps/${encodedSlug}?source=${encodedSource}`;
  const safeDeepLink = escapeHtml(deepLink);
  const businessName = escapeHtml(app.data.display_name || "this business");
  const category = escapeHtml(app.data.category || "BUSY Mini App");

  return page(
    200,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>${businessName} • BUSY DOES IT</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    body { margin:0; background:#f5f7fb; color:#162033; }
    main { max-width:560px; margin:0 auto; padding:56px 22px 36px; text-align:center; }
    .card { background:#fff; border:1px solid #dde3ec; border-radius:22px; padding:28px 22px; box-shadow:0 12px 32px rgba(17,24,39,.08); }
    .brand { font-weight:800; letter-spacing:.08em; font-size:13px; }
    .eyebrow { color:#687386; margin-top:18px; font-size:14px; }
    h1 { font-size:30px; line-height:1.12; margin:8px 0 10px; }
    p { line-height:1.5; color:#526075; }
    a.button { display:block; margin:24px auto 12px; padding:15px 18px; border-radius:14px; background:#3671e3; color:#fff; text-decoration:none; font-weight:750; }
    .small { font-size:13px; color:#7b8596; }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <div class="brand">BUSY DOES IT</div>
      <div class="eyebrow">${category}</div>
      <h1>${businessName}</h1>
      <p>Open this business's Mini App in BUSY DOES IT to view its live information and available customer actions.</p>
      <a class="button" id="open" href="${safeDeepLink}">Open in BUSY DOES IT</a>
      <p class="small">If the app does not open automatically, tap the button above. App Store fallback will be attached to this same customer-entry flow before public release.</p>
    </div>
  </main>
  <script>
    setTimeout(function () {
      window.location.href = ${JSON.stringify(deepLink)};
    }, 350);
  </script>
</body>
</html>`
  );
});
