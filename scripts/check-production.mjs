import fs from "node:fs";

const readJson = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const pkg = readJson("package.json");
const app = readJson("app.json").expo || {};
const eas = readJson("eas.json");
const controllerSource = fs.readFileSync("src/app/AppController.js", "utf8");
const snackPublisherSource = fs.readFileSync("scripts/publish-snack.mjs", "utf8");

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
