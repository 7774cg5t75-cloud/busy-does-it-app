import fs from "node:fs";

const readJson = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const pkg = readJson("package.json");
const app = readJson("app.json").expo || {};
const eas = readJson("eas.json");
const controllerSource = fs.readFileSync("src/app/AppController.js", "utf8");
const snackPublisherSource = fs.readFileSync("scripts/publish-snack.mjs", "utf8");
const supabaseConfigSource = fs.readFileSync("supabase/config.toml", "utf8");
const websiteProviderSource = fs.readFileSync("supabase/functions/busy-website-provider/index.ts", "utf8");
const websitePublishApiSource = fs.readFileSync("supabase/functions/busy-website-publish/index.ts", "utf8");
const websiteWorkerSource = fs.readFileSync("supabase/functions/busy-website-worker/index.ts", "utf8");
const websiteHealthSource = fs.readFileSync("supabase/functions/busy-website-health/index.ts", "utf8");
const websitePublishingDomainSource = fs.readFileSync("src/domain/websitePublishing.js", "utf8");
const websitePublishingScreenSource = fs.readFileSync("src/screens/websitePublishing.js", "utf8");
const websiteOriginSource = fs.readFileSync("supabase/functions/busy-website-origin/index.ts", "utf8");
const websiteRouterSource = fs.readFileSync("cloudflare/busy-website-router/worker.js", "utf8");

