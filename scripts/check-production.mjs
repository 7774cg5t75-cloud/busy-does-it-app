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
const websiteScaleMigrationSource = fs.readFileSync(
  "supabase/migrations/20261007220000_v3_52_website_scale_hardening.sql",
  "utf8"
);
const websiteScaleIndexMigrationSource = fs.readFileSync(
  "supabase/migrations/20261007221500_v3_52_tenant_fk_indexes.sql",
  "utf8"
);
const websiteReadinessMigrationSource = fs.readFileSync(
  "supabase/migrations/20261007223000_v3_53_release_readiness_controls.sql",
  "utf8"
);
const websiteSimulationSource = fs.readFileSync(
  "scripts/website-platform-simulation.mjs",
  "utf8"
);
const websiteWakeRlsMigrationSource = fs.readFileSync(
  "supabase/migrations/20261007224500_v3_53_worker_wake_rls_policy.sql",
  "utf8"
);
const miniAppsSource = fs.readFileSync(
  "supabase/functions/busy-mini-apps/index.ts",
  "utf8"
);
const busyCommandSource = fs.readFileSync(
  "supabase/functions/busy-command/index.ts",
  "utf8"
);
const miniAppsDomainSource = fs.readFileSync(
  "src/domain/miniApps.js",
  "utf8"
);
const miniAppsScreenSource = fs.readFileSync(
  "src/screens/miniApps.js",
  "utf8"
);
const appBuilderMigrationSource = fs.readFileSync(
  "supabase/migrations/20261007231500_v3_54_business_app_builder_intelligence.sql",
  "utf8"
);
const productionWorkflowSource = fs.readFileSync(
  ".github/workflows/production-check.yml",
  "utf8"
);

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
  ["V3.54 public website origin", fs.existsSync("supabase/functions/busy-website-origin/index.ts")],
  ["V3.54 Cloudflare router Worker", fs.existsSync("cloudflare/busy-website-router/worker.js")],
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
  ["V3.51 provider retries are bounded", websiteProviderSource.includes("recoveryDue") && websiteProviderSource.includes("recordProviderFailure") && websiteProviderSource.includes("nextRetryAt")],
  ["V3.51 provider retry storms are backoff-limited", websiteProviderSource.includes("recoveryDelayMinutes") && websiteProviderSource.includes("skippedBackoff")],
  ["V3.51 health requires confirmed failures", websiteHealthSource.includes("failureStreak") && websiteHealthSource.includes("liveFailureStreak < 2") && websiteHealthSource.includes("defaultFailureStreak >= 2")],
  ["V3.51 known-good custom domains survive one failed check", websiteHealthSource.includes("observing_transient") && websiteHealthSource.includes("streak >= 2")],
  ["V3.51 publishing retries use exponential jitter", websiteWorkerSource.includes("retryDelaySeconds") && websiteWorkerSource.includes("permanentPublishingFailure")],
  ["V3.51 safe recovery orchestration", websitePublishApiSource.includes("safeRecovery") && websitePublishApiSource.includes('action === "recover"')],
  ["V3.51 recovery intelligence model", websitePublishingDomainSource.includes("recoveryState") && websitePublishingDomainSource.includes("owner_dns_action") && websitePublishingDomainSource.includes("lastKnownGoodDeployment")],
  ["V3.51 owner recovery centre", websitePublishingScreenSource.includes("Hosting intelligence & recovery") && websitePublishingScreenSource.includes("Run safe recovery now")],
  ["V3.51 recovery action wired to app", controllerSource.includes("retryWebsiteRecovery") && controllerSource.includes('websitePublishingRequest("recover")')],
  ["V3.52 one active operation per website", websiteScaleMigrationSource.includes("busy_website_publish_jobs_one_active_website_idx") && websitePublishApiSource.includes("another website operation")],
  ["V3.52 atomic worker leases", websiteScaleMigrationSource.includes("busy_claim_website_publish_job") && websiteWorkerSource.includes("p_processing_token") && websiteWorkerSource.includes("lease_held")],
  ["V3.52 stale jobs self-recover", websiteScaleMigrationSource.includes("busy_recover_stale_website_publish_jobs") && websiteWorkerSource.includes("staleRecovered")],
  ["V3.52 failed updates preserve a proven live site", websiteWorkerSource.includes('website.current_live_deployment_id') && websiteWorkerSource.includes('canRetry\n          ? "update_pending"\n          : "live"')],
  ["V3.52 tenant-fair queue", websiteWorkerSource.includes("tenant_fairness") && websiteWorkerSource.includes("seenBusinesses") && websitePublishingScreenSource.includes("Tenant-fair production queue")],
  ["V3.52 cross-tenant database guards", websiteScaleMigrationSource.includes("busy_website_publish_jobs_tenant_deployment_fkey") && websiteScaleMigrationSource.includes("busy_website_health_checks_tenant_domain_fkey")],
  ["V3.52 composite tenant foreign keys are indexed", websiteScaleIndexMigrationSource.includes("busy_website_publish_jobs_tenant_deployment_idx") && websiteScaleIndexMigrationSource.includes("busy_website_health_checks_tenant_domain_idx") && websiteScaleIndexMigrationSource.includes("busy_website_usage_daily_tenant_site_idx")],
  ["V3.52 provider retries are indexable", websiteScaleMigrationSource.includes("provider_next_retry_at") && websiteProviderSource.includes("provider_next_retry_at") && websiteProviderSource.includes("provider_attempt_count")],
  ["V3.52 adaptive health scheduling", websiteScaleMigrationSource.includes("next_health_check_at") && websiteHealthSource.includes("nextHealthMinutes") && websiteHealthSource.includes("dueFilter")],
  ["V3.52 route probes are concurrent", websiteHealthSource.includes("const routeChecks = await Promise.all") && websiteHealthSource.includes("domainRows.map")],
  ["V3.52 health work is continuously spread", websiteScaleMigrationSource.includes("busy-website-health-minute") && websiteScaleMigrationSource.includes("jsonb_build_object('limit', 20)")],
  ["V3.52 tenant operation rate safeguard", websitePublishApiSource.includes("unusually high publishing activity") && websitePublishApiSource.includes('recent.count || 0') && websitePublishApiSource.includes(">= 30")],
  ["V3.52 custom-domain capacity safeguard", websitePublishApiSource.includes("maximum number of active or pending custom domains") && websitePublishApiSource.includes(">= 5")],
  ["V3.52 operational pressure metrics", websiteScaleMigrationSource.includes("busy_website_operational_metrics") && websiteScaleMigrationSource.includes("failed_signals_24h")],
  ["V3.52 bounded operational retention", websiteScaleMigrationSource.includes("busy_prune_website_operational_history") && websiteScaleMigrationSource.includes("180 days")],
  ["V3.53 immediate worker wakes are coalesced", websiteReadinessMigrationSource.includes("busy_should_wake_website_worker") && websitePublishApiSource.includes("p_min_gap_seconds: 5")],
  ["V3.53 backlog-sensitive worker fanout", websiteReadinessMigrationSource.includes("busy_wake_website_worker_scaled") && websiteReadinessMigrationSource.includes("else 8") && websiteReadinessMigrationSource.includes("'limit', 12")],
  ["V3.53 health scheduler has 10k headroom", websiteReadinessMigrationSource.includes("jsonb_build_object('limit', 40)") && websiteHealthSource.includes(": 720;")],
  ["V3.53 healthy provider reconciliation is spread", websiteProviderSource.includes("48 * 60 * 60000")],
  ["V3.53 service-only live readiness snapshot", websiteReadinessMigrationSource.includes("busy_website_release_readiness") && websiteReadinessMigrationSource.includes("revoke all on function public.busy_website_release_readiness")],
  ["V3.53 internal wake state has explicit deny RLS", websiteWakeRlsMigrationSource.includes("busy_website_worker_wake_state_deny_authenticated") && websiteWakeRlsMigrationSource.includes("using (false)") && websiteWakeRlsMigrationSource.includes("with check (false)")],
  ["V3.53 deterministic 10k simulation exists", websiteSimulationSource.includes("10000") && websiteSimulationSource.includes("simulatedCrashEvery") && websiteSimulationSource.includes("cross-tenant-mismatch-rejected")],
  ["V3.53 simulation models cost envelope", websiteSimulationSource.includes("dailyEnvelope") && websiteSimulationSource.includes("assumedPublishesAtTenPercentDaily")],
  ["V3.53 simulation is a production release gate", productionWorkflowSource.includes("Simulate website scale and failure recovery") && productionWorkflowSource.includes("website-platform-simulation.mjs")],
  ["V3.54 controlled business app planner", miniAppsSource.includes("planBusinessApp") && miniAppsSource.includes("applyBusinessAppPlan") && miniAppsSource.includes("appPlanSchema")],
  ["V3.54 app planner uses recorded business facts", miniAppsSource.includes("serviceNames") && miniAppsSource.includes("approvedGalleryCount") && miniAppsSource.includes("existingEnabledModules")],
  ["V3.54 planned modules cannot be silently enabled", miniAppsSource.includes("catalogItem.status !== \"available\"") && miniAppsSource.includes("unsupportedRequests")],
  ["V3.54 offers require explicit approved wording", miniAppsSource.includes("Offers must contain explicit content") && miniAppsSource.includes("approvedOffers") && appBuilderMigrationSource.includes("requires_approved_offer_data")],
  ["V3.54 voice requests route into reviewed app plans", busyCommandSource.includes('actionLabel=\"Create app plan\"') && busyCommandSource.includes("Copy the owner's requested app outcome/features") && controllerSource.includes("planMiniAppFromBrief(brief)")],
  ["V3.54 owner can review plan before draft mutation", miniAppsScreenSource.includes("BUSY App Plan") && miniAppsScreenSource.includes("Build this app plan") && miniAppsScreenSource.includes("Nothing public changes here")],
  ["V3.54 targeted missing-fact questions", miniAppsSource.includes("missingFacts") && miniAppsScreenSource.includes("BUSY still needs")],
  ["V3.54 business app terminology introduced", miniAppsScreenSource.includes('title=\"Business App Builder\"') && miniAppsSource.includes('surface: \"busy_business_app\"')],
  ["V3.54 app-plan state survives draft refresh", miniAppsDomainSource.includes("builderPlan") && controllerSource.includes("draft_config?.builderPlan")],
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
