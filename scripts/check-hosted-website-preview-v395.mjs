import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  signedPreviewPath,
  previewPagesFromManifest,
  resolveHostedPreviewPage,
  validHostedHtml
} from "../src/core/hostedPreviewSecurity.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const origin="https://project-id.supabase.co";
const id="33333333-3333-4333-8333-333333333333";
const foreign="44444444-4444-4444-8444-444444444444";
const stem=origin+"/storage/v1/object/sign/busy-website-preview/biz/site/deployments/"+id+"/";
const home=stem+"index.html?token=private-home-token";
const services=stem+"services/index.html?token=private-services-token";
let assertions=0;
const ok=(actual,reason)=>{assert.ok(actual,reason);assertions++;};
const no=(actual,reason)=>{assert.equal(actual,"",reason);assertions++;};
ok(signedPreviewPath(home,origin,id).endsWith("/index.html"),"valid signed HTML");
no(signedPreviewPath(home.replace("https:","http:"),origin,id),"no HTTP");
no(signedPreviewPath(home.replace("project-id.supabase.co","attacker.example"),origin,id),"no external origin");
no(signedPreviewPath(home.replace("project-id.supabase.co","project-id.supabase.co.attacker.example"),origin,id),"no lookalike host");
no(signedPreviewPath(home.replace("busy-website-preview","busy-website-public"),origin,id),"private bucket only");
no(signedPreviewPath(home.replace(id,foreign),origin,id),"no cross-deployment link");
no(signedPreviewPath(home.split("?")[0],origin,id),"must be signed");
no(signedPreviewPath(home.replace("index.html","index.js"),origin,id),"only HTML");
no(signedPreviewPath(home.replace("index.html","../index.html"),origin,id),"no traversal");
no(signedPreviewPath(home+"#fragment",origin,id),"no forged hash");
no(signedPreviewPath("javascript:alert(1)",origin,id),"no script URI");
const pages=previewPagesFromManifest({pages:[
  {id:"home",previewUrl:home},
  {id:"services",previewUrl:services},
  {id:"external",previewUrl:"https://attacker.example/a.html?token=evil"},
  {id:"other-site",previewUrl:stem.replace(id,foreign)+"index.html?token=evil"},
]},origin,id);
assert.deepEqual(pages.map(p=>p.id),["home","services"]);assertions++;
assert.equal(resolveHostedPreviewPage("/",pages,origin,id)?.id,"home");assertions++;
assert.equal(resolveHostedPreviewPage(services,pages,origin,id)?.id,"services");assertions++;
assert.equal(resolveHostedPreviewPage(services.replace("private-services-token","older-page-token"),pages,origin,id)?.url,services);assertions++;
assert.equal(resolveHostedPreviewPage("https://attacker.example/foo",pages,origin,id),null);assertions++;
assert.equal(resolveHostedPreviewPage(stem+"unexpected.html?token=valid",pages,origin,id),null);assertions++;
assert.equal(resolveHostedPreviewPage("mailto:test@example.com",pages,origin,id),null);assertions++;
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="busy-deployment" content="'+id+'"></head><body><h1>My website</h1></body></html>';
ok(validHostedHtml(html,id),"hosted HTML expected deployment");
assert.equal(validHostedHtml(html,foreign),false);assertions++;
assert.equal(validHostedHtml("Just some HTML text",id),false);assertions++;
assert.equal(validHostedHtml(JSON.stringify({html}),id),false);assertions++;
assert.equal(validHostedHtml(html+" ".repeat(2_000_001),id),false);assertions++;
const app=read("src/app/AppController.js");
const viewer=read("src/screens/hostedWebsitePreview.js");
const publishing=read("src/screens/websitePublishing.js");
const routes=read("src/screens/index.js");
const pkg=JSON.parse(read("package.json"));
const config=JSON.parse(read("app.json")).expo;
for(const piece of [
  'const html = await response.text();',
  'validHostedHtml(html, deploymentId)',
  'readPrivateHostedPreviewHtml(result.previewUrl, deploymentId)',
  'go("hostedWebsitePreview")',
  'setWebsitePreviewOpenedId(deploymentId)',
  'setHostedWebsitePreview(null);',
  'resolveHostedPreviewPage('
])ok(app.includes(piece),"App preview security / flow: "+piece);
const openSection=app.slice(app.indexOf("  const openHostedWebsitePreview = async"),app.indexOf("  const openHostedWebsitePreviewPage = async"));
assert.ok(!openSection.includes("Linking.openURL"),"HTML preview must never open Safari");assertions++;
for(const piece of [
  'import { WebView } from "react-native-webview";',
  'source={{ html: preview.html, baseUrl: "about:blank" }}',
  'javaScriptEnabled={false}',
  'domStorageEnabled={false}',
  'incognito',
  'mixedContentMode="never"',
  'allowFileAccess={false}',
  'onShouldStartLoadWithRequest',
  's.openHostedWebsitePreviewPage(href)'
])ok(viewer.includes(piece),"Sandboxed viewer: "+piece);
ok(publishing.includes('s.websitePreviewOpenedId===preview?.id'),"Review opener survives viewer navigation");
ok(publishing.includes("reviewedHostedPreview!==preview.id"),"Explicit approval remains gated");
ok(routes.includes("hostedWebsitePreview: HostedWebsitePreview"),"native route exists");
assert.equal(pkg.dependencies["react-native-webview"],"13.16.1");assertions++;
assert.ok(["3.95.0","3.96.0","3.97.0","3.98.0","3.99.0","3.100.0","3.101.0","3.102.0"].includes(pkg.version));assertions++;
assert.equal(config.version,pkg.version);assertions++;
assert.equal(config.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80));assertions++;
ok(read(".github/workflows/production-check.yml").includes("check-hosted-website-preview-v395.mjs"),"CI wired");
console.log("V3.95 PASS: "+assertions+" private hosted preview and safety checks. No public website deployed.");