const checks = [
  ["package/app version match", pkg.version === app.version && /^3\.\d+\.\d+$/.test(String(pkg.version || ""))],
  ["Expo SDK 57", String(pkg.dependencies?.expo || "").startsWith("~57.")],
  ["expo-dev-client", !!pkg.dependencies?.["expo-dev-client"]],
  ["expo-constants", !!pkg.dependencies?.["expo-constants"]],
  ["native URL scheme", app.scheme === "busydoesit"],
  ["iOS bundle identifier", app.ios?.bundleIdentifier === "com.busydoesit.app"],
  ["Android package", app.android?.package === "com.busydoesit.app"],
  ["notifications plugin", (app.plugins || []).some((item) => (Array.isArray(item) ? item[0] : item) === "expo-notifications")],
  ["calendar plugin", (app.plugins || []).some((item) => (Array.isArray(item) ? item[0] : item) === "expo-calendar")],
  ["development build profile", eas.build?.development?.developmentClient === true],
  ["preview build profile", eas.build?.preview?.distribution === "internal"],
  ["production auto increment", eas.build?.production?.autoIncrement === true],
  ["Node 22 production runtime", String(eas.build?.production?.node || "").startsWith("22.")],
  ["preview channel", eas.build?.preview?.channel === "preview"],
  ["production channel", eas.build?.production?.channel === "production"],
  ["Google Calendar sync function", fs.existsSync("supabase/functions/busy-calendar-sync/index.ts")],
  ["production watch function", fs.existsSync("supabase/functions/busy-production-watch/index.ts")],
  ["EAS link workflow", fs.existsSync(".github/workflows/eas-link.yml")],
  ["native development build workflow", fs.existsSync(".github/workflows/native-development-build.yml")],
  ["SDK57 calendar legacy import", controllerSource.includes('import * as Calendar from "expo-calendar/legacy";')],
  ["SDK54 Snack calendar rewrite", snackPublisherSource.includes('expo-calendar/legacy') && snackPublisherSource.includes('expo-calendar";')],
  ["V3.50 public website origin", fs.existsSync("supabase/functions/busy-website-origin/index.ts")],
  ["V3.50 Cloudflare router Worker", fs.existsSync("cloudflare/busy-website-router/worker.js")],
  ["website origin is public edge function", supabaseConfigSource.includes("[functions.busy-website-origin]") && supabaseConfigSource.includes("verify_jwt = false")],
  ["BUSY production root domain", websiteProviderSource.includes("busydoesit.co.uk")],
  ["Cloudflare automated platform bootstrap", websiteProviderSource.includes("bootstrapPlatform") && websiteProviderSource.includes("uploadRouterWorker")],
  ["V3.48 scheduled Cloudflare activation", websiteProviderSource.includes("reconcilePlatformActivation") && websiteProviderSource.includes("platformActivationState")],
  ["V3.48 provider sync triggers activation", websiteProviderSource.includes("const activation = await reconcilePlatformActivation()")],
  ["V3.48 live sites promote reserved BUSY addresses", websiteProviderSource.includes('delivery_status", "reserved"') && websiteProviderSource.includes('"provisioning"')],
  ["V3.48 publish starts BUSY address route proof", websiteWorkerSource.includes('delivery_status: "provisioning"')],
  ["V3.48 health proves BUSY address before activation", websiteHealthSource.includes('"default_domain"') && websiteHealthSource.includes('delivery_status = "active"')],
  ["V3.49 publish immediately starts delivery proof", websiteWorkerSource.includes("verifyPublicDelivery") && websiteWorkerSource.includes("reserve_default_hostnames") && websiteWorkerSource.includes("websiteId") && websiteWorkerSource.includes("busy-website-health")],
  ["V3.49 immediate provider reconciliation is tenant-targeted", websiteProviderSource.includes("reserveDefaultHostnames(websiteId") && websiteProviderSource.includes('websiteQuery.eq("id", websiteId)')],
  ["V3.49 owner Go Live journey", websitePublishingDomainSource.includes("goLiveJourney") && websitePublishingDomainSource.includes("live_healthy")],
  ["V3.49 Go Live UI is owner-facing", websitePublishingScreenSource.includes("One approval • automatic delivery checks") && websitePublishingScreenSource.includes("Open public BUSY website")],
  ["V3.50 verified domains auto-provision", websiteProviderSource.includes("findProviderHostname") && websiteProviderSource.includes('in("status", ["verified", "active"])') && websiteProviderSource.includes("provisionDomain(domain.id)")],
  ["V3.50 custom hostname recovery is idempotent", websiteProviderSource.includes("custom_hostnames?hostname=") && websiteProviderSource.includes("scheduled reconciliation will retry safely")],
  ["V3.50 Cloudflare validation TXT variants supported", websiteProviderSource.includes("txt_value || record?.txt_record")],
  ["V3.50 ownership continues into provider activation", websitePublishApiSource.includes("continueVerifiedDomainActivation") && websitePublishApiSource.includes("activation,")],
  ["V3.50 BUSY platform namespace is reserved", websitePublishApiSource.includes("BUSY platform hostnames are reserved") && websitePublishApiSource.includes('hostname.endsWith(`.${BUSY_ROOT_DOMAIN}`)')],
  ["V3.50 customer-domain journey model", websitePublishingDomainSource.includes("customDomainStage") && websitePublishingDomainSource.includes("customDomainSteps") && websitePublishingDomainSource.includes("customDomainPublicAddress")],
  ["V3.50 customer-domain UI is guided", websitePublishingScreenSource.includes("Your own domain • one ownership check") && websitePublishingScreenSource.includes("Check domain setup now") && websitePublishingScreenSource.includes("Open customer-owned website")],
  ["V3.50 custom domain becomes preferred public address", controllerSource.includes("primaryPublicAddress?.url") && controllerSource.includes("openCustomWebsiteDomain")],
  ["Cloudflare root routes excluded", websiteProviderSource.includes("ensureWorkerRoutes") && websiteProviderSource.includes("www.")],
  ["health checks bypass website edge cache", websiteRouterSource.includes("BUSY-Website-Health/") && websiteProviderSource.includes("BUSY-Website-Health/")],
  ["website origin rejects storage traversal", websiteOriginSource.includes('part === ".."') && websiteOriginSource.includes("busy-website-public")],
  ["website origin hardened headers", websiteOriginSource.includes("Content-Security-Policy") && websiteOriginSource.includes("X-Frame-Options")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failed += 1;
}
if (failed) {
  console.error(`Production foundation check failed: ${failed} issue${failed === 1 ? "" : "s"}.`);
  process.exit(1);
}
console.log(`Production foundation check passed: ${checks.length} checks.`);
