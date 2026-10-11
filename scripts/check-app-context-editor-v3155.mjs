import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {interpretSelectedAppAppearance} from "../src/core/appContextInstruction.mjs";
import {previewPrivateAppAppearance} from "../src/core/appAppearanceEditing.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const original={modules:[{key:"business_profile",enabled:true},
 {key:"booking_request",enabled:true}],
 publicProfile:{businessName:"Local Hairdresser",about:"Owner-supplied business words"},
 presentation:{headerStyle:"refined",layoutDensity:"comfortable",navigationStyle:"tabs"},
 paymentEnabled:false};
const old=JSON.stringify(original);
for(const [part,instruction,field,value] of [
 ["header","Make this header BOLD","headerStyle","bold"],
 ["header","Keep the title subtle please","headerStyle","quiet"],
 ["spacing","Give this layout more space","layoutDensity","airy"],
 ["spacing","Make the gaps compact","layoutDensity","compact"],
 ["navigation","I want a vertical list","navigationStyle","list"],
 ["navigation","Use tabs for navigation","navigationStyle","tabs"]
]){
 const candidate=interpretSelectedAppAppearance(original,{selected:part,text:instruction});
 if(candidate.ok){assert.equal(candidate.field,field);assert.equal(candidate.value,value);
  assert.equal(candidate.requiresPreview,true);assert.equal(candidate.noLiveChanges,true);
  assert.equal(candidate.nextConfig.publicProfile.about,"Owner-supplied business words");}
 else if(part==="navigation"&&value==="tabs")assert.ok(/already/.test(candidate.reason));
 else throw Error("Unexpected unsupported phrase "+part+" "+instruction+" "+candidate.reason);
}
for(const bad of [
 {selected:"header",text:"Confirm all bookings"},
 {selected:"header",text:"Charge customers"},
 {selected:"header",text:"Publish app now"},
 {selected:"header",text:"execute <script>"},
 {selected:"services",text:"change prices"},
 {selected:"spacing",text:"set arbitrary padding to 900"},
 {selected:"navigation",text:"delete all customer records"}
])assert.equal(interpretSelectedAppAppearance(original,bad).ok,false);
assert.equal(JSON.stringify(original),old,"Instructions cannot mutate current draft");
assert.ok(previewPrivateAppAppearance(original,{field:"headerStyle",value:"bold"}).ok);
const ui=read("src/screens/miniApps.js");
const marketplace=ui.slice(ui.indexOf("function BusyAppsMarketplace({ s })"),
 ui.indexOf("function MiniAppBuilder({ s })"));
const builder=ui.slice(ui.indexOf("function MiniAppBuilder({ s })"),
 ui.indexOf("function MiniAppPreview({ s })"));
assert.ok(!marketplace.includes("pendingAppearance"),"No builder-only variables in marketplace");
assert.ok(!marketplace.includes("setAppearancePreviewOpen"));
for(const expected of [
 "const [pendingAppearance,setPendingAppearance]",
 "const [selectedAppPart,setSelectedAppPart]",
 'interpretSelectedAppAppearance(view.draftConfig,',
 'setAppearancePreviewOpen(true)',
 'Keep this appearance in my PRIVATE app',
 'Preview my described app change',
 'savePrivateAppAppearance?.({'
])assert.ok(builder.includes(expected),"Builder-only UI "+expected);
assert.ok(builder.includes("App-specific microphone"));
assert.ok(builder.includes("Nothing is saved yet."));
const backend=read("supabase/functions/busy-mini-apps/index.ts");
assert.ok(backend.includes('if (action === "set_appearance")'));
assert.ok(backend.includes('.eq("draft_revision",expected).select("*").maybeSingle()'));
console.log("V3.155 CONTEXT EDITOR PASS: marketplace safe, typed selected-element instructions and one protected private revision.");
