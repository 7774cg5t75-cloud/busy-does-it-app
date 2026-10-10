import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(path,"utf8");
const home=read("src/screens/home.js");
const controller=read("src/app/AppController.js");
const social=read("src/screens/social.js");
const pkg=JSON.parse(read("package.json"));
const expo=JSON.parse(read("app.json")).expo;
const runtime=read("src/core/runtime.js");
const start=home.indexOf("function HomeScreen({ s }) {");
const end=home.indexOf("\nfunction ProactiveWatch(",start);
assert.ok(start>=0&&end>start,"Home component present");
const screen=home.slice(start,end);
const voice=screen.indexOf('accessibilityLabel="Talk to BUSY"');
const direct=screen.indexOf('accessibilityLabel="Create a new social media post"');
const fallback=screen.indexOf("onPress={() => s.openTalkToBusy(false)}",voice);
const quick=screen.indexOf("Quick access",fallback);
const daily=screen.indexOf("Your day at a glance",quick);
const tests=[
 ["App and native build versions match",()=>{
  assert.ok(["3.88.0","3.89.0","3.90.0","3.91.0","3.92.0","3.93.0","3.94.0","3.95.0","3.96.0","3.97.0","3.98.0","3.99.0"].includes(pkg.version));
  assert.equal(expo.version,pkg.version);
  assert.equal(expo.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));
  assert.equal(expo.ios.bundleIdentifier,"com.busydoesit.app");
  assert.ok(runtime.includes(`const APP_VERSION = "${pkg.version.slice(0,-2)}";`));
 }],
 ["Direct Create a post is visible next to the BUSY assistant before scrolling to summaries",()=>{
  assert.ok(voice>=0&&direct>voice&&fallback>direct&&quick>fallback&&daily>quick);
  const directMarkup=screen.slice(direct, fallback);
  assert.ok(directMarkup.includes("onPress={s.startSocialFromPhone}"));
  assert.ok(directMarkup.includes(">+ Create a post</Text>"));
  assert.ok(directMarkup.includes('accessibilityRole="button"'));
  assert.ok(directMarkup.includes("homeDark.actionButton"));
 }],
 ["Existing Social Media management shortcut remains",()=>{
  assert.ok(screen.includes("onPress={s.openSocialCentre}"));
  assert.ok(screen.includes(">Social Media</Text>"));
  assert.ok(screen.includes('s.jump("workHub", "Work")'));
 }],
 ["Direct shortcut resets and opens the existing social creator, without publishing",()=>{
  assert.ok(controller.includes("const startSocialFromPhone = () => {\n    resetSocialCreator();\n    go(\"socialCreator\");"));
  assert.ok(controller.includes("const openSocialCentre = () => {\n    go(\"socialMedia\");"));
  assert.ok(social.includes('label="+ Create a new post" primary onPress={s.startSocialFromPhone}'));
  const buttonArea=screen.slice(direct,fallback);
  for (const forbidden of ["s.approveSocialDraft","s.scheduleSocialDraft","s.confirmRetrySocialDraft","s.publish"]) {
    assert.ok(!buttonArea.includes(forbidden),forbidden);
  }
 }],
];
for (const [name,run] of tests){run();console.log("PASS",name);}
console.log("V3.88 direct Home post creation checks passed:",tests.length);
