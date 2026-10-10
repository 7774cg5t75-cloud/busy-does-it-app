import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// V3.86: static regressions verify UI order and the preservation of
// customer data routes. Native iPhone checks are still required.
const read = p => readFileSync(p, "utf8");
const work = read("src/screens/work.js");
const styles = read("src/theme/styles.js");
const runtime = read("src/core/runtime.js");
const pkg = JSON.parse(read("package.json"));
const app = JSON.parse(read("app.json")).expo;
const start = work.indexOf("function WorkHub({ s }) {");
const end = work.indexOf("\nfunction WorkCalendar({ s })", start);
assert.ok(start >= 0 && end > start, "WorkHub section exists");
const page = work.slice(start, end);
const order = [
  "workOverviewRow",
  "Your calendar",
  "workCalendarGrid",
  "Customers & enquiries",
  "More work tools and reports",
  "Detailed work report",
  "BUSY's weekly plan",
  "Look ahead • next 14 days",
];
for (let i=0;i<order.length;i++) {
  const position = page.indexOf(order[i]);
  assert.ok(position>=0, order[i]+" must remain in Work");
  if (i) assert.ok(position>page.indexOf(order[i-1]),
    order[i]+" appears after "+order[i-1]);
}
const checks = [
  ["version and signed iOS metadata", () => {
    assert.ok(["3.86.0","3.87.0","3.88.0","3.89.0","3.90.0","3.91.0","3.92.0","3.93.0","3.94.0","3.95.0","3.96.0","3.97.0","3.98.0"].includes(pkg.version));
    assert.equal(app.version,pkg.version);
    assert.equal(app.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));
    assert.equal(app.ios.bundleIdentifier,"com.busydoesit.app");
    assert.ok(runtime.includes(`const APP_VERSION = "${pkg.version.slice(0,-2)}";`));
  }],
  ["monthly calendar is the primary Work content", () => {
    assert.ok(page.includes("workMonthCells.map((cell)"));
    assert.ok(page.includes("onPress={() => setSelectedWorkDate(cell.iso)}"));
    assert.ok(page.includes("moveWorkMonth(-1)"));
    assert.ok(page.includes("moveWorkMonth(1)"));
    assert.ok(page.includes("resetWorkMonth"));
    assert.ok(page.includes("selectedWorkBookings.map"));
    assert.ok(page.includes("selectedWorkPlanned.map"));
    assert.ok(page.includes("No bookings saved for this day."));
    assert.ok(page.includes('label="View full calendar"'));
  }],
  ["only compact current information shown by default", () => {
    assert.ok(page.includes("const [showWorkDetails, setShowWorkDetails] = useState(false)"));
    assert.ok(page.includes("showWorkDetails ? ("));
    assert.ok(page.includes('label={showWorkDetails ? "Hide more work tools" : "More work tools and reports"}'));
    const detailsAt = page.indexOf("Detailed work report");
    assert.ok(page.indexOf('eyebrow="V3.29 • Work & Calendar 2.0"')>detailsAt);
    assert.ok(page.indexOf('eyebrow="Capacity & opportunity radar"')>detailsAt);
    assert.ok(page.indexOf('<Text style={styles.sectionLabel}>Need more work?</Text>')>detailsAt);
  }],
  ["bookings and urgent work reachable immediately", () => {
    assert.ok(page.includes("weekBookings.length"));
    assert.ok(page.includes("weeklyOperationalCount"));
    assert.ok(page.includes('s.go("dailyCommandCentre")'));
    assert.ok(page.includes("weeklyPlan[0].action"));
    assert.ok(page.includes("s.openSavedReplyAction(nextBooking.id)"));
  }],
  ["customer data and business tools routes retained", () => {
    for (const needle of ['s.go("workPipeline")','s.startNewEnquiry','s.openBusyInbox','s.go("workNow")','s.go("customerRecords")','s.go("bookings")','s.go("workCalendar")']) {
      assert.ok(page.includes(needle),needle);
    }
  }],
  ["no trade hard-coded into optional spare-capacity suggestion", () => {
    assert.ok(page.includes('title: "You may have room for more work"'));
    assert.ok(!page.includes('Next open half-day fits roughly'));
  }],
  ["compact Work tiles respect the dark design", () => {
    for(const style of ["workOverviewRow","workOverviewTile","workOverviewNumber","workOverviewLabel","workOverviewUpcoming","workOverviewHint","workOverviewLink"]) {
      assert.ok(styles.includes(style+":"),style);
    }
  }],
  ["no new automatic external side effects in Work navigation", () => {
    const shell = page.slice(page.indexOf("  return (\n    <Shell"));
    assert.ok(!shell.includes("supabase.functions.invoke("));
    assert.ok(!shell.includes("s.publish("));
    assert.ok(!shell.includes("fetch("));
  }]
];
for (const [name, check] of checks) {
  check();
  console.log("PASS",name);
}
console.log("V3.86 calendar-first Work checks passed:",checks.length);
