import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// V3.83 focused static regression: ensure the new screen stays simple,
// avoids privileged founder surfaces, and preserves existing entry points.
const read = (path) => readFileSync(path, "utf8");
const homeSource = read("src/screens/home.js");
const homeStart = homeSource.indexOf("function HomeScreen({ s })");
const homeEnd = homeSource.indexOf("function ProactiveWatch({ s })");
assert.ok(homeStart > 0 && homeEnd > homeStart, "Home boundaries");
const home = homeSource.slice(homeStart, homeEnd);
const shell = read("src/components/ui.js");
const theme = read("src/theme/styles.js");
const app = read("src/app/AppController.js");
const config = JSON.parse(read("app.json"));
const pkg = JSON.parse(read("package.json"));
const runtime = read("src/core/runtime.js");

const checks = [
  ["version aligns across runtime and native config", () => {
    assert.ok(["3.83.0", "3.84.0", "3.85.0", "3.86.0", "3.87.0"].includes(pkg.version));
    assert.equal(config.expo.version, pkg.version);
    assert.ok(runtime.includes(`const APP_VERSION = "${pkg.version.slice(0,-2)}";`));
  }],
  ["Home opts into an isolated dark shell", () => {
    assert.ok(home.includes("      dark\n      hideDevBadge"));
    assert.ok(shell.includes("dark && styles.homeDarkShell"));
    assert.ok(theme.includes('backgroundColor: "#0D131E"'));
  }],
  ["native safe area and status bar follow Home", () => {
    assert.ok(app.includes('<StatusBar barStyle="light-content" />'));
    assert.ok(app.includes("React.createElement(component, { s: appState })"));
  }],
  ["no development version banner on Home", () => {
    assert.ok(shell.includes("!hideDevBadge"));
    assert.ok(!home.includes('eyebrow="V3.68'));
    assert.ok(!home.includes('eyebrow="V3.67'));
  }],
  ["voice first with safe typed fallback", () => {
    assert.ok(home.includes("s.openTalkToBusy(true)"));
    assert.ok(home.includes("s.openTalkToBusy(false)"));
    assert.ok(home.includes("Nothing is sent or published"));
  }],
  ["real weekly booked-job summary", () => {
    assert.ok(home.includes("homeWeekBookings.length"));
    assert.ok(home.includes('action.details?.bookingStatus || "Confirmed"'));
  }],
  ["important inbox and action routes retained", () => {
    assert.ok(home.includes("s.openBusyInbox"));
    assert.ok(home.includes("bestMove.onAction?.()"));
    assert.ok(home.includes("s.openDailyCommandItem") === false);
    assert.ok(home.includes('s.go("dailyCommandCentre")'));
  }],
  ["extra business tools accessible, not always on-screen", () => {
    assert.ok(home.includes("showOtherMoves ?"));
    assert.ok(home.includes("quickTools.map("));
    for (const link of ["s.openSocialCentre()", "s.openWebsiteBuilder()", "s.openBusinessCreationJourney()", 's.go("businessMemory")', 's.go("businessActivityCentre")']) {
      assert.ok(home.includes(link), link);
    }
  }],
  ["founder reporting is not exposed as a Home shortcut", () => {
    assert.ok(!home.includes('s.go("founderOperations")'));
    assert.ok(!home.includes("fetchFounderOperations"));
    assert.ok(!home.includes("fetchFounderServices"));
  }],
  ["dark business screens share the current native shell", () => {
    assert.ok(shell.includes("dark = true"));
    assert.ok(shell.includes("dark && styles.homeDarkNav"));
    assert.ok(theme.includes("safe: { flex: 1, backgroundColor: C.bg }"));
  }],
  ["no new outbound effects on opening Home", () => {
    assert.ok(!home.includes("fetchFounderOperations("));
    assert.ok(!home.includes("syncFounderConnectedProviders("));
    assert.ok(!home.includes("fetchExternalReality("));
  }],
];
for (const [name, run] of checks) {
  run();
  console.log("PASS", name);
}
console.log("V3.83 dark Home checks passed:", checks.length);
