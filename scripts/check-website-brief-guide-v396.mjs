import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const controller=read("src/app/AppController.js");
const talk=read("src/screens/talk.js");
const builder=read("src/screens/websiteBuilder.js");
const ci=read(".github/workflows/production-check.yml");
let checks=0;
function has(text,pattern,message){assert.ok(text.includes(pattern),message || pattern);checks++;}
function order(text,a,b){const first=text.indexOf(a),second=text.indexOf(b);assert.ok(first>=0 && second>first,a+" must be before "+b);checks++;}
const from=talk.indexOf("  return (\n    <Shell");
const ui=talk.slice(from);
has(controller,'const [websiteConversationMode, setWebsiteConversationMode] = useState("");');
has(controller,'const openTalkToBusy = (startVoice = false, websiteMode = "") => {');
has(controller,'setWebsiteConversationMode(["build", "edit"].includes(websiteMode) ? websiteMode : "");');
has(controller,'setBusyVoiceStartNonce(startVoice ? Date.now() : 0);');
has(controller,'setWebsiteConversationMode("");'); // workspace reset
const build=controller.slice(controller.indexOf("  const askBusyToBuildWebsite"),controller.indexOf("  const websitePublishingRequest"));
has(build,'openTalkToBusy(false, "build");');
has(build,'openTalkToBusy(false, "edit");');
has(build,'setBusinessCreationConversationActive(false);');
assert.ok(!build.includes("openTalkToBusy(true)"),"Website guide needs to be read before recording");checks++;
has(builder,'s.askBusyToBuildWebsite');
has(builder,'s.askBusyToEditWebsite');
has(controller,'    websiteConversationMode,');
has(talk,'const [typedCommand, setTypedCommand] = useState("");');
has(ui,'title={s.websiteConversationMode === "build"');
has(ui,'What should I tell BUSY about my website?');
has(ui,'How do I explain the changes I want?');
has(ui,'Tell BUSY what your business offers');
for(const piece of ['who it helps','business offers','where you work','call, book or request a quote','colours, photos, logo, reviews','EXAMPLE:','gardening business in Exeter','Replace this with your real details','Let BUSY guide me step by step','Ask me one question at a time','Use my confirmed business details','don\'t invent any missing facts','Don\'t publish anything','setTypedCommand(','without sending anything']){
  has(ui,piece,"Website guidance: "+piece);
}
order(ui,'eyebrow="A little help before you start"','eyebrow="Voice"');
order(ui,'eyebrow="A little help before you start"','eyebrow="Or type"');
order(ui,'Let BUSY guide me step by step','value={typedCommand}');
has(ui,'s.businessCreationConversationActive && !s.websiteConversationMode');
has(ui,'s.websiteConversationMode ? "Describe your ideal website or the changes you\'d like…"');
const guide=ui.slice(ui.indexOf('eyebrow="A little help before you start"'),ui.indexOf('eyebrow="Voice"'));
assert.ok(!guide.includes("s.submitBusyCommand("),"Example must never submit or auto-build a site");checks++;
has(ci,"node scripts/check-website-brief-guide-v396.mjs");
const pkg=JSON.parse(read("package.json"));
const expo=JSON.parse(read("app.json")).expo;
assert.ok(["3.96.0","3.97.0","3.98.0","3.99.0","3.100.0","3.101.0","3.102.0","3.103.0","3.104.0","3.105.0"].includes(pkg.version));assert.equal(expo.version,pkg.version);
assert.equal(expo.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));assert.equal(expo.android.versionCode,Number(pkg.version.split(".")[1])-80);checks+=4;
console.log("V3.96 PASS:",checks,"website brief guide, realistic example, safe optional prompt and no auto-record tests.");
