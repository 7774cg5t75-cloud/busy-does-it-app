import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const src=read("src/screens/websiteBuilder.js");
const viewer=read("src/screens/hostedWebsitePreview.js");
const publishing=read("src/screens/websitePublishing.js");
const app=read("src/app/AppController.js");
const core=read("src/core/hostedPreviewSecurity.mjs");
const workflow=read(".github/workflows/production-check.yml");
const packageJson=JSON.parse(read("package.json"));
const expo=JSON.parse(read("app.json")).expo;
const websiteBuilder=src.slice(src.indexOf("function WebsiteBuilder"),src.indexOf("function WebsitePreview"));
const editor=src.slice(src.indexOf("function WebsitePreview"));
let count=0;
const includes=(v,k,message=k)=>{assert.ok(v.includes(k),message);count++;};
const excludes=(v,k,message=k)=>{assert.ok(!v.includes(k),message);count++;};
const ordered=(v,a,b)=>{assert.ok(v.indexOf(a)>=0&&v.indexOf(b)>v.indexOf(a),`${a} before ${b}`);count++;};

// The persistent immutable hosted version must have a direct reopen action on
// both the Website Builder and editable preview screens, including after back.
includes(websiteBuilder,'const hostedPreview = s.websitePublishingView?.previewDeployment || null;');
includes(websiteBuilder,'case "review":return hostedPreview?.id');
includes(websiteBuilder,'s.openHostedWebsitePreview(hostedPreview.id)');
includes(websiteBuilder,'View my hosted website again');
includes(websiteBuilder,'Preview my website draft');
includes(websiteBuilder,'hostedPreviewOutdated');
includes(websiteBuilder,'journey.nextAction !== "review"');
includes(editor,'const hosted = s.websitePublishingView?.previewDeployment || null;');
includes(editor,'const draftChangedSinceHosted = !!s.websitePublishingView?.draftChangedSinceHosted;');
includes(editor,'const openHosted = () => hosted?.id');
includes(editor,'s.openHostedWebsitePreview(hosted.id)');
includes(editor,'View your hosted website again');
includes(editor,'View hosted website again');
includes(editor,'Prepare private hosted preview');
includes(editor,'Your recent draft changes will only appear after you prepare an updated hosted preview.');
includes(editor,'Prepare preview with my latest changes');
includes(editor,'Previewing does not publish your website');
includes(editor,'Website Management & Go Live');
includes(editor,'onPress={s.openWebsitePublishing}');
includes(editor,'Edit my website');
includes(editor,'onPress={() => s.go("websiteBuilder")}');
excludes(editor,'Prepare / publish website',"No single misleading publish action");
excludes(editor,'Static website source is generated',"Hide source-code status from customer preview");
ordered(editor,'title="Website preview"','eyebrow="Your private preview"');
ordered(editor,'eyebrow="Your private preview"','eyebrow="Your design"');
ordered(editor,'eyebrow="Your private preview"','Website Management & Go Live');

// Return CTA must match the actual screen in navigation history.
includes(viewer,'const returnScreen = Array.isArray(s.history)');
includes(viewer,'returnScreen === "websitePreview"');
includes(viewer,'? "Back to my website draft"');
includes(viewer,': "Back to Website Management"');
includes(viewer,'label={backLabel}');
includes(viewer,'onPress={s.back}');

// Confirm the server-authorised, exact-deployment HTML read and separate Go Live
// review still protect repeatedly opened previews.
includes(app,'const result = await websitePublishingRequest("preview_url", { deploymentId });');
includes(app,'const html = await readPrivateHostedPreviewHtml(result.previewUrl, deploymentId);');
includes(app,'setWebsitePreviewOpenedId(deploymentId);');
includes(app,'go("hostedWebsitePreview");');
includes(core,'signedPreviewPath(');
includes(viewer,'javaScriptEnabled={false}');
includes(publishing,'onPress={() => s.confirmPublishHostedWebsite(preview.id)}');
includes(publishing,'reviewedHostedPreview!==preview.id');
includes(publishing,'disabled={openedHostedPreview!==preview.id||');
includes(workflow,'node scripts/check-repeat-hosted-preview-v397.mjs');
assert.ok(["3.97.0","3.98.0","3.99.0","3.100.0","3.101.0","3.102.0","3.103.0"].includes(packageJson.version));count++;
assert.equal(expo.version,packageJson.version);count++;
assert.equal(expo.ios.buildNumber,String(Number(packageJson.version.split(".")[1])-80));count++;
assert.equal(expo.android.versionCode,Number(packageJson.version.split(".")[1])-80);count++;
console.log("V3.97 PASS: "+count+" repeatable hosted preview navigation, clear publish separation and safety checks. No website published.");
