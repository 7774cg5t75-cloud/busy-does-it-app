import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  designForWebsite,designCss,withWhiteContrast
} from "../supabase/functions/busy-website-worker/designSystem.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
let checked=0;
const yes=(x,msg)=>{assert.ok(x,msg);checked++;};
const equal=(x,y,msg)=>{assert.equal(x,y,msg);checked++;};

for(const [business,expected] of [
  ["landscaping","nature"],["gardening","nature"],["hog roast catering","hospitality"],
  ["hair salon","wellness"],["financial consultant","professional"],
  ["driveway cleaning","trades"],["local business","neutral"]
])equal(designForWebsite({businessType:business}).sector,expected,"Business-aware palette "+business);
const unsupported=designForWebsite({businessType:"Mystery business",theme:{mood:"comic-sans"}});
equal(unsupported.mood,"clean","unsupported mood normalised");
const bright=designForWebsite({businessType:"roof cleaning",theme:{primary:"#FFF000"}});
yes(/^#[0-9A-F]{6}$/i.test(bright.accent),"customer palette sanitised");
yes(bright.accent!=="#FFF000","bright customer colours corrected for button contrast");
yes(withWhiteContrast("#fff").length===7,"shorthand white supported");
const injection=designForWebsite({theme:{primary:"#ff0000}body{display:none",secondary:"url(javascript:evil)",mood:"premium}body{"}});
yes(!JSON.stringify(injection).includes("javascript:"),"reject CSS payload");
equal(injection.mood,"clean","reject malformed mood");
const css=designCss(designForWebsite({businessType:"gardening",theme:{mood:"premium"}}));
for(const marker of [
  ":root{--ink:","--accent:","--content:1120px","@media(max-width:800px)",
  "@media(max-width:380px)","@media(prefers-reduced-motion:reduce)",
  ".hero-with-image",".hero-no-image",".hero-art",".hero .lead",
  ".cta",":focus-visible",".skip-link",".site-footer",".grid",
  ".mood-premium h1",".wrap{width:min(100% - 48px",
])yes(css.includes(marker),"Professional responsive CSS: "+marker);
yes(!css.includes("javascript:"),"CSS does not embed external scripts");
const worker=read("supabase/functions/busy-website-worker/index.ts");
const local=read("src/domain/websiteBuilder.js");
const preview=read("src/screens/websiteBuilder.js");
const publish=read("src/screens/websitePublishing.js");
const hosted=read("src/screens/hostedWebsitePreview.js");
const fullApp=read("src/app/AppController.js");
for(const item of [
  'import {designForWebsite, designCss} from "./designSystem.mjs";',
  'const design = designForWebsite({businessType:draft?.businessType,theme});',
  'const layoutCss = designCss(design);',
  'class="hero hero-',
  'hero-with-image":"hero-no-image',
  'class="hero-art" aria-hidden="true"',
  'class="hero-image" loading="eager"',
  '<main id="main">',
  'class="skip-link" href="#main"',
  '<footer class="site-footer">',
  'name="busy-deployment"',
  'name="busy-page"',
  'formMarkup',
  'renderOptInContactForm(',
  '.filter((section: any) => {',
  'if(section.type==="gallery")',
])yes(worker.includes(item),"Worker professionally renders saved website without invented media: "+item);
for(const item of [
  'import { designForWebsite, designCss }',
  'const design = designForWebsite({businessType:draft.businessType,theme:draft.theme});',
  'const layoutCss = designCss(design);',
  '<main id="main">',
  'hero-with-image":"hero-no-image',
  'sourceVersion: "Business Creation Intelligence V3.56"',
])yes(local.includes(item),"Concept and public site use same design system: "+item);
for(const item of [
  'import { WebView } from "react-native-webview";',
  'const liveConceptHtml = draft ? renderWebsiteHtml(draft) : "";',
  'source={{ html: liveConceptHtml, baseUrl: "about:blank" }}',
  'javaScriptEnabled={false}',
  'domStorageEnabled={false}',
  'allowUniversalAccessFromFileURLs={false}',
  'href==="about:blank"||href.startsWith("about:blank#")',
  'Previewing does not publish your website',
  'Website Management & Go Live',
])yes(preview.includes(item),"Editable preview shows actual design safely: "+item);
yes(!preview.includes('Static website source is generated'),"No source-code presentation to customers");
yes(hosted.includes('javaScriptEnabled={false}'),"signed immutable preview remains sandboxed");
yes(publish.includes('reviewedHostedPreview!==preview.id'),"customer Go Live still needs explicit approval");
yes(fullApp.includes('readPrivateHostedPreviewHtml(result.previewUrl, deploymentId)'),"signed hosted preview still used");
const pkg=JSON.parse(read("package.json")),app=JSON.parse(read("app.json")).expo;
yes(["3.99.0","3.100.0"].includes(pkg.version),"Release version supported");
equal(app.version,pkg.version,"App matches release");
equal(app.ios.buildNumber,String(Number(pkg.version.split(".")[1])-80),"iOS build identity");
equal(app.android.versionCode,Number(pkg.version.split(".")[1])-80),"Android version");
yes(read(".github/workflows/production-check.yml").includes("check-professional-websites-v399.mjs"),"CI covers professional design");
console.log("V3.99 PASS: "+checked+" design quality, truthful fallbacks, mobile, preview and publishing checks.");
