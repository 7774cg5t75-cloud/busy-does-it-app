import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// V3.84: static theme and safety regressions; native interaction still needs an iPhone test.
const read = (p) => readFileSync(p, "utf8");
const runtime = read("src/core/runtime.js");
const styles = read("src/theme/styles.js");
const ui = read("src/components/ui.js");
const controller = read("src/app/AppController.js");
const home = read("src/screens/home.js");
const pkg = JSON.parse(read("package.json"));
const app = JSON.parse(read("app.json")).expo;
const themeBlock = runtime.match(/const C = \{([\s\S]*?)\n\};/);
assert.ok(themeBlock, "shared palette must exist");
const palette = {};
for (const [,key,color] of themeBlock[1].matchAll(/^\s*(\w+):\s*"(#[\da-fA-F]{6})"/gm)) palette[key]=color;
const lum = (hex) => {
  const vals=hex.match(/[\da-fA-F]{2}/g).map(x=>parseInt(x,16)/255);
  const rgb=vals.map(x=>x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4));
  return 0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2];
};
const contrast = (a,b) => {
  const [hi,lo]=[lum(a),lum(b)].sort((x,y)=>y-x);
  return (hi+0.05)/(lo+0.05);
};
const checks = [
  ["version and iOS build number match", () => {
    assert.equal(pkg.version,"3.84.0"); assert.equal(app.version,pkg.version);
    assert.equal(app.ios.buildNumber,"4");
    assert.ok(runtime.includes('const APP_VERSION = "3.84";'));
  }],
  ["backgrounds are dark and visually layered", () => {
    assert.equal(palette.bg,"#0D131E"); assert.equal(palette.card,"#171F2D");
    assert.equal(palette.blueSoft,"#1A2A44");
    assert.ok(styles.includes("backgroundColor: C.card"));
  }],
  ["small text meets WCAG AA on dark cards", () => {
    for (const name of ["ink","muted","blueText","green","amber","red"]) {
      assert.ok(contrast(palette[name],palette.card)>=4.5,
        name+" contrast against card: "+contrast(palette[name],palette.card).toFixed(2));
    }
  }],
  ["primary action buttons stay legible", () => {
    assert.ok(contrast("#FFFFFF",palette.blue)>=4.5);
    assert.ok(styles.includes("buttonPrimary: { backgroundColor: C.blue"));
  }],
  ["all Shell-based product screens opt into dark", () => {
    assert.ok(ui.includes("dark = true, hideDevBadge = true"));
    assert.ok(ui.includes("function BottomNav({ s, dark = true })"));
    assert.ok(ui.includes("dark && styles.homeDarkShell"));
    assert.ok(ui.includes("dark && styles.homeDarkNav"));
  }],
  ["native safe area and account access use light status bar", () => {
    assert.ok(controller.includes('<StatusBar barStyle="light-content" />'));
    assert.ok(!controller.includes('barStyle="dark-content"'));
    assert.ok(controller.includes('<SafeAreaView style={styles.safe}>'));
  }],
  ["forms, calendars, and help cards share dark tokens", () => {
    for (const value of ["fieldBox","datePickerPanel","workCalendarDay","cardBlue","cardGreen","cardAmber","nav","toggleRow"]) {
      assert.ok(styles.includes(value+":"),value);
    }
    assert.ok(styles.includes("cardBlue: { borderColor:"));
    assert.ok(styles.includes("backgroundColor: C.blueSoft"));
    assert.ok(!styles.includes('backgroundColor: "#FFF8ED"'));
    assert.ok(!styles.includes('backgroundColor: "#F7F8FA"'));
  }],
  ["Home review badge cannot force horizontal overflow", () => {
    assert.ok(home.includes('maxWidth: "35%", textAlign: "right"'));
    assert.ok(home.includes("<Text style={homeDark.badge}>Review</Text>"));
    assert.ok(home.includes("const attentionCount = "));
  }],
  ["existing safety gates retained", () => {
    assert.ok(home.includes("Nothing is sent or published"));
    assert.ok(!home.includes('s.go("founderOperations")'));
    assert.ok(ui.includes("keyboardShouldPersistTaps"));
  }],
];
for (const [label,run] of checks) {run(); console.log("PASS",label);}
console.log("V3.84 unified dark theme checks passed:",checks.length);
