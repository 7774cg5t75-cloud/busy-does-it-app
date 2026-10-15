import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {snackSourceFiles,validateSnackImports,validateSnackPackages,prepareSource,toSnackPath,collectJsFiles} from "./snack-source.mjs";

const fromSrc=collectJsFiles("src");
const mjs=fromSrc.filter(x=>x.endsWith(".mjs"));
assert.ok(mjs.length>=15,"Expected the V3.60+ domain ESM modules to be present");
const files=snackSourceFiles();
assert.ok(files["standalone/template/nativeCustomerActions.js"],"Shared customer validation must be included");
assert.ok(files["standalone/template/nativePreferredDates.js"],"Shared preferred-date helper must be included");
assert.equal(Object.keys(files).length,fromSrc.length+13,
 "Snack must include the entry point, ten shared worker modules and two shared customer helpers.");
assert.ok(files["supabase/functions/busy-mini-app-guest/requestReceiptProofV3213.js"],
 "Do not omit source-scoped saved-request receipt validation from Snack.");
assert.ok(files["supabase/functions/busy-website-worker/visualCriticContract.js"],"Design-only AI guard must be in native and Snack sources");
assert.ok(files["supabase/functions/busy-website-worker/designEdits.js"],"Safe website editing module is packaged");
assert.ok(files["supabase/functions/busy-website-worker/websiteStructuredEditing.js"],"Customer direct-field editing module is packaged for Expo Snack and native");
assert.ok(files["supabase/functions/busy-website-worker/websiteLayoutEditing.js"],"Private section and appearance edits are included in Snack");
assert.ok(files["supabase/functions/busy-website-worker/websitePageEditing.js"],"Owner page editor must be included with Snack preview");
assert.ok(files["supabase/functions/busy-website-worker/designReview.js"],"Reviewer must be packaged");
assert.ok(files["supabase/functions/busy-website-worker/designPlanner.js"],"Design planner available in the packaged app");
assert.ok(files["supabase/functions/busy-website-worker/designSystem.js"],"Shared design CSS must travel into the Snack preview too");
assert.ok(files["App.js"]);
for(const name of mjs){
  const target=toSnackPath(name);
  assert.ok(files[target],target+" missing from Snack bundle");
  assert.ok(target.endsWith(".js")&&!target.endsWith(".mjs"),target);
}
assert.ok(files["src/domain/conversationUnderstanding.js"],
  "The module that crashed Expo Go must be packaged");
assert.ok(files["src/domain/conversationAiBoundary.js"]);
assert.ok(files["src/domain/verifiedBusinessActivityCloud.js"]);
assert.ok(files["src/domain/selfRunningOperations.js"]);
assert.ok(files["src/domain/growthProjectCloud.js"]);
assert.ok(files["src/domain/readOnlyStatusRecovery.js"]);

const app=files["src/app/AppController.js"].contents;
assert.ok(app.includes('from "../domain/conversationUnderstanding.js"'));
assert.ok(app.includes('from "../domain/conversationCloud.js"'));
assert.ok(app.includes('from "../domain/growthProjectCloud.js"'));
assert.ok(app.includes('from "../domain/verifiedBusinessActivityCloud.js"'));
assert.ok(!app.includes('from "../domain/conversationUnderstanding.mjs"'));
assert.ok(!app.includes("conversationUnderstanding.mjs.js"));

const sample=prepareSource('import {a} from "../domain/foo.mjs";\nexport {b} from "./bar.mjs";\nimport * as Calendar from "expo-calendar/legacy";',
  {aiUrl:"",aiToken:""});
assert.ok(sample.includes('from "../domain/foo.js"'));
assert.ok(sample.includes('from "./bar.js"'));
assert.ok(sample.includes('from "expo-calendar";'));
const all=validateSnackImports(files);
assert.deepEqual(all,[],all.join("\n"));

const omitted={...files};
delete omitted["src/domain/conversationUnderstanding.js"];
const missing=validateSnackImports(omitted);
assert.ok(missing.some(s=>s.includes("conversationUnderstanding")),
  "Incomplete bundle should fail before Snack can publish");

