import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
for(const path of [
 "supabase/functions/busy-website-design-review/index.ts",
 "supabase/functions/busy-command/index.ts",
 "cloudflare/busy-website-screenshot/worker.js"
]){
 const source=read(path);
 const ast=parse(source,{sourceType:"module",plugins:path.endsWith(".ts")?["typescript"]:[]});
 assert.ok(ast.program.body.length>0,path+" must be parsable");
}
const server=read("supabase/functions/busy-website-design-review/index.ts");
assert.ok(server.includes('action==="studio"'));
assert.ok(server.includes('autonomousEnabled'));
assert.ok(server.includes('studioDeadline=Date.now()+120000'));
assert.ok(server.includes('if(stagedPaths.length)'));
assert.ok(server.includes('await bucket.remove(stagedPaths)'));
console.log("V3.151 EDGE SYNTAX PASS: gated Deno functions and Cloudflare renderer parse, privacy and cleanup controls remain present.");
