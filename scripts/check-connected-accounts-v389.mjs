import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");
const code=read("src/screens/settings.js");
const page=code.slice(code.indexOf("function ConnectedAccounts({ s }) {"),code.indexOf("\nfunction Advanced({ s }) {"));
const pkg=JSON.parse(read("package.json")),app=JSON.parse(read("app.json")).expo;
const checks=[
["version",()=>{assert.ok(["3.89.0","3.90.0","3.91.0","3.92.0","3.93.0","3.94.0","3.95.0","3.96.0","3.97.0","3.98.0","3.99.0","3.100.0","3.101.0","3.102.0","3.103.0"].includes(pkg.version));assert.equal(app.version,pkg.version);assert.equal(app.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));}],
["visible account cards",()=>{assert.ok(page.includes('label: "Facebook & Instagram"'));assert.ok(page.includes('label: "Google Business"'));}],
["extra details closed initially",()=>{for(const t of ["showOtherConnections","showConnectionDiagnostics","expandedProviders"])assert.ok(page.includes(t));assert.ok(page.includes("useState(false)"));}],
["honest demo labels",()=>{assert.ok(page.includes("Demo only — not connected"));assert.ok(page.includes("Try demo"));}],
["existing routes remain",()=>{for(const t of ["s.beginSocialProviderConnect","s.disconnectSocialProvider","s.selectSocialProviderAsset","s.verifySocialProvider","s.confirmLivePublishingChange","s.signInOwner","s.signOutOwner"])assert.ok(page.includes(t),t);}],
["real status",()=>{assert.ok(page.includes("publish.connections?.meta"));assert.ok(page.includes("publish.connections?.google_business"));}]
];
for(const [name,test] of checks){test();console.log("PASS",name)}
