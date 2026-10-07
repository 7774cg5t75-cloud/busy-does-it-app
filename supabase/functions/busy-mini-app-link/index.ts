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
  "web",
  "deep_link",
  "marketplace",
  "my_apps",
  "notification",
  "owner_test",
  "unknown",
]);

const allowedIntents = new Set(["", "open", "enquiry", "booking_request"]);

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sourceValue(value: unknown) {
  const source = clean(value, 40).toLowerCase();
  return allowedSources.has(source) ? source : "deep_link";
}

function intentValue(value: unknown) {
  const intent = clean(value, 40).toLowerCase();
  return allowedIntents.has(intent) ? intent : "";
}

function escapeHtml(value: unknown) {
  return clean(value, 3000)
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
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}

function redirect(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

async function recordEntry(app: any, source: string, stage: string) {
  const recorded = await supabase.rpc("busy_mini_app_record_entry", {
    p_business_id: app.business_id,
    p_mini_app_id: app.id,
    p_source: source,
    p_stage: stage,
  });
  if (recorded.error) {
    console.error(
      "BUSY Mini App entry attribution failed",
      recorded.error.message
    );
  }
}

function handoffPage(app: any, source: string, intent: string) {
  const encodedSlug = encodeURIComponent(app.public_slug);
  const encodedSource = encodeURIComponent(source);
  const query = new URLSearchParams({ source });
  if (intent && intent !== "open") query.set("intent", intent);
  const deepLink = `busydoesit://apps/${encodedSlug}?${query.toString()}`;
  const safeDeepLink = escapeHtml(deepLink);
  const businessName = escapeHtml(app.display_name || "this business");
  const category = escapeHtml(app.category || "BUSY Mini App");
  const actionLabel =
    intent === "booking_request"
      ? "Continue booking request in BUSY"
      : intent === "enquiry"
      ? "Continue enquiry in BUSY"
      : "Open in BUSY DOES IT";
  const backUrl =
    `${SUPABASE_URL}/functions/v1/busy-mini-app-link?slug=${encodedSlug}&source=web`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <title>${businessName} • BUSY DOES IT</title>
  <style>
    :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f5f7fb}
    *{box-sizing:border-box}body{margin:0}.wrap{max-width:560px;margin:0 auto;padding:52px 20px;text-align:center}.card{background:#fff;border:1px solid #dfe5ee;border-radius:22px;padding:28px 22px;box-shadow:0 14px 36px rgba(20,32,51,.08)}.brand{font-size:12px;font-weight:850;letter-spacing:.12em}.eyebrow{margin:20px 0 5px;color:#637083;font-size:14px}h1{font-size:30px;line-height:1.1;margin:6px 0 12px}p{line-height:1.55;color:#526075}.button{display:block;margin:22px auto 10px;padding:15px 18px;border-radius:14px;background:#3671e3;color:#fff;text-decoration:none;font-weight:800}.link{display:inline-block;margin-top:12px;color:#3671e3;text-decoration:none;font-weight:700}.small{font-size:13px;color:#7b8596}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="card">
      <div class="brand">BUSY DOES IT</div>
      <div class="eyebrow">${category}</div>
      <h1>${businessName}</h1>
      <p>${
        intent === "enquiry"
          ? "Your enquiry is ready to continue securely in BUSY DOES IT."
          : intent === "booking_request"
          ? "Your booking request is ready to continue securely in BUSY DOES IT. This still does not confirm a diary slot."
          : "Open this business in BUSY DOES IT."
      }</p>
      <a class="button" href="${safeDeepLink}">${escapeHtml(actionLabel)}</a>
      <a class="link" href="${escapeHtml(backUrl)}">Back to the web Mini App</a>
      <p class="small">If BUSY is not installed yet, you can continue browsing the web Mini App. App Store/Play Store fallback is intentionally deferred until the public release path is ready.</p>
    </div>
  </main>
  <script>
    setTimeout(function () {
      window.location.href = ${JSON.stringify(deepLink)};
    }, 350);
  </script>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return page(
      405,
      "<!doctype html><title>BUSY DOES IT</title><p>GET required.</p>"
    );
  }

  const url = new URL(req.url);
  const slug = clean(url.searchParams.get("slug"), 100);
  const source = sourceValue(url.searchParams.get("source"));
  const intent = intentValue(url.searchParams.get("intent"));

  if (!slug) {
    return page(
      400,
      "<!doctype html><title>BUSY DOES IT</title><p>This BUSY Apps link is incomplete.</p>"
    );
  }

  const app = await supabase
    .from("busy_mini_apps")
    .select(
      "id,business_id,public_slug,display_name,category,status,current_live_version_id,public_web_url,public_web_version_id,public_web_status"
    )
    .eq("public_slug", slug)
    .eq("status", "live")
    .maybeSingle();

  if (app.error || !app.data?.id || !app.data.current_live_version_id) {
    return page(
      404,
      "<!doctype html><title>BUSY DOES IT</title><main><h1>BUSY DOES IT</h1><p>This Mini App is not currently available.</p></main>"
    );
  }

  if (intent) {
    if (intent === "enquiry" || intent === "booking_request") {
      await recordEntry(app.data, source, "action_intent");
    }
    return page(200, handoffPage(app.data, source, intent));
  }

  const publicWebUrl = clean(app.data.public_web_url, 2000);
  const webReady =
    app.data.public_web_status === "ready" &&
    app.data.public_web_version_id === app.data.current_live_version_id &&
    /^https:\/\//i.test(publicWebUrl);

  if (webReady) {
    await recordEntry(app.data, source, "web_view");
    const target = new URL(publicWebUrl);
    target.searchParams.set("entry", source);
    return redirect(target.toString());
  }

  // Compatibility fallback for any legacy live version that predates V3.44.
  await recordEntry(app.data, source, "landing");
  return page(200, handoffPage(app.data, source, "open"));
});
