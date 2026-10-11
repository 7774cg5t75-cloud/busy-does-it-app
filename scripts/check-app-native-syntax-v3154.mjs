import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
for(const [path,plugins] of [
 ["standalone/template/App.js",["jsx"]],
 ["standalone/template/app.config.js",[]],
 ["src/screens/miniApps.js",["jsx"]],
 ["src/app/AppController.js",["jsx"]],
 ["supabase/functions/busy-mini-apps/index.ts",["typescript"]],
 ["supabase/functions/busy-command/index.ts",["typescript"]],
 ["src/screens/websiteSelectedVoice.js",["jsx"]]
]){
 const ast=parse(read(path),{sourceType:"unambiguous",plugins});
 assert.ok(ast.program.body.length>0,path);
}
console.log("V3.154 PARSER PASS: native Expo shell, App Builder, controller and Deno endpoint parse without syntax errors.");
