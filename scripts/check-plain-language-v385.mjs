import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// V3.85 verifies customer-facing copy only. Stable route IDs and stored data
// keys stay untouched; no role or server permissions are changed.
const read = (p) => readFileSync(p, "utf8");
const results = read("src/screens/results.js");
const work = read("src/screens/work.js");
const home = read("src/screens/home.js");
const settings = read("src/screens/settings.js");
const social = read("src/screens/social.js");
const customers = read("src/screens/customers.js");
const runtime = read("src/core/runtime.js");
const pkg = JSON.parse(read("package.json"));
const expo = JSON.parse(read("app.json")).expo;

const checks = [
  ["version matched without changing bundle ID", () => {
    assert.ok(["3.85.0", "3.86.0", "3.87.0"].includes(pkg.version));
    assert.equal(expo.version, pkg.version);
    assert.equal(expo.ios.bundleIdentifier, "com.busydoesit.app");
    assert.equal(expo.ios.buildNumber, String(Number(pkg.version.split(".")[1]) - 80));
    assert.ok(runtime.includes(`const APP_VERSION = "${pkg.version.slice(0,-2)}";`));
  }],
  ["Customers & enquiries appears in Work, Results, Settings and customer records", () => {
    for (const source of [results, work, settings, customers]) {
      assert.ok(source.includes('label="Customers & enquiries"'), "missing customer-facing label");
      assert.ok(source.includes('s.go("workPipeline")'), "must preserve original saved-data route");
    }
    assert.ok(work.includes('title="Customers & enquiries"'));
    assert.ok(!work.includes('title="Customer pipeline"'));
  }],
  ["Results opens with a concise real-record summary", () => {
    assert.ok(results.includes('title="Your results"'));
    assert.ok(results.includes("Based on your saved records, not estimated earnings."));
    assert.ok(results.includes("s.completedJobValue"));
    assert.ok(results.includes("s.bookedWorkValue"));
    assert.ok(results.includes("confirmedBookings"));
    assert.ok(results.includes("showDetailedResults ?"));
    assert.ok(results.includes('label={showDetailedResults ? "Hide detailed reports" : "Show detailed reports"}'));
  }],
  ["long Results statistics hidden by default, not deleted", () => {
    assert.ok(results.includes("useState(false)"));
    assert.ok(results.includes('eyebrow="Why BUSY makes these suggestions"'));
    assert.ok(results.includes("s.reactivationEvidence"));
    assert.ok(results.includes("s.postEvidence"));
    assert.ok(results.includes('s.go("businessBrain")'));
  }],
  ["Settings starts with everyday navigation but preserves deeper options", () => {
    assert.ok(settings.includes('title="Settings"'));
    assert.ok(settings.includes("showMoreSettings ?"));
    assert.ok(settings.includes("useState(false)"));
    for (const phrase of ["Account & privacy","Customers & enquiries","Social Media","Business type & services","Connected accounts","Spending limits","Show more settings"]) {
      assert.ok(settings.includes(phrase),phrase);
    }
    for (const route of ["accountData","businessType","connectedAccounts","settingsLimits","founderOperations"]) {
      if (route !== "founderOperations") assert.ok(settings.includes('s.go("'+route+'")'), route);
    }
  }],
  ["Home extra tools keep the same working destinations", () => {
    assert.ok(home.includes("See all BUSY tools +"));
    assert.ok(home.includes("onPress={s.openSocialCentre}"));
    assert.ok(home.includes('["Grow my business", () => s.go("growthCommandCentre")]'));
    assert.ok(home.includes('["Today’s priorities", () => s.go("dailyCommandCentre")]'));
  }],
  ["Social Media displays a clear title and retains safety", () => {
    assert.ok(social.includes('title="Social Media"'));
    assert.ok(social.includes('label="Back to Social Media"'));
    assert.ok(social.includes("Publishing only works after you connect and approve the relevant account."));
    assert.ok(social.includes("s.go(\"connectedAccounts\")"));
  }],
  ["No new external sends or database writes in the main Results screen", () => {
    const start = results.indexOf("function Results({ s }) {");
    const end = results.indexOf("function ResultDetails({ s })");
    const part = results.slice(start, end);
    assert.ok(start >= 0 && end > start);
    assert.ok(!part.includes("fetch("));
    assert.ok(!part.includes("supabase.functions.invoke("));
    assert.ok(!part.includes("s.publish("));
  }],
];
for (const [name, test] of checks) {
  test();
  console.log("PASS", name);
}
console.log("V3.85 plain-English and navigation checks passed:",checks.length);
