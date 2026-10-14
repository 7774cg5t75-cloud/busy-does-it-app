/**
 * V3.221 offline Snack preview dependency test.
 * No Expo Snack publication, credentials, upload or network call.
 */
import assert from "node:assert/strict";
import {snackSourceFiles,validateSnackImports}
 from "./snack-source.mjs";
const files=snackSourceFiles();
assert.ok(Object.keys(files).length>150,"Expected non-trivial shared source graph");
assert.ok(files["supabase/functions/busy-mini-app-guest/requestReceiptProofV3213.js"],
 "The shared saved-request proof module must travel with the Snack preview.");
const consumer=files["src/core/customerJourneyEvidenceV3217.js"]?.contents||"";
assert.ok(consumer.includes(
 'from "../../supabase/functions/busy-mini-app-guest/requestReceiptProofV3213.js"'),
 "Snack must rewrite the pure V3.213 receipt import to its bundled JS file.");
const missing=validateSnackImports(files);
assert.deepEqual(missing,[],
 "Snack cannot be published with unresolved relative module paths.");
assert.ok(!Object.keys(files).some(x=>x.endsWith(".mjs")));
console.log("V3.221 Snack preview graph: "+Object.keys(files).length+
 " modules; zero unresolved relative imports; no preview published.");