const broken={...files,"src/domain/testMissing.js":{type:"CODE",
  contents:'import {ghost} from "./ghost.mjs";\nexport const x=ghost;'}};
assert.ok(validateSnackImports(broken).some(s=>s.includes("ghost.mjs")),
  "Unexpected .mjs-only reference should not silently resolve");

const publisher=readFileSync(new URL("./publish-snack.mjs",import.meta.url),"utf8");
const explicit=Object.fromEntries([...publisher.matchAll(/"([^"]+)":\{version:"([^"]+)"\}/g)]
  .map(match=>[match[1],{version:match[2]}]));
const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
// Native release continues to depend on actual QR + SVG, but Expo Go SDK54
// must NOT eagerly evaluate those native packages (PlatformConstants crash).
for(const name of ["react-native-qrcode-svg","react-native-svg"]){
  assert.ok(pkg.dependencies[name],"Production must keep "+name);
  assert.equal(explicit[name],undefined,"Expo Go must not install "+name);
}
const miniApp=files["src/screens/miniApps.js"].contents;
assert.ok(miniApp.includes('from "../components/snackQrFallback"'));
assert.ok(!miniApp.includes('from "react-native-qrcode-svg"'));
assert.ok(files["src/components/snackQrFallback.js"]);
assert.ok(files["src/components/snackScreenCapture.js"]);
assert.ok(miniApp.includes('from "../components/snackScreenCapture"'));
assert.ok(!miniApp.includes('from "react-native-view-shot"'));
assert.ok(files["src/components/snackScreenCapture.js"].contents.includes("requires a development build"));
assert.ok(miniApp.includes('from "../components/snackScreenCapture"'));
const appCaptureExample=prepareSource('import {captureRef} from "react-native-view-shot";');
assert.ok(appCaptureExample.includes('from "../components/snackScreenCapture"'));
const captureExample=prepareSource('import {captureScreen} from "react-native-view-shot";',
  {aiUrl:"",aiToken:""});
assert.ok(captureExample.includes('from "../components/snackScreenCapture"'));
assert.ok(files["src/components/snackQrFallback.js"].contents.includes("Open share link"));
assert.ok(!files["src/components/snackQrFallback.js"].contents.includes("react-native-svg"));
const importSample=prepareSource(
  'import QRCode from "react-native-qrcode-svg";',
  {aiUrl:"",aiToken:""}
);
assert.ok(importSample.includes('from "../components/snackQrFallback"'));
const missingPackages=validateSnackPackages(files,explicit);
assert.deepEqual(missingPackages,[],missingPackages.join("\n"));
assert.ok(publisher.includes("validateSnackPackages(files,snackDependencies)"),
  "Snack exporter must refuse undeclared external packages");
const crashAgain={...files,"src/screens/regression.js":{
  type:"CODE",contents:'import QRCode from "react-native-qrcode-svg";',
}};
assert.ok(validateSnackPackages(crashAgain,explicit).some(s=>s.includes("react-native-qrcode-svg")),
  "Reintroduction of native SVG-based QR to Snack must fail CI");
const svgAgain={...files,"src/screens/svgRegression.js":{
  type:"CODE",contents:'import Svg from "react-native-svg";',
}};
assert.ok(validateSnackPackages(svgAgain,explicit).some(s=>s.includes("react-native-svg")),
  "Direct react-native-svg import in Snack must fail CI");
const brokenDependency={...files,"src/screens/testMissingPackage.js":{
  type:"CODE",contents:'import Test from "missing-package"; export default Test;',
}};
assert.ok(validateSnackPackages(brokenDependency,explicit).some(x=>x.includes("missing-package")));
console.log("PASS Snack packages: unsafe native SVG/QR omitted from Expo Go, "+
  "QR share link fallback active, all package imports covered");

console.log("PASS Snack source graph: "+Object.keys(files).length+
  " modules, including "+mjs.length+" converted .mjs modules, no unresolved relative imports");
