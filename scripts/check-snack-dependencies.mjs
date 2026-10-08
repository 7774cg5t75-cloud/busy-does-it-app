import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {snackSourceFiles,validateSnackImports,validateSnackPackages,prepareSource,toSnackPath,collectJsFiles} from "./snack-source.mjs";

const fromSrc=collectJsFiles("src");
const mjs=fromSrc.filter(x=>x.endsWith(".mjs"));
assert.ok(mjs.length>=15,"Expected the V3.60+ domain ESM modules to be present");
const files=snackSourceFiles();
assert.equal(Object.keys(files).length,fromSrc.length+1);
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
for(const name of ["react-native-qrcode-svg","react-native-svg"]){
  assert.ok(pkg.dependencies[name],"App must declare "+name);
  assert.ok(explicit[name]?.version,"Snack must explicitly package "+name);
  assert.ok(explicit[name].version.match(/^\d+\.\d+\.\d+$/),"Explicit version must be pinned "+name);
}
assert.ok(files["src/screens/miniApps.js"].contents.includes('from "react-native-qrcode-svg"'));
const missingPackages=validateSnackPackages(files,explicit);
assert.deepEqual(missingPackages,[],missingPackages.join("\n"));
assert.ok(publisher.includes("validateSnackPackages(files,snackDependencies)"),
  "Snack exporter must refuse undeclared external packages");
const qrOmitted={...explicit};
delete qrOmitted["react-native-qrcode-svg"];
assert.ok(validateSnackPackages(files,qrOmitted).some(x=>x.includes("react-native-qrcode-svg")),
  "Previously failing QR dependency must be caught by CI");
const brokenDependency={...files,"src/screens/testMissingPackage.js":{
  type:"CODE",contents:'import Test from "missing-package"; export default Test;',
}};
assert.ok(validateSnackPackages(brokenDependency,explicit).some(x=>x.includes("missing-package")));
console.log("PASS Snack external packages: explicit QR and SVG dependencies, "+
  "all bare imports covered, missing-package regression caught");

console.log("PASS Snack source graph: "+Object.keys(files).length+
  " modules, including "+mjs.length+" converted .mjs modules, no unresolved relative imports");
