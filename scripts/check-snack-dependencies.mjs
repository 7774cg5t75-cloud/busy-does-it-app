import assert from "node:assert/strict";
import {snackSourceFiles,validateSnackImports,prepareSource,toSnackPath,collectJsFiles} from "./snack-source.mjs";

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
console.log("PASS Snack source graph: "+Object.keys(files).length+
  " modules, including "+mjs.length+" converted .mjs modules, no unresolved relative imports");
