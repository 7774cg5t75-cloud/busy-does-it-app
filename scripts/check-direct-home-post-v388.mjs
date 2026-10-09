import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// V3.88 regression: the Create a post CTA is directly on Home, above Quick
// access, without bypassing the existing draft creator or publish approvals.
const read=(p)=>readFileSync(p,"utf8");
const home=read("src/screens/home.js");
const ctrl=read("src/app/AppController.js");
const social=read("src/screens/social.js");
const pkg=JSON.parse(read("package.json"));
const config=JSON.parse(read("app.json")).expo;
const runtime=read("src/core/runtime.js");
const start=home.indexOf("function HomeScreen({ s }) {");
const end=home.indexOf("\nfunction ProactiveWatch",start);
assert.ok(start>=0&&end>start);
const body=home.slice(start,end);
const check=[
  ["V3.88 version and iOS bundle",()=>{
    assert.equal(pkg.version,"3.88.0");
    assert.equal(config.version,pkg.version);
    assert.equal(config.ios.buildNumber,"8");
    assert.equal(config.ios.bundleIdentifier,"com.busydoesit.app");
    assert.ok(runtime.includes('const APP_VERSION = "3.88";'));
  }],
  ["Create a post is permanently visible below Talk to BUSY",()=>{
    const talk=body.indexOf('accessibilityLabel="Talk to BUSY"');
    const create=body.indexOf('accessibilityLabel="Create a new social media post"');
    const type=body.indexOf("Type to BUSY instead");
    const quick=body.indexOf("Quick access");
    const glance=body.indexOf("Your day at a glance");
    assert.ok(talk>0&&talk<create&&create<type&&type<quick&&quick<glance);
    assert.ok(body.includes('<Text style={homeDark.actionText}>+ Create a post</Text>'));
    assert.ok(body.includes('onPress={s.startSocialFromPhone}'));
    assert.ok(body.includes("styles.pressed"));
  }],
  ["Social Media remains available to manage drafts and schedules",()=>{
    assert.ok(body.includes("onPress={s.openSocialCentre}"));
    assert.ok(body.includes("Work & diary"));
    assert.ok(body.includes("Social Media</Text>"));
  }],
  ["Direct shortcut goes to existing safe creator not public publishing",()=>{
    assert.ok(ctrl.includes('const startSocialFromPhone = () => {\n    resetSocialCreator();\n    go("socialCreator");\n  };'));
    assert.ok(ctrl.includes("startSocialFromPhone,"));
    assert.ok(social.includes('label="+ Create a new post" primary onPress={s.startSocialFromPhone}'));
    assert.ok(!body.includes("s.approveSocialDraft("));
    assert.ok(!body.includes("s.confirmRetrySocialDraft("));
    assert.ok(!body.includes("s.scheduleSocialDraft("));
  }],
  ["Home action has accessible meaning and clear blue background",()=>{
    assert.ok(body.includes('accessibilityHint="Opens the post creator to choose photos and prepare a post"'));
    assert.ok(home.includes('actionButton: { marginTop: 13, minHeight: 48, borderRadius: 13, backgroundColor: "#3671E3"'));
  }],
];
for(const [name,run] of check){run();console.log("PASS",name);}
console.log("V3.88 one-tap post creation checks passed",check.length);
